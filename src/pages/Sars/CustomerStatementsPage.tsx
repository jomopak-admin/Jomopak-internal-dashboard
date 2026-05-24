/**
 * Customer Statements — Accounts Receivable (Phase 25.2)
 *
 * The debtor-side counterpart to Accounts Payable: pick a client and an "as at"
 * date and get a statement of account — every invoice with what's been paid and
 * what's still outstanding, aged into the usual buckets, with a printable layout
 * you can email to the customer to chase payment.
 *
 * Reporting only — it reads invoices already captured. It doesn't post anything.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { EmptyState } from '../../components/EmptyState';
import {
  AppSettingsCompany,
  Client,
  Invoice,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface CustomerStatementsPageProps {
  invoices: Invoice[];
  clients: Client[];
  company?: AppSettingsCompany;
  today: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00.000Z`).getTime();
  const b = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.floor((b - a) / DAY_MS);
}

interface StatementLine {
  invoice: Invoice;
  outstanding: number;
  daysOverdue: number;
}

export function CustomerStatementsPage({ invoices, clients, company, today }: CustomerStatementsPageProps) {
  const [clientId, setClientId] = useState<string>('');
  const [asAt, setAsAt] = useState<string>(today);
  const [showPaid, setShowPaid] = useState(false);

  // Clients that actually have invoices — keeps the picker tidy.
  const billableClients = useMemo(() => {
    const ids = new Set(invoices.map((i) => i.clientId));
    return clients
      .filter((c) => ids.has(c.id))
      .sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
  }, [clients, invoices]);

  // Outstanding-by-client overview (so the page also works as an AR list).
  const overview = useMemo(() => {
    const map = new Map<string, { client: Client | undefined; name: string; outstanding: number; count: number }>();
    for (const inv of invoices) {
      if (inv.status === 'Draft' || inv.status === 'Cancelled') continue;
      if (inv.invoiceDate && inv.invoiceDate > asAt) continue;
      const out = Number(inv.amountOutstanding) || 0;
      if (out <= 0) continue;
      const key = inv.clientId || inv.clientName || 'unknown';
      const row = map.get(key) || { client: clients.find((c) => c.id === inv.clientId), name: inv.clientName || 'Unknown', outstanding: 0, count: 0 };
      row.outstanding += out;
      row.count += 1;
      map.set(key, row);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [invoices, clients, asAt]);

  const client = clients.find((c) => c.id === clientId);

  const statement = useMemo(() => {
    if (!clientId) return null;
    const lines: StatementLine[] = invoices
      .filter((inv) => inv.clientId === clientId)
      .filter((inv) => inv.status !== 'Draft' && inv.status !== 'Cancelled')
      .filter((inv) => !inv.invoiceDate || inv.invoiceDate <= asAt)
      .filter((inv) => showPaid || (Number(inv.amountOutstanding) || 0) > 0)
      .map((inv) => {
        const outstanding = Number(inv.amountOutstanding) || 0;
        const daysOverdue = inv.dueDate ? daysBetween(inv.dueDate, asAt) : 0;
        return { invoice: inv, outstanding, daysOverdue };
      })
      .sort((a, b) => (a.invoice.invoiceDate || '').localeCompare(b.invoice.invoiceDate || ''));

    const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d120: 0 };
    let totalOutstanding = 0;
    for (const line of lines) {
      const out = line.outstanding;
      if (out <= 0) continue;
      totalOutstanding += out;
      const d = line.daysOverdue;
      if (d <= 0) buckets.current += out;
      else if (d <= 30) buckets.d30 += out;
      else if (d <= 60) buckets.d60 += out;
      else if (d <= 90) buckets.d90 += out;
      else buckets.d120 += out;
    }
    return { lines, buckets, totalOutstanding };
  }, [clientId, invoices, asAt, showPaid]);

  return (
    <div className="page-stack">
      <SectionTitle
        title="Customer Statements"
        subtitle="Statement of account per client — what they owe, aged, ready to print and send."
        action={statement ? <button className="primary-button no-print" onClick={() => window.print()}>Print statement</button> : undefined}
      />

      <section className="card accounting-toolbar no-print">
        <label><span>Client</span>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— select a client —</option>
            {billableClients.map((c) => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
          </select>
        </label>
        <label><span>As at</span><input type="date" value={asAt} onChange={(e) => setAsAt(e.target.value)} /></label>
        <label className="accounting-check"><input type="checkbox" checked={showPaid} onChange={(e) => setShowPaid(e.target.checked)} /><span>Include settled invoices</span></label>
      </section>

      {!clientId ? (
        // ── AR overview: who owes what ──────────────────────────────────────
        overview.length === 0 ? (
          <EmptyState title="Nothing outstanding" body="No client has an outstanding balance as at this date." />
        ) : (
          <section className="card no-print">
            <h3>Outstanding by client (as at {formatDate(asAt)})</h3>
            <table className="data-table">
              <thead><tr><th>Client</th><th style={{ textAlign: 'center' }}>Open invoices</th><th style={{ textAlign: 'right' }}>Outstanding</th><th></th></tr></thead>
              <tbody>
                {overview.map((row) => (
                  <tr key={row.key}>
                    <td><strong>{row.name}</strong></td>
                    <td style={{ textAlign: 'center' }}>{row.count}</td>
                    <td style={{ textAlign: 'right' }} className="amount-due">R {formatNumber(row.outstanding, 2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {row.client ? <button className="link-button" onClick={() => setClientId(row.client!.id)}>View statement</button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      ) : !statement ? null : (
        // ── Printable statement of account ──────────────────────────────────
        <article className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
          <header style={{ borderBottom: '0.5px solid var(--jp-line)', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22 }}>{company?.name || 'Jomopak'}</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--jp-ink-3, #64748b)', lineHeight: 1.5 }}>
                {company?.legalName}<br />
                {company?.addressLine1}{company?.addressLine2 ? <>, {company.addressLine2}</> : null}<br />
                {company?.phone}{company?.email ? ` · ${company.email}` : ''}<br />
                {company?.vatNumber ? `VAT: ${company.vatNumber}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0, fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Statement of Account</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>As at {formatDate(asAt)}</p>
            </div>
          </header>

          <section style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginBottom: 18 }}>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Statement to</p>
              <strong>{client?.companyName || client?.name}</strong><br />
              {client?.contactName ? <>{client.contactName}<br /></> : null}
              {client?.billingAddressLine1 ? <>{client.billingAddressLine1}<br /></> : null}
              {client?.billingAddressLine2 ? <>{client.billingAddressLine2}<br /></> : null}
              {[client?.billingCity, client?.billingState, client?.billingPostalCode].filter(Boolean).join(', ')}
              {client?.vatNumber ? <><br />VAT: {client.vatNumber}</> : null}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Total due</p>
              <strong style={{ fontSize: 24 }}>R {formatNumber(statement.totalOutstanding, 2)}</strong>
              {client?.paymentTerms ? <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Terms: {client.paymentTerms}</p> : null}
            </div>
          </section>

          {statement.lines.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No invoices to show for this client as at {formatDate(asAt)}.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 18 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--jp-line)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Invoice</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Due</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Total</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {statement.lines.map(({ invoice, outstanding, daysOverdue }) => (
                  <tr key={invoice.id} style={{ borderBottom: '0.5px solid var(--jp-line)' }}>
                    <td style={{ padding: '4px 8px' }}><strong>{invoice.invoiceNumber}</strong></td>
                    <td style={{ padding: '4px 8px' }}>{formatDate(invoice.invoiceDate)}</td>
                    <td style={{ padding: '4px 8px' }}>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '—'}
                      {outstanding > 0 && daysOverdue > 0 ? <span style={{ color: '#b22b2b' }}> · {daysOverdue}d</span> : null}
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatNumber(invoice.totalInclVat, 2)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatNumber(invoice.amountPaid, 2)}</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatNumber(outstanding, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Aging summary */}
          <section style={{ marginTop: 8 }}>
            <p style={{ margin: '0 0 6px', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Ageing</p>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--jp-line)' }}>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Current</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>1–30</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>31–60</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>61–90</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>90+</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatNumber(statement.buckets.current, 2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatNumber(statement.buckets.d30, 2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatNumber(statement.buckets.d60, 2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatNumber(statement.buckets.d90, 2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', color: statement.buckets.d120 > 0 ? '#b22b2b' : undefined }}>{formatNumber(statement.buckets.d120, 2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}><strong>{formatNumber(statement.totalOutstanding, 2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer style={{ marginTop: 24, paddingTop: 12, borderTop: '0.5px solid var(--jp-line)', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
            Please remit the total due and send proof of payment. Generated {new Date().toLocaleDateString('en-ZA')}.
          </footer>
        </article>
      )}
    </div>
  );
}
