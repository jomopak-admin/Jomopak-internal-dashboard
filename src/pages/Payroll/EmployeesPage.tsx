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
import {
  ALL_EMPLOYEE_AVAILABILITY_STATUSES,
  AppSettingsCompany,
  DocumentRecord,
  Employee,
  EmployeeAvailabilityStatus,
  PayCycle,
  PpeIssueRecord,
} from '../../types';
import { EmployeeDocumentsPanel } from '../../components/EmployeeDocumentsPanel';
import { EmployeePpePanel } from '../../components/EmployeePpePanel';
import { PhotoUploader } from '../../components/PhotoUploader';
import { formatNumber } from '../../utils/calculations';
import { buildLetterhead } from '../../utils/printing';

interface EmployeesPageProps {
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onDelete: (id: string) => void;
  /** Used by the UI-19 generator for the employer-side fields. */
  companyName?: string;
  companyUifReference?: string;
  /** Phase 114 — Full company block so the UI-19 print can pick up the
   *  uploaded brand logo + letterhead from Settings Branding. */
  company?: AppSettingsCompany;
  /** Phase 96 — HR documents (Doc Vault rows where ownerType='employee'). */
  documents?: DocumentRecord[];
  uploaderName?: string;
  onSaveDocument?: (doc: DocumentRecord) => void;
  onDeleteDocument?: (id: string) => void;
  onUploadDocumentFile?: (file: File, docId: string) => Promise<{ storagePath: string; signedUrl: string } | null>;
  /** Phase 122.2 — PPE records, filtered to this employee in the panel. */
  ppeIssueRecords?: PpeIssueRecord[];
}

function emptyEmployee(): Employee {
  return {
    id: '', employeeNumber: '', firstName: '', lastName: '', idNumber: '', taxNumber: '',
    email: '', phone: '', jobTitle: '', department: '', payCycle: 'Monthly', basicSalary: 0,
    bankName: '', bankAccountNumber: '', bankBranchCode: '', accountType: 'Cheque',
    uifContributor: true, startDate: new Date().toISOString().slice(0, 10), endDate: '',
    active: true, notes: '',
    // Phase 56 — SMETA: hourly rate + standard hours. Defaults to BCEA 173.33
    // hours/month so the payslip shows a defensible "Rates & Quantities" line
    // even if you forget to set it.
    hourlyRate: 0,
    standardMonthlyHours: 173.33,
    // Phase 106.3 — visitor approval routing defaults.
    availabilityStatus: 'Available',
    canApproveVisitorAreas: true,
  };
}

function printUi19(e: Employee, companyName: string, companyUifRef: string, company?: AppSettingsCompany) {
  // Phase 50 — produce a printable UI-19 (UIF declaration on staff exit).
  // Internal/working draft only — the official UI-19 is captured on the
  // SARS / Dept of Labour ufiling portal but this print speeds up data
  // gathering when an employee leaves.
  // Phase 114 — letterhead at top so the uploaded company logo renders.
  const w = window.open('', '_blank', 'width=800,height=1100');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>UI-19 — ${e.firstName} ${e.lastName}</title>
<style>
  body { font-family: sans-serif; padding: 24px; color: #111; }
  h1 { margin: 0 0 4px; }
  h2 { margin: 24px 0 8px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; vertical-align: top; }
  .muted { color: #666; font-size: 11px; }
  .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .sig { margin-top: 60px; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; width: 240px; }
</style></head><body>
${buildLetterhead(company, { rightTitle: 'UI-19', rightSubtitle: 'UIF declaration', logoHeightPx: 90 })}
<h1>UI-19 Declaration of Employee Termination</h1>
<p class="muted">For submission to the UIF (Department of Employment &amp; Labour) — generated from the Jomopak dashboard</p>

<h2>Employer</h2>
<table><tbody>
  <tr><td>Employer name</td><td>${companyName || '—'}</td></tr>
  <tr><td>UIF reference number</td><td>${companyUifRef || '—'}</td></tr>
</tbody></table>

<h2>Employee</h2>
<table><tbody>
  <tr><td>Full name</td><td>${e.firstName} ${e.lastName}</td></tr>
  <tr><td>ID number</td><td>${e.idNumber || '—'}</td></tr>
  <tr><td>Tax reference</td><td>${e.taxNumber || '—'}</td></tr>
  <tr><td>Employee number</td><td>${e.employeeNumber || '—'}</td></tr>
  <tr><td>Job title</td><td>${e.jobTitle || '—'}</td></tr>
  <tr><td>Department</td><td>${e.department || '—'}</td></tr>
  <tr><td>Phone</td><td>${e.phone || '—'}</td></tr>
  <tr><td>Email</td><td>${e.email || '—'}</td></tr>
</tbody></table>

<h2>Employment dates</h2>
<table><tbody>
  <tr><td>Start date</td><td>${e.startDate || '—'}</td></tr>
  <tr><td>End date</td><td><strong>${e.endDate || '—'}</strong></td></tr>
  <tr><td>Pay cycle</td><td>${e.payCycle}</td></tr>
  <tr><td>Last basic salary</td><td>R ${(e.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
  <tr><td>UIF contributor?</td><td>${e.uifContributor ? 'Yes' : 'No'}</td></tr>
</tbody></table>

<h2>Banking</h2>
<table><tbody>
  <tr><td>Bank</td><td>${e.bankName || '—'}</td></tr>
  <tr><td>Branch code</td><td>${e.bankBranchCode || '—'}</td></tr>
  <tr><td>Account number</td><td>${e.bankAccountNumber || '—'}</td></tr>
  <tr><td>Account type</td><td>${e.accountType || '—'}</td></tr>
</tbody></table>

<h2>Reason for termination (tick one and add details)</h2>
<table><tbody>
  <tr><td>Resigned</td><td>Dismissed</td><td>Retrenched</td></tr>
  <tr><td>Contract expired</td><td>Death</td><td>Other (specify):</td></tr>
</tbody></table>
<p class="muted">Notes: ${e.notes || '—'}</p>

<div class="sig">
  <div class="sig-line">Employer signature &amp; date</div>
</div>

<p class="muted" style="margin-top: 40px;">Generated ${new Date().toLocaleString()} — Submit the official UI-19 via the Department of Labour's uFiling portal. This internal copy speeds up the data-gathering step.</p>
</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 250);
}

export function EmployeesPage({ employees, onSave, onDelete, companyName, companyUifReference, company, documents = [], uploaderName = '', onSaveDocument, onDeleteDocument, onUploadDocumentFile, ppeIssueRecords = [] }: EmployeesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<Employee>(emptyEmployee());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  /*  Phase 111.3 — SimplePay-style top tabs + filter chips + sortable cols.
   *
   *  Tabs: Employee List / Self-Service / Leave Overview / Bulk Actions.
   *  Filter chips: Pay Frequency, Current Status, plus a search box.
   *  Sortable columns: click a header to toggle asc/desc on that field. */
  type EmpTab = 'list' | 'selfService' | 'leave' | 'bulk';
  const [empTab, setEmpTab] = useState<EmpTab>('list');
  const EMP_TABS: Array<{ key: EmpTab; label: string }> = [
    { key: 'list', label: 'Employee List' },
    { key: 'selfService', label: 'Self-Service' },
    { key: 'leave', label: 'Leave Overview' },
    { key: 'bulk', label: 'Bulk Actions' },
  ];
  const [filterFrequency, setFilterFrequency] = useState<'All' | PayCycle>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('Active');
  const [filterSearch, setFilterSearch] = useState('');
  type SortKey = 'lastName' | 'firstName' | 'employeeNumber' | 'basicSalary';
  const [sortKey, setSortKey] = useState<SortKey>('lastName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  }

  const rows = useMemo(() => {
    const needle = filterSearch.trim().toLowerCase();
    return employees
      .filter((e) => (filterStatus === 'All' ? true : filterStatus === 'Active' ? e.active : !e.active))
      .filter((e) => (showInactive ? true : filterStatus !== 'Inactive' ? e.active : true))
      .filter((e) => (filterFrequency === 'All' ? true : e.payCycle === filterFrequency))
      .filter((e) =>
        !needle
        || `${e.firstName} ${e.lastName}`.toLowerCase().includes(needle)
        || (e.employeeNumber || '').toLowerCase().includes(needle)
        || (e.jobTitle || '').toLowerCase().includes(needle),
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'basicSalary') cmp = (a.basicSalary || 0) - (b.basicSalary || 0);
        else cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [employees, filterStatus, filterFrequency, filterSearch, sortKey, sortDir, showInactive]);

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
          backAction={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
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
            <label>
              <span>Standard monthly hours <span className="muted" style={{ fontSize: '0.78rem' }}>(BCEA default 173.33)</span></span>
              <input type="number" step="0.01" value={draft.standardMonthlyHours ?? 173.33} onChange={(e) => update({ standardMonthlyHours: Number(e.target.value) || 0 })} />
            </label>
            <label>
              <span>Hourly rate (R) <span className="muted" style={{ fontSize: '0.78rem' }}>(leave 0 to auto-compute from basic ÷ std hours)</span></span>
              <input type="number" step="0.01" value={draft.hourlyRate ?? 0} onChange={(e) => update({ hourlyRate: Number(e.target.value) || 0 })} />
            </label>
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
          {/* Phase 107.2 — Visitor approval routing.
              The employee's availability + backup wire into the Phase 106
              visitor approval router. When the employee is anything other
              than Available, incoming visitor requests for areas they host
              auto-route to the backup picked here. If no backup is set,
              requests stay with them and only escalate via the 5-min timer. */}
          <fieldset style={{ marginTop: '1rem', border: '1px solid var(--jp-divider, #cbd5e1)', borderRadius: 6, padding: '0.75rem' }}>
            <legend style={{ padding: '0 0.4rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>
              Visitor approval routing
            </legend>
            <div className="form-grid">
              <label>
                <span>Availability</span>
                <select
                  value={draft.availabilityStatus ?? 'Available'}
                  onChange={(e) => update({ availabilityStatus: e.target.value as EmployeeAvailabilityStatus })}
                >
                  {ALL_EMPLOYEE_AVAILABILITY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                <span>Backup approver</span>
                <select
                  value={draft.backupApproverEmployeeId ?? ''}
                  onChange={(e) => update({ backupApproverEmployeeId: e.target.value || undefined })}
                >
                  <option value="">— None —</option>
                  {employees
                    .filter((e) => e.id && e.id !== draft.id && e.active)
                    .map((e) => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.jobTitle || e.department}</option>
                    ))}
                </select>
              </label>
              {(draft.availabilityStatus ?? 'Available') === 'Delegate' ? (
                <label>
                  <span>Delegate to (while on Delegate status)</span>
                  <select
                    value={draft.delegateApprovalToEmployeeId ?? ''}
                    onChange={(e) => update({ delegateApprovalToEmployeeId: e.target.value || undefined })}
                  >
                    <option value="">— Pick a colleague —</option>
                    {employees
                      .filter((e) => e.id && e.id !== draft.id && e.active)
                      .map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                  </select>
                </label>
              ) : null}
              <label className="checkbox-row" style={{ alignSelf: 'end' }}>
                <input
                  type="checkbox"
                  checked={draft.canApproveVisitorAreas !== false}
                  onChange={(e) => update({ canApproveVisitorAreas: e.target.checked })}
                />
                Can approve visitor area requests
              </label>
            </div>
          </fieldset>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
          <div style={{ marginTop: '0.75rem' }}>
            <PhotoUploader
              urls={draft.photoUrls ?? []}
              onChange={(urls) => update({ photoUrls: urls })}
              recordType="employees"
              recordId={draft.id || `draft-${editingId || 'new'}`}
              label="Profile photo(s)"
              max={3}
            />
          </div>
          {/* Phase 96.2 — HR documents (warnings, contracts, extensions, etc.) */}
          {onSaveDocument && onDeleteDocument && onUploadDocumentFile ? (
            <EmployeeDocumentsPanel
              employee={draft}
              documents={documents}
              uploaderName={uploaderName}
              onSave={onSaveDocument}
              onDelete={onDeleteDocument}
              onUploadFile={onUploadDocumentFile}
            />
          ) : null}
          {/* Phase 122.2 — PPE issued to this employee. Only renders for
              saved employees (a draft with no id has nothing to filter on). */}
          {draft.id ? (
            <section className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, letterSpacing: '0.02em' }}>PPE issued to this employee</h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
                  Pulled from the PPE register. Overdue items show in orange.
                </p>
              </div>
              <EmployeePpePanel employee={draft} records={ppeIssueRecords} />
            </section>
          ) : null}
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

      {/* Phase 111.3 — Top tab strip. */}
      <div
        role="tablist"
        aria-label="Employees sections"
        style={{
          display: 'flex',
          gap: '1.25rem',
          borderBottom: '1px solid var(--border, #d8dde3)',
          marginBottom: '1rem',
        }}
      >
        {EMP_TABS.map((t) => {
          const isActive = t.key === empTab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setEmpTab(t.key)}
              style={{
                padding: '0.5rem 0',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--accent, #1f7a4d)' : '3px solid transparent',
                color: isActive ? 'var(--accent, #1f7a4d)' : 'var(--text, #1a1a1a)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {empTab === 'list' ? (
        <>
          <section className="stats-grid">
            <div className="card stat-card"><p className="stat-label">Active employees</p><h3>{employees.filter((e) => e.active).length}</h3></div>
            <div className="card stat-card"><p className="stat-label">Monthly basic wage bill</p><h3>R {formatNumber(monthlyWage, 2)}</h3></div>
          </section>

          {/* Filter chip row */}
          <section className="card" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.5rem 0.75rem' }}>
            <FilterChip label="Pay Frequency" value={filterFrequency} options={['All', 'Monthly', 'Weekly']} onChange={(v) => setFilterFrequency(v as 'All' | PayCycle)} />
            <FilterChip label="Current Status" value={filterStatus} options={['All', 'Active', 'Inactive']} onChange={(v) => setFilterStatus(v as 'All' | 'Active' | 'Inactive')} />
            <input
              type="search"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search name / number / job…"
              style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.6rem', borderRadius: '0.3rem', border: '1px solid var(--border, #d8dde3)' }}
            />
            <label className="accounting-check" style={{ marginLeft: 'auto' }}>
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              <span>Show inactive</span>
            </label>
          </section>

          {rows.length === 0 ? (
            <EmptyState title="No employees match" body="Adjust filters or add staff to start running payroll." />
          ) : (
            <section className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortableTh label="Last Name" k="lastName" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <SortableTh label="First Names" k="firstName" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <SortableTh label="Number" k="employeeNumber" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    <th>Job</th>
                    <th>Cycle</th>
                    <SortableTh label="Basic pay" k="basicSalary" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} align="right" />
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className={e.active ? '' : 'row-muted'}>
                      <td><strong>{e.lastName}</strong></td>
                      <td>{e.firstName}</td>
                      <td className="muted">{e.employeeNumber || '—'}</td>
                      <td>{e.jobTitle || '—'}</td>
                      <td>{e.payCycle}</td>
                      <td style={{ textAlign: 'right' }}>R {formatNumber(e.basicSalary, 2)}</td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <button className="link-button" onClick={() => startEdit(e)}>Edit</button>
                        {e.endDate ? (
                          <>
                            {' · '}
                            <button className="link-button" onClick={() => printUi19(e, companyName || 'JomoPak', companyUifReference || '', company)} title="Generate UI-19 (UIF declaration on staff exit)">UI-19</button>
                          </>
                        ) : null}
                        {' · '}
                        <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(e.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ padding: '0.5rem 1rem', color: 'var(--muted, #5b6b7a)', fontSize: '0.85rem' }}>
                Showing {rows.length} of {employees.length} entries
              </p>
            </section>
          )}
        </>
      ) : empTab === 'selfService' ? (
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3>Self-Service</h3>
          <p>
            Employees access their own payslips, leave balance, and submit leave requests via the
            <strong> My Stuff</strong> portal (sidebar &gt; My Stuff). They sign in with their personal
            email + the PIN issued at onboarding. Self-service access is enabled per employee on the
            Permissions tab inside each employee's profile.
          </p>
        </section>
      ) : empTab === 'leave' ? (
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3>Leave Overview</h3>
          <p>
            See annual / sick / family-responsibility leave balances per employee. Approve open leave
            requests under <strong>Leave</strong> in the sidebar, or open an employee's profile to see their
            full leave history.
          </p>
          <table className="data-table" style={{ marginTop: '0.75rem' }}>
            <thead>
              <tr><th>Employee</th><th>Annual</th><th>Sick</th><th>Family</th><th>Unpaid</th></tr>
            </thead>
            <tbody>
              {employees.filter((e) => e.active).slice(0, 50).map((e) => (
                <tr key={e.id}>
                  <td><strong>{e.firstName} {e.lastName}</strong></td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted, #5b6b7a)' }}>
            Balances pull from the Leave module once leave requests are approved against employee profiles.
          </p>
        </section>
      ) : (
        <section className="card" style={{ padding: '1.5rem' }}>
          <h3>Bulk Actions</h3>
          <p style={{ color: 'var(--muted, #5b6b7a)' }}>
            Apply changes to many employees at once.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem', maxWidth: '420px', marginTop: '0.75rem' }}>
            <button type="button" className="ghost-button" disabled>Bulk salary increase (coming soon)</button>
            <button type="button" className="ghost-button" disabled>Bulk pay-cycle change (coming soon)</button>
            <button type="button" className="ghost-button" disabled>Bulk export (CSV)</button>
            <button type="button" className="ghost-button" disabled>Send portal invitations</button>
          </div>
        </section>
      )}
    </div>
  );
}

/* --------------------------------- Helpers ----------------------------------- */
/*  Phase 111.3 — Tiny presentational helpers for the new tabs UX. */

function FilterChip({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'stretch',
      borderRadius: '0.3rem',
      overflow: 'hidden',
      border: '1px solid var(--border, #d8dde3)',
      fontSize: '0.8rem',
    }}>
      <span style={{ padding: '0.3rem 0.55rem', background: 'var(--surface, #f5f7fa)', color: 'var(--muted, #5b6b7a)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none',
          padding: '0.3rem 0.5rem',
          background: 'var(--accent, #1f7a4d)',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function SortableTh<K extends string>({
  label, k, sortKey, sortDir, onToggle, align = 'left',
}: {
  label: string;
  k: K;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onToggle: (k: K) => void;
  align?: 'left' | 'right';
}) {
  const isActive = k === sortKey;
  return (
    <th style={{ textAlign: align, cursor: 'pointer', userSelect: 'none' }} onClick={() => onToggle(k)}>
      {label}
      <span style={{ opacity: isActive ? 1 : 0.3, marginLeft: '0.25rem' }}>
        {isActive ? (sortDir === 'asc' ? '' : '') : ''}
      </span>
    </th>
  );
}
