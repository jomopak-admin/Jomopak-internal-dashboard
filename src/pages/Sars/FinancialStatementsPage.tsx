/**
 * Financial Statements — Phase 28
 *
 * Trial Balance, Income Statement and Balance Sheet computed from POSTED
 * journal entries. Trial Balance and Balance Sheet are "as at" the period end;
 * the Income Statement covers the period. Export any of them to CSV.
 *
 * These are derived from the GL — they only reflect journals you've posted
 * (including any you generated from the sub-ledgers and posted).
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { JournalEntry, LedgerAccount, AppSettingsSarsConfig } from '../../types';
import { formatNumber } from '../../utils/calculations';
import { trialBalance, incomeStatement, balanceSheet } from '../../utils/gl';

interface FinancialStatementsPageProps {
  journalEntries: JournalEntry[];
  ledgerAccounts: LedgerAccount[];
  sarsConfig: AppSettingsSarsConfig;
  today: string;
}

function pad(n: number): string { return String(n).padStart(2, '0'); }
function iso(y: number, m: number, d: number): string { return `${y}-${pad(m)}-${pad(d)}`; }
function lastDay(y: number, m: number): number { return new Date(y, m, 0).getDate(); }

function financialYearStart(today: string, fyEndMonth: number): string {
  const y = Number(today.slice(0, 4));
  const fyEndThisYear = iso(y, fyEndMonth, lastDay(y, fyEndMonth));
  const startMonth = fyEndMonth === 12 ? 1 : fyEndMonth + 1;
  if (today > fyEndThisYear) return iso(fyEndMonth === 12 ? y + 1 : y, startMonth, 1);
  return iso(fyEndMonth === 12 ? y : y - 1, startMonth, 1);
}

export function FinancialStatementsPage({ journalEntries, ledgerAccounts, sarsConfig, today }: FinancialStatementsPageProps) {
  const fyEnd = Math.min(12, Math.max(1, sarsConfig.financialYearEndMonth || 2));
  const [from, setFrom] = useState<string>(financialYearStart(today, fyEnd));
  const [to, setTo] = useState<string>(today);
  const [tab, setTab] = useState<'pl' | 'bs' | 'tb'>('pl');

  const tb = useMemo(() => trialBalance(journalEntries, ledgerAccounts, to), [journalEntries, ledgerAccounts, to]);
  const is = useMemo(() => incomeStatement(journalEntries, ledgerAccounts, from, to), [journalEntries, ledgerAccounts, from, to]);
  const bs = useMemo(() => balanceSheet(journalEntries, ledgerAccounts, to), [journalEntries, ledgerAccounts, to]);

  const postedCount = useMemo(() => journalEntries.filter((e) => e.status === 'Posted').length, [journalEntries]);

  function downloadCsv(filename: string, rows: (string | number)[][]) {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportTb() {
    downloadCsv(`trial-balance-${to}.csv`, [
      ['Trial Balance as at', to], [], ['Code', 'Account', 'Type', 'Debit', 'Credit'],
      ...tb.rows.map((r) => [r.code, r.name, r.type, r.debit.toFixed(2), r.credit.toFixed(2)]),
      ['', '', 'TOTAL', tb.totalDebit.toFixed(2), tb.totalCredit.toFixed(2)],
    ]);
  }
  function exportPl() {
    downloadCsv(`income-statement-${from}_to_${to}.csv`, [
      ['Income Statement', `${from} to ${to}`], [], ['INCOME', ''],
      ...is.income.map((r) => [`${r.code} ${r.name}`, r.amount.toFixed(2)]),
      ['Total income', is.totalIncome.toFixed(2)], [], ['EXPENSES', ''],
      ...is.expense.map((r) => [`${r.code} ${r.name}`, r.amount.toFixed(2)]),
      ['Total expenses', is.totalExpense.toFixed(2)], [], ['Net profit', is.netProfit.toFixed(2)],
    ]);
  }
  function exportBs() {
    downloadCsv(`balance-sheet-${to}.csv`, [
      ['Balance Sheet as at', to], [], ['ASSETS', ''],
      ...bs.assets.map((r) => [`${r.code} ${r.name}`, r.amount.toFixed(2)]),
      ['Total assets', bs.totalAssets.toFixed(2)], [], ['LIABILITIES', ''],
      ...bs.liabilities.map((r) => [`${r.code} ${r.name}`, r.amount.toFixed(2)]),
      ['Total liabilities', bs.totalLiabilities.toFixed(2)], [], ['EQUITY', ''],
      ...bs.equity.map((r) => [`${r.code} ${r.name}`, r.amount.toFixed(2)]),
      ['Retained earnings', bs.retainedEarnings.toFixed(2)],
      ['Total equity', bs.totalEquity.toFixed(2)],
    ]);
  }

  const sectionRows = (rows: { code: string; name: string; amount: number }[]) =>
    rows.length === 0 ? <tr><td colSpan={2} className="muted">None</td></tr> :
    rows.map((r) => <tr key={r.code}><td>{r.code} · {r.name}</td><td style={{ textAlign: 'right' }}>{formatNumber(r.amount, 2)}</td></tr>);

  return (
    <div className="page-stack">
      <SectionTitle
        title="Financial Statements"
        subtitle="P&L, balance sheet and trial balance from your posted journals."
      />

      {postedCount === 0 && (
        <section className="card"><p className="muted">No posted journal entries yet — these statements stay empty until you post journals (or generate them from the sub-ledgers in the General Ledger and post them).</p></section>
      )}

      <section className="card accounting-toolbar">
        <label><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label><span>To (as at)</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="finance-presets">
          <button className={tab === 'pl' ? 'secondary-button' : 'ghost-button'} onClick={() => setTab('pl')}>Income Statement</button>
          <button className={tab === 'bs' ? 'secondary-button' : 'ghost-button'} onClick={() => setTab('bs')}>Balance Sheet</button>
          <button className={tab === 'tb' ? 'secondary-button' : 'ghost-button'} onClick={() => setTab('tb')}>Trial Balance</button>
        </div>
      </section>

      {tab === 'pl' && (
        <section className="card">
          <div className="sars-card-head"><h3>Income Statement</h3><button className="ghost-button" onClick={exportPl}>Export CSV</button></div>
          <table className="data-table">
            <tbody>
              <tr className="payroll-totals"><td>Income</td><td style={{ textAlign: 'right' }}></td></tr>
              {sectionRows(is.income)}
              <tr><td><strong>Total income</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(is.totalIncome, 2)}</strong></td></tr>
              <tr className="payroll-totals"><td>Expenses</td><td></td></tr>
              {sectionRows(is.expense)}
              <tr><td><strong>Total expenses</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(is.totalExpense, 2)}</strong></td></tr>
              <tr className="payroll-totals"><td><strong>Net {is.netProfit >= 0 ? 'profit' : 'loss'}</strong></td><td style={{ textAlign: 'right' }}><strong className={is.netProfit < 0 ? 'amount-due' : ''}>R {formatNumber(Math.abs(is.netProfit), 2)}</strong></td></tr>
            </tbody>
          </table>
        </section>
      )}

      {tab === 'bs' && (
        <section className="card">
          <div className="sars-card-head"><h3>Balance Sheet as at {to}</h3><button className="ghost-button" onClick={exportBs}>Export CSV</button></div>
          <table className="data-table">
            <tbody>
              <tr className="payroll-totals"><td>Assets</td><td></td></tr>
              {sectionRows(bs.assets)}
              <tr><td><strong>Total assets</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(bs.totalAssets, 2)}</strong></td></tr>
              <tr className="payroll-totals"><td>Liabilities</td><td></td></tr>
              {sectionRows(bs.liabilities)}
              <tr><td><strong>Total liabilities</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(bs.totalLiabilities, 2)}</strong></td></tr>
              <tr className="payroll-totals"><td>Equity</td><td></td></tr>
              {sectionRows(bs.equity)}
              <tr><td>Retained earnings (to date)</td><td style={{ textAlign: 'right' }}>{formatNumber(bs.retainedEarnings, 2)}</td></tr>
              <tr><td><strong>Total equity</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(bs.totalEquity, 2)}</strong></td></tr>
              <tr className="payroll-totals"><td><strong>Liabilities + equity</strong></td><td style={{ textAlign: 'right' }}><strong>{formatNumber(bs.totalLiabilities + bs.totalEquity, 2)}</strong></td></tr>
            </tbody>
          </table>
          <p className={bs.balanced ? 'gl-balanced' : 'amount-due'} style={{ marginTop: '0.6rem' }}>
            {bs.balanced ? 'Balance sheet balances' : `Out of balance by ${formatNumber(Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity)), 2)} — check your journals`}
          </p>
        </section>
      )}

      {tab === 'tb' && (
        <section className="card">
          <div className="sars-card-head"><h3>Trial Balance as at {to}</h3><button className="ghost-button" onClick={exportTb}>Export CSV</button></div>
          <table className="data-table">
            <thead><tr><th>Code</th><th>Account</th><th style={{ textAlign: 'right' }}>Debit</th><th style={{ textAlign: 'right' }}>Credit</th></tr></thead>
            <tbody>
              {tb.rows.length === 0 ? <tr><td colSpan={4} className="muted">No posted activity.</td></tr> :
                tb.rows.map((r) => (
                  <tr key={r.accountId}><td>{r.code}</td><td>{r.name}</td><td style={{ textAlign: 'right' }}>{r.debit ? formatNumber(r.debit, 2) : ''}</td><td style={{ textAlign: 'right' }}>{r.credit ? formatNumber(r.credit, 2) : ''}</td></tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="payroll-totals"><td colSpan={2}>Total</td><td style={{ textAlign: 'right' }}>{formatNumber(tb.totalDebit, 2)}</td><td style={{ textAlign: 'right' }}>{formatNumber(tb.totalCredit, 2)}</td></tr>
            </tfoot>
          </table>
          <p className={Math.abs(tb.totalDebit - tb.totalCredit) < 0.05 ? 'gl-balanced' : 'amount-due'} style={{ marginTop: '0.6rem' }}>
            {Math.abs(tb.totalDebit - tb.totalCredit) < 0.05 ? 'Debits equal credits' : 'Trial balance does not balance — check your journals'}
          </p>
        </section>
      )}
    </div>
  );
}
