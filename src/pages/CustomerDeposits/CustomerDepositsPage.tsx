/**
 * Phase 119.3 — Customer Deposits page.
 *
 * A deposit is money received from a customer BEFORE we've delivered the
 * goods or issued a Tax Invoice. On the balance sheet it's a liability —
 * we owe them stock (or a refund). When a Tax Invoice is later raised
 * from the parent pro-forma, the allocation engine consumes deposits
 * FIFO and reclassifies the credit as revenue.
 *
 * UX model — same pattern as Quotes / Pro-formas / Invoices:
 *   • List by default with status filter chips (Open / Allocated /
 *     Refunded / Cancelled) and a "+ Capture Deposit" button.
 *   • Form mode for new/edit (FormWizard).
 *   • Each row shows: deposit #, client, amount, allocated, remaining.
 *
 * The big difference from Invoices: a deposit is NOT a Tax Invoice. No
 * VAT triggers here. The receipt printable (Phase 119.4) acknowledges
 * the cash receipt but is not a SARS tax document.
 */

import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  CustomerDeposit,
  CustomerDepositFormState,
  DepositPurpose,
  DepositStatus,
  ProForma,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface CustomerDepositsFilters {
  search: string;
  month: string;
  client: string;
  status: string;
}

interface CustomerDepositsPageProps {
  monthOptions: string[];
  clients: Client[];
  proformas: ProForma[];
  deposits: CustomerDeposit[];
  depositForm: CustomerDepositFormState;
  setDepositForm: (value: CustomerDepositFormState) => void;
  depositEditingId: string | null;
  depositMessage: string;
  onSave: () => void;
  onReset: () => void;
  depositFilters: CustomerDepositsFilters;
  setDepositFilters: (value: CustomerDepositsFilters) => void;
  onEdit: (deposit: CustomerDeposit) => void;
  onCancel?: (deposit: CustomerDeposit) => void;
  onPrintReceipt?: (deposit: CustomerDeposit) => void;
}

const PURPOSE_LABELS: Record<DepositPurpose, string> = {
  jobDeposit: 'Per-order deposit',
  fiftyFirstHalf: '50% — first half',
  fiftySecondHalf: '50% — second half',
  prepayment: 'Full prepayment',
  topUp: 'Top-up to existing balance',
  other: 'Other',
};

const STATUS_LABELS: Record<DepositStatus, string> = {
  Open: 'Open',
  Allocated: 'Fully allocated',
  Refunded: 'Refunded',
  Cancelled: 'Cancelled',
};

const PAYMENT_METHODS = ['EFT', 'Card', 'Cash', 'Cheque', 'Other'];

export function CustomerDepositsPage({
  monthOptions,
  clients,
  proformas,
  deposits,
  depositForm,
  setDepositForm,
  depositEditingId,
  depositMessage,
  onSave,
  onReset,
  depositFilters,
  setDepositFilters,
  onEdit,
  onCancel,
  onPrintReceipt,
}: CustomerDepositsPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => { if (depositEditingId) setMode('form'); }, [depositEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
  }
  function handleBackToList() {
    onReset();
    setMode('list');
  }

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name, sublabel: c.companyName || c.code || undefined })),
    [clients],
  );

  // Pro-formas for the picked client — only show open ones since you
  // shouldn't normally tie a new deposit against a fully-paid pro-forma.
  const eligibleProformas = useMemo(() => proformas.filter((pf) =>
    pf.clientId === depositForm.clientId
    && pf.status !== 'FullyPaid'
    && pf.status !== 'Cancelled'
  ), [proformas, depositForm.clientId]);
  const proformaOptions: ComboboxOption[] = useMemo(
    () => eligibleProformas.map((pf) => ({
      value: pf.id,
      label: pf.proformaNumber,
      sublabel: `R ${formatNumber(pf.amountStillToInvoice, 2)} still to invoice`,
    })),
    [eligibleProformas],
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Deposit details',
      subtitle: 'Who paid, how much, when, and how. Bank reference helps reconciliation later.',
      missingRequired: [
        ...(depositForm.clientId ? [] : ['Client']),
        ...(depositForm.amount && Number(depositForm.amount) > 0 ? [] : ['Amount']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Received date <RequiredMarker /></span><input type="date" value={depositForm.receivedDate} onChange={(e) => setDepositForm({ ...depositForm, receivedDate: e.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={depositForm.clientId} onChange={(v) => setDepositForm({ ...depositForm, clientId: v })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Amount (incl VAT) <RequiredMarker /></span><input type="number" min="0" step="0.01" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} /></label>
          <label><span>Payment method</span>
            <select value={depositForm.paymentMethod} onChange={(e) => setDepositForm({ ...depositForm, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label><span>Bank reference</span><input value={depositForm.bankReference} onChange={(e) => setDepositForm({ ...depositForm, bankReference: e.target.value })} placeholder="EFT ref / cheque #" /></label>
          <label><span>Purpose</span>
            <select value={depositForm.purpose} onChange={(e) => setDepositForm({ ...depositForm, purpose: e.target.value as DepositPurpose })}>
              {(Object.keys(PURPOSE_LABELS) as DepositPurpose[]).map((p) => <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: 'link',
      title: 'Link to pro-forma (optional)',
      subtitle: 'Tying the deposit to a specific pro-forma means the allocation engine knows where to apply it when the Tax Invoice is raised. Leave blank for a floating client deposit (prepayment / top-up).',
      body: (
        <div className="form-grid">
          {depositForm.clientId ? (
            eligibleProformas.length > 0 ? (
              <label className="full-span"><span>Pro-forma</span>
                <Combobox
                  options={proformaOptions}
                  value={depositForm.proformaId}
                  onChange={(v) => {
                    const pf = eligibleProformas.find((p) => p.id === v);
                    setDepositForm({ ...depositForm, proformaId: v, proformaNumber: pf?.proformaNumber ?? '' });
                  }}
                  placeholder="Search pro-formas…"
                  emptyMessage="No open pro-formas for this client"
                />
              </label>
            ) : (
              <div className="full-span" style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', fontStyle: 'italic' }}>
                No open pro-formas for this client. Deposit will float against the client balance until a pro-forma is raised.
              </div>
            )
          ) : (
            <div className="full-span" style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', fontStyle: 'italic' }}>
              Pick a client above to see their open pro-formas.
            </div>
          )}
          <label className="full-span"><span>Internal notes</span><textarea value={depositForm.notes} onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })} placeholder="Anything finance needs to remember about this deposit" /></label>
        </div>
      ),
    },
  ];

  // ---- list ----
  const filtered = useMemo(() => deposits.filter((d) => {
    if (depositFilters.search) {
      const q = depositFilters.search.toLowerCase();
      const blob = `${d.depositNumber} ${d.clientName} ${d.bankReference} ${d.proformaNumber}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (depositFilters.month && !d.receivedDate.startsWith(depositFilters.month)) return false;
    if (depositFilters.client && !d.clientName.toLowerCase().includes(depositFilters.client.toLowerCase())) return false;
    if (depositFilters.status && d.status !== depositFilters.status) return false;
    return true;
  }), [deposits, depositFilters]);

  // Running totals across the visible list — useful summary for finance.
  const totals = useMemo(() => {
    let received = 0;
    let allocated = 0;
    let remaining = 0;
    for (const d of filtered) {
      if (d.status === 'Cancelled') continue;
      received += d.amount;
      allocated += d.allocatedAmount;
      remaining += d.remainingAmount;
    }
    return { received, allocated, remaining };
  }, [filtered]);

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Capture Deposit</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={handleBackToList}>← Back to Deposits</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={depositEditingId ? 'Edit deposit' : 'Capture deposit'}
          subtitle="Deposits sit as a liability until allocated to a Tax Invoice. The allocation engine will draw from them FIFO when invoices are raised against the linked pro-forma."
          message={depositMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!depositEditingId}
          saveLabel="Save Deposit"
        />
      ) : (
        <section className="card">
          <SectionTitle
            title="Deposit ledger"
            subtitle={`${filtered.length} deposit(s) shown · Received R ${formatNumber(totals.received, 2)} · Allocated R ${formatNumber(totals.allocated, 2)} · Open R ${formatNumber(totals.remaining, 2)}`}
          />
          <div className="filters-grid">
            <label><span>Search</span><input value={depositFilters.search} onChange={(e) => setDepositFilters({ ...depositFilters, search: e.target.value })} placeholder="Deposit # / client / bank ref" /></label>
            <label><span>Month</span>
              <select value={depositFilters.month} onChange={(e) => setDepositFilters({ ...depositFilters, month: e.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
              </select>
            </label>
            <label><span>Client</span><input value={depositFilters.client} onChange={(e) => setDepositFilters({ ...depositFilters, client: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={depositFilters.status} onChange={(e) => setDepositFilters({ ...depositFilters, status: e.target.value })}>
                <option value="">All statuses</option>
                {(Object.keys(STATUS_LABELS) as DepositStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No deposits captured" body="Click 'Capture Deposit' when money lands in the bank from a customer paying against a pro-forma." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Deposit</th><th>Date</th><th>Client</th><th>Amount</th><th>Allocated</th><th>Remaining</th><th>Status</th><th>Pro-forma</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.depositNumber}</strong>{d.bankReference ? <div className="table-subtext">Ref: {d.bankReference}</div> : null}</td>
                      <td>{formatDate(d.receivedDate)}</td>
                      <td>{d.clientName}</td>
                      <td>R {formatNumber(d.amount, 2)}</td>
                      <td>R {formatNumber(d.allocatedAmount, 2)}</td>
                      <td><strong>R {formatNumber(d.remainingAmount, 2)}</strong></td>
                      <td>{STATUS_LABELS[d.status]}</td>
                      <td>{d.proformaNumber || <span style={{ color: 'var(--jp-ink-3, #64748b)' }}>—</span>}</td>
                      <td>
                        <button className="table-button" onClick={() => { onEdit(d); setMode('form'); }}>Edit</button>
                        {onPrintReceipt ? <button className="table-button" onClick={() => onPrintReceipt(d)}>Receipt</button> : null}
                        {onCancel && d.status !== 'Cancelled' && d.allocatedAmount <= 0.005 ? (
                          <button className="table-button" onClick={() => onCancel(d)} title="Void this deposit (only allowed before any allocations)">Cancel</button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
