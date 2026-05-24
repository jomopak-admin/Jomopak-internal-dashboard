/**
 * Finance Summary — P&L + VAT (Phase 25.1)
 *
 * One read-only screen that rolls the books into a period view:
 *   • Revenue from issued ZAR invoices.
 *   • Cost of sales + overheads from supplier bills, grouped by the expense
 *     account they were posted to (Chart of Accounts subType decides which
 *     bucket they fall in).
 *   • Gross profit, operating profit.
 *   • VAT summary (output / input / net) for the same window — the figures
 *     that should reconcile to the VAT201 in the SARS Centre.
 *
 * Reporting only — it derives everything from data already captured. It is not
 * a substitute for a reviewed set of management accounts.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppSettingsSarsConfig,
  Invoice,
  LedgerAccount,
  SupplierBill,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { computeVatForPeriod } from '../../utils/sars';

interface FinanceSummaryPageProps {
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  ledgerAccounts: LedgerAccount[];
  sarsConfig: AppSettingsSarsConfig;
  today: string;
}

function pad(n: number): string { return String(n).padStart(2, '0'); }
function iso(y: number, m: number, d: number): string { return `${y}-${pad(m)}-${pad(d)}`; }
function lastDay(y: number, m: number): number { return new Date(y, m, 0).getDate(); }

/** First day of the current financial year given a year-end month. */
function financialYearStart(today: string, fyEndMonth: number): string {
  const y = Number(today.slice(0, 4));
  const fyEndThisYear = iso(y, fyEndMonth, lastDay(y, fyEndMonth));
  // If today is after this year's FY end, the current FY started the month after it.
  if (today > fyEndThisYear) {
    const startMonth = fyEndMonth === 12 ? 1 : fyEndMonth + 1;
    const startYear = fyEndMonth === 12 ? y + 1 : y;
    return iso(startYear, startMonth, 1);
  }
  const startMonth = fyEndMonth === 12 ? 1 : fyEndMonth + 1;
  const startYear = fyEndMonth === 12 ? y : y - 1;
  return iso(startYear, startMonth, 1);
}

export function FinanceSummaryPage({ invoices, supplierBills, ledgerAccounts, sarsConfig, today }: FinanceSummaryPageProps) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const [from, setFrom] = useState<string>(iso(y, m, 1));
  const [to, setTo] = useState<string>(today);

  function setThisMonth() { setFrom(iso(y, m, 1)); setTo(iso(y, m, lastDay(y, m))); }
  function setLastMonth() {
    const lm = m === 1 ? 12 : m - 1;
    const ly = m === 1 ? y - 1 : y;
    setFrom(iso(ly, lm, 1));
    setTo(iso(ly, lm, lastDay(ly, lm)));
  }
  function setThisFy() {
    setFrom(financialYearStart(today, Math.min(12, Math.max(1, sarsConfig.financialYearEndMonth || 2))));
    setTo(today);
  }

  const accountById = useMemo(() => {
    const map = new Map<string, LedgerAccount>();
    ledgerAccounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [ledgerAccounts]);

  const report = useMemo(() => {
    const inRange = (d: string) => !!d && d >= from && d <= to;

    // Revenue from issued invoices, foreign converted to base (ZAR) at booking rate.
    let revenue = 0;
    invoices.forEach((inv) => {
      if (!inRange(inv.invoiceDate)) return;
      if (inv.status === 'Draft' || inv.status === 'Cancelled') return;
      const rate = inv.currency && inv.currency !== 'ZAR' ? (Number(inv.exchangeRate) || 1) : 1;
      revenue += (Number(inv.subtotalExclVat) || 0) * rate;
    });

    // Expenses from supplier bills, grouped by expense account.
    const byAccount = new Map<string, { name: string; subType: string; total: number }>();
    let costOfSales = 0;
    let overheads = 0;
    let unclassified = 0;
    supplierBills.forEach((bill) => {
      if (!inRange(bill.billDate)) return;
      if (bill.status === 'Cancelled') return;
      const rate = bill.currency && bill.currency !== 'ZAR' ? (Number(bill.exchangeRate) || 1) : 1;
      const net = (Number(bill.subtotalExclVat) || 0) * rate;
      const acct = bill.expenseAccountId ? accountById.get(bill.expenseAccountId) : undefined;
      const subType = acct?.subType || (bill.expenseAccountId ? 'Other' : 'Unclassified');
      const key = bill.expenseAccountId || 'unclassified';
      const name = bill.expenseAccountName || acct?.name || 'Unclassified';
      const row = byAccount.get(key) || { name, subType, total: 0 };
      row.total += net;
      byAccount.set(key, row);
      if (subType === 'Cost of Sales') costOfSales += net;
      else if (!bill.expenseAccountId) unclassified += net;
      else overheads += net;
    });

    const grossProfit = revenue - costOfSales;
    const netProfit = grossProfit - overheads - unclassified;
    const vat = computeVatForPeriod(invoices, supplierBills, from, to);
    const expenseRows = Array.from(byAccount.values()).sort((a, b) => b.total - a.total);

    return { revenue, costOfSales, overheads, unclassified, grossProfit, netProfit, vat, expenseRows };
  }, [invoices, supplierBills, accountById, from, to]);

  const margin = report.revenue > 0 ? (report.netProfit / report.revenue) * 100 : 0;

  function downloadCsv(filename: string, rows: (string | number)[][]) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportSummary() {
    const rows: (string | number)[][] = [
      ['JomoPak — P&L & VAT summary', `${from} to ${to}`],
      [],
      ['Revenue (excl VAT)', report.revenue.toFixed(2)],
      ['Cost of sales', report.costOfSales.toFixed(2)],
      ['Gross profit', report.grossProfit.toFixed(2)],
      ['Overheads', (report.overheads + report.unclassified).toFixed(2)],
      ['Net profit', report.netProfit.toFixed(2)],
      [],
      ['Output VAT', report.vat.outputVat.toFixed(2)],
      ['Input VAT', report.vat.inputVat.toFixed(2)],
      ['Net VAT payable', report.vat.netVatPayable.toFixed(2)],
      [],
      ['Expenses by account', 'Group', 'Total (excl VAT)'],
      ...report.expenseRows.map((r) => [r.name, r.subType, r.total.toFixed(2)]),
    ];
    downloadCsv(`pnl-vat-${from}_to_${to}.csv`, rows);
  }

  function exportInvoices() {
    const inRange = (d: string) => !!d && d >= from && d <= to;
    const rows: (string | number)[][] = [['Invoice', 'Date', 'Due', 'Client', 'Status', 'Excl VAT', 'VAT', 'Incl VAT', 'Paid', 'Outstanding']];
    invoices
      .filter((i) => inRange(i.invoiceDate) && i.status !== 'Draft' && i.status !== 'Cancelled')
      .sort((a, b) => (a.invoiceDate || '').localeCompare(b.invoiceDate || ''))
      .forEach((i) => rows.push([
        i.invoiceNumber, i.invoiceDate, i.dueDate || '', i.clientName, i.status,
        (Number(i.subtotalExclVat) || 0).toFixed(2), (Number(i.vatTotal) || 0).toFixed(2),
        (Number(i.totalInclVat) || 0).toFixed(2), (Number(i.amountPaid) || 0).toFixed(2), (Number(i.amountOutstanding) || 0).toFixed(2),
      ]));
    downloadCsv(`invoices-${from}_to_${to}.csv`, rows);
  }

  function exportBills() {
    const inRange = (d: string) => !!d && d >= from && d <= to;
    const rows: (string | number)[][] = [['Bill', 'Supplier invoice', 'Date', 'Due', 'Supplier', 'Account', 'Status', 'Excl VAT', 'VAT', 'Incl VAT', 'Outstanding']];
    supplierBills
      .filter((b) => inRange(b.billDate) && b.status !== 'Cancelled')
      .sort((a, b) => (a.billDate || '').localeCompare(b.billDate || ''))
      .forEach((b) => rows.push([
        b.billNumber, b.supplierInvoiceNumber || '', b.billDate || '', b.dueDate || '', b.supplierName,
        b.expenseAccountName || '', b.status,
        (Number(b.subtotalExclVat) || 0).toFixed(2), (Number(b.vatAmount) || 0).toFixed(2),
        (Number(b.totalInclVat) || 0).toFixed(2), (Number(b.amountOutstanding) || 0).toFixed(2),
      ]));
    downloadCsv(`supplier-bills-${from}_to_${to}.csv`, rows);
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="P&L &amp; VAT Summary"
        subtitle="Revenue, costs and VAT for a period — derived from your invoices and supplier bills. A management view, not audited accounts."
      />

      <section className="card accounting-toolbar">
        <label><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="finance-presets">
          <button className="ghost-button" onClick={setThisMonth}>This month</button>
          <button className="ghost-button" onClick={setLastMonth}>Last month</button>
          <button className="ghost-button" onClick={setThisFy}>This financial year</button>
        </div>
      </section>

      <section className="card accounting-toolbar">
        <span className="muted" style={{ alignSelf: 'center' }}>Export for accountant:</span>
        <div className="finance-presets">
          <button className="secondary-button" onClick={exportSummary}>P&amp;L + VAT CSV</button>
          <button className="ghost-button" onClick={exportInvoices}>Invoices CSV</button>
          <button className="ghost-button" onClick={exportBills}>Supplier bills CSV</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Revenue (excl VAT)</p><h3>R {formatNumber(report.revenue, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Cost of sales</p><h3>R {formatNumber(report.costOfSales, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Gross profit</p><h3 className={report.grossProfit < 0 ? 'amount-due' : ''}>R {formatNumber(report.grossProfit, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Overheads</p><h3>R {formatNumber(report.overheads + report.unclassified, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Net profit ({formatNumber(margin, 1)}%)</p><h3 className={report.netProfit < 0 ? 'amount-due' : ''}>R {formatNumber(report.netProfit, 2)}</h3></div>
      </section>

      <section className="card">
        <h3>VAT for this period</h3>
        <div className="sars-vat-rows">
          <div className="sars-vat-row"><span>Output VAT (on sales)</span><strong>R {formatNumber(report.vat.outputVat, 2)}</strong></div>
          <div className="sars-vat-row"><span>Input VAT (on purchases)</span><strong>R {formatNumber(report.vat.inputVat, 2)}</strong></div>
          <div className="sars-vat-row sars-vat-net">
            <span>{report.vat.netVatPayable >= 0 ? 'Net VAT payable to SARS' : 'Net VAT refund due'}</span>
            <strong className={report.vat.netVatPayable >= 0 ? 'amount-due' : ''}>R {formatNumber(Math.abs(report.vat.netVatPayable), 2)}</strong>
          </div>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
          These figures should reconcile to the matching VAT201 period in the SARS Centre. Differences usually mean an invoice or bill is dated outside this window.
        </p>
      </section>

      <section className="card">
        <h3>Expenses by account</h3>
        {report.expenseRows.length === 0 ? (
          <p className="muted">No supplier bills dated in this period.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Account</th><th>Group</th><th style={{ textAlign: 'right' }}>Total (excl VAT)</th></tr>
            </thead>
            <tbody>
              {report.expenseRows.map((row, i) => (
                <tr key={i}>
                  <td>{row.name}</td>
                  <td className="muted">{row.subType}</td>
                  <td style={{ textAlign: 'right' }}>R {formatNumber(row.total, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
