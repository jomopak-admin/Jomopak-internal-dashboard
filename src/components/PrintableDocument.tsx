import { ReactNode } from 'react';

/**
 * Shared printable document layout. Used by Invoice, Delivery Note, and
 * Production Spec to share JomoPak's letterhead, footer, and print styling.
 *
 * The component renders both inline (preview) and as a print-only wrapper
 * (`printable-doc` class) — see styles.css for the @media print rules that
 * hide the surrounding app chrome and force A4 sizing.
 */

export const JOMOPAK_COMPANY_DETAILS = {
  name: 'JomoPak',
  legalName: 'SAVA ONLINE T/A JomoPak Pty Ltd',
  addressLine1: '52A 4th Street Brentwood Park',
  addressLine2: 'Benoni, Gauteng 1501',
  phone: '+27663049951',
  email: 'aman@jomopak.co.za',
  vatNumber: '4930295326',
  footerNote: '',
};

export interface PrintableDocumentMeta {
  /** Field/value pairs shown on the right of the header (e.g. INVOICE #, DATE). */
  label: string;
  value: string;
}

interface PrintableDocumentProps {
  /** Document type label, e.g. 'Invoice' or 'Delivery Note'. */
  documentTitle: string;
  /** Right-side header meta (number, date, etc.). */
  meta: PrintableDocumentMeta[];
  /** Block of address text shown under "BILL TO". */
  billTo: ReactNode;
  /** Optional second address column (e.g. SHIP TO). */
  shipTo?: ReactNode;
  /** Main document body — line items table, signatures, etc. */
  children: ReactNode;
  /** Optional override of the standard footer note. */
  footer?: ReactNode;
  /** Toolbar shown above the doc in the app (Print button, Close, etc). */
  toolbar?: ReactNode;
}

export function PrintableDocument({
  documentTitle,
  meta,
  billTo,
  shipTo,
  children,
  footer,
  toolbar,
}: PrintableDocumentProps) {
  return (
    <div className="printable-doc-wrap">
      {toolbar ? <div className="printable-doc-toolbar no-print">{toolbar}</div> : null}
      <article className="printable-doc">
        <header className="printable-doc-header">
          <div className="printable-doc-company">
            <strong>{JOMOPAK_COMPANY_DETAILS.name}</strong>
            <div>{JOMOPAK_COMPANY_DETAILS.addressLine1}</div>
            <div>{JOMOPAK_COMPANY_DETAILS.addressLine2}</div>
            <div>{JOMOPAK_COMPANY_DETAILS.phone}</div>
            <div>{JOMOPAK_COMPANY_DETAILS.email}</div>
            <div>VAT Registration No. {JOMOPAK_COMPANY_DETAILS.vatNumber}</div>
          </div>
          <div className="printable-doc-brand-mark" aria-hidden>
            <span className="brand-mark-bag">JomoPak</span>
            <span className="brand-mark-tag">PAPER BAGS</span>
          </div>
        </header>

        <h1 className="printable-doc-title">{documentTitle}</h1>

        <section className="printable-doc-meta-row">
          <div className="printable-doc-bill-to">
            <span className="printable-doc-label">BILL TO</span>
            <div className="printable-doc-bill-body">{billTo}</div>
          </div>
          {shipTo ? (
            <div className="printable-doc-bill-to">
              <span className="printable-doc-label">SHIP TO</span>
              <div className="printable-doc-bill-body">{shipTo}</div>
            </div>
          ) : null}
          <dl className="printable-doc-meta-list">
            {meta.map((item) => (
              <div className="printable-doc-meta-item" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="printable-doc-body">{children}</section>

        <footer className="printable-doc-footer">
          {footer ?? (
            <>
              <p>50% deposit to be made to secure your stock and balance of payment upon receipt of full order.</p>
              <p>Please send POP when payment is made.</p>
              <p>Limited Stock available.</p>
            </>
          )}
          <p className="printable-doc-footer-legal">{JOMOPAK_COMPANY_DETAILS.legalName}</p>
        </footer>
      </article>
    </div>
  );
}

interface PrintableLineTableProps<T> {
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center'; render: (row: T) => ReactNode }[];
  rows: T[];
  totalsFooter?: ReactNode;
  emptyMessage?: string;
}

export function PrintableLineTable<T>({
  columns,
  rows,
  totalsFooter,
  emptyMessage = 'No items.',
}: PrintableLineTableProps<T>) {
  if (!rows.length) {
    return <p className="muted">{emptyMessage}</p>;
  }
  return (
    <table className="printable-doc-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={`align-${col.align ?? 'left'}`}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((col) => (
              <td key={col.key} className={`align-${col.align ?? 'left'}`}>
                {col.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {totalsFooter ? <tfoot>{totalsFooter}</tfoot> : null}
    </table>
  );
}
