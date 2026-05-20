/**
 * Profitability analysis.
 *
 * Pulls revenue + cost per job. Revenue source preference order:
 *   1. linked Invoice.totalInclVat (when an invoice exists)
 *   2. linked Quote.totalQuote
 *   3. linked WorkTicket.sellingPriceTotal
 *
 * Cost source: linked WorkTicket.totalCost. Jobs without a work ticket
 * are flagged separately as "no cost data" — the dashboard can't compute
 * margin for them yet.
 *
 * The page rolls jobs up three ways: by client, by product, by month.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Invoice, JobCard, Product, QuoteEstimate, WorkTicket } from '../../types';
import { formatNumber, getMonthLabel } from '../../utils/calculations';

interface ProfitabilityPageProps {
  jobs: JobCard[];
  workTickets: WorkTicket[];
  invoices: Invoice[];
  quoteEstimates: QuoteEstimate[];
  products: Product[];
}

interface JobProfitability {
  job: JobCard;
  revenue: number;
  revenueSource: 'invoice' | 'quote' | 'workTicket' | 'none';
  cost: number;
  hasCost: boolean;
  margin: number;
  marginPercent: number;
  monthKey: string;
}

function findRevenueAndCost(
  job: JobCard,
  workTickets: WorkTicket[],
  invoices: Invoice[],
  quotes: QuoteEstimate[],
): { revenue: number; revenueSource: JobProfitability['revenueSource']; cost: number; hasCost: boolean } {
  // Cost: work-ticket linked by job number or job id.
  const ticket = workTickets.find((t) => t.linkedJobId === job.id || t.linkedJobNumber === job.jobNumber);
  const cost = ticket?.totalCost ?? 0;
  const hasCost = !!ticket && ticket.totalCost > 0;

  // Revenue: invoice (preferred) -> quote -> work ticket -> 0.
  const invoice = invoices.find((inv) => inv.jobId === job.id || inv.jobNumber === job.jobNumber);
  if (invoice && invoice.totalInclVat > 0) {
    return { revenue: invoice.totalInclVat, revenueSource: 'invoice', cost, hasCost };
  }
  const quote = job.quoteId ? quotes.find((q) => q.id === job.quoteId) : undefined;
  if (quote && quote.totalQuote > 0) {
    return { revenue: quote.totalQuote, revenueSource: 'quote', cost, hasCost };
  }
  if (ticket && ticket.sellingPriceTotal > 0) {
    return { revenue: ticket.sellingPriceTotal, revenueSource: 'workTicket', cost, hasCost };
  }
  return { revenue: 0, revenueSource: 'none', cost, hasCost };
}

export function ProfitabilityPage(props: ProfitabilityPageProps) {
  const { jobs, workTickets, invoices, quoteEstimates, products } = props;
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [costFilter, setCostFilter] = useState<'all' | 'priced' | 'unpriced'>('all');

  const rows = useMemo<JobProfitability[]>(() => jobs.map((job) => {
    const { revenue, revenueSource, cost, hasCost } = findRevenueAndCost(job, workTickets, invoices, quoteEstimates);
    const margin = revenue - cost;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
    const monthKey = (job.jobDate || job.createdAt || '').slice(0, 7);
    return { job, revenue, revenueSource, cost, hasCost, margin, marginPercent, monthKey };
  }), [jobs, workTickets, invoices, quoteEstimates]);

  const monthOptions = useMemo(() => {
    const keys = Array.from(new Set(rows.map((r) => r.monthKey).filter(Boolean))).sort().reverse();
    return keys;
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (clientFilter && r.job.clientId !== clientFilter) return false;
    if (productFilter && r.job.productId !== productFilter) return false;
    if (monthFilter && r.monthKey !== monthFilter) return false;
    if (costFilter === 'priced' && !r.hasCost) return false;
    if (costFilter === 'unpriced' && r.hasCost) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [r.job.jobNumber, r.job.customerName, r.job.productName].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [rows, clientFilter, productFilter, monthFilter, costFilter, search]);

  const totals = useMemo(() => {
    let revenue = 0, cost = 0, margin = 0, jobsPriced = 0, jobsUnpriced = 0;
    for (const r of filtered) {
      revenue += r.revenue;
      cost += r.cost;
      margin += r.margin;
      if (r.hasCost) jobsPriced += 1; else jobsUnpriced += 1;
    }
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
    return { revenue, cost, margin, marginPercent, jobsPriced, jobsUnpriced };
  }, [filtered]);

  function rollUp<K extends string>(getKey: (r: JobProfitability) => K, getLabel: (r: JobProfitability) => string) {
    const map = new Map<K, { label: string; revenue: number; cost: number; margin: number; jobs: number }>();
    for (const r of filtered) {
      const key = getKey(r);
      const existing = map.get(key) ?? { label: getLabel(r), revenue: 0, cost: 0, margin: 0, jobs: 0 };
      existing.revenue += r.revenue;
      existing.cost += r.cost;
      existing.margin += r.margin;
      existing.jobs += 1;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.margin - a.margin);
  }

  const byClient = useMemo(() => rollUp((r) => r.job.clientId || r.job.customerName, (r) => r.job.customerName || 'Unknown'), [filtered]);
  const byProduct = useMemo(() => rollUp((r) => r.job.productId || r.job.productName, (r) => r.job.productName || 'Unknown'), [filtered]);
  const byMonth = useMemo(() => rollUp((r) => r.monthKey || 'unknown', (r) => getMonthLabel(r.monthKey)), [filtered]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.job.clientId) map.set(r.job.clientId, r.job.customerName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.job.productId) map.set(r.job.productId, r.job.productName);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const overallMarginClass = totals.marginPercent < 10 ? 'food-safety-stat food-safety-stat-alert' : 'food-safety-stat';

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Profitability" subtitle={`${filtered.length} of ${rows.length} job(s) shown · revenue = invoice > quote > work-ticket`} />
        <div className="food-safety-stats">
          <div className="food-safety-stat"><span>Revenue</span><strong>R {formatNumber(totals.revenue, 2)}</strong></div>
          <div className="food-safety-stat"><span>Cost</span><strong>R {formatNumber(totals.cost, 2)}</strong></div>
          <div className={overallMarginClass}><span>Margin</span><strong>R {formatNumber(totals.margin, 2)}</strong></div>
          <div className={overallMarginClass}><span>Margin %</span><strong>{formatNumber(totals.marginPercent, 1)}%</strong></div>
          <div className={`food-safety-stat${totals.jobsUnpriced > 0 ? ' food-safety-stat-alert' : ''}`}><span>Jobs w/o cost data</span><strong>{totals.jobsUnpriced}</strong></div>
        </div>
        <div className="filters-grid">
          <label><span>Search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job, client, product" /></label>
          <label><span>Client</span>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label><span>Product</span>
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
              <option value="">All products</option>
              {productOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label><span>Month</span>
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="">All months</option>
              {monthOptions.map((m) => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
            </select>
          </label>
          <label><span>Cost data</span>
            <select value={costFilter} onChange={(e) => setCostFilter(e.target.value as 'all' | 'priced' | 'unpriced')}>
              <option value="all">All</option>
              <option value="priced">Has cost data</option>
              <option value="unpriced">Missing cost data</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No jobs in this filter" body="Adjust the filters above, or create work tickets against your jobs to populate cost data." />
        ) : (
          <>
            <SectionTitle title="By client" subtitle="Sorted by margin contribution" />
            <ProfitabilityRollupTable rows={byClient} unit="client" />
            <SectionTitle title="By product" subtitle="Which products earn the most" />
            <ProfitabilityRollupTable rows={byProduct} unit="product" />
            <SectionTitle title="By month" subtitle="Margin over time" />
            <ProfitabilityRollupTable rows={byMonth} unit="month" />

            <SectionTitle title="Per-job detail" subtitle="Worst-margin first" />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th className="align-right">Revenue</th>
                    <th>Source</th>
                    <th className="align-right">Cost</th>
                    <th className="align-right">Margin</th>
                    <th className="align-right">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => a.marginPercent - b.marginPercent).map((r) => (
                    <tr key={r.job.id}>
                      <td><strong>{r.job.jobNumber}</strong></td>
                      <td>{r.job.customerName}</td>
                      <td>{r.job.productName}</td>
                      <td className="align-right">R {formatNumber(r.revenue, 2)}</td>
                      <td><span className="muted">{r.revenueSource === 'invoice' ? 'Invoice' : r.revenueSource === 'quote' ? 'Quote' : r.revenueSource === 'workTicket' ? 'Work ticket' : '—'}</span></td>
                      <td className={`align-right${!r.hasCost ? ' cell-alert' : ''}`}>{r.hasCost ? `R ${formatNumber(r.cost, 2)}` : 'No work ticket'}</td>
                      <td className={`align-right${r.margin < 0 ? ' cell-alert' : ''}`}><strong>R {formatNumber(r.margin, 2)}</strong></td>
                      <td className={`align-right${r.marginPercent < 10 ? ' cell-alert' : ''}`}>{r.hasCost && r.revenue > 0 ? `${formatNumber(r.marginPercent, 1)}%` : '—'}</td>
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

interface RollupRow {
  label: string;
  revenue: number;
  cost: number;
  margin: number;
  jobs: number;
}

function ProfitabilityRollupTable({ rows, unit }: { rows: RollupRow[]; unit: string }) {
  if (rows.length === 0) return <p className="muted">No data for this {unit}.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{unit[0].toUpperCase() + unit.slice(1)}</th>
            <th className="align-right">Jobs</th>
            <th className="align-right">Revenue</th>
            <th className="align-right">Cost</th>
            <th className="align-right">Margin</th>
            <th className="align-right">Margin %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const marginPct = r.revenue > 0 ? (r.margin / r.revenue) * 100 : 0;
            return (
              <tr key={r.label}>
                <td><strong>{r.label}</strong></td>
                <td className="align-right">{r.jobs}</td>
                <td className="align-right">R {formatNumber(r.revenue, 2)}</td>
                <td className="align-right">R {formatNumber(r.cost, 2)}</td>
                <td className={`align-right${r.margin < 0 ? ' cell-alert' : ''}`}><strong>R {formatNumber(r.margin, 2)}</strong></td>
                <td className={`align-right${marginPct < 10 ? ' cell-alert' : ''}`}>{r.revenue > 0 ? `${formatNumber(marginPct, 1)}%` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
