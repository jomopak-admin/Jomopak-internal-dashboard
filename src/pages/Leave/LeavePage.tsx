/**
 * Leave Register (Phase 43).
 *
 * Admin / HR view of every leave request. Tabs:
 *   • Awaiting approval (gated by staffLeaveApprove permission)
 *   • All requests
 *   • Balances (per-employee snapshot, BCEA pro-rated)
 *
 * Staff submit requests via My Stuff — this page is for the people who
 * approve and report on them.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  LEAVE_TYPES,
  LeaveRequest,
  LeaveRequestFilters,
  LeaveRequestFormState,
  LeaveStatus,
  LeaveType,
} from '../../types';
import { formatDate } from '../../utils/calculations';
import { countWorkingDays, leaveBalanceFor } from '../../utils/leaveCalculations';

interface LeavePageProps {
  requests: LeaveRequest[];
  employees: Employee[];
  canApprove: boolean;
  filters: LeaveRequestFilters;
  setFilters: (v: LeaveRequestFilters) => void;
  form: LeaveRequestFormState;
  setForm: (v: LeaveRequestFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (r: LeaveRequest) => void;
  onApprove: (id: string, notes: string) => void;
  onDecline: (id: string, notes: string) => void;
  onCancel: (id: string) => void;
}

function statusBadgeClass(status: LeaveStatus): string {
  if (status === 'Approved' || status === 'Taken') return 'badge badge-success';
  if (status === 'Declined' || status === 'Cancelled') return 'badge badge-danger';
  return 'badge';
}

export function LeavePage({ requests, employees, canApprove, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onApprove, onDecline, onCancel }: LeavePageProps) {
  const [mode, setMode] = useState<'list' | 'form' | 'balances'>('list');
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const filtered = useMemo(() => {
    let list = requests;
    if (filters.tab === 'approval') {
      list = list.filter((r) => r.status === 'Pending');
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((r) => [r.employeeName, r.reason, r.requestNumber].join(' ').toLowerCase().includes(q));
    }
    if (filters.type) list = list.filter((r) => r.type === filters.type);
    if (filters.status) list = list.filter((r) => r.status === filters.status);
    if (filters.employeeId) list = list.filter((r) => r.employeeId === filters.employeeId);
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [requests, filters]);

  const stats = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved' || r.status === 'Taken').length,
    declined: requests.filter((r) => r.status === 'Declined').length,
  }), [requests]);

  function pickEmployee(id: string) {
    const e = employees.find((x) => x.id === id);
    setForm({ ...form, employeeId: id, employeeName: e ? `${e.firstName} ${e.lastName}`.trim() : form.employeeName });
  }

  const days = useMemo(() => countWorkingDays(form.startDate, form.endDate), [form.startDate, form.endDate]);

  const sections: FormWizardSection[] = [{
    key: 'leave',
    title: 'Leave request',
    missingRequired: [
      ...(form.employeeId || form.employeeName.trim() ? [] : ['Staff member']),
      ...(form.startDate ? [] : ['Start date']),
      ...(form.endDate ? [] : ['End date']),
    ],
    body: (
      <div className="form-grid">
        <label>
          <span>Staff member <RequiredMarker /></span>
          <select value={form.employeeId} onChange={(e) => pickEmployee(e.target.value)}>
            <option value="">— pick employee —</option>
            {employees.filter((e) => e.active !== false).map((e) => (
              <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Leave type <RequiredMarker /></span>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}>
            {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          <span>Start date <RequiredMarker /></span>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </label>
        <label>
          <span>End date <RequiredMarker /></span>
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </label>
        <div className="full-span muted" style={{ fontSize: '0.85rem' }}>
          {days > 0 ? `${days} working day${days === 1 ? '' : 's'} (weekends excluded)` : 'Pick a date range'}
        </div>
        <label className="full-span">
          <span>Reason</span>
          <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for leave" />
        </label>
        <label className="full-span">
          <span>Attachment URL (medical certificate, etc.)</span>
          <input type="url" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://..." />
        </label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={
        mode === 'list' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ghost-button" onClick={() => setMode('balances')}>Balances</button>
            <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New request</button>
          </div>
        ) : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>
      } />

      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit leave request' : 'New leave request'}
          subtitle="Submit on behalf of a staff member. Staff can also apply via their My Stuff page."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Submit request"
        />
      ) : mode === 'balances' ? (
        <section className="card">
          <SectionTitle title="Leave balances" subtitle="BCEA pro-rata accruals from each employee's start date" />
          {employees.filter((e) => e.active !== false).length === 0 ? (
            <EmptyState title="No active employees" body="Add employees in the Employees page to see balances." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Staff</th><th>Started</th><th>Annual</th><th>Sick</th><th>Family Resp.</th></tr></thead>
                <tbody>
                  {employees.filter((e) => e.active !== false).map((e) => {
                    const a = leaveBalanceFor(e, 'Annual', requests);
                    const s = leaveBalanceFor(e, 'Sick', requests);
                    const f = leaveBalanceFor(e, 'Family Responsibility', requests);
                    return (
                      <tr key={e.id}>
                        <td><strong>{e.firstName} {e.lastName}</strong><div className="table-subtext">{e.jobTitle || '—'}</div></td>
                        <td>{e.startDate ? formatDate(e.startDate) : '—'}</td>
                        <td>{a.available.toFixed(1)} / {a.entitlement.toFixed(1)}<div className="table-subtext">{a.taken.toFixed(1)} taken{a.pending > 0 ? ` · ${a.pending} pending` : ''}</div></td>
                        <td>{s.available.toFixed(1)} / {s.entitlement.toFixed(1)}<div className="table-subtext">{s.taken.toFixed(1)} taken{s.pending > 0 ? ` · ${s.pending} pending` : ''}</div></td>
                        <td>{f.available.toFixed(1)} / {f.entitlement.toFixed(1)}<div className="table-subtext">{f.taken.toFixed(1)} taken{f.pending > 0 ? ` · ${f.pending} pending` : ''}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card">
          <SectionTitle title="Leave Register" subtitle={`${filtered.length} of ${requests.length} request(s) shown`} />
          <div className="food-safety-stats">
            <div className={`food-safety-stat${stats.pending > 0 ? ' food-safety-stat-alert' : ''}`}><span>Pending approval</span><strong>{stats.pending}</strong></div>
            <div className="food-safety-stat"><span>Approved / Taken</span><strong>{stats.approved}</strong></div>
            <div className="food-safety-stat"><span>Declined</span><strong>{stats.declined}</strong></div>
            <div className="food-safety-stat"><span>Total</span><strong>{requests.length}</strong></div>
          </div>

          {canApprove ? (
            <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 12 }}>
              <button type="button" className={filters.tab === 'approval' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'approval' })}>Awaiting approval ({stats.pending})</button>
              <button type="button" className={filters.tab === 'all' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'all' })}>All</button>
            </div>
          ) : null}

          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name or reason" /></label>
            <label><span>Type</span>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All</option>
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Pending</option><option>Approved</option><option>Declined</option><option>Cancelled</option><option>Taken</option>
              </select>
            </label>
            <label><span>Employee</span>
              <select value={filters.employeeId} onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}>
                <option value="">All</option>
                {employees.filter((e) => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No requests" body="Staff can apply via their My Stuff page; you can also submit on their behalf." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Staff</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Reason</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.requestNumber}</strong></td>
                      <td>{r.employeeName}</td>
                      <td>{r.type}</td>
                      <td>{formatDate(r.startDate)}</td>
                      <td>{formatDate(r.endDate)}</td>
                      <td>{r.days}</td>
                      <td>
                        <span className={statusBadgeClass(r.status)}>{r.status}</span>
                        {r.approvedByName ? <div className="table-subtext">{r.approvedByName} · {r.approvedAt ? formatDate(r.approvedAt) : ''}</div> : null}
                      </td>
                      <td style={{ maxWidth: 220 }}><div className="table-subtext" style={{ whiteSpace: 'pre-wrap' }}>{r.reason || '—'}</div></td>
                      <td>
                        {canApprove && r.status === 'Pending' ? (
                          actionFor === r.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <textarea rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Notes (optional)" />
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="table-button" onClick={() => { onApprove(r.id, actionNotes); setActionFor(null); setActionNotes(''); }}>✓ Approve</button>
                                <button className="table-button danger" onClick={() => { onDecline(r.id, actionNotes); setActionFor(null); setActionNotes(''); }}>✗ Decline</button>
                                <button className="table-button" onClick={() => { setActionFor(null); setActionNotes(''); }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button className="table-button" onClick={() => { setActionFor(r.id); setActionNotes(''); }}>Review</button>
                          )
                        ) : null}
                        {r.status === 'Pending' || r.status === 'Approved' ? (
                          <button className="table-button" onClick={() => { if (confirm('Cancel this request?')) onCancel(r.id); }}>Cancel</button>
                        ) : null}
                        <button className="table-button" onClick={() => { onEdit(r); setMode('form'); }}>Edit</button>
                      </td>
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
