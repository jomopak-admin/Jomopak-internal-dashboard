/**
 * Printable delivery note.
 *
 * Beyond the standard letterhead + line items, this view shows a
 * STOCK-HOLDING SUMMARY whenever the delivery note is linked to a
 * parent invoice (i.e. the customer is on a stock-holding agreement
 * and we're drawing down their already-paid-for stock).
 *
 * For each line on this delivery, we show:
 *   - quantity invoiced (paid for in total)
 *   - previously delivered (sum of earlier delivery notes against the
 *     same invoice line, excluding this one)
 *   - released today (this delivery)
 *   - remaining held (invoiced - previously - today, clamped to 0)
 *
 * Plus a header strip with totals + storage window state so the
 * customer signing for goods can see their running balance at a glance.
 */

import {
  AppSettingsCompany,
  DeliveryNote,
  Invoice,
} from '../../types';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';
import {
  getInvoiceLineDeliveredQuantity,
  summariseInvoiceStockHolding,
  formatDaysFriendly,
} from '../../utils/stockHolding';

interface DeliveryNotePrintProps {
  note: DeliveryNote;
  parentInvoice?: Invoice;
  allDeliveryNotes: DeliveryNote[];
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  termsAndConditions?: string;
  onClose: () => void;
}

export function DeliveryNotePrint({
  note,
  parentInvoice,
  allDeliveryNotes,
  company,
  defaultFooterLines,
  termsAndConditions,
  onClose,
}: DeliveryNotePrintProps) {
  // ----- Stock-holding context (only if linked to a parent invoice) -----
  const otherNotes = allDeliveryNotes.filter((n) => n.id !== note.id);
  const summary = parentInvoice
    ? summariseInvoiceStockHolding(parentInvoice, otherNotes)
    : null;

  const thisDeliveryTotal = note.lineItems.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0,
  );

  // Per-line stock-holding fulfilment, computed against OTHER notes so the
  // "Previously delivered" column doesn't double-count this note.
  const perLine = note.lineItems.map((item) => {
    if (!parentInvoice || !item.invoiceLineItemId) {
      return {
        item,
        invoiced: 0,
        previously: 0,
        today: Number(item.quantity || 0),
        remaining: 0,
        hasStockHolding: false as const,
      };
    }
    const invoiceLine = parentInvoice.lineItems.find((l) => l.id === item.invoiceLineItemId);
    if (!invoiceLine) {
      return {
        item,
        invoiced: 0,
        previously: 0,
        today: Number(item.quantity || 0),
        remaining: 0,
        hasStockHolding: false as const,
      };
    }
    const previously = getInvoiceLineDeliveredQuantity(invoiceLine, parentInvoice.id, otherNotes);
    const today = Number(item.quantity || 0);
    const invoiced = Number(invoiceLine.quantity || 0);
    const remaining = Math.max(0, invoiced - previously - today);
    return {
      item,
      invoiced,
      previously,
      today,
      remaining,
      hasStockHolding: true as const,
    };
  });

  const anyStockHolding = perLine.some((r) => r.hasStockHolding);

  const meta: PrintableDocumentMeta[] = [
    { label: 'NOTE #', value: note.deliveryNoteNumber || '—' },
    { label: 'DATE', value: note.noteDate ? formatDate(note.noteDate) : '—' },
    { label: 'METHOD', value: note.deliveryMethod || '—' },
    { label: 'STATUS', value: note.status },
    ...(note.jobNumber ? [{ label: 'JOB', value: note.jobNumber }] : []),
    ...(parentInvoice ? [{ label: 'INVOICE', value: parentInvoice.invoiceNumber }] : []),
    ...(note.deliveryReference ? [{ label: 'REF', value: note.deliveryReference }] : []),
  ];

  const billTo = (
    <>
      <strong>{note.clientName || 'Client TBD'}</strong>
      {note.clientAddress ? <div>{note.clientAddress}</div> : null}
      {note.clientContactName ? <div>Attn: {note.clientContactName}</div> : null}
      {note.clientContactPhone ? <div>{note.clientContactPhone}</div> : null}
      {note.clientEmail ? <div>{note.clientEmail}</div> : null}
    </>
  );

  return (
    <PrintableDocument
      documentTitle="Delivery Note"
      meta={meta}
      billTo={billTo}
      company={company}
      defaultFooterLines={defaultFooterLines}
      customerNote={note.customerNote}
      termsAndConditions={termsAndConditions}
      toolbar={
        <>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
          <button type="button" className="primary-button" onClick={() => window.print()}>Print</button>
        </>
      }
    >
      {/* ----- 1. Stock-holding summary (only if linked to a stock-holding invoice) ----- */}
      {summary && parentInvoice ? (
        <section className="delivery-note-print-holding">
          <h3 className="work-ticket-print-section-h">Stock held for {note.clientName}</h3>
          <div className="delivery-note-print-holding-grid">
            <div>
              <span className="muted">Invoiced total</span>
              <strong>{formatNumber(summary.totalInvoicedQuantity)}</strong>
            </div>
            <div>
              <span className="muted">Already released</span>
              <strong>{formatNumber(summary.totalDeliveredQuantity)}</strong>
            </div>
            <div>
              <span className="muted">Released today</span>
              <strong>{formatNumber(thisDeliveryTotal)}</strong>
            </div>
            <div>
              <span className="muted">Remaining after</span>
              <strong>
                {formatNumber(
                  Math.max(
                    0,
                    summary.totalInvoicedQuantity - summary.totalDeliveredQuantity - thisDeliveryTotal,
                  ),
                )}
              </strong>
            </div>
            <div>
              <span className="muted">Storage window</span>
              <strong>
                {parentInvoice.stockHoldingMaxDays > 0
                  ? formatDaysFriendly(summary.daysUntilStorageExpiry)
                  : 'No limit'}
              </strong>
            </div>
            <div>
              <span className="muted">Recent draw</span>
              <strong>{formatNumber(summary.weeklyAverageReleased)}/wk</strong>
            </div>
          </div>
        </section>
      ) : null}

      {/* ----- 2. Line items table ----- */}
      <h3 className="work-ticket-print-section-h">Goods released</h3>
      <table className="printable-doc-table delivery-note-print-table">
        <thead>
          {anyStockHolding ? (
            <tr>
              <th>Description</th>
              <th>Stock #</th>
              <th className="align-right">Invoiced</th>
              <th className="align-right">Previously</th>
              <th className="align-right">Today</th>
              <th className="align-right">Remaining</th>
              <th>Unit</th>
            </tr>
          ) : (
            <tr>
              <th>Description</th>
              <th>Stock #</th>
              <th className="align-right">Quantity</th>
              <th>Unit</th>
            </tr>
          )}
        </thead>
        <tbody>
          {perLine.map(({ item, invoiced, previously, today, remaining, hasStockHolding }) => (
            <tr key={item.id}>
              <td>
                <strong>{item.description || item.productName || '—'}</strong>
                {item.description && item.productName && item.description !== item.productName ? (
                  <div className="muted">{item.productName}</div>
                ) : null}
              </td>
              <td>{item.stockNumber || '—'}</td>
              {anyStockHolding ? (
                <>
                  <td className="align-right">{hasStockHolding ? formatNumber(invoiced) : '—'}</td>
                  <td className="align-right">{hasStockHolding ? formatNumber(previously) : '—'}</td>
                  <td className="align-right"><strong>{formatNumber(today)}</strong></td>
                  <td className="align-right">{hasStockHolding ? formatNumber(remaining) : '—'}</td>
                </>
              ) : (
                <td className="align-right"><strong>{formatNumber(today)}</strong></td>
              )}
              <td>{item.quantityUnit || 'units'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={anyStockHolding ? 4 : 2} className="align-right"><strong>Total released today</strong></td>
            <td className="align-right"><strong>{formatNumber(thisDeliveryTotal)}</strong></td>
            {anyStockHolding ? <td colSpan={2}></td> : <td></td>}
          </tr>
        </tfoot>
      </table>

      {/* ----- 3. Notes ----- */}
      {note.notes ? (
        <section className="work-ticket-print-notes">
          <h3 className="work-ticket-print-section-h">Notes</h3>
          <p>{note.notes}</p>
        </section>
      ) : null}

      {/* ----- 4. Signature block ----- */}
      <section className="work-ticket-print-signoff">
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Signed by (Jomopak)</span>
          {note.signedByName ? <div>{note.signedByName}</div> : null}
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Received by (Client)</span>
          {note.collectedByName ? <div>{note.collectedByName}</div> : null}
        </div>
      </section>
    </PrintableDocument>
  );
}
