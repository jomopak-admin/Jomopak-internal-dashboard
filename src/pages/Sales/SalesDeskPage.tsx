import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { StatCard } from '../../components/StatCard';
import { JobCard, QuoteEstimate, UserProfile } from '../../types';
import { formatDate, formatNumber, getMonthLabel, getMonthKey, matchesText } from '../../utils/calculations';

interface SalesDeskPageProps {
  profile: UserProfile | null;
  monthOptions: string[];
  quotes: QuoteEstimate[];
  jobs: JobCard[];
  onOpenQuote: (quote: QuoteEstimate) => void;
  onOpenJob: (job: JobCard) => void;
  onOpenQuotesRegister: () => void;
  onOpenJobsRegister: () => void;
}

const COMMISSION_STORAGE_KEY = 'jomopak-sales-commission-rate';

export function SalesDeskPage({
  profile,
  monthOptions,
  quotes,
  jobs,
  onOpenQuote,
  onOpenJob,
  onOpenQuotesRegister,
  onOpenJobsRegister,
}: SalesDeskPageProps) {
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');
  const [commissionRate, setCommissionRate] = useState('5');

  useEffect(() => {
    const stored = window.localStorage.getItem(COMMISSION_STORAGE_KEY);
    if (stored) {
      setCommissionRate(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COMMISSION_STORAGE_KEY, commissionRate);
  }, [commissionRate]);

  const salesperson = profile?.fullName || profile?.email || 'Sales';
  const commissionPercent = Number(commissionRate) || 0;

  const visibleQuotes = useMemo(() => quotes.filter((quote) => {
    const matchesSearchTerm = !search || [quote.quoteNumber, quote.clientName, quote.productName, quote.notes].some((value) => matchesText(value, search));
    const matchesMonth = !month || getMonthKey(quote.quoteDate) === month;
    return matchesSearchTerm && matchesMonth;
  }), [month, quotes, search]);

  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const matchesSearchTerm = !search || [job.jobNumber, job.customerName, job.productName, job.customerReference, job.notes].some((value) => matchesText(value, search));
    const matchesMonth = !month || getMonthKey(job.jobDate) === month;
    return matchesSearchTerm && matchesMonth;
  }), [jobs, month, search]);

  const quoteRequests = visibleQuotes.filter((quote) => quote.status === 'Draft' || quote.status === 'Quoted' || quote.status === 'Approved');
  const convertedQuotes = visibleQuotes.filter((quote) => quote.status === 'Converted to Job');
  const lostQuotes = visibleQuotes.filter((quote) => quote.status === 'Lost');
  const activeOrders = visibleJobs.filter((job) => job.status !== 'Completed');
  const completedOrders = visibleJobs.filter((job) => job.status === 'Completed');

  const openQuoteValue = quoteRequests.reduce((sum, quote) => sum + quote.totalQuote, 0);
  const securedOrderValue = convertedQuotes.reduce((sum, quote) => sum + quote.totalQuote, 0);
  const openCommission = openQuoteValue * (commissionPercent / 100);
  const securedCommission = securedOrderValue * (commissionPercent / 100);

  return (
    <>
      <SectionTitle
        title="Sales Desk"
        subtitle={`${salesperson} can manage quote requests, customer orders, and commission tracking from one place.`}
        action={
          <div className="topbar-actions">
            <button className="secondary-button" onClick={onOpenQuotesRegister}>Open Quotes</button>
            <button className="ghost-button" onClick={onOpenJobsRegister}>Open Orders</button>
          </div>
        }
      />

      <section className="sales-toolbar">
        <label>
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, quote, order..." />
        </label>
        <label>
          <span>Month</span>
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">All months</option>
            {monthOptions.map((option) => <option key={option} value={option}>{getMonthLabel(option)}</option>)}
          </select>
        </label>
        <label>
          <span>Commission %</span>
          <input type="number" min="0" step="0.1" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} />
        </label>
      </section>

      <section className="stats-grid">
        <StatCard label="Open quote requests" value={String(quoteRequests.length)} helper={`${formatNumber(openQuoteValue, 2)} total quoted`} />
        <StatCard label="Converted orders" value={String(convertedQuotes.length)} helper={`${formatNumber(securedOrderValue, 2)} secured value`} />
        <StatCard label="Active customer orders" value={String(activeOrders.length)} helper={`${completedOrders.length} completed in current view`} />
        <StatCard label="Estimated commission" value={formatNumber(securedCommission, 2)} helper={`${formatNumber(openCommission, 2)} still in pipeline`} />
      </section>

      <div className="sales-grid">
        <section className="card">
          <SectionTitle title="Quote pipeline" subtitle={`${quoteRequests.length} open · ${lostQuotes.length} lost`} />
          {quoteRequests.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Quote</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Commission</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteRequests
                    .sort((left, right) => right.quoteDate.localeCompare(left.quoteDate))
                    .slice(0, 12)
                    .map((quote) => (
                      <tr key={quote.id}>
                        <td>
                          <strong>{quote.quoteNumber}</strong>
                          <div className="table-subtext">{formatDate(quote.quoteDate)}</div>
                        </td>
                        <td>{quote.clientName || 'No client'}</td>
                        <td>{quote.status}</td>
                        <td>{formatNumber(quote.totalQuote, 2)}</td>
                        <td>{formatNumber(quote.totalQuote * (commissionPercent / 100), 2)}</td>
                        <td><button className="table-button" onClick={() => onOpenQuote(quote)}>Manage</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No quote requests" body="No quotes match the current sales filters." />}
        </section>

        <section className="card">
          <SectionTitle title="Orders to manage" subtitle={`${activeOrders.length} active orders`} />
          {visibleJobs.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Qty</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs
                    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
                    .slice(0, 12)
                    .map((job) => (
                      <tr key={job.id}>
                        <td>
                          <strong>{job.jobNumber}</strong>
                          <div className="table-subtext">{job.productName || 'No product'}</div>
                        </td>
                        <td>{job.customerName || 'No customer'}</td>
                        <td>{job.dueDate ? formatDate(job.dueDate) : 'No due date'}</td>
                        <td>{job.status}</td>
                        <td>{formatNumber(job.quantityPlanned)}</td>
                        <td><button className="table-button" onClick={() => onOpenJob(job)}>Manage</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No orders found" body="No customer orders match the current sales filters." />}
        </section>
      </div>
    </>
  );
}
