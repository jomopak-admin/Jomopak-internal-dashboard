/**
 * PPE Issue & Control register.
 *
 * One row per PPE item issued to a staff member. Tracks replacement-due
 * dates so worn items get replaced before they fail.
 */

import { useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  Employee,
  PPE_ITEM_TYPES,
  PPE_TRANSACTION_TYPES,
  PpeIssueFilters,
  PpeIssueFormState,
  PpeIssueLineItem,
  PpeIssueRecord,
  PpeIssueStatus,
  PpeItemType,
  PpeTransactionType,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface PpeIssuePageProps {
  records: PpeIssueRecord[];
  /** Phase 122 — Employee list for the picker. PPE is now linked to a
   *  real Employee record instead of free text. */
  employees: Employee[];
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

export function PpeIssuePage({ records, employees, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit }: PpeIssuePageProps) {
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

  // Multi-item helpers (phase 39) — tick a PPE type to add it to the issue,
  // then enter quantity + description per item. Defaults to qty 1.
  const itemForType = (t: PpeItemType): PpeIssueLineItem | undefined => form.items.find((i) => i.type === t);
  function toggleItem(t: PpeItemType) {
    const next = itemForType(t)
      ? form.items.filter((i) => i.type !== t)
      : [...form.items, { type: t, description: '', quantity: 1 }];
    setForm({ ...form, items: next });
  }
  function updateItem(t: PpeItemType, patch: Partial<PpeIssueLineItem>) {
    setForm({ ...form, items: form.items.map((i) => (i.type === t ? { ...i, ...patch } : i)) });
  }

  // Phase 122 — Employee picker options. Only active employees so the
  // list stays clean as people leave.
  const employeeOptions: ComboboxOption[] = useMemo(
    () => employees
      .filter((e) => e.active !== false)
      .map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}`.trim(),
        sublabel: [e.jobTitle, e.department].filter(Boolean).join(' · ') || undefined,
      })),
    [employees],
  );

  /** Pick an Employee snapshot their name + role onto the form so the
   *  printable and history rows stay correct even if the employee is
   *  later renamed or has their job title changed. */
  function pickEmployee(employeeId: string) {
    const emp = employees.find((e) => e.id === employeeId);
    setForm({
      ...form,
      employeeId,
      staffName: emp ? `${emp.firstName} ${emp.lastName}`.trim() : form.staffName,
      staffRole: emp ? (emp.jobTitle || emp.department || '') : form.staffRole,
    });
  }

  const sections: FormWizardSection[] = [{
    key: 'issue', title: 'PPE issue',
    missingRequired: [
      ...(form.employeeId ? [] : ['Employee']),
      ...(form.issuedDate ? [] : ['Issue date']),
      ...(form.items.length > 0 ? [] : ['At least one PPE item']),
    ],
    body: (
      <div className="form-grid">
        {/* Phase 98 — Transaction type segmented control. Drives which
            extra fields show below (Required-by for Request, Return
            condition for Return). */}
        <div className="full-span" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 13, marginRight: 8 }}>Transaction type</span>
          {PPE_TRANSACTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, transactionType: t })}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                border: form.transactionType === t ? '1px solid var(--jp-accent, #2563eb)' : '1px solid var(--jp-border, #e5e2dc)',
                background: form.transactionType === t ? 'var(--jp-accent, #2563eb)' : 'var(--jp-paper, #fff)',
                color: form.transactionType === t ? '#fff' : 'var(--jp-ink, #444)',
                cursor: 'pointer',
              }}
            >{t}</button>
          ))}
        </div>
        {/* Phase 122 — Employee picker. PPE must be issued to a real
            Employee record; staff name + role auto-fill from the pick
            so the printable carries a clean snapshot. */}
        <label><span>Employee <RequiredMarker /></span><Combobox options={employeeOptions} value={form.employeeId} onChange={pickEmployee} placeholder="Search employees…" emptyMessage="No matching employees" /></label>
        <label><span>Role</span><input value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} placeholder="Auto-filled from employee" /></label>

        <div className="full-span">
          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>
            PPE items issued <RequiredMarker /> <span className="muted" style={{ fontWeight: 400 }}>· tick what you handed over, adjust qty / size as needed</span>
          </span>
          <div className="ppe-issue-rows">
            {PPE_ITEM_TYPES.map((t) => {
              const current = itemForType(t);
              const ticked = Boolean(current);
              return (
                <div key={t} className={`ppe-issue-row ${ticked ? 'is-active' : ''}`}>
                  <label className="ppe-issue-tick">
                    <input type="checkbox" checked={ticked} onChange={() => toggleItem(t)} />
                    <span>{t}</span>
                  </label>
                  {ticked ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        className="ppe-issue-qty"
                        value={current!.quantity}
                        onChange={(e) => updateItem(t, { quantity: Number(e.target.value) || 1 })}
                        aria-label={`${t} quantity`}
                      />
                      <input
                        type="text"
                        className="ppe-issue-desc"
                        value={current!.description}
                        onChange={(e) => updateItem(t, { description: e.target.value })}
                        placeholder="Size / colour / brand (optional)"
                        aria-label={`${t} description`}
                      />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <label><span>Issued by</span><input value={form.issuedByName} onChange={(e) => setForm({ ...form, issuedByName: e.target.value })} /></label>
        <label><span>Issue date <RequiredMarker /></span><input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} /></label>
        <label><span>Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PpeIssueStatus })}>
            <option>Issued</option><option>Returned</option><option>Damaged</option><option>Lost</option>
          </select>
        </label>
        <label><span>Replacement due</span><input type="date" value={form.replacementDueDate} onChange={(e) => setForm({ ...form, replacementDueDate: e.target.value })} /></label>
        <label><span>Return date</span><input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} /></label>
        {/* Phase 98 — conditional lifecycle fields. */}
        {form.transactionType === 'Request' ? (
          <label><span>Required by</span><input type="date" value={form.requiredByDate} onChange={(e) => setForm({ ...form, requiredByDate: e.target.value })} /></label>
        ) : null}
        {form.transactionType === 'Return' || form.transactionType === 'Disposal' ? (
          <label>
            <span>Return condition</span>
            <select value={form.returnCondition} onChange={(e) => setForm({ ...form, returnCondition: e.target.value as 'Good' | 'Damaged' | 'Expired' })}>
              <option>Good</option><option>Damaged</option><option>Expired</option>
            </select>
          </label>
        ) : null}
        <label className="full-span"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>

        <div className="full-span">
          <SignaturePad
            onChange={(d) => setForm({ ...form, employeeSignatureDataUrl: d })}
            label="Employee signature (acknowledges receipt of the items above)"
            height={160}
          />
        </div>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>Issue PPE</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
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
                  {filtered.map((r) => {
                    const items = r.items && r.items.length > 0 ? r.items : [{ type: r.itemType, description: r.itemDescription, quantity: r.quantity }];
                    const totalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
                    const itemSummary = items.length === 1
                      ? `${items[0].type}${items[0].description ? ` · ${items[0].description}` : ''}`
                      : `${items.length} items: ${items.map((i) => `${i.type}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(', ')}`;
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.issueNumber}</strong></td>
                        <td>{r.staffName}<div className="table-subtext">{r.staffRole}</div></td>
                        <td>{itemSummary}</td>
                        <td>{totalQty}</td>
                        <td>{formatDate(r.issuedDate)}</td>
                        <td>
                          <span className={r.status === 'Lost' || r.status === 'Damaged' ? 'badge badge-danger' : r.status === 'Issued' ? 'badge badge-success' : 'badge'}>{r.status}</span>
                          {r.employeeSignatureDataUrl ? <div className="table-subtext" style={{ color: 'var(--jp-orange)' }}>Signed</div> : null}
                        </td>
                        <td>{r.replacementDueDate ? formatDate(r.replacementDueDate) : '—'}</td>
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
