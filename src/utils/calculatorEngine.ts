/**
 * calculatorEngine — multi-line quote costing.
 *
 * Takes a CalculatorState (shared header + line items) plus the live cost
 * masters, and returns per-line breakdowns + a quote-level rollup. The
 * page calls computeQuote() on every keystroke; results are pure.
 *
 * Formula intent (paper bags):
 *
 *   recommended paper width   = bagW*2 + gusset*2 + sideSeamAllowance
 *   recommended sheet height  = bagH + gusset + topFold + bottomFold
 *   area per bag (m²)         = paperW * sheetH (both in m)
 *   kg/bag                    = area * gsm/1000
 *   kg/bag with waste         = kg/bag * (1 + wastage%/100)
 *   paper cost/bag            = kg/bag-with-waste * (price/ton / 1000)
 *
 *   handle cost/bag           = handle-specific cost + hot-melt (if applicable)
 *
 *   print method (auto)       = quantity >= flexoThresholdQty ? Flexo
 *                                : colors > 0                 ? Screen Print
 *                                : Plain
 *
 *   screen print cost/bag     = (setup + perColor*colors) / qty
 *   flexo cost/bag            = (inkPer1000PerColor*colors / 1000)
 *                               + (plateCostPerColor*colors / qty)
 *
 *   glue, labour, packaging, transport — straight pull from profile
 *   (transport is amortised per line; if a quote has multiple lines we
 *    keep transport per-line for now — adjustable later).
 *
 *   unit cost                 = sum of all per-bag components
 *   quoted unit price         = unit cost * (1 + margin% / 100)
 *   line total                = quoted unit price * quantity
 *
 *   quote totals              = sum across lines
 */

import {
  CalculatorLineItem,
  CalculatorState,
  CostProfile,
  HandleType,
  PaperRate,
  PricingTier,
  Client,
} from '../types';

export interface LineCostBreakdown {
  paperPerBag: number;
  glueAndHandlePerBag: number;
  handlePerBag: number;
  glueOnlyPerBag: number;
  printPerBag: number;
  screenPrintPerBag: number;
  flexoPrintPerBag: number;
  labourPerBag: number;
  packagingPerBag: number;
  transportPerBag: number;
  unitCost: number;
}

export interface LineResult extends LineCostBreakdown {
  /** Resolved print method (Auto turns into Flexo / Screen / Plain). */
  resolvedPrintMethod: 'Plain' | 'Screen Print' | 'Flexo';
  recommendedPaperWidthMm: number;
  recommendedSheetHeightMm: number;
  paperKgPerBagWithWaste: number;
  marginPercent: number;
  quotedUnitPrice: number;
  lineTotal: number;
  /** Total paper consumption for procurement / stock check. */
  totalPaperKg: number;
}

export interface QuoteRollup {
  lineCount: number;
  totalQuantity: number;
  totalUnitCost: number;       // weighted avg per-bag cost across all lines
  totalCost: number;           // unit cost * quantity, summed
  totalQuoted: number;         // quoted unit price * quantity, summed
  totalMarginAmount: number;
  blendedMarginPercent: number;
  totalPaperKg: number;
}

export interface QuoteComputation {
  lines: LineResult[];
  rollup: QuoteRollup;
}

interface ComputeContext {
  client?: Client;
  pricingTier?: PricingTier;
  paperRate?: PaperRate;
  costProfile?: CostProfile;
}

function num(s: string | number | undefined): number {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function pickResolved<T>(perLine: T | '' | undefined, shared: T | '' | undefined): T | '' | undefined {
  return (perLine as any) || shared;
}

function resolveContext(
  state: CalculatorState,
  line: CalculatorLineItem,
  refs: {
    clients: Client[];
    pricingTiers: PricingTier[];
    paperRates: PaperRate[];
    costProfiles: CostProfile[];
  },
): ComputeContext {
  const client = refs.clients.find((c) => c.id === state.shared.clientId);
  const pricingTierId = state.shared.pricingTierId || client?.pricingTierId || '';
  const pricingTier = refs.pricingTiers.find((t) => t.id === pricingTierId);
  const paperRateId = pickResolved(line.paperRateIdOverride, state.shared.paperRateId) as string;
  const paperRate = refs.paperRates.find((r) => r.id === paperRateId);
  const costProfileId = pickResolved(line.costProfileIdOverride, state.shared.costProfileId) as string;
  const costProfile = refs.costProfiles.find((p) => p.id === costProfileId);
  return { client, pricingTier, paperRate, costProfile };
}

function resolvePrintMethod(line: CalculatorLineItem, profile: CostProfile | undefined): LineResult['resolvedPrintMethod'] {
  if (line.printMethod !== 'Auto') return line.printMethod as LineResult['resolvedPrintMethod'];
  const qty = num(line.quantity);
  const colors = num(line.colors);
  if (qty >= num(profile?.flexoThresholdQty)) return 'Flexo';
  if (colors > 0) return 'Screen Print';
  return 'Plain';
}

function handleCost(handleType: HandleType, profile: CostProfile | undefined): number {
  if (!profile) return 0;
  switch (handleType) {
    case 'Flat Handle': return profile.flatHandleCostPerBag + profile.hotMeltCostPerBag;
    case 'Rope Handle': return profile.ropeHandleCostPerBag + profile.hotMeltCostPerBag;
    case 'Roll Handle': return profile.rollHandleCostPerBag + profile.hotMeltCostPerBag;
    case 'None':
    default: return 0;
  }
}

function computeLine(
  state: CalculatorState,
  line: CalculatorLineItem,
  ctx: ComputeContext,
): LineResult {
  const { pricingTier, paperRate, costProfile } = ctx;

  const bagW = num(line.bagWidthMm);
  const bagH = num(line.bagHeightMm);
  const gusset = num(line.gussetMm);
  const qty = num(line.quantity);
  const colors = num(line.colors);

  const recommendedPaperWidthMm = costProfile
    ? bagW * 2 + gusset * 2 + costProfile.sideSeamAllowanceMm
    : 0;
  const recommendedSheetHeightMm = costProfile
    ? bagH + gusset + costProfile.topFoldAllowanceMm + costProfile.bottomFoldAllowanceMm
    : 0;

  const areaPerBagSqM = (recommendedPaperWidthMm / 1000) * (recommendedSheetHeightMm / 1000);
  const paperKgPerBag = areaPerBagSqM * (num(paperRate?.gsm) / 1000);
  const paperKgPerBagWithWaste = costProfile ? paperKgPerBag * (1 + costProfile.wastagePercent / 100) : 0;
  const paperPerBag = paperRate ? paperKgPerBagWithWaste * (paperRate.pricePerTon / 1000) : 0;

  const handlePerBag = handleCost(line.handleType, costProfile);

  const resolvedPrintMethod = resolvePrintMethod(line, costProfile);
  const screenPrintPerBag = costProfile && qty > 0 && resolvedPrintMethod === 'Screen Print'
    ? (costProfile.screenPrintSetupCost + costProfile.screenPrintCostPerColor * colors) / qty
    : 0;
  const flexoPrintPerBag = costProfile && resolvedPrintMethod === 'Flexo'
    ? ((costProfile.flexoInkCostPer1000PerColor * colors) / 1000)
      + (qty > 0 ? (costProfile.plateCostPerColor * colors) / qty : 0)
    : 0;
  const printPerBag = screenPrintPerBag + flexoPrintPerBag;

  const glueOnlyPerBag = costProfile?.baseGlueCostPerBag ?? 0;
  const glueAndHandlePerBag = glueOnlyPerBag + handlePerBag;
  const labourPerBag = costProfile ? costProfile.labourCostPer1000 / 1000 : 0;
  const packagingPerBag = costProfile ? costProfile.packagingCostPer1000 / 1000 : 0;
  const transportPerBag = costProfile && qty > 0 ? costProfile.transportCostPerJob / qty : 0;

  const unitCost = paperPerBag
    + handlePerBag
    + glueOnlyPerBag
    + printPerBag
    + labourPerBag
    + packagingPerBag
    + transportPerBag;

  const sharedMargin = num(state.shared.customMarginPercent);
  const tierMargin = pricingTier?.defaultMarginPercent ?? 0;
  const profileMargin = costProfile?.defaultMarginPercent ?? 0;
  const lineMargin = num(line.customMarginPercent);
  const marginPercent = lineMargin || sharedMargin || tierMargin || profileMargin || 0;

  const quotedUnitPrice = unitCost * (1 + marginPercent / 100);
  const lineTotal = quotedUnitPrice * qty;
  const totalPaperKg = paperKgPerBagWithWaste * qty;

  return {
    paperPerBag,
    glueAndHandlePerBag,
    handlePerBag,
    glueOnlyPerBag,
    printPerBag,
    screenPrintPerBag,
    flexoPrintPerBag,
    labourPerBag,
    packagingPerBag,
    transportPerBag,
    unitCost,
    resolvedPrintMethod,
    recommendedPaperWidthMm,
    recommendedSheetHeightMm,
    paperKgPerBagWithWaste,
    marginPercent,
    quotedUnitPrice,
    lineTotal,
    totalPaperKg,
  };
}

export function computeQuote(
  state: CalculatorState,
  refs: {
    clients: Client[];
    pricingTiers: PricingTier[];
    paperRates: PaperRate[];
    costProfiles: CostProfile[];
  },
): QuoteComputation {
  const lines = state.lines.map((line) => computeLine(state, line, resolveContext(state, line, refs)));

  let totalQuantity = 0;
  let totalCost = 0;
  let totalQuoted = 0;
  let totalPaperKg = 0;
  for (let i = 0; i < state.lines.length; i++) {
    const q = num(state.lines[i].quantity);
    totalQuantity += q;
    totalCost += lines[i].unitCost * q;
    totalQuoted += lines[i].lineTotal;
    totalPaperKg += lines[i].totalPaperKg;
  }
  const totalUnitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  const totalMarginAmount = totalQuoted - totalCost;
  const blendedMarginPercent = totalCost > 0 ? (totalMarginAmount / totalCost) * 100 : 0;

  return {
    lines,
    rollup: {
      lineCount: state.lines.length,
      totalQuantity,
      totalUnitCost,
      totalCost,
      totalQuoted,
      totalMarginAmount,
      blendedMarginPercent,
      totalPaperKg,
    },
  };
}

/** Factory for a fresh, empty line. The caller passes a unique id. */
export function emptyCalculatorLine(id: string): CalculatorLineItem {
  return {
    id,
    productId: '',
    productName: '',
    description: '',
    bagWidthMm: '',
    bagHeightMm: '',
    gussetMm: '',
    quantity: '',
    handleType: 'None',
    printMethod: 'Auto',
    colors: '0',
    paperRateIdOverride: '',
    costProfileIdOverride: '',
    customMarginPercent: '',
  };
}

/** Factory for a fresh, empty calculator state with one starter line. */
export function emptyCalculatorState(today: string): CalculatorState {
  return {
    shared: {
      clientId: '',
      leadId: '',
      pricingTierId: '',
      paperRateId: '',
      costProfileId: '',
      customMarginPercent: '',
      quoteDate: today,
      notes: '',
      salesOwnerName: '',
    },
    lines: [emptyCalculatorLine(`line-${Date.now()}-1`)],
  };
}
