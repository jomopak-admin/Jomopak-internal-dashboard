import { SectionTitle } from '../../components/SectionTitle';
import {
  CalculatorQuoteFormState,
  Client,
  CostProfile,
  HandleType,
  PaperRate,
  PricingTier,
  Product,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CalculatorPageProps {
  canViewInternalCosts: boolean;
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  quoteForm: CalculatorQuoteFormState;
  setQuoteForm: (value: CalculatorQuoteFormState) => void;
}

export function CalculatorPage({
  canViewInternalCosts,
  clients,
  products,
  pricingTiers,
  paperRates,
  costProfiles,
  quoteForm,
  setQuoteForm,
}: CalculatorPageProps) {
  const selectedClient = clients.find((client) => client.id === quoteForm.clientId);
  const selectedTier = pricingTiers.find((tier) => tier.id === (quoteForm.pricingTierId || selectedClient?.pricingTierId));
  const selectedPaperRate = paperRates.find((rate) => rate.id === quoteForm.paperRateId);
  const selectedProfile = costProfiles.find((profile) => profile.id === quoteForm.costProfileId);

  const quantity = Number(quoteForm.quantity || 0);
  const bagWidth = Number(quoteForm.bagWidthMm || 0);
  const bagHeight = Number(quoteForm.bagHeightMm || 0);
  const gusset = Number(quoteForm.gussetMm || 0);
  const colors = Number(quoteForm.colors || 0);
  const marginPercent = Number(quoteForm.customMarginPercent || selectedTier?.defaultMarginPercent || selectedProfile?.defaultMarginPercent || 0);

  const recommendedPaperWidth = selectedProfile ? (bagWidth * 2) + (gusset * 2) + selectedProfile.sideSeamAllowanceMm : 0;
  const recommendedSheetHeight = selectedProfile ? bagHeight + gusset + selectedProfile.topFoldAllowanceMm + selectedProfile.bottomFoldAllowanceMm : 0;
  const areaPerBagSqM = (recommendedPaperWidth / 1000) * (recommendedSheetHeight / 1000);
  const paperWeightKgPerBag = areaPerBagSqM * (Number(selectedPaperRate?.gsm || 0) / 1000);
  const paperWeightWithWasteKgPerBag = selectedProfile ? paperWeightKgPerBag * (1 + selectedProfile.wastagePercent / 100) : 0;
  const paperCostPerBag = selectedPaperRate ? paperWeightWithWasteKgPerBag * (selectedPaperRate.pricePerTon / 1000) : 0;

  const handleCostPerBag = selectedProfile ? ({
    'None': 0,
    'Flat Handle': selectedProfile.flatHandleCostPerBag + selectedProfile.hotMeltCostPerBag,
    'Rope Handle': selectedProfile.ropeHandleCostPerBag + selectedProfile.hotMeltCostPerBag,
    'Roll Handle': selectedProfile.rollHandleCostPerBag + selectedProfile.hotMeltCostPerBag,
  } as Record<HandleType, number>)[quoteForm.handleType] : 0;

  const printMethod =
    quoteForm.printMethod === 'Auto'
      ? quantity >= Number(selectedProfile?.flexoThresholdQty || 0)
        ? 'Flexo'
        : colors > 0
          ? 'Screen Print'
          : 'Plain'
      : quoteForm.printMethod;

  const screenPrintCostPerBag = selectedProfile && quantity > 0 && printMethod === 'Screen Print'
    ? (selectedProfile.screenPrintSetupCost + (selectedProfile.screenPrintCostPerColor * colors)) / quantity
    : 0;

  const flexoPrintCostPerBag = selectedProfile && printMethod === 'Flexo'
    ? ((selectedProfile.flexoInkCostPer1000PerColor * colors) / 1000) +
      (quantity > 0 ? (selectedProfile.plateCostPerColor * colors) / quantity : 0)
    : 0;

  const glueCostPerBag = selectedProfile?.baseGlueCostPerBag ?? 0;
  const labourCostPerBag = selectedProfile ? selectedProfile.labourCostPer1000 / 1000 : 0;
  const packagingCostPerBag = selectedProfile ? selectedProfile.packagingCostPer1000 / 1000 : 0;
  const transportCostPerBag = selectedProfile && quantity > 0 ? selectedProfile.transportCostPerJob / quantity : 0;

  const unitCost = paperCostPerBag + handleCostPerBag + glueCostPerBag + labourCostPerBag + packagingCostPerBag + transportCostPerBag + screenPrintCostPerBag + flexoPrintCostPerBag;
  const quotedUnitPrice = unitCost * (1 + marginPercent / 100);
  const quotedTotal = quotedUnitPrice * quantity;

  return (
    <>
      <SectionTitle
        title="Calculator"
        subtitle="Use current approved cost inputs to quote customers quickly without exposing the internal rate cards."
      />

      <div className="calculator-shell">
      <section className="card calculator-quote-card">
        <SectionTitle title="Quote Calculator" subtitle={canViewInternalCosts ? 'This quote engine uses the current approved internal cost inputs and also shows internal costing diagnostics.' : 'This quote engine uses the latest approved internal cost inputs and only shows the customer-facing quote output.'} />
        <div className="calculator-quote-layout">
          <div className="calculator-input-sections">
            <section className="calculator-input-group">
              <h3>Quote Setup</h3>
              <div className="calculator-grid calculator-grid-3">
                <label><span>Client</span><select value={quoteForm.clientId} onChange={(event) => setQuoteForm({ ...quoteForm, clientId: event.target.value })}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                <label><span>Product</span><select value={quoteForm.productId} onChange={(event) => setQuoteForm({ ...quoteForm, productId: event.target.value })}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
                <label><span>Pricing tier</span><select value={quoteForm.pricingTierId} onChange={(event) => setQuoteForm({ ...quoteForm, pricingTierId: event.target.value })}><option value="">Use client default</option>{pricingTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></label>
                <label><span>Paper rate</span><select value={quoteForm.paperRateId} onChange={(event) => setQuoteForm({ ...quoteForm, paperRateId: event.target.value })}><option value="">Select paper rate</option>{paperRates.filter((rate) => rate.active).map((rate) => <option key={rate.id} value={rate.id}>{rate.name} · {rate.pricePerTon}/ton</option>)}</select></label>
                <label><span>Cost profile</span><select value={quoteForm.costProfileId} onChange={(event) => setQuoteForm({ ...quoteForm, costProfileId: event.target.value })}><option value="">Select profile</option>{costProfiles.filter((profile) => profile.active).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
                <label><span>Margin % override</span><input type="number" min="0" step="0.1" value={quoteForm.customMarginPercent} onChange={(event) => setQuoteForm({ ...quoteForm, customMarginPercent: event.target.value })} placeholder="Leave blank for default" /></label>
              </div>
            </section>

            <section className="calculator-input-group">
              <h3>Bag Specification</h3>
              <div className="calculator-grid calculator-grid-4">
                <label><span>Bag width mm</span><input type="number" min="0" value={quoteForm.bagWidthMm} onChange={(event) => setQuoteForm({ ...quoteForm, bagWidthMm: event.target.value })} /></label>
                <label><span>Bag height mm</span><input type="number" min="0" value={quoteForm.bagHeightMm} onChange={(event) => setQuoteForm({ ...quoteForm, bagHeightMm: event.target.value })} /></label>
                <label><span>Gusset mm</span><input type="number" min="0" value={quoteForm.gussetMm} onChange={(event) => setQuoteForm({ ...quoteForm, gussetMm: event.target.value })} /></label>
                <label><span>Quantity</span><input type="number" min="0" value={quoteForm.quantity} onChange={(event) => setQuoteForm({ ...quoteForm, quantity: event.target.value })} /></label>
                <label><span>Handle type</span><select value={quoteForm.handleType} onChange={(event) => setQuoteForm({ ...quoteForm, handleType: event.target.value as HandleType })}><option>None</option><option>Flat Handle</option><option>Rope Handle</option><option>Roll Handle</option></select></label>
                <label><span>Print method</span><select value={quoteForm.printMethod} onChange={(event) => setQuoteForm({ ...quoteForm, printMethod: event.target.value as CalculatorQuoteFormState['printMethod'] })}><option>Auto</option><option>Plain</option><option>Screen Print</option><option>Flexo</option></select></label>
                <label><span>Colors</span><input type="number" min="0" value={quoteForm.colors} onChange={(event) => setQuoteForm({ ...quoteForm, colors: event.target.value })} /></label>
              </div>
            </section>
          </div>

          <div className="calculator-output-sidebar">
            <div className="summary-strip calculator-summary-strip">
              <div className="summary-chip"><span>Recommended paper width</span><strong>{formatNumber(recommendedPaperWidth, 2)} mm</strong></div>
              <div className="summary-chip"><span>Recommended sheet height</span><strong>{formatNumber(recommendedSheetHeight, 2)} mm</strong></div>
              <div className="summary-chip"><span>Print method used</span><strong>{printMethod}</strong></div>
              {canViewInternalCosts ? (
                <div className="summary-chip"><span>Margin applied</span><strong>{formatNumber(marginPercent, 2)}%</strong></div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="calculator-results-grid">
          {canViewInternalCosts ? (
            <section className="card calculator-result-card">
              <SectionTitle title="Cost Breakdown" />
              <div className="ranking-list">
                <div className="ranking-item"><span>Paper cost / bag</span><strong>{formatNumber(paperCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Glue cost / bag</span><strong>{formatNumber(glueCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Handle cost / bag</span><strong>{formatNumber(handleCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Print cost / bag</span><strong>{formatNumber(screenPrintCostPerBag + flexoPrintCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Labour cost / bag</span><strong>{formatNumber(labourCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Packaging cost / bag</span><strong>{formatNumber(packagingCostPerBag, 4)}</strong></div>
                <div className="ranking-item"><span>Transport cost / bag</span><strong>{formatNumber(transportCostPerBag, 4)}</strong></div>
              </div>
            </section>
          ) : null}
          {canViewInternalCosts ? (
            <section className="card calculator-result-card">
              <SectionTitle title="Pricing Variables" />
              <div className="ranking-list">
                <div className="ranking-item"><span>Paper rate used</span><strong>{selectedPaperRate ? `${formatNumber(selectedPaperRate.pricePerTon, 2)}/ton` : 'Not set'}</strong></div>
                <div className="ranking-item"><span>Paper type</span><strong>{selectedPaperRate?.paperType || 'Not set'}</strong></div>
                <div className="ranking-item"><span>Wastage applied</span><strong>{selectedProfile ? `${formatNumber(selectedProfile.wastagePercent, 2)}%` : 'Not set'}</strong></div>
                <div className="ranking-item"><span>Handle rule</span><strong>{quoteForm.handleType}</strong></div>
                <div className="ranking-item"><span>Labour / 1000</span><strong>{selectedProfile ? formatNumber(selectedProfile.labourCostPer1000, 2) : 'Not set'}</strong></div>
                <div className="ranking-item"><span>Transport / job</span><strong>{selectedProfile ? formatNumber(selectedProfile.transportCostPerJob, 2) : 'Not set'}</strong></div>
                <div className="ranking-item"><span>Cost profile</span><strong>{selectedProfile?.name || 'Not set'}</strong></div>
              </div>
            </section>
          ) : null}
          <section className="card calculator-result-card">
            <SectionTitle title={canViewInternalCosts ? 'Quote Output' : 'Quote Price'} />
            <div className="ranking-list">
              {canViewInternalCosts ? (
                <div className="ranking-item"><span>Unit cost</span><strong>{formatNumber(unitCost, 4)}</strong></div>
              ) : null}
              <div className="ranking-item"><span>Quoted unit price</span><strong>{formatNumber(quotedUnitPrice, 4)}</strong></div>
              <div className="ranking-item"><span>Total quote</span><strong>{formatNumber(quotedTotal, 2)}</strong></div>
              {canViewInternalCosts ? (
                <>
                  <div className="ranking-item"><span>Paper kg / bag</span><strong>{formatNumber(paperWeightWithWasteKgPerBag, 6)}</strong></div>
                  <div className="ranking-item"><span>Total estimated paper kg</span><strong>{formatNumber(paperWeightWithWasteKgPerBag * quantity, 2)}</strong></div>
                </>
              ) : (
                <>
                  <div className="ranking-item"><span>Quantity quoted</span><strong>{formatNumber(quantity)}</strong></div>
                  <div className="ranking-item"><span>Print method</span><strong>{printMethod}</strong></div>
                </>
              )}
            </div>
          </section>
        </div>
      </section>
      </div>
    </>
  );
}
