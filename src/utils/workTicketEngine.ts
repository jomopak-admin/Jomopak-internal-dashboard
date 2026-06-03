/**
 * Work-ticket cost engine.
 *
 * The Jomopak factory currently produces work-tickets by hand — pulling
 * paper rates off a printed sheet, plate costs from memory, and finishing
 * rates from the foreman's head. This engine turns that into structured
 * computation: given a small set of inputs (size, qty, colours, paper,
 * machine choices) plus the master tables, it returns a fully materialised
 * cost breakdown matching the printed work-ticket layout.
 *
 * Design goals:
 *  - PURE function. No DB access, no React state, no side effects. The
 *    whole thing is unit-testable.
 *  - CONSERVATIVE. When a master is missing or a rate isn't selected, the
 *    relevant line is zero rather than throwing. The work-ticket UI uses
 *    the `warnings` array to surface the gaps to the quoter.
 *  - DETERMINISTIC. Given the same inputs the engine always returns the
 *    same numbers, so two quoters producing the same job should land on
 *    the same number to the cent.
 *
 * Cost categories match the printed ticket:
 *   PRE-PRESS    plate cost × colours + origination
 *   PAPER        sheets × sheet area × gsm → kg → cost
 *   INK          per-colour: coverage × area × kg/m² → kg → cost
 *   PRESS        machine-hours × hourly rate
 *   GUILLOTINE   machine-hours × hourly rate (separate machine)
 *   FINISHING    sum of finishing operations (per-1000 or per-hour)
 *   DESPATCH     packing + delivery (free-form per ticket)
 */

import {
  Client,
  CostProfile,
  FinishingOperation,
  InkRate,
  Machine,
  PaperRate,
  PlateCost,
  PressRate,
  PricingTier,
  WorkTicketFinishingLine,
  WorkTicketInkLine,
  WorkTicketMachineLine,
} from '../types';

export interface WorkTicketEngineInputs {
  /** Run quantity (units / bags / boxes — whatever the job is). */
  quantity: number;
  /** Total sheets running through the press, including make-ready. If the
   *  user hasn't typed a value we estimate it as `quantity` (1 sheet per
   *  unit) plus the press make-ready allowance. */
  sheets: number;
  /** Sheet area in square metres. We accept the area pre-computed because
   *  the sheet-size string ("640 × 920") is messy to parse here. The form
   *  resolves it once on the way in. */
  sheetAreaSqm: number;
  /** Number of printed colours — drives ink lines + plate count. */
  colors: number;
  paperRateId: string;
  plateCostId: string;
  pressRateId: string;
  /** Optional second machine line for the cutting/guillotine pass. */
  guillotineRateId: string;
  /** Editable ink picks; engine fills in `cost` + `estimatedKg`. */
  inkLines: WorkTicketInkLine[];
  /** Editable finishing operations; engine fills in `cost` unless `override`. */
  finishingLines: WorkTicketFinishingLine[];
  /** Margin override (percent). Falls back to client tier / 0. */
  marginPercentOverride: number | null;
  clientId: string;
  /** Free-typed despatch line — packing + delivery + courier — currency. */
  despatchCost: number;
}

export interface WorkTicketEngineMasters {
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  inkRates: InkRate[];
  finishingOperations: FinishingOperation[];
  pressRates: PressRate[];
  plateCosts: PlateCost[];
  pricingTiers: PricingTier[];
  clients: Client[];
  machines: Machine[];
}

export interface WorkTicketBreakdown {
  paperKg: number;
  paperCost: number;
  prePressCost: number;
  inkLines: WorkTicketInkLine[];
  inkSubtotal: number;
  pressLines: WorkTicketMachineLine[];
  pressSubtotal: number;
  guillotineLines: WorkTicketMachineLine[];
  guillotineSubtotal: number;
  finishingLines: WorkTicketFinishingLine[];
  finishingSubtotal: number;
  despatchCost: number;
  totalCost: number;
  unitCost: number;
  marginPercentApplied: number;
  sellingPricePerUnit: number;
  sellingPriceTotal: number;
  /** Human-readable warnings: missing masters, suspicious zero values, etc.
   *  Surface these next to the breakdown so the quoter can fix them. */
  warnings: string[];
  /** Resolved, denormalised labels for printing on the ticket. */
  paperRateName: string;
  paperType: string;
  paperGsm: string;
  plateCostName: string;
  pressMachineName: string;
  guillotineMachineName: string;
}

/* ----- helpers ----- */

const ID = (n: number) => `engine-${n}-${Math.random().toString(36).slice(2, 8)}`;

function safeNum(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* ----- engine ----- */

export function computeWorkTicket(
  inputs: WorkTicketEngineInputs,
  masters: WorkTicketEngineMasters,
): WorkTicketBreakdown {
  const warnings: string[] = [];
  const quantity = Math.max(0, safeNum(inputs.quantity));
  const colors = Math.max(0, safeNum(inputs.colors));

  const paperRate = masters.paperRates.find((r) => r.id === inputs.paperRateId);
  const plate = masters.plateCosts.find((p) => p.id === inputs.plateCostId);
  const press = masters.pressRates.find((p) => p.id === inputs.pressRateId);
  const guillotine = masters.pressRates.find((p) => p.id === inputs.guillotineRateId);
  const client = masters.clients.find((c) => c.id === inputs.clientId);
  const tier = masters.pricingTiers.find((t) => t.id === client?.pricingTierId);

  // Paper: estimate sheets if blank, then sheet area × gsm × sheets → kg.
  const inferredMakeReady = press?.makeReadySheets ?? 0;
  const sheets = inputs.sheets > 0 ? inputs.sheets : quantity + inferredMakeReady;
  const sheetArea = Math.max(0, safeNum(inputs.sheetAreaSqm));
  const gsm = safeNum(paperRate?.gsm);
  if (!paperRate) warnings.push('No paper rate selected — paper cost is zero.');
  if (sheetArea === 0) warnings.push('Sheet area is zero — paper & ink calc will be zero.');
  const paperKg = sheetArea * (gsm / 1000) * sheets;
  // Phase 126.1 — Use chargePerTon (quote rate) when set; fall back to
  // pricePerTon (legacy / supplier cost) so historic tickets keep matching.
  const paperRateForTicket = paperRate ? (paperRate.chargePerTon ?? paperRate.pricePerTon) : 0;
  const paperCost = paperRate ? paperKg * (paperRateForTicket / 1000) : 0;

  // Pre-press: plate per colour + origination once.
  if (!plate) warnings.push('No plate cost selected — pre-press is zero.');
  const prePressCost = plate ? plate.costPerColor * colors + plate.originationCost : 0;

  // Ink: per-line `coveragePercent` × printed area × kg/m² → kg → currency.
  // The "printed area" for a single colour is sheet area × sheets. Coverage
  // % then scales how much of that area this ink actually covers.
  const inkLines = inputs.inkLines.map<WorkTicketInkLine>((line) => {
    const ink = masters.inkRates.find((r) => r.id === line.inkRateId);
    if (!ink) {
      return { ...line, estimatedKg: 0, cost: 0 };
    }
    const coverage = safeNum(line.coveragePercent || ink.defaultCoveragePercent) / 100;
    const printedAreaSqm = sheetArea * sheets * coverage;
    const kg = ink.coverageSqmPerKg > 0 ? printedAreaSqm / ink.coverageSqmPerKg : 0;
    const cost = kg * ink.costPerKg;
    return {
      ...line,
      inkName: ink.name,
      estimatedKg: kg,
      cost,
    };
  });
  const inkSubtotal = inkLines.reduce((sum, line) => sum + line.cost, 0);

  // Press: minutes = make-ready + (sheets / run-speed) × 60. Cost = minutes/60 × rate.
  const pressLines: WorkTicketMachineLine[] = [];
  if (press) {
    const runMinutes = press.runSpeedSheetsPerHour > 0
      ? (sheets / press.runSpeedSheetsPerHour) * 60
      : 0;
    const minutes = press.makeReadyMinutes + runMinutes;
    const cost = (minutes / 60) * press.ratePerHour;
    pressLines.push({
      id: ID(1),
      pressRateId: press.id,
      machineName: press.machineName,
      minutes,
      sheets,
      cost,
    });
  } else {
    warnings.push('No press selected — press cost is zero.');
  }
  const pressSubtotal = pressLines.reduce((s, l) => s + l.cost, 0);

  // Guillotine: same shape as press, separate machine.
  const guillotineLines: WorkTicketMachineLine[] = [];
  if (guillotine) {
    const runMinutes = guillotine.runSpeedSheetsPerHour > 0
      ? (sheets / guillotine.runSpeedSheetsPerHour) * 60
      : 0;
    const minutes = guillotine.makeReadyMinutes + runMinutes;
    const cost = (minutes / 60) * guillotine.ratePerHour;
    guillotineLines.push({
      id: ID(2),
      pressRateId: guillotine.id,
      machineName: guillotine.machineName,
      minutes,
      sheets,
      cost,
    });
  }
  const guillotineSubtotal = guillotineLines.reduce((s, l) => s + l.cost, 0);

  // Finishing: per-line — either per-thousand piecework or per-hour run.
  const finishingLines = inputs.finishingLines.map<WorkTicketFinishingLine>((line) => {
    if (line.override) {
      return line; // user typed a number, leave alone.
    }
    const op = masters.finishingOperations.find((o) => o.id === line.finishingOperationId);
    if (!op) return { ...line, cost: 0 };
    const qty = safeNum(line.quantity || quantity);
    let cost = op.setupCost;
    if (op.rateType === 'PerThousand') {
      cost += (qty / 1000) * op.rate;
    } else {
      const hours = op.runSpeedPerHour > 0 ? qty / op.runSpeedPerHour : 0;
      cost += hours * op.rate;
    }
    return { ...line, operationName: op.name, cost };
  });
  const finishingSubtotal = finishingLines.reduce((s, l) => s + l.cost, 0);

  const despatchCost = Math.max(0, safeNum(inputs.despatchCost));

  const totalCost =
    paperCost +
    prePressCost +
    inkSubtotal +
    pressSubtotal +
    guillotineSubtotal +
    finishingSubtotal +
    despatchCost;
  const unitCost = quantity > 0 ? totalCost / quantity : 0;

  const marginPercentApplied =
    inputs.marginPercentOverride !== null && Number.isFinite(inputs.marginPercentOverride)
      ? inputs.marginPercentOverride
      : tier?.defaultMarginPercent ?? client?.defaultMarginPercent ?? 0;

  const sellingPricePerUnit = unitCost * (1 + marginPercentApplied / 100);
  const sellingPriceTotal = sellingPricePerUnit * quantity;

  return {
    paperKg,
    paperCost,
    prePressCost,
    inkLines,
    inkSubtotal,
    pressLines,
    pressSubtotal,
    guillotineLines,
    guillotineSubtotal,
    finishingLines,
    finishingSubtotal,
    despatchCost,
    totalCost,
    unitCost,
    marginPercentApplied,
    sellingPricePerUnit,
    sellingPriceTotal,
    warnings,
    paperRateName: paperRate?.name ?? '',
    paperType: paperRate?.paperType ?? '',
    paperGsm: paperRate?.gsm ?? '',
    plateCostName: plate?.name ?? '',
    pressMachineName: press?.machineName ?? '',
    guillotineMachineName: guillotine?.machineName ?? '',
  };
}

/** Parse a sheet-size string like "640 × 920" or "640x920mm" into m². */
export function parseSheetAreaSqm(sheetSize: string): number {
  if (!sheetSize) return 0;
  const cleaned = sheetSize.replace(/mm/gi, '').replace(/cm/gi, '');
  const parts = cleaned.split(/[x×*]/i).map((p) => Number(p.trim()));
  if (parts.length < 2 || !parts.every((p) => Number.isFinite(p) && p > 0)) return 0;
  // Inputs assumed mm — convert to m.
  const [w, h] = parts;
  return (w / 1000) * (h / 1000);
}
