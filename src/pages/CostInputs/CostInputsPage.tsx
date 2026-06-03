import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  CONSUMABLE_CATEGORIES,
  CONSUMABLE_UNITS,
  ConsumableCategory,
  ConsumableRate,
  ConsumableRateFilters,
  ConsumableRateFormState,
  ConsumableUnit,
  CostProfile,
  CostProfileFilters,
  CostProfileFormState,
  PaperRate,
  PaperRateFilters,
  PaperRateFormState,
  PaperForm,
  PaperRegion,
  PAPER_REGIONS,
  PAPER_USE_CASES,
  Supplier,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CostInputsPageProps {
  suppliers: Supplier[];
  paperRates: PaperRate[];
  consumableRates: ConsumableRate[];
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
  // Phase 127.1 — Consumable rate plumbing.
  consumableRateForm: ConsumableRateFormState;
  setConsumableRateForm: (value: ConsumableRateFormState) => void;
  consumableRateEditingId: string | null;
  consumableRateMessage: string;
  onSaveConsumableRate: () => void;
  onResetConsumableRate: () => void;
  consumableRateFilters: ConsumableRateFilters;
  setConsumableRateFilters: (value: ConsumableRateFilters) => void;
  filteredConsumableRates: ConsumableRate[];
  onEditConsumableRate: (rate: ConsumableRate) => void;
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
type MaterialsMode = 'list' | 'pickCategory' | 'paperForm' | 'consumableForm';
type CostProfilesMode = 'list' | 'form';

// Phase 127.2 — A "material category" the user picks first when adding.
// "Paper" routes to the paper form; everything else routes to consumable.
type MaterialCategory = 'Paper' | ConsumableCategory;
const MATERIAL_CATEGORIES: MaterialCategory[] = ['Paper', ...CONSUMABLE_CATEGORIES];

/** Row in the unified Materials list. Wraps either a PaperRate or a
 *  ConsumableRate, with a common shape the table can render. */
interface UnifiedMaterialRow {
  id: string;
  category: MaterialCategory;
  publicLabel: string;
  unit: string;
  supplierName: string;
  region: string;
  cost: number;
  charge: number;
  active: boolean;
  /** Source so the Edit button knows which form to open. */
  source: 'paper' | 'consumable';
  /** The underlying record for dispatching Edit. */
  paperRate?: PaperRate;
  consumableRate?: ConsumableRate;
}

export function CostInputsPage({
  suppliers,
  paperRates,
  consumableRates: _consumableRatesRaw,
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
  consumableRateForm,
  setConsumableRateForm,
  consumableRateEditingId,
  consumableRateMessage,
  onSaveConsumableRate,
  onResetConsumableRate,
  consumableRateFilters,
  setConsumableRateFilters,
  filteredConsumableRates,
  onEditConsumableRate,
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
  const [tab, setTab] = useState<CostInputsTab>('materials');
  // Phase 127.2 — Single mode for the unified Materials tab.
  const [materialsMode, setMaterialsMode] = useState<MaterialsMode>('list');
  const [costProfilesMode, setCostProfilesMode] = useState<CostProfilesMode>('list');
  // Local filter state for the unified Materials list. Category drives
  // both display filter AND which paper/consumable list to read.
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<'All' | MaterialCategory>('All');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialActiveFilter, setMaterialActiveFilter] = useState<'all' | 'yes' | 'no'>('yes');

  // Phase 127.2 — Merge paper + consumables into a single list view.
  // We don't touch the underlying tables; just present them together.
  const unifiedMaterials = useMemo<UnifiedMaterialRow[]>(() => {
    void _consumableRatesRaw; // unused — combined from filtered* below
    const fromPaper: UnifiedMaterialRow[] = filteredPaperRates.map((r) => ({
      id: `p-${r.id}`,
      category: 'Paper' as MaterialCategory,
      publicLabel: r.publicLabel || `${r.gsm}gsm ${r.paperType}`.trim() || r.name,
      unit: 'ton',
      supplierName: r.supplierName,
      region: r.region || '',
      cost: r.pricePerTon,
      charge: r.chargePerTon ?? r.pricePerTon,
      active: r.active,
      source: 'paper',
      paperRate: r,
    }));
    const fromConsumable: UnifiedMaterialRow[] = filteredConsumableRates.map((r) => ({
      id: `c-${r.id}`,
      category: r.category as MaterialCategory,
      publicLabel: r.publicLabel || r.name,
      unit: r.unit,
      supplierName: r.supplierName,
      region: r.region || '',
      cost: r.costPerUnit,
      charge: r.chargePerUnit ?? r.costPerUnit,
      active: r.active,
      source: 'consumable',
      consumableRate: r,
    }));
    let combined = [...fromPaper, ...fromConsumable];
    // Local filters that apply on top of the parent-level ones.
    if (materialCategoryFilter !== 'All') {
      combined = combined.filter((m) => m.category === materialCategoryFilter);
    }
    if (materialActiveFilter !== 'all') {
      const wantActive = materialActiveFilter === 'yes';
      combined = combined.filter((m) => m.active === wantActive);
    }
    if (materialSearch.trim()) {
      const q = materialSearch.toLowerCase();
      combined = combined.filter((m) =>
        m.publicLabel.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.supplierName.toLowerCase().includes(q));
    }
    // Sort: Paper first (by gsm desc), then by category, then by label.
    return combined.sort((a, b) => {
      if (a.category === 'Paper' && b.category !== 'Paper') return -1;
      if (a.category !== 'Paper' && b.category === 'Paper') return 1;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.publicLabel.localeCompare(b.publicLabel);
    });
  }, [filteredPaperRates, filteredConsumableRates, materialCategoryFilter, materialActiveFilter, materialSearch]);

  const paperRateSections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'What staff see (PUBLIC)',
      subtitle: 'This is the ONLY label non-admin staff see in the calculator. Use a generic descriptor — never the supplier brand.',
      missingRequired: [
        ...(paperRateForm.publicLabel.trim() ? [] : ['Public label']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Public label <RequiredMarker /></span>
            <input
              placeholder="e.g. 70gsm Unbleached Kraft"
              value={paperRateForm.publicLabel}
              onChange={(event) => setPaperRateForm({ ...paperRateForm, publicLabel: event.target.value })}
            />
          </label>
          <label className="full-span">
            <span>Suitable for (tick every job type this paper could be used for)</span>
            <p style={{ margin: '2px 0 6px', fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>
              This is a SUITABILITY tag, not where the paper has to go. Same reel can serve more than one type. When in doubt, tick everything plausible — there&apos;s no penalty. The actual end-use is decided when you issue stock for a job.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '6px 0' }}>
              {PAPER_USE_CASES.map((u) => {
                const selected = paperRateForm.useCases.includes(u);
                return (
                  <button
                    type="button"
                    key={u}
                    onClick={() => {
                      const next = selected
                        ? paperRateForm.useCases.filter((x) => x !== u)
                        : [...paperRateForm.useCases, u];
                      setPaperRateForm({ ...paperRateForm, useCases: next });
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
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={paperRateForm.requiresSlitting}
              onChange={(e) => setPaperRateForm({ ...paperRateForm, requiresSlitting: e.target.checked })}
            />
            Usually needs to be slit before use (jumbo width)
          </label>
          <label>
            <span>Form</span>
            <select
              value={paperRateForm.form}
              onChange={(event) => setPaperRateForm({ ...paperRateForm, form: event.target.value as PaperForm | '' })}
            >
              <option value="">— pick form —</option>
              <option value="Reels">Reels</option>
              <option value="Sheets">Sheets</option>
            </select>
          </label>
          <label><span>GSM</span><input value={paperRateForm.gsm} onChange={(event) => setPaperRateForm({ ...paperRateForm, gsm: event.target.value })} /></label>
          <label><span>Material descriptor</span><input placeholder="e.g. Unbleached Kraft" value={paperRateForm.paperType} onChange={(event) => setPaperRateForm({ ...paperRateForm, paperType: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={paperRateForm.active} onChange={(event) => setPaperRateForm({ ...paperRateForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'supplier-private',
      title: 'Supplier (PRIVATE — admin only)',
      subtitle: 'Supplier identity is hidden from staff. They only ever see the public label above.',
      body: (
        <div className="form-grid">
          <label><span>Internal nickname</span><input placeholder="For your reference only" value={paperRateForm.name} onChange={(event) => setPaperRateForm({ ...paperRateForm, name: event.target.value })} /></label>
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
          <label><span>Supplier product code</span><input placeholder="e.g. PrimePak U" value={paperRateForm.productCode} onChange={(event) => setPaperRateForm({ ...paperRateForm, productCode: event.target.value })} /></label>
          <label>
            <span>Dispatch region</span>
            <select
              value={paperRateForm.region}
              onChange={(event) => setPaperRateForm({ ...paperRateForm, region: event.target.value as PaperRegion | '' })}
            >
              <option value="">— pick region —</option>
              {PAPER_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'DBN' ? 'Durban (DBN)' : r === 'JHB' ? 'Joburg (JHB)' : r === 'CT' ? 'Cape Town (CT)' : r}
                </option>
              ))}
            </select>
          </label>
          <label><span>Contract valid from</span><input type="date" value={paperRateForm.validFrom} onChange={(event) => setPaperRateForm({ ...paperRateForm, validFrom: event.target.value })} /></label>
          <label><span>Contract valid to</span><input type="date" value={paperRateForm.validTo} onChange={(event) => setPaperRateForm({ ...paperRateForm, validTo: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'pricing-private',
      title: 'Pricing (PRIVATE — admin only)',
      subtitle: 'Cost is what you pay the supplier. Charge is what the calculator uses for quotes. The gap is your paper margin.',
      missingRequired: [
        ...(paperRateForm.pricePerTon && Number(paperRateForm.pricePerTon) > 0 ? [] : ['Cost per ton']),
        ...(paperRateForm.chargePerTon && Number(paperRateForm.chargePerTon) > 0 ? [] : ['Charge per ton']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Cost per ton (R) <RequiredMarker /></span><input type="number" min="0" step="0.01" placeholder="what you pay supplier" value={paperRateForm.pricePerTon} onChange={(event) => setPaperRateForm({ ...paperRateForm, pricePerTon: event.target.value })} /></label>
          <label><span>Charge per ton (R) <RequiredMarker /></span><input type="number" min="0" step="0.01" placeholder="what calculator charges" value={paperRateForm.chargePerTon} onChange={(event) => setPaperRateForm({ ...paperRateForm, chargePerTon: event.target.value })} /></label>
          {paperRateForm.pricePerTon && paperRateForm.chargePerTon && Number(paperRateForm.chargePerTon) > 0 && Number(paperRateForm.pricePerTon) > 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '8px 12px', borderRadius: 6, background: 'rgba(34,168,101,0.08)', border: '1px solid #22a865', fontSize: 13 }}>
              <strong>Paper margin:</strong>{' '}R{(Number(paperRateForm.chargePerTon) - Number(paperRateForm.pricePerTon)).toLocaleString(undefined, { maximumFractionDigits: 0 })} per ton
              {' '}({((Number(paperRateForm.chargePerTon) / Number(paperRateForm.pricePerTon) - 1) * 100).toFixed(1)}% markup)
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
          <label className="full-span"><span>Notes</span><textarea value={paperRateForm.notes} onChange={(event) => setPaperRateForm({ ...paperRateForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

  // Phase 127.1 — Consumable rate form. Same 4-section pattern as paper:
  // PUBLIC label + category + unit / Supplier PRIVATE / Pricing PRIVATE / Notes.
  const consumableRateSections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'What staff see (PUBLIC)',
      subtitle: 'This is the ONLY label non-admin staff see in the calculator. Use a generic descriptor — never the supplier brand.',
      missingRequired: [
        ...(consumableRateForm.publicLabel.trim() ? [] : ['Public label']),
        ...(consumableRateForm.category ? [] : ['Category']),
        ...(consumableRateForm.unit ? [] : ['Unit']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Public label <RequiredMarker /></span>
            <input
              placeholder='e.g. "Hot Melt Glue", "Brown PVC Tape 48mm"'
              value={consumableRateForm.publicLabel}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, publicLabel: event.target.value })}
            />
          </label>
          <label>
            <span>Category <RequiredMarker /></span>
            <select
              value={consumableRateForm.category}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, category: event.target.value as ConsumableCategory | '' })}
            >
              <option value="">— pick category —</option>
              {CONSUMABLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span>Unit <RequiredMarker /></span>
            <select
              value={consumableRateForm.unit}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, unit: event.target.value as ConsumableUnit | '' })}
            >
              <option value="">— pick unit —</option>
              {CONSUMABLE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={consumableRateForm.active}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, active: event.target.checked })}
            />Active
          </label>
        </div>
      ),
    },
    {
      key: 'supplier-private',
      title: 'Supplier (PRIVATE — admin only)',
      subtitle: 'Supplier identity is hidden from staff. They only ever see the public label above.',
      body: (
        <div className="form-grid">
          <label><span>Internal nickname</span><input placeholder="For your reference only" value={consumableRateForm.name} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, name: event.target.value })} /></label>
          <label>
            <span>Supplier</span>
            <select
              value={consumableRateForm.supplierId}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, supplierId: event.target.value })}
            >
              <option value="">Select supplier</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label><span>Supplier product code</span><input value={consumableRateForm.productCode} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, productCode: event.target.value })} /></label>
          <label>
            <span>Dispatch region</span>
            <select
              value={consumableRateForm.region}
              onChange={(event) => setConsumableRateForm({ ...consumableRateForm, region: event.target.value as PaperRegion | '' })}
            >
              <option value="">— pick region —</option>
              {PAPER_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'DBN' ? 'Durban (DBN)' : r === 'JHB' ? 'Joburg (JHB)' : r === 'CT' ? 'Cape Town (CT)' : r}
                </option>
              ))}
            </select>
          </label>
          <label><span>Contract valid from</span><input type="date" value={consumableRateForm.validFrom} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, validFrom: event.target.value })} /></label>
          <label><span>Contract valid to</span><input type="date" value={consumableRateForm.validTo} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, validTo: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'pricing-private',
      title: 'Pricing (PRIVATE — admin only)',
      subtitle: 'Cost is what you pay the supplier. Charge is what the calculator uses. The gap is your margin on this consumable.',
      missingRequired: [
        ...(consumableRateForm.costPerUnit && Number(consumableRateForm.costPerUnit) > 0 ? [] : ['Cost per unit']),
        ...(consumableRateForm.chargePerUnit && Number(consumableRateForm.chargePerUnit) > 0 ? [] : ['Charge per unit']),
      ],
      body: (
        <div className="form-grid">
          <label>
            <span>Cost per {consumableRateForm.unit || 'unit'} (R) <RequiredMarker /></span>
            <input type="number" min="0" step="0.0001" placeholder="what you pay supplier" value={consumableRateForm.costPerUnit} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, costPerUnit: event.target.value })} />
          </label>
          <label>
            <span>Charge per {consumableRateForm.unit || 'unit'} (R) <RequiredMarker /></span>
            <input type="number" min="0" step="0.0001" placeholder="what calculator charges" value={consumableRateForm.chargePerUnit} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, chargePerUnit: event.target.value })} />
          </label>
          {consumableRateForm.costPerUnit && consumableRateForm.chargePerUnit && Number(consumableRateForm.chargePerUnit) > 0 && Number(consumableRateForm.costPerUnit) > 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '8px 12px', borderRadius: 6, background: 'rgba(34,168,101,0.08)', border: '1px solid #22a865', fontSize: 13 }}>
              <strong>Margin:</strong>{' '}R{(Number(consumableRateForm.chargePerUnit) - Number(consumableRateForm.costPerUnit)).toLocaleString(undefined, { maximumFractionDigits: 4 })} per {consumableRateForm.unit || 'unit'}
              {' '}({((Number(consumableRateForm.chargePerUnit) / Number(consumableRateForm.costPerUnit) - 1) * 100).toFixed(1)}% markup)
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
          <label className="full-span"><span>Notes</span><textarea value={consumableRateForm.notes} onChange={(event) => setConsumableRateForm({ ...consumableRateForm, notes: event.target.value })} /></label>
        </div>
      ),
    },
  ];

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
          <label><span>Name <RequiredMarker /></span><input value={costProfileForm.name} onChange={(event) => setCostProfileForm({ ...costProfileForm, name: event.target.value })} /></label>
          <label><span>Wastage %</span><input type="number" min="0" step="0.1" value={costProfileForm.wastagePercent} onChange={(event) => setCostProfileForm({ ...costProfileForm, wastagePercent: event.target.value })} /></label>
          <label><span>Default margin %</span><input type="number" min="0" step="0.1" value={costProfileForm.defaultMarginPercent} onChange={(event) => setCostProfileForm({ ...costProfileForm, defaultMarginPercent: event.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={costProfileForm.active} onChange={(event) => setCostProfileForm({ ...costProfileForm, active: event.target.checked })} />Active</label>
        </div>
      ),
    },
    {
      key: 'glue',
      title: 'Glue & handle costs',
      subtitle: 'Per-bag adhesive and handle component costs.',
      body: (
        <div className="form-grid">
          <label><span>Base glue cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.baseGlueCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, baseGlueCostPerBag: event.target.value })} /></label>
          <label><span>Hot melt cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.hotMeltCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, hotMeltCostPerBag: event.target.value })} /></label>
          <label><span>Flat handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.flatHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, flatHandleCostPerBag: event.target.value })} /></label>
          <label><span>Rope handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.ropeHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, ropeHandleCostPerBag: event.target.value })} /></label>
          <label><span>Roll handle cost / bag</span><input type="number" min="0" step="0.0001" value={costProfileForm.rollHandleCostPerBag} onChange={(event) => setCostProfileForm({ ...costProfileForm, rollHandleCostPerBag: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'printing',
      title: 'Printing costs',
      subtitle: 'Screen, plate, ink, and threshold for switching to flexo.',
      body: (
        <div className="form-grid">
          <label><span>Screen setup cost</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintSetupCost} onChange={(event) => setCostProfileForm({ ...costProfileForm, screenPrintSetupCost: event.target.value })} /></label>
          <label><span>Screen print cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.screenPrintCostPerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, screenPrintCostPerColor: event.target.value })} /></label>
          <label><span>Flexo ink / 1000 bags / color</span><input type="number" min="0" step="0.01" value={costProfileForm.flexoInkCostPer1000PerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, flexoInkCostPer1000PerColor: event.target.value })} /></label>
          <label><span>Plate cost / color</span><input type="number" min="0" step="0.01" value={costProfileForm.plateCostPerColor} onChange={(event) => setCostProfileForm({ ...costProfileForm, plateCostPerColor: event.target.value })} /></label>
          <label><span>Flexo threshold quantity</span><input type="number" min="0" value={costProfileForm.flexoThresholdQty} onChange={(event) => setCostProfileForm({ ...costProfileForm, flexoThresholdQty: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'labour',
      title: 'Labour, packaging & transport',
      subtitle: 'Per-1000 and per-job overheads applied by the calculator.',
      body: (
        <div className="form-grid">
          <label><span>Labour cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.labourCostPer1000} onChange={(event) => setCostProfileForm({ ...costProfileForm, labourCostPer1000: event.target.value })} /></label>
          <label><span>Packaging cost / 1000 bags</span><input type="number" min="0" step="0.01" value={costProfileForm.packagingCostPer1000} onChange={(event) => setCostProfileForm({ ...costProfileForm, packagingCostPer1000: event.target.value })} /></label>
          <label><span>Transport cost / job</span><input type="number" min="0" step="0.01" value={costProfileForm.transportCostPerJob} onChange={(event) => setCostProfileForm({ ...costProfileForm, transportCostPerJob: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'allowances',
      title: 'Bag formula allowances',
      subtitle: 'Seam and fold allowances used when sizing the cut sheet.',
      body: (
        <div className="form-grid">
          <label><span>Side seam allowance mm</span><input type="number" min="0" value={costProfileForm.sideSeamAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, sideSeamAllowanceMm: event.target.value })} /></label>
          <label><span>Top fold allowance mm</span><input type="number" min="0" value={costProfileForm.topFoldAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, topFoldAllowanceMm: event.target.value })} /></label>
          <label><span>Bottom fold allowance mm</span><input type="number" min="0" value={costProfileForm.bottomFoldAllowanceMm} onChange={(event) => setCostProfileForm({ ...costProfileForm, bottomFoldAllowanceMm: event.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Notes</span><textarea value={costProfileForm.notes} onChange={(event) => setCostProfileForm({ ...costProfileForm, notes: event.target.value })} /></label>
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
        {/* ───────────── Phase 127.2 — UNIFIED MATERIALS TAB ─────────────
            Replaces the old Paper Rates + Consumables split. One list,
            one filter row, one Add flow. Internally still PaperRate +
            ConsumableRate (so the calculator engine is untouched);
            just merged for display + dispatched on Edit / Add. */}
        {tab === 'materials' ? (
          <>
            {/* Form modes — paper form or consumable form. */}
            {materialsMode === 'paperForm' ? (
              <FormWizard
                title={paperRateEditingId ? 'Edit Paper' : 'New Paper'}
                subtitle="Paper-specific fields (GSM, suitable-for, region). Staff only see the public label."
                message={paperRateMessage || undefined}
                sections={paperRateSections}
                onSave={() => { onSavePaperRate(); setMaterialsMode('list'); }}
                onCancel={() => { onResetPaperRate(); setMaterialsMode('list'); }}
                isEditing={!!paperRateEditingId}
                saveLabel="Save Paper"
              />
            ) : materialsMode === 'consumableForm' ? (
              <FormWizard
                title={consumableRateEditingId ? 'Edit Material' : 'New Material'}
                subtitle="Cost master for any non-paper input. Staff only see the public label."
                message={consumableRateMessage || undefined}
                sections={consumableRateSections}
                onSave={() => { onSaveConsumableRate(); setMaterialsMode('list'); }}
                onCancel={() => { onResetConsumableRate(); setMaterialsMode('list'); }}
                isEditing={!!consumableRateEditingId}
                saveLabel="Save Material"
              />
            ) : materialsMode === 'pickCategory' ? (
              /* Category picker — first step of Add Material. */
              <section className="card">
                <SectionTitle
                  title="What kind of material?"
                  subtitle="Pick one. The form adapts to what's relevant."
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                  {MATERIAL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        if (cat === 'Paper') {
                          onResetPaperRate();
                          setMaterialsMode('paperForm');
                        } else {
                          onResetConsumableRate();
                          setConsumableRateForm({
                            ...consumableRateForm,
                            name: '',
                            supplierId: '',
                            productCode: '',
                            category: cat as ConsumableCategory,
                            unit: '',
                            publicLabel: '',
                            costPerUnit: '',
                            chargePerUnit: '',
                            region: '',
                            validFrom: '',
                            validTo: '',
                            notes: '',
                            active: true,
                          });
                          setMaterialsMode('consumableForm');
                        }
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
              /* Default list view — combined paper + consumables. */
              <section className="card">
                <SectionTitle
                  title="Materials"
                  subtitle={`${unifiedMaterials.length} material${unifiedMaterials.length === 1 ? '' : 's'} shown`}
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
                      value={materialCategoryFilter}
                      onChange={(e) => setMaterialCategoryFilter(e.target.value as 'All' | MaterialCategory)}
                    >
                      <option value="All">All</option>
                      {MATERIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Search</span>
                    <input
                      placeholder="label, supplier, category..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Active</span>
                    <select
                      value={materialActiveFilter}
                      onChange={(e) => setMaterialActiveFilter(e.target.value as 'all' | 'yes' | 'no')}
                    >
                      <option value="all">All</option>
                      <option value="yes">Active</option>
                      <option value="no">Inactive</option>
                    </select>
                  </label>
                </div>
                {unifiedMaterials.length ? (
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
                        {unifiedMaterials.map((m) => {
                          const margin = m.charge - m.cost;
                          const marginPct = m.cost > 0 ? (margin / m.cost) * 100 : 0;
                          const isPaper = m.source === 'paper';
                          return (
                            <tr key={m.id}>
                              <td>
                                <span style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: isPaper ? '#dbeafe' : '#fef3c7',
                                  color: isPaper ? '#1e40af' : '#92400e',
                                  fontWeight: 700,
                                  letterSpacing: '0.05em',
                                }}>{m.category.toUpperCase()}</span>
                              </td>
                              <td>
                                <strong>{m.publicLabel}</strong>
                                {m.paperRate?.requiresSlitting ? <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#fde68a', color: '#78350f', fontWeight: 700, letterSpacing: '0.05em' }}>SLIT</span> : null}
                              </td>
                              <td>{m.unit || '—'}</td>
                              <td style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 12 }}>{m.supplierName || '—'}</td>
                              <td style={{ fontSize: 12 }}>{m.region || '—'}</td>
                              <td>R{formatNumber(m.cost, isPaper ? 0 : 2)}</td>
                              <td><strong>R{formatNumber(m.charge, isPaper ? 0 : 2)}</strong></td>
                              <td style={{ color: margin > 0 ? '#22a865' : margin < 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                {margin === 0 ? '—' : `R${formatNumber(margin, isPaper ? 0 : 2)} (${marginPct.toFixed(1)}%)`}
                              </td>
                              <td>
                                <button
                                  className="table-button"
                                  onClick={() => {
                                    if (m.source === 'paper' && m.paperRate) {
                                      onEditPaperRate(m.paperRate);
                                      setMaterialsMode('paperForm');
                                    } else if (m.source === 'consumable' && m.consumableRate) {
                                      onEditConsumableRate(m.consumableRate);
                                      setMaterialsMode('consumableForm');
                                    }
                                  }}
                                >Edit</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <EmptyState title="No materials yet" body="Add paper, glue, tape, ink, or any other input here. Tap + Add Material above." />}
              </section>
            )}
          </>
        ) : null}

        {tab === 'costProfiles' ? (
          <>
            {costProfilesMode === 'form' ? (
              <FormWizard
                title={costProfileEditingId ? 'Edit Cost Profile' : 'New Cost Profile'}
                subtitle="Set internal manufacturing assumptions and allowances used by the quote engine."
                message={costProfileMessage || undefined}
                sections={costProfileSections}
                onSave={onSaveCostProfile}
                onCancel={() => {
                  onResetCostProfile();
                  setCostProfilesMode('list');
                }}
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
