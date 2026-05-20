/**
 * Sales Pipeline.
 *
 * Unified view across the sales funnel: every Lead, Quote, Job and
 * Invoice that's still in motion. Each opportunity is classified into
 * one of 9 stages (Enquiry → Quoted → Order Confirmed → Awaiting Artwork
 * → In Production → Ready for Dispatch → Delivered → Invoiced → Paid),
 * plus a Lost stage for dead leads. The funnel header shows count + Rand
 * value at each stage. The list below is filterable and groupable by
 * stage or client.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import {
  Client,
  Invoice,
  JobCard,
  Lead,
  QuoteEstimate,
  View,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface SalesPipelinePageProps {
  leads: Lead[];
  quotes: QuoteEstimate[];
  jobs: JobCard[];
  invoices: Invoice[];
  clients: Client[];
  onNavigate: (view: View) => void;
}

type PipelineStage =
  | 'Enquiry'
  | 'Quoted'
  | 'Order Confirmed'
  | 'Awaiting Artwork'
  | 'In Production'
  | 'Ready for Dispatch'
  | 'Delivered'
  | 'Invoiced'
  | 'Paid'
  | 'Lost';

const STAGE_ORDER: PipelineStage[] = [
  'Enquiry',
  'Quoted',
  'Order Confirmed',
  'Awaiting Artwork',
  'In Production',
  'Ready for Dispatch',
  'Delivered',
  'Invoiced',
  'Paid',
  'Lost',
];

interface PipelineOpportunity {
  /** Stable key — usually the originating Lead/Quote/Job id. */
  id: string;
  /** Display name shown in the table — usually the customer's reference. */
  ref: string;
  clientId: string;
  clientName: string;
  productName: string;
  stage: PipelineStage;
  /** Best-known forecast / actual revenue at the current stage. */
  value: number;
  /** When this opportunity was first seen (lead enquiry date or quote date). */
  openedAt: string;
  /** Most recent activity date — drives "stale" detection. */
  lastActivityAt: string;
  /** Days in current stage. */
  daysInStage: number;
  /** Linked record ids — used for the drill-in buttons. */
  leadId: string;
  quoteId: string;
  jobId: string;
  invoiceId: string;
}

/**
 * Build the unified opportunity list. Walks Lead → Quote → Job → Invoice.
 * The same underlying opportunity surfaces once at its most-advanced stage.
 */
function buildOpportunities(
  leads: Lead[],
  quotes: QuoteEstimate[],
  jobs: JobCard[],
  invoices: Invoice[],
): PipelineOpportunity[] {
  const opportunities: PipelineOpportunity[] = [];
  const seenLeadIds = new Set<string>();
  const seenQuoteIds = new Set<string>();
  const seenJobIds = new Set<string>();

  // Start from invoices (most-advanced). Each invoice represents an opportunity
  // that has at least reached invoicing.
  for (const inv of invoices) {
    const job = jobs.find((j) => j.id === inv.jobId);
    const quote = job?.quoteId ? quotes.find((q) => q.id === job.quoteId) : (inv.quoteId ? quotes.find((q) => q.id === inv.quoteId) : undefined);
    const lead = quote?.linkedLeadId ? leads.find((l) => l.id === quote.linkedLeadId) : undefined;
    if (lead) seenLeadIds.add(lead.id);
    if (quote) seenQuoteIds.add(quote.id);
    if (job) seenJobIds.add(job.id);

    const fullyPaid = inv.amountOutstanding <= 0 && inv.amountPaid > 0;
    const stage: PipelineStage = fullyPaid ? 'Paid' : 'Invoiced';
    opportunities.push({
      id: inv.id,
      ref: inv.invoiceNumber,
      clientId: inv.clientId,
      clientName: inv.clientName,
      productName: job?.productName || lead?.companyName || '',
      stage,
      value: inv.totalInclVat,
      openedAt: lead?.enquiryDate || quote?.quoteDate || inv.invoiceDate,
      lastActivityAt: inv.invoiceDate,
      daysInStage: daysSince(inv.invoiceDate),
      leadId: lead?.id ?? '',
      quoteId: quote?.id ?? '',
      jobId: job?.id ?? '',
      invoiceId: inv.id,
    });
  }

  // Jobs that don't yet have an invoice.
  for (const job of jobs) {
    if (seenJobIds.has(job.id)) continue;
    const quote = job.quoteId ? quotes.find((q) => q.id === job.quoteId) : undefined;
    const lead = quote?.linkedLeadId ? leads.find((l) => l.id === quote.linkedLeadId) : undefined;
    if (lead) seenLeadIds.add(lead.id);
    if (quote) seenQuoteIds.add(quote.id);

    const stage = jobStatusToStage(job.status);
    const lastActivity = job.readyForDispatchDate
      || job.productionStartDate
      || job.factoryReleaseDate
      || job.finalApprovalReceivedDate
      || job.proofSharedDate
      || job.artworkAssignedDate
      || job.jobDate;
    opportunities.push({
      id: job.id,
      ref: job.jobNumber,
      clientId: job.clientId,
      clientName: job.customerName,
      productName: job.productName,
      stage,
      value: job.orderValue || quote?.totalQuote || 0,
      openedAt: lead?.enquiryDate || quote?.quoteDate || job.jobDate,
      lastActivityAt: lastActivity,
      daysInStage: daysSince(lastActivity),
      leadId: lead?.id ?? '',
      quoteId: quote?.id ?? '',
      jobId: job.id,
      invoiceId: '',
    });
  }

  // Quotes without a job yet.
  for (const q of quotes) {
    if (seenQuoteIds.has(q.id)) continue;
    const lead = q.linkedLeadId ? leads.find((l) => l.id === q.linkedLeadId) : undefined;
    if (lead) seenLeadIds.add(lead.id);

    const stage: PipelineStage = q.status === 'Lost'
      ? 'Lost'
      : q.status === 'Converted to Job'
        ? 'Order Confirmed'  // We have a quote labelled converted but no job yet — flagged anomaly.
        : 'Quoted';
    opportunities.push({
      id: q.id,
      ref: q.quoteNumber,
      clientId: q.clientId,
      clientName: q.clientName,
      productName: q.productName,
      stage,
      value: q.totalQuote,
      openedAt: lead?.enquiryDate || q.quoteDate,
      lastActivityAt: q.quoteDate,
      daysInStage: daysSince(q.quoteDate),
      leadId: lead?.id ?? '',
      quoteId: q.id,
      jobId: '',
      invoiceId: '',
    });
  }

  // Leads without a quote yet.
  for (const lead of leads) {
    if (seenLeadIds.has(lead.id)) continue;
    const stage: PipelineStage = lead.status === 'Lost' ? 'Lost' : 'Enquiry';
    opportunities.push({
      id: lead.id,
      ref: lead.leadNumber,
      clientId: lead.clientId,
      clientName: lead.companyName,
      productName: lead.contactName,
      stage,
      value: 0,
      openedAt: lead.enquiryDate,
      lastActivityAt: lead.enquiryDate,
      daysInStage: daysSince(lead.enquiryDate),
      leadId: lead.id,
      quoteId: lead.linkedQuoteId || '',
      jobId: '',
      invoiceId: '',
    });
  }

  return opportunities;
}

function daysSince(iso: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

function jobStatusToStage(status: JobCard['status']): PipelineStage {
  switch (status) {
    case 'Draft': return 'Order Confirmed';
    case 'Awaiting Artwork':
    case 'Awaiting Proof Approval':
      return 'Awaiting Artwork';
    case 'Ready for Production':
    case 'In Production':
      return 'In Production';
    case 'Quality Check':
    case 'Ready for Dispatch':
      return 'Ready for Dispatch';
    case 'In Storage':
    case 'Partially Dispatched':
      return 'Delivered';
    case 'Completed':
      return 'Delivered';
    default:
      return 'Order Confirmed';
  }
}

function stageColor(stage: PipelineStage): string {
  if (stage === 'Lost') return 'food-safety-stat food-safety-stat-alert';
  if (stage === 'Paid') return 'food-safety-stat';
  return 'food-safety-stat';
}

export function SalesPipelinePage(props: SalesPipelinePageProps) {
  const { leads, quotes, jobs, invoices, clients, onNavigate } = props;
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');
  const [clientFilter, setClientFilter] = useState('');
  const [hideLost, setHideLost] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'client'>('none');

  const opportunities = useMemo(
    () => buildOpportunities(leads, quotes, jobs, invoices),
    [leads, quotes, jobs, invoices],
  );

  const filtered = useMemo(() => opportunities.filter((o) => {
    if (hideLost && o.stage === 'Lost') return false;
    if (stageFilter !== 'all' && o.stage !== stageFilter) return false;
    if (clientFilter && o.clientId !== clientFilter) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [o.ref, o.clientName, o.productName].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [opportunities, hideLost, stageFilter, clientFilter, search]);

  const stageTotals = useMemo(() => {
    const acc: Record<PipelineStage, { count: number; value: number }> = {
      'Enquiry': { count: 0, value: 0 }, 'Quoted': { count: 0, value: 0 },
      'Order Confirmed': { count: 0, value: 0 }, 'Awaiting Artwork': { count: 0, value: 0 },
      'In Production': { count: 0, value: 0 }, 'Ready for Dispatch': { count: 0, value: 0 },
      'Delivered': { count: 0, value: 0 }, 'Invoiced': { count: 0, value: 0 },
      'Paid': { count: 0, value: 0 }, 'Lost': { count: 0, value: 0 },
    };
    for (const o of opportunities) {
      acc[o.stage].count += 1;
      acc[o.stage].value += o.value;
    }
    return acc;
  }, [opportunities]);

  // Group by client.
  const grouped = useMemo(() => {
    if (groupBy !== 'client') return null;
    const map = new Map<string, { clientId: string; clientName: string; opps: PipelineOpportunity[]; totalValue: number }>();
    for (const o of filtered) {
      const key = o.clientId || o.clientName || 'unknown';
      const existing = map.get(key) ?? { clientId: o.clientId, clientName: o.clientName || 'Unknown', opps: [], totalValue: 0 };
      existing.opps.push(o);
      existing.totalValue += o.value;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filtered, groupBy]);

  function navigateForOpportunity(o: PipelineOpportunity) {
    // Take the user to the most-relevant view based on stage.
    if (o.invoiceId) onNavigate('invoices');
    else if (o.jobId) onNavigate('jobs');
    else if (o.quoteId) onNavigate('quotes');
    else if (o.leadId) onNavigate('leads');
  }

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Sales Pipeline" subtitle={`${opportunities.length} opportunity(ies) tracked across the funnel`} />

        <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '12px 0 8px' }}>Funnel</h3>
        <div className="food-safety-stats">
          {STAGE_ORDER.map((stage) => {
            const t = stageTotals[stage];
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                className={`${stageColor(stage)}${stageFilter === stage ? ' food-safety-stat-alert' : ''}`}
                style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                <span>{stage}</span>
                <strong>{t.count}</strong>
                <div className="table-subtext" style={{ marginTop: 2 }}>R {formatNumber(t.value, 0)}</div>
              </button>
            );
          })}
        </div>

        <div className="filters-grid">
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Reference, client, product" /></label>
          <label><span>Stage</span>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as PipelineStage | 'all')}>
              <option value="all">All stages</option>
              {STAGE_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label><span>Client</span>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label><span>Group by</span>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as 'none' | 'client')}>
              <option value="none">No grouping</option>
              <option value="client">Group by client</option>
            </select>
          </label>
          <label className="checkbox-row"><input type="checkbox" checked={hideLost} onChange={(e) => setHideLost(e.target.checked)} />Hide Lost</label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No opportunities match" body="Adjust the filters above, or start logging leads / quotes to populate the pipeline." />
        ) : groupBy === 'client' && grouped ? (
          <>
            <SectionTitle title="By client" subtitle="Highest-value first" />
            {grouped.map((g) => (
              <section key={g.clientId || g.clientName} style={{ marginTop: 16, padding: '12px 0', borderTop: '0.5px solid var(--jp-line, #e0d9c8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <strong>{g.clientName}</strong>
                  <span style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{g.opps.length} opp · R {formatNumber(g.totalValue, 2)}</span>
                </div>
                <OpportunityTable opps={g.opps} onOpen={navigateForOpportunity} />
              </section>
            ))}
          </>
        ) : (
          <OpportunityTable opps={filtered} onOpen={navigateForOpportunity} />
        )}
      </section>
    </>
  );
}

function OpportunityTable({ opps, onOpen }: { opps: PipelineOpportunity[]; onOpen: (o: PipelineOpportunity) => void }) {
  const sorted = useMemo(() => [...opps].sort((a, b) => {
    // Sort by stage order first, then by days-in-stage descending.
    const sa = STAGE_ORDER.indexOf(a.stage);
    const sb = STAGE_ORDER.indexOf(b.stage);
    if (sa !== sb) return sa - sb;
    return b.daysInStage - a.daysInStage;
  }), [opps]);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Client</th>
            <th>Product</th>
            <th>Stage</th>
            <th className="align-right">Value</th>
            <th>Opened</th>
            <th>Last activity</th>
            <th>Days in stage</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => {
            const stale = o.stage !== 'Paid' && o.stage !== 'Lost' && o.daysInStage > 14;
            return (
              <tr key={`${o.id}-${o.stage}`}>
                <td><strong>{o.ref}</strong></td>
                <td>{o.clientName}</td>
                <td>{o.productName || '—'}</td>
                <td><span className={`badge ${o.stage === 'Lost' ? 'badge-danger' : o.stage === 'Paid' ? 'badge-success' : o.stage === 'In Production' || o.stage === 'Ready for Dispatch' ? 'badge-warning' : ''}`}>{o.stage}</span></td>
                <td className="align-right">{o.value > 0 ? `R ${formatNumber(o.value, 2)}` : '—'}</td>
                <td>{o.openedAt ? formatDate(o.openedAt) : '—'}</td>
                <td>{o.lastActivityAt ? formatDate(o.lastActivityAt) : '—'}</td>
                <td className={stale ? 'cell-alert' : undefined}>{o.daysInStage}d{stale ? <div className="table-subtext">Stale</div> : null}</td>
                <td><button className="table-button" onClick={() => onOpen(o)}>Open</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
