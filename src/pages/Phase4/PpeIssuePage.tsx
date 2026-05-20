/**
 * PPE Issue & Control register.
 *
 * One row per PPE item issued to a staff member. Tracks replacement-due
 * dates so worn items get replaced before they fail.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  PPE_ITEM_TYPES,
  PpeIssueFilters,
  PpeIssueFormState,
  PpeIssueRecord,
  PpeIssueStatus,
  PpeItemType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface PpeIssuePageProps {
  records: PpeIssueRecord[];
  filters: PpeIssueFilters;
  setFilters: (v: PpeIssueFilters) => void;
  form: PpeIssueFormState;
  setForm: (v: PpeIssueFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: PpeIssueRecord) => void;
}

export function PpeIssuePage({ records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit }: PpeIssuePageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.staffName, r.itemDescription, r.itemType, r.notes].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.itemType && r.itemType !== filters.itemType) return false;
    if (filters.status && r.status !== filters.status) return false;
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const active = records.filter((r) => r.status === 'Issued').length;
    const lost = records.filter((r) => r.status === 'Lost').length;
    const damaged = records.filter((r) => r.status === 'Damaged').length;
    return { total: records.length, active, lost, damaged };
  }, [records]);

  const sections: FormWizardSection[] = [{
    key: 'issue', title: 'PPE issue',
    missingRequired: [
      ...(form.staffName.trim() ? [] : ['Staff name']),
      ...(form.issuedDate ? [] : ['Issue date']),
    ],
    body: (
      <div className="form-grid">
        <label><span>Staff name <RequiredMarker /></span><input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} /></label>
        <label><span>Role</span><input value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} /></label>
        <label><span>Item type</span>
          <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value as PpeItemType })}>
            {PPE_ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label><span>Quantity</span><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
        <label className="full-span"><span>Item description / size</span><input value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} placeholder="e.g. Size L nitrile gloves, blue" /></label>
        <label><span>Issued by</span><input value={form.issuedByName} onChange={(e) => setForm({ ...form, issuedByName: e.target.value })} /></label>
        <label><span>Issue date <RequiredMarker /></span><input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></label>
        <label><span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PpeIssueStatus })}>
            <option>Issued</option><option>Returned</option><option>Damaged</option><option>Lost</option>
          </select>
        </label>
        <label><span>Replacement due</span><input type="date" value={form.replacementDueDate} onChange={(e) => setForm({ ...form, replacementDueDate: e.target.value })} /></label>
        <label><span>Return date</span><input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} /></label>
        <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Issue PPE</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit PPE record' : 'New PPE issue'}
          subtitle="Track who has what, when it needs replacing, and what's gone missing."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save record"
        />
      ) : (
        <section className="card">
          <SectionTitle title="PPE Issue & Control" subtitle={`${filtered.length} of ${records.length} record(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Active (Issued)</span><strong>{stats.active}</strong></div>
            <div className={`food-safety-stat${stats.lost > 0 ? ' food-safety-stat-alert' : ''}`}><span>Lost</span><strong>{stats.lost}</strong></div>
            <div className={`food-safety-stat${stats.damaged > 0 ? ' food-safety-stat-alert' : ''}`}><span>Damaged</span><strong>{stats.damaged}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, item" /></label>
            <label><span>Item type</span>
              <select value={filters.itemType} onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}>
                <option value="">All</option>
                {PPE_ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Issued</option><option>Returned</option><option>Damaged</option><option>Lost</option>
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No PPE records" body="Log every PPE issue so audits show every operator has the right gear." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Staff</th><th>Item</th><th>Qty</th><th>Issued</th><th>Status</th><th>Replacement due</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.issueNumber}</strong></td>
                      <td>{r.staffName}<div className="table-subtext">{r.staffRole}</div></td>
                      <td>{r.itemType}{r.itemDescription ? <div className="table-subtext">{r.itemDescription}</div> : null}</td>
                      <td>{r.quantity}</td>
                      <td>{formatDate(r.issuedDate)}</td>
                      <td><span className={r.status === 'Lost' || r.status === 'Damaged' ? 'badge badge-danger' : r.status === 'Issued' ? 'badge badge-success' : 'badge'}>{r.status}</span></td>
                      <td>{r.replacementDueDate ? formatDate(r.replacementDueDate) : '—'}</td>
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
