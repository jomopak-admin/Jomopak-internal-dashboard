/**
 * Production Schedule.
 *
 * Weekly grid: machine rows × day columns. Each cell shows the jobs
 * scheduled for that machine on that day, with hours estimate and
 * status. A capacity rollup at the top shows machine load percent for
 * the visible week (estimated machine hours / available shop hours).
 * Conflicts (multiple jobs on same machine same day) are flagged.
 *
 * Click a job pill to re-schedule it — opens a small picker overlay
 * to move it to a different date / machine. Day-week navigation at
 * the top lets you scroll through weeks.
 */

import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SectionTitle } from '../../components/SectionTitle';
import { JobCard, Machine } from '../../types';
import { formatNumber } from '../../utils/calculations';

interface ProductionSchedulePageProps {
  jobs: JobCard[];
  machines: Machine[];
  /** Move a job to a different date / machine. */
  onReschedule: (jobId: string, newDate: string, newMachineId: string) => void;
  onOpenJob?: (jobId: string) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/** Available shop hours per machine per day, used as the load denominator. */
const SHOP_HOURS_PER_DAY = 8;

/** Estimate machine hours for a job — rough heuristic until we add real
 *  setup + run-time fields. 0.5 hour setup + qty / 8000 bags-per-hour. */
function estimateJobHours(job: JobCard): number {
  const qty = Math.max(0, Number(job.quantityPlanned || 0));
  const runHours = qty / 8000;
  return 0.5 + runHours;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  // Treat Monday as start of week (food-bag factory convention).
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function isJobScheduled(job: JobCard): boolean {
  if (job.status === 'Completed') return false;
  return !!(job.productionStartDate || job.factoryReleaseDate || job.dueDate || job.jobDate);
}

/** Which date this job should appear on in the schedule. */
function jobScheduleDate(job: JobCard): string {
  return (job.productionStartDate || job.factoryReleaseDate || job.dueDate || job.jobDate || '').slice(0, 10);
}

interface RescheduleTarget {
  job: JobCard;
}

export function ProductionSchedulePage({ jobs, machines, onReschedule, onOpenJob }: ProductionSchedulePageProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [machineFilter, setMachineFilter] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<RescheduleTarget | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleMachine, setRescheduleMachine] = useState('');

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const dayKeys = useMemo(() => days.map(isoDate), [days]);

  const activeMachines = useMemo(
    () => machines.filter((m) => m.active && (!machineFilter || m.id === machineFilter)),
    [machines, machineFilter],
  );

  /** Index: machineId -> dayISO -> jobs[] */
  const grid = useMemo(() => {
    const out = new Map<string, Map<string, JobCard[]>>();
    for (const m of activeMachines) {
      const dayMap = new Map<string, JobCard[]>();
      for (const dk of dayKeys) dayMap.set(dk, []);
      out.set(m.id, dayMap);
    }
    // Bucket of jobs without machine assignment.
    const unscheduled: JobCard[] = [];
    for (const job of jobs) {
      if (!isJobScheduled(job)) continue;
      const date = jobScheduleDate(job);
      if (!dayKeys.includes(date)) continue;
      const mId = job.assignedMachineId;
      if (mId && out.has(mId)) {
        out.get(mId)!.get(date)!.push(job);
      } else {
        unscheduled.push(job);
      }
    }
    return { byMachine: out, unscheduled };
  }, [activeMachines, dayKeys, jobs]);

  /** Capacity per machine for the visible week. */
  const capacity = useMemo(() => {
    const out: Array<{ machineId: string; machineName: string; hoursBooked: number; utilisation: number; conflicts: number }> = [];
    const weekHours = SHOP_HOURS_PER_DAY * 7;
    for (const m of activeMachines) {
      const dayMap = grid.byMachine.get(m.id);
      let hoursBooked = 0;
      let conflicts = 0;
      if (dayMap) {
        for (const list of dayMap.values()) {
          for (const job of list) hoursBooked += estimateJobHours(job);
          // Flag conflicts: more jobs than 8 hours per day suggests overbook.
          const dayHours = list.reduce((acc, j) => acc + estimateJobHours(j), 0);
          if (dayHours > SHOP_HOURS_PER_DAY) conflicts += 1;
        }
      }
      out.push({
        machineId: m.id,
        machineName: m.name,
        hoursBooked,
        utilisation: weekHours > 0 ? hoursBooked / weekHours : 0,
        conflicts,
      });
    }
    return out;
  }, [activeMachines, grid]);

  function openReschedule(job: JobCard) {
    setRescheduleTarget({ job });
    setRescheduleDate(jobScheduleDate(job));
    setRescheduleMachine(job.assignedMachineId || '');
  }
  function applyReschedule() {
    if (!rescheduleTarget) return;
    onReschedule(rescheduleTarget.job.id, rescheduleDate, rescheduleMachine);
    setRescheduleTarget(null);
  }

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${weekStart.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const today = isoDate(new Date());

  return (
    <>
      <SectionTitle />
      <section className="card">
        <SectionTitle title="Production Schedule" subtitle={`Week of ${weekLabel}`} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <button className="ghost-button" onClick={() => setWeekStart(addDays(weekStart, -7))}>← Previous week</button>
          <button className="ghost-button" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
          <button className="ghost-button" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next week →</button>
          <label style={{ marginLeft: 12 }}>
            <span style={{ marginRight: 6, fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>Machine</span>
            <select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
              <option value="">All machines</option>
              {machines.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>

        <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '20px 0 8px' }}>Capacity for this week</h3>
        <div className="food-safety-stats">
          {capacity.map((c) => {
            const alert = c.utilisation >= 1 || c.conflicts > 0;
            const high = c.utilisation >= 0.85;
            return (
              <div key={c.machineId} className={`food-safety-stat${alert ? ' food-safety-stat-alert' : ''}`}>
                <span>{c.machineName}</span>
                <strong>{Math.round(c.utilisation * 100)}%</strong>
                <div className="table-subtext" style={{ marginTop: 2 }}>
                  {formatNumber(c.hoursBooked, 1)}h booked
                  {c.conflicts > 0 ? ` · ${c.conflicts} conflict(s)` : ''}
                  {high && !alert ? ' · Heavy' : ''}
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', margin: '24px 0 8px' }}>Weekly grid</h3>
        {activeMachines.length === 0 ? (
          <EmptyState title="No machines configured" body="Add machines under Machines (Production nav group) to build the schedule." />
        ) : (
          <div className="table-wrap">
            <table style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Machine</th>
                  {days.map((d) => {
                    const dk = isoDate(d);
                    const isToday = dk === today;
                    return (
                      <th key={dk} style={isToday ? { background: 'rgba(219, 90, 31, 0.08)' } : undefined}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.toLocaleDateString('en-ZA', { weekday: 'short' })}</div>
                        <div style={{ fontSize: 13 }}>{d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeMachines.map((m) => {
                  const dayMap = grid.byMachine.get(m.id);
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.name}</strong><div className="table-subtext">{m.processType || m.department}</div></td>
                      {dayKeys.map((dk) => {
                        const list = dayMap?.get(dk) ?? [];
                        const dayHours = list.reduce((acc, j) => acc + estimateJobHours(j), 0);
                        const isOverbooked = dayHours > SHOP_HOURS_PER_DAY;
                        return (
                          <td key={dk} style={{ verticalAlign: 'top', minHeight: 80, background: isOverbooked ? 'rgba(231, 89, 89, 0.06)' : undefined }}>
                            {list.length === 0 ? <span className="muted" style={{ fontSize: 11 }}>—</span> : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {list.map((job) => (
                                  <button
                                    key={job.id}
                                    type="button"
                                    onClick={() => openReschedule(job)}
                                    title="Click to re-schedule"
                                    style={{
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      padding: '4px 6px',
                                      border: '1px solid var(--jp-line)',
                                      borderRadius: 6,
                                      background: 'var(--jp-paper, #fff)',
                                      font: 'inherit',
                                      color: 'inherit',
                                    }}
                                  >
                                    <div style={{ fontSize: 11, fontWeight: 500 }}>{job.jobNumber}</div>
                                    <div style={{ fontSize: 10, color: 'var(--jp-ink-3, #64748b)' }}>{job.customerName}</div>
                                    <div style={{ fontSize: 10, color: 'var(--jp-ink-3, #64748b)' }}>{formatNumber(job.quantityPlanned)} · {estimateJobHours(job).toFixed(1)}h</div>
                                  </button>
                                ))}
                                {isOverbooked ? <div className="table-subtext" style={{ color: '#b22b2b', fontSize: 10 }}>Overbooked ({formatNumber(dayHours, 1)}h)</div> : null}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {grid.unscheduled.length > 0 ? (
          <>
            <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b22b2b', margin: '24px 0 8px' }}>Unscheduled jobs in this week ({grid.unscheduled.length})</h3>
            <p className="muted" style={{ fontSize: 12 }}>These jobs have a date in the visible week but no assigned machine. Click to schedule.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {grid.unscheduled.map((job) => (
                <button key={job.id} className="table-button table-button-promote" onClick={() => openReschedule(job)}>
                  {job.jobNumber} · {job.customerName} · {formatNumber(job.quantityPlanned)}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {/* Re-schedule overlay */}
      {rescheduleTarget ? (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(20,20,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--jp-paper, #fff)', padding: 24, borderRadius: 12, maxWidth: 480, width: '90%' }}>
            <SectionTitle
              title={`Re-schedule ${rescheduleTarget.job.jobNumber}`}
              subtitle={`${rescheduleTarget.job.customerName} · ${rescheduleTarget.job.productName}`}
            />
            <div className="form-grid">
              <label><span>New date</span><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} /></label>
              <label><span>Assigned machine</span>
                <select value={rescheduleMachine} onChange={(e) => setRescheduleMachine(e.target.value)}>
                  <option value="">Unassigned</option>
                  {machines.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={applyReschedule}>Apply</button>
              {onOpenJob ? <button className="ghost-button" onClick={() => { onOpenJob(rescheduleTarget.job.id); setRescheduleTarget(null); }}>Open job</button> : null}
              <button className="ghost-button" onClick={() => setRescheduleTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
