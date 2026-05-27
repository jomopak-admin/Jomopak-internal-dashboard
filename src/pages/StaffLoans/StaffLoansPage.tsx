/**
 * Staff Loans & Salary Advances (Phase 44).
 *
 * Each loan has a principal + monthly repayment. When you run the next
 * payroll, the system auto-deducts the monthly repayment from each active
 * loan and decrements the balance. Loan flips to 'Settled' when balance
 * reaches zero.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Employee,
  StaffLoan,
  StaffLoanFilters,
  StaffLoanFormState,
  StaffLoanStatus,
} from '../../types';
import { formatDate } from '../../utils/calculations';

interface StaffLoansPageProps {
  loans: StaffLoan[];
  employees: Employee[];
  filters: StaffLoanFilters;
  setFilters: (v: StaffLoanFilters) => void;
  form: StaffLoanFormState;
  setForm: (v: StaffLoanFormState) => void;
  editingId: string | null;
  message: string;
  onSave: () => void;
  onReset: () => void;
  onEdit: (l: StaffLoan) => void;
  onUpdateStatus: (id: string, status: StaffLoanStatus) => void;
}

function statusBadgeClass(s: StaffLoanStatus): string {
  if (s === 'Active') return 'badge';
  if (s === 'Settled') return 'badge badge-success';
  return 'badge badge-danger';
}

function money(n: number): string {
  return `R${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function StaffLoansPage({ loans, employees, filters, setFilters, form, setForm, editingId, message, onSave, onReset, onEdit, onUpdateStatus }: StaffLoansPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  const filtered = useMemo(() => {
    let list = loans;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter((l) => [l.employeeName, l.reason, l.loanNumber, l.notes].join(' ').toLowerCase().includes(q));
    }
    if (filters.status) list = list.filter((l) => l.status === filters.status);
    if (filters.employeeId) list = list.filter((l) => l.employeeId === filters.employeeId);
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [loans, filters]);

  const stats = useMemo(() => {
    const active = loans.filter((l) => l.status === 'Active');
    const totalOutstanding = active.reduce((s, l) => s + (l.balance || 0), 0);
    return { active: active.length, totalOutstanding, total: loans.length };
  }, [loans]);

  function pickEmployee(id: string) {
    const e = employees.find((x) => x.id === id);
    setForm({ ...form, employeeId: id, employeeName: e ? `${e.firstName} ${e.lastName}`.trim() : form.employeeName });
  }

  const sections: FormWizardSection[] = [{
    key: 'loan',
    title: 'Loan',
    missingRequired: [
      ...(form.employeeId || form.employeeName.trim() ? [] : ['Staff member']),
      ...(Number(form.principalAmount) > 0 ? [] : ['Principal amount']),
      ...(Number(form.monthlyRepayment) > 0 ? [] : ['Monthly repayment']),
      ...(form.startDate ? [] : ['Start date']),
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
          <span>Principal amount (R) <RequiredMarker /></span>
          <input type="number" min="0" step="0.01" value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} />
        </label>
        <label>
          <span>Monthly repayment (R) <RequiredMarker /></span>
          <input type="number" min="0" step="0.01" value={form.monthlyRepayment} onChange={(e) => setForm({ ...form, monthlyRepayment: e.target.value })} />
        </label>
        <label>
          <span>Start date <RequiredMarker /></span>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </label>
        <label>
          <span>Expected end date</span>
          <input type="date" value={form.expectedEndDate} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} />
        </label>
        <label className="full-span">
          <span>Reason</span>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why was the loan given?" />
        </label>
        <label className="full-span">
          <span>Internal notes</span>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
      </div>
    ),
  }];

  return (
    <>
      <SectionTitle action={mode === 'list'
        ? <button className="secondary-button" onClick={() => { onReset(); setMode('form'); }}>New loan</button>
        : <button className="ghost-button" onClick={() => { onReset(); setMode('list'); }}>Back</button>}
      />
      {mode === 'form' ? (
        <FormWizard
          title={editingId ? 'Edit loan' : 'New staff loan / advance'}
          subtitle="Monthly repayment will be auto-deducted from each payslip until the balance reaches zero."
          message={message || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={() => { onReset(); setMode('list'); }}
          isEditing={!!editingId}
          saveLabel="Save loan"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Staff Loans & Advances" subtitle={`${filtered.length} of ${loans.length} loan(s) shown`} />
          <div className="food-safety-stats">
            <div className="food-safety-stat"><span>Active loans</span><strong>{stats.active}</strong></div>
            <div className={`food-safety-stat${stats.totalOutstanding > 0 ? ' food-safety-stat-alert' : ''}`}><span>Total outstanding</span><strong>{money(stats.totalOutstanding)}</strong></div>
            <div className="food-safety-stat"><span>Total loans</span><strong>{stats.total}</strong></div>
          </div>
          <div className="filters-grid">
            <label><span>Search</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Name, reason" /></label>
            <label><span>Status</span>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All</option>
                <option>Active</option><option>Settled</option><option>Cancelled</option><option>Written Off</option>
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
            <EmptyState title="No loans" body="Add a loan or salary advance to start tracking repayments." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Staff</th><th>Principal</th><th>Monthly</th><th>Balance</th><th>Status</th><th>Start</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id}>
                      <td><strong>{l.loanNumber}</strong></td>
                      <td>{l.employeeName}<div className="table-subtext">{l.reason}</div></td>
                      <td>{money(l.principalAmount)}</td>
                      <td>{money(l.monthlyRepayment)}</td>
                      <td>{money(l.balance)}</td>
                      <td><span className={statusBadgeClass(l.status)}>{l.status}</span></td>
                      <td>{l.startDate ? formatDate(l.startDate) : '—'}</td>
                      <td>
                        <button className="table-button" onClick={() => { onEdit(l); setMode('form'); }}>Edit</button>
                        {l.status === 'Active' ? (
                          <>
                            <button className="table-button" onClick={() => { if (confirm('Mark as settled (zero balance)?')) onUpdateStatus(l.id, 'Settled'); }}>Settle</button>
                            <button className="table-button danger" onClick={() => { if (confirm('Cancel this loan?')) onUpdateStatus(l.id, 'Cancelled'); }}>Cancel</button>
                          </>
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
