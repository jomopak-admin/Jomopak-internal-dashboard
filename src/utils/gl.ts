/**
 * General Ledger engine — Phase 28.
 *
 * Pure functions over journal entries + the chart of accounts:
 *   • entryTotals       — debit/credit totals + balanced check for one entry.
 *   • trialBalance      — per-account debit/credit balances as at a date.
 *   • incomeStatement   — Income vs Expense movement over a period.
 *   • balanceSheet      — Assets / Liabilities / Equity as at a date, with
 *                         retained earnings folded in.
 *   • generateJournalsFromPeriod — batch draft journals from invoices, supplier
 *                         bills and their payments, so the GL can be populated
 *                         from the sub-ledgers instead of typed by hand.
 *
 * Statements are computed from POSTED entries only. Drafts don't affect the books.
 */

import { Invoice, JournalEntry, JournalLine, LedgerAccount, LedgerAccountType, SupplierBill } from '../types';

function round2(n: number): number { return Math.round((Number(n) || 0) * 100) / 100; }

export interface JournalTotals { debit: number; credit: number; balanced: boolean; }

export function entryTotals(e: { lines: JournalLine[] }): JournalTotals {
  const debit = e.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const credit = e.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  return { debit: round2(debit), credit: round2(credit), balanced: Math.abs(debit - credit) < 0.005 && debit > 0 };
}

interface Bal { debit: number; credit: number; }

function movements(entries: JournalEntry[], inRange: (d: string) => boolean): Map<string, Bal> {
  const m = new Map<string, Bal>();
  for (const e of entries) {
    if (e.status !== 'Posted') continue;
    if (!inRange(e.date)) continue;
    for (const l of e.lines) {
      if (!l.accountId) continue;
      const cur = m.get(l.accountId) || { debit: 0, credit: 0 };
      cur.debit += Number(l.debit) || 0;
      cur.credit += Number(l.credit) || 0;
      m.set(l.accountId, cur);
    }
  }
  return m;
}

export interface TrialBalanceRow { accountId: string; code: string; name: string; type: LedgerAccountType; debit: number; credit: number; }

export function trialBalance(entries: JournalEntry[], accounts: LedgerAccount[], asAt: string): { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number } {
  const m = movements(entries, (d) => !asAt || d <= asAt);
  const rows = accounts
    .map((a) => {
      const b = m.get(a.id) || { debit: 0, credit: 0 };
      const net = b.debit - b.credit;
      return { accountId: a.id, code: a.code, name: a.name, type: a.type, debit: net >= 0 ? round2(net) : 0, credit: net < 0 ? round2(-net) : 0 };
    })
    .filter((r) => r.debit !== 0 || r.credit !== 0)
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  return { rows, totalDebit: round2(rows.reduce((s, r) => s + r.debit, 0)), totalCredit: round2(rows.reduce((s, r) => s + r.credit, 0)) };
}

export interface StatementLine { code: string; name: string; amount: number; }

export interface IncomeStatement { income: StatementLine[]; expense: StatementLine[]; totalIncome: number; totalExpense: number; netProfit: number; }

export function incomeStatement(entries: JournalEntry[], accounts: LedgerAccount[], from: string, to: string): IncomeStatement {
  const m = movements(entries, (d) => (!from || d >= from) && (!to || d <= to));
  const byType = (t: LedgerAccountType) =>
    accounts
      .filter((a) => a.type === t)
      .map((a) => {
        const b = m.get(a.id) || { debit: 0, credit: 0 };
        const amount = t === 'Income' ? b.credit - b.debit : b.debit - b.credit;
        return { code: a.code, name: a.name, amount: round2(amount) };
      })
      .filter((r) => r.amount !== 0)
      .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const income = byType('Income');
  const expense = byType('Expense');
  const totalIncome = round2(income.reduce((s, r) => s + r.amount, 0));
  const totalExpense = round2(expense.reduce((s, r) => s + r.amount, 0));
  return { income, expense, totalIncome, totalExpense, netProfit: round2(totalIncome - totalExpense) };
}

export interface BalanceSheet {
  assets: StatementLine[]; liabilities: StatementLine[]; equity: StatementLine[];
  retainedEarnings: number;
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  balanced: boolean;
}

export function balanceSheet(entries: JournalEntry[], accounts: LedgerAccount[], asAt: string): BalanceSheet {
  const m = movements(entries, (d) => !asAt || d <= asAt);
  const section = (t: LedgerAccountType) =>
    accounts
      .filter((a) => a.type === t)
      .map((a) => {
        const b = m.get(a.id) || { debit: 0, credit: 0 };
        const amount = t === 'Asset' ? b.debit - b.credit : b.credit - b.debit;
        return { code: a.code, name: a.name, amount: round2(amount) };
      })
      .filter((r) => r.amount !== 0)
      .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const assets = section('Asset');
  const liabilities = section('Liability');
  const equity = section('Equity');
  // Cumulative profit to date folds into equity as retained earnings.
  const retainedEarnings = incomeStatement(entries, accounts, '', asAt).netProfit;
  const totalAssets = round2(assets.reduce((s, r) => s + r.amount, 0));
  const totalLiabilities = round2(liabilities.reduce((s, r) => s + r.amount, 0));
  const totalEquity = round2(equity.reduce((s, r) => s + r.amount, 0) + retainedEarnings);
  return {
    assets, liabilities, equity, retainedEarnings,
    totalAssets, totalLiabilities, totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.05,
  };
}

/**
 * Batch-generate DRAFT journal entries from the sub-ledgers for a period.
 * Uses the standard chart-of-accounts codes (AR 1100, Sales 4000, VAT output
 * 2100, AP 2000, VAT input 1400, Bank 1000). Lines that would be zero are
 * dropped. The user reviews the drafts, then posts them.
 */
export function generateJournalsFromPeriod(
  invoices: Invoice[],
  supplierBills: SupplierBill[],
  accounts: LedgerAccount[],
  from: string,
  to: string,
): JournalEntry[] {
  const byCode = (code: string) => accounts.find((a) => a.code === code);
  const ar = byCode('1100'); const sales = byCode('4000'); const vatOut = byCode('2100');
  const ap = byCode('2000'); const vatIn = byCode('1400'); const bank = byCode('1000');
  const sundry = byCode('6900');
  const inRange = (d: string) => !!d && (!from || d >= from) && (!to || d <= to);
  const out: JournalEntry[] = [];
  let seq = 0;
  const stamp = Date.now();
  const mkId = () => `je-auto-${stamp}-${seq++}`;
  const line = (acct: LedgerAccount | undefined, debit: number, credit: number, description: string): JournalLine | null => {
    if (!acct) return null;
    if (round2(debit) === 0 && round2(credit) === 0) return null;
    return { id: `jl-${stamp}-${seq}-${acct.id}`, accountId: acct.id, accountCode: acct.code, accountName: acct.name, description, debit: round2(debit), credit: round2(credit) };
  };

  // Invoices: Dr AR (total) / Cr Sales (excl) / Cr VAT output.
  for (const inv of invoices) {
    if (!inRange(inv.invoiceDate)) continue;
    if (inv.status === 'Draft' || inv.status === 'Cancelled') continue;
    if (inv.currency && inv.currency !== 'ZAR') continue;
    const lines = [
      line(ar, Number(inv.totalInclVat) || 0, 0, `Invoice ${inv.invoiceNumber}`),
      line(sales, 0, Number(inv.subtotalExclVat) || 0, `Sales — ${inv.clientName}`),
      line(vatOut, 0, Number(inv.vatTotal) || 0, 'VAT output'),
    ].filter(Boolean) as JournalLine[];
    if (lines.length >= 2) out.push({ id: mkId(), entryNumber: '', date: inv.invoiceDate, reference: inv.invoiceNumber, description: `Sales invoice ${inv.invoiceNumber} — ${inv.clientName}`, status: 'Draft', source: 'auto:invoice', lines, createdAt: new Date().toISOString(), notes: '' });
    // Invoice payments: Dr Bank / Cr AR.
    for (const p of inv.payments || []) {
      if (!inRange(p.paymentDate)) continue;
      const amt = Number(p.amount) || 0;
      if (amt <= 0) continue;
      const plines = [line(bank, amt, 0, `Receipt ${inv.invoiceNumber}`), line(ar, 0, amt, `Receipt ${inv.invoiceNumber}`)].filter(Boolean) as JournalLine[];
      if (plines.length === 2) out.push({ id: mkId(), entryNumber: '', date: p.paymentDate, reference: inv.invoiceNumber, description: `Receipt from ${inv.clientName} (${inv.invoiceNumber})`, status: 'Draft', source: 'auto:receipt', lines: plines, createdAt: new Date().toISOString(), notes: '' });
    }
  }

  // Supplier bills: Dr Expense (+ Dr VAT input) / Cr AP.
  for (const b of supplierBills) {
    if (!inRange(b.billDate)) continue;
    if (b.status === 'Cancelled') continue;
    const expenseAcct = accounts.find((a) => a.id === b.expenseAccountId) || sundry;
    const lines = [
      line(expenseAcct, Number(b.subtotalExclVat) || 0, 0, `Bill ${b.billNumber}`),
      line(vatIn, Number(b.vatAmount) || 0, 0, 'VAT input'),
      line(ap, 0, Number(b.totalInclVat) || 0, `Bill ${b.billNumber} — ${b.supplierName}`),
    ].filter(Boolean) as JournalLine[];
    if (lines.length >= 2) out.push({ id: mkId(), entryNumber: '', date: b.billDate, reference: b.billNumber, description: `Supplier bill ${b.billNumber} — ${b.supplierName}`, status: 'Draft', source: 'auto:bill', lines, createdAt: new Date().toISOString(), notes: '' });
    // Bill payments: Dr AP / Cr Bank.
    for (const p of b.payments || []) {
      if (!inRange(p.paymentDate)) continue;
      const amt = Number(p.amount) || 0;
      if (amt <= 0) continue;
      const plines = [line(ap, amt, 0, `Payment ${b.billNumber}`), line(bank, 0, amt, `Payment ${b.billNumber}`)].filter(Boolean) as JournalLine[];
      if (plines.length === 2) out.push({ id: mkId(), entryNumber: '', date: p.paymentDate, reference: b.billNumber, description: `Payment to ${b.supplierName} (${b.billNumber})`, status: 'Draft', source: 'auto:payment', lines: plines, createdAt: new Date().toISOString(), notes: '' });
    }
  }

  return out;
}
