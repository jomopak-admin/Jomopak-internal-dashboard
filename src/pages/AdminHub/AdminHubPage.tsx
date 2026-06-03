/**
 * Phase 101 — Admin Hub.
 *
 * One landing page for everything an admin does that doesn't have an
 * obvious home in the sidebar nav. Replaces the "where do I go to change
 * paper rates? to grant a new user? to post a notice?" hunt.
 *
 * The page is structured as a grid of section cards. Each card has:
 *   1. A title + one-line subtitle.
 *   2. Live counts (so you can see the queue depth without clicking).
 *   3. 3-6 quick-action buttons that just `setView('thatPage')` —
 *      no logic lives here, everything jumps to the proper page.
 *   4. Optional inline "do it now" forms for the most-frequent actions
 *      (post a notice, grant a permission, add a user, etc.) — added in
 *      future passes when we know which are most painful.
 *
 * Admin-role-only. Sidebar role gate filters it out for everyone else.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppData,
  UserProfile,
  View,
} from '../../types';
import { formatNumber } from '../../utils/calculations';

interface AdminHubPageProps {
  data: AppData;
  profile: UserProfile | null;
  /** Switch the main view to the given page. */
  goTo: (view: View) => void;
  /** Phase 113 — Switch the view AND deliver an "intent" so the target page
   *  can act on landing (e.g. open the new-record form instead of dumping
   *  the user on the list). */
  goToWithIntent?: (view: View, intent: string) => void;
}

export function AdminHubPage({ data, profile, goTo, goToWithIntent }: AdminHubPageProps) {
  /** Phase 113 — Convenience that prefers goToWithIntent when available
   *  and falls back to plain goTo. Means action handlers stay terse. */
  function goToNew(view: View) {
    if (goToWithIntent) goToWithIntent(view, 'new');
    else goTo(view);
  }
  // ────────────────────────────────────────────────────────────────────
  // Live counts per section — kept lean. A heavier admin queue page can
  // come later if you want it; for now we surface the headline number.
  // ────────────────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const notices = data.notices?.length ?? 0;
    // Notices don't have a built-in ack tracker yet; treat all as active.
    const noticesUnack = (data.notices ?? []).filter((n) => !n.expiresAt || n.expiresAt >= today).length;

    const users = (profile ? 1 : 0); // we don't have full profile list here; count rendered later from props if added
    const employees = (data.employees ?? []).filter((e) => e.active).length;

    // StaffWarning doesn't have a closedAt; treat unacknowledged as 'open'.
    const warningsOpen = (data.staffWarnings ?? []).filter((w) => !w.acknowledged).length;
    const leavePending = (data.leaveRequests ?? []).filter((r) => r.status === 'Pending').length;
    const expensePending = (data.expenseClaims ?? []).filter((r) => r.status === 'Pending').length;
    const loansActive = (data.staffLoans ?? []).filter((l) => (l.balance ?? 0) > 0).length;

    const paperRates = data.paperRates.length;
    const costProfiles = data.costProfiles.length;
    const pricingTiers = data.pricingTiers.length;
    const standardMargin = data.appSettings?.standardMarginPercent ?? 35;

    const ncrsOpen = data.nonConformances.filter((n) => n.status !== 'Closed').length;
    const ncrsOverdue = data.nonConformances.filter((n) => n.status !== 'Closed' && n.dueDate && n.dueDate < today).length;
    const sarsConfigured = !!data.appSettings?.sarsConfig?.vatRegistered;
    const sheLast = (data.sheMeetingEntries ?? []).slice().sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))[0];
    const drillLast = (data.drillEntries ?? []).slice().sort((a, b) => b.drillDate.localeCompare(a.drillDate))[0];

    return {
      notices, noticesUnack,
      users, employees,
      warningsOpen, leavePending, expensePending, loansActive,
      paperRates, costProfiles, pricingTiers, standardMargin,
      ncrsOpen, ncrsOverdue,
      sarsConfigured,
      sheLastDate: sheLast?.meetingDate,
      drillLastDate: drillLast?.drillDate,
    };
  }, [data, profile]);

  /* ─── Section data ────────────────────────────────────────────────
   *
   * One entry per admin chore area. The two-pane layout reads from this
   * array: left rail lists titles + a badge (red dot) when something is
   * waiting, right pane shows the picked section's stats + actions.
   *
   * Badge logic: a section gets a badge when at least one of its stats
   * is in 'warn' or 'alert' tone. That ensures the rail visually
   * highlights what actually needs attention this morning.
   * ─────────────────────────────────────────────────────────────────── */
  type SectionStat = { label: string; value: number | string; tone?: 'warn' | 'alert' };
  type SectionAction = { label: string; primary?: boolean; onClick: () => void };
  interface AdminSection {
    id: string;
    title: string;
    subtitle: string;
    stats: SectionStat[];
    actions: SectionAction[];
  }

  const sections: AdminSection[] = [
    {
      id: 'notices',
      title: 'Notices & broadcast',
      subtitle: 'Talk to the team. Notice goes to My Stuff for the targeted roles.',
      stats: [
        { label: 'On file', value: counts.notices },
        { label: 'Pending acks', value: counts.noticesUnack, tone: counts.noticesUnack > 0 ? 'warn' : undefined },
      ],
      actions: [
        // Phase 113 — Post a notice deep-links straight into the new-notice
        // form instead of dumping the admin on the list page.
        { label: 'Post a notice', primary: true, onClick: () => goToNew('notices') },
        { label: 'See notice board', onClick: () => goTo('notices') },
        { label: 'My Stuff (preview)', onClick: () => goTo('myPortal') },
      ],
    },
    {
      id: 'people',
      title: 'People & permissions',
      subtitle: 'Add a user, change a role, link an employee to their login.',
      stats: [{ label: 'Active employees', value: counts.employees }],
      actions: [
        { label: 'Add / edit users', primary: true, onClick: () => goTo('permissions') },
        { label: 'Permissions matrix', onClick: () => goTo('permissions') },
        { label: 'Employee register', onClick: () => goTo('employees') },
        { label: 'Visitor log', onClick: () => goTo('visitorLog') },
      ],
    },
    {
      id: 'hr',
      title: 'HR queue',
      subtitle: 'Approvals, warnings, leave, loans, claims — everything waiting on you.',
      stats: [
        { label: 'Open warnings', value: counts.warningsOpen, tone: counts.warningsOpen > 0 ? 'warn' : undefined },
        { label: 'Leave pending', value: counts.leavePending, tone: counts.leavePending > 0 ? 'warn' : undefined },
        { label: 'Claims pending', value: counts.expensePending, tone: counts.expensePending > 0 ? 'warn' : undefined },
        { label: 'Active loans', value: counts.loansActive },
      ],
      actions: [
        // Approve leave + claims already land in approval-focused views,
        // no further intent needed. The 'new record' actions deep-link.
        { label: 'Approve leave', primary: true, onClick: () => goTo('staffLeaveApprove') },
        { label: 'Approve claims', onClick: () => goTo('expenseClaimsApprove') },
        { label: 'Issue warning', onClick: () => goToNew('staffWarnings') },
        { label: 'Staff loans', onClick: () => goToNew('staffLoans') },
        { label: 'Run payroll', onClick: () => goToNew('payroll') },
        { label: 'IRP5 / EMP501', onClick: () => goTo('irp5Centre') },
      ],
    },
    {
      id: 'pricing',
      title: 'Pricing & cost masters',
      subtitle: 'Paper rates, cost profiles, pricing tiers, default margin — the dials behind every quote.',
      stats: [
        { label: 'Paper rates', value: counts.paperRates },
        { label: 'Cost profiles', value: counts.costProfiles },
        { label: 'Pricing tiers', value: counts.pricingTiers },
        { label: 'Std margin', value: `${counts.standardMargin}%` },
      ],
      actions: [
        { label: 'Paper rates', primary: true, onClick: () => goTo('costMasters') },
        { label: 'Cost profiles', onClick: () => goTo('costMasters') },
        { label: 'Cost inputs', onClick: () => goTo('costInputs') },
        { label: 'Pricing tiers', onClick: () => goTo('pricing') },
        { label: 'Standard margin (Settings)', onClick: () => goTo('settings') },
        { label: 'Price list (public)', onClick: () => goTo('priceList') },
      ],
    },
    {
      id: 'compliance',
      title: 'Compliance attention',
      subtitle: 'NCRs, SARS, SHE meeting cadence, drills, training — keep audits clean.',
      stats: [
        { label: 'Open NCRs', value: counts.ncrsOpen, tone: counts.ncrsOverdue > 0 ? 'alert' : counts.ncrsOpen > 0 ? 'warn' : undefined },
        { label: 'NCRs overdue', value: counts.ncrsOverdue, tone: counts.ncrsOverdue > 0 ? 'alert' : undefined },
        { label: 'Last SHE meeting', value: counts.sheLastDate ? counts.sheLastDate : '—' },
        { label: 'Last fire drill', value: counts.drillLastDate ? counts.drillLastDate : '—' },
      ],
      actions: [
        // Compliance entries are usually "I just observed something, log
        // it" actions — deep-link straight into the new-entry form.
        { label: 'Log NCR', primary: true, onClick: () => goToNew('nonConformance') },
        { label: 'Log SHE meeting', onClick: () => goToNew('sheCommittee') },
        { label: 'Log fire drill', onClick: () => goToNew('drillRegister') },
        { label: 'Log incident', onClick: () => goToNew('incidentRegister') },
        { label: 'Log toolbox talk', onClick: () => goToNew('toolboxTalks') },
        { label: 'Log first aid', onClick: () => goToNew('firstAidRegister') },
        { label: 'Training records', onClick: () => goTo('staffTraining') },
        { label: 'SARS Centre', onClick: () => goTo('sarsCentre') },
        { label: 'Doc Vault', onClick: () => goTo('documentVault') },
      ],
    },
    {
      id: 'settings',
      title: 'Settings & branding',
      subtitle: 'Company info, document templates, retention defaults, FX rates.',
      stats: [{ label: 'SARS registered', value: counts.sarsConfigured ? 'Yes' : 'No' }],
      actions: [
        { label: 'Open Settings', primary: true, onClick: () => goTo('settings') },
        { label: 'Currencies & FX', onClick: () => goTo('currencies') },
        { label: 'Chart of accounts', onClick: () => goTo('chartOfAccounts') },
        { label: 'Doc Vault', onClick: () => goTo('documentVault') },
      ],
    },
    {
      id: 'ops',
      title: 'Operations oversight',
      subtitle: "Production schedule, materials forecast, finished stock — what's the floor doing.",
      stats: [],
      actions: [
        { label: 'Production schedule', primary: true, onClick: () => goTo('productionSchedule') },
        { label: 'Material requirements', onClick: () => goTo('materialRequirements') },
        { label: 'Finished stock', onClick: () => goTo('finishedStock') },
        { label: 'Stock movements', onClick: () => goTo('stockMovements') },
        { label: 'Stock take', onClick: () => goTo('stockTake') },
        { label: 'Maintenance', onClick: () => goTo('maintenance') },
      ],
    },
    {
      id: 'finance',
      title: 'Finance shortcuts',
      subtitle: 'The numbers — quick path into the books.',
      stats: [],
      actions: [
        { label: 'Aged debtors', primary: true, onClick: () => goTo('agedDebtors') },
        { label: 'Customer statements', onClick: () => goTo('customerStatements') },
        { label: 'Finance summary', onClick: () => goTo('financeSummary') },
        { label: 'Bank reconciliation', onClick: () => goTo('bankRec') },
        { label: 'Accounts payable', onClick: () => goTo('accountsPayable') },
        { label: 'General ledger', onClick: () => goTo('generalLedger') },
        { label: 'Cash flow forecast', onClick: () => goTo('cashFlow') },
      ],
    },
  ];

  /**
   * Phase 124.1 — ADMIN HUB REDESIGN.
   *
   * Same pattern as My Stuff (Phase 121.1):
   *   1. "DO TODAY" amber hero (only when items pending) — big count
   *      chip + tap-rows for each waiting bucket.
   *   2. "ALL CLEAR" green card when nothing urgent.
   *   3. Quick Action tiles always visible — the 4 most-common admin
   *      chores (Post notice / Approve leave / Run payroll / Log NCR).
   *   4. Collapsible category sections — same data the old two-pane
   *      surfaced, but stacked instead of split so admin can scroll
   *      down the list and expand what they want.
   *
   * Constraints honoured:
   *   - No emojis (Aman: never)
   *   - Big numbers as urgency signal (counts + colour-coded chips)
   *   - Plain English action labels
   *   - Colour rules: amber = action waiting, green = clear,
   *     grey = neutral, big bold count = priority
   */

  // ── DO TODAY items (cross-cutting urgent stuff) ──
  const todayItems = [
    counts.leavePending > 0 ? { count: counts.leavePending, label: `Leave request${counts.leavePending === 1 ? '' : 's'} waiting`, sub: 'Approve / reject pending leave', onClick: () => goTo('staffLeaveApprove') } : null,
    counts.expensePending > 0 ? { count: counts.expensePending, label: `Expense claim${counts.expensePending === 1 ? '' : 's'} waiting`, sub: 'Review pending claims', onClick: () => goTo('expenseClaimsApprove') } : null,
    counts.ncrsOverdue > 0 ? { count: counts.ncrsOverdue, label: `NCR${counts.ncrsOverdue === 1 ? '' : 's'} overdue`, sub: 'Past their due date', onClick: () => goTo('nonConformance'), severe: true } : null,
    counts.warningsOpen > 0 ? { count: counts.warningsOpen, label: `Staff warning${counts.warningsOpen === 1 ? '' : 's'} unsigned`, sub: 'Awaiting employee sign-off', onClick: () => goTo('staffWarnings') } : null,
  ].filter(Boolean) as Array<{ count: number; label: string; sub: string; onClick: () => void; severe?: boolean }>;
  const totalTodo = todayItems.reduce((s, i) => s + i.count, 0);

  // ── Collapsible state per category section ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setOpenSections((s) => ({ ...s, [id]: !s[id] }));

  // Shared palette / styles (mirrors My Stuff).
  const HERO_AMBER = '#f59e0b';
  const HERO_AMBER_TINT = 'rgba(245, 158, 11, 0.08)';
  const HERO_RED = '#dc2626';
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
        title="Admin Hub"
        subtitle={totalTodo > 0
          ? `${totalTodo} thing${totalTodo === 1 ? '' : 's'} need your attention.`
          : 'Nothing urgent. Pick a category below to manage the business.'}
      />

      {/* ───────── 1. DO TODAY hero ─────────
          Big amber card with one tap-row per urgent bucket. Severe items
          (overdue NCRs) get a red accent on the count chip. */}
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
            <h2 style={{ margin: 0, fontSize: 20, color: '#92400e' }}>Do these today</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayItems.map((item, idx) => (
              <button key={idx} type="button" style={tapRowBase} onClick={item.onClick}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: item.severe ? HERO_RED : HERO_AMBER,
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 800,
                  flexShrink: 0,
                }}>{item.count}</span>
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 16 }}>{item.label}</strong>
                  <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 13 }}>{item.sub}</span>
                </span>
                <span style={{ color: item.severe ? HERO_RED : HERO_AMBER, fontWeight: 700, fontSize: 22 }}>{'>'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ───────── 2. ALL CLEAR ─────────
          Calm green card when nothing's waiting. */}
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
            <strong style={{ fontSize: 16, color: '#065f46' }}>Nothing urgent right now.</strong>
            <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #475569)' }}>Use the categories below for routine admin.</div>
          </div>
        </div>
      )}

      {/* ───────── 3. Quick Actions ─────────
          The four most-frequent admin chores, always visible regardless
          of whether there's pending work in those areas. Lets admin
          shortcut the common path without scrolling through sections. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18 }}>
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: `4px solid var(--jp-ink-2, #475569)` }}
          onClick={() => goToNew('notices')}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>BROADCAST</span>
          <strong style={{ fontSize: 18 }}>Post a notice</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>Reach the team on My Stuff</div>
        </button>
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: `4px solid var(--jp-ink-2, #475569)` }}
          onClick={() => goTo('staffLeaveApprove')}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>LEAVE</span>
          <strong style={{ fontSize: 18 }}>Approve leave</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{counts.leavePending > 0 ? `${counts.leavePending} waiting` : 'All current'}</div>
        </button>
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: `4px solid var(--jp-ink-2, #475569)` }}
          onClick={() => goToNew('payroll')}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>PAYROLL</span>
          <strong style={{ fontSize: 18 }}>Run payroll</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{counts.employees} active employees</div>
        </button>
        <button
          type="button"
          style={{ ...cardBase, cursor: 'pointer', textAlign: 'left', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, borderTop: `4px solid var(--jp-ink-2, #475569)` }}
          onClick={() => goToNew('nonConformance')}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--jp-ink-3, #64748b)' }}>QUALITY</span>
          <strong style={{ fontSize: 18 }}>Log an NCR</strong>
          <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>{counts.ncrsOpen > 0 ? `${counts.ncrsOpen} open` : 'No open NCRs'}</div>
        </button>
      </div>

      {/* ───────── 4. Category sections (collapsible) ─────────
          Same data the old two-pane carried, stacked as collapsible
          cards. Sections with action waiting (warn/alert) auto-expand
          on first paint so the admin sees them immediately. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sections.map((s) => {
          const needsAttention = s.stats.some((stat) => stat.tone === 'warn' || stat.tone === 'alert');
          const isAlert = s.stats.some((stat) => stat.tone === 'alert');
          // Auto-expand sections that need attention if user hasn't toggled them yet.
          const explicit = openSections[s.id];
          const open = explicit !== undefined ? explicit : needsAttention;
          const accentColor = isAlert ? HERO_RED : needsAttention ? HERO_AMBER : 'transparent';
          return (
            <div
              key={s.id}
              style={{
                ...cardBase,
                padding: 0,
                overflow: 'hidden',
                borderLeft: `4px solid ${accentColor}`,
              }}
            >
              <button
                type="button"
                onClick={() => toggleSection(s.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{s.title}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{s.subtitle}</p>
                </div>
                {needsAttention ? (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: isAlert ? 'rgba(220, 38, 38, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                    color: isAlert ? '#991b1b' : '#92400e',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}>{isAlert ? 'ATTENTION' : 'WAITING'}</span>
                ) : null}
                <span style={{ fontSize: 16, color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, width: 20, textAlign: 'center', flexShrink: 0 }}>
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {s.stats.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {s.stats.map((stat) => {
                        const tone = stat.tone;
                        const colour =
                          tone === 'alert' ? '#991b1b'
                          : tone === 'warn' ? '#92400e'
                          : 'var(--jp-ink, #222)';
                        const bg =
                          tone === 'alert' ? 'rgba(220, 38, 38, 0.06)'
                          : tone === 'warn' ? 'rgba(245, 158, 11, 0.06)'
                          : 'var(--jp-paper-2, #faf8f4)';
                        return (
                          <span
                            key={stat.label}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: '1px solid var(--jp-divider, #e5e7eb)',
                              background: bg,
                              fontSize: 13,
                              color: colour,
                            }}
                          >
                            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', color: 'var(--jp-ink-3, #64748b)' }}>
                              {stat.label}
                            </span>
                            <strong style={{ fontSize: 16, fontFeatureSettings: '"tnum"' }}>{stat.value}</strong>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {s.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        className={a.primary ? 'primary-button' : 'ghost-button'}
                        style={{ fontSize: 13, padding: '8px 14px' }}
                        onClick={a.onClick}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total margin info bar (footer) */}
      <p style={{ margin: '20px 0 0', fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textAlign: 'right' }}>
        Standard margin {formatNumber(counts.standardMargin, 0)}% · {counts.employees} active employees
      </p>
    </section>
  );
}

/* Phase 124.1 — Stat helper component removed; the new design uses
 * inline stat chips inside each collapsible section card. */
