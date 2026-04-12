import { useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  CalculatorQuoteFormState,
  Client,
  CostProfile,
  CostProfileFilters,
  CostProfileFormState,
  HandleType,
  PaperRate,
  PaperRateFilters,
  PaperRateFormState,
  PricingTier,
  Product,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CalculatorPageProps {
  canManageSettings: boolean;
  clients: Client[];
  products: Product[];
  pricingTiers: PricingTier[];
  suppliers: Supplier[];
  paperRates: PaperRate[];
  costProfiles: CostProfile[];
  paperRateForm: PaperRateFormState;
  setPaperRateForm: (value: PaperRateFormState) => void;
  paperRateEditingId: string | null;
  paperRateMessage: string;
  onSavePaperRate: () => void;
  onResetPaperRate: () => void;
  paperRateFilters: PaperRateFilters;
  setPaperRateFilters: (value: PaperRateFilters) => void;
  filteredPaperRates: PaperRate[];
  onEditPaperRate: (rate: PaperRate) => void;
  costProfileForm: CostProfileFormState;
  setCostProfileForm: (value: CostProfileFormState) => void;
  costProfileEditingId: string | null;
  costProfileMessage: string;
  onSaveCostProfile: () => void;
  onResetCostProfile: () => void;
  costProfileFilters: CostProfileFilters;
  setCostProfileFilters: (value: CostProfileFilters) => void;
  filteredCostProfiles: CostProfile[];
  onEditCostProfile: (profile: CostProfile) => void;
  quoteForm: CalculatorQuoteFormState;
  setQuoteForm: (value: CalculatorQuoteFormState) => void;
}

type CalculatorTab = 'quote' | 'paperRates' | 'costProfiles';
type PaperRatesMode = 'list' | 'form';
type CostProfilesMode = 'list' | 'form';

export function CalculatorPage({
  canManageSettings,
  clients,
  products,
  pricingTiers,
  suppliers,
  paperRates,
  costProfiles,
  paperRateForm,
  setPaperRateForm,
  paperRateEditingId,
  paperRateMessage,
  onSavePaperRate,
  onResetPaperRate,
  paperRateFilters,
  setPaperRateFilters,
  filteredPaperRates,
  onEditPaperRate,
  costProfileForm,
  setCostProfileForm,
  costProfileEditingId,
  costProfileMessage,
  onSaveCostProfile,
  onResetCostProfile,
  costProfileFilters,
  setCostProfileFilters,
  filteredCostProfiles,
  onEditCostProfile,
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
  const [tab, setTab] = useState<CalculatorTab>('quote');
  const [paperRatesMode, setPaperRatesMode] = useState<PaperRatesMode>('list');
  const [costProfilesMode, setCostProfilesMode] = useState<CostProfilesMode>('list');

  return (
    <>
      <SectionTitle
        title="Calculator"
        subtitle="Manage cost inputs and build live quotes for paper bags from one place."
      />

      <div className="calculator-tabs">
        <button className={tab === 'quote' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('quote')}>
          Quote Calculator
        </button>
        {canManageSettings ? (
          <>
            <button className={tab === 'paperRates' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('paperRates')}>
              Paper Rates
            </button>
            <button className={tab === 'costProfiles' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('costProfiles')}>
              Cost Profiles
            </button>
          </>
        ) : null}
      </div>

      <div className="calculator-shell">
      {canManageSettings && tab === 'paperRates' ? (
      <>
        {paperRatesMode === 'form' ? (
          <section className="card form-card">
            <SectionTitle
              title={paperRateEditingId ? 'Edit Paper Rate' : 'New Paper Rate'}
              subtitle="Set the live ton pricing and paper specification the quote calculator will use."
              action={
                <button
                  className="ghost-button"
                  onClick={() => {
                    onResetPaperRate();
                    setPaperRatesMode('list');
                  }}
                >
                  Back to Paper Rates
                </button>
              }
            />
            {paperRateMessage ? <div className="message-strip">{paperRateMessage}</div> : null}
            <div className="form-grid">
              <label><span>Name</span><input value={paperRateForm.name} onChange={(event) => setPaperRateForm({ ...paperRateForm, name: event.target.value })} /></label>
              <label>
                <span>Supplier</span>
                <select
                  value={paperRateForm.supplierId}
                  onChange={(event) => setPaperRateForm({ ...paperRateForm, supplierId: event.target.value })}
                >
                  <option value="">Select supplier</option>
                  {suppliers.filter((supplier) => supplier.active).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </label>
              <label><span>Paper type</span><input value={paperRateForm.paperType} onChange={(event) => setPaperRateForm({ ...paperRateForm, paperType: event.target.value })} /></label>
              <label><span>GSM</span><input value={paperRateForm.gsm} onChange={(event) => setPaperRateForm({ ...paperRateForm, gsm: event.target.value })} /></label>
              <label><span>Price per ton</span><input type="number" min="0" step="0.01" value={paperRateForm.pricePerTon} onChange={(event) => setPaperRateForm({ ...paperRateForm, pricePerTon: event.target.value })} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={paperRateForm.active} onChange={(event) => setPaperRateForm({ ...paperRateForm, active: event.target.checked })} />Active</label>
              <label className="full-span"><span>Notes</span><textarea value={paperRateForm.notes} onChange={(event) => setPaperRateForm({ ...paperRateForm, notes: event.target.value })} /></label>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={onSavePaperRate}>{paperRateEditingId ? 'Save Changes' : 'Save Paper Rate'}</button>
              <button
                className="ghost-button"
                onClick={() => {
                  onResetPaperRate();
                  setPaperRatesMode('list');
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <SectionTitle
              title="Paper Rates"
              subtitle={`${filteredPaperRates.length} rate(s) shown`}
              action={
                <button
                  className="secondary-button"
                  onClick={() => {
                    onResetPaperRate();
                    setPaperRatesMode('form');
                  }}
                >
                  Add New Paper Rate
                </button>
              }
            />
            <div className="filters-grid">
              <label><span>Search</span><input value={paperRateFilters.search} onChange={(event) => setPaperRateFilters({ ...paperRateFilters, search: event.target.value })} /></label>
              <label><span>Active</span><select value={paperRateFilters.active} onChange={(event) => setPaperRateFilters({ ...paperRateFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
            </div>
            {filteredPaperRates.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Supplier</th><th>Type</th><th>GSM</th><th>Price/Ton</th><th>Actions</th></tr></thead>
                  <tbody>{filteredPaperRates.map((rate) => <tr key={rate.id}><td>{rate.name}</td><td>{rate.supplierName || 'Not linked'}</td><td>{rate.paperType}</td><td>{rate.gsm}</td><td>{formatNumber(rate.pricePerTon, 2)}</td><td><button className="table-button" onClick={() => { onEditPaperRate(rate); setPaperRatesMode('form'); }}>Edit</button></td></tr>)}</tbody>
                </table>
              </div>
            ) : <EmptyState title="No paper rates yet" body="Add live paper prices here so the calculator pulls the right ton rate." />}
          </section>
        )}
      </>
      ) : null}

      {canManageSettings && tab === 'costProfiles' ? (
      <>
        {costProfilesMode === 'form' ? (
          <section className="card form-card">
            <SectionTitle
              title={costProfileEditingId ? 'Edit Cost Profile' : 'New Cost Profile'}
              subtitle="Set the internal cost variables that drive quotes for ops and sales. These values stay hidden from non-admin users."
              action={
                <button
                  className="ghost-button"
                  onClick={() => {
                    onResetCostProfile();
                    setCostProfilesMode('list');
                  }}
                >
                  Back to Cost Profiles
                </button>
              }
            />
            {costProfileMessage ? <div className="message-strip">{costProfileMessage}</div> : null}
            <div className="calculator-profile-grid">
              <label className="full-span"><strong>Core Settings</strong></label>
              <label><span>Name</span><input value={costProfileForm.name} onChange={(event) => setCostProfileForm({ ...costProfileForm, name: event.target.value })} /></label>
              <label><span>Wastage %</span><input type="number" min="0" step="0.1" value={costProfileForm.wastagePercent} onChange={(event) => setCostProfileForm({ ...costProfileForm, wastagePercent: event.target.value })} /></label>
              <label><span>Default margin %</span><input type="number" min="0" step="0.1" value={costProfileForm.defaultMarginPercent} onChange={(event) => setCostProfileForm({ ...costProfileForm, defaultMarginPercent: event.target.value })} /></label>
              <label className="full-span"><strong>Glue & Handle Costs</strong></label>
              <label><span>Base glue cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.baseGlueCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, baseGlueCostPerBag: event.target.value })} /></label>
              <label><span>Hot melt cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.hotMeltCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, hotMeltCostPerBag: event.target.value })} /></label>
              <label><span>Flat handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.flatHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, flatHandleCostPerBag: event.target.value })} /></label>
              <label><span>Rope handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.ropeHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, ropeHandleCostPerBag: event.target.value })} /></label>
              <label><span>Roll handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.rollHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, rollHandleCostPerBag: event.target.value })} /></label>
              <label className="full-span"><strong>Printing Costs</strong></label>
              <label><span>Screen setup cost</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintSetupCost} onChange={(event) => setCostProfileForm({ ...costProfileForm, screenPrintSetupCost: event.target.value })} /></label>
              <label><span>Screen print cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintCostPerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, screenPrintCostPerColor: event.target.value })} /></label>
              <label><span>Flexo ink / 1000 bags / color</span><input type="number" min="0" step="0.01" value={costProfileForm.flexoInkCostPer1000PerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, flexoInkCostPer1000PerColor: event.target.value })} /></label>
              <label><span>Plate cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.plateCostPerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, plateCostPerColor: event.target.value })} /></label>
              <label><span>Flexo threshold quantity</span><input type="number" min="0" value={costProfileForm.flexoThresholdQty} onChange={(event) => setCostProfileForm({ ...costProfileForm, flexoThresholdQty: event.target.value })} /></label>
              <label className="full-span"><strong>Labour, Packaging & Transport</strong></label>
              <label><span>Labour cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.labourCostPer1000} onChange={(event) => setCostProfileForm({ ...costProfileForm, labourCostPer1000: event.target.value })} /></label>
              <label><span>Packaging cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.packagingCostPer1000} onChange={(event) => setCostProfileForm({ ...costProfileForm, packagingCostPer1000: event.target.value })} /></label>
              <label><span>Transport cost / job</span><input type="number" min="0" step="0.01" value={costProfileForm.transportCostPerJob} onChange={(event) => setCostProfileForm({ ...costProfileForm, transportCostPerJob: event.target.value })} /></label>
              <label className="full-span"><strong>Bag Formula Allowances</strong></label>
              <label><span>Side seam allowance mm</span><input type="number" min="0" value={costProfileForm.sideSeamAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, sideSeamAllowanceMm: event.target.value })} /></label>
              <label><span>Top fold allowance mm</span><input type="number" min="0" value={costProfileForm.topFoldAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, topFoldAllowanceMm: event.target.value })} /></label>
              <label><span>Bottom fold allowance mm</span><input type="number" min="0" value={costProfileForm.bottomFoldAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, bottomFoldAllowanceMm: event.target.value })} /></label>
              <label className="checkbox-row"><input type="checkbox" checked={costProfileForm.active} onChange={(event) => setCostProfileForm({ ...costProfileForm, active: event.target.checked })} />Active</label>
              <label className="full-span"><span>Notes</span><textarea value={costProfileForm.notes} onChange={(event) => setCostProfileForm({ ...costProfileForm, notes: event.target.value })} /></label>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={onSaveCostProfile}>{costProfileEditingId ? 'Save Changes' : 'Save Cost Profile'}</button>
              <button
                className="ghost-button"
                onClick={() => {
                  onResetCostProfile();
                  setCostProfilesMode('list');
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : (
          <section className="card">
            <SectionTitle
              title="Cost Profiles"
              subtitle={`${filteredCostProfiles.length} profile(s) shown`}
              action={
                <button
                  className="secondary-button"
                  onClick={() => {
                    onResetCostProfile();
                    setCostProfilesMode('form');
                  }}
                >
                  Add New Cost Profile
                </button>
              }
            />
            <div className="filters-grid">
              <label><span>Search</span><input value={costProfileFilters.search} onChange={(event) => setCostProfileFilters({ ...costProfileFilters, search: event.target.value })} /></label>
              <label><span>Active</span><select value={costProfileFilters.active} onChange={(event) => setCostProfileFilters({ ...costProfileFilters, active: event.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
            </div>
            {filteredCostProfiles.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Profile</th><th>Wastage</th><th>Margin</th><th>Flexo threshold</th><th>Actions</th></tr></thead>
                  <tbody>{filteredCostProfiles.map((profile) => <tr key={profile.id}><td>{profile.name}</td><td>{formatNumber(profile.wastagePercent, 2)}%</td><td>{formatNumber(profile.defaultMarginPercent, 2)}%</td><td>{formatNumber(profile.flexoThresholdQty)}</td><td><button className="table-button" onClick={() => { onEditCostProfile(profile); setCostProfilesMode('form'); }}>Edit</button></td></tr>)}</tbody>
                </table>
              </div>
            ) : <EmptyState title="No cost profiles yet" body="Add at least one cost profile so the quote calculator can price bags properly." />}
          </section>
        )}
      </>
      ) : null}

      {tab === 'quote' ? (
      <section className="card calculator-quote-card">
        <SectionTitle title="Quote Calculator" subtitle={canManageSettings ? 'You can review both internal cost variables and final quote output here.' : 'This calculator uses admin-managed cost settings and only shows the final customer quote output.'} />
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
              {canManageSettings ? (
                <div className="summary-chip"><span>Margin applied</span><strong>{formatNumber(marginPercent, 2)}%</strong></div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="calculator-results-grid">
          {canManageSettings ? (
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
          {canManageSettings ? (
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
            <SectionTitle title={canManageSettings ? 'Quote Output' : 'Quote Price'} />
            <div className="ranking-list">
              {canManageSettings ? (
                <div className="ranking-item"><span>Unit cost</span><strong>{formatNumber(unitCost, 4)}</strong></div>
              ) : null}
              <div className="ranking-item"><span>Quoted unit price</span><strong>{formatNumber(quotedUnitPrice, 4)}</strong></div>
              <div className="ranking-item"><span>Total quote</span><strong>{formatNumber(quotedTotal, 2)}</strong></div>
              {canManageSettings ? (
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
      ) : null}
      </div>
    </>
  );
}
