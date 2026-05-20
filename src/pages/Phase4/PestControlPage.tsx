/**
 * Pest Control Register.
 *
 * Tracks service visits from the pest control provider + internal pest
 * sightings. Flags overdue next-service dates so contracts don't lapse.
 * Internal sightings can trigger product on-hold actions.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  PestControlFilters,
  PestControlFormState,
  PestControlRecord,
  PestType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface PestControlPageProps {
  records: PestControlRecord[];
  filters: PestControlFilters;
  setFilters: (v: PestControlFilters) => void;
  form: PestControlFormState;
  setForm: (v: PestControlFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: PestControlRecord) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

const PEST_TYPES: PestType[] = ['Rodent', 'Insect (flying)', 'Insect (crawling)', 'Cockroach', 'Stored Product Pest', 'Bird', 'Other'];

export function PestControlPage({ records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit }: PestControlPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.providerName, r.technicianName, r.findings, r.correctiveActions, r.notes].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.activityType && r.activityType !== filters.activityType) return false;
    if (filters.pestType && r.pestType !== filters.pestType) return false;
    if (filters.serviceWindow === 'last30') {
      if (Date.now() - new Date(r.serviceDate).getTime() > 30 * DAY_MS) return false;
    } else if (filters.serviceWindow === 'last90') {
      if (Date.now() - new Date(r.serviceDate).getTime() > 90 * DAY_MS) return false;
    } else if (filters.serviceWindow === 'overdue') {
      if (!r.nextServiceDate || new Date(r.nextServiceDate).getTime() > Date.now()) return false;
    }
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const total = records.length;
    const sightings = records.filter((r) => r.activityType === 'Internal Sighting').length;
    const productAffected = records.filter((r) => r.productAffected).length;
    const overdue = records.filter((r) => r.nextServiceDate && new Date(r.nextServiceDate).getTime() < Date.now()).length;
    return { total, sightings, productAffected, overdue };
  }, [records]);

  const sections: FormWizardSection[] = [
    {
      key: 'service', title: 'Service / sighting',
      missingRequired: [...(form.serviceDate ? [] : ['Service date'])],
      body: (
        <div className="form-grid">
          <label><span>Date <RequiredMarker /></span><input type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} /></label>
          <label><span>Activity type</span>
            <select value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value as PestControlRecord['activityType'] })}>
              <option>Preventive Treatment</option><option>Reactive Treatment</option><option>Bait Station Check</option><option>Internal Sighting</option><option>Other</option>
            </select>
          </label>
          <label><span>Provider name</span><input value={form.providerName} onChange={(e) => setForm({ ...form, providerName: e.target.value })} /></label>
          <label><span>Technician</span><input value={form.technicianName} onChange={(e) => setForm({ ...form, technicianName: e.target.value })} /></label>
          <label><span>Pest type</span>
            <select value={form.pestType} onChange={(e) => setForm({ ...form, pestType: e.target.value as PestType | '' })}>
              <option value="">— None / unknown</option>
              {PEST_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label><span>Next service date</span><input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} /></label>
        </div>
      ),
    },
    {
      key: 'findings', title: 'Findings & action',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Findings</span><textarea rows={3} value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} /></label>
          <label className="full-span"><span>Corrective actions</span><textarea rows={2} value={form.correctiveActions} onChange={(e) => setForm({ ...form, correctiveActions: e.target.value })} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={form.productAffected} onChange={(e) => setForm({ ...form, productAffected: e.target.checked })} />Product potentially affected</label>
          <label className="checkbox-row"><input type="checkbox" checked={form.stockOnHold} onChange={(e) => setForm({ ...form, stockOnHold: e.target.checked })} />Stock placed on hold</label>
          <label className="full-span"><span>Bait station map URL</span><input value={form.baitStationMapUrl} onChange={(e) => setForm({ ...form, baitStationMapUrl: e.target.value })} /></label>
          <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        </div>
      ),
    },
  ];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Log entry</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit pest control entry' : 'New pest control entry'}
          subtitle="Service visit, bait check, or internal sighting."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save entry"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Pest Control Register" subtitle={`${filtered.length} of ${records.length} record(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total entries</span><strong>{stats.total}</strong></div>
            <div className={`food-safety-stat${stats.sightings > 0 ? ' food-safety-stat-alert' : ''}`}><span>Internal sightings</span><strong>{stats.sightings}</strong></div>
            <div className={`food-safety-stat${stats.productAffected > 0 ? ' food-safety-stat-alert' : ''}`}><span>Product affected</span><strong>{stats.productAffected}</strong></div>
            <div className={`food-safety-stat${stats.overdue > 0 ? ' food-safety-stat-alert' : ''}`}><span>Next-service overdue</span><strong>{stats.overdue}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Provider, findings" /></label>
            <label><span>Activity</span>
              <select value={filters.activityType} onChange={(e) => setFilters({ ...filters, activityType: e.target.value })}>
                <option value="">All</option>
                <option>Preventive Treatment</option><option>Reactive Treatment</option><option>Bait Station Check</option><option>Internal Sighting</option><option>Other</option>
              </select>
            </label>
            <label><span>Pest</span>
              <select value={filters.pestType} onChange={(e) => setFilters({ ...filters, pestType: e.target.value })}>
                <option value="">All</option>
                {PEST_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label><span>Window</span>
              <select value={filters.serviceWindow} onChange={(e) => setFilters({ ...filters, serviceWindow: e.target.value as PestControlFilters['serviceWindow'] })}>
                <option value="all">All</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="overdue">Next-service overdue</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No pest control records" body="Log every service visit, bait station check and internal sighting." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Date</th><th>Type</th><th>Provider</th><th>Pest</th><th>Next service</th><th>Stock</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.recordNumber}</strong></td>
                      <td>{formatDate(r.serviceDate)}</td>
                      <td>{r.activityType}</td>
                      <td>{r.providerName || '—'}<div className="table-subtext">{r.technicianName}</div></td>
                      <td>{r.pestType || '—'}</td>
                      <td className={r.nextServiceDate && new Date(r.nextServiceDate).getTime() < Date.now() ? 'cell-alert' : undefined}>{r.nextServiceDate ? formatDate(r.nextServiceDate) : '—'}</td>
                      <td>{r.stockOnHold ? <span className="badge badge-danger">On hold</span> : r.productAffected ? <span className="badge badge-warning">Affected</span> : <span className="muted">OK</span>}</td>
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
