/**
 * Phase 120 — Pro-formas page.
 *
 * Pro-forma is the request-for-payment doc raised after a Quote is
 * accepted and BEFORE any Tax Invoice. No VAT triggers. No goods move.
 * When payment lands and admin says "Generate Tax Invoice for R X",
 * a real Invoice gets spawned with proformaId set — that's where VAT
 * triggers and the deposit allocation kicks in (Phase 119).
 *
 * UX model — same as Invoices / Quotes:
 *   • List mode by default with filter chips + a "+ Add New Pro-forma"
 *     button up top.
 *   • Click Edit / "+ Add" to enter form mode (FormWizard layout).
 *   • Print / Email actions on each row.
 *   • "Generate Tax Invoice" action visible on pro-formas that aren't
 *     yet fully invoiced — pre-fills the Invoice form with the
 *     remaining amount and stamps the linkage on save.
 */

import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  Product,
  ProForma,
  ProFormaFormState,
  ProFormaStatus,
  PROFORMA_STATUS_LABELS,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';

interface ProFormasFilters {
  search: string;
  month: string;
  client: string;
  status: string;
}

interface ProFormasPageProps {
  monthOptions: string[];
  clients: Client[];
  products: Product[];
  proformas: ProForma[];
  proformaForm: ProFormaFormState;
  setProformaForm: (value: ProFormaFormState) => void;
  proformaEditingId: string | null;
  proformaMessage: string;
  onSave: () => void;
  onReset: () => void;
  proformaFilters: ProFormasFilters;
  setProformaFilters: (value: ProFormasFilters) => void;
  onEdit: (proforma: ProForma) => void;
  onPrint?: (proforma: ProForma) => void;
  onEmail?: (proforma: ProForma) => void;
  /** Convert this pro-forma into a Tax Invoice. Pre-fills the Invoice
   *  form for the remaining un-invoiced amount; admin confirms + saves. */
  onGenerateTaxInvoice?: (proforma: ProForma) => void;
}

const STATUS_OPTIONS: ProFormaStatus[] = ['Draft', 'Sent', 'PartiallyPaid', 'FullyPaid', 'Cancelled'];

export function ProFormasPage({
  monthOptions,
  clients,
  products,
  proformas,
  proformaForm,
  setProformaForm,
  proformaEditingId,
  proformaMessage,
  onSave,
  onReset,
  proformaFilters,
  setProformaFilters,
  onEdit,
  onPrint,
  onEmail,
  onGenerateTaxInvoice,
}: ProFormasPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');

  useEffect(() => {
    if (proformaEditingId) setMode('form');
  }, [proformaEditingId]);

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
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name, sublabel: [p.category, p.sku].filter(Boolean).join(' · ') || undefined })),
    [products],
  );

  // ---- line item helpers ----
  function addLine() {
    setProformaForm({
      ...proformaForm,
      lineItems: [
        ...proformaForm.lineItems,
        {
          id: `line-${Date.now().toString(36)}-${proformaForm.lineItems.length}`,
          productId: '',
          productName: '',
          description: '',
          quantity: '1',
          quantityUnit: 'units',
          unitPriceExclVat: '0',
          vatRatePercent: '15',
        },
      ],
    });
  }
  function patchLine(idx: number, patch: Partial<typeof proformaForm.lineItems[number]>) {
    setProformaForm({
      ...proformaForm,
      lineItems: proformaForm.lineItems.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    });
  }
  function removeLine(idx: number) {
    setProformaForm({
      ...proformaForm,
      lineItems: proformaForm.lineItems.filter((_, i) => i !== idx),
    });
  }

  // Running totals on the form
  const liveTotals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const line of proformaForm.lineItems) {
      const qty = Number(line.quantity || 0);
      const price = Number(line.unitPriceExclVat || 0);
      const vatPct = Number(line.vatRatePercent || 0);
      const lineEx = qty * price;
      subtotal += lineEx;
      vat += lineEx * (vatPct / 100);
    }
    return { subtotal, vat, total: subtotal + vat };
  }, [proformaForm.lineItems]);

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Pro-forma header',
      subtitle: 'When it was issued, who it goes to, what it ties back to.',
      missingRequired: [
        ...(proformaForm.proformaDate ? [] : ['Pro-forma date']),
        ...(proformaForm.clientId ? [] : ['Client']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Pro-forma date <RequiredMarker /></span><input type="date" value={proformaForm.proformaDate} onChange={(e) => setProformaForm({ ...proformaForm, proformaDate: e.target.value })} /></label>
          <label><span>Valid until</span><input type="date" value={proformaForm.validUntilDate} onChange={(e) => setProformaForm({ ...proformaForm, validUntilDate: e.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={proformaForm.clientId} onChange={(v) => setProformaForm({ ...proformaForm, clientId: v })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Customer reference (PO #)</span><input value={proformaForm.customerReference} onChange={(e) => setProformaForm({ ...proformaForm, customerReference: e.target.value })} placeholder="Their PO / order ref" /></label>
          <label><span>Linked quote #</span><input value={proformaForm.quoteNumber} onChange={(e) => setProformaForm({ ...proformaForm, quoteNumber: e.target.value })} placeholder="Optional" /></label>
          <label><span>Linked job #</span><input value={proformaForm.jobNumber} onChange={(e) => setProformaForm({ ...proformaForm, jobNumber: e.target.value })} placeholder="Optional" /></label>
        </div>
      ),
    },
    {
      key: 'lines',
      title: 'Line items',
      subtitle: 'What is being charged. Same shape as a Tax Invoice — when converted, lines copy across.',
      missingRequired: proformaForm.lineItems.length === 0 ? ['At least one line item'] : [],
      body: (
        <div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th style={{ width: 90 }}>Qty</th>
                <th style={{ width: 90 }}>Unit</th>
                <th style={{ width: 120 }}>Unit price (excl)</th>
                <th style={{ width: 80 }}>VAT %</th>
                <th style={{ width: 130, textAlign: 'right' }}>Line total (incl)</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {proformaForm.lineItems.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--jp-ink-3, #64748b)', padding: '12px' }}>No line items yet — click "Add line" below.</td></tr>
              ) : proformaForm.lineItems.map((line, idx) => {
                const qty = Number(line.quantity || 0);
                const price = Number(line.unitPriceExclVat || 0);
                const vatPct = Number(line.vatRatePercent || 0);
                const lineIncl = qty * price * (1 + vatPct / 100);
                return (
                  <tr key={line.id}>
                    <td>
                      <Combobox
                        options={productOptions}
                        value={line.productId}
                        onChange={(v) => {
                          const product = products.find((p) => p.id === v);
                          patchLine(idx, { productId: v, productName: product?.name ?? line.productName });
                        }}
                        placeholder="Pick product…"
                        emptyMessage="No matches"
                      />
                    </td>
                    <td><input value={line.description} onChange={(e) => patchLine(idx, { description: e.target.value })} placeholder="Optional spec / note" /></td>
                    <td><input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => patchLine(idx, { quantity: e.target.value })} /></td>
                    <td><input value={line.quantityUnit} onChange={(e) => patchLine(idx, { quantityUnit: e.target.value as typeof line.quantityUnit })} /></td>
                    <td><input type="number" min="0" step="0.01" value={line.unitPriceExclVat} onChange={(e) => patchLine(idx, { unitPriceExclVat: e.target.value })} /></td>
                    <td><input type="number" min="0" step="0.5" value={line.vatRatePercent} onChange={(e) => patchLine(idx, { vatRatePercent: e.target.value })} /></td>
                    <td style={{ textAlign: 'right' }}>R {formatNumber(lineIncl, 2)}</td>
                    <td><button type="button" className="ghost-button" onClick={() => removeLine(idx)} title="Remove this line">×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" className="secondary-button" onClick={addLine}>+ Add line</button>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div>Subtotal (excl VAT): <strong>R {formatNumber(liveTotals.subtotal, 2)}</strong></div>
              <div>VAT: <strong>R {formatNumber(liveTotals.vat, 2)}</strong></div>
              <div style={{ fontSize: 15 }}>Total (incl VAT): <strong>R {formatNumber(liveTotals.total, 2)}</strong></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'payment',
      title: 'Payment terms & status',
      subtitle: 'What the customer is expected to pay before goods move + where this pro-forma sits.',
      body: (
        <div className="form-grid">
          <label><span>Payment expectation</span>
            <select value={proformaForm.paymentExpectation} onChange={(e) => setProformaForm({ ...proformaForm, paymentExpectation: e.target.value as ProFormaFormState['paymentExpectation'] })}>
              <option value="depositThenDraw">Deposit, then invoice as we deliver</option>
              <option value="fiftyFifty">50% to start, 50% on completion</option>
              <option value="prepayThenDraw">Prepay full order, draw stock as needed</option>
              <option value="cod">Cash on delivery</option>
              <option value="standard">Standard terms (no deposit)</option>
            </select>
          </label>
          <label><span>Status</span>
            <select value={proformaForm.status} onChange={(e) => setProformaForm({ ...proformaForm, status: e.target.value as ProFormaStatus })}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{PROFORMA_STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label><span>Terms text (prints on pro-forma)</span>
            <input value={proformaForm.termsText} onChange={(e) => setProformaForm({ ...proformaForm, termsText: e.target.value })} />
          </label>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      subtitle: 'Internal notes and the customer-facing message printed on the pro-forma.',
      body: (
        <div className="form-grid">
          <label className="full-span"><span>Internal notes</span><textarea value={proformaForm.notes} onChange={(e) => setProformaForm({ ...proformaForm, notes: e.target.value })} /></label>
          <label className="full-span"><span>Customer note (prints on pro-forma)</span><textarea value={proformaForm.customerNote} onChange={(e) => setProformaForm({ ...proformaForm, customerNote: e.target.value })} placeholder="Defaults from Settings → Templates" /></label>
          <label className="full-span"><span>Footer notes</span><textarea value={proformaForm.footerNotes} onChange={(e) => setProformaForm({ ...proformaForm, footerNotes: e.target.value })} placeholder="Bank details / VAT notice / etc." /></label>
        </div>
      ),
    },
  ];

  // ---- list ----
  const filtered = useMemo(() => proformas.filter((pf) => {
    if (proformaFilters.search) {
      const q = proformaFilters.search.toLowerCase();
      const blob = `${pf.proformaNumber} ${pf.clientName} ${pf.clientCompanyName} ${pf.customerReference}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (proformaFilters.month && !pf.proformaDate.startsWith(proformaFilters.month)) return false;
    if (proformaFilters.client && !pf.clientName.toLowerCase().includes(proformaFilters.client.toLowerCase())) return false;
    if (proformaFilters.status && pf.status !== proformaFilters.status) return false;
    return true;
  }), [proformas, proformaFilters]);

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>Add New Pro-forma</button> : null}
        backAction={mode === 'list' ? null : <button className="ghost-button" onClick={handleBackToList}>← Back to Pro-formas</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={proformaEditingId ? 'Edit pro-forma' : 'New pro-forma'}
          subtitle="A pro-forma is a request for payment — not a Tax Invoice. Output VAT triggers later, when the Tax Invoice is raised against a received payment."
          message={proformaMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!proformaEditingId}
          saveLabel="Save Pro-forma"
        />
      ) : (
        <section className="card">
          <SectionTitle title="Pro-forma register" subtitle={`${filtered.length} pro-forma(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={proformaFilters.search} onChange={(e) => setProformaFilters({ ...proformaFilters, search: e.target.value })} /></label>
            <label><span>Month</span>
              <select value={proformaFilters.month} onChange={(e) => setProformaFilters({ ...proformaFilters, month: e.target.value })}>
                <option value="">All months</option>
                {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
              </select>
            </label>
            <label><span>Client</span><input value={proformaFilters.client} onChange={(e) => setProformaFilters({ ...proformaFilters, client: e.target.value })} /></label>
            <label><span>Status</span>
              <select value={proformaFilters.status} onChange={(e) => setProformaFilters({ ...proformaFilters, status: e.target.value })}>
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{PROFORMA_STATUS_LABELS[s]}</option>)}
              </select>
            </label>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No pro-formas yet" body="Pro-formas are the first thing your customer sees — request for payment, no VAT yet. Convert a Quote or click 'Add New Pro-forma' to start one." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Pro-forma</th><th>Date</th><th>Client</th><th>Total (incl)</th><th>Invoiced</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((pf) => (
                    <tr key={pf.id}>
                      <td>
                        <strong>{pf.proformaNumber}</strong>
                        {pf.linkedInvoiceIds.length > 0 ? (
                          <div className="table-subtext">{pf.linkedInvoiceIds.length} tax invoice{pf.linkedInvoiceIds.length === 1 ? '' : 's'}</div>
                        ) : null}
                      </td>
                      <td>{formatDate(pf.proformaDate)}</td>
                      <td>{pf.clientName}{pf.clientCompanyName ? <div className="table-subtext">{pf.clientCompanyName}</div> : null}</td>
                      <td>R {formatNumber(pf.totalInclVat, 2)}</td>
                      <td>R {formatNumber(pf.amountInvoiced, 2)}</td>
                      <td><strong>R {formatNumber(pf.amountStillToInvoice, 2)}</strong></td>
                      <td>{PROFORMA_STATUS_LABELS[pf.status]}</td>
                      <td>
                        <button className="table-button" onClick={() => { onEdit(pf); setMode('form'); }}>Edit</button>
                        {onPrint ? <button className="table-button" onClick={() => onPrint(pf)} title="Print pro-forma">Print</button> : null}
                        {onEmail ? <button className="table-button" onClick={() => onEmail(pf)} title="Email to client" disabled={!pf.clientContactEmail}>Email</button> : null}
                        {onGenerateTaxInvoice && pf.amountStillToInvoice > 0.005 && pf.status !== 'Cancelled' ? (
                          <button className="table-button table-button-promote" onClick={() => onGenerateTaxInvoice(pf)} title={`Generate Tax Invoice for R ${formatNumber(pf.amountStillToInvoice, 2)}`}>
                            → Tax Invoice
                          </button>
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
