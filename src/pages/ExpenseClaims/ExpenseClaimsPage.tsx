/**
 * Expense Claims (Phase 49).
 *
 * Three-stage flow:
 *   1. Staff submits claim ("R350 petrol delivering JC-123") — Pending
 *   2. Manager approves/declines — Approved or Declined
 *   3. Accountant marks Paid + records pay method (Cash / EFT / Next Payslip / Petty Cash)
 *
 * Tabs: My claims / Awaiting approval / Awaiting payment / All.
 * Gated by expenseClaims (view) + expenseClaimsApprove (manager capability).
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  EXPENSE_CLAIM_CATEGORIES,
  EXPENSE_CLAIM_PAY_METHODS,
  ExpenseClaim,
  ExpenseClaimCategory,
  ExpenseClaimFilters,
  ExpenseClaimFormState,
  ExpenseClaimPayMethod,
  ExpenseClaimStatus,
  JobCard,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface ExpenseClaimsPageProps {
  claims: ExpenseClaim[];
  employees: Employee[];
  jobs: JobCard[];
  currentUserName: string;
  canApprove: boolean;
  /** Accountants typically also have 'payroll' or 'accountsPayable' — re-use one of those for pay rights. */
  canPay: boolean;
  filters: ExpenseClaimFilters;
  setFilters: (v: ExpenseClaimFilters) => void;
  form: ExpenseClaimFormState;
  setForm: (v: ExpenseClaimFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (c: ExpenseClaim) => void;
  onCancel: (id: string) => void;
  onApprove: (id: string, notes: string) => void;
  onDecline: (id: string, notes: string) => void;
  onMarkPaid: (id: string, method: ExpenseClaimPayMethod) => void;
}

function statusBadge(s: ExpenseClaimStatus): string {
  if (s === 'Paid' || s === 'Approved') return 'badge badge-success';
  if (s === 'Declined' || s === 'Cancelled') return 'badge badge-danger';
  return 'badge';
}

function money(n: number): string {
  return `R${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExpenseClaimsPage({ claims, employees, jobs, currentUserName, canApprove, canPay, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onCancel, onApprove, onDecline, onMarkPaid }: ExpenseClaimsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionMethod, setActionMethod] = useState<ExpenseClaimPayMethod>('Next Payslip');

  const filtered = useMemo(() => {
    let list = claims;
    if (filters.tab === 'mine') {
      const me = currentUserName.trim().toLowerCase();
      list = list.filter((c) => c.employeeName.trim().toLowerCase() === me);
    } else if (filters.tab === 'approval') {
      list = list.filter((c) => c.status === 'Pending');
    } else if (filters.tab === 'payment') {
      list = list.filter((c) => c.status === 'Approved');
    }
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((c) => [c.employeeName, c.description, c.claimNumber, c.jobNumber].join(' ').toLowerCase().includes(q));
    }
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    if (filters.category) list = list.filter((c) => c.category === filters.category);
    if (filters.employeeId) list = list.filter((c) => c.employeeId === filters.employeeId);
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [claims, filters, currentUserName]);

  const stats = useMemo(() => ({
    mine: claims.filter((c) => c.employeeName.trim().toLowerCase() === currentUserName.trim().toLowerCase()).length,
    pendingApproval: claims.filter((c) => c.status === 'Pending').length,
    pendingPayment: claims.filter((c) => c.status === 'Approved').length,
    pendingPaymentValue: claims.filter((c) => c.status === 'Approved').reduce((s, c) => s + c.amount, 0),
  }), [claims, currentUserName]);

  function pickEmployee(id: string) {
    const e = employees.find((x) => x.id === id);
    setForm({ ...form, employeeId: id, employeeName: e ? `${e.firstName} ${e.lastName}`.trim() : form.employeeName });
  }
  function pickJob(id: string) {
    const j = jobs.find((x) => x.id === id);
    setForm({ ...form, jobId: id, jobNumber: j ? j.jobNumber : '' });
  }

  const sections: FormWizardSection[] = [{
    key: 'claim',
    title: 'Expense claim',
    missingRequired: [
      ...(form.employeeId || form.employeeName.trim() ? [] : ['Staff member']),
      ...(Number(form.amount) > 0 ? [] : ['Amount']),
      ...(form.description.trim() ? [] : ['Description']),
    ],
    body: (
      <div className="form-grid">
        <label><span>Staff member <RequiredMarker /></span>
          <select value={form.employeeId} onChange={(e) => pickEmployee(e.target.value)}>
            <option value="">— pick —</option>
            {employees.filter((e) => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </label>
        <label><span>Category</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseClaimCategory })}>
            {EXPENSE_CLAIM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label><span>Date of expense</span><input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} /></label>
        <label><span>Amount (R) <RequiredMarker /></span><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
        <label className="full-span"><span>Description <RequiredMarker /></span>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was the expense for?" />
        </label>
        <label><span>Related job (optional)</span>
          <select value={form.jobId} onChange={(e) => pickJob(e.target.value)}>
            <option value="">— none —</option>
            {jobs.slice(0, 100).map((j) => <option key={j.id} value={j.id}>{j.jobNumber} · {j.customerName}</option>)}
          </select>
        </label>
        <label><span>Receipt URL</span><input type="url" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} placeholder="https://..." /></label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list' ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New claim</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit expense claim' : 'New expense claim'}
          subtitle="Manager approves, then accounts marks it paid (via payslip or banking)."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Submit claim"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Expense Claims" subtitle={`${filtered.length} of ${claims.length} claim(s) shown · R${stats.pendingPaymentValue.toFixed(2)} awaiting payment`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>My claims</span><strong>{stats.mine}</strong></div>
            <div className={`food-safety-stat${stats.pendingApproval > 0 ? ' food-safety-stat-alert' : ''}`}><span>Pending approval</span><strong>{stats.pendingApproval}</strong></div>
            <div className={`food-safety-stat${stats.pendingPayment > 0 ? ' food-safety-stat-alert' : ''}`}><span>Pending payment</span><strong>{stats.pendingPayment}</strong></div>
            <div className="food-safety-stat"><span>Total</span><strong>{claims.length}</strong></div>
          </div>

          <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: 12 }}>
            <button type="button" className={filters.tab === 'mine' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'mine' })}>My claims ({stats.mine})</button>
            {canApprove ? <button type="button" className={filters.tab === 'approval' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'approval' })}>Awaiting approval ({stats.pendingApproval})</button> : null}
            {canPay ? <button type="button" className={filters.tab === 'payment' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'payment' })}>Awaiting payment ({stats.pendingPayment})</button> : null}
            <button type="button" className={filters.tab === 'all' ? 'secondary-button' : 'ghost-button'} onClick={() => setFilters({ ...filters, tab: 'all' })}>All</button>
          </div>

          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name / description" /></label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Pending</option><option>Approved</option><option>Declined</option><option>Paid</option><option>Cancelled</option>
              </select>
            </label>
            <label><span>Category</span>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>
                {EXPENSE_CLAIM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No claims here" body="Submit a claim or wait for one to be raised by staff." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Staff</th><th>Category</th><th>Amount</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.claimNumber}</strong></td>
                      <td>{c.employeeName}<div className="table-subtext">{formatDate(c.incidentDate)}{c.jobNumber ? ` · ${c.jobNumber}` : ''}</div></td>
                      <td>{c.category}</td>
                      <td>{money(c.amount)}</td>
                      <td style={{ maxWidth: 280 }}>
                        <div className="table-subtext" style={{ whiteSpace: 'pre-wrap' }}>{c.description}</div>
                        {c.receiptUrl ? <a href={c.receiptUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>Receipt </a> : null}
                      </td>
                      <td>
                        <span className={statusBadge(c.status)}>{c.status}</span>
                        {c.payMethod && c.status === 'Paid' ? <div className="table-subtext">via {c.payMethod}</div> : null}
                      </td>
                      <td>
                        {c.status === 'Pending' && c.employeeName.trim().toLowerCase() === currentUserName.trim().toLowerCase() ? (
                          <>
                            <button className="table-button" onClick={() => { onEdit(c); setMode('form'); }}>Edit</button>
                            <button className="table-button danger" onClick={() => { if (confirm('Cancel this claim?')) onCancel(c.id); }}>Cancel</button>
                          </>
                        ) : null}
                        {canApprove && c.status === 'Pending' ? (
                          actionFor === c.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <textarea rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} placeholder="Notes (optional)" />
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="table-button" onClick={() => { onApprove(c.id, actionNotes); setActionFor(null); setActionNotes(''); }}>Approve</button>
                                <button className="table-button danger" onClick={() => { onDecline(c.id, actionNotes); setActionFor(null); setActionNotes(''); }}>Decline</button>
                                <button className="table-button" onClick={() => { setActionFor(null); setActionNotes(''); }}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button className="table-button" onClick={() => { setActionFor(c.id); setActionNotes(''); }}>Review</button>
                          )
                        ) : null}
                        {canPay && c.status === 'Approved' ? (
                          actionFor === c.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <select value={actionMethod} onChange={(e) => setActionMethod(e.target.value as ExpenseClaimPayMethod)}>
                                {EXPENSE_CLAIM_PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                              </select>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="table-button" onClick={() => { onMarkPaid(c.id, actionMethod); setActionFor(null); }}>Mark paid</button>
                                <button className="table-button" onClick={() => setActionFor(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button className="table-button" onClick={() => { setActionFor(c.id); setActionMethod('Next Payslip'); }}>Pay</button>
                          )
                        ) : null}
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
