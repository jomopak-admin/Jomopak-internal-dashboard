/**
 * Accounts Payable — Phase 24 (Accounting core)
 *
 * Money owed to suppliers (creditors). Capture each supplier bill, classify it
 * against an expense account from the Chart of Accounts, track VAT, and record
 * payments against it. A running "outstanding" balance and a status pill make
 * it obvious what still needs paying — and the totals roll up to a creditors
 * summary the bookkeeper / SARS prep can lean on.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  LedgerAccount,
  Supplier,
  SupplierBill,
  SupplierBillPayment,
  SupplierBillStatus,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface AccountsPayablePageProps {
  supplierBills: SupplierBill[];
  suppliers: Supplier[];
  ledgerAccounts: LedgerAccount[];
  onSave: (bill: SupplierBill) => void;
  onDelete: (id: string) => void;
}

const VAT_RATE = 0.15; // South African standard rate.

function today(): string { return new Date().toISOString().slice(0, 10); }

function emptyBill(): SupplierBill {
  return {
    id: '', billNumber: '', supplierInvoiceNumber: '', createdAt: '',
    billDate: today(), dueDate: '', supplierId: '', supplierName: '',
    expenseAccountId: '', expenseAccountName: '', currency: 'ZAR',
    subtotalExclVat: 0, vatAmount: 0, totalInclVat: 0,
    payments: [], amountPaid: 0, amountOutstanding: 0, status: 'Unpaid',
    sourceShipmentId: '', sourceInboxId: '', notes: '',
  };
}

/** Derive totals + status from the editable fields. Manual Disputed/Cancelled
 *  states are preserved; otherwise status follows the paid-vs-outstanding maths. */
function recompute(b: SupplierBill): SupplierBill {
  const subtotal = Number(b.subtotalExclVat) || 0;
  const vat = Number(b.vatAmount) || 0;
  const total = Math.round((subtotal + vat) * 100) / 100;
  const paid = Math.round(b.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100;
  const outstanding = Math.round((total - paid) * 100) / 100;
  let status: SupplierBillStatus = b.status;
  if (status !== 'Disputed' && status !== 'Cancelled') {
    if (paid <= 0) status = 'Unpaid';
    else if (outstanding <= 0) status = 'Paid';
    else status = 'Partially Paid';
  }
  return { ...b, totalInclVat: total, amountPaid: paid, amountOutstanding: outstanding, status };
}

function blankPayment(): SupplierBillPayment {
  return { id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, paymentDate: today(), amount: 0, method: 'EFT', reference: '', notes: '' };
}

const STATUS_CLASS: Record<SupplierBillStatus, string> = {
  'Unpaid': 'status-pending',
  'Partially Paid': 'status-ocr_running',
  'Paid': 'status-reviewed',
  'Disputed': 'status-ocr_done',
  'Cancelled': 'status-duplicate',
};

export function AccountsPayablePage({ supplierBills, suppliers, ledgerAccounts, onSave, onDelete }: AccountsPayablePageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [draft, setDraft] = useState<SupplierBill>(emptyBill());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | SupplierBillStatus>('open');

  const expenseAccounts = useMemo(
    () => ledgerAccounts.filter((a) => a.type === 'Expense' && a.active).sort((a, b) => (a.code || '').localeCompare(b.code || '')),
    [ledgerAccounts],
  );

  const sorted = useMemo(
    () => [...supplierBills].sort((a, b) => (b.billDate || b.createdAt || '').localeCompare(a.billDate || a.createdAt || '')),
    [supplierBills],
  );

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return sorted;
    if (statusFilter === 'open') return sorted.filter((b) => b.status === 'Unpaid' || b.status === 'Partially Paid');
    return sorted.filter((b) => b.status === statusFilter);
  }, [sorted, statusFilter]);

  const totals = useMemo(() => {
    const open = sorted.filter((b) => b.status === 'Unpaid' || b.status === 'Partially Paid');
    const outstanding = open.reduce((s, b) => s + (Number(b.amountOutstanding) || 0), 0);
    const overdue = open
      .filter((b) => b.dueDate && b.dueDate < today())
      .reduce((s, b) => s + (Number(b.amountOutstanding) || 0), 0);
    return { outstanding, overdue, openCount: open.length };
  }, [sorted]);

  function startNew() { setDraft(emptyBill()); setEditingId(null); setMode('form'); }
  function startEdit(b: SupplierBill) { setDraft(recompute(b)); setEditingId(b.id); setMode('form'); }
  function update(patch: Partial<SupplierBill>) { setDraft((d) => recompute({ ...d, ...patch })); }

  function applyVat() {
    setDraft((d) => recompute({ ...d, vatAmount: Math.round((Number(d.subtotalExclVat) || 0) * VAT_RATE * 100) / 100 }));
  }

  function addPayment() { setDraft((d) => recompute({ ...d, payments: [...d.payments, blankPayment()] })); }
  function updatePayment(id: string, patch: Partial<SupplierBillPayment>) {
    setDraft((d) => recompute({ ...d, payments: d.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }
  function removePayment(id: string) { setDraft((d) => recompute({ ...d, payments: d.payments.filter((p) => p.id !== id) })); }

  function save() {
    if (!draft.supplierId || (Number(draft.subtotalExclVat) || 0) <= 0) return;
    const supplier = suppliers.find((s) => s.id === draft.supplierId);
    const account = ledgerAccounts.find((a) => a.id === draft.expenseAccountId);
    const computed = recompute({
      ...draft,
      supplierName: supplier?.name || draft.supplierName,
      expenseAccountName: account ? `${account.code} · ${account.name}` : draft.expenseAccountName,
    });
    onSave(computed);
    setMode('list');
  }

  if (mode === 'form') {
    return (
      <div className="page-stack accounting-shell">
        <SectionTitle
          title={editingId ? `Edit bill ${draft.billNumber}` : 'New supplier bill'}
          backAction={<button className="ghost-button" onClick={() => setMode('list')}>Back</button>}
        />
        <section className="card">
          <h3>Bill details</h3>
          <div className="accounting-grid">
            <label><span>Supplier *</span>
              <select value={draft.supplierId} onChange={(e) => update({ supplierId: e.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label><span>Supplier invoice no.</span><input value={draft.supplierInvoiceNumber} onChange={(e) => update({ supplierInvoiceNumber: e.target.value })} /></label>
            <label><span>Expense account</span>
              <select value={draft.expenseAccountId} onChange={(e) => update({ expenseAccountId: e.target.value })}>
                <option value="">Select account</option>
                {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </select>
            </label>
            <label><span>Currency</span><input value={draft.currency} onChange={(e) => update({ currency: e.target.value })} /></label>
            <label><span>Bill date</span><input type="date" value={draft.billDate} onChange={(e) => update({ billDate: e.target.value })} /></label>
            <label><span>Due date</span><input type="date" value={draft.dueDate} onChange={(e) => update({ dueDate: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={draft.status} onChange={(e) => update({ status: e.target.value as SupplierBillStatus })}>
                {(['Unpaid', 'Partially Paid', 'Paid', 'Disputed', 'Cancelled'] as SupplierBillStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <h3>Amounts ({draft.currency})</h3>
          <div className="accounting-grid">
            <label><span>Subtotal (excl. VAT) *</span><input type="number" value={draft.subtotalExclVat} onChange={(e) => update({ subtotalExclVat: Number(e.target.value) })} /></label>
            <label><span>VAT amount</span>
              <div className="accounting-inline">
                <input type="number" value={draft.vatAmount} onChange={(e) => update({ vatAmount: Number(e.target.value) })} />
                <button type="button" className="ghost-button" onClick={applyVat}>15%</button>
              </div>
            </label>
            <label><span>Total (incl. VAT)</span><input type="number" value={draft.totalInclVat} disabled /></label>
          </div>
          <label style={{ display: 'block', marginTop: '0.75rem' }}><span>Notes</span><input value={draft.notes} onChange={(e) => update({ notes: e.target.value })} /></label>
        </section>

        <section className="card">
          <h3>Payments</h3>
          {draft.payments.length === 0 ? (
            <p className="muted">No payments recorded yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th><th>Method</th><th>Reference</th><th></th></tr>
              </thead>
              <tbody>
                {draft.payments.map((p) => (
                  <tr key={p.id}>
                    <td><input type="date" value={p.paymentDate} onChange={(e) => updatePayment(p.id, { paymentDate: e.target.value })} /></td>
                    <td><input type="number" style={{ width: 110, textAlign: 'right' }} value={p.amount} onChange={(e) => updatePayment(p.id, { amount: Number(e.target.value) })} /></td>
                    <td>
                      <select value={p.method} onChange={(e) => updatePayment(p.id, { method: e.target.value })}>
                        {['EFT', 'Cash', 'Card', 'Cheque', 'Other'].map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    <td><input value={p.reference} onChange={(e) => updatePayment(p.id, { reference: e.target.value })} /></td>
                    <td><button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => removePayment(p.id)}></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button className="ghost-button" style={{ borderStyle: 'dashed', marginTop: '0.5rem' }} onClick={addPayment}>+ Record payment</button>

          <div className="accounting-summary">
            <div><span className="muted">Total</span><strong>{draft.currency} {formatNumber(draft.totalInclVat, 2)}</strong></div>
            <div><span className="muted">Paid</span><strong>{draft.currency} {formatNumber(draft.amountPaid, 2)}</strong></div>
            <div><span className="muted">Outstanding</span><strong className={draft.amountOutstanding > 0 ? 'amount-due' : ''}>{draft.currency} {formatNumber(draft.amountOutstanding, 2)}</strong></div>
          </div>
          <div className="accounting-actions">
            <button className="primary-button" onClick={save} disabled={!draft.supplierId || (Number(draft.subtotalExclVat) || 0) <= 0}>Save bill</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionTitle
        title="Accounts Payable"
        subtitle="Supplier bills you owe — track due dates, VAT and payments so nothing slips."
        action={<button className="secondary-button" onClick={startNew}>New bill</button>}
      />

      <section className="stats-grid">
        <div className="card stat-card">
          <p className="stat-label">Outstanding ({totals.openCount} open bill{totals.openCount === 1 ? '' : 's'})</p>
          <h3>ZAR {formatNumber(totals.outstanding, 2)}</h3>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Overdue (past due date)</p>
          <h3 className={totals.overdue > 0 ? 'amount-due' : ''}>ZAR {formatNumber(totals.overdue, 2)}</h3>
        </div>
      </section>

      <section className="card accounting-toolbar">
        <label><span>Show</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'open' | 'all' | SupplierBillStatus)}>
            <option value="open">Open (unpaid + partial)</option>
            <option value="all">All bills</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Disputed">Disputed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="No bills" body="Capture a supplier bill to start tracking what you owe." />
      ) : (
        <section className="card">
          <table className="data-table">
            <thead>
              <tr><th>Bill</th><th>Supplier</th><th>Account</th><th>Due</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Outstanding</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const overdue = b.dueDate && b.dueDate < today() && b.amountOutstanding > 0;
                return (
                  <tr key={b.id}>
                    <td><strong>{b.billNumber || b.id}</strong>{b.supplierInvoiceNumber ? <div className="muted" style={{ fontSize: '0.75rem' }}>{b.supplierInvoiceNumber}</div> : null}</td>
                    <td>{b.supplierName}</td>
                    <td className="muted">{b.expenseAccountName || '—'}</td>
                    <td className={overdue ? 'amount-due' : ''}>{b.dueDate || '—'}</td>
                    <td><span className={`status-pill ${STATUS_CLASS[b.status]}`}>{b.status}</span></td>
                    <td style={{ textAlign: 'right' }}>{b.currency} {formatNumber(b.totalInclVat, 2)}</td>
                    <td style={{ textAlign: 'right' }} className={b.amountOutstanding > 0 ? 'amount-due' : ''}>{b.currency} {formatNumber(b.amountOutstanding, 2)}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="link-button" onClick={() => startEdit(b)}>Edit</button>
                      {' · '}
                      <button className="link-button" style={{ color: 'var(--jp-alert)' }} onClick={() => onDelete(b.id)}>Delete</button>
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
