/**
 * Printable work-ticket view.
 *
 * Mirrors the layout of the existing factory work-ticket pad (Quote
 * #432058 — Burger Self-Erecting Box) so the foreman gets exactly the same
 * page he's used to handling, just generated automatically.
 *
 * Layout sections, top-to-bottom:
 *   1. Header (company + ticket number + date)
 *   2. Job summary (client, product, qty, size, colours)
 *   3. Cost breakdown table (PRE-PRESS / PAPER / INK / PRESS / GUILLOTINE /
 *      FINISHING / DESPATCH) with per-line cost columns
 *   4. Totals (cost, margin, sell)
 *   5. Notes + signature lines
 *
 * Printing is the same as the other docs: trigger window.print(), and the
 * existing `@media print` rules in styles.css hide the app chrome.
 */

import { AppSettingsCompany } from '../../types';
import { PrintableDocument, PrintableDocumentMeta } from '../../components/PrintableDocument';
import { formatDate, formatNumber } from '../../utils/calculations';
import { WorkTicket } from '../../types';

interface WorkTicketPrintProps {
  ticket: WorkTicket;
  company?: AppSettingsCompany;
  defaultFooterLines?: string[];
  onClose: () => void;
}

export function WorkTicketPrint({
  ticket,
  company,
  defaultFooterLines,
  onClose,
}: WorkTicketPrintProps) {
  const meta: PrintableDocumentMeta[] = [
    { label: 'TICKET #', value: ticket.ticketNumber || '—' },
    { label: 'DATE', value: ticket.ticketDate ? formatDate(ticket.ticketDate) : '—' },
    { label: 'STATUS', value: ticket.status },
    ...(ticket.linkedQuoteNumber ? [{ label: 'QUOTE', value: ticket.linkedQuoteNumber }] : []),
    ...(ticket.linkedJobNumber ? [{ label: 'JOB', value: ticket.linkedJobNumber }] : []),
  ];

  const billTo = (
    <>
      <strong>{ticket.clientName || 'Client TBD'}</strong>
    </>
  );

  return (
    <PrintableDocument
      documentTitle="Work Ticket"
      meta={meta}
      billTo={billTo}
      company={company}
      defaultFooterLines={defaultFooterLines}
      toolbar={
        <>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-button" onClick={() => window.print()}>
            Print
          </button>
        </>
      }
    >
      {/* ----- 1. Job summary block ----- */}
      <section className="work-ticket-print-summary">
        <div>
          <span className="muted">Product</span>
          <div>
            <strong>{ticket.productName || ticket.productDescription || '—'}</strong>
          </div>
        </div>
        <div>
          <span className="muted">Size</span>
          <div>{ticket.sizeSpec || '—'}</div>
        </div>
        <div>
          <span className="muted">Quantity</span>
          <div>{formatNumber(ticket.quantity)}</div>
        </div>
        <div>
          <span className="muted">Sheets</span>
          <div>{formatNumber(ticket.sheets)}</div>
        </div>
        <div>
          <span className="muted">Sheet size</span>
          <div>{ticket.sheetSize || '—'}</div>
        </div>
        <div>
          <span className="muted">Colours</span>
          <div>{ticket.colors}</div>
        </div>
        <div>
          <span className="muted">Print method</span>
          <div>{ticket.printMethod}</div>
        </div>
        <div>
          <span className="muted">Handle</span>
          <div>{ticket.handleType}</div>
        </div>
        <div>
          <span className="muted">Paper</span>
          <div>
            {ticket.paperRateName || '—'}
            {ticket.paperType ? ` · ${ticket.paperType}` : ''}
            {ticket.paperGsm ? ` · ${ticket.paperGsm}gsm` : ''}
          </div>
        </div>
      </section>

      {/* ----- 2. Cost breakdown table ----- */}
      <h3 className="work-ticket-print-section-h">Cost breakdown</h3>
      <table className="printable-doc-table work-ticket-print-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Detail</th>
            <th className="align-right">Qty</th>
            <th className="align-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {/* PRE-PRESS */}
          <tr>
            <td>
              <strong>PRE-PRESS</strong>
            </td>
            <td>
              {ticket.plateCostName || '—'}
              {ticket.colors ? ` · ${ticket.colors} plates` : ''}
            </td>
            <td className="align-right">{ticket.colors}</td>
            <td className="align-right">{formatNumber(ticket.prePressCost, 2)}</td>
          </tr>

          {/* PAPER */}
          <tr>
            <td>
              <strong>PAPER</strong>
            </td>
            <td>{ticket.paperRateName || '—'}</td>
            <td className="align-right">{formatNumber(ticket.paperKg, 2)} kg</td>
            <td className="align-right">{formatNumber(ticket.paperCost, 2)}</td>
          </tr>

          {/* INK */}
          {ticket.inkLines.length === 0 ? (
            <tr>
              <td>
                <strong>INK</strong>
              </td>
              <td className="muted">No ink lines</td>
              <td className="align-right">—</td>
              <td className="align-right">{formatNumber(ticket.inkSubtotal, 2)}</td>
            </tr>
          ) : (
            ticket.inkLines.map((line, idx) => (
              <tr key={line.id}>
                <td>{idx === 0 ? <strong>INK</strong> : ''}</td>
                <td>
                  {line.inkName || '(unset)'} · {formatNumber(line.coveragePercent, 0)}% coverage
                </td>
                <td className="align-right">{formatNumber(line.estimatedKg, 4)} kg</td>
                <td className="align-right">{formatNumber(line.cost, 2)}</td>
              </tr>
            ))
          )}

          {/* PRESS */}
          {ticket.pressLines.map((line, idx) => (
            <tr key={line.id}>
              <td>{idx === 0 ? <strong>PRESS</strong> : ''}</td>
              <td>{line.machineName}</td>
              <td className="align-right">{formatNumber(line.minutes, 1)} min</td>
              <td className="align-right">{formatNumber(line.cost, 2)}</td>
            </tr>
          ))}

          {/* GUILLOTINE */}
          {ticket.guillotineLines.map((line, idx) => (
            <tr key={line.id}>
              <td>{idx === 0 ? <strong>GUILLOTINE</strong> : ''}</td>
              <td>{line.machineName}</td>
              <td className="align-right">{formatNumber(line.minutes, 1)} min</td>
              <td className="align-right">{formatNumber(line.cost, 2)}</td>
            </tr>
          ))}

          {/* FINISHING */}
          {ticket.finishingLines.length === 0 ? null : (
            ticket.finishingLines.map((line, idx) => (
              <tr key={line.id}>
                <td>{idx === 0 ? <strong>FINISHING</strong> : ''}</td>
                <td>{line.operationName || '(unset)'}</td>
                <td className="align-right">{formatNumber(line.quantity)}</td>
                <td className="align-right">{formatNumber(line.cost, 2)}</td>
              </tr>
            ))
          )}

          {/* DESPATCH */}
          <tr>
            <td>
              <strong>DESPATCH</strong>
            </td>
            <td>{ticket.despatchNotes || '—'}</td>
            <td className="align-right">—</td>
            <td className="align-right">{formatNumber(ticket.despatchCost, 2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="align-right">
              <strong>TOTAL COST</strong>
            </td>
            <td className="align-right">
              <strong>{formatNumber(ticket.totalCost, 2)}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="align-right">
              Margin {formatNumber(ticket.marginPercent, 2)}% applied
            </td>
            <td className="align-right">{formatNumber(ticket.sellingPriceTotal - ticket.totalCost, 2)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="align-right">
              <strong>SELL / UNIT</strong>
            </td>
            <td className="align-right">
              <strong>{formatNumber(ticket.sellingPricePerUnit, 4)}</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="align-right">
              <strong>TOTAL SELL</strong>
            </td>
            <td className="align-right">
              <strong>{formatNumber(ticket.sellingPriceTotal, 2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ----- 3. Notes ----- */}
      {ticket.notes ? (
        <section className="work-ticket-print-notes">
          <h3 className="work-ticket-print-section-h">Notes</h3>
          <p>{ticket.notes}</p>
        </section>
      ) : null}

      {/* ----- 4. Signature block ----- */}
      <section className="work-ticket-print-signoff">
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Costed by</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Approved by</span>
        </div>
        <div>
          <div className="work-ticket-print-signline" />
          <span className="muted">Foreman</span>
        </div>
      </section>
    </PrintableDocument>
  );
}
