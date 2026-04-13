import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  CostProfile,
  CostProfileFilters,
  CostProfileFormState,
  PaperRate,
  PaperRateFilters,
  PaperRateFormState,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CostInputsPageProps {
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
}

type CostInputsTab = 'paperRates' | 'costProfiles';
type PaperRatesMode = 'list' | 'form';
type CostProfilesMode = 'list' | 'form';

export function CostInputsPage({
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
}: CostInputsPageProps) {
  const [tab, setTab] = useState<CostInputsTab>('paperRates');
  const [paperRatesMode, setPaperRatesMode] = useState<PaperRatesMode>('list');
  const [costProfilesMode, setCostProfilesMode] = useState<CostProfilesMode>('list');

  return (
    <>
      <SectionTitle
        title="Cost Inputs"
        subtitle="Maintain internal rate cards and cost assumptions here. The sales calculator consumes these values but does not expose them."
      />

      <div className="calculator-tabs">
        <button className={tab === 'paperRates' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('paperRates')}>
          Paper Rates
        </button>
        <button className={tab === 'costProfiles' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('costProfiles')}>
          Cost Profiles
        </button>
      </div>

      <div className="calculator-shell">
        {tab === 'paperRates' ? (
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

        {tab === 'costProfiles' ? (
          <>
            {costProfilesMode === 'form' ? (
              <section className="card form-card">
                <SectionTitle
                  title={costProfileEditingId ? 'Edit Cost Profile' : 'New Cost Profile'}
                  subtitle="Set internal manufacturing assumptions and allowances used by the quote engine."
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

        <section className="card">
          <SectionTitle
            title="Internal Costing Notes"
            subtitle="Use this section for live rate maintenance. Sales users should work from the Calculator, not from these inputs."
          />
          <div className="ranking-list">
            <div className="ranking-item"><span>Active paper rates</span><strong>{paperRates.filter((rate) => rate.active).length}</strong></div>
            <div className="ranking-item"><span>Active cost profiles</span><strong>{costProfiles.filter((profile) => profile.active).length}</strong></div>
          </div>
        </section>
      </div>
    </>
  );
}
