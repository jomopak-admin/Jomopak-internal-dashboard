/**
 * IRP5 / IT3a + EMP501 Centre (Phase 46).
 *
 * Year-end summary per employee for a given SA tax year (March → February).
 * Two tabs:
 *   • IRP5 — per-employee totals with SARS source codes; print or CSV
 *   • EMP501 — annual reconciliation roll-up (totals + EMP201 obligation)
 *
 * CSV export is the SARS easyFile-compatible format that most small
 * businesses use — accountant imports it into easyFile to generate the
 * official IRP5 certificates + EMP501 submission.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Employee, PayrollRun } from '../../types';
import { formatDate } from '../../utils/calculations';
import { buildEmp501, buildIrp5, currentTaxYearStart, Irp5LineItem } from '../../utils/irp5Calculations';

interface Irp5CentrePageProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  companyName: string;
}

function money(n: number): string {
  return `R${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const escape = (v: string) => (v.includes(',') || v.includes('"') || v.includes('\n')) ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Irp5CentrePage({ employees, payrollRuns, companyName }: Irp5CentrePageProps) {
  const thisTaxYear = currentTaxYearStart();
  const [taxYear, setTaxYear] = useState<number>(thisTaxYear);
  const [tab, setTab] = useState<'irp5' | 'emp501'>('irp5');

  const lines = useMemo(() => buildIrp5(employees, payrollRuns, taxYear), [employees, payrollRuns, taxYear]);
  const summary = useMemo(() => buildEmp501(lines, taxYear), [lines, taxYear]);

  function exportIrp5Csv() {
    const header = ['Employee Number', 'First Name', 'Last Name', 'ID Number', 'Tax Number', 'From', 'To', '3601 Income', '4102 PAYE', '4141 UIF (Emp)', '4142 UIF (Empr)', '4149 SDL', '4115 Other Deductions', 'Net Pay'];
    const rows = lines.map((l) => [
      l.employee.employeeNumber,
      l.employee.firstName,
      l.employee.lastName,
      l.employee.idNumber,
      l.employee.taxNumber,
      l.fromDate,
      l.toDate,
      l.income3601.toFixed(2),
      l.paye4102.toFixed(2),
      l.uifEmployee4141.toFixed(2),
      l.uifEmployer4142.toFixed(2),
      l.sdl4149.toFixed(2),
      l.otherDeductions4115.toFixed(2),
      l.netPay.toFixed(2),
    ]);
    downloadCsv(`IRP5-${taxYear}-${taxYear + 1}.csv`, header, rows);
  }

  function exportEmp501Csv() {
    const header = ['Field', 'Value'];
    const rows: string[][] = [
      ['Company', companyName],
      ['Tax year', `${taxYear} / ${taxYear + 1}`],
      ['Period', `${summary.fromDate} → ${summary.toDate}`],
      ['Employees', String(summary.totalEmployees)],
      ['Total income (3601)', summary.totalIncome.toFixed(2)],
      ['Total PAYE (4102)', summary.totalPaye.toFixed(2)],
      ['Total UIF — Employee (4141)', summary.totalUifEmployee.toFixed(2)],
      ['Total UIF — Employer (4142)', summary.totalUifEmployer.toFixed(2)],
      ['Total SDL (4149)', summary.totalSdl.toFixed(2)],
      ['Total EMP201 obligation', summary.totalEmp201.toFixed(2)],
    ];
    downloadCsv(`EMP501-${taxYear}-${taxYear + 1}.csv`, header, rows);
  }

  function printIrp5(line: Irp5LineItem) {
    // Open a simple printable IRP5-style view in a new tab.
    const w = window.open('', '_blank', 'width=800,height=1100');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>IRP5 — ${line.employee.firstName} ${line.employee.lastName}</title>
<style>
  body { font-family: sans-serif; padding: 24px; color: #111; }
  h1 { margin: 0 0 4px; }
  h2 { margin: 24px 0 8px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
  td.num { text-align: right; }
  .muted { color: #666; font-size: 12px; }
  .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
</style></head><body>
<h1>IRP5 / IT3(a) Certificate</h1>
<p class="muted">Tax year ${line.taxYearStart} / ${line.taxYearStart + 1} · ${line.fromDate} → ${line.toDate}</p>
<div class="header-grid">
  <div><h2>Employer</h2><div>${companyName}</div></div>
  <div><h2>Employee</h2>
    <div>${line.employee.firstName} ${line.employee.lastName}</div>
    <div class="muted">${line.employee.employeeNumber}${line.employee.idNumber ? ' · ID ' + line.employee.idNumber : ''}${line.employee.taxNumber ? ' · Tax ref ' + line.employee.taxNumber : ''}</div>
  </div>
</div>
<h2>Income</h2>
<table><thead><tr><th>Code</th><th>Description</th><th>Amount (R)</th></tr></thead>
<tbody>
  <tr><td>3601</td><td>Income (PAYE)</td><td class="num">${line.income3601.toFixed(2)}</td></tr>
</tbody></table>
<h2>Deductions / Contributions</h2>
<table><thead><tr><th>Code</th><th>Description</th><th>Amount (R)</th></tr></thead>
<tbody>
  <tr><td>4102</td><td>PAYE</td><td class="num">${line.paye4102.toFixed(2)}</td></tr>
  <tr><td>4141</td><td>UIF (Employee)</td><td class="num">${line.uifEmployee4141.toFixed(2)}</td></tr>
  <tr><td>4142</td><td>UIF (Employer)</td><td class="num">${line.uifEmployer4142.toFixed(2)}</td></tr>
  <tr><td>4149</td><td>SDL</td><td class="num">${line.sdl4149.toFixed(2)}</td></tr>
  <tr><td>4115</td><td>Other deductions</td><td class="num">${line.otherDeductions4115.toFixed(2)}</td></tr>
</tbody></table>
<p class="muted">${line.periods} payroll period(s) included. Net pay: R${line.netPay.toFixed(2)}.</p>
<p class="muted" style="margin-top: 24px;">This is an internal summary. The official IRP5 certificate is generated by SARS easyFile from the EMP501 reconciliation.</p>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  const yearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = thisTaxYear - 4; y <= thisTaxYear + 1; y += 1) arr.push(y);
    return arr;
  }, [thisTaxYear]);

  return (
    <section className="card">
      <SectionTitle
        title="IRP5 / EMP501 Centre"
        subtitle={`SA tax year ${taxYear} / ${taxYear + 1} · ${summary.fromDate} → ${summary.toDate}`}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))}>
              {yearOptions.map((y) => <option key={y} value={y}>{y} / {y + 1}</option>)}
            </select>
            <button className="ghost-button" onClick={tab === 'irp5' ? exportIrp5Csv : exportEmp501Csv}>Export CSV</button>
          </div>
        }
      />

      <div className="filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 12 }}>
        <button type="button" className={tab === 'irp5' ? 'secondary-button' : 'ghost-button'} onClick={() => setTab('irp5')}>Per-employee IRP5 ({lines.length})</button>
        <button type="button" className={tab === 'emp501' ? 'secondary-button' : 'ghost-button'} onClick={() => setTab('emp501')}>EMP501 reconciliation</button>
      </div>

      {tab === 'irp5' ? (
        lines.length === 0 ? (
          <EmptyState title="No payroll runs in this tax year" body="Approve some payroll runs in the Payroll page, or pick a different tax year." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Periods</th>
                  <th title="3601 Income">3601 Income</th>
                  <th title="4102 PAYE">4102 PAYE</th>
                  <th title="4141 UIF (Employee)">4141 UIF emp</th>
                  <th title="4142 UIF (Employer)">4142 UIF empr</th>
                  <th title="4149 SDL">4149 SDL</th>
                  <th>Net</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.employee.id}>
                    <td><strong>{l.employee.firstName} {l.employee.lastName}</strong><div className="table-subtext">{l.employee.employeeNumber}</div></td>
                    <td>{l.periods}</td>
                    <td>{money(l.income3601)}</td>
                    <td>{money(l.paye4102)}</td>
                    <td>{money(l.uifEmployee4141)}</td>
                    <td>{money(l.uifEmployer4142)}</td>
                    <td>{money(l.sdl4149)}</td>
                    <td>{money(l.netPay)}</td>
                    <td><button className="table-button" onClick={() => printIrp5(l)}>Print IRP5</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">Employees</div>
            <strong style={{ fontSize: '1.4rem' }}>{summary.totalEmployees}</strong>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">Total income (3601)</div>
            <strong style={{ fontSize: '1.4rem' }}>{money(summary.totalIncome)}</strong>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">PAYE (4102)</div>
            <strong style={{ fontSize: '1.4rem' }}>{money(summary.totalPaye)}</strong>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">UIF — Employee (4141)</div>
            <strong style={{ fontSize: '1.4rem' }}>{money(summary.totalUifEmployee)}</strong>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">UIF — Employer (4142)</div>
            <strong style={{ fontSize: '1.4rem' }}>{money(summary.totalUifEmployer)}</strong>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted">SDL (4149)</div>
            <strong style={{ fontSize: '1.4rem' }}>{money(summary.totalSdl)}</strong>
          </div>
          <div className="card" style={{ padding: 16, gridColumn: '1 / -1', background: 'var(--jp-orange-soft, #fff3e0)' }}>
            <div className="muted">Total EMP201 obligation for the year (PAYE + UIF + SDL)</div>
            <strong style={{ fontSize: '1.6rem', color: 'var(--jp-orange)' }}>{money(summary.totalEmp201)}</strong>
            <p className="muted" style={{ marginTop: 8 }}>This is what SARS expects you to have paid via your monthly EMP201s. Compare it to your actual SARS Centre payments to spot any shortfall before EMP501 submission.</p>
          </div>
        </div>
      )}

      <p className="muted" style={{ marginTop: 16, fontSize: '0.8rem' }}>
        Year-end workflow: (1) export CSV → (2) import into SARS easyFile → (3) easyFile generates IRP5/IT3(a) certificates + EMP501 → (4) submit to SARS → (5) distribute IRP5s to staff (also visible to them on My Stuff after Phase 47 if you'd like). Filed annually by 31 May.
      </p>
    </section>
  );
}
