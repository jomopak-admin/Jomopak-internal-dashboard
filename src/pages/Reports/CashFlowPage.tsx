/**
 * Cash Flow Forecast.
 *
 * 12-week rolling projection. Three bucket views: weekly / 30-60-90 day.
 * Inputs: outstanding invoices × payment terms (expected payment date),
 * scheduled jobs as future revenue (when invoiced), optional fixed-cost
 * line items if captured in settings. Running balance shows projected
 * cash position at each bucket.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { Invoice, JobCard } from '../../types';
import { formatNumber } from '../../utils/calculations';

interface CashFlowPageProps {
  invoices: Invoice[];
  jobs: JobCard[];
  /** Starting cash position (manual entry). */
  startingCash?: number;
}

const DAY_MS = 1000 * 60 * 60 * 24;

interface CashFlowBucket {
  label: string;
  dayStart: number;
  dayEnd: number;
  inflows: number;
  outflows: number;
  /** Net for this bucket. */
  net: number;
  /** Running balance through this bucket. */
  runningBalance: number;
  inflowDetail: Array<{ ref: string; client: string; amount: number; expectedDate: string }>;
  outflowDetail: Array<{ ref: string; client: string; amount: number; expectedDate: string }>;
}

function daysFromNow(dateStr: string): number {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return 9999;
  return Math.floor((t - Date.now()) / DAY_MS);
}

/** Expected payment days from invoice date based on terms type string. */
function termsDays(termsType: string): number {
  if (termsType.includes('Net 7')) return 7;
  if (termsType.includes('Net 14')) return 14;
  if (termsType.includes('Net 30')) return 30;
  if (termsType.includes('Net 60')) return 60;
  if (termsType.includes('On Delivery')) return 0;
  if (termsType.includes('Full Payment')) return 0;
  if (termsType.includes('Deposit')) return 0;
  return 30;
}

export function CashFlowPage({ invoices, jobs, startingCash: initialCash = 0 }: CashFlowPageProps) {
  const [startingCash, setStartingCash] = useState(String(initialCash));
  const [bucketMode, setBucketMode] = useState<'30-60-90' | 'weekly'>('30-60-90');

  /** Expected inflows: outstanding invoices × terms → expected payment date. */
  const expectedInflows = useMemo(() => {
    return invoices
      .filter((inv) => inv.amountOutstanding > 0 && inv.status !== 'Cancelled' && inv.status !== 'Draft')
      .map((inv) => {
        const issued = new Date(inv.invoiceDate).getTime();
        const expectedDate = inv.dueDate
          ? inv.dueDate
          : new Date(issued + termsDays(inv.termsType) * DAY_MS).toISOString().slice(0, 10);
        return {
          ref: inv.invoiceNumber,
          client: inv.clientName,
          amount: inv.amountOutstanding,
          expectedDate,
          daysAway: daysFromNow(expectedDate),
        };
      })
      .sort((a, b) => a.daysAway - b.daysAway);
  }, [invoices]);

  /** Future revenue from un-invoiced jobs — projected at job due-date. */
  const projectedRevenue = useMemo(() => {
    return jobs
      .filter((j) => j.status !== 'Completed' && j.status !== 'Cancelled' as JobCard['status'] && j.orderValue > 0 && !j.invoiceNumber)
      .map((j) => ({
        ref: j.jobNumber,
        client: j.customerName,
        amount: j.orderValue,
        expectedDate: j.dueDate || j.jobDate,
        daysAway: daysFromNow(j.dueDate || j.jobDate),
      }))
      .filter((r) => r.daysAway >= 0 && r.daysAway < 90)
      .sort((a, b) => a.daysAway - b.daysAway);
  }, [jobs]);

  const buckets = useMemo<CashFlowBucket[]>(() => {
    const allInflows = [...expectedInflows, ...projectedRevenue];
    const definitions = bucketMode === 'weekly'
      ? Array.from({ length: 12 }, (_, i) => ({ label: `Week ${i + 1}`, dayStart: i * 7, dayEnd: (i + 1) * 7 }))
      : [
          { label: 'Overdue', dayStart: -9999, dayEnd: 0 },
          { label: '0–30 days', dayStart: 0, dayEnd: 30 },
          { label: '31–60 days', dayStart: 30, dayEnd: 60 },
          { label: '61–90 days', dayStart: 60, dayEnd: 90 },
        ];
    let running = Number(startingCash || 0);
    return definitions.map((b) => {
      const inflowItems = allInflows.filter((i) => i.daysAway >= b.dayStart && i.daysAway < b.dayEnd);
      const inflows = inflowItems.reduce((acc, i) => acc + i.amount, 0);
      const outflowItems: typeof inflowItems = []; // No outflows captured yet (would need fixed-cost register).
      const outflows = 0;
      const net = inflows - outflows;
      running += net;
      return {
        label: b.label,
        dayStart: b.dayStart,
        dayEnd: b.dayEnd,
        inflows,
        outflows,
        net,
        runningBalance: running,
        inflowDetail: inflowItems.map((i) => ({ ref: i.ref, client: i.client, amount: i.amount, expectedDate: i.expectedDate })),
        outflowDetail: outflowItems,
      };
    });
  }, [expectedInflows, projectedRevenue, bucketMode, startingCash]);

  const overallNet = buckets.reduce((acc, b) => acc + b.net, 0);
  const endingBalance = buckets.length > 0 ? buckets[buckets.length - 1].runningBalance : Number(startingCash || 0);

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Cash Flow Forecast" subtitle="Projected cash position based on outstanding invoices + scheduled jobs." />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <label>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', marginRight: 6 }}>Starting cash (R)</span>
            <input type="number" min="0" step="0.01" value={startingCash} onChange={(e) => setStartingCash(e.target.value)} style={{ width: 160 }} />
          </label>
          <label>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', marginRight: 6 }}>View</span>
            <select value={bucketMode} onChange={(e) => setBucketMode(e.target.value as '30-60-90' | 'weekly')}>
              <option value="30-60-90">30 / 60 / 90 day</option>
              <option value="weekly">12-week rolling</option>
            </select>
          </label>
        </div>

        <div className="food-safety-stats">
          <div className="food-safety-stat"><span>Outstanding invoices</span><strong>R {formatNumber(expectedInflows.reduce((acc, i) => acc + i.amount, 0), 2)}</strong></div>
          <div className="food-safety-stat"><span>Projected revenue (uninvoiced jobs)</span><strong>R {formatNumber(projectedRevenue.reduce((acc, i) => acc + i.amount, 0), 2)}</strong></div>
          <div className="food-safety-stat"><span>Net forecast (this horizon)</span><strong>R {formatNumber(overallNet, 2)}</strong></div>
          <div className={`food-safety-stat${endingBalance < 0 ? ' food-safety-stat-alert' : ''}`}><span>Projected ending balance</span><strong>R {formatNumber(endingBalance, 2)}</strong></div>
        </div>

        {buckets.length === 0 ? (
          <EmptyState title="No projection data" body="Add outstanding invoices or scheduled jobs to populate the forecast." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bucket</th>
                  <th className="align-right">Expected inflows</th>
                  <th className="align-right">Outflows</th>
                  <th className="align-right">Net</th>
                  <th className="align-right">Running balance</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.label}>
                    <td><strong>{b.label}</strong></td>
                    <td className="align-right">R {formatNumber(b.inflows, 2)}</td>
                    <td className="align-right">R {formatNumber(b.outflows, 2)}</td>
                    <td className={`align-right${b.net < 0 ? ' cell-alert' : ''}`}><strong>R {formatNumber(b.net, 2)}</strong></td>
                    <td className={`align-right${b.runningBalance < 0 ? ' cell-alert' : ''}`}><strong>R {formatNumber(b.runningBalance, 2)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {b.inflowDetail.slice(0, 5).map((i, idx) => (
                          <span key={idx} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-line)', borderRadius: 4 }}>
                            {i.ref} · {i.client} · R{formatNumber(i.amount, 0)}
                          </span>
                        ))}
                        {b.inflowDetail.length > 5 ? <span style={{ fontSize: 10 }}>+{b.inflowDetail.length - 5}</span> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Outflows aren't tracked yet — to forecast cash net of expenses, capture recurring fixed costs (rent, salaries, paper procurement schedule) in a future session.
        </p>
      </section>
    </>
  );
}
