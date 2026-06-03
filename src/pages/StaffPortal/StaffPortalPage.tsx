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
  ALL_EMPLOYEE_AVAILABILITY_STATUSES,
  Employee,
  EmployeeAvailabilityStatus,
  FACTORY_AREAS,
  FactoryArea,
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
  VisitorBooking,
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
  /** Phase 106.3 — flip my own availability status + optional delegate.
   *  Saving updates my Employee row so the visitor approval router picks
   *  it up on the very next request. */
  onUpdateAvailability?: (payload: {
    employeeId: string;
    availabilityStatus: import('../../types').EmployeeAvailabilityStatus;
    delegateApprovalToEmployeeId?: string;
  }) => void;
  /** Phase 106.4 — list of bookings I (the host) have created. */
  myVisitorBookings?: import('../../types').VisitorBooking[];
  /** Create a new pre-approved visitor booking. */
  onCreateVisitorBooking?: (payload: import('../../types').VisitorBookingFormState & { hostName: string }) => void;
  /** Cancel a booking before the visit happens. */
  onCancelVisitorBooking?: (bookingId: string) => void;
  /**
   * Phase 121 — Optional URL to a "how to use My Stuff" video the admin
   * has uploaded. Shown as a friendly link at the bottom of the page so
   * staff with limited reading can still learn the page by watching.
   */
  helpVideoUrl?: string;
}

export function StaffPortalPage({ profile, role, notices, trainingRecords, sopDocuments, payrollRuns, employees, warnings, leaveRequests, onAcknowledgeTraining, onAcknowledgeSop, onAcknowledgeWarning, onApplyForLeave, onUpdateAvailability, myVisitorBookings, onCreateVisitorBooking, onCancelVisitorBooking, helpVideoUrl }: StaffPortalPageProps) {
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

  /* Phase 106.4 — Pre-approved visitor booking draft. The host fills in
   * the visitor's name + when they're coming + which areas they're
   * pre-approved for; reception (or the kiosk) auto-matches on arrival
   * and skips the approval flow for those areas. */
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingVisitorName, setBookingVisitorName] = useState('');
  const [bookingVisitorCompany, setBookingVisitorCompany] = useState('');
  const [bookingVisitorEmail, setBookingVisitorEmail] = useState('');
  const [bookingVisitorPhone, setBookingVisitorPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [bookingAreas, setBookingAreas] = useState<FactoryArea[]>(['Reception', 'Waiting Area']);
  const [bookingPurpose, setBookingPurpose] = useState('');

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

  /**
   * Phase 121 — STAFF PORTAL REDESIGN.
   *
   * Audience: factory floor staff in South Africa, varying literacy and
   * English fluency. Design goals (Aman's direction):
   *   • Action items must "stare staff in the face" — no excuse to miss.
   *   • Big icons + colour as primary signal, text secondary.
   *   • Plain English, verb-led. No jargon ("SOP" → "work instruction",
   *     "acknowledge" → "I've read it").
   *   • Hide what's empty. Don't show "Nothing here yet" cards taking up
   *     screen real-estate next to genuine action items.
   *   • One urgent stack at the top. Quick actions below. History last.
   *   • Help-video link at the bottom for anyone who can't read fluently.
   *
   * Layout:
   *   1. Hello banner
   *   2. "DO THESE FIRST" — only renders when items exist. Big orange
   *      header, each item a tall tap-card with emoji + count + button.
   *   3. Quick Actions — 3 fat tiles: Apply for leave / See my pay /
   *      Read instructions. Always visible if employee linked. Each tile
   *      shows the relevant number ("12 leave days") so they don't have
   *      to dig.
   *   4. Expandable detail sections — Messages, Training, Work
   *      instructions, Leave history, Manager letters, Pay history.
   *      Each is collapsed by default; tap to expand. Active ones with
   *      urgent items auto-expand. Sections with nothing in them just
   *      don't render at all.
   *   5. Optional: Availability + Visitor bookings (host-side workflow).
   *   6. "Watch the how-to video" link at the bottom.
   */

  // Count what's waiting per category — drives the "DO THESE FIRST" hero.
  const newNoticeCount = visibleNotices.filter((n) => {
    // A "new" notice is one posted in the last 7 days.
    const posted = new Date(n.postedAt).getTime();
    return Date.now() - posted < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const trainingTodoCount = pendingTraining.length;
  const sopTodoCount = pendingSops.length;
  const managerTodoCount = myWarnings.filter((w) => isWarningType(w.type) && !w.acknowledged).length;
  const totalTodo = trainingTodoCount + sopTodoCount + managerTodoCount;

  // Collapsible state per detail section. Default-open only when there's
  // something the user must do.
  const [openMessages, setOpenMessages] = useState(false);
  const [openTraining, setOpenTraining] = useState(trainingTodoCount > 0);
  const [openSops, setOpenSops] = useState(sopTodoCount > 0);
  const [openLeave, setOpenLeave] = useState(false);
  const [openManager, setOpenManager] = useState(managerTodoCount > 0);
  const [openPay, setOpenPay] = useState(false);

  // Shared styles — declared inline so this card doesn't depend on
  // any new global CSS.
  const HERO_AMBER = '#f59e0b';
  const HERO_AMBER_TINT = 'rgba(245, 158, 11, 0.08)';
  const HERO_GREEN = '#22a865';
  const HERO_GREEN_TINT = 'rgba(34, 168, 101, 0.08)';
  const cardBase: React.CSSProperties = {
    border: '1px solid var(--jp-divider, #e5e7eb)',
    borderRadius: 10,
    padding: '14px 16px',
    background: 'var(--jp-paper, #fff)',
  };
  const tapRowBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 14px',
    background: 'var(--jp-paper, #fff)',
    border: '1px solid var(--jp-divider, #e5e7eb)',
    borderRadius: 10,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 15,
  };

  return (
    <section className="card" style={{ padding: '16px 18px' }}>
      <SectionTitle
        title={`Hi ${fullName.split(' ')[0] || 'there'}`}
        subtitle={totalTodo > 0 ? `You have ${totalTodo} thing${totalTodo === 1 ? '' : 's'} to do today.` : 'Nothing waiting for you. Have a good day.'}
      />

      {/* ───────────────── 1. DO THESE FIRST ─────────────────
          Big orange hero. Only renders when there's action.
          Each row is full-width and large so it's hard to miss. */}
      {totalTodo > 0 && (
        <div style={{ ...cardBase, borderColor: HERO_AMBER, background: HERO_AMBER_TINT, borderLeft: `6px solid ${HERO_AMBER}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 999,
              background: HERO_AMBER,
              color: '#fff',
              fontSize: 22,
              fontWeight: 800,
            }}>{totalTodo}</span>
            <h2 style={{ margin: 0, fontSize: 20, color: '#92400e' }}>Do these first</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trainingTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenTraining(true)}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>🎓</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{trainingTodoCount} training{trainingTodoCount === 1 ? '' : 's'} to sign</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>Show your manager you understood it</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>→</span>
              </button>
            )}
            {sopTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenSops(true)}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>📋</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{sopTodoCount} work instruction{sopTodoCount === 1 ? '' : 's'} to read</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>How we do things here. Read and tap "I've read it"</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>→</span>
              </button>
            )}
            {managerTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenManager(true)}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>💬</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{managerTodoCount} letter{managerTodoCount === 1 ? '' : 's'} from your manager</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>Read it and sign. This is on your record.</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>→</span>
              </button>
            )}
            {newNoticeCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenMessages(true)}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>📣</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{newNoticeCount} new message{newNoticeCount === 1 ? '' : 's'}</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>From the office</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── 2. ALL CLEAR (only when nothing to do) ───────────────── */}
      {totalTodo === 0 && (
        <div style={{ ...cardBase, borderColor: HERO_GREEN, background: HERO_GREEN_TINT, borderLeft: `6px solid ${HERO_GREEN}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36, lineHeight: 1 }}>✅</span>
          <div>
            <strong style={{ fontSize: 16, color: '#065f46' }}>All caught up</strong>
            <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #475569)' }}>Nothing waiting for you right now.</div>
          </div>
        </div>
      )}

      {/* ───────────────── 3. QUICK ACTIONS ─────────────────
          Three fat tiles staff can always find: leave, pay, instructions.
          Numbers visible up front so they don't have to dig. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
        {linkedEmployee && (
          <button
            type="button"
            style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}
            onClick={() => { setOpenLeave(true); setLeaveStart(new Date().toISOString().slice(0, 10)); setLeaveEnd(new Date().toISOString().slice(0, 10)); setShowLeaveForm(true); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>🏖️</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 16 }}>Apply for leave</strong>
                <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{annualBal.available.toFixed(0)} days available</div>
              </div>
            </div>
          </button>
        )}
        {linkedEmployee && myPayslips.length > 0 && (
          <button
            type="button"
            style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}
            onClick={() => setOpenPay(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>💰</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 16 }}>See my pay</strong>
                <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>Last: {myPayslips[0].run.periodLabel}</div>
              </div>
            </div>
          </button>
        )}
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}
          onClick={() => setOpenSops(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>📋</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 16 }}>Read work instructions</strong>
              <div style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{pendingSops.length > 0 ? `${pendingSops.length} new to read` : 'All read'}</div>
            </div>
          </div>
        </button>
      </div>

      {/* ───────────────── 4. EXPANDABLE DETAIL SECTIONS ─────────────────
          Each section is a tap-to-expand header + content. Sections with
          no data don't render at all. Sections with action items have
          been auto-expanded above (openTraining/openSops/openManager). */}

      <div className="portal-grid">
        {/* Phase 106.3 — Availability picker. Visible to every staff
            member who has an Employee record linked. Drives the visitor
            approval router: when status='Available', visitor requests
            come straight here. When Busy / On the road / etc, the
            system auto-routes to the backup approver set in their
            Employee profile. When 'Delegate', requests go to the
            picked delegate employee. */}
        {linkedEmployee && onUpdateAvailability && (
          <div className="portal-card">
            <h3>My availability</h3>
            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              When you're not Available, visitor approval requests for areas you host
              are auto-routed to your backup.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {ALL_EMPLOYEE_AVAILABILITY_STATUSES.map((status) => {
                const active = (linkedEmployee.availabilityStatus ?? 'Available') === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onUpdateAvailability({
                      employeeId: linkedEmployee.id,
                      availabilityStatus: status as EmployeeAvailabilityStatus,
                      delegateApprovalToEmployeeId: linkedEmployee.delegateApprovalToEmployeeId,
                    })}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: `1px solid ${active ? 'var(--jp-ink-2, #475569)' : 'var(--jp-divider, #cbd5e1)'}`,
                      background: active ? 'var(--jp-ink-1, #1e293b)' : 'transparent',
                      color: active ? 'var(--jp-paper, #fff)' : 'var(--jp-ink-2, #475569)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            {(linkedEmployee.availabilityStatus ?? 'Available') === 'Delegate' && (
              <label style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
                <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Delegate approvals to:</span>
                <select
                  value={linkedEmployee.delegateApprovalToEmployeeId ?? ''}
                  onChange={(e) => onUpdateAvailability({
                    employeeId: linkedEmployee.id,
                    availabilityStatus: 'Delegate',
                    delegateApprovalToEmployeeId: e.target.value || undefined,
                  })}
                  style={{ width: '100%', padding: '6px 8px' }}
                >
                  <option value="">— Pick a colleague —</option>
                  {employees
                    .filter((e) => e.id !== linkedEmployee.id && e.active)
                    .map((e) => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.jobTitle || e.department}</option>
                    ))}
                </select>
              </label>
            )}
            {!linkedEmployee.backupApproverEmployeeId && linkedEmployee.availabilityStatus && linkedEmployee.availabilityStatus !== 'Available' && (
              <div style={{ marginTop: 10, padding: 8, background: 'rgba(184,134,11,0.08)', borderLeft: '3px solid #b8860b', fontSize: 12 }}>
                Heads up — you don't have a backup approver set on your Employee profile, so visitor approvals will still come to you even while you're {linkedEmployee.availabilityStatus.toLowerCase()}. Ask admin to set one.
              </div>
            )}
          </div>
        )}

        {/* Phase 106.4 — Visitor bookings (pre-approval).
            Hosts can create a booking for a visitor in advance, picking
            which areas they're allowed in + a time window. When the
            visitor arrives, reception's verify panel auto-matches by name
            and skips the approval flow for the pre-approved areas. */}
        {linkedEmployee && onCreateVisitorBooking && (
          <div className="portal-card">
            <h3>Visitor bookings</h3>
            <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
              Pre-approve a visitor so reception can let them through without phoning you.
            </p>

            {/* List of my upcoming + active bookings */}
            {(myVisitorBookings ?? []).length === 0 ? (
              <div className="portal-empty">No bookings yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {(myVisitorBookings ?? [])
                  .slice()
                  .sort((a, b) => a.visitDate.localeCompare(b.visitDate))
                  .slice(0, 8)
                  .map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: b.status === 'active' ? 'rgba(46,111,62,0.06)' : 'var(--jp-paper, #fff)',
                        border: '1px solid var(--jp-divider, #cbd5e1)',
                        fontSize: 13,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{b.visitorName}</strong>{b.visitorCompany ? ` · ${b.visitorCompany}` : ''}
                        <div className="muted" style={{ fontSize: 11 }}>
                          {formatDate(b.visitDate)}{b.startTime ? ` · ${b.startTime}${b.endTime ? '–' + b.endTime : ''}` : ''} · {b.allowedAreas.length} area(s)
                          {b.status !== 'created' ? ` · ${b.status}` : ''}
                        </div>
                      </div>
                      {b.status === 'created' && onCancelVisitorBooking && (
                        <button
                          type="button"
                          onClick={() => onCancelVisitorBooking(b.id)}
                          className="ghost-button"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                        >Cancel</button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {!showBookingForm ? (
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: 10 }}
                onClick={() => setShowBookingForm(true)}
              >Book a visitor</button>
            ) : (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(46,111,62,0.04)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 13 }}>
                  <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Visitor name *</span>
                  <input value={bookingVisitorName} onChange={(e) => setBookingVisitorName(e.target.value)} placeholder="John Smith" style={{ width: '100%', padding: '6px 8px' }} />
                </label>
                <label style={{ fontSize: 13 }}>
                  <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Company</span>
                  <input value={bookingVisitorCompany} onChange={(e) => setBookingVisitorCompany(e.target.value)} placeholder="ABC Foods" style={{ width: '100%', padding: '6px 8px' }} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label style={{ fontSize: 13 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Email</span>
                    <input type="email" value={bookingVisitorEmail} onChange={(e) => setBookingVisitorEmail(e.target.value)} style={{ width: '100%', padding: '6px 8px' }} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Phone</span>
                    <input value={bookingVisitorPhone} onChange={(e) => setBookingVisitorPhone(e.target.value)} style={{ width: '100%', padding: '6px 8px' }} />
                  </label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                  <label style={{ fontSize: 13 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Date *</span>
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={{ width: '100%', padding: '6px 8px' }} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>From</span>
                    <input type="time" value={bookingStart} onChange={(e) => setBookingStart(e.target.value)} style={{ width: '100%', padding: '6px 8px' }} />
                  </label>
                  <label style={{ fontSize: 13 }}>
                    <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>To</span>
                    <input type="time" value={bookingEnd} onChange={(e) => setBookingEnd(e.target.value)} style={{ width: '100%', padding: '6px 8px' }} />
                  </label>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Areas they're allowed in *</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {FACTORY_AREAS.map((a) => {
                      const active = bookingAreas.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setBookingAreas(active ? bookingAreas.filter((x) => x !== a) : [...bookingAreas, a])}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: `1px solid ${active ? 'var(--jp-ink-2, #475569)' : 'var(--jp-divider, #cbd5e1)'}`,
                            background: active ? 'var(--jp-ink-1, #1e293b)' : 'transparent',
                            color: active ? 'var(--jp-paper, #fff)' : 'var(--jp-ink-2, #475569)',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >{a}</button>
                      );
                    })}
                  </div>
                </div>
                <label style={{ fontSize: 13 }}>
                  <span style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Purpose</span>
                  <input value={bookingPurpose} onChange={(e) => setBookingPurpose(e.target.value)} placeholder="Discovery meeting" style={{ width: '100%', padding: '6px 8px' }} />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!bookingVisitorName.trim() || !bookingDate || bookingAreas.length === 0}
                    onClick={() => {
                      onCreateVisitorBooking({
                        visitorName: bookingVisitorName.trim(),
                        visitorCompany: bookingVisitorCompany.trim(),
                        visitorEmail: bookingVisitorEmail.trim(),
                        visitorPhone: bookingVisitorPhone.trim(),
                        hostEmployeeId: linkedEmployee.id,
                        hostName: `${linkedEmployee.firstName} ${linkedEmployee.lastName}`.trim(),
                        visitDate: bookingDate,
                        startTime: bookingStart,
                        endTime: bookingEnd,
                        allowedAreas: bookingAreas,
                        purpose: bookingPurpose.trim(),
                        notes: '',
                      });
                      // Clear + close the form for the next booking.
                      setBookingVisitorName('');
                      setBookingVisitorCompany('');
                      setBookingVisitorEmail('');
                      setBookingVisitorPhone('');
                      setBookingDate('');
                      setBookingStart('');
                      setBookingEnd('');
                      setBookingAreas(['Reception', 'Waiting Area']);
                      setBookingPurpose('');
                      setShowBookingForm(false);
                    }}
                  >Create booking</button>
                  <button type="button" className="ghost-button" onClick={() => setShowBookingForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────── Messages from the office ──────────
            Hidden entirely when there are zero notices, so we never
            show "Nothing here yet" cards eating space. */}
        {visibleNotices.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenMessages((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>📣</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Messages from the office</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{visibleNotices.length} message{visibleNotices.length === 1 ? '' : 's'}</span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openMessages ? '▾' : '▸'}</span>
            </button>
            {openMessages && (
              <div style={{ padding: '0 16px 14px' }}>
                {visibleNotices.map((n) => (
                  <div key={n.id} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{n.pinned ? '📌 ' : ''}{n.title}</strong>
                      <span>{formatDate(n.postedAt)} · {n.postedByName}</span>
                      <span style={{ color: 'var(--jp-text)', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.body}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────── Training to sign ──────────
            Hidden when nothing pending. Auto-expanded if there is. */}
        {pendingTraining.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${HERO_AMBER}` }}>
            <button
              type="button"
              onClick={() => setOpenTraining((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>🎓</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Training to sign</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: HERO_AMBER }}>{pendingTraining.length} to do</span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openTraining ? '▾' : '▸'}</span>
            </button>
            {openTraining && (
              <div style={{ padding: '0 16px 14px' }}>
                {pendingTraining.map((t) => (
                  <div key={t.id} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{t.topic}</strong>
                      <span>Trained {formatDate(t.trainingDate)} by {t.trainerName || '—'}</span>
                    </div>
                    <button className="secondary-button" onClick={() => onAcknowledgeTraining(t.id)}>I&apos;ve done it</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────── Work instructions ──────────
            SOP is jargon; staff call them "work instructions". */}
        {pendingSops.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${HERO_AMBER}` }}>
            <button
              type="button"
              onClick={() => setOpenSops((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>📋</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Work instructions to read</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: HERO_AMBER }}>{pendingSops.length} to read</span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openSops ? '▾' : '▸'}</span>
            </button>
            {openSops && (
              <div style={{ padding: '0 16px 14px' }}>
                {pendingSops.map((s) => (
                  <div key={s.id} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{s.title} <span className="muted">v{s.version}</span></strong>
                      <span>{s.category} · approved {formatDate(s.approvedDate)}</span>
                      {s.documentUrl ? <a href={s.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>Open document ↗</a> : null}
                    </div>
                    <button className="secondary-button" onClick={() => onAcknowledgeSop(s.id, fullName)}>I&apos;ve read it</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────── My leave ──────────
            Only renders when linkedEmployee exists. We don't show the
            "your profile isn't linked" admin-jargon error any more —
            admin should see that in their own dashboard, not the staff. */}
        {linkedEmployee && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenLeave((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>🏖️</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>My leave</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{annualBal.available.toFixed(0)} days left</span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openLeave ? '▾' : '▸'}</span>
            </button>
            {openLeave && (
              <div style={{ padding: '0 16px 14px' }}>
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
              </div>
            )}
          </div>
        )}

        {/* ────────── Letters from your manager ──────────
            "Warnings / commendations / notes" — staff understand
            "letter from the boss". Hidden when nothing. */}
        {myWarnings.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden', borderLeft: managerTodoCount > 0 ? `4px solid ${HERO_AMBER}` : '4px solid transparent' }}>
            <button
              type="button"
              onClick={() => setOpenManager((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>💬</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Letters from your manager</h3>
              <span style={{ fontSize: 12, fontWeight: managerTodoCount > 0 ? 700 : 400, color: managerTodoCount > 0 ? HERO_AMBER : 'var(--jp-ink-3, #64748b)' }}>
                {managerTodoCount > 0 ? `${managerTodoCount} to sign` : `${myWarnings.length} letter${myWarnings.length === 1 ? '' : 's'}`}
              </span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openManager ? '▾' : '▸'}</span>
            </button>
            {openManager && (
              <div style={{ padding: '0 16px 14px' }}>
                {myWarnings.map((w) => {
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
              })}
              </div>
            )}
          </div>
        )}

        {/* ────────── My pay history ──────────
            Hidden if no linked employee or no payslips. */}
        {linkedEmployee && myPayslips.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenPay((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 24 }}>💰</span>
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>My pay history</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{myPayslips.length} pay{myPayslips.length === 1 ? 'slip' : 'slips'}</span>
              <span style={{ fontSize: 18, color: 'var(--jp-ink-3, #64748b)' }}>{openPay ? '▾' : '▸'}</span>
            </button>
            {openPay && (
              <div style={{ padding: '0 16px 14px' }}>
                {myPayslips.map(({ run, payslip }) => (
                  <div key={`${run.id}-${payslip.id}`} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{run.periodLabel}</strong>
                      <span>Pay date {formatDate(run.payDate)} · Net R{payslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <span className={`portal-pill ${run.status === 'Paid' ? 'ok' : 'due'}`}>{run.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────────── 6. HELP VIDEO LINK ─────────────────
          Quiet card at the bottom. Anyone unsure of how to use the
          page can watch a video instead of reading. helpVideoUrl is
          optional — comes from Settings (Aman will upload his videos). */}
      {helpVideoUrl && (
        <a
          href={helpVideoUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 18,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px dashed #3b82f6',
            color: '#1e40af',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <span style={{ fontSize: 28 }}>▶️</span>
          <span><strong>Watch how to use this page</strong><div style={{ fontSize: 12, color: '#475569' }}>Step-by-step video</div></span>
        </a>
      )}
    </section>
  );
}
