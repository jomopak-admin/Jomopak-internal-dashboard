/**
 * Payroll — Phase 26
 *
 * Run monthly (or weekly) payroll. Creating a run pulls active employees for the
 * cycle and pre-fills a payslip each: gross from their basic pay, UIF (1%, capped
 * at R177.12/mth) and SDL (1%) as editable defaults. PAYE and other deductions
 * are entered by hand — no tax tables here. The run totals feed EMP201.
 *
 * "Send payroll out" produces: printable payslips and a bank EFT CSV you upload
 * to your bank. Emailing payslips needs a mail connector wired up first.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  AppSettingsCompany,
  Employee,
  PAYROLL_ADJUSTMENT_TYPES,
  PayCycle,
  PayrollAdjustment,
  PayrollAdjustmentType,
  PayrollRun,
  PayrollRunStatus,
  PAYROLL_RUN_STATUSES,
  Payslip,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { buildPayslipHtml, computePayslipYtd, sendEmails, OutgoingEmail } from '../../utils/emailService';

interface PayrollPageProps {
  payrollRuns: PayrollRun[];
  employees: Employee[];
  company?: AppSettingsCompany;
  onSave: (run: PayrollRun) => void;
  onDelete: (id: string) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const UIF_RATE = 0.01;
const UIF_MONTHLY_CAP = 17712; // R177.12 max each side
const SDL_RATE = 0.01;

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

const STATUS_CLASS: Record<PayrollRunStatus, string> = {
  'Draft': 'status-pending',
  'Approved': 'status-ocr_done',
  'Paid': 'status-reviewed',
};

function recomputePayslip(p: Payslip): Payslip {
  const gross = round2((Number(p.basicSalary) || 0) + (Number(p.allowances) || 0));
  const net = round2(gross - (Number(p.paye) || 0) - (Number(p.uifEmployee) || 0) - (Number(p.otherDeductions) || 0));
  return { ...p, grossPay: gross, netPay: net };
}

function recomputeTotals(run: PayrollRun): PayrollRun {
  const t = run.payslips.reduce(
    (acc, p) => {
      acc.gross += Number(p.grossPay) || 0;
      acc.paye += Number(p.paye) || 0;
      acc.uifE += Number(p.uifEmployee) || 0;
      acc.uifR += Number(p.uifEmployer) || 0;
      acc.sdl += Number(p.sdl) || 0;
      acc.other += Number(p.otherDeductions) || 0;
      acc.net += Number(p.netPay) || 0;
      return acc;
    },
    { gross: 0, paye: 0, uifE: 0, uifR: 0, sdl: 0, other: 0, net: 0 },
  );
  return {
    ...run,
    totalGross: round2(t.gross),
    totalPaye: round2(t.paye),
    totalUifEmployee: round2(t.uifE),
    totalUifEmployer: round2(t.uifR),
    totalSdl: round2(t.sdl),
    totalOtherDeductions: round2(t.other),
    totalNet: round2(t.net),
  };
}

function buildPayslips(employees: Employee[], cycle: PayCycle): Payslip[] {
  return employees
    .filter((e) => e.active && e.payCycle === cycle)
    .map((e) => {
      const gross = Number(e.basicSalary) || 0;
      const uifBase = cycle === 'Monthly' ? Math.min(gross, UIF_MONTHLY_CAP) : gross;
      const uif = e.uifContributor ? round2(uifBase * UIF_RATE) : 0;
      const slip: Payslip = {
        id: `slip-${e.id}-${Date.now()}`,
        employeeId: e.id,
        employeeName: `${e.firstName} ${e.lastName}`.trim(),
        employeeNumber: e.employeeNumber,
        basicSalary: gross,
        allowances: 0,
        grossPay: gross,
        paye: 0,
        uifEmployee: uif,
        otherDeductions: 0,
        netPay: 0,
        uifEmployer: uif,
        sdl: round2(gross * SDL_RATE),
        notes: '',
      };
      return recomputePayslip(slip);
    });
}

function emptyRun(): PayrollRun {
  const now = new Date();
  return {
    id: '', runNumber: '', createdAt: '', payCycle: 'Monthly',
    periodMonth: now.getMonth() + 1, periodYear: now.getFullYear(),
    periodLabel: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    payDate: now.toISOString().slice(0, 10), status: 'Draft', payslips: [],
    totalGross: 0, totalPaye: 0, totalUifEmployee: 0, totalUifEmployer: 0,
    totalSdl: 0, totalOtherDeductions: 0, totalNet: 0, notes: '',
  };
}

export function PayrollPage({ payrollRuns, employees, company, onSave, onDelete }: PayrollPageProps) {
  const [mode, setMode] = useState<'list' | 'run' | 'payslips'>('list');
  const [draft, setDraft] = useState<PayrollRun>(emptyRun());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const sorted = useMemo(
    () => [...payrollRuns].sort((a, b) => (b.periodYear - a.periodYear) || (b.periodMonth - a.periodMonth)),
    [payrollRuns],
  );

  function startNew() {
    const base = emptyRun();
    setDraft(recomputeTotals({ ...base, payslips: buildPayslips(employees, base.payCycle) }));
    setEditingId(null);
    setMessage('');
    setMode('run');
  }
  function startEdit(r: PayrollRun) { setDraft(recomputeTotals(r)); setEditingId(r.id); setMessage(''); setMode('run'); }

  function updateRun(patch: Partial<PayrollRun>) { setDraft((d) => recomputeTotals({ ...d, ...patch })); }

  function setPeriod(month: number, year: number) {
    updateRun({ periodMonth: month, periodYear: year, periodLabel: `${MONTHS[month - 1]} ${year}` });
  }

  function regeneratePayslips(cycle: PayCycle) {
    setDraft((d) => recomputeTotals({ ...d, payCycle: cycle, payslips: buildPayslips(employees, cycle) }));
  }

  function updateSlip(id: string, patch: Partial<Payslip>) {
    setDraft((d) => recomputeTotals({ ...d, payslips: d.payslips.map((p) => (p.id === id ? recomputePayslip({ ...p, ...patch }) : p)) }));
  }

  // Phase 48 — payroll adjustments (bonuses / 13th cheque / commissions).
  // Stored on draft.adjustments; auto-applied to payslips when run is
  // Approved (logic lives in App.tsx onSave wrapper).
  function addAdjustment(a: Omit<PayrollAdjustment, 'id'>) {
    const next: PayrollAdjustment = { id: `adj-${Date.now().toString(36)}`, ...a };
    setDraft((d) => ({ ...d, adjustments: [...(d.adjustments ?? []), next] }));
  }
  function removeAdjustment(id: string) {
    setDraft((d) => ({ ...d, adjustments: (d.adjustments ?? []).filter((a) => a.id !== id) }));
  }

  function save() {
    if (draft.payslips.length === 0) return;
    onSave(recomputeTotals(draft));
    setMode('list');
  }

  function exportEft() {
    const rows = [['Employee', 'Employee No', 'Bank', 'Branch Code', 'Account Number', 'Account Type', 'Amount', 'Reference']];
    for (const p of draft.payslips) {
      if ((Number(p.netPay) || 0) <= 0) continue;
      const emp = employeeById.get(p.employeeId);
      rows.push([
        p.employeeName,
        p.employeeNumber || '',
        emp?.bankName || '',
        emp?.bankBranchCode || '',
        emp?.bankAccountNumber || '',
        emp?.accountType || '',
        (Number(p.netPay) || 0).toFixed(2),
        `SALARY ${draft.periodLabel}`,
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-eft-${draft.periodYear}-${String(draft.periodMonth).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Bank EFT file downloaded — upload it to your bank to pay staff.');
  }

  async function emailPayslips() {
    const emails: OutgoingEmail[] = [];
    const skipped: string[] = [];
    for (const p of draft.payslips) {
      const emp = employeeById.get(p.employeeId);
      if (!emp?.email) { skipped.push(p.employeeName); continue; }
      const ytd = computePayslipYtd(p.employeeId, payrollRuns, draft);
      emails.push({ to: emp.email, subject: `Payslip — ${draft.periodLabel}`, html: buildPayslipHtml(p, draft, company, ytd, emp) });
    }
    if (emails.length === 0) {
      setMessage('No employees have an email address on file — add emails under Employees first.');
      return;
    }
    setSending(true);
    setMessage('Sending payslips…');
    const res = await sendEmails(emails);
    setSending(false);
    if (res.error) {
      setMessage(`Could not send: ${res.error}`);
    } else {
      const skipNote = skipped.length ? ` ${skipped.length} skipped (no email on file).` : '';
      const failNote = res.sent < res.total ? ` ${res.total - res.sent} failed.` : '';
      setMessage(`Emailed ${res.sent} of ${res.total} payslips.${skipNote}${failNote}`);
    }
  }

  // ───────────────────────────────────────────────────────────── Payslip print
  if (mode === 'payslips') {
    return (
      <div className="page-stack">
        <SectionTitle
          title={`Payslips — ${draft.periodLabel}`}
          action={<>
            <button className="ghost-button no-print" onClick={() => setMode('run')}>Back</button>
            <button className="primary-button no-print" onClick={() => window.print()}>Print all</button>
          </>}
        />
        <div className="payslip-stack">
          {draft.payslips.map((p) => {
            const emp = employeeById.get(p.employeeId);
            // Phase 55 — use the SMETA-compliant template (with YTD pulled
            // from prior approved payroll runs in the same tax year).
            const ytd = computePayslipYtd(p.employeeId, payrollRuns, draft);
            const html = buildPayslipHtml(p, draft, company, ytd, emp);
            return (
              <article key={p.id} className="card payslip-doc">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────── Run editor
  if (mode === 'run') {
    const emp201 = round2(draft.totalPaye + draft.totalUifEmployee + draft.totalUifEmployer + draft.totalSdl);
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Payroll — ${draft.periodLabel}` : 'New payroll run'}
          action={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <div className="accounting-grid">
            <label><span>Pay cycle</span>
              <select value={draft.payCycle} onChange={(e) => regeneratePayslips(e.target.value as PayCycle)}>
                <option value="Monthly">Monthly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </label>
            <label><span>Month</span>
              <select value={draft.periodMonth} onChange={(e) => setPeriod(Number(e.target.value), draft.periodYear)}>
                {MONTHS.map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
              </select>
            </label>
            <label><span>Year</span><input type="number" value={draft.periodYear} onChange={(e) => setPeriod(draft.periodMonth, Number(e.target.value))} /></label>
            <label><span>Pay date</span><input type="date" value={draft.payDate} onChange={(e) => updateRun({ payDate: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => updateRun({ status: e.target.value as PayrollRunStatus })}>
                {PAYROLL_RUN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {!editingId && (
            <button className="ghost-button" style={{ marginTop: '0.5rem' }} onClick={() => regeneratePayslips(draft.payCycle)}>↻ Rebuild payslips from employees</button>
          )}
        </section>

        <section className="card">
          <h3>Payslips ({draft.payslips.length})</h3>
          {draft.payslips.length === 0 ? (
            <p className="muted">No active employees for this cycle. Add staff under Employees first.</p>
          ) : (
            <div className="payroll-table-wrap">
              <table className="data-table payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th className="num">Basic</th>
                    <th className="num">Allow.</th>
                    <th className="num" title="Overtime hours at 1.5× rate">OT 1.5×</th>
                    <th className="num" title="Overtime hours at 2× rate">OT 2×</th>
                    <th className="num">Sunday</th>
                    <th className="num" title="Public holiday hours at 2× rate">Pub Hol</th>
                    <th className="num">Gross</th>
                    <th className="num">PAYE</th>
                    <th className="num">UIF</th>
                    <th className="num">Other</th>
                    <th className="num">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.payslips.map((p) => (
                    <tr key={p.id}>
                      <td>{p.employeeName}</td>
                      <td><input type="number" className="payroll-input" value={p.basicSalary} onChange={(e) => updateSlip(p.id, { basicSalary: Number(e.target.value) })} /></td>
                      <td><input type="number" className="payroll-input" value={p.allowances} onChange={(e) => updateSlip(p.id, { allowances: Number(e.target.value) })} /></td>
                      <td><input type="number" step="0.25" className="payroll-input" value={p.overtime15Hours ?? 0} onChange={(e) => updateSlip(p.id, { overtime15Hours: Number(e.target.value) || 0 })} /></td>
                      <td><input type="number" step="0.25" className="payroll-input" value={p.overtime2Hours ?? 0} onChange={(e) => updateSlip(p.id, { overtime2Hours: Number(e.target.value) || 0 })} /></td>
                      <td><input type="number" step="0.25" className="payroll-input" value={p.sundayHours ?? 0} onChange={(e) => updateSlip(p.id, { sundayHours: Number(e.target.value) || 0 })} /></td>
                      <td><input type="number" step="0.25" className="payroll-input" value={p.publicHolidayHours ?? 0} onChange={(e) => updateSlip(p.id, { publicHolidayHours: Number(e.target.value) || 0 })} /></td>
                      <td className="num">{formatNumber(p.grossPay, 2)}</td>
                      <td><input type="number" className="payroll-input" value={p.paye} onChange={(e) => updateSlip(p.id, { paye: Number(e.target.value) })} /></td>
                      <td><input type="number" className="payroll-input" value={p.uifEmployee} onChange={(e) => updateSlip(p.id, { uifEmployee: Number(e.target.value) })} /></td>
                      <td><input type="number" className="payroll-input" value={p.otherDeductions} onChange={(e) => updateSlip(p.id, { otherDeductions: Number(e.target.value) })} /></td>
                      <td className="num"><strong>{formatNumber(p.netPay, 2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="payroll-totals">
                    <td>Totals</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + p.basicSalary, 0), 2)}</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + p.allowances, 0), 2)}</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + (p.overtime15Hours ?? 0), 0), 1)}h</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + (p.overtime2Hours ?? 0), 0), 1)}h</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + (p.sundayHours ?? 0), 0), 1)}h</td>
                    <td className="num">{formatNumber(draft.payslips.reduce((s, p) => s + (p.publicHolidayHours ?? 0), 0), 1)}h</td>
                    <td className="num">{formatNumber(draft.totalGross, 2)}</td>
                    <td className="num">{formatNumber(draft.totalPaye, 2)}</td>
                    <td className="num">{formatNumber(draft.totalUifEmployee, 2)}</td>
                    <td className="num">{formatNumber(draft.totalOtherDeductions, 2)}</td>
                    <td className="num"><strong>{formatNumber(draft.totalNet, 2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                Overtime hours auto-compute pay at SA BCEA premiums (1.5× weekday, 2× Sunday + Public Holiday) using each employee's hourly rate, and appear as separate income lines on the payslip when the run is Approved.
              </p>
            </div>
          )}

          {/* Phase 48 — adjustments section (bonuses, 13th cheque, etc.) */}
          <AdjustmentsSection
            adjustments={draft.adjustments ?? []}
            employees={employees}
            onAdd={addAdjustment}
            onRemove={removeAdjustment}
          />

          <div className="payroll-summary">
            <div><span className="muted">Net to pay staff</span><strong>R {formatNumber(draft.totalNet, 2)}</strong></div>
            <div><span className="muted">EMP201 to SARS</span><strong>R {formatNumber(emp201, 2)}</strong></div>
            <div><span className="muted">SDL</span><strong>R {formatNumber(draft.totalSdl, 2)}</strong></div>
          </div>

          {message ? <p className="muted" style={{ color: 'var(--jp-accent, #1f7a4d)' }}>{message}</p> : null}

          <div className="payroll-actions">
            <button className="primary-button" onClick={save} disabled={draft.payslips.length === 0}>Save run</button>
            <button className="secondary-button" onClick={() => setMode('payslips')} disabled={draft.payslips.length === 0}>View / print payslips</button>
            <button className="ghost-button" onClick={exportEft} disabled={draft.payslips.length === 0}>Download bank EFT file</button>
            <button className="ghost-button" onClick={emailPayslips} disabled={draft.payslips.length === 0 || sending}>{sending ? 'Sending…' : 'Email payslips'}</button>
          </div>
        </section>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────── List
  return (
    <div className="page-stack">
      <SectionTitle
        title="Payroll"
        subtitle="Run payroll, produce payslips and a bank file. PAYE is entered manually — not computed from tax tables."
        action={<button className="secondary-button" onClick={startNew}>New payroll run</button>}
      />
      {sorted.length === 0 ? (
        <EmptyState title="No payroll runs yet" body="Start a run to produce payslips and EMP201 totals." />
      ) : (
        <section className="card">
          <table className="data-table">
            <thead>
              <tr><th>Period</th><th>Pay date</th><th>Status</th><th style={{ textAlign: 'center' }}>Staff</th><th style={{ textAlign: 'right' }}>Net</th><th style={{ textAlign: 'right' }}>EMP201</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const emp201 = round2(r.totalPaye + r.totalUifEmployee + r.totalUifEmployer + r.totalSdl);
                return (
                  <tr key={r.id}>
                    <td><strong>{r.periodLabel}</strong><div className="muted" style={{ fontSize: '0.75rem' }}>{r.payCycle}</div></td>
                    <td>{r.payDate || '—'}</td>
                    <td><span className={`status-pill ${STATUS_CLASS[r.status]}`}>{r.status}</span></td>
                    <td style={{ textAlign: 'center' }}>{r.payslips.length}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(r.totalNet, 2)}</td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(emp201, 2)}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(r)}>Open</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(r.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

/**
 * Phase 48 — Inline UI for adding payroll adjustments (bonuses, 13th cheque,
 * commissions, ad-hoc reimbursements). Displayed on the draft-run editor.
 * Auto-applied to each employee's payslip when the run is Approved (logic
 * in App.tsx onSave wrapper).
 */
function AdjustmentsSection({ adjustments, employees, onAdd, onRemove }: {
  adjustments: PayrollAdjustment[];
  employees: Employee[];
  onAdd: (a: Omit<PayrollAdjustment, 'id'>) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [type, setType] = useState<PayrollAdjustmentType>('Bonus');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [taxable, setTaxable] = useState(true);

  function submit() {
    const amt = Number(amount);
    if (!empId || !amt) return;
    onAdd({ employeeId: empId, type, amount: amt, description: description.trim(), taxable });
    setEmpId(''); setAmount(''); setDescription(''); setType('Bonus'); setTaxable(true);
    setOpen(false);
  }

  const empMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  return (
    <section className="card" style={{ marginTop: 16, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>Adjustments (bonuses, 13th cheque, commissions, reimbursements)</strong>
        <button className="ghost-button" onClick={() => setOpen((v) => !v)}>{open ? 'Cancel' : '+ Add adjustment'}</button>
      </div>
      {open ? (
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
          <label><span>Employee</span>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)}>
              <option value="">— pick —</option>
              {employees.filter((e) => e.active !== false).map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </label>
          <label><span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as PayrollAdjustmentType)}>
              {PAYROLL_ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label><span>Amount (R)</span>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="full-span"><span>Description</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Q4 performance bonus" />
          </label>
          <label className="full-span" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} />
            <span>Taxable (most additions are; tick OFF for reimbursements)</span>
          </label>
          <div className="full-span">
            <button className="secondary-button" onClick={submit} disabled={!empId || !amount}>Add</button>
          </div>
        </div>
      ) : null}
      {adjustments.length === 0 ? (
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 0 }}>No adjustments on this run. Bonuses and once-off payments will auto-apply to payslips when you set the run status to Approved.</p>
      ) : (
        <table className="data-table" style={{ marginTop: 4 }}>
          <thead><tr><th>Employee</th><th>Type</th><th className="num">Amount</th><th>Description</th><th>Taxable</th><th></th></tr></thead>
          <tbody>
            {adjustments.map((a) => {
              const e = empMap.get(a.employeeId);
              return (
                <tr key={a.id}>
                  <td>{e ? `${e.firstName} ${e.lastName}` : a.employeeId}</td>
                  <td>{a.type}</td>
                  <td className="num">R {formatNumber(a.amount, 2)}</td>
                  <td>{a.description}</td>
                  <td>{a.taxable ? 'Yes' : 'No'}</td>
                  <td><button className="table-button danger" onClick={() => onRemove(a.id)}>Remove</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
