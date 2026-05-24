/**
 * General Ledger — Phase 28
 *
 * The journal. Each entry must balance (debits == credits) before it can be
 * saved. Post manual journals (accruals, depreciation, opening balances) or
 * batch-generate drafts from the sub-ledgers for a period, review, then post.
 * Only POSTED entries hit the Financial Statements.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  Invoice,
  JournalEntry,
  JournalEntryStatus,
  JOURNAL_ENTRY_STATUSES,
  JournalLine,
  LedgerAccount,
  SupplierBill,
} from '../../types';
import { formatNumber } from '../../utils/calculations';
import { entryTotals, generateJournalsFromPeriod } from '../../utils/gl';

interface GeneralLedgerPageProps {
  journalEntries: JournalEntry[];
  ledgerAccounts: LedgerAccount[];
  invoices: Invoice[];
  supplierBills: SupplierBill[];
  today: string;
  onSave: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onGenerate: (entries: JournalEntry[]) => void;
}

function blankLine(): JournalLine {
  return { id: `jl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, accountId: '', accountCode: '', accountName: '', description: '', debit: 0, credit: 0 };
}

function emptyEntry(today: string): JournalEntry {
  return {
    id: '', entryNumber: '', date: today, reference: '', description: '', status: 'Draft',
    source: 'manual', lines: [blankLine(), blankLine()], createdAt: '', notes: '',
  };
}

const STATUS_CLASS: Record<JournalEntryStatus, string> = {
  Draft: 'status-pending',
  Posted: 'status-reviewed',
};

export function GeneralLedgerPage({ journalEntries, ledgerAccounts, invoices, supplierBills, today, onSave, onDelete, onGenerate }: GeneralLedgerPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<JournalEntry>(emptyEntry(today));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [genFrom, setGenFrom] = useState(`${today.slice(0, 7)}-01`);
  const [genTo, setGenTo] = useState(today);
  const [message, setMessage] = useState('');

  const activeAccounts = useMemo(
    () => ledgerAccounts.filter((a) => a.active).sort((a, b) => (a.code || '').localeCompare(b.code || '')),
    [ledgerAccounts],
  );
  const accountById = useMemo(() => new Map(ledgerAccounts.map((a) => [a.id, a])), [ledgerAccounts]);

  const sorted = useMemo(
    () => [...journalEntries].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [journalEntries],
  );

  const totals = entryTotals(draft);

  function startNew() { setDraft(emptyEntry(today)); setEditingId(null); setMode('form'); }
  function startEdit(e: JournalEntry) { setDraft({ ...e, lines: e.lines.length ? e.lines : [blankLine(), blankLine()] }); setEditingId(e.id); setMode('form'); }
  function update(patch: Partial<JournalEntry>) { setDraft((d) => ({ ...d, ...patch })); }

  function updateLine(id: string, patch: Partial<JournalLine>) {
    setDraft((d) => ({
      ...d,
      lines: d.lines.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        if (patch.accountId !== undefined) {
          const acct = accountById.get(patch.accountId);
          next.accountCode = acct?.code || '';
          next.accountName = acct?.name || '';
        }
        return next;
      }),
    }));
  }
  function addLine() { setDraft((d) => ({ ...d, lines: [...d.lines, blankLine()] })); }
  function removeLine(id: string) { setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) })); }

  function save() {
    if (!totals.balanced) return;
    onSave({ ...draft, lines: draft.lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0)) });
    setMode('list');
  }

  function generate() {
    const entries = generateJournalsFromPeriod(invoices, supplierBills, ledgerAccounts, genFrom, genTo);
    if (entries.length === 0) { setMessage('No invoices or bills found in that period to generate from.'); return; }
    onGenerate(entries);
    setMessage(`Generated ${entries.length} draft journal${entries.length === 1 ? '' : 's'} — review and post them below.`);
  }

  if (mode === 'form') {
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit journal ${draft.entryNumber}` : 'New journal entry'}
          action={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <div className="accounting-grid">
            <label><span>Date</span><input type="date" value={draft.date} onChange={(e) => update({ date: e.target.value })} /></label>
            <label><span>Reference</span><input value={draft.reference} onChange={(e) => update({ reference: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => update({ status: e.target.value as JournalEntryStatus })}>
                {JOURNAL_ENTRY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginTop: '0.6rem' }}><span>Description</span><input value={draft.description} onChange={(e) => update({ description: e.target.value })} placeholder="e.g. Depreciation — March 2026" /></label>
        </section>

        <section className="card">
          <h3>Lines</h3>
          <div className="payroll-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Account</th><th>Description</th><th className="num" style={{ textAlign: 'right' }}>Debit</th><th className="num" style={{ textAlign: 'right' }}>Credit</th><th></th></tr>
              </thead>
              <tbody>
                {draft.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <select value={l.accountId} onChange={(e) => updateLine(l.id, { accountId: e.target.value })}>
                        <option value="">Select account</option>
                        {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                      </select>
                    </td>
                    <td><input value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} /></td>
                    <td><input type="number" className="payroll-input" value={l.debit} onChange={(e) => updateLine(l.id, { debit: Number(e.target.value), credit: 0 })} /></td>
                    <td><input type="number" className="payroll-input" value={l.credit} onChange={(e) => updateLine(l.id, { credit: Number(e.target.value), debit: 0 })} /></td>
                    <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => removeLine(l.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="payroll-totals">
                  <td colSpan={2}>Totals</td>
                  <td className="num" style={{ textAlign: 'right' }}>{formatNumber(totals.debit, 2)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{formatNumber(totals.credit, 2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button className="ghost-button" style={{ borderStyle: 'dashed', marginTop: '0.5rem' }} onClick={addLine}>+ Add line</button>
          <div className="accounting-actions" style={{ alignItems: 'center', gap: '1rem' }}>
            <span className={totals.balanced ? 'gl-balanced' : 'amount-due'}>
              {totals.balanced ? '✓ Balanced' : `Out by ${formatNumber(Math.abs(totals.debit - totals.credit), 2)}`}
            </span>
            <button className="primary-button" onClick={save} disabled={!totals.balanced}>Save journal</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="General Ledger"
        subtitle="Double-entry journals. Only posted entries hit the financial statements."
        action={<button className="secondary-button" onClick={startNew}>New journal</button>}
      />

      <section className="card accounting-toolbar">
        <span className="muted" style={{ alignSelf: 'center' }}>Generate drafts from sub-ledgers:</span>
        <label><span>From</span><input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} /></label>
        <label><span>To</span><input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} /></label>
        <button className="ghost-button" onClick={generate}>Generate draft journals</button>
      </section>
      {message ? <p className="muted">{message}</p> : null}

      {sorted.length === 0 ? (
        <EmptyState title="No journal entries" body="Post a manual journal, or generate drafts from your invoices and bills." />
      ) : (
        <section className="card">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Reference</th><th>Description</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const t = entryTotals(e);
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td>{e.reference || '—'}</td>
                    <td>{e.description}{!t.balanced ? <span className="amount-due"> · unbalanced</span> : null}</td>
                    <td><span className={`status-pill ${STATUS_CLASS[e.status]}`}>{e.status}</span></td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(t.debit, 2)}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(e)}>Open</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(e.id)}>Delete</button>
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
