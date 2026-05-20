/**
 * Aged Debtors / Accounts Receivable.
 *
 * One row per outstanding invoice (amountOutstanding > 0 and status !=
 * Cancelled / Draft / Paid). Aged into 5 buckets: Current (not yet due),
 * 1-30 days overdue, 31-60, 61-90, 90+. Rolled up per client with
 * top-of-page totals.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Client, Invoice } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface AgedDebtorsPageProps {
  invoices: Invoice[];
  clients: Client[];
  onOpenInvoice?: (invoiceId: string) => void;
}

type AgeBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

const BUCKET_LABELS: Record<AgeBucket, string> = {
  current: 'Current',
  '1-30': '1–30 days',
  '31-60': '31–60 days',
  '61-90': '61–90 days',
  '90+': '90+ days',
};

const DAY_MS = 1000 * 60 * 60 * 24;

function daysOverdue(dueDate: string): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return 0;
  const diff = Date.now() - due;
  return Math.floor(diff / DAY_MS);
}

function bucketFor(days: number): AgeBucket {
  if (days <= 0) return 'current';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

export function AgedDebtorsPage({ invoices, clients, onOpenInvoice }: AgedDebtorsPageProps) {
  const [clientFilter, setClientFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState<AgeBucket | 'all'>('all');
  const [search, setSearch] = useState('');

  // Outstanding = anything with amount > 0 that isn't fully paid / cancelled / draft.
  const outstandingInvoices = useMemo(
    () => invoices.filter((inv) =>
      inv.amountOutstanding > 0
      && inv.status !== 'Cancelled'
      && inv.status !== 'Draft'
      && inv.status !== 'Paid',
    ),
    [invoices],
  );

  const enriched = useMemo(
    () => outstandingInvoices.map((inv) => {
      const days = daysOverdue(inv.dueDate);
      return { invoice: inv, days, bucket: bucketFor(days) };
    }),
    [outstandingInvoices],
  );

  const filtered = useMemo(() => enriched.filter((row) => {
    if (clientFilter && row.invoice.clientId !== clientFilter) return false;
    if (bucketFilter !== 'all' && row.bucket !== bucketFilter) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [row.invoice.invoiceNumber, row.invoice.clientName, row.invoice.customerReference].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [enriched, clientFilter, bucketFilter, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.days - a.days), [filtered]);

  // Bucket totals across all (unfiltered) outstanding — these are the headline numbers.
  const bucketTotals = useMemo(() => {
    const acc: Record<AgeBucket, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    for (const { invoice, bucket } of enriched) {
      acc[bucket] += invoice.amountOutstanding;
    }
    return acc;
  }, [enriched]);

  const grandTotal = useMemo(
    () => enriched.reduce((sum, r) => sum + r.invoice.amountOutstanding, 0),
    [enriched],
  );

  // Per-client roll-up table (top debtors first).
  const byClient = useMemo(() => {
    const map = new Map<string, { clientId: string; clientName: string; totals: Record<AgeBucket, number>; grandTotal: number; client?: Client }>();
    for (const { invoice, bucket } of enriched) {
      const id = invoice.clientId || invoice.clientName || 'unknown';
      const existing = map.get(id) ?? {
        clientId: invoice.clientId,
        clientName: invoice.clientName || 'Unknown',
        totals: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
        grandTotal: 0,
        client: clients.find((c) => c.id === invoice.clientId),
      };
      existing.totals[bucket] += invoice.amountOutstanding;
      existing.grandTotal += invoice.amountOutstanding;
      map.set(id, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  }, [enriched, clients]);

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Aged Debtors" subtitle={`${enriched.length} outstanding invoice(s) · R ${formatNumber(grandTotal, 2)} total owed`} />
        <div className="food-safety-stats">
          {(Object.keys(BUCKET_LABELS) as AgeBucket[]).map((b) => (
            <div key={b} className={`food-safety-stat${b === '61-90' || b === '90+' ? (bucketTotals[b] > 0 ? ' food-safety-stat-alert' : '') : ''}`}>
              <span>{BUCKET_LABELS[b]}</span>
              <strong>R {formatNumber(bucketTotals[b], 2)}</strong>
            </div>
          ))}
        </div>
        <div className="filters-grid">
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Invoice #, client, PO" /></label>
          <label><span>Client</span>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label><span>Age bucket</span>
            <select value={bucketFilter} onChange={(e) => setBucketFilter(e.target.value as AgeBucket | 'all')}>
              <option value="all">All</option>
              {(Object.keys(BUCKET_LABELS) as AgeBucket[]).map((b) => <option key={b} value={b}>{BUCKET_LABELS[b]}</option>)}
            </select>
          </label>
        </div>

        {byClient.length === 0 ? (
          <EmptyState title="No outstanding debtors" body="Every issued invoice is either fully paid or not yet sent. Nothing to chase." />
        ) : (
          <>
            <SectionTitle title="By client" subtitle="Top debtors first" />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th className="align-right">Current</th>
                    <th className="align-right">1–30</th>
                    <th className="align-right">31–60</th>
                    <th className="align-right">61–90</th>
                    <th className="align-right">90+</th>
                    <th className="align-right">Total owed</th>
                    <th>Credit / paid</th>
                  </tr>
                </thead>
                <tbody>
                  {byClient.map((row) => {
                    const overCredit = row.client && row.client.creditLimit > 0 && row.grandTotal > row.client.creditLimit;
                    return (
                      <tr key={row.clientId || row.clientName}>
                        <td><strong>{row.clientName}</strong>{row.client?.paymentTerms ? <div className="table-subtext">{row.client.paymentTerms}</div> : null}</td>
                        <td className="align-right">{row.totals.current > 0 ? `R ${formatNumber(row.totals.current, 2)}` : '—'}</td>
                        <td className="align-right">{row.totals['1-30'] > 0 ? `R ${formatNumber(row.totals['1-30'], 2)}` : '—'}</td>
                        <td className="align-right">{row.totals['31-60'] > 0 ? `R ${formatNumber(row.totals['31-60'], 2)}` : '—'}</td>
                        <td className={`align-right${row.totals['61-90'] > 0 ? ' cell-alert' : ''}`}>{row.totals['61-90'] > 0 ? `R ${formatNumber(row.totals['61-90'], 2)}` : '—'}</td>
                        <td className={`align-right${row.totals['90+'] > 0 ? ' cell-alert' : ''}`}>{row.totals['90+'] > 0 ? `R ${formatNumber(row.totals['90+'], 2)}` : '—'}</td>
                        <td className={`align-right${overCredit ? ' cell-alert' : ''}`}><strong>R {formatNumber(row.grandTotal, 2)}</strong>{overCredit ? <div className="table-subtext">Over credit limit</div> : null}</td>
                        <td>{row.client ? `Limit R ${formatNumber(row.client.creditLimit, 0)}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <SectionTitle title="By invoice" subtitle="Oldest overdue first" />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Due</th>
                    <th className="align-right">Days overdue</th>
                    <th className="align-right">Total</th>
                    <th className="align-right">Paid</th>
                    <th className="align-right">Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr key={row.invoice.id}>
                      <td><strong>{row.invoice.invoiceNumber}</strong>{row.invoice.customerReference ? <div className="table-subtext">Ref: {row.invoice.customerReference}</div> : null}</td>
                      <td>{row.invoice.clientName}</td>
                      <td>{formatDate(row.invoice.invoiceDate)}</td>
                      <td>{row.invoice.dueDate ? formatDate(row.invoice.dueDate) : '—'}</td>
                      <td className={`align-right${row.days > 30 ? ' cell-alert' : ''}`}>{row.days > 0 ? row.days : 'Not yet'}</td>
                      <td className="align-right">R {formatNumber(row.invoice.totalInclVat, 2)}</td>
                      <td className="align-right">R {formatNumber(row.invoice.amountPaid, 2)}</td>
                      <td className="align-right"><strong>R {formatNumber(row.invoice.amountOutstanding, 2)}</strong></td>
                      <td>{row.invoice.status}</td>
                      <td>{onOpenInvoice ? <button className="table-button" onClick={() => onOpenInvoice(row.invoice.id)}>Open</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
