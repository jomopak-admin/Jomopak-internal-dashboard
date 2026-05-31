/**
 * Calculator Quote — printable, multi-line.
 *
 * Reuses the shared PrintableDocument letterhead so it matches the existing
 * single-product QuotePrint exactly, but renders every calculator line in the
 * pricing table plus a plates/setup line where applicable.
 */

import { AppSettingsCompany, CalculatorLineItem, Client } from '../../types';
import { LineResult, QuoteRollup } from '../../utils/calculatorEngine';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';

interface CalculatorQuotePrintProps {
  lines: CalculatorLineItem[];
  results: LineResult[];
  rollup: QuoteRollup;
  client?: Client;
  company?: AppSettingsCompany;
  preparedBy?: string;
  today: string;
  defaultFooterLines?: string[];
  onClose: () => void;
}

const VAT_RATE = 0.15;

export function CalculatorQuotePrint({ lines, results, rollup, client, company, preparedBy, today, defaultFooterLines, onClose }: CalculatorQuotePrintProps) {
  const plateFees = Number(rollup.totalPlateFees) || 0;
  const subtotalExcl = (Number(rollup.totalQuoted) || 0) + plateFees;
  const vat = subtotalExcl * VAT_RATE;
  const totalIncl = subtotalExcl + vat;

  const meta: PrintableDocumentMeta[] = [
    { label: 'QUOTE #', value: `EST-${today.replace(/-/g, '').slice(2)}` },
    { label: 'DATE', value: formatDate(today) },
    { label: 'VALID UNTIL', value: '30 days from quote date' },
    { label: 'PREPARED BY', value: preparedBy || '—' },
  ];

  const billTo = (
    <>
      <strong>{client?.companyName || client?.name || 'Customer'}</strong>
      {client?.contactName ? <div>Attn: {client.contactName}</div> : null}
      {client?.phoneNumber ? <div>{client.phoneNumber}</div> : null}
      {client?.contactEmail ? <div>{client.contactEmail}</div> : null}
    </>
  );

  /* ─── Phase 118 — Email & PDF helpers ─────────────────────────────
   *
   * mailto: builds a pre-populated email to the client's contactEmail
   * with the quote summary in the body. The PDF itself is not attached
   * (mailto can't attach files) but the prompt tells the user to attach
   * the PDF they just saved via the print dialog. Most mail clients
   * (Mac Mail, Outlook, Gmail) handle this seamlessly.
   *
   * downloadPdf wraps window.print(): the browser's "Save as PDF"
   * destination produces a real PDF file without any heavyweight lib.
   * The toast on click reminds the user to choose "Save as PDF" if
   * they're not on a print-to-PDF default.
   */
  const quoteNumber = `EST-${today.replace(/-/g, '').slice(2)}`;
  const customerEmail = client?.contactEmail || '';
  const customerLabel = client?.companyName || client?.name || 'Customer';
  const greetingName = client?.contactName || customerLabel;
  const formatRand = (n: number) => `R ${formatNumber(n, 2)}`;

  function buildEmailBody(): string {
    const lineSummary = lines
      .map((line, idx) => {
        const r = results[idx];
        if (!r) return '';
        return `  • ${lineDescription(line)} — ${formatNumber(Number(line.quantity) || 0)} units @ ${formatRand(r.quotedUnitPrice)} = ${formatRand(r.lineTotal)}`;
      })
      .filter(Boolean)
      .join('\n');
    const plateLine = plateFees > 0 ? `\n  • Plates / origination (once-off): ${formatRand(plateFees)}` : '';
    return [
      `Hi ${greetingName},`,
      '',
      `Thank you for your enquiry. Please find our quotation ${quoteNumber} below:`,
      '',
      lineSummary + plateLine,
      '',
      `Subtotal (excl VAT): ${formatRand(subtotalExcl)}`,
      `VAT @ 15%:           ${formatRand(vat)}`,
      `Total (incl VAT):    ${formatRand(totalIncl)}`,
      '',
      'Quote valid for 30 days from issue date. Please find the PDF attached.',
      '',
      `Kind regards,`,
      `${preparedBy || (company?.name || 'JomoPak')}`,
      company?.email ? `${company.email}` : '',
      company?.phone ? `${company.phone}` : '',
    ].filter(Boolean).join('\n');
  }

  function openMailClient() {
    const subject = `Quote ${quoteNumber} — ${customerLabel}`;
    const body = buildEmailBody();
    const href = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  }

  function downloadPdf() {
    // Suggest a filename in the print dialog. Browsers use document.title
    // as the default Save-as-PDF filename, so we patch it briefly.
    const originalTitle = document.title;
    document.title = `${quoteNumber} - ${customerLabel.replace(/[^A-Za-z0-9._-]+/g, '_')}`;
    window.print();
    // Restore the title after the print dialog returns control.
    window.setTimeout(() => { document.title = originalTitle; }, 1000);
  }

  function lineDescription(line: CalculatorLineItem): string {
    const name = line.productName || line.description || 'Paper bag';
    const dims = [line.bagWidthMm, line.bagHeightMm, line.gussetMm].filter(Boolean).join(' × ');
    const print = line.printMethod && line.printMethod !== 'Plain' && line.printMethod !== 'Auto'
      ? ` · ${line.printMethod}${line.colors ? ` ${line.colors}c` : ''}`
      : '';
    return `${name}${dims ? ` (${dims}mm)` : ''}${print}`;
  }

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
          <button
            type="button"
            className="ghost-button"
            onClick={openMailClient}
            title={customerEmail ? `Email ${customerEmail}` : 'No email on this client — opens blank composer'}
          >
            Email to {customerLabel.length > 22 ? customerLabel.slice(0, 22) + '…' : customerLabel}
          </button>
          <button type="button" className="ghost-button" onClick={downloadPdf} title="Opens the print dialog — choose 'Save as PDF' to download">
            Save as PDF
          </button>
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
          {lines.map((line, idx) => {
            const r = results[idx];
            if (!r) return null;
            return (
              <tr key={line.id}>
                <td>{lineDescription(line)}</td>
                <td className="align-right">{formatNumber(Number(line.quantity) || 0)}</td>
                <td className="align-right">R {formatNumber(r.quotedUnitPrice, 4)}</td>
                <td className="align-right">R {formatNumber(r.lineTotal, 2)}</td>
              </tr>
            );
          })}
          {plateFees > 0 ? (
            <tr>
              <td>Plates / origination (once-off setup)</td>
              <td className="align-right">—</td>
              <td className="align-right">—</td>
              <td className="align-right">R {formatNumber(plateFees, 2)}</td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr><td colSpan={3} className="align-right">Subtotal (excl VAT)</td><td className="align-right">R {formatNumber(subtotalExcl, 2)}</td></tr>
          <tr><td colSpan={3} className="align-right">VAT @ 15%</td><td className="align-right">R {formatNumber(vat, 2)}</td></tr>
          <tr><td colSpan={3} className="align-right"><strong>Total (incl VAT)</strong></td><td className="align-right"><strong>R {formatNumber(totalIncl, 2)}</strong></td></tr>
        </tfoot>
      </table>

      <section style={{ margin: '20px 0 8px' }}>
        <h3 className="work-ticket-print-section-h">Terms</h3>
        <ul style={{ fontSize: 12, lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Quote valid for 30 days from issue date.</li>
          <li>Payment terms as per existing agreement, or 50% deposit on order confirmation, balance on collection / delivery.</li>
          <li>Production lead time confirmed on order.</li>
          <li>Customer artwork to be supplied print-ready unless artwork prep is included.</li>
          <li>Plate / origination charges are once-off unless stated as amortised into the unit price.</li>
        </ul>
      </section>

      <section className="work-ticket-print-signoff">
        <div><div className="work-ticket-print-signline" /><span className="muted">Accepted by (Customer)</span></div>
        <div><div className="work-ticket-print-signline" /><span className="muted">Date</span></div>
        <div><div className="work-ticket-print-signline" /><span className="muted">For Jomopak</span></div>
      </section>
    </PrintableDocument>
  );
}
