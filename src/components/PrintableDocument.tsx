import { ReactNode } from 'react';
import { AppSettingsCompany, DEFAULT_APP_SETTINGS } from '../types';

/**
 * Shared printable document layout. Used by Invoice, Delivery Note, and
 * Production Spec to share JomoPak's letterhead, footer, and print styling.
 *
 * The component renders both inline (preview) and as a print-only wrapper
 * (`printable-doc` class) — see styles.css for the @media print rules that
 * hide the surrounding app chrome and force A4 sizing.
 *
 * Company details + footer lines are passed in via props so that the Settings
 * page can edit them once and have every doc reflect the change. The legacy
 * `JOMOPAK_COMPANY_DETAILS` constant is kept as a fallback for any caller that
 * hasn't been wired through yet.
 */

export const JOMOPAK_COMPANY_DETAILS: AppSettingsCompany = DEFAULT_APP_SETTINGS.company;

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
  /**
   * Optional override of the standard footer note. If omitted the component
   * uses `defaultFooterLines` (from Settings) and falls back to a baked-in
   * default if neither is provided.
   */
  footer?: ReactNode;
  /** Default footer copy from Settings → Templates, used when `footer` is omitted. */
  defaultFooterLines?: string[];
  /** Toolbar shown above the doc in the app (Print button, Close, etc). */
  toolbar?: ReactNode;
  /** Phase 34 — customer-facing note for this specific document. */
  customerNote?: string;
  /** Phase 34 — short "basic terms" blurb (from Settings). */
  termsAndConditions?: string;
  /** Phase 34 — one-line pointer to the full T&Cs online. */
  termsReferenceLine?: string;
  /**
   * Editable company details from Settings → Branding. Falls back to the
   * legacy hardcoded `JOMOPAK_COMPANY_DETAILS` so callers that haven't been
   * updated still render correctly.
   */
  company?: AppSettingsCompany;
}

export function PrintableDocument({
  documentTitle,
  meta,
  billTo,
  shipTo,
  children,
  footer,
  defaultFooterLines,
  toolbar,
  company,
  customerNote,
  termsAndConditions,
  termsReferenceLine,
}: PrintableDocumentProps) {
  const branded = company ?? JOMOPAK_COMPANY_DETAILS;
  return (
    <div className="printable-doc-wrap">
      {toolbar ? <div className="printable-doc-toolbar no-print">{toolbar}</div> : null}
      <article className="printable-doc">
        <header className="printable-doc-header">
          <div className="printable-doc-company">
            <strong>{branded.name}</strong>
            <div>{branded.addressLine1}</div>
            <div>{branded.addressLine2}</div>
            <div>{branded.phone}</div>
            <div>{branded.email}</div>
            <div>VAT Registration No. {branded.vatNumber}</div>
          </div>
          {branded.logoUrl ? (
            <div className="printable-doc-logo-wrap" aria-hidden>
              <img src={branded.logoUrl} alt={`${branded.name} logo`} className="printable-doc-logo" />
            </div>
          ) : (
            <div className="printable-doc-brand-mark" aria-hidden>
              <span className="brand-mark-bag">{branded.name || 'JomoPak'}</span>
              <span className="brand-mark-tag">PAPER BAGS</span>
            </div>
          )}
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

        {customerNote && customerNote.trim() ? (
          <section className="printable-doc-note">
            <span className="printable-doc-label">NOTE</span>
            {customerNote.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </section>
        ) : null}

        {(termsAndConditions && termsAndConditions.trim()) || (termsReferenceLine && termsReferenceLine.trim()) ? (
          <section className="printable-doc-terms">
            <span className="printable-doc-label">TERMS</span>
            {(termsAndConditions ?? '').split('\n').filter((line) => line.trim()).map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
            {termsReferenceLine && termsReferenceLine.trim() ? (
              <p className="printable-doc-terms-ref">{termsReferenceLine}</p>
            ) : null}
          </section>
        ) : null}

        <footer className="printable-doc-footer">
          {footer ?? (
            <>
              {(defaultFooterLines && defaultFooterLines.length > 0
                ? defaultFooterLines
                : [
                    '50% deposit to be made to secure your stock and balance of payment upon receipt of full order.',
                    'Please send POP when payment is made.',
                    'Limited Stock available.',
                  ]
              ).map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </>
          )}
          <p className="printable-doc-footer-legal">{branded.legalName}</p>
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
