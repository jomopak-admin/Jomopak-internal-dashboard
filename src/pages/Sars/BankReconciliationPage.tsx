/**
 * Bank Reconciliation — Phase 27
 *
 * Import a bank statement CSV, then match each line to what it relates to:
 * a customer invoice (money in), a supplier bill or payroll run (money out),
 * or straight to a ledger account (bank charges, etc.), and tick it reconciled.
 *
 * This records the match — it does not auto-post payments. The goal is a clean
 * "everything on the statement is accounted for" view for you / your accountant.
 */

import { useMemo, useRef, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  BankTransaction,
  BankTxnMatchType,
  Invoice,
  LedgerAccount,
  PayrollRun,
  SupplierBill,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface BankReconciliationPageProps {
  bankTransactions: BankTransaction[];
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  payrollRuns: PayrollRun[];
  ledgerAccounts: LedgerAccount[];
  onImport: (transactions: BankTransaction[]) => void;
  onUpdate: (transaction: BankTransaction) => void;
  onDelete: (id: string) => void;
}

/** Minimal CSV parser — handles quoted fields and commas inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else { cell += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else { cell += ch; }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); if (row.some((c) => c.trim() !== '')) rows.push(row); }
  return rows;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[R\s,]/g, '').replace(/[()]/g, (m) => (m === '(' ? '-' : ''));
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function guessIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h.includes(cand));
    if (idx >= 0) return idx;
  }
  return -1;
}

const MATCH_LABELS: Record<BankTxnMatchType, string> = {
  none: 'Unmatched',
  invoice: 'Customer invoice',
  bill: 'Supplier bill',
  payroll: 'Payroll run',
  account: 'Ledger account',
};

export function BankReconciliationPage({
  bankTransactions, invoices, supplierBills, payrollRuns, ledgerAccounts,
  onImport, onUpdate, onDelete,
}: BankReconciliationPageProps) {
  const [mode, setMode] = useState<'list' | 'import'>('list');
  const [filter, setFilter] = useState<'all' | 'unreconciled'>('unreconciled');
  const fileRef = useRef<HTMLInputElement>(null);

  // Import state
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [dateCol, setDateCol] = useState(0);
  const [descCol, setDescCol] = useState(1);
  const [amountMode, setAmountMode] = useState<'single' | 'debitcredit'>('single');
  const [amountCol, setAmountCol] = useState(2);
  const [debitCol, setDebitCol] = useState(2);
  const [creditCol, setCreditCol] = useState(3);
  const [bankName, setBankName] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const headers = useMemo(() => (rawRows.length > 0 ? rawRows[0] : []), [rawRows]);
  const bodyRows = useMemo(() => (hasHeader ? rawRows.slice(1) : rawRows), [rawRows, hasHeader]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const rows = parseCsv(text);
      if (rows.length === 0) { setImportMsg('Could not read any rows from that file.'); return; }
      setRawRows(rows);
      const hdr = rows[0];
      setDateCol(Math.max(0, guessIndex(hdr, ['date'])));
      setDescCol(Math.max(0, guessIndex(hdr, ['description', 'details', 'narration', 'reference'])));
      const amtIdx = guessIndex(hdr, ['amount']);
      const debIdx = guessIndex(hdr, ['debit']);
      const credIdx = guessIndex(hdr, ['credit']);
      if (amtIdx >= 0) { setAmountMode('single'); setAmountCol(amtIdx); }
      else if (debIdx >= 0 || credIdx >= 0) { setAmountMode('debitcredit'); setDebitCol(Math.max(0, debIdx)); setCreditCol(Math.max(0, credIdx)); }
      setImportMsg('');
    };
    reader.readAsText(file);
  }

  function buildPreview(): { date: string; description: string; amount: number }[] {
    return bodyRows.slice(0, 6).map((r) => {
      const amount = amountMode === 'single'
        ? parseAmount(r[amountCol] || '')
        : parseAmount(r[creditCol] || '') - parseAmount(r[debitCol] || '');
      return { date: (r[dateCol] || '').trim(), description: (r[descCol] || '').trim(), amount };
    });
  }

  function doImport() {
    const batch = `imp-${Date.now()}`;
    const now = new Date().toISOString();
    const txns: BankTransaction[] = bodyRows.map((r, i) => {
      const amount = amountMode === 'single'
        ? parseAmount(r[amountCol] || '')
        : parseAmount(r[creditCol] || '') - parseAmount(r[debitCol] || '');
      return {
        id: `bank-${batch}-${i}`,
        importBatch: batch,
        bankAccountName: bankName,
        date: (r[dateCol] || '').trim(),
        description: (r[descCol] || '').trim(),
        reference: '',
        amount,
        matchType: 'none' as BankTxnMatchType,
        matchId: '',
        matchLabel: '',
        ledgerAccountId: '',
        reconciled: false,
        notes: '',
        createdAt: now,
      };
    }).filter((t) => t.date || t.amount !== 0);
    if (txns.length === 0) { setImportMsg('No usable rows found — check the column mapping.'); return; }
    onImport(txns);
    setRawRows([]);
    setMode('list');
  }

  // ── Match option builders ─────────────────────────────────────────────────
  const expenseAccounts = useMemo(() => ledgerAccounts.filter((a) => a.active).sort((a, b) => (a.code || '').localeCompare(b.code || '')), [ledgerAccounts]);

  function optionsForType(type: BankTxnMatchType, amount: number): { id: string; label: string }[] {
    const abs = Math.abs(amount);
    const near = (v: number) => Math.abs(v - abs) < 0.01;
    if (type === 'invoice') {
      return [...invoices]
        .sort((a, b) => (near(b.amountOutstanding) || near(b.totalInclVat) ? 1 : 0) - (near(a.amountOutstanding) || near(a.totalInclVat) ? 1 : 0))
        .slice(0, 60)
        .map((i) => ({ id: i.id, label: `${i.invoiceNumber} · ${i.clientName} · R${formatNumber(i.amountOutstanding || i.totalInclVat, 2)}` }));
    }
    if (type === 'bill') {
      return [...supplierBills]
        .sort((a, b) => (near(b.amountOutstanding) || near(b.totalInclVat) ? 1 : 0) - (near(a.amountOutstanding) || near(a.totalInclVat) ? 1 : 0))
        .slice(0, 60)
        .map((b) => ({ id: b.id, label: `${b.billNumber} · ${b.supplierName} · R${formatNumber(b.amountOutstanding || b.totalInclVat, 2)}` }));
    }
    if (type === 'payroll') {
      return payrollRuns.map((r) => ({ id: r.id, label: `${r.periodLabel} · net R${formatNumber(r.totalNet, 2)}` }));
    }
    if (type === 'account') {
      return expenseAccounts.map((a) => ({ id: a.id, label: `${a.code} · ${a.name}` }));
    }
    return [];
  }

  function setMatch(txn: BankTransaction, type: BankTxnMatchType) {
    onUpdate({ ...txn, matchType: type, matchId: '', matchLabel: '', ledgerAccountId: '' });
  }
  function setMatchRecord(txn: BankTransaction, id: string, label: string) {
    onUpdate({ ...txn, matchId: id, matchLabel: label, ledgerAccountId: txn.matchType === 'account' ? id : '' });
  }

  const sorted = useMemo(
    () => [...bankTransactions].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [bankTransactions],
  );
  const visible = filter === 'all' ? sorted : sorted.filter((t) => !t.reconciled);

  const summary = useMemo(() => {
    let inAmt = 0, outAmt = 0, reconciled = 0, unreconciled = 0;
    for (const t of bankTransactions) {
      if (t.amount >= 0) inAmt += t.amount; else outAmt += t.amount;
      if (t.reconciled) reconciled += 1; else unreconciled += 1;
    }
    return { inAmt, outAmt: Math.abs(outAmt), reconciled, unreconciled };
  }, [bankTransactions]);

  // ─────────────────────────────────────────────────────────────────── Import
  if (mode === 'import') {
    const preview = rawRows.length > 0 ? buildPreview() : [];
    const colOptions = headers.length > 0 ? headers : (rawRows[0] || []).map((_, i) => `Column ${i + 1}`);
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title="Import bank statement"
          subtitle="Upload a CSV exported from your bank, map the columns, and import."
          backAction={<button className="ghost-button" onClick={() => setMode('list')}>← Back</button>}
        />
        <section className="card">
          <div className="accounting-toolbar">
            <label><span>Bank / account name</span><input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. FNB Cheque" /></label>
            <button className="secondary-button" onClick={() => fileRef.current?.click()}>Choose CSV file</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          {importMsg ? <p className="muted" style={{ color: 'var(--jp-alert)' }}>{importMsg}</p> : null}
        </section>

        {rawRows.length > 0 && (
          <>
            <section className="card">
              <h3>Map columns</h3>
              <div className="accounting-grid">
                <label className="accounting-check"><input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} /><span>First row is a header</span></label>
                <label><span>Date column</span>
                  <select value={dateCol} onChange={(e) => setDateCol(Number(e.target.value))}>{colOptions.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                </label>
                <label><span>Description column</span>
                  <select value={descCol} onChange={(e) => setDescCol(Number(e.target.value))}>{colOptions.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                </label>
                <label><span>Amount format</span>
                  <select value={amountMode} onChange={(e) => setAmountMode(e.target.value as 'single' | 'debitcredit')}>
                    <option value="single">Single amount column (− = out)</option>
                    <option value="debitcredit">Separate debit / credit columns</option>
                  </select>
                </label>
                {amountMode === 'single' ? (
                  <label><span>Amount column</span>
                    <select value={amountCol} onChange={(e) => setAmountCol(Number(e.target.value))}>{colOptions.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                  </label>
                ) : (
                  <>
                    <label><span>Debit (out) column</span>
                      <select value={debitCol} onChange={(e) => setDebitCol(Number(e.target.value))}>{colOptions.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                    </label>
                    <label><span>Credit (in) column</span>
                      <select value={creditCol} onChange={(e) => setCreditCol(Number(e.target.value))}>{colOptions.map((h, i) => <option key={i} value={i}>{h}</option>)}</select>
                    </label>
                  </>
                )}
              </div>
            </section>

            <section className="card">
              <h3>Preview</h3>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr key={i}>
                      <td>{p.date}</td>
                      <td>{p.description}</td>
                      <td style={{ textAlign: 'right' }} className={p.amount < 0 ? 'amount-due' : ''}>{formatNumber(p.amount, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="accounting-actions">
                <button className="primary-button" onClick={doImport}>Import {bodyRows.length} transactions</button>
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────── List
  return (
    <div className="page-stack">
      <SectionTitle
        title="Bank Reconciliation"
        subtitle="Match every bank line to an invoice, bill, payroll run or account, and tick it off."
        action={<button className="secondary-button" onClick={() => setMode('import')}>Import statement</button>}
      />

      <section className="stats-grid">
        <div className="card stat-card"><p className="stat-label">Money in</p><h3>R {formatNumber(summary.inAmt, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Money out</p><h3>R {formatNumber(summary.outAmt, 2)}</h3></div>
        <div className="card stat-card"><p className="stat-label">Reconciled</p><h3>{summary.reconciled}</h3></div>
        <div className="card stat-card"><p className="stat-label">Still to do</p><h3 className={summary.unreconciled > 0 ? 'amount-due' : ''}>{summary.unreconciled}</h3></div>
      </section>

      <section className="card accounting-toolbar">
        <label><span>Show</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value as 'all' | 'unreconciled')}>
            <option value="unreconciled">Unreconciled only</option>
            <option value="all">All transactions</option>
          </select>
        </label>
      </section>

      {visible.length === 0 ? (
        <EmptyState title={bankTransactions.length === 0 ? 'No transactions' : 'All reconciled'} body={bankTransactions.length === 0 ? 'Import a bank statement CSV to begin.' : 'Nothing left to match. Nice.'} />
      ) : (
        <section className="card">
          <div className="payroll-table-wrap">
            <table className="data-table bankrec-table">
              <thead>
                <tr><th>Date</th><th>Description</th><th style={{ textAlign: 'right' }}>Amount</th><th>Match to</th><th>Record</th><th style={{ textAlign: 'center' }}>Done</th><th></th></tr>
              </thead>
              <tbody>
                {visible.map((t) => {
                  const opts = optionsForType(t.matchType, t.amount);
                  return (
                    <tr key={t.id} className={t.reconciled ? 'row-muted' : ''}>
                      <td style={{ whiteSpace: 'nowrap' }}>{t.date}</td>
                      <td>{t.description}<div className="muted" style={{ fontSize: '0.72rem' }}>{t.bankAccountName}</div></td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className={t.amount < 0 ? 'amount-due' : ''}>{t.amount >= 0 ? '+' : ''}{formatNumber(t.amount, 2)}</td>
                      <td>
                        <select value={t.matchType} onChange={(e) => setMatch(t, e.target.value as BankTxnMatchType)}>
                          {(Object.keys(MATCH_LABELS) as BankTxnMatchType[]).map((k) => <option key={k} value={k}>{MATCH_LABELS[k]}</option>)}
                        </select>
                      </td>
                      <td>
                        {t.matchType === 'none' ? <span className="muted">—</span> : (
                          <select value={t.matchId} onChange={(e) => { const o = opts.find((x) => x.id === e.target.value); setMatchRecord(t, e.target.value, o?.label || ''); }}>
                            <option value="">Select…</option>
                            {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={t.reconciled} onChange={(e) => onUpdate({ ...t, reconciled: e.target.checked })} />
                      </td>
                      <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(t.id)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
