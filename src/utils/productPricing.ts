/**
 * productPricing — standard-product cost-plus pricing (phase 33).
 *
 * A *standard* catalogue product carries a saved spec (size, paper, handle,
 * print, base qty, MOQ breaks, margin). This module turns that spec into a
 * cost-plus price list by driving the EXACT same maths the ad-hoc Calculator
 * uses (`calculatorEngine.computeQuote`). That guarantees a standard product's
 * price and a one-off calculator quote for the same spec always agree.
 *
 * Key behaviours:
 *  - Unit cost is read straight from the engine (margin-independent), so it's
 *    always the true production cost.
 *  - The product's own `baseMarginPercent` drives the headline price. If it's
 *    left at 0 the engine falls back to the cost profile's default margin.
 *  - We also compute a price for every pricing tier (incl. Wholesale) and
 *    resolve client-specific overrides (fixed price or margin) on top.
 *  - Nothing here is published to the Aman OS connector — pricing stays
 *    internal/private.
 */

import {
  CalculatorState,
  Client,
  ClientProductPrice,
  CostProfile,
  PaperRate,
  PricingTier,
  Product,
  ProductPriceBreakSnapshot,
  ProductPriceVersion,
  ProductPricingSpec,
} from '../types';
import { computeQuote } from './calculatorEngine';

export interface PricingRefs {
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
}

export interface PricedBreak {
  quantity: number;
  /** Production cost per unit (margin excluded). */
  unitCost: number;
  /** Headline cost-plus sell price per unit at the product's base margin. */
  unitPrice: number;
  /** Effective margin % applied to reach unitPrice. */
  marginPercent: number;
  /** One-off plate setup fee at this quantity (0 when amortised into the unit price). */
  plateSetupFee: number;
  /** Total paper consumed for the whole run at this quantity (kg). */
  totalPaperKg: number;
  /** Sell price per unit for each pricing tier, keyed by tier id. */
  tierPrices: Record<string, number>;
}

export interface ProductPricingResult {
  ok: boolean;
  /** Why pricing could not be computed (e.g. missing paper rate). */
  reason?: string;
  breaks: PricedBreak[];
  paperRate?: PaperRate;
  costProfile?: CostProfile;
}

function num(value: string | number | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Parse a comma/space separated MOQ break string into ascending unique numbers. */
export function parseBreakQuantities(raw: string): number[] {
  return Array.from(
    new Set(
      String(raw || '')
        .split(/[,\s]+/)
        .map((s) => Math.round(num(s)))
        .filter((n) => n > 0),
    ),
  ).sort((a, b) => a - b);
}

/** The full ordered set of quantities to price: base qty + breaks, deduped. */
export function pricingQuantities(spec: ProductPricingSpec): number[] {
  const base = Math.round(num(spec.baseQuantity));
  const all = [base, ...(spec.breakQuantities || []).map((n) => Math.round(num(n)))].filter((n) => n > 0);
  return Array.from(new Set(all)).sort((a, b) => a - b);
}

/** Build a single-line CalculatorState from a product spec at a given qty + margin. */
function buildState(spec: ProductPricingSpec, quantity: number, marginPercent: number): CalculatorState {
  return {
    shared: {
      clientId: '',
      leadId: '',
      pricingTierId: '',
      paperRateId: spec.paperRateId,
      costProfileId: spec.costProfileId,
      customMarginPercent: marginPercent ? String(marginPercent) : '',
      quoteDate: '',
      notes: '',
      salesOwnerName: '',
      plateBilling: spec.plateBilling,
    },
    lines: [
      {
        id: 'product',
        productId: '',
        productName: '',
        description: '',
        bagWidthMm: String(spec.bagWidthMm ?? ''),
        bagHeightMm: String(spec.bagHeightMm ?? ''),
        gussetMm: String(spec.gussetMm ?? ''),
        // Phase 132.1 — default glue allowance.
        glueAllowanceMm: '30',
        // Phase 132.3 — empty = inherit CostProfile (default R2.65/cm²).
        platePerSqCmChargeOverride: '',
        quantity: String(quantity),
        handleType: spec.handleType,
        printMethod: spec.printMethod,
        colors: String(spec.colors ?? 0),
        printAreaCm2: String(spec.printAreaCm2 ?? ''),
        coverageBand: spec.coverageBand,
        paperRateIdOverride: '',
        costProfileIdOverride: '',
        customMarginPercent: '',
      },
    ],
  };
}

function calcRefs(refs: PricingRefs) {
  return {
    clients: [] as Client[],
    pricingTiers: refs.pricingTiers,
    paperRates: refs.paperRates,
    costProfiles: refs.costProfiles,
  };
}

/** Price one spec at one quantity for an arbitrary margin — returns the engine line. */
function priceOne(spec: ProductPricingSpec, quantity: number, marginPercent: number, refs: PricingRefs) {
  return computeQuote(buildState(spec, quantity, marginPercent), calcRefs(refs)).lines[0];
}

/**
 * Compute the full cost-plus price list for a standard product spec across its
 * base quantity and every MOQ break, including a per-tier price matrix.
 */
export function computeProductPricing(spec: ProductPricingSpec, refs: PricingRefs): ProductPricingResult {
  const paperRate = refs.paperRates.find((r) => r.id === spec.paperRateId);
  const costProfile = refs.costProfiles.find((p) => p.id === spec.costProfileId);
  if (!paperRate) return { ok: false, reason: 'Select a paper rate to price this product.', breaks: [] };
  if (!costProfile) return { ok: false, reason: 'Select a cost profile to price this product.', breaks: [] };

  const quantities = pricingQuantities(spec);
  if (!quantities.length) return { ok: false, reason: 'Set a base quantity to price this product.', breaks: [], paperRate, costProfile };

  const breaks: PricedBreak[] = quantities.map((quantity) => {
    const base = priceOne(spec, quantity, spec.baseMarginPercent, refs);
    const tierPrices: Record<string, number> = {};
    refs.pricingTiers.forEach((tier) => {
      tierPrices[tier.id] = priceOne(spec, quantity, tier.defaultMarginPercent, refs).quotedUnitPrice;
    });
    return {
      quantity,
      unitCost: base.unitCost,
      unitPrice: base.quotedUnitPrice,
      marginPercent: base.marginPercent,
      plateSetupFee: base.plateSetupFee,
      totalPaperKg: base.totalPaperKg,
      tierPrices,
    };
  });

  return { ok: true, breaks, paperRate, costProfile };
}

export interface ResolvedClientPrice {
  unitPrice: number;
  source: 'client-fixed' | 'client-margin' | 'base';
}

/**
 * Resolve the price a specific client pays for a product at a given quantity,
 * applying a client-specific override (fixed price or margin) when one is
 * active and in scope, otherwise the product's base price.
 */
export function resolveClientPrice(
  spec: ProductPricingSpec,
  quantity: number,
  override: ClientProductPrice | undefined,
  refs: PricingRefs,
): ResolvedClientPrice {
  if (override && override.active && (override.minQuantity <= 0 || quantity >= override.minQuantity)) {
    if (override.mode === 'fixedPrice') {
      return { unitPrice: override.fixedUnitPrice, source: 'client-fixed' };
    }
    return { unitPrice: priceOne(spec, quantity, override.marginPercent, refs).quotedUnitPrice, source: 'client-margin' };
  }
  return { unitPrice: priceOne(spec, quantity, spec.baseMarginPercent, refs).quotedUnitPrice, source: 'base' };
}

/**
 * Assemble a Draft price version for a product from a live computation — the
 * audited snapshot of margin + cost assumptions + per-break prices. The caller
 * stamps version number / approval.
 */
export function buildPriceVersionDraft(
  product: Product,
  refs: PricingRefs,
  meta: { versionNumber: number; createdByName: string; createdAt: string; note: string },
): ProductPriceVersion | null {
  if (!product.pricingSpec) return null;
  const result = computeProductPricing(product.pricingSpec, refs);
  if (!result.ok || !result.paperRate || !result.costProfile) return null;

  const breaks: ProductPriceBreakSnapshot[] = result.breaks.map((b) => ({
    quantity: b.quantity,
    unitCost: b.unitCost,
    unitPrice: b.unitPrice,
    plateSetupFee: b.plateSetupFee,
  }));

  return {
    id: `ppv-${product.id}-${meta.versionNumber}-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    versionNumber: meta.versionNumber,
    status: 'Draft',
    baseMarginPercent: product.pricingSpec.baseMarginPercent,
    assumptions: {
      paperRateId: result.paperRate.id,
      paperRateName: result.paperRate.name,
      paperType: result.paperRate.paperType,
      gsm: result.paperRate.gsm,
      pricePerTon: result.paperRate.pricePerTon,
      costProfileId: result.costProfile.id,
      costProfileName: result.costProfile.name,
      wastagePercent: result.costProfile.wastagePercent,
    },
    breaks,
    note: meta.note,
    createdAt: meta.createdAt,
    createdByName: meta.createdByName,
    approvedAt: '',
    approvedByName: '',
  };
}

/**
 * True when the live recomputed price has drifted from an approved version
 * beyond a small rounding tolerance — i.e. the approved price is stale and
 * should be re-approved. Compares the headline (smallest-break) unit price.
 */
export function isPriceVersionStale(
  spec: ProductPricingSpec,
  approved: ProductPriceVersion | undefined,
  refs: PricingRefs,
  tolerance = 0.01,
): boolean {
  if (!approved) return false;
  const live = computeProductPricing(spec, refs);
  if (!live.ok) return false;
  // Compare every quantity that exists in both snapshots.
  for (const lb of live.breaks) {
    const ab = approved.breaks.find((b) => b.quantity === lb.quantity);
    if (!ab) return true; // a new break appeared
    if (Math.abs(ab.unitPrice - lb.unitPrice) > tolerance) return true;
    if (Math.abs(ab.unitCost - lb.unitCost) > tolerance) return true;
  }
  return false;
}

/** Convert a product's form-side spec into the stored numeric ProductPricingSpec. */
export function formToPricingSpec(form: {
  bagWidthMm: string;
  bagHeightMm: string;
  gussetMm: string;
  handleType: ProductPricingSpec['handleType'];
  printMethod: ProductPricingSpec['printMethod'];
  colors: string;
  printAreaCm2: string;
  coverageBand: ProductPricingSpec['coverageBand'];
  paperRateId: string;
  costProfileId: string;
  plateBilling: ProductPricingSpec['plateBilling'];
  baseMarginPercent: string;
  baseQuantity: string;
  breakQuantities: string;
}): ProductPricingSpec {
  return {
    bagWidthMm: num(form.bagWidthMm),
    bagHeightMm: num(form.bagHeightMm),
    gussetMm: num(form.gussetMm),
    handleType: form.handleType,
    printMethod: form.printMethod,
    colors: num(form.colors),
    printAreaCm2: num(form.printAreaCm2),
    coverageBand: form.coverageBand,
    paperRateId: form.paperRateId,
    costProfileId: form.costProfileId,
    plateBilling: form.plateBilling,
    baseMarginPercent: num(form.baseMarginPercent),
    baseQuantity: num(form.baseQuantity),
    breakQuantities: parseBreakQuantities(form.breakQuantities),
  };
}
