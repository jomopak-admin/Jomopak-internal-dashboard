/* Standalone verification of the standard-product pricing engine. */
import { computeProductPricing, resolveClientPrice } from './src/utils/productPricing';
import { computeQuote, emptyCalculatorState } from './src/utils/calculatorEngine';
import { CostProfile, PaperRate, PricingTier, ProductPricingSpec, ClientProductPrice } from './src/types';

const paperRate: PaperRate = {
  id: 'pr1', name: 'Test Kraft', supplierId: '', supplierName: '', paperType: 'Kraft',
  gsm: '100', pricePerTon: 20000, notes: '', active: true,
};
const costProfile: CostProfile = {
  id: 'cp1', name: 'Standard', wastagePercent: 10, defaultMarginPercent: 30,
  baseGlueCostPerBag: 0.05, hotMeltCostPerBag: 0,
  flatHandleCostPerBag: 0, ropeHandleCostPerBag: 0, rollHandleCostPerBag: 0,
  screenPrintSetupCost: 0, screenPrintCostPerColor: 0,
  flexoInkCostPer1000PerColor: 0, plateCostPerColor: 0,
  labourCostPer1000: 50, packagingCostPer1000: 10, transportCostPerJob: 500,
  sideSeamAllowanceMm: 20, topFoldAllowanceMm: 30, bottomFoldAllowanceMm: 30,
  flexoThresholdQty: 50000, active: true, notes: '',
};
const pricingTiers: PricingTier[] = [
  { id: 't1', name: 'Wholesale', type: 'Wholesale', defaultMarginPercent: 20, brandingMarginPercent: 0, notes: '' },
  { id: 't2', name: 'Retail', type: 'Retail', defaultMarginPercent: 45, brandingMarginPercent: 0, notes: '' },
];
const spec: ProductPricingSpec = {
  bagWidthMm: 250, bagHeightMm: 350, gussetMm: 80,
  handleType: 'None', printMethod: 'Plain', colors: 0, printAreaCm2: 0, coverageBand: 'None',
  paperRateId: 'pr1', costProfileId: 'cp1', plateBilling: 'amortized',
  baseMarginPercent: 35, baseQuantity: 1000, breakQuantities: [5000, 25000],
};
const refs = { pricingTiers, paperRates: [paperRate], costProfiles: [costProfile] };

let pass = 0, fail = 0;
function check(label: string, cond: boolean, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}  ${detail}`); }
}
function near(a: number, b: number, tol = 0.0005) { return Math.abs(a - b) <= tol; }

// Hand-computed paper cost per bag (qty-independent):
//  width = 250*2 + 80*2 + 20 = 680 ; height = 350+80+30+30 = 490
//  area  = 0.68*0.49 = 0.3332 m² ; kg/bag = 0.3332*0.1 = 0.03332
//  +10% waste = 0.036652 ; paper R/bag = 0.036652 * 20 = 0.73304
const paperPerBag = 0.73304;
const fixedPerBag = 0.05 /*glue*/ + 0.05 /*labour 50/1000*/ + 0.01 /*pack 10/1000*/;
const cost = (qty: number) => paperPerBag + fixedPerBag + 500 / qty;

console.log('Product pricing engine verification\n');
const result = computeProductPricing(spec, refs);

check('computes ok', result.ok);
check('three breaks (1000/5000/25000)', result.breaks.length === 3, JSON.stringify(result.breaks.map((b) => b.quantity)));
check('breaks sorted ascending', result.breaks.map((b) => b.quantity).join(',') === '1000,5000,25000');

const b1k = result.breaks.find((b) => b.quantity === 1000)!;
const b25k = result.breaks.find((b) => b.quantity === 25000)!;

check('unit cost @1000 matches hand calc', near(b1k.unitCost, cost(1000)), `got ${b1k.unitCost} want ${cost(1000)}`);
check('unit cost @25000 matches hand calc', near(b25k.unitCost, cost(25000)), `got ${b25k.unitCost} want ${cost(25000)}`);
check('cost TAPERS with volume (25k < 1k)', b25k.unitCost < b1k.unitCost, `${b25k.unitCost} vs ${b1k.unitCost}`);

check('price @1000 = cost × 1.35 (plain, no plate)', near(b1k.unitPrice, cost(1000) * 1.35), `got ${b1k.unitPrice} want ${cost(1000) * 1.35}`);
check('price @25000 = cost × 1.35', near(b25k.unitPrice, cost(25000) * 1.35));
check('effective margin reported = 35%', near(b1k.marginPercent, 35));

check('Wholesale tier @1000 = cost × 1.20', near(b1k.tierPrices['t1'], cost(1000) * 1.20), `got ${b1k.tierPrices['t1']}`);
check('Retail tier @1000 = cost × 1.45', near(b1k.tierPrices['t2'], cost(1000) * 1.45), `got ${b1k.tierPrices['t2']}`);

// Cross-check against the Calculator engine directly for the same spec @1000.
const state = emptyCalculatorState('2026-05-25');
state.shared.paperRateId = 'pr1';
state.shared.costProfileId = 'cp1';
state.shared.customMarginPercent = '35';
state.shared.plateBilling = 'amortized';
state.lines[0] = {
  ...state.lines[0],
  bagWidthMm: '250', bagHeightMm: '350', gussetMm: '80', quantity: '1000',
  handleType: 'None', printMethod: 'Plain', colors: '0', printAreaCm2: '', coverageBand: 'None',
};
const direct = computeQuote(state, { clients: [], pricingTiers, paperRates: [paperRate], costProfiles: [costProfile] }).lines[0];
check('product price == calculator price for same spec', near(b1k.unitPrice, direct.quotedUnitPrice), `product ${b1k.unitPrice} vs calc ${direct.quotedUnitPrice}`);
check('product cost == calculator cost for same spec', near(b1k.unitCost, direct.unitCost));

// Client overrides.
const fixedDeal: ClientProductPrice = {
  id: 'd1', clientId: 'c1', clientName: 'C', productId: 'p1', productName: 'P',
  mode: 'fixedPrice', marginPercent: 0, fixedUnitPrice: 1.11, minQuantity: 0, note: '', active: true, createdAt: '', createdByName: '',
};
const rf = resolveClientPrice(spec, 1000, fixedDeal, refs);
check('client fixed price applies', rf.source === 'client-fixed' && near(rf.unitPrice, 1.11));

const marginDeal: ClientProductPrice = { ...fixedDeal, id: 'd2', mode: 'margin', marginPercent: 50, minQuantity: 5000 };
const rmBelow = resolveClientPrice(spec, 1000, marginDeal, refs); // below minQty → base
const rmAt = resolveClientPrice(spec, 5000, marginDeal, refs);     // at minQty → deal
check('client margin deal ignored below min qty', rmBelow.source === 'base');
check('client margin deal applies at/above min qty', rmAt.source === 'client-margin' && near(rmAt.unitPrice, cost(5000) * 1.5), `got ${rmAt.unitPrice} want ${cost(5000) * 1.5}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
