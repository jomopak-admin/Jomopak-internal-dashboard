/**
 * Tools & Blade Control register.
 *
 * Critical food-safety register. Every blade / cutter / specialised tool
 * is tracked with serial number, home location, current holder, issue
 * status. Lost critical items are flagged in red as potential food
 * safety incidents.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  ToolBladeFilters,
  ToolBladeFormState,
  ToolBladeRecord,
  ToolBladeType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface ToolBladePageProps {
  records: ToolBladeRecord[];
  filters: ToolBladeFilters;
  setFilters: (v: ToolBladeFilters) => void;
  form: ToolBladeFormState;
  setForm: (v: ToolBladeFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: ToolBladeRecord) => void;
}

export function ToolBladePage({ records, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit }: ToolBladePageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => records.filter((r) => {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      const hay = [r.serialNumber, r.description, r.homeLocation, r.currentHolderName, r.issuedToName].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.itemType && r.itemType !== filters.itemType) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.criticalOnly && !r.isCritical) return false;
    return true;
  }), [records, filters]);

  const stats = useMemo(() => {
    const issued = records.filter((r) => r.status === 'Issued').length;
    const lost = records.filter((r) => r.status === 'Lost').length;
    const criticalLost = records.filter((r) => r.status === 'Lost' && r.isCritical).length;
    return { total: records.length, issued, lost, criticalLost };
  }, [records]);

  const sections: FormWizardSection[] = [{
    key: 'tool', title: 'Tool / blade',
    missingRequired: [
      ...(form.serialNumber.trim() ? [] : ['Serial number']),
      ...(form.description.trim() ? [] : ['Description']),
    ],
    body: (
      <div className="form-grid">
        <label><span>Type</span>
          <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value as ToolBladeType })}>
            <option>Blade</option><option>Cutter</option><option>Knife</option><option>Tool</option><option>Other</option>
          </select>
        </label>
        <label><span>Serial number <RequiredMarker /></span><input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></label>
        <label className="full-span"><span>Description <RequiredMarker /></span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label><span>Home location</span><input value={form.homeLocation} onChange={(e) => setForm({ ...form, homeLocation: e.target.value })} placeholder="Toolbox / cabinet" /></label>
        <label><span>Current holder</span><input value={form.currentHolderName} onChange={(e) => setForm({ ...form, currentHolderName: e.target.value })} /></label>
        <label><span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ToolBladeRecord['status'] })}>
            <option>Available</option><option>Issued</option><option>Lost</option><option>Damaged</option><option>Retired</option>
          </select>
        </label>
        <label className="checkbox-row"><input type="checkbox" checked={form.isCritical} onChange={(e) => setForm({ ...form, isCritical: e.target.checked })} />Critical (loss = food safety incident)</label>
        <label><span>Issued to</span><input value={form.issuedToName} onChange={(e) => setForm({ ...form, issuedToName: e.target.value })} /></label>
        <label><span>Issued date</span><input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></label>
        <label><span>Expected return</span><input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} /></label>
        <label><span>Returned date</span><input type="date" value={form.returnedDate} onChange={(e) => setForm({ ...form, returnedDate: e.target.value })} /></label>
        <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Add tool</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit tool' : 'New tool / blade'}
          subtitle="Critical items must be accounted for at all times."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save record"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Tools & Blade Control" subtitle={`${filtered.length} of ${records.length} item(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Total</span><strong>{stats.total}</strong></div>
            <div className="food-safety-stat"><span>Currently issued</span><strong>{stats.issued}</strong></div>
            <div className={`food-safety-stat${stats.lost > 0 ? ' food-safety-stat-alert' : ''}`}><span>Lost</span><strong>{stats.lost}</strong></div>
            <div className={`food-safety-stat${stats.criticalLost > 0 ? ' food-safety-stat-alert' : ''}`}><span>Critical lost</span><strong>{stats.criticalLost}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></label>
            <label><span>Type</span>
              <select value={filters.itemType} onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}>
                <option value="">All</option>
                <option>Blade</option><option>Cutter</option><option>Knife</option><option>Tool</option><option>Other</option>
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Available</option><option>Issued</option><option>Lost</option><option>Damaged</option><option>Retired</option>
              </select>
            </label>
            <label className="checkbox-row"><input type="checkbox" checked={filters.criticalOnly} onChange={(e) => setFilters({ ...filters, criticalOnly: e.target.checked })} />Critical only</label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No tools registered" body="Register every blade / cutter / specialised tool with a serial number. Lost critical items become food safety incidents." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Type</th><th>Serial</th><th>Description</th><th>Status</th><th>Holder</th><th>Critical</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => {
                    const lostCritical = r.status === 'Lost' && r.isCritical;
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.recordNumber}</strong></td>
                        <td>{r.itemType}</td>
                        <td>{r.serialNumber}</td>
                        <td>{r.description}<div className="table-subtext">{r.homeLocation}</div></td>
                        <td className={lostCritical ? 'cell-alert' : undefined}><span className={r.status === 'Lost' ? 'badge badge-danger' : r.status === 'Issued' ? 'badge badge-warning' : 'badge'}>{r.status}</span></td>
                        <td>{r.currentHolderName || (r.status === 'Available' ? r.homeLocation : '—')}</td>
                        <td>{r.isCritical ? <span className="badge badge-warning">CRITICAL</span> : <span className="muted">—</span>}</td>
                        <td><button className="table-button" onClick={() => { onEdit(r); setMode('form'); }}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
