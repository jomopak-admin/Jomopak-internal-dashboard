/**
 * Staff portal — "My Stuff".
 *
 * The home screen for every internal staff member. Surfaces:
 *   • pinned/recent notices for them
 *   • training they need to acknowledge
 *   • SOPs they need to acknowledge
 *   • their recent payslips
 *
 * Match-by-name on staffName for now; once UserProfile.linkedEmployeeId is
 * filled in by the admin in Permissions, we use that to scope payslips. If
 * not linked yet, we fall back to a fullName match.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  Employee,
  LEAVE_TYPES,
  LeaveRequest,
  LeaveType,
  Notice,
  PayrollRun,
  Payslip,
  SopDocument,
  StaffTrainingRecord,
  StaffWarning,
  UserProfile,
  UserRole,
} from '../../types';
import { formatDate } from '../../utils/calculations';
import { countWorkingDays, leaveBalanceFor } from '../../utils/leaveCalculations';

interface StaffPortalPageProps {
  profile: UserProfile;
  role: UserRole;
  notices: Notice[];
  trainingRecords: StaffTrainingRecord[];
  sopDocuments: SopDocument[];
  payrollRuns: PayrollRun[];
  employees: Employee[];
  warnings: StaffWarning[];
  leaveRequests: LeaveRequest[];
  onAcknowledgeTraining: (id: string) => void;
  onAcknowledgeSop: (sopId: string, staffName: string) => void;
  onAcknowledgeWarning: (id: string, signatureDataUrl: string) => void;
  /** Submit a self-service leave request from My Stuff. */
  onApplyForLeave: (payload: { type: LeaveType; startDate: string; endDate: string; reason: string }) => void;
}

export function StaffPortalPage({ profile, role, notices, trainingRecords, sopDocuments, payrollRuns, employees, warnings, leaveRequests, onAcknowledgeTraining, onAcknowledgeSop, onAcknowledgeWarning, onApplyForLeave }: StaffPortalPageProps) {
  const fullName = profile.fullName || profile.email || '';
  const today = new Date().toISOString().slice(0, 10);

  // Resolve the staff member's linked employee record. Prefer the explicit
  // linkedEmployeeId set by an admin in Permissions; otherwise fall back to
  // a name match so new users see something useful right away.
  const linkedEmployee = useMemo<Employee | undefined>(() => {
    if (profile.linkedEmployeeId) {
      return employees.find((e) => e.id === profile.linkedEmployeeId);
    }
    return employees.find((e) => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === fullName.trim().toLowerCase());
  }, [profile.linkedEmployeeId, employees, fullName]);

  const visibleNotices = useMemo(() => {
    return notices
      .filter((n) => !n.expiresAt || n.expiresAt >= today)
      .filter((n) => !n.audienceRoles || n.audienceRoles.length === 0 || n.audienceRoles.includes(role))
      .sort((a, b) => {
        if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return (b.postedAt || '').localeCompare(a.postedAt || '');
      })
      .slice(0, 6);
  }, [notices, today, role]);

  const myTraining = useMemo(() => {
    return trainingRecords.filter((t) => t.staffName.trim().toLowerCase() === fullName.trim().toLowerCase());
  }, [trainingRecords, fullName]);

  const pendingTraining = myTraining.filter((t) => !t.acknowledged);

  const pendingSops = useMemo(() => {
    // Phase 53 — audience filter: show if mandatoryForAll OR if my role is
    // in audienceRoles. Back-compat: SOPs with no audience info AND no
    // mandatory flag are still shown (don't hide pre-Phase-53 docs).
    return sopDocuments.filter((s) => {
      if (s.status !== 'Active') return false;
      if (s.acknowledgements.some((a) => a.staffName.trim().toLowerCase() === fullName.trim().toLowerCase())) return false;
      if (s.mandatoryForAll) return true;
      const hasAudience = Array.isArray(s.audienceRoles) && s.audienceRoles.length > 0;
      if (!hasAudience) return true; // legacy / un-targeted SOP — show to everyone
      return s.audienceRoles!.includes(role);
    });
  }, [sopDocuments, fullName, role]);

  // Warnings / commendations / notes addressed to this staff member.
  // Match on linkedEmployeeId first; fall back to name match so portal works
  // even before admin links a profile to an employee record.
  const myWarnings = useMemo<StaffWarning[]>(() => {
    return warnings
      .filter((w) => {
        if (profile.linkedEmployeeId && w.employeeId === profile.linkedEmployeeId) return true;
        return w.employeeName.trim().toLowerCase() === fullName.trim().toLowerCase();
      })
      .sort((a, b) => (b.issuedDate || '').localeCompare(a.issuedDate || ''));
  }, [warnings, profile.linkedEmployeeId, fullName]);

  // Per-row in-progress signature data. Local-only — flushed once ack lands.
  const [pendingSignatures, setPendingSignatures] = useState<Record<string, string>>({});
  const [showSignPadFor, setShowSignPadFor] = useState<string | null>(null);

  // Phase 47 — self-service leave application
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const leaveDays = useMemo(() => countWorkingDays(leaveStart, leaveEnd), [leaveStart, leaveEnd]);

  // My leave requests + balances. Match by linkedEmployeeId or name.
  const myLeave = useMemo<LeaveRequest[]>(() => {
    return leaveRequests.filter((r) => {
      if (linkedEmployee && r.employeeId === linkedEmployee.id) return true;
      return r.employeeName.trim().toLowerCase() === fullName.trim().toLowerCase();
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [leaveRequests, linkedEmployee, fullName]);
  const annualBal = useMemo(() => leaveBalanceFor(linkedEmployee, 'Annual', leaveRequests), [linkedEmployee, leaveRequests]);
  const sickBal = useMemo(() => leaveBalanceFor(linkedEmployee, 'Sick', leaveRequests), [linkedEmployee, leaveRequests]);
  const familyBal = useMemo(() => leaveBalanceFor(linkedEmployee, 'Family Responsibility', leaveRequests), [linkedEmployee, leaveRequests]);

  function submitLeave() {
    if (!leaveStart || !leaveEnd) return;
    if (leaveEnd < leaveStart) return;
    onApplyForLeave({ type: leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason.trim() });
    setShowLeaveForm(false);
    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
    setLeaveType('Annual');
  }

  function isWarningType(t: StaffWarning['type']): boolean {
    return t === 'Verbal Warning' || t === 'Written Warning 1' || t === 'Written Warning 2' || t === 'Final Written Warning';
  }
  function warningPillClass(t: StaffWarning['type']): string {
    if (t === 'Commendation') return 'portal-pill ok';
    if (isWarningType(t)) return 'portal-pill due';
    return 'portal-pill';
  }
  function handleAckClick(w: StaffWarning) {
    onAcknowledgeWarning(w.id, pendingSignatures[w.id] || '');
    setShowSignPadFor(null);
    setPendingSignatures((m) => { const n = { ...m }; delete n[w.id]; return n; });
  }

  const myPayslips = useMemo<Array<{ run: PayrollRun; payslip: Payslip }>>(() => {
    if (!linkedEmployee) return [];
    const out: Array<{ run: PayrollRun; payslip: Payslip }> = [];
    payrollRuns.forEach((run) => {
      run.payslips.forEach((p) => {
        if (p.employeeId === linkedEmployee.id) out.push({ run, payslip: p });
      });
    });
    return out
      .sort((a, b) => `${b.run.periodYear}-${String(b.run.periodMonth).padStart(2, '0')}`.localeCompare(`${a.run.periodYear}-${String(a.run.periodMonth).padStart(2, '0')}`))
      .slice(0, 6);
  }, [payrollRuns, linkedEmployee]);

  return (
    <section className="card">
      <SectionTitle title={`Hi ${fullName.split(' ')[0] || 'there'}`} subtitle="Everything you need to keep on top of — notices, training, payslips." />

      <div className="portal-grid">
        {/* ────────── Notices ────────── */}
        <div className="portal-card">
          <h3>📣 Notice board</h3>
          {visibleNotices.length === 0 ? (
            <div className="portal-empty">Nothing new — check back later.</div>
          ) : (
            visibleNotices.map((n) => (
              <div key={n.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{n.pinned ? '📌 ' : ''}{n.title}</strong>
                  <span>{formatDate(n.postedAt)} · {n.postedByName}</span>
                  <span style={{ color: 'var(--jp-text)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.body}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ────────── Training to acknowledge ────────── */}
        <div className="portal-card">
          <h3>🎓 Training to sign off</h3>
          {pendingTraining.length === 0 ? (
            <div className="portal-empty">All caught up — nice work.</div>
          ) : (
            pendingTraining.map((t) => (
              <div key={t.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{t.topic}</strong>
                  <span>Trained {formatDate(t.trainingDate)} by {t.trainerName || '—'}</span>
                </div>
                <button className="secondary-button" onClick={() => onAcknowledgeTraining(t.id)}>I acknowledge</button>
              </div>
            ))
          )}
        </div>

        {/* ────────── SOPs to acknowledge ────────── */}
        <div className="portal-card">
          <h3>📋 SOPs to read & acknowledge</h3>
          {pendingSops.length === 0 ? (
            <div className="portal-empty">You've acknowledged every active SOP.</div>
          ) : (
            pendingSops.map((s) => (
              <div key={s.id} className="portal-row">
                <div className="portal-row-main">
                  <strong>{s.title} <span className="muted">v{s.version}</span></strong>
                  <span>{s.category} · approved {formatDate(s.approvedDate)}</span>
                  {s.documentUrl ? <a href={s.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>Open document ↗</a> : null}
                </div>
                <button className="secondary-button" onClick={() => onAcknowledgeSop(s.id, fullName)}>I've read it</button>
              </div>
            ))
          )}
        </div>

        {/* ────────── My leave (Phase 47 self-service) ────────── */}
        <div className="portal-card">
          <h3>🏖️ My leave</h3>
          {!linkedEmployee ? (
            <div className="portal-empty">Your profile isn't linked to an employee record yet. Ask an admin to link it (Permissions page) so leave balances appear here.</div>
          ) : (
            <>
              <div className="portal-row">
                <div className="portal-row-main">
                  <strong>Annual</strong>
                  <span>{annualBal.available.toFixed(1)} of {annualBal.entitlement.toFixed(1)} days available{annualBal.pending > 0 ? ` · ${annualBal.pending} pending` : ''}</span>
                </div>
              </div>
              <div className="portal-row">
                <div className="portal-row-main">
                  <strong>Sick</strong>
                  <span>{sickBal.available.toFixed(1)} of {sickBal.entitlement.toFixed(1)} days available</span>
                </div>
              </div>
              <div className="portal-row">
                <div className="portal-row-main">
                  <strong>Family responsibility</strong>
                  <span>{familyBal.available.toFixed(1)} of {familyBal.entitlement.toFixed(1)} days available</span>
                </div>
              </div>

              {showLeaveForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
                    {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} placeholder="From" style={{ flex: 1 }} />
                    <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} placeholder="To" style={{ flex: 1 }} />
                  </div>
                  {leaveDays > 0 ? <div className="muted" style={{ fontSize: '0.78rem' }}>{leaveDays} working day{leaveDays === 1 ? '' : 's'}</div> : null}
                  <textarea rows={2} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Why do you need leave? (helps your manager approve quickly)" />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="secondary-button" disabled={!leaveStart || !leaveEnd || leaveDays === 0} onClick={submitLeave}>Submit request</button>
                    <button className="ghost-button" onClick={() => setShowLeaveForm(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="secondary-button" style={{ marginTop: 8 }} onClick={() => { setLeaveStart(new Date().toISOString().slice(0, 10)); setLeaveEnd(new Date().toISOString().slice(0, 10)); setShowLeaveForm(true); }}>Apply for leave</button>
              )}

              {myLeave.slice(0, 4).map((r) => (
                <div key={r.id} className="portal-row" style={{ marginTop: 4 }}>
                  <div className="portal-row-main">
                    <strong>{r.type} · {r.days} day{r.days === 1 ? '' : 's'}</strong>
                    <span>{formatDate(r.startDate)} → {formatDate(r.endDate)}</span>
                  </div>
                  <span className={`portal-pill ${r.status === 'Approved' || r.status === 'Taken' ? 'ok' : (r.status === 'Pending' ? 'due' : '')}`}>{r.status}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ────────── From your manager (warnings / commendations / notes) ────────── */}
        <div className="portal-card">
          <h3>💬 From your manager</h3>
          {myWarnings.length === 0 ? (
            <div className="portal-empty">No notes from your manager right now.</div>
          ) : (
            myWarnings.map((w) => {
              const needsAck = isWarningType(w.type) && !w.acknowledged;
              return (
                <div key={w.id} className="portal-row" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong>{w.type}{w.category ? ` · ${w.category}` : ''}</strong>
                    <span className={warningPillClass(w.type)}>{w.acknowledged ? '✓ Signed' : (isWarningType(w.type) ? 'Needs sign-off' : 'FYI')}</span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.78rem', marginBottom: 6 }}>
                    {formatDate(w.issuedDate)}{w.issuedByName ? ` · ${w.issuedByName}` : ''}
                  </div>
                  <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{w.description}</p>
                  {w.correctiveAction ? (
                    <p style={{ margin: '4px 0', fontStyle: 'italic' }}><strong>Agreed next steps:</strong> {w.correctiveAction}</p>
                  ) : null}
                  {w.attachmentUrl ? (
                    <a href={w.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>Open attachment ↗</a>
                  ) : null}
                  {needsAck ? (
                    showSignPadFor === w.id ? (
                      <div style={{ marginTop: 8 }}>
                        <SignaturePad
                          onChange={(d) => setPendingSignatures((m) => ({ ...m, [w.id]: d }))}
                          label="Sign to acknowledge you've received and understood this"
                          height={120}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button className="secondary-button" onClick={() => handleAckClick(w)}>I acknowledge</button>
                          <button className="ghost-button" onClick={() => setShowSignPadFor(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="secondary-button" style={{ marginTop: 6 }} onClick={() => setShowSignPadFor(w.id)}>Acknowledge & sign</button>
                    )
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* ────────── Recent payslips ────────── */}
        <div className="portal-card">
          <h3>💰 My payslips</h3>
          {!linkedEmployee ? (
            <div className="portal-empty">Your profile isn't linked to an employee record yet. Ask an admin to link it on the Permissions page so payslips appear here.</div>
          ) : myPayslips.length === 0 ? (
            <div className="portal-empty">No payslips for you yet.</div>
          ) : (
            myPayslips.map(({ run, payslip }) => (
              <div key={`${run.id}-${payslip.id}`} className="portal-row">
                <div className="portal-row-main">
                  <strong>{run.periodLabel}</strong>
                  <span>Pay date {formatDate(run.payDate)} · Net R{payslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <span className={`portal-pill ${run.status === 'Paid' ? 'ok' : 'due'}`}>{run.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
