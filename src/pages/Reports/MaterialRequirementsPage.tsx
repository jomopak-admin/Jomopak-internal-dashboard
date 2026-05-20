/**
 * Material Requirements forecast.
 *
 * For all open jobs in the next 30 days, aggregate the paper needed
 * (kg) by paper type + GSM. Compare against finished-goods stock on
 * hand for the same paper type. Surface shortages with a clear flag.
 *
 * Heuristic for paper kg per job — uses paperQuantityRequired if set,
 * else estimates from quantityPlanned × default per-bag paper weight.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, MaterialReceipt } from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface MaterialRequirementsPageProps {
  jobs: JobCard[];
  materialReceipts: MaterialReceipt[];
}

const DAY_MS = 1000 * 60 * 60 * 24;

function withinHorizon(dateStr: string, days: number): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return t - Date.now() < days * DAY_MS && t > Date.now() - DAY_MS;
}

export function MaterialRequirementsPage({ jobs, materialReceipts }: MaterialRequirementsPageProps) {
  const [horizonDays, setHorizonDays] = useState(30);

  const openJobs = useMemo(() => jobs.filter((j) =>
    j.status !== 'Completed'
    && withinHorizon(j.dueDate || j.jobDate, horizonDays),
  ), [jobs, horizonDays]);

  /** Group jobs by paper key (type + gsm), sum required kg. */
  const requirements = useMemo(() => {
    const buckets = new Map<string, { key: string; paperType: string; gsm: string; requiredKg: number; jobs: JobCard[] }>();
    for (const job of openJobs) {
      const key = `${job.paperType || 'Unknown'} ${job.gsm || ''}`.trim();
      const existing = buckets.get(key) ?? { key, paperType: job.paperType || 'Unknown', gsm: job.gsm || '', requiredKg: 0, jobs: [] };
      existing.requiredKg += Number(job.paperQuantityRequired || 0);
      existing.jobs.push(job);
      buckets.set(key, existing);
    }
    return Array.from(buckets.values()).sort((a, b) => b.requiredKg - a.requiredKg);
  }, [openJobs]);

  /** Aggregate paper stock available by type + gsm from material receipts. */
  const stockByType = useMemo(() => {
    const out = new Map<string, number>();
    for (const r of materialReceipts) {
      const key = `${r.paperType || 'Unknown'} ${r.gsm || ''}`.trim();
      out.set(key, (out.get(key) ?? 0) + Number(r.quantityAvailable || 0));
    }
    return out;
  }, [materialReceipts]);

  const totals = useMemo(() => {
    const required = requirements.reduce((acc, r) => acc + r.requiredKg, 0);
    const available = Array.from(stockByType.values()).reduce((acc, v) => acc + v, 0);
    const shortage = requirements.reduce((acc, r) => {
      const onHand = stockByType.get(r.key) ?? 0;
      return acc + Math.max(0, r.requiredKg - onHand);
    }, 0);
    return { required, available, shortage, lineCount: requirements.length, jobsTracked: openJobs.length };
  }, [requirements, stockByType, openJobs]);

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Material Requirements" subtitle={`Aggregate paper needed for jobs in the next ${horizonDays} days vs. stock on hand`} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', marginRight: 6 }}>Forecast horizon</span>
            <select value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
        </div>

        <div className="food-safety-stats">
          <div className="food-safety-stat"><span>Jobs in horizon</span><strong>{totals.jobsTracked}</strong></div>
          <div className="food-safety-stat"><span>Distinct papers</span><strong>{totals.lineCount}</strong></div>
          <div className="food-safety-stat"><span>Total paper required</span><strong>{formatNumber(totals.required, 1)} kg</strong></div>
          <div className="food-safety-stat"><span>Total paper on hand</span><strong>{formatNumber(totals.available, 1)} kg</strong></div>
          <div className={`food-safety-stat${totals.shortage > 0 ? ' food-safety-stat-alert' : ''}`}><span>Shortage</span><strong>{formatNumber(totals.shortage, 1)} kg</strong></div>
        </div>

        {requirements.length === 0 ? (
          <EmptyState title="No material requirements in this window" body="No jobs scheduled within the selected horizon, or jobs have no paper kg captured. Set paperQuantityRequired on jobs to power this view." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Paper type / GSM</th>
                  <th className="align-right">Required (kg)</th>
                  <th className="align-right">On hand (kg)</th>
                  <th className="align-right">Net (kg)</th>
                  <th>Status</th>
                  <th>Jobs needing it</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((r) => {
                  const onHand = stockByType.get(r.key) ?? 0;
                  const net = onHand - r.requiredKg;
                  const shortage = net < 0;
                  const tight = !shortage && net < r.requiredKg * 0.15;
                  return (
                    <tr key={r.key}>
                      <td><strong>{r.paperType}</strong>{r.gsm ? <div className="table-subtext">{r.gsm} GSM</div> : null}</td>
                      <td className="align-right">{formatNumber(r.requiredKg, 1)}</td>
                      <td className="align-right">{formatNumber(onHand, 1)}</td>
                      <td className={`align-right${shortage ? ' cell-alert' : ''}`}><strong>{formatNumber(net, 1)}</strong></td>
                      <td>{shortage ? <span className="badge badge-danger">Shortage</span> : tight ? <span className="badge badge-warning">Tight</span> : <span className="badge badge-success">OK</span>}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.jobs.slice(0, 6).map((j) => (
                            <span key={j.id} style={{ fontSize: 10, padding: '2px 6px', background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-line)', borderRadius: 4 }}>
                              {j.jobNumber} · {formatDate((j.dueDate || j.jobDate).slice(0, 10))}
                            </span>
                          ))}
                          {r.jobs.length > 6 ? <span style={{ fontSize: 10 }}>+{r.jobs.length - 6} more</span> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
