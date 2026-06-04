/**
 * Cost Inputs page — Materials + Cost Profiles.
 *
 * Phase 128.1 (2026-06-04): rewritten on top of the unified `MaterialRate`
 * concept. Single table for every cost master: paper, glue, tape, ink,
 * anything. White-label ready — categories are free strings, paper-only
 * fields are optional and only appear when category === 'Paper'.
 *
 * Old `PaperRate` + `ConsumableRate` tables / forms have been removed
 * from this page. The calculator engine still reads paper-specific
 * fields off the MaterialRate via category filter.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  CostProfile,
  CostProfileFilters,
  CostProfileFormState,
  MATERIAL_RATE_CATEGORIES,
  MATERIAL_RATE_UNITS,
  MaterialRate,
  MaterialRateFilters,
  MaterialRateFormState,
  MaterialRateUnit,
  PaperForm,
  PaperRegion,
  PaperUseCase,
  PAPER_REGIONS,
  PAPER_USE_CASES,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CostInputsPageProps {
  suppliers: Supplier[];
  // Phase 128.1 — Unified material rate plumbing.
  materialRates: MaterialRate[];
  materialRateForm: MaterialRateFormState;
  setMaterialRateForm: (value: MaterialRateFormState) => void;
  materialRateEditingId: string | null;
  materialRateMessage: string;
  onSaveMaterialRate: () => void;
  onResetMaterialRate: () => void;
  materialRateFilters: MaterialRateFilters;
  setMaterialRateFilters: (value: MaterialRateFilters) => void;
  filteredMaterialRates: MaterialRate[];
  onEditMaterialRate: (rate: MaterialRate) => void;
  // Cost profiles (unchanged from prior version).
  costProfiles: CostProfile[];
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

type CostInputsTab = 'materials' | 'costProfiles';
type MaterialsMode = 'list' | 'pickCategory' | 'form';
type CostProfilesMode = 'list' | 'form';

export function CostInputsPage({
  suppliers,
  materialRates: _materialRates,
  materialRateForm,
  setMaterialRateForm,
  materialRateEditingId,
  materialRateMessage,
  onSaveMaterialRate,
  onResetMaterialRate,
  materialRateFilters,
  setMaterialRateFilters,
  filteredMaterialRates,
  onEditMaterialRate,
  costProfiles: _costProfiles,
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
  void _materialRates;
  void _costProfiles;
  const [tab, setTab] = useState<CostInputsTab>('materials');
  const [materialsMode, setMaterialsMode] = useState<MaterialsMode>('list');
  const [costProfilesMode, setCostProfilesMode] = useState<CostProfilesMode>('list');

  const isPaper = materialRateForm.category === 'Paper';

  /** Sorted display list: Paper rows first, then alphabetical by category + label. */
  const sortedMaterialRates = useMemo(() => {
    return [...filteredMaterialRates].sort((a, b) => {
      if (a.category === 'Paper' && b.category !== 'Paper') return -1;
      if (a.category !== 'Paper' && b.category === 'Paper') return 1;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      const al = a.publicLabel || a.name || '';
      const bl = b.publicLabel || b.name || '';
      return al.localeCompare(bl);
    });
  }, [filteredMaterialRates]);

  // ────────────────── Material rate form sections ──────────────────
  // Same 4-section pattern as before, but PAPER fields only render
  // when category === 'Paper'. White-label customers see a clean form.
  const materialRateSections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'What staff see (PUBLIC)',
      subtitle: 'The only label non-admin staff see in the calculator. Generic descriptor — never the supplier brand.',
      missingRequired: [
        ...(materialRateForm.publicLabel.trim() ? [] : ['Public label']),
        ...(materialRateForm.category ? [] : ['Category']),
        ...(materialRateForm.unit ? [] : ['Unit']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Public label <RequiredMarker /></span>
            <input
              placeholder={isPaper ? 'e.g. 70gsm Unbleached Kraft' : 'e.g. Hot Melt Glue, Brown PVC Tape 48mm'}
              value={materialRateForm.publicLabel}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, publicLabel: e.target.value })}
            />
          </label>
          <label>
            <span>Category <RequiredMarker /></span>
            <input
              list="material-rate-categories"
              placeholder="Paper / Glue / Tape / ..."
              value={materialRateForm.category}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, category: e.target.value })}
            />
            <datalist id="material-rate-categories">
              {MATERIAL_RATE_CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label>
            <span>Unit <RequiredMarker /></span>
            <select
              value={materialRateForm.unit}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, unit: e.target.value as MaterialRateUnit | '' })}
            >
              <option value="">— pick unit —</option>
              {MATERIAL_RATE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={materialRateForm.active}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, active: e.target.checked })}
            />Active
          </label>
        </div>
      ),
    },
    // Paper-specific section — only renders when category is 'Paper'.
    ...(isPaper ? [{
      key: 'paper-specific',
      title: 'Paper specifics',
      subtitle: 'Fields only relevant when this material is paper.',
      body: (
        <div className="form-grid">
          <label><span>GSM</span><input value={materialRateForm.gsm} onChange={(e) => setMaterialRateForm({ ...materialRateForm, gsm: e.target.value })} /></label>
          <label><span>Material descriptor</span><input placeholder="e.g. Unbleached Kraft" value={materialRateForm.paperType} onChange={(e) => setMaterialRateForm({ ...materialRateForm, paperType: e.target.value })} /></label>
          <label>
            <span>Form</span>
            <select
              value={materialRateForm.form}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, form: e.target.value as PaperForm | '' })}
            >
              <option value="">— pick form —</option>
              <option value="Reels">Reels</option>
              <option value="Sheets">Sheets</option>
            </select>
          </label>
          <label className="full-span">
            <span>Suitable for (tick every job type this paper could be used for)</span>
            <p style={{ margin: '2px 0 6px', fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>
              Suitability tag, not destination. The actual end-use is decided when you issue stock for a job.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '6px 0' }}>
              {PAPER_USE_CASES.map((u) => {
                const selected = materialRateForm.useCases.includes(u);
                return (
                  <button
                    type="button"
                    key={u}
                    onClick={() => {
                      const next = selected
                        ? materialRateForm.useCases.filter((x: PaperUseCase) => x !== u)
                        : [...materialRateForm.useCases, u];
                      setMaterialRateForm({ ...materialRateForm, useCases: next });
                    }}
                    style={{
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      borderRadius: 999,
                      border: selected ? '2px solid #22a865' : '1px solid var(--jp-divider, #d1d5db)',
                      background: selected ? 'rgba(34,168,101,0.12)' : 'var(--jp-paper, #fff)',
                      color: selected ? '#065f46' : 'var(--jp-ink-2, #334155)',
                      cursor: 'pointer',
                    }}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </label>
        </div>
      ),
    } as FormWizardSection] : []),
    {
      key: 'supplier-private',
      title: 'Supplier (PRIVATE — admin only)',
      subtitle: 'Hidden from staff. They only ever see the public label above.',
      body: (
        <div className="form-grid">
          <label><span>Internal nickname</span><input placeholder="For your reference only" value={materialRateForm.name} onChange={(e) => setMaterialRateForm({ ...materialRateForm, name: e.target.value })} /></label>
          <label>
            <span>Supplier</span>
            <select
              value={materialRateForm.supplierId}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, supplierId: e.target.value })}
            >
              <option value="">Select supplier</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label><span>Supplier product code</span><input value={materialRateForm.productCode} onChange={(e) => setMaterialRateForm({ ...materialRateForm, productCode: e.target.value })} /></label>
          <label>
            <span>Dispatch region</span>
            <select
              value={materialRateForm.region}
              onChange={(e) => setMaterialRateForm({ ...materialRateForm, region: e.target.value as PaperRegion | '' })}
            >
              <option value="">— pick region —</option>
              {PAPER_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'DBN' ? 'Durban (DBN)' : r === 'JHB' ? 'Joburg (JHB)' : r === 'CT' ? 'Cape Town (CT)' : r}
                </option>
              ))}
            </select>
          </label>
          <label><span>Contract valid from</span><input type="date" value={materialRateForm.validFrom} onChange={(e) => setMaterialRateForm({ ...materialRateForm, validFrom: e.target.value })} /></label>
          <label><span>Contract valid to</span><input type="date" value={materialRateForm.validTo} onChange={(e) => setMaterialRateForm({ ...materialRateForm, validTo: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'pricing-private',
      title: 'Pricing (PRIVATE — admin only)',
      subtitle: 'Cost is what you pay the supplier. Charge is what the calculator uses. The gap is your margin.',
      missingRequired: [
        ...(materialRateForm.costPerUnit && Number(materialRateForm.costPerUnit) > 0 ? [] : ['Cost per unit']),
        ...(materialRateForm.chargePerUnit && Number(materialRateForm.chargePerUnit) > 0 ? [] : ['Charge per unit']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Cost per {materialRateForm.unit || 'unit'} (R) <RequiredMarker /></span>
            <input type="number" min="0" step="0.0001" placeholder="what you pay supplier" value={materialRateForm.costPerUnit} onChange={(e) => setMaterialRateForm({ ...materialRateForm, costPerUnit: e.target.value })} />
          </label>
          <label>
            <span>Charge per {materialRateForm.unit || 'unit'} (R) <RequiredMarker /></span>
            <input type="number" min="0" step="0.0001" placeholder="what calculator charges" value={materialRateForm.chargePerUnit} onChange={(e) => setMaterialRateForm({ ...materialRateForm, chargePerUnit: e.target.value })} />
          </label>
          {materialRateForm.costPerUnit && materialRateForm.chargePerUnit && Number(materialRateForm.chargePerUnit) > 0 && Number(materialRateForm.costPerUnit) > 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '8px 12px', borderRadius: 6, background: 'rgba(34,168,101,0.08)', border: '1px solid #22a865', fontSize: 13 }}>
              <strong>Margin:</strong>{' '}R{(Number(materialRateForm.chargePerUnit) - Number(materialRateForm.costPerUnit)).toLocaleString(undefined, { maximumFractionDigits: 4 })} per {materialRateForm.unit || 'unit'}
              {' '}({((Number(materialRateForm.chargePerUnit) / Number(materialRateForm.costPerUnit) - 1) * 100).toFixed(1)}% markup)
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={materialRateForm.notes} onChange={(e) => setMaterialRateForm({ ...materialRateForm, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  // ────────────────── Cost profile form sections ──────────────────
  // Unchanged from prior version.
  const costProfileSections: FormWizardSection[] = [
    {
      key: 'core',
      title: 'Core settings',
      subtitle: 'Profile name and the headline assumptions used everywhere.',
      missingRequired: [
        ...(costProfileForm.name.trim() ? [] : ['Name']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Name <RequiredMarker /></span><input value={costProfileForm.name} onChange={(e) => setCostProfileForm({ ...costProfileForm, name: e.target.value })} /></label>
          <label><span>Wastage %</span><input type="number" min="0" step="0.1" value={costProfileForm.wastagePercent} onChange={(e) => setCostProfileForm({ ...costProfileForm, wastagePercent: e.target.value })} /></label>
          <label><span>Default margin %</span><input type="number" min="0" step="0.1" value={costProfileForm.defaultMarginPercent} onChange={(e) => setCostProfileForm({ ...costProfileForm, defaultMarginPercent: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={costProfileForm.active} onChange={(e) => setCostProfileForm({ ...costProfileForm, active: e.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'glue',
      title: 'Glue & handle costs',
      subtitle: 'Per-bag adhesive and handle component costs.',
      body: (
        <div className="form-grid">
          <label><span>Base glue cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.baseGlueCostPerBag} onChange={(e) => setCostProfileForm({ ...costProfileForm, baseGlueCostPerBag: e.target.value })} /></label>
          <label><span>Hot melt cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.hotMeltCostPerBag} onChange={(e) => setCostProfileForm({ ...costProfileForm, hotMeltCostPerBag: e.target.value })} /></label>
          <label><span>Flat handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.flatHandleCostPerBag} onChange={(e) => setCostProfileForm({ ...costProfileForm, flatHandleCostPerBag: e.target.value })} /></label>
          <label><span>Rope handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.ropeHandleCostPerBag} onChange={(e) => setCostProfileForm({ ...costProfileForm, ropeHandleCostPerBag: e.target.value })} /></label>
          <label><span>Roll handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.rollHandleCostPerBag} onChange={(e) => setCostProfileForm({ ...costProfileForm, rollHandleCostPerBag: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'printing',
      title: 'Printing costs',
      subtitle: 'Screen, plate, ink, and threshold for switching to flexo.',
      body: (
        <div className="form-grid">
          <label><span>Screen setup cost</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintSetupCost} onChange={(e) => setCostProfileForm({ ...costProfileForm, screenPrintSetupCost: e.target.value })} /></label>
          <label><span>Screen print cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintCostPerColor} onChange={(e) => setCostProfileForm({ ...costProfileForm, screenPrintCostPerColor: e.target.value })} /></label>
          <label><span>Flexo ink / 1000 bags / color</span><input type="number" min="0" step="0.01" value={costProfileForm.flexoInkCostPer1000PerColor} onChange={(e) => setCostProfileForm({ ...costProfileForm, flexoInkCostPer1000PerColor: e.target.value })} /></label>
          <label><span>Plate cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.plateCostPerColor} onChange={(e) => setCostProfileForm({ ...costProfileForm, plateCostPerColor: e.target.value })} /></label>
          {/* Phase 132.3 — Plate rates per cm² (the engine uses these
              over the flat "plate cost / color" above when set). */}
          <label>
            <span title="What we PAY for plates per cm² (private)">Plate COST / cm² (R)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.55"
              value={costProfileForm.platePerSqCmCost}
              onChange={(e) => setCostProfileForm({ ...costProfileForm, platePerSqCmCost: e.target.value })}
            />
          </label>
          <label>
            <span title="Default plate CHARGE per cm² on quotes — can be overridden per line">Plate CHARGE / cm² (R)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="2.65"
              value={costProfileForm.platePerSqCmCharge}
              onChange={(e) => setCostProfileForm({ ...costProfileForm, platePerSqCmCharge: e.target.value })}
            />
          </label>
          {/* Phase 132.8 — Screen-print plate fee formula. The flexo
              plate cost above is area-based; screen-print is flat. */}
          <label>
            <span title="Screen-print plate base fee (one-off per design)">Screen-print BASE fee (R)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="450"
              value={costProfileForm.screenPrintPlateBaseFee}
              onChange={(e) => setCostProfileForm({ ...costProfileForm, screenPrintPlateBaseFee: e.target.value })}
            />
          </label>
          <label>
            <span title="Screen-print plate fee per colour per side. Engine multiplies by (colours × sides)">Screen-print / colour / side (R)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="300"
              value={costProfileForm.screenPrintPlatePerColorPerSide}
              onChange={(e) => setCostProfileForm({ ...costProfileForm, screenPrintPlatePerColorPerSide: e.target.value })}
            />
          </label>
          <label><span>Flexo threshold quantity</span><input type="number" min="0" value={costProfileForm.flexoThresholdQty} onChange={(e) => setCostProfileForm({ ...costProfileForm, flexoThresholdQty: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'labour',
      title: 'Labour, packaging & transport',
      subtitle: 'Per-1000 and per-job overheads applied by the calculator.',
      body: (
        <div className="form-grid">
          <label><span>Labour cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.labourCostPer1000} onChange={(e) => setCostProfileForm({ ...costProfileForm, labourCostPer1000: e.target.value })} /></label>
          <label><span>Packaging cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.packagingCostPer1000} onChange={(e) => setCostProfileForm({ ...costProfileForm, packagingCostPer1000: e.target.value })} /></label>
          <label><span>Transport cost / job</span><input type="number" min="0" step="0.01" value={costProfileForm.transportCostPerJob} onChange={(e) => setCostProfileForm({ ...costProfileForm, transportCostPerJob: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'allowances',
      title: 'Bag formula allowances',
      subtitle: 'Seam and fold allowances used when sizing the cut sheet.',
      body: (
        <div className="form-grid">
          <label><span>Side seam allowance mm</span><input type="number" min="0" value={costProfileForm.sideSeamAllowanceMm} onChange={(e) => setCostProfileForm({ ...costProfileForm, sideSeamAllowanceMm: e.target.value })} /></label>
          <label><span>Top fold allowance mm</span><input type="number" min="0" value={costProfileForm.topFoldAllowanceMm} onChange={(e) => setCostProfileForm({ ...costProfileForm, topFoldAllowanceMm: e.target.value })} /></label>
          <label><span>Bottom fold allowance mm</span><input type="number" min="0" value={costProfileForm.bottomFoldAllowanceMm} onChange={(e) => setCostProfileForm({ ...costProfileForm, bottomFoldAllowanceMm: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={costProfileForm.notes} onChange={(e) => setCostProfileForm({ ...costProfileForm, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="calculator-tabs">
        <button className={tab === 'materials' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('materials')}>
          Materials
        </button>
        <button className={tab === 'costProfiles' ? 'tab-button active' : 'tab-button'} onClick={() => setTab('costProfiles')}>
          Cost Profiles
        </button>
      </div>

      <div className="calculator-shell">
        {tab === 'materials' ? (
          <>
            {materialsMode === 'form' ? (
              <FormWizard
                title={materialRateEditingId ? 'Edit Material' : 'New Material'}
                subtitle={isPaper
                  ? 'Paper rate. Public label + GSM + suitable-for tags. Staff only see the public label.'
                  : `${materialRateForm.category || 'Material'} cost master. Staff only see the public label.`}
                message={materialRateMessage || undefined}
                sections={materialRateSections}
                onSave={() => { onSaveMaterialRate(); setMaterialsMode('list'); }}
                onCancel={() => { onResetMaterialRate(); setMaterialsMode('list'); }}
                isEditing={!!materialRateEditingId}
                saveLabel="Save Material"
              />
            ) : materialsMode === 'pickCategory' ? (
              <section className="card">
                <SectionTitle
                  title="What kind of material?"
                  subtitle="Pick one. The form adapts to what's relevant."
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                  {MATERIAL_RATE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onResetMaterialRate();
                        // Seed the new form with the picked category.
                        setMaterialRateForm({
                          ...materialRateForm,
                          name: '',
                          publicLabel: '',
                          category: cat,
                          unit: cat === 'Paper' ? 'ton' : '',
                          supplierId: '',
                          productCode: '',
                          region: '',
                          costPerUnit: '',
                          chargePerUnit: '',
                          validFrom: '',
                          validTo: '',
                          notes: '',
                          active: true,
                          gsm: '',
                          paperType: cat === 'Paper' ? '' : '',
                          form: '',
                          useCases: [],
                        });
                        setMaterialsMode('form');
                      }}
                      style={{
                        border: '1px solid var(--jp-divider, #e5e7eb)',
                        borderRadius: 10,
                        padding: '18px 16px',
                        background: 'var(--jp-paper, #fff)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>{cat}</strong>
                      <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>
                        {cat === 'Paper' ? 'Per-ton, GSM, suitable-for tags' :
                         cat === 'Glue' ? 'Per kg / L / drum' :
                         cat === 'Tape' ? 'Per roll / case' :
                         cat === 'Ink' ? 'Per kg / L' :
                         cat === 'Stitching Wire' ? 'Per kg / case' :
                         cat === 'Solvent' ? 'Per L / drum' :
                         'Pick a unit and price'}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button className="ghost-button" onClick={() => setMaterialsMode('list')}>← Cancel</button>
                </div>
              </section>
            ) : (
              <section className="card">
                <SectionTitle
                  title="Materials"
                  subtitle={`${sortedMaterialRates.length} material${sortedMaterialRates.length === 1 ? '' : 's'} shown`}
                  action={
                    <button className="secondary-button" onClick={() => setMaterialsMode('pickCategory')}>
                      + Add Material
                    </button>
                  }
                />
                <div className="filters-grid">
                  <label>
                    <span>Category</span>
                    <select
                      value={materialRateFilters.category}
                      onChange={(e) => setMaterialRateFilters({ ...materialRateFilters, category: e.target.value })}
                    >
                      <option value="all">All</option>
                      {MATERIAL_RATE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Search</span>
                    <input
                      placeholder="label, supplier, category..."
                      value={materialRateFilters.search}
                      onChange={(e) => setMaterialRateFilters({ ...materialRateFilters, search: e.target.value })}
                    />
                  </label>
                  <label>
                    <span>Active</span>
                    <select
                      value={materialRateFilters.active}
                      onChange={(e) => setMaterialRateFilters({ ...materialRateFilters, active: e.target.value })}
                    >
                      <option value="all">All</option>
                      <option value="yes">Active</option>
                      <option value="no">Inactive</option>
                    </select>
                  </label>
                </div>
                {sortedMaterialRates.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Public label</th>
                          <th>Unit</th>
                          <th title="Private — admin only">Supplier</th>
                          <th title="Private — admin only">Region</th>
                          <th title="Private — admin only">Cost</th>
                          <th title="Private — admin only">Charge</th>
                          <th title="Private — admin only">Margin</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMaterialRates.map((m) => {
                          const charge = m.chargePerUnit ?? m.costPerUnit;
                          const margin = charge - m.costPerUnit;
                          const marginPct = m.costPerUnit > 0 ? (margin / m.costPerUnit) * 100 : 0;
                          const paper = m.category === 'Paper';
                          return (
                            <tr key={m.id}>
                              <td>
                                <span style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: paper ? '#dbeafe' : '#fef3c7',
                                  color: paper ? '#1e40af' : '#92400e',
                                  fontWeight: 700,
                                  letterSpacing: '0.05em',
                                }}>{m.category.toUpperCase()}</span>
                              </td>
                              <td><strong>{m.publicLabel || m.name}</strong></td>
                              <td>{m.unit || '—'}</td>
                              <td style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 12 }}>{m.supplierName || '—'}</td>
                              <td style={{ fontSize: 12 }}>{m.region || '—'}</td>
                              <td>R{formatNumber(m.costPerUnit, paper ? 0 : 2)}</td>
                              <td><strong>R{formatNumber(charge, paper ? 0 : 2)}</strong></td>
                              <td style={{ color: margin > 0 ? '#22a865' : margin < 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                {margin === 0 ? '—' : `R${formatNumber(margin, paper ? 0 : 2)} (${marginPct.toFixed(1)}%)`}
                              </td>
                              <td>
                                <button
                                  className="table-button"
                                  onClick={() => { onEditMaterialRate(m); setMaterialsMode('form'); }}
                                >Edit</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No materials yet" body="Add paper, glue, tape, ink, or any other input. Tap + Add Material above." />}
              </section>
            )}
          </>
        ) : null}

        {tab === 'costProfiles' ? (
          <>
            {costProfilesMode === 'form' ? (
              <FormWizard
                title={costProfileEditingId ? 'Edit Cost Profile' : 'New Cost Profile'}
                subtitle="Per-bag manufacturing assumptions used by the quote engine."
                message={costProfileMessage || undefined}
                sections={costProfileSections}
                onSave={() => { onSaveCostProfile(); setCostProfilesMode('list'); }}
                onCancel={() => { onResetCostProfile(); setCostProfilesMode('list'); }}
                isEditing={!!costProfileEditingId}
                saveLabel="Save Cost Profile"
              />
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
                  <label><span>Search</span><input value={costProfileFilters.search} onChange={(e) => setCostProfileFilters({ ...costProfileFilters, search: e.target.value })} /></label>
                  <label><span>Active</span><select value={costProfileFilters.active} onChange={(e) => setCostProfileFilters({ ...costProfileFilters, active: e.target.value })}><option value="all">All</option><option value="yes">Active</option><option value="no">Inactive</option></select></label>
                </div>
                {filteredCostProfiles.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Name</th><th>Wastage %</th><th>Default margin %</th><th>Active</th><th>Actions</th></tr></thead>
                      <tbody>
                        {filteredCostProfiles.map((profile) => (
                          <tr key={profile.id}>
                            <td>{profile.name}</td>
                            <td>{profile.wastagePercent}%</td>
                            <td>{profile.defaultMarginPercent}%</td>
                            <td>{profile.active ? 'Yes' : 'No'}</td>
                            <td><button className="table-button" onClick={() => { onEditCostProfile(profile); setCostProfilesMode('form'); }}>Edit</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No cost profiles yet" body="Set up per-bag manufacturing assumptions." />}
              </section>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}
