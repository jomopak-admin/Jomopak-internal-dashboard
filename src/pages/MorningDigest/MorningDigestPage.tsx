/**
 * Morning Digest.
 *
 * Single printable page summarising today's required actions across the
 * factory. Hit Print at 6am, the foreman / shift leader picks up the
 * printout and walks the floor. No need to log in to read it.
 *
 * Sections:
 *  - Top of mind (overdue items, recalls, critical NCRs)
 *  - Production today (jobs scheduled, machines)
 *  - Quality & cleaning (cleaning due, QC pending)
 *  - Sales (leads to follow up, quotes awaiting decision)
 *  - Finance (invoices overdue, jobs blocked on credit)
 */

import { useMemo } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppData,
  AppSettingsCompany,
  CustomerComplaint,
  FinishedGoodsStock,
  isFoodPackagingLevel,
  isQcStagePassed,
  JobCard,
  Lead,
  NonConformance,
  getLatestPassingClean,
  SARS_OBLIGATION_SHORT,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';
import { buildSarsCalendar, daysUntil } from '../../utils/sars';

interface MorningDigestPageProps {
  data: AppData;
  company?: AppSettingsCompany;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MorningDigestPage({ data, company }: MorningDigestPageProps) {
  const today = todayISO();

  // ----- Leads to follow up -----
  const leadsToFollow = useMemo<Lead[]>(() => {
    return data.leads
      .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
      .filter((l) => !!l.nextFollowUpDate && l.nextFollowUpDate <= today)
      .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [data.leads, today]);

  // ----- Jobs scheduled today -----
  const jobsToday = useMemo<JobCard[]>(() => {
    return data.jobs.filter((j) => {
      if (j.status === 'Completed') return false;
      const scheduleDate = (j.productionStartDate || j.factoryReleaseDate || j.dueDate || j.jobDate).slice(0, 10);
      return scheduleDate === today;
    });
  }, [data.jobs, today]);

  // ----- Jobs ready for dispatch -----
  const jobsReadyDispatch = useMemo<JobCard[]>(() => {
    return data.jobs.filter((j) => j.status === 'Ready for Dispatch' || j.status === 'Partially Dispatched');
  }, [data.jobs]);

  // ----- Cleaning gate failures -----
  const machinesNotCleaned = useMemo(() => {
    const list: { machineId: string; machineName: string; jobs: JobCard[] }[] = [];
    const foodJobs = data.jobs.filter((j) =>
      isFoodPackagingLevel(j.foodContactLevel ?? 'NonFood')
      && j.status !== 'Completed'
      && j.assignedMachineId,
    );
    const groupedByMachine = new Map<string, JobCard[]>();
    for (const j of foodJobs) {
      const existing = groupedByMachine.get(j.assignedMachineId) ?? [];
      existing.push(j);
      groupedByMachine.set(j.assignedMachineId, existing);
    }
    for (const [machineId, jobs] of groupedByMachine.entries()) {
      const clean = getLatestPassingClean(machineId, data.cleaningLogs);
      if (!clean) {
        const machine = data.machines.find((m) => m.id === machineId);
        list.push({ machineId, machineName: machine?.name || machineId, jobs });
      }
    }
    return list;
  }, [data.jobs, data.cleaningLogs, data.machines]);

  // ----- QC sign-offs pending -----
  const qcPending = useMemo<JobCard[]>(() => {
    return data.jobs.filter((j) => {
      if (!isFoodPackagingLevel(j.foodContactLevel ?? 'NonFood')) return false;
      if (j.status === 'Completed') return false;
      const firstOff = (j.qcPlan ?? []).find((s) => s.stage === 'FirstOff');
      const final = (j.qcPlan ?? []).find((s) => s.stage === 'FinalInspection');
      return !firstOff || !isQcStagePassed(firstOff) || !final || !isQcStagePassed(final);
    });
  }, [data.jobs]);

  // ----- Open complaints / recalls -----
  const openComplaints = useMemo<CustomerComplaint[]>(() => {
    return data.customerComplaints.filter((c) => c.status !== 'Closed' && c.status !== 'Resolved');
  }, [data.customerComplaints]);
  const activeRecalls = useMemo<CustomerComplaint[]>(() => {
    return data.customerComplaints.filter((c) => c.recallTriggered);
  }, [data.customerComplaints]);

  // ----- NCRs overdue -----
  const ncrsOverdue = useMemo<NonConformance[]>(() => {
    return data.nonConformances.filter((n) =>
      n.status !== 'Closed'
      && n.dueDate
      && n.dueDate < today,
    );
  }, [data.nonConformances, today]);

  // ----- FG batches on hold -----
  const fgOnHold = useMemo<FinishedGoodsStock[]>(() => {
    return data.finishedGoodsStock.filter((s) => s.foodSafetyHoldStatus === 'On Hold');
  }, [data.finishedGoodsStock]);

  // ----- Invoices overdue -----
  const invoicesOverdue = useMemo(() => {
    return data.invoices.filter((inv) =>
      inv.amountOutstanding > 0
      && inv.status !== 'Cancelled'
      && inv.status !== 'Draft'
      && inv.status !== 'Paid'
      && inv.dueDate
      && inv.dueDate < today,
    ).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [data.invoices, today]);

  // ----- SARS deadlines due soon / overdue -----
  const sarsDue = useMemo(() => {
    const cfg = data.appSettings?.sarsConfig;
    if (!cfg) return [];
    const savedByKey = new Map((data.sarsFilings || []).map((f) => [f.periodKey, f]));
    return buildSarsCalendar(cfg, today)
      .filter((slot) => {
        const saved = savedByKey.get(slot.periodKey);
        if (saved && (saved.status === 'Submitted' || saved.status === 'Paid')) return false;
        return daysUntil(slot.dueDate, today) <= 30;
      })
      .slice(0, 8);
  }, [data.appSettings, data.sarsFilings, today]);

  // ----- Pest control overdue -----
  const pestOverdue = useMemo(() => {
    return data.pestControlRecords.filter((p) =>
      p.nextServiceDate && p.nextServiceDate < today,
    );
  }, [data.pestControlRecords, today]);

  // ----- Training overdue -----
  const trainingOverdue = useMemo(() => {
    return data.staffTrainingRecords.filter((r) => {
      if (!r.nextRefresherDate) return true;
      return r.nextRefresherDate < today;
    });
  }, [data.staffTrainingRecords, today]);

  return (
    <>
      <SectionTitle action={<button className="primary-button" onClick={() => window.print()}>Print briefing</button>} />
      <article className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
        <header style={{ borderBottom: '0.5px solid var(--jp-line)', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{company?.name || 'Jomopak'} — Morning Briefing</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>{new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
            <div>Pick up at 6am · walk the floor by 7</div>
          </div>
        </header>

        {/* ===== Urgent — anything that should be looked at first ===== */}
        {(activeRecalls.length > 0 || ncrsOverdue.length > 0 || machinesNotCleaned.length > 0 || fgOnHold.length > 0) && (
          <section style={{ marginBottom: 20, padding: 14, background: 'rgba(231, 89, 89, 0.06)', border: '1px solid rgba(231, 89, 89, 0.4)', borderRadius: 10 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b22b2b' }}>Top of mind today</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {activeRecalls.length > 0 && (
                <li><strong>{activeRecalls.length} active recall(s)</strong> — review status. {activeRecalls.slice(0, 3).map((c) => c.complaintNumber).join(', ')}{activeRecalls.length > 3 ? '…' : ''}</li>
              )}
              {ncrsOverdue.length > 0 && (
                <li><strong>{ncrsOverdue.length} NCR(s)</strong> with overdue corrective action. Oldest: {ncrsOverdue[0]?.ncrNumber} due {formatDate(ncrsOverdue[0]?.dueDate)}.</li>
              )}
              {machinesNotCleaned.length > 0 && (
                <li><strong>{machinesNotCleaned.length} machine(s)</strong> have food-packaging jobs but no recent passing clean — log cleaning before production starts.</li>
              )}
              {fgOnHold.length > 0 && (
                <li><strong>{fgOnHold.length} finished-goods batch(es)</strong> on hold — investigate.</li>
              )}
            </ul>
          </section>
        )}

        {/* ===== Production today ===== */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Production today</h2>
          {jobsToday.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No jobs scheduled for today.</p>
          ) : (
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--jp-line)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Job</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Customer</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Product</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px' }}>Qty</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Machine</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobsToday.map((j) => {
                  const machine = data.machines.find((m) => m.id === j.assignedMachineId);
                  return (
                    <tr key={j.id} style={{ borderBottom: '0.5px solid var(--jp-line)' }}>
                      <td style={{ padding: '4px 8px' }}><strong>{j.jobNumber}</strong></td>
                      <td style={{ padding: '4px 8px' }}>{j.customerName}</td>
                      <td style={{ padding: '4px 8px' }}>{j.productName}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>{formatNumber(j.quantityPlanned)}</td>
                      <td style={{ padding: '4px 8px' }}>{machine?.name || (j.assignedMachineId ? 'Unknown' : '—')}</td>
                      <td style={{ padding: '4px 8px' }}>{j.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* ===== Ready for dispatch ===== */}
        {jobsReadyDispatch.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Ready for dispatch — {jobsReadyDispatch.length}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {jobsReadyDispatch.slice(0, 8).map((j) => (
                <li key={j.id}><strong>{j.jobNumber}</strong> — {j.customerName} — {formatNumber(j.quantityCompleted)} / {formatNumber(j.quantityPlanned)} {j.paperQuantityUnit}</li>
              ))}
              {jobsReadyDispatch.length > 8 ? <li><em>… and {jobsReadyDispatch.length - 8} more</em></li> : null}
            </ul>
          </section>
        )}

        {/* ===== QC sign-offs pending ===== */}
        {qcPending.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Food-packaging QC pending — {qcPending.length}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {qcPending.slice(0, 6).map((j) => (
                <li key={j.id}><strong>{j.jobNumber}</strong> — {j.customerName} — needs first-off or final QC sign-off</li>
              ))}
              {qcPending.length > 6 ? <li><em>… and {qcPending.length - 6} more</em></li> : null}
            </ul>
          </section>
        )}

        {/* ===== Sales — leads to follow ===== */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Sales — leads to follow today ({leadsToFollow.length})</h2>
          {leadsToFollow.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No follow-ups scheduled today.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {leadsToFollow.slice(0, 10).map((l) => (
                <li key={l.id}><strong>{l.leadNumber}</strong> — {l.contactName || l.companyName} — {l.source}{l.phone ? ` · ${l.phone}` : ''} — {l.status}</li>
              ))}
              {leadsToFollow.length > 10 ? <li><em>… and {leadsToFollow.length - 10} more</em></li> : null}
            </ul>
          )}
        </section>

        {/* ===== Finance — invoices overdue ===== */}
        {invoicesOverdue.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Finance — overdue invoices ({invoicesOverdue.length})</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {invoicesOverdue.slice(0, 8).map((inv) => {
                const daysLate = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / DAY_MS);
                return (
                  <li key={inv.id}><strong>{inv.invoiceNumber}</strong> — {inv.clientName} — R {formatNumber(inv.amountOutstanding, 2)} — <span style={{ color: '#b22b2b' }}>{daysLate}d overdue</span></li>
                );
              })}
              {invoicesOverdue.length > 8 ? <li><em>… and {invoicesOverdue.length - 8} more</em></li> : null}
            </ul>
          </section>
        )}

        {/* ===== SARS — deadlines due soon ===== */}
        {sarsDue.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>SARS deadlines (next 30 days)</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {sarsDue.map((slot) => {
                const until = daysUntil(slot.dueDate, today);
                return (
                  <li key={slot.periodKey}>
                    <strong>{SARS_OBLIGATION_SHORT[slot.obligationType]}</strong> — {slot.periodLabel} — due {formatDate(slot.dueDate)}{' '}
                    {until < 0 ? <span style={{ color: '#b22b2b' }}>({-until}d overdue)</span> : until === 0 ? <span style={{ color: '#b22b2b' }}>(due today)</span> : `(${until}d)`}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ===== Compliance — pest + training ===== */}
        {(pestOverdue.length > 0 || trainingOverdue.length > 0) && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Compliance</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {pestOverdue.length > 0 && <li><strong>{pestOverdue.length} pest control service(s) overdue</strong></li>}
              {trainingOverdue.length > 0 && <li><strong>{trainingOverdue.length} staff training refresher(s) overdue</strong></li>}
            </ul>
          </section>
        )}

        {/* ===== Open complaints summary ===== */}
        {openComplaints.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>Open complaints — {openComplaints.length}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
              {openComplaints.slice(0, 5).map((c) => (
                <li key={c.id}><strong>{c.complaintNumber}</strong> — {c.clientName} — {c.complaintType} — {c.severity}</li>
              ))}
              {openComplaints.length > 5 ? <li><em>… and {openComplaints.length - 5} more</em></li> : null}
            </ul>
          </section>
        )}

        <footer style={{ marginTop: 24, paddingTop: 12, borderTop: '0.5px solid var(--jp-line)', fontSize: 11, color: 'var(--jp-ink-3, #64748b)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Generated {new Date().toLocaleString('en-ZA')}</span>
          <span>Print and walk the floor.</span>
        </footer>
      </article>
    </>
  );
}
