import { useEffect, useMemo, useState } from 'react';
import { Combobox, ComboboxOption } from '../../components/Combobox';
import { EmptyState } from '../../components/EmptyState';
import { FormWizard, FormWizardSection, RequiredMarker } from '../../components/FormWizard';
import {
  PrintableDocument,
  PrintableLineTable,
} from '../../components/PrintableDocument';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  DeliveryNote,
  Invoice,
  InvoiceFilters,
  InvoiceFormState,
  InvoiceLineItemFormState,
  InvoicePaymentFormState,
  JobCard,
  ProductionSpec,
  Product,
  QuantityUnit,
  QuoteEstimate,
} from '../../types';
import { formatDate, formatNumber, getMonthLabel } from '../../utils/calculations';
import {
  formatDaysFriendly,
  summariseInvoiceStockHolding,
} from '../../utils/stockHolding';

interface InvoicesPageProps {
  monthOptions: string[];
  clients: Client[];
  jobs: JobCard[];
  quotes: QuoteEstimate[];
  productionSpecs: ProductionSpec[];
  products: Product[];
  deliveryNotes: DeliveryNote[];
  invoiceForm: InvoiceFormState;
  setInvoiceForm: (value: InvoiceFormState) => void;
  invoiceEditingId: string | null;
  invoiceMessage: string;
  onSave: () => void;
  onReset: () => void;
  invoiceFilters: InvoiceFilters;
  setInvoiceFilters: (value: InvoiceFilters) => void;
  filteredInvoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
}

function makeBlankLine(): InvoiceLineItemFormState {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    productName: '',
    description: '',
    quantity: '',
    quantityUnit: 'units',
    unitPriceExclVat: '',
    vatRatePercent: '15',
  };
}

function makeBlankPayment(): InvoicePaymentFormState {
  return {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: '',
    method: 'EFT',
    reference: '',
    notes: '',
  };
}

function calcLineTotals(line: InvoiceLineItemFormState) {
  const qty = Number(line.quantity || 0);
  const price = Number(line.unitPriceExclVat || 0);
  const vat = Number(line.vatRatePercent || 0);
  const excl = qty * price;
  const incl = excl * (1 + vat / 100);
  return { excl, incl };
}

export function InvoicesPage({
  monthOptions,
  clients,
  jobs,
  quotes,
  productionSpecs,
  products,
  deliveryNotes,
  invoiceForm,
  setInvoiceForm,
  invoiceEditingId,
  invoiceMessage,
  onSave,
  onReset,
  invoiceFilters,
  setInvoiceFilters,
  filteredInvoices,
  onEdit,
}: InvoicesPageProps) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceEditingId) setMode('form');
  }, [invoiceEditingId]);

  function handleStartCreate() {
    onReset();
    setMode('form');
    setPreviewInvoiceId(null);
  }

  function handleBackToList() {
    onReset();
    setMode('list');
    setPreviewInvoiceId(null);
  }

  const clientOptions: ComboboxOption[] = useMemo(
    () => clients.map((client) => ({
      value: client.id,
      label: client.name,
      sublabel: client.companyName || client.code || undefined,
    })),
    [clients],
  );
  const jobOptions: ComboboxOption[] = useMemo(
    () => jobs.map((job) => ({
      value: job.id,
      label: job.jobNumber || `Job ${job.id.slice(-6)}`,
      sublabel: [job.customerName, job.productName].filter(Boolean).join(' · '),
    })),
    [jobs],
  );
  const quoteOptions: ComboboxOption[] = useMemo(
    () => quotes.map((quote) => ({
      value: quote.id,
      label: quote.quoteNumber || `Quote ${quote.id.slice(-6)}`,
      sublabel: [quote.clientName, quote.productName].filter(Boolean).join(' · '),
    })),
    [quotes],
  );
  const specOptions: ComboboxOption[] = useMemo(
    () => productionSpecs.map((spec) => ({
      value: spec.id,
      label: spec.specNumber || `Spec ${spec.id.slice(-6)}`,
      sublabel: [spec.clientName, spec.productName].filter(Boolean).join(' · '),
    })),
    [productionSpecs],
  );
  const productOptions: ComboboxOption[] = useMemo(
    () => products.map((product) => ({
      value: product.id,
      label: product.name,
      sublabel: [product.category, product.sku].filter(Boolean).join(' · ') || undefined,
    })),
    [products],
  );

  // Live totals from the form for the preview pane.
  const formTotals = useMemo(() => {
    let excl = 0;
    let vat = 0;
    let incl = 0;
    for (const line of invoiceForm.lineItems) {
      const lineTotals = calcLineTotals(line);
      excl += lineTotals.excl;
      vat += lineTotals.incl - lineTotals.excl;
      incl += lineTotals.incl;
    }
    const paid = invoiceForm.payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
    return { excl, vat, incl, paid, outstanding: incl - paid };
  }, [invoiceForm.lineItems, invoiceForm.payments]);

  function updateLine(id: string, patch: Partial<InvoiceLineItemFormState>) {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: invoiceForm.lineItems.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    });
  }
  function addLine() {
    setInvoiceForm({ ...invoiceForm, lineItems: [...invoiceForm.lineItems, makeBlankLine()] });
  }
  function removeLine(id: string) {
    setInvoiceForm({ ...invoiceForm, lineItems: invoiceForm.lineItems.filter((line) => line.id !== id) });
  }
  function updatePayment(id: string, patch: Partial<InvoicePaymentFormState>) {
    setInvoiceForm({
      ...invoiceForm,
      payments: invoiceForm.payments.map((pay) => (pay.id === id ? { ...pay, ...patch } : pay)),
    });
  }
  function addPayment() {
    setInvoiceForm({ ...invoiceForm, payments: [...invoiceForm.payments, makeBlankPayment()] });
  }
  function removePayment(id: string) {
    setInvoiceForm({ ...invoiceForm, payments: invoiceForm.payments.filter((p) => p.id !== id) });
  }

  const hasUsableLine = invoiceForm.lineItems.some(
    (line) => Number(line.quantity || 0) > 0 && Number(line.unitPriceExclVat || 0) > 0,
  );

  const sections: FormWizardSection[] = [
    {
      key: 'header',
      title: 'Invoice header',
      subtitle: 'Who and when. The bill-to block on the printed invoice comes from the linked client.',
      missingRequired: [
        ...(invoiceForm.clientId ? [] : ['Client']),
        ...(invoiceForm.invoiceDate ? [] : ['Invoice date']),
      ],
      body: (
        <div className="form-grid">
          <label><span>Invoice date <RequiredMarker /></span><input type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} /></label>
          <label><span>Due date</span><input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} /></label>
          <label><span>Client <RequiredMarker /></span><Combobox options={clientOptions} value={invoiceForm.clientId} onChange={(v) => setInvoiceForm({ ...invoiceForm, clientId: v })} placeholder="Search clients…" emptyMessage="No matching clients" /></label>
          <label><span>Customer reference / PO</span><input value={invoiceForm.customerReference} onChange={(e) => setInvoiceForm({ ...invoiceForm, customerReference: e.target.value })} /></label>
          <label><span>Status</span><select value={invoiceForm.status} onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as InvoiceFormState['status'] })}><option>Draft</option><option>Sent</option><option>Partially Paid</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></label>
          <label><span>Currency</span><select value={invoiceForm.currency} onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value as InvoiceFormState['currency'] })}><option>ZAR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
        </div>
      ),
    },
    {
      key: 'links',
      title: 'Linked documents',
      subtitle: 'Optional. Link to the upstream quote, job, or production spec so the trail stays complete.',
      body: (
        <div className="form-grid">
          <label><span>Linked job</span><Combobox options={jobOptions} value={invoiceForm.jobId} onChange={(v) => setInvoiceForm({ ...invoiceForm, jobId: v })} placeholder="Search jobs…" emptyMessage="No matching jobs" /></label>
          <label><span>Linked quote</span><Combobox options={quoteOptions} value={invoiceForm.quoteId} onChange={(v) => setInvoiceForm({ ...invoiceForm, quoteId: v })} placeholder="Search quotes…" emptyMessage="No matching quotes" /></label>
          <label><span>Linked production spec</span><Combobox options={specOptions} value={invoiceForm.productionSpecId} onChange={(v) => setInvoiceForm({ ...invoiceForm, productionSpecId: v })} placeholder="Search specs…" emptyMessage="No matching specs" /></label>
        </div>
      ),
    },
    {
      key: 'lines',
      title: 'Line items',
      subtitle: 'Each line invoiced. Use one line per product even if delivered in parts.',
      missingRequired: hasUsableLine ? [] : ['At least one line with quantity + price'],
      body: (
        <div className="line-items-block">
          {invoiceForm.lineItems.map((line) => {
            const totals = calcLineTotals(line);
            return (
              <div key={line.id} className="line-item-row card">
                <div className="form-grid">
                  <label><span>Product</span><Combobox options={productOptions} value={line.productId} onChange={(v) => {
                    const product = products.find((p) => p.id === v);
                    updateLine(line.id, { productId: v, productName: product?.name || line.productName });
                  }} placeholder="Pick a product…" emptyMessage="No matching products" /></label>
                  <label><span>Description</span><input value={line.description} onChange={(e) => updateLine(line.id, { description: e.target.value })} placeholder="Eg. 250x320mm Brown SOS, 2-colour print" /></label>
                  <label><span>Quantity</span><input type="number" min="0" value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: e.target.value })} /></label>
                  <label><span>Unit</span><select value={line.quantityUnit} onChange={(e) => updateLine(line.id, { quantityUnit: e.target.value as QuantityUnit })}><option>units</option><option>kg</option><option>sheets</option><option>rolls</option></select></label>
                  <label><span>Unit price (excl VAT)</span><input type="number" min="0" step="0.01" value={line.unitPriceExclVat} onChange={(e) => updateLine(line.id, { unitPriceExclVat: e.target.value })} /></label>
                  <label><span>VAT %</span><input type="number" min="0" max="100" step="0.5" value={line.vatRatePercent} onChange={(e) => updateLine(line.id, { vatRatePercent: e.target.value })} /></label>
                </div>
                <div className="line-item-foot">
                  <span className="muted">Line total: <strong>{formatNumber(totals.excl, 2)} excl. / {formatNumber(totals.incl, 2)} incl.</strong></span>
                  <button className="ghost-button" type="button" onClick={() => removeLine(line.id)}>Remove line</button>
                </div>
              </div>
            );
          })}
          <button className="secondary-button" type="button" onClick={addLine}>Add line item</button>
        </div>
      ),
    },
    {
      key: 'stockHolding',
      title: 'Stock-holding agreement',
      subtitle: 'Tick this if the customer pays in full but draws stock from our warehouse over time.',
      contextActive: invoiceForm.stockHoldingApplies,
      contextPrompt: (
        <label className="inline-toggle">
          <input type="checkbox" checked={invoiceForm.stockHoldingApplies} onChange={(e) => setInvoiceForm({ ...invoiceForm, stockHoldingApplies: e.target.checked })} />
          <span>Track this invoice as a stock-holding order</span>
        </label>
      ),
      body: (
        <div className="form-grid">
          <label><span>Storage start date</span><input type="date" value={invoiceForm.stockHoldingStartDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, stockHoldingStartDate: e.target.value })} /></label>
          <label><span>Max storage period (days, 0 = no cap)</span><input type="number" min="0" value={invoiceForm.stockHoldingMaxDays} onChange={(e) => setInvoiceForm({ ...invoiceForm, stockHoldingMaxDays: e.target.value })} /></label>
          <label className="full-span inline-toggle"><input type="checkbox" checked={invoiceForm.stockHoldingApplies} onChange={(e) => setInvoiceForm({ ...invoiceForm, stockHoldingApplies: e.target.checked })} /><span>Stock-holding active</span></label>
        </div>
      ),
    },
    {
      key: 'terms',
      title: 'Terms & notes',
      body: (
        <div className="form-grid">
          <label><span>Payment terms</span><select value={invoiceForm.termsType} onChange={(e) => setInvoiceForm({ ...invoiceForm, termsType: e.target.value as InvoiceFormState['termsType'] })}><option>Full Payment Up Front</option><option>50% Deposit</option><option>Net 7</option><option>Net 14</option><option>Net 30</option><option>Net 60</option><option>On Delivery</option></select></label>
          <label><span>Terms detail (printed)</span><input value={invoiceForm.termsText} onChange={(e) => setInvoiceForm({ ...invoiceForm, termsText: e.target.value })} placeholder="Eg. 50% deposit, balance on collection" /></label>
          <label className="full-span"><span>Notes (internal)</span><textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} /></label>
          <label className="full-span"><span>Footer notes (printed on invoice)</span><textarea value={invoiceForm.footerNotes} onChange={(e) => setInvoiceForm({ ...invoiceForm, footerNotes: e.target.value })} /></label>
          <label className="inline-toggle"><input type="checkbox" checked={invoiceForm.clientVisible} onChange={(e) => setInvoiceForm({ ...invoiceForm, clientVisible: e.target.checked })} /><span>Visible to client portal</span></label>
        </div>
      ),
    },
    {
      key: 'payments',
      title: 'Payments received',
      subtitle: 'Match payments off as they come in. Outstanding balance updates automatically.',
      body: (
        <div className="line-items-block">
          {invoiceForm.payments.length ? invoiceForm.payments.map((pay) => (
            <div key={pay.id} className="line-item-row card">
              <div className="form-grid">
                <label><span>Date</span><input type="date" value={pay.paymentDate} onChange={(e) => updatePayment(pay.id, { paymentDate: e.target.value })} /></label>
                <label><span>Amount</span><input type="number" min="0" step="0.01" value={pay.amount} onChange={(e) => updatePayment(pay.id, { amount: e.target.value })} /></label>
                <label><span>Method</span><select value={pay.method} onChange={(e) => updatePayment(pay.id, { method: e.target.value as InvoicePaymentFormState['method'] })}><option>EFT</option><option>Cash</option><option>Card</option><option>Credit Terms</option><option>Other</option></select></label>
                <label><span>Reference</span><input value={pay.reference} onChange={(e) => updatePayment(pay.id, { reference: e.target.value })} /></label>
                <label className="full-span"><span>Notes</span><input value={pay.notes} onChange={(e) => updatePayment(pay.id, { notes: e.target.value })} /></label>
              </div>
              <div className="line-item-foot">
                <button className="ghost-button" type="button" onClick={() => removePayment(pay.id)}>Remove payment</button>
              </div>
            </div>
          )) : <p className="muted">No payments captured yet.</p>}
          <button className="secondary-button" type="button" onClick={addPayment}>Add payment</button>
          <div className="totals-strip">
            <span>Subtotal excl VAT: <strong>{formatNumber(formTotals.excl, 2)}</strong></span>
            <span>VAT: <strong>{formatNumber(formTotals.vat, 2)}</strong></span>
            <span>Total incl VAT: <strong>{formatNumber(formTotals.incl, 2)}</strong></span>
            <span>Paid: <strong>{formatNumber(formTotals.paid, 2)}</strong></span>
            <span>Outstanding: <strong>{formatNumber(formTotals.outstanding, 2)}</strong></span>
          </div>
        </div>
      ),
    },
  ];

  const previewInvoice = previewInvoiceId
    ? filteredInvoices.find((inv) => inv.id === previewInvoiceId)
    : null;

  return (
    <>
      <SectionTitle
        action={mode === 'list' ? <button className="secondary-button" onClick={handleStartCreate}>New Invoice</button> : <button className="ghost-button" onClick={handleBackToList}>Back to invoices</button>}
      />

      {mode === 'form' ? (
        <FormWizard
          title={invoiceEditingId ? 'Edit invoice' : 'New invoice'}
          subtitle="Lines snapshot the rates at the time of issue. Stock-holding section only counts if you opt in."
          message={invoiceMessage || undefined}
          sections={sections}
          onSave={onSave}
          onCancel={handleBackToList}
          isEditing={!!invoiceEditingId}
          saveLabel="Save Invoice"
        />
      ) : previewInvoice ? (
        <InvoicePreview invoice={previewInvoice} deliveryNotes={deliveryNotes} onClose={() => setPreviewInvoiceId(null)} onEdit={() => { onEdit(previewInvoice); setMode('form'); }} />
      ) : (
        <section className="card">
          <SectionTitle title="Invoice register" subtitle={`${filteredInvoices.length} invoice(s) shown`} />
          <div className="filters-grid">
            <label><span>Search</span><input value={invoiceFilters.search} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, search: e.target.value })} /></label>
            <label><span>Month</span><select value={invoiceFilters.month} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, month: e.target.value })}><option value="">All months</option>{monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}</select></label>
            <label><span>Status</span><select value={invoiceFilters.status} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, status: e.target.value })}><option value="">All statuses</option><option>Draft</option><option>Sent</option><option>Partially Paid</option><option>Paid</option><option>Overdue</option><option>Cancelled</option></select></label>
            <label><span>Stock-holding</span><select value={invoiceFilters.stockHolding} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, stockHolding: e.target.value })}><option value="">All</option><option value="active">Stock-holding only</option><option value="standard">Standard only</option></select></label>
            <label><span>Client</span><input value={invoiceFilters.client} onChange={(e) => setInvoiceFilters({ ...invoiceFilters, client: e.target.value })} /></label>
          </div>
          {filteredInvoices.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Invoice</th><th>Date</th><th>Client</th><th>Total</th><th>Outstanding</th><th>Status</th><th>Stock-holding</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const stockSummary = inv.stockHoldingApplies
                      ? summariseInvoiceStockHolding(inv, deliveryNotes)
                      : null;
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoiceNumber}</strong><div className="table-subtext">{inv.customerReference || ''}</div></td>
                        <td>{formatDate(inv.invoiceDate)}</td>
                        <td>{inv.clientCompanyName || inv.clientName}</td>
                        <td>{inv.currency} {formatNumber(inv.totalInclVat, 2)}</td>
                        <td>{inv.currency} {formatNumber(inv.amountOutstanding, 2)}</td>
                        <td>{inv.status}</td>
                        <td>{stockSummary ? `${formatNumber(stockSummary.totalRemainingQuantity)} left · ${formatDaysFriendly(stockSummary.estimatedDaysOfStockLeft)}` : '—'}</td>
                        <td>
                          <button className="table-button" onClick={() => setPreviewInvoiceId(inv.id)}>Preview</button>{' '}
                          <button className="table-button" onClick={() => { onEdit(inv); setMode('form'); }}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No invoices yet" body="Create your first invoice — it'll show up here with totals, stock-holding state, and a preview button." />
          )}
        </section>
      )}
    </>
  );
}

interface InvoicePreviewProps {
  invoice: Invoice;
  deliveryNotes: DeliveryNote[];
  onClose: () => void;
  onEdit: () => void;
}

function InvoicePreview({ invoice, deliveryNotes, onClose, onEdit }: InvoicePreviewProps) {
  const stockSummary = invoice.stockHoldingApplies
    ? summariseInvoiceStockHolding(invoice, deliveryNotes)
    : null;

  return (
    <>
      {stockSummary ? (
        <section className="card">
          <SectionTitle title="Stock-holding status" subtitle={`Storage agreement runs from ${invoice.stockHoldingStartDate ? formatDate(invoice.stockHoldingStartDate) : 'invoice date'}`} />
          <div className="stock-holding-panel">
            <div className="stock-holding-stat"><div className="stat-label">Total invoiced</div><div className="stat-value">{formatNumber(stockSummary.totalInvoicedQuantity)}</div></div>
            <div className="stock-holding-stat"><div className="stat-label">Released to client</div><div className="stat-value">{formatNumber(stockSummary.totalDeliveredQuantity)}</div></div>
            <div className="stock-holding-stat"><div className="stat-label">In our warehouse</div><div className="stat-value">{formatNumber(stockSummary.totalRemainingQuantity)}</div></div>
            <div className="stock-holding-stat"><div className="stat-label">Weekly avg release</div><div className="stat-value">{formatNumber(stockSummary.weeklyAverageReleased, 1)}</div></div>
            <div className="stock-holding-stat"><div className="stat-label">Estimated cover</div><div className="stat-value">{formatDaysFriendly(stockSummary.estimatedDaysOfStockLeft)}</div></div>
            {invoice.stockHoldingMaxDays > 0 ? <div className="stock-holding-stat"><div className="stat-label">Storage expiry</div><div className="stat-value">{formatDaysFriendly(stockSummary.daysUntilStorageExpiry)}</div></div> : null}
          </div>
          {stockSummary.willExpireBeforeDrawn ? (
            <div className="stock-holding-warning">
              Storage agreement expires before stock will be drawn down. Reach out to the client to arrange release or extend the agreement.
            </div>
          ) : null}
        </section>
      ) : null}

      <PrintableDocument
        documentTitle="Invoice"
        meta={[
          { label: 'INVOICE', value: invoice.invoiceNumber },
          { label: 'DATE', value: invoice.invoiceDate ? formatDate(invoice.invoiceDate) : '—' },
          ...(invoice.dueDate ? [{ label: 'DUE', value: formatDate(invoice.dueDate) }] : []),
          ...(invoice.customerReference ? [{ label: 'REF', value: invoice.customerReference }] : []),
        ]}
        billTo={
          <>
            <div>{invoice.clientContactName || invoice.clientName}</div>
            <div>{invoice.clientCompanyName}</div>
            {invoice.clientBillingAddress.split('\n').filter(Boolean).map((line, idx) => <div key={idx}>{line}</div>)}
            {invoice.clientVatNumber ? <div>VAT Registration No. {invoice.clientVatNumber}</div> : null}
          </>
        }
        toolbar={
          <>
            <button className="ghost-button" onClick={onClose}>Back to register</button>
            <button className="secondary-button" onClick={onEdit}>Edit</button>
            <button className="primary-button" onClick={() => window.print()}>Print / Save PDF</button>
          </>
        }
        footer={invoice.footerNotes ? <p>{invoice.footerNotes}</p> : undefined}
      >
        <PrintableLineTable
          columns={[
            { key: 'date', label: 'DATE', render: () => formatDate(invoice.invoiceDate) },
            { key: 'product', label: 'PRODUCT', render: (line: typeof invoice.lineItems[number]) => line.productName },
            { key: 'description', label: 'DESCRIPTION', render: (line: typeof invoice.lineItems[number]) => line.description },
            { key: 'qty', label: 'QTY', align: 'right', render: (line: typeof invoice.lineItems[number]) => `${formatNumber(line.quantity)} ${line.quantityUnit}` },
            { key: 'price', label: 'UNIT PRICE', align: 'right', render: (line: typeof invoice.lineItems[number]) => `${invoice.currency} ${formatNumber(line.unitPriceExclVat, 2)}` },
            { key: 'total', label: 'TOTAL', align: 'right', render: (line: typeof invoice.lineItems[number]) => `${invoice.currency} ${formatNumber(line.lineTotalExclVat, 2)}` },
          ]}
          rows={invoice.lineItems}
          totalsFooter={
            <>
              <tr className="printable-doc-totals-row">
                <td colSpan={5} className="align-right">Subtotal excl VAT</td>
                <td className="align-right">{invoice.currency} {formatNumber(invoice.subtotalExclVat, 2)}</td>
              </tr>
              <tr className="printable-doc-totals-row">
                <td colSpan={5} className="align-right">VAT</td>
                <td className="align-right">{invoice.currency} {formatNumber(invoice.vatTotal, 2)}</td>
              </tr>
              <tr className="printable-doc-grand-total">
                <td colSpan={5} className="align-right">Total incl VAT</td>
                <td className="align-right">{invoice.currency} {formatNumber(invoice.totalInclVat, 2)}</td>
              </tr>
              {invoice.amountPaid > 0 ? (
                <>
                  <tr className="printable-doc-totals-row">
                    <td colSpan={5} className="align-right">Paid to date</td>
                    <td className="align-right">{invoice.currency} {formatNumber(invoice.amountPaid, 2)}</td>
                  </tr>
                  <tr className="printable-doc-grand-total">
                    <td colSpan={5} className="align-right">Outstanding</td>
                    <td className="align-right">{invoice.currency} {formatNumber(invoice.amountOutstanding, 2)}</td>
                  </tr>
                </>
              ) : null}
            </>
          }
        />
        {invoice.termsText ? <p style={{ marginTop: '6mm' }}><strong>Terms:</strong> {invoice.termsText}</p> : null}
      </PrintableDocument>
    </>
  );
}
