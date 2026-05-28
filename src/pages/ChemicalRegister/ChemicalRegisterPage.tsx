/**
 * Chemical & Hazardous Substance Register (MSDS).
 *
 * One row per chemical held on site. The list view surfaces hazard
 * pictograms, current vs max on-site quantity, and review-overdue status
 * (review interval × last-reviewed date). The form is a FormWizard with
 * Identity / Hazard / Storage / MSDS document / Emergency sections.
 *
 * Required by SA OHS Act + SANS 10234 (GHS). MSDS must be reviewed at
 * least every 3 years; we default to 12 months and warn 30 days before
 * the review date passes.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { PhotoUploader } from '../../components/PhotoUploader';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ChemicalRegisterEntry,
  ChemicalRegisterFilters,
  ChemicalRegisterFormState,
  ChemicalState,
  GHS_PICTOGRAMS,
  GHS_PICTOGRAM_ICON,
  GHSPictogram,
  Supplier,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ChemicalRegisterPageProps {
  entries: ChemicalRegisterEntry[];
  suppliers: Supplier[];
  filters: ChemicalRegisterFilters;
  setFilters: (value: ChemicalRegisterFilters) => void;
  form: ChemicalRegisterFormState;
  setForm: (value: ChemicalRegisterFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (entry: ChemicalRegisterEntry) => void;
  onArchiveToggle: (entry: ChemicalRegisterEntry) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Returns 'overdue' | 'due-soon' (within 30 days) | 'ok' | 'never' */
function getReviewStatus(entry: ChemicalRegisterEntry): 'overdue' | 'due-soon' | 'ok' | 'never' {
  if (!entry.msdsLastReviewedDate) return 'never';
  const last = new Date(entry.msdsLastReviewedDate).getTime();
  if (Number.isNaN(last)) return 'never';
  const nextDue = last + entry.msdsReviewIntervalMonths * 30 * DAY_MS;
  const now = Date.now();
  if (now > nextDue) return 'overdue';
  if (nextDue - now < 30 * DAY_MS) return 'due-soon';
  return 'ok';
}

export function ChemicalRegisterPage(props: ChemicalRegisterPageProps) {
  const {
    entries,
    suppliers,
    filters,
    setFilters,
    form,
    setForm,
    editingId,
    message,
    onSave,
    onReset,
    onEdit,
    onArchiveToggle,
  } = props;
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.archived === 'active' && entry.archived) return false;
      if (filters.archived === 'archived' && !entry.archived) return false;
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const hay = [
          entry.chemicalName,
          entry.tradeName,
          entry.supplierName,
          entry.casNumber,
          entry.unNumber,
          entry.storageLocation,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.pictogram && !entry.ghsPictograms.includes(filters.pictogram as GHSPictogram)) return false;
      if (filters.storageLocation && entry.storageLocation !== filters.storageLocation) return false;
      if (filters.reviewStatus !== 'all') {
        const status = getReviewStatus(entry);
        if (filters.reviewStatus === 'overdue' && status !== 'overdue' && status !== 'never') return false;
        if (filters.reviewStatus === 'due-soon' && status !== 'due-soon') return false;
        if (filters.reviewStatus === 'ok' && status !== 'ok') return false;
      }
      return true;
    });
  }, [entries, filters]);

  const locationOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.storageLocation).filter(Boolean))).sort(),
    [entries],
  );

  function handleStartCreate() {
    onReset();
    setMode('form');
  }

  function handleStartEdit(entry: ChemicalRegisterEntry) {
    onEdit(entry);
    setMode('form');
  }

  function handleBackToList() {
    onReset();
    setMode('list');
  }

  function togglePictogram(p: GHSPictogram) {
    const next = form.ghsPictograms.includes(p)
      ? form.ghsPictograms.filter((existing) => existing !== p)
      : [...form.ghsPictograms, p];
    setForm({ ...form, ghsPictograms: next });
  }

  const sections: FormWizardSection[] = [
    {
      key: 'identity',
      title: 'Identity',
      subtitle: 'How is this chemical known to staff, and how do we trace it back to the supplier?',
      missingRequired: [
        ...(form.chemicalName ? [] : ['Chemical name']),
        ...(form.supplierId ? [] : ['Supplier']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Chemical name <RequiredMarker /></span><input value={form.chemicalName} onChange={(e) => setForm({ ...form, chemicalName: e.target.value })} placeholder="e.g. Isopropyl alcohol" /></label>
          <label><span>Trade / commercial name</span><input value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} placeholder="As printed on the container" /></label>
          <label><span>Supplier <RequiredMarker /></span>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label><span>CAS number</span><input value={form.casNumber} onChange={(e) => setForm({ ...form, casNumber: e.target.value })} placeholder="e.g. 67-63-0" /></label>
          <label><span>UN number (transport)</span><input value={form.unNumber} onChange={(e) => setForm({ ...form, unNumber: e.target.value })} placeholder="e.g. UN1219" /></label>
          <label><span>Physical state</span>
            <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value as ChemicalState })}>
              <option value="Liquid">Liquid</option>
              <option value="Solid">Solid</option>
              <option value="Gas">Gas</option>
              <option value="Aerosol">Aerosol</option>
              <option value="Powder">Powder</option>
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'hazard',
      title: 'Hazard classification',
      subtitle: 'Match exactly what is printed on the supplier MSDS. This is what fire/insurance audits check.',
      contextActive: form.ghsPictograms.length > 0,
      body: (
        <div className="form-grid">
          <div className="full-span">
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', display: 'block', marginBottom: 8 }}>GHS pictograms (tick all that apply)</span>
            <div className="chem-pictogram-grid">
              {GHS_PICTOGRAMS.map((p) => {
                const on = form.ghsPictograms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePictogram(p)}
                    className={`chem-pictogram-pill${on ? ' chem-pictogram-pill-on' : ''}`}
                    aria-pressed={on}
                  >
                    <span className="chem-pictogram-emoji" aria-hidden>
                      {p === 'Explosive' && '💥'}
                      {p === 'Flammable' && '🔥'}
                      {p === 'Oxidizing' && '⭕'}
                      {p === 'Compressed Gas' && '🛢️'}
                      {p === 'Corrosive' && '🧪'}
                      {p === 'Toxic' && '☠️'}
                      {p === 'Harmful' && '⚠️'}
                      {p === 'Health Hazard' && '🫁'}
                      {p === 'Environmental Hazard' && '🌿'}
                    </span>
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="full-span"><span>Hazard statements (H-codes)</span><textarea rows={3} value={form.hazardStatements} onChange={(e) => setForm({ ...form, hazardStatements: e.target.value })} placeholder="One per line, e.g. H225 Highly flammable liquid and vapour" /></label>
          <label className="full-span"><span>Precautionary statements (P-codes)</span><textarea rows={3} value={form.precautionaryStatements} onChange={(e) => setForm({ ...form, precautionaryStatements: e.target.value })} placeholder="One per line, e.g. P210 Keep away from heat / open flame" /></label>
        </div>
      ),
    },
    {
      key: 'storage',
      title: 'Storage & quantity',
      subtitle: 'Where it lives on site and how much we are allowed to hold.',
      missingRequired: [
        ...(form.storageLocation ? [] : ['Storage location']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Storage location <RequiredMarker /></span><input value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} placeholder="e.g. Flammables cabinet A2" /></label>
          <label><span>Unit</span>
            <select value={form.quantityUnit} onChange={(e) => setForm({ ...form, quantityUnit: e.target.value as ChemicalRegisterFormState['quantityUnit'] })}>
              <option value="L">L</option>
              <option value="mL">mL</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="units">units (containers)</option>
            </select>
          </label>
          <label><span>Current on site</span><input type="number" min="0" step="0.01" value={form.currentOnSiteQuantity} onChange={(e) => setForm({ ...form, currentOnSiteQuantity: e.target.value })} /></label>
          <label><span>Maximum permitted on site</span><input type="number" min="0" step="0.01" value={form.maxOnSiteQuantity} onChange={(e) => setForm({ ...form, maxOnSiteQuantity: e.target.value })} placeholder="Per insurance / fire reg" /></label>
        </div>
      ),
    },
    {
      key: 'msds',
      title: 'MSDS document',
      subtitle: 'Where the safety datasheet lives + when it was last reviewed. SANS 10234 requires review at least every 3 years.',
      contextActive: !!form.msdsDocumentUrl,
      body: (
        <div className="form-grid">
          <label className="full-span"><span>MSDS document URL</span><input value={form.msdsDocumentUrl} onChange={(e) => setForm({ ...form, msdsDocumentUrl: e.target.value })} placeholder="Paste a link to the hosted PDF (Google Drive, Dropbox, etc.)" /></label>
          <label><span>Last reviewed</span><input type="date" value={form.msdsLastReviewedDate} onChange={(e) => setForm({ ...form, msdsLastReviewedDate: e.target.value })} /></label>
          <label><span>Review interval (months)</span><input type="number" min="1" max="36" value={form.msdsReviewIntervalMonths} onChange={(e) => setForm({ ...form, msdsReviewIntervalMonths: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={form.archived} onChange={(e) => setForm({ ...form, archived: e.target.checked })} />Archive (no longer in use)</label>
        </div>
      ),
    },
    {
      key: 'emergency',
      title: 'Emergency & PPE',
      subtitle: 'What to do if something goes wrong. Shown on the printable register.',
      body: (
        <div className="form-grid">
          <label><span>Required PPE</span><input value={form.requiredPPE} onChange={(e) => setForm({ ...form, requiredPPE: e.target.value })} placeholder="e.g. Nitrile gloves, splash goggles" /></label>
          <label><span>Fire suppression type</span><input value={form.fireSuppressionType} onChange={(e) => setForm({ ...form, fireSuppressionType: e.target.value })} placeholder="e.g. CO2 / Dry powder / Foam" /></label>
          <label className="full-span"><span>Emergency procedure / first aid</span><textarea rows={4} value={form.emergencyProcedure} onChange={(e) => setForm({ ...form, emergencyProcedure: e.target.value })} placeholder="Short steps for spillage, inhalation, skin contact, etc." /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="full-span">
            <PhotoUploader
              urls={form.photoUrls ?? []}
              onChange={(urls) => setForm({ ...form, photoUrls: urls })}
              recordType="chemicals"
              recordId={editingId || `draft-${Date.now()}`}
              label="Photos of drum / label / MSDS — labels are critical for stocktake reconciliation"
              max={6}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle
        action={
          mode === 'list'
            ? <button className="secondary-button" onClick={handleStartCreate}>Add chemical</button>
            : <button className="ghost-button" onClick={handleBackToList}>Back to register</button>
        }
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit chemical' : 'New chemical'}
          subtitle="Match the supplier MSDS exactly. This is what auditors check."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!editingId}
          saveLabel="Save chemical"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Chemical & hazardous register (MSDS)" subtitle={`${filteredEntries.length} chemical(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, supplier, CAS, location" /></label>
            <label><span>Pictogram</span>
              <select value={filters.pictogram} onChange={(e) => setFilters({ ...filters, pictogram: e.target.value })}>
                <option value="">All</option>
                {GHS_PICTOGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label><span>Storage location</span>
              <select value={filters.storageLocation} onChange={(e) => setFilters({ ...filters, storageLocation: e.target.value })}>
                <option value="">All locations</option>
                {locationOptions.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </label>
            <label><span>MSDS review</span>
              <select value={filters.reviewStatus} onChange={(e) => setFilters({ ...filters, reviewStatus: e.target.value as ChemicalRegisterFilters['reviewStatus'] })}>
                <option value="all">All</option>
                <option value="overdue">Overdue / never reviewed</option>
                <option value="due-soon">Due within 30 days</option>
                <option value="ok">Up to date</option>
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.archived} onChange={(e) => setFilters({ ...filters, archived: e.target.value as ChemicalRegisterFilters['archived'] })}>
                <option value="active">Active only</option>
                <option value="archived">Archived only</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
          {filteredEntries.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Chemical</th>
                    <th>Supplier</th>
                    <th>Hazards</th>
                    <th>On site</th>
                    <th>Location</th>
                    <th>MSDS review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const status = getReviewStatus(entry);
                    const overUsage = entry.maxOnSiteQuantity > 0 && entry.currentOnSiteQuantity > entry.maxOnSiteQuantity;
                    return (
                      <tr key={entry.id}>
                        <td>
                          <strong>{entry.chemicalName}</strong>
                          <div className="table-subtext">{entry.tradeName || entry.casNumber || '—'}</div>
                        </td>
                        <td>{entry.supplierName || '—'}</td>
                        <td>
                          <span className="chem-pictogram-row" aria-label={entry.ghsPictograms.join(', ') || 'No pictograms'}>
                            {entry.ghsPictograms.length === 0 ? <span className="muted">None</span> : entry.ghsPictograms.map((p) => (
                              <span key={p} className="chem-pictogram-mini" title={p}>
                                {p === 'Explosive' && '💥'}
                                {p === 'Flammable' && '🔥'}
                                {p === 'Oxidizing' && '⭕'}
                                {p === 'Compressed Gas' && '🛢️'}
                                {p === 'Corrosive' && '🧪'}
                                {p === 'Toxic' && '☠️'}
                                {p === 'Harmful' && '⚠️'}
                                {p === 'Health Hazard' && '🫁'}
                                {p === 'Environmental Hazard' && '🌿'}
                              </span>
                            ))}
                          </span>
                        </td>
                        <td className={overUsage ? 'cell-alert' : undefined}>
                          {formatNumber(entry.currentOnSiteQuantity, 2)}
                          {entry.maxOnSiteQuantity > 0 ? ` / ${formatNumber(entry.maxOnSiteQuantity, 2)}` : ''} {entry.quantityUnit}
                          {overUsage ? <div className="table-subtext">Over max permitted</div> : null}
                        </td>
                        <td>{entry.storageLocation || '—'}</td>
                        <td className={status === 'overdue' || status === 'never' ? 'cell-alert' : undefined}>
                          {status === 'never' ? 'Never reviewed' : `${formatDate(entry.msdsLastReviewedDate)} · ${entry.msdsReviewIntervalMonths}m cycle`}
                          <div className="table-subtext">
                            {status === 'overdue' && 'Review overdue'}
                            {status === 'due-soon' && 'Review due within 30 days'}
                            {status === 'ok' && 'Up to date'}
                            {status === 'never' && 'Set last-reviewed date'}
                          </div>
                        </td>
                        <td>
                          <div className="inline-actions">
                            <button className="table-button" onClick={() => handleStartEdit(entry)}>Edit</button>
                            {entry.msdsDocumentUrl ? (
                              <a className="table-button" href={entry.msdsDocumentUrl} target="_blank" rel="noopener noreferrer">MSDS</a>
                            ) : null}
                            <button className="table-button" onClick={() => onArchiveToggle(entry)}>
                              {entry.archived ? 'Unarchive' : 'Archive'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No chemicals on the register" body="Add the first chemical to begin tracking MSDS, hazard pictograms, and on-site quantities." />
          )}
        </section>
      )}
    </>
  );
}
