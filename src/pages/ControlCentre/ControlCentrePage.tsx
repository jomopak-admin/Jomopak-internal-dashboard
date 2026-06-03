/**
 * Unified Control Centre (Phase 54).
 *
 * One pane of glass — every "thing that needs attention" across the
 * business in seven collapsible sections:
 *   • Urgent today (cross-cutting)
 *   • Cash flow
 *   • Production
 *   • Food safety
 *   • People & HR
 *   • Stock
 *   • Compliance / SARS
 *
 * Each section is a <details>/<summary> card with a count badge in the
 * title. We auto-expand when count > 0 and collapse to zero by default.
 * Items inside are click-through actions that take you straight to the
 * page where you can deal with the thing.
 *
 * This page reads from the same AppData everything else does. Pure
 * computation, no new persistence.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  AppData,
  ExpenseClaim,
  JobCard,
  LeaveRequest,
  StaffWarning,
  StockRequest,
  UserProfile,
  UserRole,
  View,
} from '../../types';
import { formatDate, formatNumber } from '../../utils/calculations';

interface ControlCentrePageProps {
  data: AppData;
  profile: UserProfile | null;
  allowedViews: Set<View>;
  onNavigate: (view: View) => void;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function daysUntil(dateStr: string, today: string): number {
  if (!dateStr) return Infinity;
  return Math.round((new Date(`${dateStr}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / DAY_MS);
}

function money(n: number): string {
  return `R${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface ItemRow {
  label: string;
  meta?: string;
  badge?: string;
  badgeClass?: string;
  /** Optional target view to navigate to. */
  goto?: View;
}

interface CentreCard {
  key: string;
  title: string;
  items: ItemRow[];
  /** Optional total count if more items exist than we surface. */
  totalCount?: number;
  /** Default view-all link. */
  viewAll?: View;
  /** Hide entire card if true (e.g. user lacks the permissions). */
  hidden?: boolean;
}

export function ControlCentrePage({ data, profile, allowedViews, onNavigate }: ControlCentrePageProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const role: UserRole = profile?.role ?? 'admin';
  const myName = (profile?.fullName || profile?.email || '').trim().toLowerCase();

  // ─────────────────────────────────────── Cross-cutting helpers ──
  const overdueJobs = useMemo(() => data.jobs.filter((j) => j.status !== 'Completed' && j.dueDate && j.dueDate < today), [data.jobs, today]);
  const jobsDueThisWeek = useMemo(() => {
    return data.jobs.filter((j) => j.status !== 'Completed' && j.dueDate && daysUntil(j.dueDate, today) >= 0 && daysUntil(j.dueDate, today) <= 7);
  }, [data.jobs, today]);
  const blockedJobs = useMemo(() => data.jobs.filter((j) => j.status === 'Awaiting Artwork' || j.status === 'Awaiting Proof Approval'), [data.jobs]);

  const overdueInvoices = useMemo(() => data.invoices.filter((i) => {
    // Outstanding = total - paid. If positive AND past due, it counts.
    const outstanding = (i.totalInclVat || 0) - (i.amountPaid || 0);
    return outstanding > 0 && i.dueDate && i.dueDate < today;
  }), [data.invoices, today]);
  const overdueInvoiceTotal = overdueInvoices.reduce((s, i) => s + Math.max(0, (i.totalInclVat || 0) - (i.amountPaid || 0)), 0);

  const billsDueIn7 = useMemo(() => data.supplierBills.filter((b) => {
    const outstanding = (b.totalInclVat || 0) - (b.amountPaid || 0);
    return outstanding > 0 && b.dueDate && daysUntil(b.dueDate, today) >= 0 && daysUntil(b.dueDate, today) <= 7;
  }), [data.supplierBills, today]);
  const billsDueIn7Total = billsDueIn7.reduce((s, b) => s + Math.max(0, (b.totalInclVat || 0) - (b.amountPaid || 0)), 0);

  const pendingLeave: LeaveRequest[] = useMemo(() => (data.leaveRequests ?? []).filter((r) => r.status === 'Pending'), [data.leaveRequests]);
  const pendingClaims: ExpenseClaim[] = useMemo(() => (data.expenseClaims ?? []).filter((c) => c.status === 'Pending'), [data.expenseClaims]);
  const claimsToPay = useMemo(() => (data.expenseClaims ?? []).filter((c) => c.status === 'Approved'), [data.expenseClaims]);
  const pendingStockMgr = useMemo<StockRequest[]>(() => (data.stockRequests ?? []).filter((r) => r.status === 'Pending Manager'), [data.stockRequests]);
  const pendingStockBuy = useMemo<StockRequest[]>(() => (data.stockRequests ?? []).filter((r) => r.status === 'Approved'), [data.stockRequests]);
  const openPOs = useMemo<StockRequest[]>(() => (data.stockRequests ?? []).filter((r) => r.status === 'PO Created'), [data.stockRequests]);

  const myUnsignedWarnings = useMemo<StaffWarning[]>(() => (data.staffWarnings ?? []).filter((w) => {
    if (w.acknowledged) return false;
    if (!['Verbal Warning', 'Written Warning 1', 'Written Warning 2', 'Final Written Warning'].includes(w.type)) return false;
    return w.employeeName.trim().toLowerCase() === myName;
  }), [data.staffWarnings, myName]);
  const unsignedWarningsAll = useMemo<StaffWarning[]>(() => (data.staffWarnings ?? []).filter((w) => {
    if (w.acknowledged) return false;
    return ['Verbal Warning', 'Written Warning 1', 'Written Warning 2', 'Final Written Warning'].includes(w.type);
  }), [data.staffWarnings]);

  const pendingKioskVerify = useMemo(() => data.visitorLogEntries.filter((v) => v.kioskCheckin && !v.staffVerified), [data.visitorLogEntries]);

  const openNcrs = useMemo(() => data.nonConformances.filter((n) => n.status !== 'Closed'), [data.nonConformances]);
  const foreignObjects30d = useMemo(() => data.foreignObjectRecords.filter((f) => f.inspectionDate && daysUntil(f.inspectionDate, today) >= -30 && f.recordType === 'Incident'), [data.foreignObjectRecords, today]);
  const pestEvents30d = useMemo(() => data.pestControlRecords.filter((p) => p.serviceDate && daysUntil(p.serviceDate, today) >= -30 && (p.findings || '').trim().length > 0), [data.pestControlRecords, today]);
  const sopsOverdueReview = useMemo(() => data.sopDocuments.filter((s) => s.status === 'Active' && s.reviewDate && s.reviewDate < today), [data.sopDocuments, today]);
  const cleaningGaps = useMemo(() => {
    // "Gap" = no cleaning log for 7+ days. Simplified: count total cleaning
    // logs in last 7 days; flag if zero AND we have any historical logs.
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString();
    const recent = data.cleaningLogs.filter((l) => l.performedAt && l.performedAt >= cutoffStr);
    return recent.length === 0 && data.cleaningLogs.length > 0 ? 1 : 0;
  }, [data.cleaningLogs, today]);

  const trainingDueRefresh = useMemo(() => data.staffTrainingRecords.filter((t) => t.nextRefresherDate && daysUntil(t.nextRefresherDate, today) <= 30), [data.staffTrainingRecords, today]);

  const lowSpares = useMemo(() => data.spareParts.filter((s) => typeof s.reorderLevel === 'number' && s.reorderLevel > 0 && (s.quantityOnHand ?? 0) <= s.reorderLevel), [data.spareParts]);

  const sarsDeadlines30d = useMemo(() => (data.sarsFilings ?? []).filter((f: any) => {
    const status = (f.status || '').toLowerCase();
    if (status === 'submitted' || status === 'filed' || status === 'paid') return false;
    return f.dueDate && daysUntil(f.dueDate, today) >= 0 && daysUntil(f.dueDate, today) <= 30;
  }), [data.sarsFilings, today]);

  // Approval capabilities ─ each opens a section card when applicable.
  const canApproveLeave = allowedViews.has('staffLeaveApprove');
  const canApproveClaim = allowedViews.has('expenseClaimsApprove');
  const canApproveStockReq = allowedViews.has('stockRequestsApprove');
  const canBuyStock = allowedViews.has('stockRequestsBuy');

  // ───────────────────────────────────────────────── Compose cards ──
  const cards = useMemo<CentreCard[]>(() => {
    const urgent: ItemRow[] = [];
    // Things waiting on the current user specifically:
    if (canApproveLeave && pendingLeave.length > 0) {
      urgent.push({ label: `${pendingLeave.length} leave request${pendingLeave.length === 1 ? '' : 's'} need your approval`, badge: 'Approve', badgeClass: 'badge badge-danger', goto: 'staffLeave' });
    }
    if (canApproveClaim && pendingClaims.length > 0) {
      urgent.push({ label: `${pendingClaims.length} expense claim${pendingClaims.length === 1 ? '' : 's'} need your approval`, badge: 'Approve', badgeClass: 'badge badge-danger', goto: 'expenseClaims' });
    }
    if (canApproveStockReq && pendingStockMgr.length > 0) {
      urgent.push({ label: `${pendingStockMgr.length} stock request${pendingStockMgr.length === 1 ? '' : 's'} need your approval`, badge: 'Approve', badgeClass: 'badge badge-danger', goto: 'stockRequests' });
    }
    if (canBuyStock && pendingStockBuy.length > 0) {
      urgent.push({ label: `${pendingStockBuy.length} stock request${pendingStockBuy.length === 1 ? '' : 's'} in your buying queue`, badge: 'Fulfill', badgeClass: 'badge badge-danger', goto: 'stockRequests' });
    }
    if (myUnsignedWarnings.length > 0) {
      urgent.push({ label: `You have ${myUnsignedWarnings.length} warning${myUnsignedWarnings.length === 1 ? '' : 's'} to acknowledge`, badge: 'Sign', badgeClass: 'badge badge-danger', goto: 'myPortal' });
    }
    if (overdueJobs.length > 0) {
      urgent.push({ label: `${overdueJobs.length} job${overdueJobs.length === 1 ? '' : 's'} overdue`, meta: overdueJobs.slice(0, 3).map((j) => j.jobNumber).join(', '), badge: String(overdueJobs.length), badgeClass: 'badge badge-danger', goto: 'jobs' });
    }
    if (overdueInvoices.length > 0) {
      urgent.push({ label: `${overdueInvoices.length} invoice${overdueInvoices.length === 1 ? '' : 's'} overdue · ${money(overdueInvoiceTotal)}`, badge: String(overdueInvoices.length), badgeClass: 'badge badge-danger', goto: 'agedDebtors' });
    }
    if (pendingKioskVerify.length > 0) {
      urgent.push({ label: `${pendingKioskVerify.length} visitor${pendingKioskVerify.length === 1 ? '' : 's'} waiting for reception to confirm`, badge: 'Verify', badgeClass: 'badge badge-danger', goto: 'visitorLog' });
    }

    const cashflow: ItemRow[] = [];
    if (overdueInvoices.length > 0) cashflow.push({ label: `Overdue debtors · ${money(overdueInvoiceTotal)}`, meta: `${overdueInvoices.length} invoice(s)`, badge: 'View', goto: 'agedDebtors' });
    if (billsDueIn7.length > 0) cashflow.push({ label: `Supplier bills due in 7 days · ${money(billsDueIn7Total)}`, meta: `${billsDueIn7.length} bill(s)`, badge: 'View', goto: 'accountsPayable' });

    const production: ItemRow[] = [];
    jobsDueThisWeek.slice(0, 5).forEach((j) => {
      production.push({ label: `${j.jobNumber} · ${j.customerName}`, meta: `${j.productName} · due ${formatDate(j.dueDate)}`, badge: daysUntil(j.dueDate, today) === 0 ? 'Today' : `${daysUntil(j.dueDate, today)}d`, badgeClass: daysUntil(j.dueDate, today) <= 1 ? 'badge badge-danger' : 'badge', goto: 'jobs' });
    });
    if (blockedJobs.length > 0) production.push({ label: `${blockedJobs.length} job${blockedJobs.length === 1 ? '' : 's'} blocked (awaiting artwork / proof)`, badge: 'Unblock', badgeClass: 'badge', goto: 'jobs' });
    if (openPOs.length > 0) production.push({ label: `${openPOs.length} PO${openPOs.length === 1 ? '' : 's'} open awaiting receipt`, badge: 'Receive', goto: 'stockRequests' });

    const foodSafety: ItemRow[] = [];
    if (openNcrs.length > 0) foodSafety.push({ label: `${openNcrs.length} open NCR${openNcrs.length === 1 ? '' : 's'}`, badge: String(openNcrs.length), badgeClass: 'badge badge-danger', goto: 'nonConformance' });
    if (foreignObjects30d.length > 0) foodSafety.push({ label: `${foreignObjects30d.length} foreign-object event${foreignObjects30d.length === 1 ? '' : 's'} in last 30 days`, badge: String(foreignObjects30d.length), goto: 'foreignObjectControl' });
    if (pestEvents30d.length > 0) foodSafety.push({ label: `${pestEvents30d.length} pest event${pestEvents30d.length === 1 ? '' : 's'} in last 30 days`, badge: String(pestEvents30d.length), badgeClass: 'badge badge-danger', goto: 'pestControl' });
    if (sopsOverdueReview.length > 0) foodSafety.push({ label: `${sopsOverdueReview.length} SOP${sopsOverdueReview.length === 1 ? '' : 's'} overdue for review`, badge: String(sopsOverdueReview.length), badgeClass: 'badge badge-danger', goto: 'sopRegister' });
    if (cleaningGaps > 0) foodSafety.push({ label: 'No cleaning logs in the last 7 days', badge: 'Action', badgeClass: 'badge badge-danger', goto: 'cleaningLogs' });

    const hr: ItemRow[] = [];
    if (pendingLeave.length > 0) hr.push({ label: `${pendingLeave.length} leave request${pendingLeave.length === 1 ? '' : 's'} pending approval`, badge: String(pendingLeave.length), badgeClass: 'badge badge-danger', goto: 'staffLeave' });
    if (pendingClaims.length > 0) hr.push({ label: `${pendingClaims.length} expense claim${pendingClaims.length === 1 ? '' : 's'} pending approval`, badge: String(pendingClaims.length), badgeClass: 'badge badge-danger', goto: 'expenseClaims' });
    if (claimsToPay.length > 0) hr.push({ label: `${claimsToPay.length} expense claim${claimsToPay.length === 1 ? '' : 's'} approved · awaiting payment`, badge: 'Pay', goto: 'expenseClaims' });
    if (unsignedWarningsAll.length > 0) hr.push({ label: `${unsignedWarningsAll.length} warning${unsignedWarningsAll.length === 1 ? '' : 's'} awaiting staff sign-off`, badge: String(unsignedWarningsAll.length), goto: 'staffWarnings' });
    if (trainingDueRefresh.length > 0) hr.push({ label: `${trainingDueRefresh.length} training record${trainingDueRefresh.length === 1 ? '' : 's'} due for refresher in 30 days`, badge: String(trainingDueRefresh.length), goto: 'staffTraining' });

    const stock: ItemRow[] = [];
    if (lowSpares.length > 0) lowSpares.slice(0, 5).forEach((s) => stock.push({ label: `${s.partName}${s.partCode ? ` (${s.partCode})` : ''}`, meta: `${s.quantityOnHand} ${s.unitOfMeasure} on hand · reorder at ${s.reorderLevel}`, badge: 'Low', badgeClass: 'badge badge-danger', goto: 'spares' }));
    if (pendingStockMgr.length > 0) stock.push({ label: `${pendingStockMgr.length} stock request${pendingStockMgr.length === 1 ? '' : 's'} awaiting manager`, badge: String(pendingStockMgr.length), goto: 'stockRequests' });
    if (pendingStockBuy.length > 0) stock.push({ label: `${pendingStockBuy.length} stock request${pendingStockBuy.length === 1 ? '' : 's'} in buyer queue`, badge: String(pendingStockBuy.length), goto: 'stockRequests' });

    const compliance: ItemRow[] = [];
    sarsDeadlines30d.slice(0, 5).forEach((f: any) => compliance.push({ label: `${f.type || 'SARS'} · ${f.periodLabel || ''}`.trim(), meta: `due ${formatDate(f.dueDate)} (${daysUntil(f.dueDate, today)} days)`, badge: daysUntil(f.dueDate, today) <= 7 ? 'Soon' : 'Plan', badgeClass: daysUntil(f.dueDate, today) <= 7 ? 'badge badge-danger' : 'badge', goto: 'sarsCentre' }));
    if (sopsOverdueReview.length > 0 && !foodSafety.some((i) => i.goto === 'sopRegister')) compliance.push({ label: `${sopsOverdueReview.length} SOP${sopsOverdueReview.length === 1 ? '' : 's'} overdue for review`, badge: String(sopsOverdueReview.length), goto: 'sopRegister' });

    // Phase 121 — Per Aman: no emojis anywhere. Card identity is just
    // text + colour-coded counts.
    return [
      { key: 'urgent', title: 'Urgent today', items: urgent, viewAll: undefined },
      { key: 'cashflow', title: 'Cash flow', items: cashflow, viewAll: 'cashFlow' },
      { key: 'production', title: 'Production', items: production, viewAll: 'jobs' },
      { key: 'foodsafety', title: 'Food safety', items: foodSafety, viewAll: 'foodSafetyControlCentre' },
      { key: 'hr', title: 'People & HR', items: hr, viewAll: 'employees' },
      { key: 'stock', title: 'Stock', items: stock, viewAll: 'spares' },
      { key: 'compliance', title: 'Compliance / SARS', items: compliance, viewAll: 'sarsCentre' },
    ];
  }, [
    role, canApproveLeave, canApproveClaim, canApproveStockReq, canBuyStock,
    overdueJobs, overdueInvoices, overdueInvoiceTotal, jobsDueThisWeek, blockedJobs,
    pendingLeave, pendingClaims, claimsToPay, pendingStockMgr, pendingStockBuy, openPOs,
    myUnsignedWarnings, unsignedWarningsAll, pendingKioskVerify,
    billsDueIn7, billsDueIn7Total,
    openNcrs, foreignObjects30d, pestEvents30d, sopsOverdueReview, cleaningGaps,
    trainingDueRefresh, lowSpares, sarsDeadlines30d, today,
  ]);

  const totalIssues = cards.reduce((s, c) => s + c.items.length, 0);

  // ─────────────────────── Phase 125.1 — Action-first redesign ──
  // Audience: CEO + office managers landing on the dashboard. Want a
  // single glance: "what's on fire today" + "what's the next thing I
  // should tap." Same pattern as My Stuff + Admin Hub.

  // Smart greeting — cascade through fullName → email local-part.
  const greetingName = (() => {
    const trimmed = (profile?.fullName || '').trim();
    if (trimmed && !trimmed.includes('@')) {
      const first = trimmed.split(/\s+/)[0];
      if (first) return first.charAt(0).toUpperCase() + first.slice(1);
    }
    const email = profile?.email || '';
    if (email.includes('@')) {
      const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
      if (local) {
        const first = local.split(/\s+/)[0];
        return first.charAt(0).toUpperCase() + first.slice(1);
      }
    }
    return 'there';
  })();
  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 5) return 'evening';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  })();

  const urgentCard = cards.find((c) => c.key === 'urgent');
  const urgentItems = urgentCard?.items ?? [];
  const nonUrgentCards = cards.filter((c) => c.key !== 'urgent');

  const HERO_AMBER = '#f59e0b';
  const HERO_AMBER_TINT = 'rgba(245, 158, 11, 0.08)';
  const HERO_GREEN = '#22a865';
  const HERO_GREEN_TINT = 'rgba(34, 168, 101, 0.08)';
  const HERO_RED = '#dc2626';
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
    padding: '12px 14px',
    background: 'var(--jp-paper, #fff)',
    border: '1px solid var(--jp-divider, #e5e7eb)',
    borderRadius: 10,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
  };

  // Collapsible state per category. Auto-open when items > 0.
  const [openMap, setOpenMap] = useState<Record<string, boolean | undefined>>({});
  function isOpen(card: CentreCard): boolean {
    const explicit = openMap[card.key];
    if (typeof explicit === 'boolean') return explicit;
    return card.items.length > 0; // default-open when work waiting
  }

  // Quick Action tile config. 4 most-used creative starts.
  const quickActions: Array<{ key: string; banner: string; title: string; meta: string; goto: View; severe?: boolean }> = [
    { key: 'quote', banner: 'SALES', title: 'New quote', meta: `${data.quoteEstimates.length} this period`, goto: 'quotes' },
    { key: 'invoice', banner: 'BILLING', title: 'New invoice', meta: overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue` : `${data.invoices.length} total`, goto: 'invoices', severe: overdueInvoices.length > 0 },
    { key: 'job', banner: 'PRODUCTION', title: 'New job card', meta: overdueJobs.length > 0 ? `${overdueJobs.length} overdue` : `${data.jobs.filter((j: JobCard) => j.status !== 'Completed').length} active`, goto: 'jobs', severe: overdueJobs.length > 0 },
    { key: 'ncr', banner: 'QUALITY', title: 'Log NCR', meta: openNcrs.length > 0 ? `${openNcrs.length} open` : 'All closed', goto: 'nonConformance', severe: openNcrs.length > 0 },
  ];

  return (
    <div className="page-stack">
      <SectionTitle
        title={`Good ${timeOfDay}, ${greetingName}`}
        subtitle={totalIssues === 0
          ? `Nothing on fire. Quiet ${formatDate(today)}.`
          : `${totalIssues} thing${totalIssues === 1 ? '' : 's'} need your attention across the business.`}
      />

      {/* ───────────── DO TODAY (amber hero) ─────────────
          Cross-cutting items waiting on the signed-in user. Each tap
          jumps to the page where it can be actioned. */}
      {urgentItems.length > 0 && (
        <div style={{ ...cardBase, borderColor: HERO_AMBER, background: HERO_AMBER_TINT, borderLeft: `6px solid ${HERO_AMBER}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 42, height: 42, borderRadius: 999,
              background: HERO_AMBER, color: '#fff', fontSize: 22, fontWeight: 800,
            }}>{urgentItems.length}</span>
            <h2 style={{ margin: 0, fontSize: 20, color: '#92400e' }}>Do today</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgentItems.map((item, idx) => {
              const isDanger = item.badgeClass?.includes('danger');
              const chipColor = isDanger ? HERO_RED : HERO_AMBER;
              return (
                <button
                  key={idx}
                  type="button"
                  style={tapRowBase}
                  onClick={() => item.goto && onNavigate(item.goto)}
                  disabled={!item.goto}
                >
                  {item.badge ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 44, height: 44, padding: '0 10px', borderRadius: 10,
                      background: chipColor, color: '#fff',
                      fontSize: item.badge.length > 4 ? 12 : 18, fontWeight: 800, flexShrink: 0,
                      letterSpacing: item.badge.length > 4 ? '0.04em' : 'normal',
                    }}>{item.badge}</span>
                  ) : null}
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 15 }}>{item.label}</strong>
                    {item.meta ? <span style={{ color: 'var(--jp-ink-3, #64748b)', fontSize: 12 }}>{item.meta}</span> : null}
                  </span>
                  {item.goto ? <span style={{ color: chipColor, fontWeight: 700, fontSize: 22 }}>{'>'}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────── ALL CLEAR (green) ───────────── */}
      {urgentItems.length === 0 && (
        <div style={{ ...cardBase, borderColor: HERO_GREEN, background: HERO_GREEN_TINT, borderLeft: `6px solid ${HERO_GREEN}`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '6px 12px', borderRadius: 6,
            background: HERO_GREEN, color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
          }}>ALL CLEAR</span>
          <div>
            <strong style={{ fontSize: 16, color: '#065f46' }}>Nothing on fire across the business.</strong>
            <div style={{ fontSize: 13, color: 'var(--jp-ink-3, #475569)' }}>Quiet {formatDate(today)}.</div>
          </div>
        </div>
      )}

      {/* ───────────── QUICK ACTIONS — 4 tiles ───────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {quickActions.map((qa) => (
          <button
            key={qa.key}
            type="button"
            onClick={() => onNavigate(qa.goto)}
            style={{
              ...cardBase,
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: `4px solid ${qa.severe ? HERO_RED : 'var(--jp-divider, #e5e7eb)'}`,
              padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: qa.severe ? HERO_RED : 'var(--jp-ink-3, #64748b)' }}>{qa.banner}</span>
            <strong style={{ fontSize: 16 }}>{qa.title}</strong>
            <span style={{ fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>{qa.meta}</span>
          </button>
        ))}
      </div>

      {/* ───────────── CATEGORY SECTIONS — collapsible ─────────────
          Cash flow / Production / Food safety / HR / Stock / SARS.
          Auto-expanded when items > 0. Left border turns amber when
          there's attention; red when items contain danger badges. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nonUrgentCards.map((card) => {
          const count = card.items.length;
          const open = isOpen(card);
          const hasDanger = card.items.some((i) => i.badgeClass?.includes('danger'));
          const borderColor = count === 0 ? 'var(--jp-divider, #e5e7eb)' : (hasDanger ? HERO_RED : HERO_AMBER);
          return (
            <div
              key={card.key}
              style={{
                ...cardBase,
                borderLeft: `4px solid ${borderColor}`,
                padding: '12px 16px',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenMap((m) => ({ ...m, [card.key]: !open }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', background: 'transparent', border: 'none',
                  padding: 0, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <strong style={{ flex: 1, fontSize: 15 }}>{card.title}</strong>
                {count > 0 ? (
                  <span style={{
                    padding: '3px 10px', borderRadius: 999,
                    background: hasDanger ? HERO_RED : HERO_AMBER, color: '#fff',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                  }}>{hasDanger ? `${count} ATTENTION` : `${count} WAITING`}</span>
                ) : (
                  <span style={{
                    padding: '3px 10px', borderRadius: 999,
                    background: 'var(--jp-divider, #e5e7eb)', color: 'var(--jp-ink-3, #475569)',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                  }}>OK</span>
                )}
                <span style={{ color: 'var(--jp-ink-3, #64748b)', fontWeight: 700, fontSize: 18, width: 18, textAlign: 'center' }}>{open ? '−' : '+'}</span>
              </button>

              {open && (
                <div style={{ marginTop: 10 }}>
                  {count === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--jp-ink-3, #64748b)' }}>Nothing to action — good work.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {card.items.map((item, idx) => {
                        const isDanger = item.badgeClass?.includes('danger');
                        const chipColor = isDanger ? HERO_RED : HERO_AMBER;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px',
                              border: '1px solid var(--jp-divider, #e5e7eb)',
                              borderRadius: 8, background: 'var(--jp-paper-soft, #fafafa)',
                            }}
                          >
                            {item.badge ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 38, height: 28, padding: '0 8px', borderRadius: 6,
                                background: chipColor, color: '#fff',
                                fontSize: item.badge.length > 4 ? 10 : 13, fontWeight: 800,
                                letterSpacing: item.badge.length > 4 ? '0.04em' : 'normal', flexShrink: 0,
                              }}>{item.badge}</span>
                            ) : null}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13 }}>{item.label}</div>
                              {item.meta ? <div style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>{item.meta}</div> : null}
                            </div>
                            {item.goto ? (
                              <button
                                type="button"
                                onClick={() => onNavigate(item.goto!)}
                                style={{
                                  padding: '6px 12px', fontSize: 12, fontWeight: 700,
                                  borderRadius: 6, border: '1px solid var(--jp-divider, #d1d5db)',
                                  background: 'var(--jp-paper, #fff)', cursor: 'pointer',
                                }}
                              >Open</button>
                            ) : null}
                          </div>
                        );
                      })}
                      {card.viewAll ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(card.viewAll!)}
                          style={{
                            alignSelf: 'flex-start', padding: '6px 12px', fontSize: 12,
                            borderRadius: 6, border: '1px solid var(--jp-divider, #d1d5db)',
                            background: 'transparent', cursor: 'pointer', marginTop: 4,
                          }}
                        >View all</button>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="muted" style={{ fontSize: '0.78rem', marginTop: 16 }}>
        Classic dashboard view available under{' '}
        <button type="button" className="ghost-button" style={{ padding: '2px 8px', fontSize: '0.78rem' }} onClick={() => onNavigate('morningDigest')}>Morning Digest</button>
        {' '}or{' '}
        <button type="button" className="ghost-button" style={{ padding: '2px 8px', fontSize: '0.78rem' }} onClick={() => onNavigate('reports')}>Reports</button>.
      </p>
    </div>
  );
}
