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

import { useMemo } from 'react';
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
}

export function AdminHubPage({ data, profile, goTo }: AdminHubPageProps) {
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

  return (
    <>
      <SectionTitle
        title="Admin Hub"
        subtitle="One place for the admin chores — post notices, grant access, change pricing, run compliance. Quick links + live counts so you don't have to hunt."
      />

      {/* ═══ Headline stats ════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Stat label="Active employees" value={String(counts.employees)} />
        <Stat label="Open warnings" value={String(counts.warningsOpen)} tone={counts.warningsOpen > 0 ? 'warn' : 'quiet'} />
        <Stat label="Leave pending" value={String(counts.leavePending)} tone={counts.leavePending > 0 ? 'warn' : 'quiet'} />
        <Stat label="Claims pending" value={String(counts.expensePending)} tone={counts.expensePending > 0 ? 'warn' : 'quiet'} />
        <Stat label="Open NCRs" value={String(counts.ncrsOpen)} tone={counts.ncrsOverdue > 0 ? 'alert' : counts.ncrsOpen > 0 ? 'warn' : 'quiet'} />
        <Stat label="Standard margin" value={`${formatNumber(counts.standardMargin, 0)}%`} />
      </div>

      {/* ═══ Section cards ════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
          gap: 14,
        }}
      >
        {/* ── 1. Notices & broadcast ─────────────────────────────── */}
        <SectionCard
          title="Notices & broadcast"
          subtitle="Talk to the team. Notice goes to My Stuff for the targeted roles."
          stats={[
            { label: 'On file', value: counts.notices },
            { label: 'Pending acks', value: counts.noticesUnack, tone: counts.noticesUnack > 0 ? 'warn' : undefined },
          ]}
          actions={[
            { label: 'Post a notice', primary: true, onClick: () => goTo('notices') },
            { label: 'See notice board', onClick: () => goTo('notices') },
            { label: 'My Stuff (preview)', onClick: () => goTo('myPortal') },
          ]}
        />

        {/* ── 2. People & permissions ────────────────────────────── */}
        <SectionCard
          title="People & permissions"
          subtitle="Add a user, change a role, link an employee to their login."
          stats={[
            { label: 'Active employees', value: counts.employees },
          ]}
          actions={[
            { label: 'Add / edit users', primary: true, onClick: () => goTo('permissions') },
            { label: 'Permissions matrix', onClick: () => goTo('permissions') },
            { label: 'Employee register', onClick: () => goTo('employees') },
            { label: 'Visitor log', onClick: () => goTo('visitorLog') },
          ]}
        />

        {/* ── 3. HR queue ──────────────────────────────────────────── */}
        <SectionCard
          title="HR queue"
          subtitle="Approvals, warnings, leave, loans, claims — everything waiting on you."
          stats={[
            { label: 'Open warnings', value: counts.warningsOpen, tone: counts.warningsOpen > 0 ? 'warn' : undefined },
            { label: 'Leave pending', value: counts.leavePending, tone: counts.leavePending > 0 ? 'warn' : undefined },
            { label: 'Claims pending', value: counts.expensePending, tone: counts.expensePending > 0 ? 'warn' : undefined },
            { label: 'Active loans', value: counts.loansActive },
          ]}
          actions={[
            { label: 'Approve leave', onClick: () => goTo('staffLeaveApprove') },
            { label: 'Approve claims', onClick: () => goTo('expenseClaimsApprove') },
            { label: 'Issue warning', onClick: () => goTo('staffWarnings') },
            { label: 'Staff loans', onClick: () => goTo('staffLoans') },
            { label: 'Run payroll', onClick: () => goTo('payroll') },
            { label: 'IRP5 / EMP501', onClick: () => goTo('irp5Centre') },
          ]}
        />

        {/* ── 4. Pricing & cost masters ──────────────────────────── */}
        <SectionCard
          title="Pricing & cost masters"
          subtitle="Paper rates, cost profiles, pricing tiers, default margin — the dials behind every quote."
          stats={[
            { label: 'Paper rates', value: counts.paperRates },
            { label: 'Cost profiles', value: counts.costProfiles },
            { label: 'Pricing tiers', value: counts.pricingTiers },
            { label: 'Std margin', value: `${counts.standardMargin}%` },
          ]}
          actions={[
            { label: 'Paper rates', primary: true, onClick: () => goTo('costMasters') },
            { label: 'Cost profiles', onClick: () => goTo('costMasters') },
            { label: 'Cost inputs', onClick: () => goTo('costInputs') },
            { label: 'Pricing tiers', onClick: () => goTo('pricing') },
            { label: 'Standard margin (Settings)', onClick: () => goTo('settings') },
            { label: 'Price list (public)', onClick: () => goTo('priceList') },
          ]}
        />

        {/* ── 5. Compliance attention ─────────────────────────────── */}
        <SectionCard
          title="Compliance attention"
          subtitle="NCRs, SARS, SHE meeting cadence, drills, training — keep audits clean."
          stats={[
            { label: 'Open NCRs', value: counts.ncrsOpen, tone: counts.ncrsOverdue > 0 ? 'alert' : counts.ncrsOpen > 0 ? 'warn' : undefined },
            { label: 'NCRs overdue', value: counts.ncrsOverdue, tone: counts.ncrsOverdue > 0 ? 'alert' : undefined },
            { label: 'Last SHE meeting', value: counts.sheLastDate ? counts.sheLastDate : '—' },
            { label: 'Last fire drill', value: counts.drillLastDate ? counts.drillLastDate : '—' },
          ]}
          actions={[
            { label: 'NCR register', onClick: () => goTo('nonConformance') },
            { label: 'SHE Committee', onClick: () => goTo('sheCommittee') },
            { label: 'Drill register', onClick: () => goTo('drillRegister') },
            { label: 'Incident register', onClick: () => goTo('incidentRegister') },
            { label: 'Toolbox talks', onClick: () => goTo('toolboxTalks') },
            { label: 'First aid register', onClick: () => goTo('firstAidRegister') },
            { label: 'Training records', onClick: () => goTo('staffTraining') },
            { label: 'SARS Centre', onClick: () => goTo('sarsCentre') },
            { label: 'Doc Vault', onClick: () => goTo('documentVault') },
          ]}
        />

        {/* ── 6. Settings & branding ──────────────────────────────── */}
        <SectionCard
          title="Settings & branding"
          subtitle="Company info, document templates, retention defaults, FX rates."
          stats={[
            { label: 'SARS registered', value: counts.sarsConfigured ? 'Yes' : 'No' },
          ]}
          actions={[
            { label: 'Open Settings', primary: true, onClick: () => goTo('settings') },
            { label: 'Currencies & FX', onClick: () => goTo('currencies') },
            { label: 'Chart of accounts', onClick: () => goTo('chartOfAccounts') },
            { label: 'Doc Vault', onClick: () => goTo('documentVault') },
            // Phase 103.7 — API Access is reached via Settings → API access tab.
          ]}
        />

        {/* ── 7. Operations shortcuts (admin oversight) ──────────── */}
        <SectionCard
          title="Operations oversight"
          subtitle="Production schedule, materials forecast, finished stock — what's the floor doing."
          stats={[]}
          actions={[
            { label: 'Production schedule', onClick: () => goTo('productionSchedule') },
            { label: 'Material requirements', onClick: () => goTo('materialRequirements') },
            { label: 'Finished stock', onClick: () => goTo('finishedStock') },
            { label: 'Stock movements', onClick: () => goTo('stockMovements') },
            { label: 'Stock take', onClick: () => goTo('stockTake') },
            { label: 'Maintenance', onClick: () => goTo('maintenance') },
          ]}
        />

        {/* ── 8. Finance shortcuts ─────────────────────────────────── */}
        <SectionCard
          title="Finance shortcuts"
          subtitle="The numbers — quick path into the books."
          stats={[]}
          actions={[
            { label: 'Aged debtors', onClick: () => goTo('agedDebtors') },
            { label: 'Customer statements', onClick: () => goTo('customerStatements') },
            { label: 'Finance summary', onClick: () => goTo('financeSummary') },
            { label: 'Bank reconciliation', onClick: () => goTo('bankRec') },
            { label: 'Accounts payable', onClick: () => goTo('accountsPayable') },
            { label: 'General ledger', onClick: () => goTo('generalLedger') },
            { label: 'Cash flow forecast', onClick: () => goTo('cashFlow') },
          ]}
        />
      </div>
    </>
  );
}

/* ─── building blocks ────────────────────────────────────────────── */

function Stat(props: { label: string; value: string; tone?: 'quiet' | 'warn' | 'alert' }) {
  const palette = {
    quiet: { border: 'var(--jp-border, #e5e2dc)', bg: 'var(--jp-paper, #fff)', colour: '#2e6f3e' },
    warn:  { border: 'rgba(184,134,11,0.45)', bg: 'rgba(184,134,11,0.06)', colour: '#8a6510' },
    alert: { border: 'rgba(178,43,43,0.55)', bg: 'rgba(178,43,43,0.06)', colour: '#b22b2b' },
    none:  { border: 'var(--jp-border, #e5e2dc)', bg: 'var(--jp-paper, #fff)', colour: 'var(--jp-ink, #222)' },
  };
  const tone = props.tone ?? 'none';
  const p = palette[tone];
  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${p.border}`, background: p.bg }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--jp-ink-3, #64748b)' }}>
        {props.label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: p.colour, fontFeatureSettings: '"tnum"' }}>
        {props.value}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: number | string; tone?: 'warn' | 'alert' }>;
  actions: Array<{ label: string; primary?: boolean; onClick: () => void }>;
}

function SectionCard({ title, subtitle, stats, actions }: SectionCardProps) {
  return (
    <section
      style={{
        background: 'var(--jp-paper, #fff)',
        border: '1px solid var(--jp-border, #e5e2dc)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        <p className="muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{subtitle}</p>
      </div>

      {stats.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {stats.map((s) => {
            const colour =
              s.tone === 'alert' ? '#b22b2b'
              : s.tone === 'warn' ? '#8a6510'
              : 'var(--jp-ink, #222)';
            const bg =
              s.tone === 'alert' ? 'rgba(178,43,43,0.06)'
              : s.tone === 'warn' ? 'rgba(184,134,11,0.06)'
              : 'var(--jp-paper-2, #faf8f4)';
            return (
              <span
                key={s.label}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--jp-border, #e5e2dc)',
                  background: bg,
                  fontSize: 12,
                  color: colour,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}: <strong>{s.value}</strong>
              </span>
            );
          })}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={a.primary ? 'primary-button' : 'ghost-button'}
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={a.onClick}
          >
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}
