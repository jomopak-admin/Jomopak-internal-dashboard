/**
 * Employees — Phase 26 (Payroll)
 *
 * The staff register that payroll runs draw from: pay, bank details, tax/ID
 * numbers, pay cycle. Kept simple — this is the master list, the actual money
 * maths happens in a Payroll run.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import { Employee, PayCycle } from '../../types';
import { formatNumber } from '../../utils/calculations';

interface EmployeesPageProps {
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

function emptyEmployee(): Employee {
  return {
    id: '', employeeNumber: '', firstName: '', lastName: '', idNumber: '', taxNumber: '',
    email: '', phone: '', jobTitle: '', department: '', payCycle: 'Monthly', basicSalary: 0,
    bankName: '', bankAccountNumber: '', bankBranchCode: '', accountType: 'Cheque',
    uifContributor: true, startDate: new Date().toISOString().slice(0, 10), endDate: '',
    active: true, notes: '',
  };
}

export function EmployeesPage({ employees, onSave, onDelete }: EmployeesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<Employee>(emptyEmployee());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const rows = useMemo(
    () => employees
      .filter((e) => (showInactive ? true : e.active))
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [employees, showInactive],
  );

  const monthlyWage = useMemo(
    () => employees.filter((e) => e.active).reduce((s, e) => s + (Number(e.basicSalary) || 0), 0),
    [employees],
  );

  function startNew() { setDraft(emptyEmployee()); setEditingId(null); setMode('form'); }
  function startEdit(e: Employee) { setDraft({ ...e }); setEditingId(e.id); setMode('form'); }
  function update(patch: Partial<Employee>) { setDraft((d) => ({ ...d, ...patch })); }

  function save() {
    if (!draft.firstName.trim() && !draft.lastName.trim()) return;
    onSave({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim() });
    setMode('list');
  }

  if (mode === 'form') {
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit ${draft.firstName} ${draft.lastName}` : 'New employee'}
          action={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <h3>Personal</h3>
          <div className="accounting-grid">
            <label><span>First name *</span><input value={draft.firstName} onChange={(e) => update({ firstName: e.target.value })} /></label>
            <label><span>Last name *</span><input value={draft.lastName} onChange={(e) => update({ lastName: e.target.value })} /></label>
            <label><span>Employee no.</span><input value={draft.employeeNumber} onChange={(e) => update({ employeeNumber: e.target.value })} placeholder="auto if blank" /></label>
            <label><span>ID number</span><input value={draft.idNumber} onChange={(e) => update({ idNumber: e.target.value })} /></label>
            <label><span>Tax number</span><input value={draft.taxNumber} onChange={(e) => update({ taxNumber: e.target.value })} /></label>
            <label><span>Email</span><input value={draft.email} onChange={(e) => update({ email: e.target.value })} /></label>
            <label><span>Phone</span><input value={draft.phone} onChange={(e) => update({ phone: e.target.value })} /></label>
            <label><span>Job title</span><input value={draft.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })} /></label>
            <label><span>Department</span><input value={draft.department} onChange={(e) => update({ department: e.target.value })} /></label>
          </div>
        </section>

        <section className="card">
          <h3>Pay</h3>
          <div className="accounting-grid">
            <label><span>Pay cycle</span>
              <select value={draft.payCycle} onChange={(e) => update({ payCycle: e.target.value as PayCycle })}>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </label>
            <label><span>Basic pay (gross / period)</span><input type="number" value={draft.basicSalary} onChange={(e) => update({ basicSalary: Number(e.target.value) })} /></label>
            <label className="accounting-check"><input type="checkbox" checked={draft.uifContributor} onChange={(e) => update({ uifContributor: e.target.checked })} /><span>UIF contributor</span></label>
            <label><span>Start date</span><input type="date" value={draft.startDate} onChange={(e) => update({ startDate: e.target.value })} /></label>
            <label><span>End date</span><input type="date" value={draft.endDate} onChange={(e) => update({ endDate: e.target.value })} /></label>
            <label className="accounting-check"><input type="checkbox" checked={draft.active} onChange={(e) => update({ active: e.target.checked })} /><span>Active</span></label>
          </div>
        </section>

        <section className="card">
          <h3>Bank details</h3>
          <div className="accounting-grid">
            <label><span>Bank</span><input value={draft.bankName} onChange={(e) => update({ bankName: e.target.value })} /></label>
            <label><span>Account number</span><input value={draft.bankAccountNumber} onChange={(e) => update({ bankAccountNumber: e.target.value })} /></label>
            <label><span>Branch code</span><input value={draft.bankBranchCode} onChange={(e) => update({ bankBranchCode: e.target.value })} /></label>
            <label><span>Account type</span>
              <select value={draft.accountType} onChange={(e) => update({ accountType: e.target.value })}>
                {['Cheque', 'Savings', 'Transmission', 'Other'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div className="accounting-actions">
            <button className="primary-button" onClick={save} disabled={!draft.firstName.trim() && !draft.lastName.trim()}>Save employee</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Employees"
        subtitle="The staff register payroll draws from."
        action={<button className="secondary-button" onClick={startNew}>New employee</button>}
      />

      <section className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Active employees</p><h3>{employees.filter((e) => e.active).length}</h3></div>
        <div className="card stat-card"><p className="stat-label">Monthly basic wage bill</p><h3>R {formatNumber(monthlyWage, 2)}</h3></div>
      </section>

      <section className="card accounting-toolbar">
        <label className="accounting-check"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /><span>Show inactive</span></label>
      </section>

      {rows.length === 0 ? (
        <EmptyState title="No employees" body="Add your staff to start running payroll." />
      ) : (
        <section className="card">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>No.</th><th>Job</th><th>Cycle</th><th style={{ textAlign: 'right' }}>Basic pay</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className={e.active ? '' : 'row-muted'}>
                  <td><strong>{e.firstName} {e.lastName}</strong>{!e.active ? <span className="muted"> · inactive</span> : null}</td>
                  <td className="muted">{e.employeeNumber || '—'}</td>
                  <td>{e.jobTitle || '—'}</td>
                  <td>{e.payCycle}</td>
                  <td style={{ textAlign: 'right' }}>R {formatNumber(e.basicSalary, 2)}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="link-button" onClick={() => startEdit(e)}>Edit</button>
                    {' · '}
                    <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
