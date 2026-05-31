/**
 * Phase 102 — Activity Inbox.
 *
 * The Inbox is a single unified feed of everything the owner needs to see
 * — leave requests submitted, first aid incidents, low stock, overdue
 * invoices, SARS deadlines coming up, etc. Designed to scale: events get
 * categorised, batched, and de-noised so 100-200 daily events stay
 * scannable.
 *
 * Architecture:
 *   - InboxEvent = a typed record with stable id, category, tone, title,
 *     optional detail, and one or two inline actions.
 *   - Producers = pure functions that read AppData and emit events. Each
 *     producer is responsible for one source (leave, claims, NCRs, low
 *     stock, etc.). Adding a new event type is one new producer.
 *   - State (read / snoozed / dismissed) lives in localStorage keyed by
 *     event id. Computed events use deterministic ids so state survives
 *     across renders.
 *   - Batching: events with the same `batchKey` collapse into one row
 *     until expanded — keeps daily volume manageable.
 *
 * Why localStorage v1: Supabase persistence needs a new table + sync. We
 * can graduate to that once event volume justifies it. For now everything
 * works offline-first.
 */

import {
  AppData,
  ExpenseClaim,
  LeaveRequest,
  computeAuditNextDue,
  InboxCategory,
  ALL_INBOX_CATEGORIES,
  VisitorAreaApprovalRequest,
} from '../types';

// Re-export so existing imports of `InboxCategory` / `INBOX_CATEGORIES` from
// this module keep working unchanged.
export type { InboxCategory } from '../types';
export const INBOX_CATEGORIES: InboxCategory[] = ALL_INBOX_CATEGORIES;

export type InboxTone = 'info' | 'warning' | 'alert' | 'success';
export type InboxStatus = 'unread' | 'seen' | 'actioned' | 'snoozed' | 'dismissed';

export type InboxActionType =
  | 'approve-leave'
  | 'decline-leave'
  | 'approve-claim'
  | 'decline-claim'
  /* Phase 106.2 — Visitor area approval actions. The entityId on the
   * InboxAction carries the VisitorAreaApprovalRequest id; App.tsx routes
   * each to the matching helper in visitorApproval.ts. */
  | 'visitor-approve-all'
  | 'visitor-approve-some'   // opens an area picker; not auto-applied
  | 'visitor-decline'
  | 'visitor-keep-reception'
  | 'visitor-delegate'       // opens an employee picker; not auto-applied
  | 'open'                  // jump to detail page
  | 'mark-seen'
  | 'snooze-1d'
  | 'snooze-1w'
  | 'dismiss';

export interface InboxAction {
  type: InboxActionType;
  label: string;
  /** Optional: which `View` to jump to when type === 'open'. */
  targetView?: string;
  /** Optional: id of the entity (used by approve handlers). */
  entityId?: string;
}

export interface InboxEvent {
  /** Stable id — deterministic so localStorage state survives across renders. */
  id: string;
  occurredAt: string;
  category: InboxCategory;
  tone: InboxTone;
  title: string;
  detail?: string;
  actorName?: string;
  primary?: InboxAction;
  secondary?: InboxAction;
  /** Events with the same batchKey + category collapse together. */
  batchKey?: string;
}

export interface InboxEventState {
  status: InboxStatus;
  snoozedUntil?: string;
  actionedAt?: string;
}

const STATE_KEY = 'jomopak-inbox-state-v1';

export function loadInboxState(): Record<string, InboxEventState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, InboxEventState>) : {};
  } catch {
    return {};
  }
}

export function saveInboxState(state: Record<string, InboxEventState>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/** Effective status — auto-promotes 'snoozed' back to 'unread' once the
 *  snooze period elapses, so events resurface rather than vanish. */
export function effectiveStatus(state: InboxEventState | undefined, today: string): InboxStatus {
  if (!state) return 'unread';
  if (state.status === 'snoozed' && state.snoozedUntil && state.snoozedUntil < today) {
    return 'unread';
  }
  return state.status;
}

/* ────────────────────────────────────────────────────────────────────
 * PRODUCERS — one per event source. Each returns an array of events.
 * Adding a new event type means writing one new producer + including it
 * in `produceAllEvents`.
 * ──────────────────────────────────────────────────────────────────── */

function produceLeaveRequests(data: AppData): InboxEvent[] {
  return (data.leaveRequests ?? [])
    .filter((r) => r.status === 'Pending')
    .map((r): InboxEvent => ({
      id: `leave-req-${r.id}`,
      occurredAt: r.createdAt ?? r.startDate ?? new Date().toISOString(),
      category: 'HR',
      tone: 'warning',
      title: `${r.employeeName} requested ${r.type} leave`,
      detail: `${r.startDate} → ${r.endDate} · ${r.days} day(s) · ${r.reason || 'no reason given'}`,
      actorName: r.employeeName,
      primary: { type: 'approve-leave', label: 'Approve', entityId: r.id },
      secondary: { type: 'decline-leave', label: 'Decline', entityId: r.id },
      batchKey: 'leave-pending',
    }));
}

function produceExpenseClaims(data: AppData): InboxEvent[] {
  return (data.expenseClaims ?? [])
    .filter((c) => c.status === 'Pending')
    .map((c): InboxEvent => ({
      id: `claim-${c.id}`,
      occurredAt: c.createdAt ?? new Date().toISOString(),
      category: 'HR',
      tone: 'warning',
      title: `${c.employeeName} submitted an expense claim`,
      detail: `R ${c.amount.toFixed(2)} · ${c.category} · ${c.description || ''}`.trim(),
      actorName: c.employeeName,
      primary: { type: 'approve-claim', label: 'Approve', entityId: c.id },
      secondary: { type: 'decline-claim', label: 'Decline', entityId: c.id },
      batchKey: 'claim-pending',
    }));
}

function produceIncidents(data: AppData, since: string): InboxEvent[] {
  return (data.incidentEntries ?? [])
    .filter((i) => i.createdAt >= since && !i.closedAt)
    .map((i): InboxEvent => ({
      id: `incident-${i.id}`,
      occurredAt: i.createdAt,
      category: 'Safety',
      tone: i.severity === 'Critical' || i.severity === 'High' ? 'alert' : 'warning',
      title: `${i.incidentType}: ${i.personName}`,
      detail: `${i.location || 'Unknown location'} · ${i.bodyPartAffected || ''} · ${i.severity}`.trim(),
      actorName: i.reporterName,
      primary: { type: 'open', label: 'Open', targetView: 'incidentRegister' },
      secondary: { type: 'mark-seen', label: 'Mark seen' },
    }));
}

function produceFirstAid(data: AppData, since: string): InboxEvent[] {
  const recent = (data.firstAidEntries ?? []).filter((e) => e.createdAt >= since);
  if (recent.length === 0) return [];
  // Batch all recent first aid into one row — they're usually low severity.
  return [{
    id: `first-aid-batch-${since.slice(0, 10)}`,
    occurredAt: recent[0].createdAt,
    category: 'Safety',
    tone: 'info',
    title: `${recent.length} first aid treatment${recent.length === 1 ? '' : 's'} logged`,
    detail: recent.slice(0, 3).map((e) => `${e.employeeName || e.visitorName} · ${e.injuryType}`).join(' • '),
    primary: { type: 'open', label: 'Open register', targetView: 'firstAidRegister' },
    secondary: { type: 'mark-seen', label: 'Mark seen' },
    batchKey: 'first-aid',
  }];
}

function produceStockRequests(data: AppData): InboxEvent[] {
  return (data.stockRequests ?? [])
    .filter((r) => r.status === 'Pending Manager')
    .map((r): InboxEvent => ({
      id: `stock-req-${r.id}`,
      occurredAt: r.createdAt ?? new Date().toISOString(),
      category: 'Operations',
      tone: 'warning',
      title: `${r.requestedByName} requested stock`,
      detail: `${r.itemName} · ${r.quantity} ${r.unit || ''}`.trim(),
      actorName: r.requestedByName,
      primary: { type: 'open', label: 'Open', targetView: 'stockRequestsApprove' },
      secondary: { type: 'snooze-1d', label: 'Snooze 1d' },
    }));
}

function produceLowStock(data: AppData): InboxEvent[] {
  return data.spareParts
    .filter((s) => s.reorderLevel > 0 && s.quantityOnHand <= s.reorderLevel)
    .slice(0, 20)
    .map((s): InboxEvent => ({
      id: `low-stock-${s.id}`,
      occurredAt: new Date().toISOString(),
      category: 'Operations',
      tone: 'warning',
      title: `Low stock: ${s.partName}`,
      detail: `${s.quantityOnHand} on hand (reorder at ${s.reorderLevel})`,
      primary: { type: 'open', label: 'Open spares', targetView: 'spares' },
      secondary: { type: 'snooze-1w', label: 'Snooze 1w' },
      batchKey: 'low-stock',
    }));
}

function produceOverdueInvoices(data: AppData, today: string): InboxEvent[] {
  return data.invoices
    .filter((inv) => inv.amountOutstanding > 0
      && inv.status !== 'Cancelled' && inv.status !== 'Draft' && inv.status !== 'Paid'
      && inv.dueDate && inv.dueDate < today)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 30)
    .map((inv): InboxEvent => {
      const daysLate = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
      return {
        id: `inv-overdue-${inv.id}`,
        occurredAt: inv.dueDate,
        category: 'Finance',
        tone: daysLate > 30 ? 'alert' : 'warning',
        title: `${inv.invoiceNumber} · ${inv.clientName} · R ${inv.amountOutstanding.toFixed(2)}`,
        detail: `${daysLate} day(s) overdue`,
        primary: { type: 'open', label: 'Open invoice', targetView: 'invoices' },
        secondary: { type: 'snooze-1w', label: 'Snooze 1w' },
        batchKey: 'overdue-invoice',
      };
    });
}

function produceNewLeads(data: AppData, since: string): InboxEvent[] {
  return data.leads
    .filter((l) => l.createdAt >= since && l.status !== 'Lost' && l.status !== 'Won')
    .slice(0, 30)
    .map((l): InboxEvent => ({
      id: `lead-${l.id}`,
      occurredAt: l.createdAt,
      category: 'Sales',
      tone: 'info',
      title: `New lead: ${l.contactName || l.companyName || l.leadNumber}`,
      detail: `${l.source}${l.phone ? ` · ${l.phone}` : ''}${l.email ? ` · ${l.email}` : ''}`,
      primary: { type: 'open', label: 'Open lead', targetView: 'leads' },
      secondary: { type: 'mark-seen', label: 'Mark seen' },
      batchKey: 'new-lead',
    }));
}

function produceLeadFollowUps(data: AppData, today: string): InboxEvent[] {
  return data.leads
    .filter((l) => l.status !== 'Won' && l.status !== 'Lost')
    .filter((l) => l.nextFollowUpDate && l.nextFollowUpDate <= today)
    .map((l): InboxEvent => ({
      id: `lead-followup-${l.id}-${l.nextFollowUpDate}`,
      occurredAt: l.nextFollowUpDate || today,
      category: 'Sales',
      tone: 'warning',
      title: `Follow up: ${l.contactName || l.companyName}`,
      detail: `Last touch was scheduled for ${l.nextFollowUpDate}`,
      primary: { type: 'open', label: 'Open lead', targetView: 'leads' },
      secondary: { type: 'snooze-1d', label: 'Snooze 1d' },
      batchKey: 'lead-followup',
    }));
}

function produceNcrsOverdue(data: AppData, today: string): InboxEvent[] {
  return data.nonConformances
    .filter((n) => n.status !== 'Closed' && n.dueDate && n.dueDate < today)
    .slice(0, 20)
    .map((n): InboxEvent => ({
      id: `ncr-overdue-${n.id}`,
      occurredAt: n.dueDate,
      category: 'Safety',
      tone: 'alert',
      title: `NCR overdue: ${n.ncrNumber}`,
      detail: `${n.description.slice(0, 90)} · due ${n.dueDate}`,
      primary: { type: 'open', label: 'Open NCR', targetView: 'nonConformance' },
    }));
}

function produceJobsOverdue(data: AppData, today: string): InboxEvent[] {
  return data.jobs
    .filter((j) => j.dueDate && j.dueDate < today && j.status !== 'Completed')
    .slice(0, 30)
    .map((j): InboxEvent => ({
      id: `job-overdue-${j.id}`,
      occurredAt: j.dueDate,
      category: 'Production',
      tone: 'alert',
      title: `Job overdue: ${j.jobNumber}`,
      detail: `${j.customerName} · ${j.productName || ''} · due ${j.dueDate}`,
      primary: { type: 'open', label: 'Open job', targetView: 'jobs' },
      secondary: { type: 'snooze-1d', label: 'Snooze 1d' },
      batchKey: 'job-overdue',
    }));
}

function produceSarsDeadlines(data: AppData, today: string): InboxEvent[] {
  const cfg = data.appSettings?.sarsConfig;
  if (!cfg) return [];
  // Lazy import-style: we use SARS helpers via type-only access since
  // they're already imported elsewhere. Skip the heavy calendar walk if
  // there are no filings yet.
  const overdueIds = (data.sarsFilings ?? []).filter((f) => f.status !== 'Submitted' && f.status !== 'Paid');
  return overdueIds.slice(0, 8).map((f): InboxEvent => ({
    id: `sars-${f.id}`,
    occurredAt: f.createdAt || today,
    category: 'Finance',
    tone: 'warning',
    title: `SARS · ${f.obligationType} · ${f.periodLabel}`,
    detail: `Due ${f.dueDate} · status ${f.status}`,
    primary: { type: 'open', label: 'Open SARS Centre', targetView: 'sarsCentre' },
    secondary: { type: 'snooze-1d', label: 'Snooze 1d' },
    batchKey: 'sars',
  }));
}

/**
 * Phase 103.2 — Audit Programme deadline producer.
 *
 * For each Active audit programme, work out the next due date (cadence-derived
 * unless manually overridden) and emit an event at 90 / 60 / 30 / 7 days out
 * plus a more urgent one once it's overdue. Paused / Lapsed programmes don't
 * emit — pause is the "remind me later, this isn't scheduled yet" lever.
 */
function produceAuditDeadlines(data: AppData, today: string): InboxEvent[] {
  const programmes = data.auditProgrammes ?? [];
  const todayMs = new Date(today).getTime();

  const events: InboxEvent[] = [];
  programmes.forEach((p) => {
    if (p.status !== 'Active') return;
    const due = computeAuditNextDue(p);
    if (!due) return;
    const days = Math.round((new Date(due).getTime() - todayMs) / 86400000);
    // Only surface inside a 90-day horizon, or when already overdue.
    if (days > 90) return;

    const overdue = days < 0;
    const tone: InboxEvent['tone'] = overdue ? 'alert' : days <= 30 ? 'warning' : 'info';
    const label = overdue
      ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
      : `Due in ${days} day${days === 1 ? '' : 's'}`;

    events.push({
      id: `audit-${p.id}-${due}`,
      occurredAt: due,
      category: 'Safety',
      tone,
      title: `Audit due: ${p.name}`,
      detail: `${p.auditingBody || 'Auditor TBD'} · ${label}`,
      primary: { type: 'open', label: 'Open audit register', targetView: 'auditProgrammes' },
      secondary: { type: 'snooze-1w', label: 'Snooze 1w' },
      batchKey: 'audit-deadline',
    });
  });
  return events;
}

/**
 * Phase 106.2 — Visitor area approval requests producer.
 *
 * For every pending VisitorAreaApprovalRequest, emit one inbox event aimed
 * at the current approver (host or, after escalation, the backup). The
 * primary action approves all requested areas; secondary surfaces the
 * decline path. The full picker UI (approve-some / delegate) opens inside
 * the Inbox row's expanded detail (rendered separately when the user
 * clicks the row); the producer only seeds the headline actions so the
 * row reads at a glance.
 *
 * Per Aman's spec: every action is logged via the request's history
 * array — App.tsx mutates the request via applyVisitorApprovalDecision()
 * which appends an audit entry on every state change.
 */
function produceVisitorApprovalRequests(data: AppData): InboxEvent[] {
  const pending = (data.visitorAreaApprovalRequests ?? []).filter(
    (r) => r.status === 'pending' || r.status === 'delegated' || r.status === 'escalated',
  );
  return pending.map((r): InboxEvent => {
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    const minutes = Math.max(0, Math.floor(ageMs / 60000));
    const ageLabel = minutes < 60
      ? `${minutes} min ago`
      : minutes < 1440
        ? `${Math.floor(minutes / 60)}h ago`
        : `${Math.floor(minutes / 1440)}d ago`;
    return {
      id: `visitor-approval-${r.id}`,
      occurredAt: r.createdAt,
      category: 'Operations',
      // Older than escalation window = alert tone; otherwise warning.
      tone: minutes >= 5 ? 'alert' : 'warning',
      title: `Visitor at reception: ${r.visitorName}${r.visitorCompany ? ' · ' + r.visitorCompany : ''}`,
      detail: `${r.requestedAreas.join(', ')} · waiting on ${r.currentApproverName} · arrived ${ageLabel}`,
      actorName: r.currentApproverName,
      primary: {
        type: 'visitor-approve-all',
        label: 'Approve all',
        entityId: r.id,
      },
      secondary: {
        type: 'visitor-decline',
        label: 'Decline',
        entityId: r.id,
      },
      batchKey: 'visitor-approval',
    };
  });
}

function produceMissingDrill(data: AppData, today: string): InboxEvent[] {
  const drills = data.drillEntries ?? [];
  if (drills.length === 0) return [{
    id: 'drill-missing',
    occurredAt: today,
    category: 'Safety',
    tone: 'warning',
    title: 'No fire drills logged yet',
    detail: 'SA OHS Act requires at least one fire drill every 6 months.',
    primary: { type: 'open', label: 'Open drill register', targetView: 'drillRegister' },
    secondary: { type: 'snooze-1w', label: 'Snooze 1w' },
  }];
  const last = drills.slice().sort((a, b) => b.drillDate.localeCompare(a.drillDate))[0];
  const days = Math.floor((new Date(today).getTime() - new Date(last.drillDate).getTime()) / 86400000);
  if (days <= 180) return [];
  return [{
    id: `drill-stale-${last.drillDate}`,
    occurredAt: last.drillDate,
    category: 'Safety',
    tone: 'warning',
    title: `Fire drill overdue (last was ${days} days ago)`,
    detail: 'Schedule the next drill — OHS Act requires < 6-month cadence.',
    primary: { type: 'open', label: 'Open drill register', targetView: 'drillRegister' },
    secondary: { type: 'snooze-1w', label: 'Snooze 1w' },
  }];
}

/** Run all producers and return a single chronological list. */
export function produceAllEvents(data: AppData): InboxEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const events: InboxEvent[] = [
    ...produceLeaveRequests(data),
    ...produceExpenseClaims(data),
    ...produceIncidents(data, sevenDaysAgo),
    ...produceFirstAid(data, sevenDaysAgo),
    ...produceStockRequests(data),
    ...produceLowStock(data),
    ...produceOverdueInvoices(data, today),
    ...produceNewLeads(data, sevenDaysAgo),
    ...produceLeadFollowUps(data, today),
    ...produceNcrsOverdue(data, today),
    ...produceJobsOverdue(data, today),
    ...produceSarsDeadlines(data, today),
    ...produceMissingDrill(data, today),
    ...produceAuditDeadlines(data, today),
    ...produceVisitorApprovalRequests(data),
  ];

  // Newest first.
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Group events by batchKey so similar items collapse in the UI. */
export interface BatchGroup {
  batchKey: string;
  category: InboxCategory;
  events: InboxEvent[];
}

export function batchEvents(events: InboxEvent[]): { single: InboxEvent[]; batched: BatchGroup[] } {
  const single: InboxEvent[] = [];
  const groups = new Map<string, BatchGroup>();
  for (const e of events) {
    if (!e.batchKey) { single.push(e); continue; }
    const key = `${e.category}:${e.batchKey}`;
    const existing = groups.get(key) ?? { batchKey: e.batchKey, category: e.category, events: [] };
    existing.events.push(e);
    groups.set(key, existing);
  }
  // Singletons stay as single rows; only batch when 2+ events share a key.
  const batched: BatchGroup[] = [];
  for (const g of groups.values()) {
    if (g.events.length === 1) { single.push(g.events[0]); }
    else { batched.push(g); }
  }
  return { single, batched };
}

/** Quick helper for friendly relative time labels. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/* ────────────────────────────────────────────────────────────────────
 * Local handlers used by the page when the action doesn't need to leave
 * the inbox (approve / decline leave + claim inline).
 * ──────────────────────────────────────────────────────────────────── */

export function applyLeaveDecision(req: LeaveRequest, decision: 'Approved' | 'Declined', approverName: string): LeaveRequest {
  return {
    ...req,
    status: decision,
    approvedAt: new Date().toISOString(),
    approvedByName: approverName,
  };
}

export function applyClaimDecision(claim: ExpenseClaim, decision: 'Approved' | 'Declined', approverName: string): ExpenseClaim {
  return {
    ...claim,
    status: decision,
    approvedAt: new Date().toISOString(),
    approvedByName: approverName,
  };
}
