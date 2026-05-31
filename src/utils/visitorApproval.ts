/**
 * Phase 106.2 — Visitor area approval state machine.
 *
 * Pure helpers that take a VisitorAreaApprovalRequest, apply a decision,
 * and return the new request with an appended audit entry. App.tsx wraps
 * each call in a setData() so the state lands in AppData (and Phase 106.5
 * will additionally dispatch a notification through the channel layer).
 *
 * Every state change appends to history[] — never overwrites. That gives
 * us the full audit trail Aman's spec requires (who approved what, when,
 * which escalations happened, every override).
 *
 * The functions are intentionally side-effect-free so they're trivial to
 * test and easy to compose (e.g. expireOnCheckout chains over an array).
 */

import {
  Employee,
  FactoryArea,
  isEmployeeAvailableForApproval,
  VisitorApprovalActionType,
  VisitorApprovalAuditEntry,
  VisitorApprovalStatus,
  VisitorAreaApprovalRequest,
} from '../types';

/* ─── Phase 106.3 — Approver routing -------------------------------------
 *
 * Given a host employee, work out who should actually receive the
 * approval request right now:
 *
 *   - If host is 'Available' → host (the simple case).
 *   - If host has availabilityStatus='Delegate' AND a
 *     delegateApprovalToEmployeeId set → that delegate. We don't recurse
 *     (avoids infinite loops if A delegates to B and B delegates back);
 *     if the delegate is also unavailable, the escalation timer will pick
 *     it up later.
 *   - Else (host Busy / Away / In a meeting / On the road / inactive,
 *     or no delegate set) → backupApproverEmployeeId if it exists.
 *   - Final fallback → host (so the request still exists in the system
 *     and admin override can resolve it). The audit entry records that
 *     no backup was configured.
 *
 * Returns { id, name, source }. `source` describes WHY we picked them so
 * the audit trail can record it.
 * ─────────────────────────────────────────────────────────────────────── */
export interface ApproverRoutingResult {
  approverEmployeeId: string;
  approverName: string;
  /** Why this approver got the request — drives the audit note. */
  source: 'host_available' | 'delegate' | 'backup_unavailable_host' | 'no_backup_fallback_to_host';
}

export function routeApprover(host: Employee | undefined, allEmployees: Employee[]): ApproverRoutingResult {
  if (!host) {
    return { approverEmployeeId: '', approverName: 'Host TBD', source: 'no_backup_fallback_to_host' };
  }
  const hostName = `${host.firstName} ${host.lastName}`.trim();

  // Host is here and ready — request goes straight to them.
  if (isEmployeeAvailableForApproval(host)) {
    return { approverEmployeeId: host.id, approverName: hostName, source: 'host_available' };
  }

  // Host explicitly delegated approvals — try the delegate next.
  if (host.availabilityStatus === 'Delegate' && host.delegateApprovalToEmployeeId) {
    const delegate = allEmployees.find((e) => e.id === host.delegateApprovalToEmployeeId);
    if (delegate) {
      return {
        approverEmployeeId: delegate.id,
        approverName: `${delegate.firstName} ${delegate.lastName}`.trim(),
        source: 'delegate',
      };
    }
  }

  // Host unavailable — fall through to backup.
  if (host.backupApproverEmployeeId) {
    const backup = allEmployees.find((e) => e.id === host.backupApproverEmployeeId);
    if (backup) {
      return {
        approverEmployeeId: backup.id,
        approverName: `${backup.firstName} ${backup.lastName}`.trim(),
        source: 'backup_unavailable_host',
      };
    }
  }

  // No backup set + host unavailable. Still create the request against
  // the host (so it's visible / admin can override) but flag the source
  // so the audit trail makes it obvious.
  return { approverEmployeeId: host.id, approverName: hostName, source: 'no_backup_fallback_to_host' };
}

/** Find the escalation target for a request whose timer has fired.
 *  Pulls the backup of the current approver (not the original host) so
 *  chained escalations route correctly: host → backup → backup-of-backup.
 *  Returns null when no further escalation is possible. */
export function findEscalationTarget(
  request: VisitorAreaApprovalRequest,
  allEmployees: Employee[],
): { employeeId: string; name: string } | null {
  const current = allEmployees.find((e) => e.id === request.currentApproverEmployeeId);
  if (!current?.backupApproverEmployeeId) return null;
  const backup = allEmployees.find((e) => e.id === current.backupApproverEmployeeId);
  if (!backup) return null;
  // Don't loop back to someone already in the history chain.
  const seen = new Set(request.history.map((h) => h.actorEmployeeId).filter(Boolean));
  if (seen.has(backup.id)) return null;
  return {
    employeeId: backup.id,
    name: `${backup.firstName} ${backup.lastName}`.trim(),
  };
}

/** Walk every active request and auto-escalate the ones whose timer
 *  has fired. Pure: returns the new array; no side effects. App.tsx
 *  calls this on a setInterval so it runs while the dashboard is open.
 *  When the dashboard is closed, the next-open sweep catches up.
 *
 *  thresholdMinutes comes from appSettings.visitorApprovalEscalationMinutes
 *  (default 5). */
export function autoEscalateStaleRequests(
  requests: VisitorAreaApprovalRequest[],
  employees: Employee[],
  thresholdMinutes: number,
  nowIso: string = new Date().toISOString(),
): VisitorAreaApprovalRequest[] {
  const thresholdMs = Math.max(1, thresholdMinutes) * 60_000;
  const nowMs = new Date(nowIso).getTime();
  return requests.map((r) => {
    if (r.status !== 'pending' && r.status !== 'delegated') return r;
    const ageMs = nowMs - new Date(r.createdAt).getTime();
    if (ageMs < thresholdMs) return r;
    const target = findEscalationTarget(r, employees);
    if (!target) return r;
    // Re-use applyVisitorApprovalDecision so the history entry lands the
    // same shape as a manual escalation.
    return applyVisitorApprovalDecision(r, 'escalate', 'System (auto-escalate)', {
      delegatedToEmployeeId: target.employeeId,
      delegatedToName: target.name,
      note: `Auto-escalated after ${Math.round(ageMs / 60000)} min — host did not respond.`,
    });
  });
}

/** Build a fresh request when reception ticks restricted areas.
 *
 *  Phase 106.3 — `host` + `allEmployees` are now consulted so the request
 *  starts out routed to the right person (host, delegate, or backup)
 *  based on availabilityStatus. Without these, the request still works
 *  but it always goes to the host even when they're away. */
export function createApprovalRequest(input: {
  id: string;
  visitorLogEntryId: string;
  visitorName: string;
  visitorCompany: string;
  /** The original host the visitor is here to see — preserved on the
   *  request so we can show "here to see Aman" even after escalation. */
  hostEmployeeId: string;
  hostName: string;
  restrictedAreas: FactoryArea[];
  requestNote: string;
  receptionistName: string;
  /** Phase 106.3 — supply both to enable smart routing. */
  hostEmployee?: Employee;
  allEmployees?: Employee[];
}): VisitorAreaApprovalRequest {
  const nowIso = new Date().toISOString();
  const routing = (input.hostEmployee && input.allEmployees)
    ? routeApprover(input.hostEmployee, input.allEmployees)
    : { approverEmployeeId: input.hostEmployeeId, approverName: input.hostName, source: 'host_available' as const };
  const initialStatus: VisitorApprovalStatus =
    routing.source === 'delegate' || routing.source === 'backup_unavailable_host' ? 'delegated' : 'pending';
  const history: VisitorApprovalAuditEntry[] = [
    {
      at: nowIso,
      action: 'created',
      actorName: input.receptionistName,
      approvedAreas: [],
      note: input.requestNote || `Reception requested ${input.restrictedAreas.length} restricted area(s) for ${input.visitorName}.`,
    },
  ];
  if (routing.source !== 'host_available' && routing.source !== 'no_backup_fallback_to_host') {
    // Log the auto-routing as its own audit entry so the trail records
    // why the request didn't go straight to the host.
    history.push({
      at: nowIso,
      action: 'delegate',
      actorName: 'System (host unavailable)',
      delegatedToEmployeeId: routing.approverEmployeeId,
      delegatedToName: routing.approverName,
      note: routing.source === 'delegate'
        ? `Host on Delegate status — routed to ${routing.approverName}.`
        : `Host unavailable — auto-routed to backup ${routing.approverName}.`,
    });
  } else if (routing.source === 'no_backup_fallback_to_host' && input.hostEmployee) {
    history.push({
      at: nowIso,
      action: 'delegate',
      actorName: 'System',
      note: `Host ${input.hostName} is unavailable but has no backup configured — request still routed to them.`,
    });
  }
  return {
    id: input.id,
    visitorLogEntryId: input.visitorLogEntryId,
    visitorName: input.visitorName,
    visitorCompany: input.visitorCompany,
    hostEmployeeId: input.hostEmployeeId,
    hostName: input.hostName,
    requestedAreas: input.restrictedAreas,
    approvedAreas: [],
    status: initialStatus,
    currentApproverEmployeeId: routing.approverEmployeeId,
    currentApproverName: routing.approverName,
    createdAt: nowIso,
    expiresAt: endOfTodayIso(),
    history,
    requestNote: input.requestNote,
  };
}

/** Apply a host (or backup) decision. Returns a NEW request — never mutates. */
export function applyVisitorApprovalDecision(
  request: VisitorAreaApprovalRequest,
  decision: VisitorApprovalActionType,
  actorName: string,
  options?: {
    actorEmployeeId?: string;
    /** For approve-some: subset of requestedAreas the actor is granting. */
    approvedAreas?: FactoryArea[];
    /** For delegate: who the request now sits with. */
    delegatedToEmployeeId?: string;
    delegatedToName?: string;
    /** Free-text reason recorded on the audit entry. */
    note?: string;
  },
): VisitorAreaApprovalRequest {
  const nowIso = new Date().toISOString();
  const auditEntry: VisitorApprovalAuditEntry = {
    at: nowIso,
    action: decision,
    actorEmployeeId: options?.actorEmployeeId,
    actorName,
    delegatedToEmployeeId: options?.delegatedToEmployeeId,
    delegatedToName: options?.delegatedToName,
    approvedAreas: options?.approvedAreas,
    note: options?.note,
  };
  const baseHistory = [...request.history, auditEntry];

  switch (decision) {
    case 'approve-all':
      return {
        ...request,
        status: 'approved',
        approvedAreas: request.requestedAreas,
        decidedAt: nowIso,
        history: baseHistory,
      };

    case 'approve-some': {
      const granted = (options?.approvedAreas ?? []).filter((a) =>
        request.requestedAreas.includes(a),
      );
      return {
        ...request,
        status: granted.length > 0 ? 'approved_partial' : 'declined',
        approvedAreas: granted,
        decidedAt: nowIso,
        history: baseHistory,
      };
    }

    case 'decline':
      return {
        ...request,
        status: 'declined',
        approvedAreas: [],
        decidedAt: nowIso,
        history: baseHistory,
      };

    case 'keep-reception':
      return {
        ...request,
        status: 'keep_reception',
        approvedAreas: [],
        decidedAt: nowIso,
        history: baseHistory,
      };

    case 'delegate':
      return {
        ...request,
        status: 'delegated',
        currentApproverEmployeeId: options?.delegatedToEmployeeId ?? request.currentApproverEmployeeId,
        currentApproverName: options?.delegatedToName ?? request.currentApproverName,
        history: baseHistory,
      };

    case 'escalate':
      // Auto-escalation — Phase 106.3 fires this; status stays in the
      // "needs decision" family but currentApprover swaps to the backup.
      return {
        ...request,
        status: 'escalated',
        currentApproverEmployeeId: options?.delegatedToEmployeeId ?? request.currentApproverEmployeeId,
        currentApproverName: options?.delegatedToName ?? request.currentApproverName,
        history: baseHistory,
      };

    case 'override':
      // Admin / reception manager force-applies a decision. approvedAreas
      // comes from options; status hardens to 'overridden' so audit can
      // distinguish it from a normal host approval.
      return {
        ...request,
        status: 'overridden',
        approvedAreas: options?.approvedAreas ?? request.requestedAreas,
        decidedAt: nowIso,
        history: baseHistory,
      };

    case 'expire':
      return {
        ...request,
        status: 'expired',
        approvedAreas: [],
        history: baseHistory,
      };

    case 'revoke':
      return {
        ...request,
        status: 'expired',
        approvedAreas: [],
        history: baseHistory,
      };

    case 'created':
    default:
      // No-op (created is set by createApprovalRequest already).
      return { ...request, history: baseHistory };
  }
}

/** End-of-day ISO timestamp — visitor access defaults to same-day. */
function endOfTodayIso(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/** Pure predicate — has this request expired vs. now? */
export function isApprovalExpired(request: VisitorAreaApprovalRequest, nowIso: string = new Date().toISOString()): boolean {
  if (request.status === 'expired') return true;
  if (!request.expiresAt) return false;
  return request.expiresAt < nowIso;
}

/** Filter applied to inbox / page lists — does this approver need to see
 *  this request? Includes both directly-assigned and delegated-to-them. */
export function isApprovalForApprover(request: VisitorAreaApprovalRequest, employeeId: string): boolean {
  if (!employeeId) return false;
  if (request.status !== 'pending' && request.status !== 'delegated' && request.status !== 'escalated') return false;
  return request.currentApproverEmployeeId === employeeId;
}

/** Convenience — the most recent VisitorApprovalStatus we'd describe as "in flight". */
export const ACTIVE_APPROVAL_STATUSES: VisitorApprovalStatus[] = ['pending', 'delegated', 'escalated'];

/* ─── Phase 106.5 — Notification payload helpers ──────────────────── */

/** Turn a fresh approval request into a NotificationPayload ready for
 *  the dispatcher. Caller resolves the recipient (host / backup) and
 *  picks priority based on context (routine for booked visits, important
 *  for walk-ins, critical for escalations). */
export function notificationFromApprovalRequest(
  request: VisitorAreaApprovalRequest,
  recipient: import('./notifications').NotificationRecipient,
  priority: import('./notifications').NotificationPriority = 'important',
): import('./notifications').NotificationPayload {
  const visitorLabel = request.visitorCompany
    ? `${request.visitorName} (${request.visitorCompany})`
    : request.visitorName;
  return {
    id: `vap-${request.id}`,
    recipient,
    priority,
    title: `${visitorLabel} is at reception`,
    body: `Wants access to: ${request.requestedAreas.join(', ')}. Open the inbox to approve, decline, or delegate.`,
    deepLink: '/inbox',
    meta: {
      requestId: request.id,
      visitorName: request.visitorName,
      areaCount: request.requestedAreas.length,
      status: request.status,
    },
  };
}
