/**
 * Morning Digest — Phase 100 redesign.
 *
 * Dual-purpose page:
 *  - On screen: a proper dashboard. Hero with date + "good morning" greeting
 *    + headline stats. Color-coded section cards arranged in a responsive
 *    2-column grid. Better empty states.
 *  - On print: cleanly degrades to a single paper-like brief. The CSS
 *    `@media print` rules hide chrome (print button, status chips) and
 *    collapse the grid to one column.
 *
 * Hit Print at 6am, the foreman picks up the printout and walks the floor.
 * The on-screen experience is now actually pleasant to read at 6am too.
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

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function MorningDigestPage({ data, company }: MorningDigestPageProps) {
  const today = todayISO();
  const now = new Date();

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

  const totalOverdueAmount = useMemo(() =>
    invoicesOverdue.reduce((s, i) => s + (Number(i.amountOutstanding) || 0), 0),
    [invoicesOverdue]);

  // ----- SARS deadlines -----
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

  const sarsOverdueCount = sarsDue.filter((s) => daysUntil(s.dueDate, today) < 0).length;

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

  // Stats for the hero strip.
  const totalAttention = activeRecalls.length + ncrsOverdue.length
    + machinesNotCleaned.length + fgOnHold.length;
  const hasUrgent = totalAttention > 0;
  const hasAnything = hasUrgent || jobsToday.length > 0 || jobsReadyDispatch.length > 0
    || leadsToFollow.length > 0 || invoicesOverdue.length > 0 || sarsDue.length > 0
    || qcPending.length > 0 || openComplaints.length > 0 || pestOverdue.length > 0
    || trainingOverdue.length > 0;

  return (
    <>
      {/* Print-only CSS — hide chrome, collapse to single column. */}
      <style>{`
        @media print {
          .md-print-hide { display: none !important; }
          .md-grid { grid-template-columns: 1fr !important; }
          .md-hero { background: #fff !important; border: 0 !important; padding: 0 0 12px 0 !important; }
          .md-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        .md-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 14px;
        }
        .md-card {
          background: var(--jp-paper, #fff);
          border: 1px solid var(--jp-border, #e5e2dc);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .md-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; }
        .md-card-head strong { font-size: 14px; }
        .md-card-head .md-count {
          font-size: 11px; padding: 2px 10px; border-radius: 999px;
          background: var(--jp-paper-2, #faf8f4); border: 1px solid var(--jp-border, #e5e2dc);
        }
        .md-card .md-row {
          display: flex; justify-content: space-between; align-items: baseline; gap: 8px;
          padding: 8px 0; border-top: 1px dashed var(--jp-border-soft, #eee);
          font-size: 13px;
        }
        .md-card .md-row:first-of-type { border-top: 0; padding-top: 0; }
        .md-empty { font-size: 13px; color: #5a6e60; display: flex; align-items: center; gap: 8px; padding: 4px 0; }
        .md-empty-tick {
          width: 18px; height: 18px; border-radius: 50%;
          background: #d9efd9; color: #2e6f3e; display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        .md-stat {
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid var(--jp-border, #e5e2dc); background: var(--jp-paper, #fff);
          min-width: 0;
        }
        .md-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--jp-ink-3, #64748b); }
        .md-stat-value { font-size: 22px; font-weight: 700; margin-top: 2px; }
        .md-stat-tone-warn { border-color: rgba(184,134,11,0.45); background: rgba(184,134,11,0.06); }
        .md-stat-tone-alert { border-color: rgba(178,43,43,0.5); background: rgba(178,43,43,0.05); }
        .md-stat-tone-quiet { color: #2e6f3e; }
      `}</style>

      <SectionTitle action={
        <button className="primary-button md-print-hide" onClick={() => window.print()}>Print briefing</button>
      } />

      <article style={{ maxWidth: 1180, margin: '0 auto' }}>
        {/* ═══ Hero ═════════════════════════════════════════════════════ */}
        <header
          className="md-hero"
          style={{
            padding: '20px 24px',
            borderRadius: 14,
            background: 'linear-gradient(180deg, var(--jp-paper, #fff), var(--jp-paper-2, #faf8f4))',
            border: '1px solid var(--jp-border, #e5e2dc)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {greeting(now)}
              </div>
              <h1 style={{ margin: '4px 0 2px', fontSize: 26, lineHeight: 1.1 }}>
                {company?.name || 'Jomopak'} · {new Date().toLocaleDateString('en-ZA', { weekday: 'long' })}
              </h1>
              <p style={{ margin: 0, color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>
                {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' · '}<span className="md-print-hide">Pick up at 6am · walk the floor by 7</span>
              </p>
            </div>
          </div>

          {/* Headline stats strip. Each tile takes you straight to the relevant page on screen. */}
          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            <div className={`md-stat ${totalAttention > 0 ? 'md-stat-tone-alert' : ''}`}>
              <div className="md-stat-label">Top of mind</div>
              <div className={`md-stat-value ${totalAttention === 0 ? 'md-stat-tone-quiet' : ''}`}>
                {totalAttention === 0 ? '—' : totalAttention}
              </div>
            </div>
            <div className="md-stat">
              <div className="md-stat-label">Jobs today</div>
              <div className="md-stat-value">{jobsToday.length}</div>
            </div>
            <div className="md-stat">
              <div className="md-stat-label">Ready to dispatch</div>
              <div className="md-stat-value">{jobsReadyDispatch.length}</div>
            </div>
            <div className={`md-stat ${leadsToFollow.length > 0 ? 'md-stat-tone-warn' : ''}`}>
              <div className="md-stat-label">Leads to chase</div>
              <div className="md-stat-value">{leadsToFollow.length}</div>
            </div>
            <div className={`md-stat ${invoicesOverdue.length > 0 ? 'md-stat-tone-alert' : ''}`}>
              <div className="md-stat-label">Overdue R</div>
              <div className="md-stat-value">R&nbsp;{formatNumber(totalOverdueAmount, 0)}</div>
            </div>
            <div className={`md-stat ${sarsOverdueCount > 0 ? 'md-stat-tone-alert' : sarsDue.length > 0 ? 'md-stat-tone-warn' : ''}`}>
              <div className="md-stat-label">SARS (30d)</div>
              <div className="md-stat-value">{sarsDue.length}{sarsOverdueCount > 0 ? <span style={{ fontSize: 12, marginLeft: 4 }}>· {sarsOverdueCount} overdue</span> : null}</div>
            </div>
          </div>
        </header>

        {/* ═══ Urgent — only when there's something ════════════════════ */}
        {hasUrgent && (
          <section
            className="md-card"
            style={{
              marginBottom: 16,
              borderColor: 'rgba(178,43,43,0.5)',
              background: 'rgba(178,43,43,0.04)',
            }}
          >
            <div className="md-card-head">
              <strong style={{ color: '#b22b2b' }}>Top of mind today</strong>
              <span className="md-count">{totalAttention}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activeRecalls.length > 0 && (
                <div className="md-row">
                  <span><strong>{activeRecalls.length}</strong> active recall{activeRecalls.length === 1 ? '' : 's'}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{activeRecalls.slice(0, 3).map((c) => c.complaintNumber).join(', ')}{activeRecalls.length > 3 ? '…' : ''}</span>
                </div>
              )}
              {ncrsOverdue.length > 0 && (
                <div className="md-row">
                  <span><strong>{ncrsOverdue.length}</strong> NCR{ncrsOverdue.length === 1 ? '' : 's'} with overdue CAPA</span>
                  <span className="muted" style={{ fontSize: 12 }}>oldest: {ncrsOverdue[0]?.ncrNumber}</span>
                </div>
              )}
              {machinesNotCleaned.length > 0 && (
                <div className="md-row">
                  <span><strong>{machinesNotCleaned.length}</strong> machine{machinesNotCleaned.length === 1 ? '' : 's'} need cleaning before food jobs</span>
                  <span className="muted" style={{ fontSize: 12 }}>{machinesNotCleaned.slice(0, 2).map((m) => m.machineName).join(', ')}</span>
                </div>
              )}
              {fgOnHold.length > 0 && (
                <div className="md-row">
                  <span><strong>{fgOnHold.length}</strong> FG batch{fgOnHold.length === 1 ? '' : 'es'} on hold</span>
                  <span className="muted" style={{ fontSize: 12 }}>investigate before release</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ All-quiet hero state ════════════════════════════════════ */}
        {!hasAnything && (
          <section className="md-card" style={{ marginBottom: 16, textAlign: 'center', padding: 32 }}>
            <h3 style={{ margin: '0 0 4px' }}>All quiet</h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              No urgent items, no jobs scheduled, no overdue invoices, no SARS deadlines in the next 30 days.
              Enjoy the morning.
            </p>
          </section>
        )}

        {/* ═══ 2-column grid of section cards ══════════════════════════ */}
        <div className="md-grid">
          {/* ── Production today ─────────────────────────────────────── */}
          <section className="md-card" style={{ borderLeft: '3px solid var(--jp-accent, #2563eb)' }}>
            <div className="md-card-head">
              <strong>Production today</strong>
              <span className="md-count">{jobsToday.length}</span>
            </div>
            {jobsToday.length === 0 ? (
              <div className="md-empty">No jobs scheduled for today.</div>
            ) : (
              <div>
                {jobsToday.map((j) => {
                  const machine = data.machines.find((m) => m.id === j.assignedMachineId);
                  return (
                    <div key={j.id} className="md-row">
                      <span><strong>{j.jobNumber}</strong> · {j.customerName}</span>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {formatNumber(j.quantityPlanned)} · {machine?.name || '—'} · {j.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Ready for dispatch ───────────────────────────────────── */}
          <section className="md-card" style={{ borderLeft: '3px solid #2e6f3e' }}>
            <div className="md-card-head">
              <strong>Ready for dispatch</strong>
              <span className="md-count">{jobsReadyDispatch.length}</span>
            </div>
            {jobsReadyDispatch.length === 0 ? (
              <div className="md-empty">Nothing waiting to go out.</div>
            ) : (
              <div>
                {jobsReadyDispatch.slice(0, 6).map((j) => (
                  <div key={j.id} className="md-row">
                    <span><strong>{j.jobNumber}</strong> · {j.customerName}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {formatNumber(j.quantityCompleted)} / {formatNumber(j.quantityPlanned)} {j.paperQuantityUnit}
                    </span>
                  </div>
                ))}
                {jobsReadyDispatch.length > 6 ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>… +{jobsReadyDispatch.length - 6} more</div> : null}
              </div>
            )}
          </section>

          {/* ── Sales — leads to follow ──────────────────────────────── */}
          <section className="md-card" style={{ borderLeft: '3px solid #8c4cb6' }}>
            <div className="md-card-head">
              <strong>Leads to chase</strong>
              <span className="md-count">{leadsToFollow.length}</span>
            </div>
            {leadsToFollow.length === 0 ? (
              <div className="md-empty">No follow-ups due today.</div>
            ) : (
              <div>
                {leadsToFollow.slice(0, 8).map((l) => (
                  <div key={l.id} className="md-row">
                    <span><strong>{l.leadNumber}</strong> · {l.contactName || l.companyName}</span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {l.source}{l.phone ? ` · ${l.phone}` : ''} · {l.status}
                    </span>
                  </div>
                ))}
                {leadsToFollow.length > 8 ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>… +{leadsToFollow.length - 8} more</div> : null}
              </div>
            )}
          </section>

          {/* ── Finance — overdue invoices ───────────────────────────── */}
          <section className="md-card" style={{ borderLeft: '3px solid ' + (invoicesOverdue.length > 0 ? '#b22b2b' : '#b8860b') }}>
            <div className="md-card-head">
              <strong>Overdue invoices</strong>
              <span className="md-count">
                {invoicesOverdue.length}{invoicesOverdue.length > 0 ? ` · R ${formatNumber(totalOverdueAmount, 0)}` : ''}
              </span>
            </div>
            {invoicesOverdue.length === 0 ? (
              <div className="md-empty">Nothing overdue.</div>
            ) : (
              <div>
                {invoicesOverdue.slice(0, 6).map((inv) => {
                  const daysLate = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / DAY_MS);
                  return (
                    <div key={inv.id} className="md-row">
                      <span><strong>{inv.invoiceNumber}</strong> · {inv.clientName}</span>
                      <span style={{ fontSize: 12 }}>
                        R {formatNumber(inv.amountOutstanding, 2)} · <span style={{ color: '#b22b2b' }}>{daysLate}d</span>
                      </span>
                    </div>
                  );
                })}
                {invoicesOverdue.length > 6 ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>… +{invoicesOverdue.length - 6} more</div> : null}
              </div>
            )}
          </section>

          {/* ── SARS deadlines (next 30 days) ────────────────────────── */}
          {sarsDue.length > 0 && (
            <section className="md-card" style={{ borderLeft: '3px solid ' + (sarsOverdueCount > 0 ? '#b22b2b' : '#b8860b'), gridColumn: 'span 2', minWidth: 0 }}>
              <div className="md-card-head">
                <strong>SARS deadlines · next 30 days</strong>
                <span className="md-count">{sarsDue.length}{sarsOverdueCount > 0 ? ` · ${sarsOverdueCount} overdue` : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                {sarsDue.map((slot) => {
                  const until = daysUntil(slot.dueDate, today);
                  const overdue = until < 0;
                  const dueToday = until === 0;
                  const tone = overdue ? '#b22b2b' : dueToday ? '#b22b2b' : until <= 7 ? '#b8860b' : 'var(--jp-ink-3, #64748b)';
                  return (
                    <div
                      key={slot.periodKey}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: overdue ? 'rgba(178,43,43,0.05)' : 'var(--jp-paper-2, #faf8f4)',
                        border: `1px solid ${overdue ? 'rgba(178,43,43,0.3)' : 'var(--jp-border, #e5e2dc)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: 13 }}>{SARS_OBLIGATION_SHORT[slot.obligationType]}</strong>
                        <span style={{ fontSize: 11, color: tone, fontWeight: 600 }}>
                          {overdue ? `${-until}d overdue` : dueToday ? 'TODAY' : `${until}d`}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {slot.periodLabel} · due {formatDate(slot.dueDate)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Food-safety QC pending ───────────────────────────────── */}
          {qcPending.length > 0 && (
            <section className="md-card" style={{ borderLeft: '3px solid #b8860b' }}>
              <div className="md-card-head">
                <strong>Food-packaging QC pending</strong>
                <span className="md-count">{qcPending.length}</span>
              </div>
              <div>
                {qcPending.slice(0, 5).map((j) => (
                  <div key={j.id} className="md-row">
                    <span><strong>{j.jobNumber}</strong> · {j.customerName}</span>
                    <span className="muted" style={{ fontSize: 12 }}>first-off or final QC needed</span>
                  </div>
                ))}
                {qcPending.length > 5 ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>… +{qcPending.length - 5} more</div> : null}
              </div>
            </section>
          )}

          {/* ── Open complaints ──────────────────────────────────────── */}
          {openComplaints.length > 0 && (
            <section className="md-card" style={{ borderLeft: '3px solid #b8860b' }}>
              <div className="md-card-head">
                <strong>Open complaints</strong>
                <span className="md-count">{openComplaints.length}</span>
              </div>
              <div>
                {openComplaints.slice(0, 5).map((c) => (
                  <div key={c.id} className="md-row">
                    <span><strong>{c.complaintNumber}</strong> · {c.clientName}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{c.complaintType} · {c.severity}</span>
                  </div>
                ))}
                {openComplaints.length > 5 ? <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>… +{openComplaints.length - 5} more</div> : null}
              </div>
            </section>
          )}

          {/* ── Compliance roll-up ───────────────────────────────────── */}
          {(pestOverdue.length > 0 || trainingOverdue.length > 0) && (
            <section className="md-card" style={{ borderLeft: '3px solid #b8860b' }}>
              <div className="md-card-head">
                <strong>Compliance</strong>
                <span className="md-count">{pestOverdue.length + trainingOverdue.length}</span>
              </div>
              <div>
                {pestOverdue.length > 0 && (
                  <div className="md-row">
                    <span>Pest control services overdue</span>
                    <strong>{pestOverdue.length}</strong>
                  </div>
                )}
                {trainingOverdue.length > 0 && (
                  <div className="md-row">
                    <span>Staff training refreshers overdue</span>
                    <strong>{trainingOverdue.length}</strong>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <footer
          style={{
            marginTop: 18,
            padding: '12px 16px',
            borderTop: '1px solid var(--jp-border, #e5e2dc)',
            fontSize: 11,
            color: 'var(--jp-ink-3, #64748b)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          <span>Generated {now.toLocaleString('en-ZA')}</span>
          <span className="md-print-hide">Tap a section to drill in · or print and walk the floor.</span>
        </footer>
      </article>
    </>
  );
}
