/**
 * Printable Quote / Estimate.
 *
 * Customer-facing — pull together company letterhead, quote number,
 * client + product spec, qty / unit price / total, and a terms footer.
 */

import { AppSettingsCompany, Client, QuoteEstimate } from '../../types';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';

interface QuotePrintProps {
  quote: QuoteEstimate;
  client?: Client;
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  onClose: () => void;
}

export function QuotePrint({ quote, client, company, defaultFooterLines, onClose }: QuotePrintProps) {
  const meta: PrintableDocumentMeta[] = [
    { label: 'QUOTE #', value: quote.quoteNumber },
    { label: 'DATE', value: quote.quoteDate ? formatDate(quote.quoteDate) : '—' },
    { label: 'VALID UNTIL', value: '30 days from quote date' },
    { label: 'PREPARED BY', value: quote.salesOwnerName || '—' },
    { label: 'STATUS', value: quote.status },
    ...(quote.quickbooksEstimateNumber ? [{ label: 'QB EST', value: quote.quickbooksEstimateNumber }] : []),
  ];

  const billTo = (
    <>
      <strong>{quote.clientName || client?.name || 'Customer'}</strong>
      {client?.companyName && client.companyName !== client.name ? <div>{client.companyName}</div> : null}
      {client?.contactName ? <div>Attn: {client.contactName}</div> : null}
      {client?.phoneNumber ? <div>{client.phoneNumber}</div> : null}
      {client?.contactEmail ? <div>{client.contactEmail}</div> : null}
    </>
  );

  const lineTotalExcl = quote.totalQuote;
  const vatRate = 0.15;
  const vat = lineTotalExcl * vatRate;
  const totalIncl = lineTotalExcl + vat;

  return (
    <PrintableDocument
      documentTitle="Quote / Estimate"
      meta={meta}
      billTo={billTo}
      company={company}
      defaultFooterLines={defaultFooterLines}
      toolbar={
        <>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
          <button type="button" className="primary-button" onClick={() => window.print()}>Print</button>
        </>
      }
    >
      <section style={{ margin: '12px 0 6px' }}>
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          Thank you for your enquiry. Please find our quotation below. Quote is valid for 30 days
          from the date issued. All prices are quoted in South African Rand and exclude VAT unless
          stated otherwise.
        </p>
      </section>

      <h3 className="work-ticket-print-section-h">Product specification</h3>
      <table className="printable-doc-table">
        <tbody>
          <tr><td><strong>Product</strong></td><td>{quote.productName || '—'}</td></tr>
          <tr><td><strong>Size</strong></td><td>{quote.sizeSpec || '—'}</td></tr>
          <tr><td><strong>Handle</strong></td><td>{quote.handleType}</td></tr>
          <tr><td><strong>Print method</strong></td><td>{quote.printMethod}{quote.colors ? ` · ${quote.colors} colour(s)` : ''}</td></tr>
          <tr><td><strong>Paper</strong></td><td>{quote.paperRateName || '—'}</td></tr>
          <tr><td><strong>Pricing tier</strong></td><td>{quote.pricingTierName || '—'}</td></tr>
        </tbody>
      </table>

      <h3 className="work-ticket-print-section-h">Pricing</h3>
      <table className="printable-doc-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="align-right">Quantity</th>
            <th className="align-right">Unit price (excl VAT)</th>
            <th className="align-right">Line total (excl VAT)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{quote.productName || 'Paper bag'} — {quote.sizeSpec || ''}</td>
            <td className="align-right">{formatNumber(quote.quantity)}</td>
            <td className="align-right">R {formatNumber(quote.quotedUnitPrice, 4)}</td>
            <td className="align-right">R {formatNumber(lineTotalExcl, 2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td colSpan={3} className="align-right">Subtotal (excl VAT)</td><td className="align-right">R {formatNumber(lineTotalExcl, 2)}</td></tr>
          <tr><td colSpan={3} className="align-right">VAT @ 15%</td><td className="align-right">R {formatNumber(vat, 2)}</td></tr>
          <tr><td colSpan={3} className="align-right"><strong>Total (incl VAT)</strong></td><td className="align-right"><strong>R {formatNumber(totalIncl, 2)}</strong></td></tr>
        </tfoot>
      </table>

      {quote.notes ? (
        <section style={{ margin: '16px 0' }}>
          <h3 className="work-ticket-print-section-h">Notes</h3>
          <p style={{ fontSize: 13 }}>{quote.notes}</p>
        </section>
      ) : null}

      <section style={{ margin: '20px 0 8px' }}>
        <h3 className="work-ticket-print-section-h">Terms</h3>
        <ul style={{ fontSize: 12, lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Quote valid for 30 days from issue date.</li>
          <li>Payment terms as per existing agreement, or 50% deposit on order confirmation, balance on collection / delivery.</li>
          <li>Production lead time confirmed on order.</li>
          <li>Customer artwork to be supplied print-ready unless artwork prep is included.</li>
        </ul>
      </section>

      <section className="work-ticket-print-signoff">
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Accepted by (Customer)</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Date</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">For Jomopak</span>
        </div>
      </section>
    </PrintableDocument>
  );
}
