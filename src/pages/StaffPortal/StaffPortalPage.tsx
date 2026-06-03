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

import { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import { SignaturePad } from '../../components/SignaturePad';
import {
  ALL_EMPLOYEE_AVAILABILITY_STATUSES,
  DocumentRecord,
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
  PpeIssueRecord,
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
  /**
   * Phase 122.3 — PPE issued to this staff member, filtered in the parent
   * via linkedEmployeeId. Drives the "PPE issued to you" panel.
   */
  ppeIssueRecords?: PpeIssueRecord[];
  /**
   * Phase 122.3 — Submit a "request a replacement" PPE row from the
   * staff portal. Creates a Request-type record the admin can action.
   */
  onRequestPpeReplacement?: (originalRecord: PpeIssueRecord) => void;
  /**
   * Phase 121.7 — HR documents (contracts, leave letters, etc.) from
   * the Doc Vault. Filtered in the parent to ownerType==='employee'.
   * The portal further filters to the linked employee's documents.
   */
  documents?: DocumentRecord[];
  /**
   * Phase 124.2 — One-click self-link. The "NOT LINKED" card shows an
   * employee picker so a staff member (or the CEO) can attach their
   * own Employee record without going via Settings → Permissions.
   * Calls saveProfile() upstream with linkedEmployeeId set.
   */
  onLinkEmployee?: (employeeId: string) => void;
}

export function StaffPortalPage({ profile, role, notices, trainingRecords, sopDocuments, payrollRuns, employees, warnings, leaveRequests, onAcknowledgeTraining, onAcknowledgeSop, onAcknowledgeWarning, onApplyForLeave, onUpdateAvailability, myVisitorBookings, onCreateVisitorBooking, onCancelVisitorBooking, helpVideoUrl, ppeIssueRecords = [], onRequestPpeReplacement, documents = [], onLinkEmployee }: StaffPortalPageProps) {
  const fullName = profile.fullName || profile.email || '';
  const today = new Date().toISOString().slice(0, 10);

  // Resolve the staff member's linked employee record. Prefer the explicit
  // linkedEmployeeId set by an admin in Permissions; otherwise fall back to
  // a name match so new users see something useful right away.
  /**
   * Phase 121.7 — Resolve the linked Employee record. Priority:
   *   1. Explicit linkedEmployeeId from admin (Permissions page)
   *   2. Email match against Employee.email (so Aman just needs to put
   *      his work email on his own Employee record and it auto-links)
   *   3. Name match against firstName + lastName (legacy fallback)
   */
  const linkedEmployee = useMemo<Employee | undefined>(() => {
    if (profile.linkedEmployeeId) {
      const byId = employees.find((e) => e.id === profile.linkedEmployeeId);
      if (byId) return byId;
    }
    const lowerEmail = (profile.email || '').trim().toLowerCase();
    if (lowerEmail) {
      const byEmail = employees.find((e) => (e.email || '').trim().toLowerCase() === lowerEmail);
      if (byEmail) return byEmail;
    }
    return employees.find((e) => `${e.firstName} ${e.lastName}`.trim().toLowerCase() === fullName.trim().toLowerCase());
  }, [profile.linkedEmployeeId, profile.email, employees, fullName]);

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
  // Phase 122.3 — PPE issued to this staff member. Filter on
  // linkedEmployeeId. Open by default if there's overdue kit.
  const myPpe = useMemo<PpeIssueRecord[]>(() => {
    if (!linkedEmployee) return [];
    return ppeIssueRecords
      .filter((r) => r.employeeId === linkedEmployee.id)
      .sort((a, b) => (b.issuedDate || '').localeCompare(a.issuedDate || ''));
  }, [ppeIssueRecords, linkedEmployee]);
  const todayYMD = new Date().toISOString().slice(0, 10);
  const ppeOverdueCount = myPpe.filter((r) => r.status === 'Issued' && r.replacementDueDate && r.replacementDueDate < todayYMD).length;
  const ppeInUseCount = myPpe.filter((r) => r.status === 'Issued').length;
  const [openPpe, setOpenPpe] = useState(ppeOverdueCount > 0);
  // Phase 121.7 — My documents (contracts, leave letters, etc.) from
  // the Doc Vault. Filter to ownerType === 'employee' AND ownerId
  // matches the linked employee. Sorted most-recent first.
  const myDocuments = useMemo<DocumentRecord[]>(() => {
    if (!linkedEmployee) return [];
    return documents
      .filter((d) => d.ownerType === 'employee' && d.ownerId === linkedEmployee.id)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [documents, linkedEmployee]);
  const [openDocs, setOpenDocs] = useState(false);

  // Phase 124.2 — Inline employee picker on the NOT LINKED notice.
  // Pre-select the best guess if we can find one by name match against
  // the email local-part, e.g. "aman@..." → "Aman ..." in employees list.
  const suggestedEmployeeId = useMemo(() => {
    if (linkedEmployee) return '';
    const email = (profile.email || '').toLowerCase();
    const local = email.includes('@') ? email.split('@')[0].replace(/[._-]+/g, ' ').trim() : '';
    if (!local) return '';
    const firstWord = local.split(/\s+/)[0];
    // Prefer firstName start-with match, fall back to last name match.
    const byFirst = employees.find((e) => (e.firstName || '').toLowerCase().startsWith(firstWord));
    if (byFirst) return byFirst.id;
    const byLast = employees.find((e) => (e.lastName || '').toLowerCase().startsWith(firstWord));
    return byLast?.id || '';
  }, [linkedEmployee, profile.email, employees]);
  const [pickEmployeeId, setPickEmployeeId] = useState<string>('');
  // Promote the suggestion into the picker once employees finish loading.
  useEffect(() => { if (!pickEmployeeId && suggestedEmployeeId) setPickEmployeeId(suggestedEmployeeId); }, [suggestedEmployeeId, pickEmployeeId]);

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

  /**
   * Phase 121.8 — Smarter greeting.
   * Priority for the first-name display:
   *   1. Linked Employee's firstName (the canonical source once linked)
   *   2. profile.fullName split on first space ("Aman Singh" → "Aman")
   *   3. profile.email local-part before "@" ("aman@jomopak.co.za" → "aman")
   *   4. "there"
   * Then capitalises the first letter so "aman" → "Aman".
   */
  const greetingName = (() => {
    if (linkedEmployee?.firstName) return linkedEmployee.firstName;
    const trimmed = (profile.fullName || '').trim();
    if (trimmed && !trimmed.includes('@')) {
      const first = trimmed.split(/\s+/)[0];
      if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    }
    const email = profile.email || '';
    if (email.includes('@')) {
      const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
      if (local) {
        const first = local.split(/\s+/)[0];
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }
    return 'there';
  })();

  return (
    <section className="card" style={{ padding: '16px 18px' }}>
      <SectionTitle
        title={`Hi ${greetingName}`}
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
          {/* Phase 121 — Per Aman: no emojis. Each tap-row uses a colored
              count chip as the icon, so the NUMBER is the visual signal. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trainingTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenTraining(true)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: HERO_AMBER, color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{trainingTodoCount}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>Training{trainingTodoCount === 1 ? '' : 's'} to sign</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>Show your manager you understood it</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>{'>'}</span>
              </button>
            )}
            {sopTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenSops(true)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: HERO_AMBER, color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{sopTodoCount}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>Work instruction{sopTodoCount === 1 ? '' : 's'} to read</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>How we do things here. Read and tap &ldquo;I&apos;ve read it&rdquo;</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>{'>'}</span>
              </button>
            )}
            {managerTodoCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenManager(true)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: HERO_AMBER, color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{managerTodoCount}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>Letter{managerTodoCount === 1 ? '' : 's'} from your manager</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>Read it and sign. This is on your record.</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>{'>'}</span>
              </button>
            )}
            {newNoticeCount > 0 && (
              <button type="button" style={tapRowBase} onClick={() => setOpenMessages(true)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10, background: HERO_AMBER, color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{newNoticeCount}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>New message{newNoticeCount === 1 ? '' : 's'}</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>From the office</span>
                </span>
                <span style={{ color: HERO_AMBER, fontWeight: 700, fontSize: 22 }}>{'>'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── 2. ALL CLEAR (only when nothing to do) ─────────────────
          No tick / no emoji. Green colour + uppercase ALL CLEAR badge
          carries the meaning. */}
      {totalTodo === 0 && (
        <div style={{ ...cardBase, borderColor: HERO_GREEN, background: HERO_GREEN_TINT, borderLeft: `6px solid ${HERO_GREEN}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            borderRadius: 6,
            background: HERO_GREEN,
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}>ALL CLEAR</span>
          <div>
            <strong style={{ fontSize: 16, color: '#065f46' }}>Nothing waiting for you right now.</strong>
            <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #475569)' }}>Have a good day.</div>
          </div>
        </div>
      )}

      {/* ───────────────── 2b. NOT LINKED NOTICE ─────────────────
          Phase 121.7 — When the signed-in profile has no linked Employee
          record, almost everything on this page sits empty (no pay, no
          leave balance, no PPE, no warnings, no profile details). Tell
          the user clearly instead of silently hiding things — this was
          the "where's all my stuff?" complaint. */}
      {!linkedEmployee && (
        <div style={{
          ...cardBase,
          borderColor: HERO_AMBER,
          background: HERO_AMBER_TINT,
          borderLeft: `6px solid ${HERO_AMBER}`,
          marginBottom: 16,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <span style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: HERO_AMBER,
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              flexShrink: 0,
            }}>NOT LINKED</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 15, color: '#92400e' }}>Your account isn&apos;t linked to an Employee record yet</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78350f' }}>
                Until this is linked, this page can&apos;t show your payslips, leave balance, PPE, contracts, or letters from your manager.
              </p>
            </div>
          </div>

          {/* Phase 124.2 — Inline self-link picker. No need to go to
              Settings → Permissions; just pick yourself and tap Link. */}
          {onLinkEmployee && employees.length > 0 ? (
            <div style={{
              background: 'var(--jp-paper, #fff)',
              border: '1px solid #fcd34d',
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 240px', minWidth: 220 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)', marginBottom: 4 }}>
                  I AM
                </label>
                <select
                  value={pickEmployeeId}
                  onChange={(e) => setPickEmployeeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 14,
                    borderRadius: 6,
                    border: '1px solid var(--jp-divider, #d1d5db)',
                    background: 'var(--jp-paper, #fff)',
                  }}
                >
                  <option value="">— pick your Employee record —</option>
                  {[...employees]
                    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}{e.employeeNumber ? ` — ${e.employeeNumber}` : ''}{e.jobTitle ? ` (${e.jobTitle})` : ''}
                      </option>
                    ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!pickEmployeeId}
                onClick={() => { if (pickEmployeeId) onLinkEmployee(pickEmployeeId); }}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: 'none',
                  background: pickEmployeeId ? HERO_AMBER : '#d4d4d8',
                  color: '#fff',
                  cursor: pickEmployeeId ? 'pointer' : 'not-allowed',
                }}
              >
                Link my account
              </button>
            </div>
          ) : null}

          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--jp-ink-3, #475569)' }}>
            Don&apos;t see yourself in the list? Ask the admin to create an Employee record for you first.
            Once your Employee record has the email <strong>{profile.email || '—'}</strong>, this page will auto-link next time you sign in.
          </p>
        </div>
      )}

      {/* ───────────────── 2c. MY PROFILE ─────────────────
          Phase 121.7 — Basic employee details so staff can sanity-check
          their own record. Always visible when linked. */}
      {linkedEmployee && (
        <div style={{ ...cardBase, marginBottom: 16, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>MY PROFILE</span>
              <h3 style={{ margin: '2px 0 0', fontSize: 16 }}>{linkedEmployee.firstName} {linkedEmployee.lastName}</h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{linkedEmployee.employeeNumber || '—'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Job</div>
              <div>{linkedEmployee.jobTitle || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{linkedEmployee.department || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact</div>
              <div>{linkedEmployee.email || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{linkedEmployee.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Started</div>
              <div>{linkedEmployee.startDate ? formatDate(linkedEmployee.startDate) : '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{linkedEmployee.payCycle || '—'} pay</div>
            </div>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
            Something wrong here? Ask admin to update your record on the Employees page.
          </p>
        </div>
      )}

      {/* ───────────────── 3. QUICK ACTIONS ─────────────────
          Three fat tiles staff can always find: leave, pay, instructions.
          Numbers visible up front so they don't have to dig. */}
      {/* No emojis. Each tile uses an uppercase category banner across
          the top to identify it, big bold action verb, and the live
          number so they don't have to dig. */}
      {/* Quick Action tiles are ALWAYS visible. Tiles requiring a
          linked employee render in a disabled state with a hint instead
          of disappearing, so the menu doesn't look empty. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
        <button
          type="button"
          disabled={!linkedEmployee}
          style={{
            ...cardBase,
            cursor: linkedEmployee ? 'pointer' : 'not-allowed',
            opacity: linkedEmployee ? 1 : 0.55,
            textAlign: 'left',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderTop: `4px solid var(--jp-ink-2, #475569)`,
          }}
          onClick={() => { if (!linkedEmployee) return; setOpenLeave(true); setLeaveStart(new Date().toISOString().slice(0, 10)); setLeaveEnd(new Date().toISOString().slice(0, 10)); setShowLeaveForm(true); }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>LEAVE</span>
          <strong style={{ fontSize: 18 }}>Apply for leave</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{linkedEmployee ? `${annualBal.available.toFixed(0)} days available` : 'Link your profile to use this'}</div>
        </button>
        <button
          type="button"
          disabled={!linkedEmployee || myPayslips.length === 0}
          style={{
            ...cardBase,
            cursor: (linkedEmployee && myPayslips.length > 0) ? 'pointer' : 'not-allowed',
            opacity: (linkedEmployee && myPayslips.length > 0) ? 1 : 0.55,
            textAlign: 'left',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            borderTop: `4px solid var(--jp-ink-2, #475569)`,
          }}
          onClick={() => { if (linkedEmployee && myPayslips.length > 0) setOpenPay(true); }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>PAY</span>
          <strong style={{ fontSize: 18 }}>See my pay</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>
            {!linkedEmployee ? 'Link your profile to use this' : myPayslips.length > 0 ? `Last: ${myPayslips[0].run.periodLabel}` : 'No payslips yet'}
          </div>
        </button>
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: `4px solid var(--jp-ink-2, #475569)` }}
          onClick={() => setOpenSops(true)}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>WORK INSTRUCTIONS</span>
          <strong style={{ fontSize: 18 }}>Read work instructions</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{pendingSops.length > 0 ? `${pendingSops.length} new to read` : 'All read'}</div>
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Messages from the office</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{visibleNotices.length} message{visibleNotices.length === 1 ? '' : 's'}</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openMessages ? '−' : '+'}</span>
            </button>
            {openMessages && (
              <div style={{ padding: '0 16px 14px' }}>
                {visibleNotices.map((n) => (
                  <div key={n.id} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{n.pinned ? <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 4, background: HERO_AMBER, color: '#fff', marginRight: 6 }}>PINNED</span> : null}{n.title}</strong>
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Training to sign</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: HERO_AMBER }}>{pendingTraining.length} to do</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openTraining ? '−' : '+'}</span>
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Work instructions to read</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: HERO_AMBER }}>{pendingSops.length} to read</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openSops ? '−' : '+'}</span>
            </button>
            {openSops && (
              <div style={{ padding: '0 16px 14px' }}>
                {pendingSops.map((s) => (
                  <div key={s.id} className="portal-row">
                    <div className="portal-row-main">
                      <strong>{s.title} <span className="muted">v{s.version}</span></strong>
                      <span>{s.category} · approved {formatDate(s.approvedDate)}</span>
                      {s.documentUrl ? <a href={s.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>Open document</a> : null}
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>My leave</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{annualBal.available.toFixed(0)} days left</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openLeave ? '−' : '+'}</span>
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>Letters from your manager</h3>
              <span style={{ fontSize: 12, fontWeight: managerTodoCount > 0 ? 700 : 400, color: managerTodoCount > 0 ? HERO_AMBER : 'var(--jp-ink-3, #64748b)' }}>
                {managerTodoCount > 0 ? `${managerTodoCount} to sign` : `${myWarnings.length} letter${myWarnings.length === 1 ? '' : 's'}`}
              </span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openManager ? '−' : '+'}</span>
            </button>
            {openManager && (
              <div style={{ padding: '0 16px 14px' }}>
                {myWarnings.map((w) => {
              const needsAck = isWarningType(w.type) && !w.acknowledged;
              return (
                <div key={w.id} className="portal-row" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong>{w.type}{w.category ? ` · ${w.category}` : ''}</strong>
                    <span className={warningPillClass(w.type)}>{w.acknowledged ? 'Signed' : (isWarningType(w.type) ? 'Needs sign-off' : 'FYI')}</span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.78rem', marginBottom: 6 }}>
                    {formatDate(w.issuedDate)}{w.issuedByName ? ` · ${w.issuedByName}` : ''}
                  </div>
                  <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{w.description}</p>
                  {w.correctiveAction ? (
                    <p style={{ margin: '4px 0', fontStyle: 'italic' }}><strong>Agreed next steps:</strong> {w.correctiveAction}</p>
                  ) : null}
                  {w.attachmentUrl ? (
                    <a href={w.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>Open attachment</a>
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
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>My pay history</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{myPayslips.length} pay{myPayslips.length === 1 ? 'slip' : 'slips'}</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openPay ? '−' : '+'}</span>
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

        {/* ────────── My PPE — Phase 122.3 ──────────
            Read-only list of PPE issued to this staff member.
            Overdue replacement → orange accent + auto-expand.
            "Request replacement" button creates a PPE Request row
            for admin to action. */}
        {linkedEmployee && myPpe.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden', borderLeft: ppeOverdueCount > 0 ? `4px solid ${HERO_AMBER}` : '4px solid transparent' }}>
            <button
              type="button"
              onClick={() => setOpenPpe((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>PPE issued to you</h3>
              <span style={{ fontSize: 12, fontWeight: ppeOverdueCount > 0 ? 700 : 400, color: ppeOverdueCount > 0 ? HERO_AMBER : 'var(--jp-ink-3, #64748b)' }}>
                {ppeOverdueCount > 0 ? `${ppeOverdueCount} due for replacement` : `${ppeInUseCount} item${ppeInUseCount === 1 ? '' : 's'}`}
              </span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openPpe ? '−' : '+'}</span>
            </button>
            {openPpe && (
              <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myPpe.map((r) => {
                  const overdue = r.status === 'Issued' && !!r.replacementDueDate && r.replacementDueDate < todayYMD;
                  const inUse = r.status === 'Issued';
                  const lineLabel = (r.items && r.items.length > 0)
                    ? r.items.map((i) => `${i.quantity}× ${i.type}`).join(', ')
                    : `${r.quantity}× ${r.itemType}`;
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        border: '1px solid var(--jp-divider, #e2e8f0)',
                        borderLeft: `4px solid ${overdue ? '#db5a1f' : inUse ? '#22a865' : '#94a3b8'}`,
                        borderRadius: 8,
                        background: '#fff',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 14 }}>{lineLabel}</strong>
                        <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
                          Issued {formatDate(r.issuedDate)}
                          {r.replacementDueDate ? <> · Replace by <span style={{ color: overdue ? '#9a3412' : 'inherit', fontWeight: overdue ? 700 : 400 }}>{formatDate(r.replacementDueDate)}</span></> : null}
                          {' · '}{r.status}
                        </div>
                      </div>
                      {inUse && onRequestPpeReplacement ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => onRequestPpeReplacement(r)}
                          title="Tell the office you need a new one"
                          style={{ flexShrink: 0 }}
                        >Request replacement</button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ────────── My documents — Phase 121.7 ──────────
            Contracts, leave letters, ID copies, etc. Pulled from the
            Doc Vault filtered to this employee. */}
        {linkedEmployee && myDocuments.length > 0 && (
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setOpenDocs((v) => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <h3 style={{ margin: 0, flex: 1, fontSize: 16 }}>My documents</h3>
              <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{myDocuments.length} document{myDocuments.length === 1 ? '' : 's'}</span>
              <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center' }}>{openDocs ? '−' : '+'}</span>
            </button>
            {openDocs && (
              <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myDocuments.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      border: '1px solid var(--jp-divider, #e2e8f0)',
                      borderRadius: 8,
                      background: '#fff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 14 }}>{d.title || d.fileName || 'Document'}</strong>
                      <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
                        {d.category || 'Document'}
                        {d.createdAt ? ` · uploaded ${formatDate(d.createdAt)}` : ''}
                        {d.uploadedByName ? ` by ${d.uploadedByName}` : ''}
                      </div>
                    </div>
                    {d.fileUrl ? (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary-button"
                        style={{ flexShrink: 0, textDecoration: 'none' }}
                      >Open</a>
                    ) : null}
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
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', padding: '6px 10px', borderRadius: 6, background: '#3b82f6', color: '#fff' }}>VIDEO</span>
          <span><strong>Watch how to use this page</strong><div style={{ fontSize: 12, color: '#475569' }}>Step-by-step video</div></span>
        </a>
      )}
    </section>
  );
}
