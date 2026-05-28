/**
 * Foreign Object Control register.
 *
 * Two register types in one — a Risk Inventory (known FO risks in the
 * factory: light fittings, brittle plastic guards, etc.) and an Incident
 * log (foreign objects actually found in product or environment).
 * Inspection records also live here for periodic walk-throughs.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  FACTORY_AREAS,
  FactoryArea,
  ForeignObjectFilters,
  ForeignObjectFormState,
  ForeignObjectMaterial,
  ForeignObjectRecord,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface ForeignObjectPageProps {
  records: ForeignObjectRecord[];
  filters: ForeignObjectFilters;
  setFilters: (v: ForeignObjectFilters) => void;
  form: ForeignObjectFormState;
  setForm: (v: ForeignObjectFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: ForeignObjectRecord) => void;
}

const FO_MATERIALS: ForeignObjectMaterial[] = [
  'Glass', 'Brittle Plastic', 'Wood Splinter', 'Metal (blade)', 'Metal (screw / bolt)',
  'Tool Part', 'Staple', 'Pen / Pencil', 'Jewellery', 'Hair', 'Other',
];

export function ForeignObjectPage({ records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit }: ForeignObjectPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.description, r.controlMeasure, r.material, r.area, r.notes].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.area && r.area !== filters.area) return false;
    if (filters.material && r.material !== filters.material) return false;
    if (filters.recordType && r.recordType !== filters.recordType) return false;
    if (filters.status && r.status !== filters.status) return false;
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const incidents = records.filter((r) => r.recordType === 'Incident').length;
    const open = records.filter((r) => r.status === 'Open').length;
    const risks = records.filter((r) => r.recordType === 'Risk Inventory').length;
    return { total: records.length, incidents, open, risks };
  }, [records]);

  const sections: FormWizardSection[] = [{
    key: 'fo', title: 'Foreign object record',
    missingRequired: [
      ...(form.description.trim() ? [] : ['Description']),
      ...(form.inspectionDate ? [] : ['Date']),
    ],
    body: (
      <div className="form-grid">
        <label><span>Record type</span>
          <select value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value as ForeignObjectRecord['recordType'] })}>
            <option>Risk Inventory</option><option>Incident</option><option>Inspection</option>
          </select>
        </label>
        <label><span>Area</span>
          <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value as FactoryArea })}>
            {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label><span>Material</span>
          <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value as ForeignObjectMaterial })}>
            {FO_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label><span>Date <RequiredMarker /></span><input type="date" value={form.inspectionDate} onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })} /></label>
        <label><span>Inspected by</span><input value={form.inspectedByName} onChange={(e) => setForm({ ...form, inspectedByName: e.target.value })} /></label>
        <label><span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ForeignObjectRecord['status'] })}>
            <option>Open</option><option>Mitigated</option><option>Closed</option>
          </select>
        </label>
        <label className="full-span"><span>Description <RequiredMarker /></span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is the object / risk?" /></label>
        <label className="full-span"><span>Control measure</span><textarea rows={2} value={form.controlMeasure} onChange={(e) => setForm({ ...form, controlMeasure: e.target.value })} placeholder="What's in place to prevent contamination?" /></label>
        <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Log entry</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>← Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit FO record' : 'New foreign object record'}
          subtitle="Risk inventory, incident report or inspection record."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save record"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Foreign Object Control" subtitle={`${filtered.length} of ${records.length} record(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Risk inventory</span><strong>{stats.risks}</strong></div>
            <div className={`food-safety-stat${stats.incidents > 0 ? ' food-safety-stat-alert' : ''}`}><span>Incidents</span><strong>{stats.incidents}</strong></div>
            <div className={`food-safety-stat${stats.open > 0 ? ' food-safety-stat-alert' : ''}`}><span>Open</span><strong>{stats.open}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
            <label><span>Area</span>
              <select value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
                <option value="">All</option>
                {FACTORY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label><span>Material</span>
              <select value={filters.material} onChange={(e) => setFilters({ ...filters, material: e.target.value })}>
                <option value="">All</option>
                {FO_MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label><span>Type</span>
              <select value={filters.recordType} onChange={(e) => setFilters({ ...filters, recordType: e.target.value })}>
                <option value="">All</option>
                <option>Risk Inventory</option><option>Incident</option><option>Inspection</option>
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Open</option><option>Mitigated</option><option>Closed</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No FO records" body="Build the risk inventory of every foreign object source on site, then log incidents and inspections against it." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Type</th><th>Area</th><th>Material</th><th>Date</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.recordNumber}</strong></td>
                      <td>{r.recordType}</td>
                      <td>{r.area}</td>
                      <td>{r.material}</td>
                      <td>{formatDate(r.inspectionDate)}</td>
                      <td title={r.description}>{r.description.length > 80 ? r.description.slice(0, 80) + '…' : r.description}</td>
                      <td className={r.status === 'Open' ? 'cell-alert' : undefined}>{r.status}</td>
                      <td><button className="table-button" onClick={() => { onEdit(r); setMode('form'); }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
