/**
 * useNotifications — Phase 16 (Task #96)
 *
 * Notifications are *derived* live from app data rather than stored in the
 * database. The goal is to surface the small set of things that need human
 * attention each day, without asking ops to maintain another table.
 *
 * The hook owns the "read" set in localStorage, keyed by the deterministic
 * notification id we synthesise from each rule (so the same overdue invoice
 * stays read across reloads until something changes). When the underlying
 * data changes, ids re-stabilise — read items disappear from the unread
 * count automatically.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppData, AppNotification, NotificationSeverity, SARS_OBLIGATION_SHORT } from '../types';
import { buildSarsCalendar } from '../utils/sars';

const STORAGE_KEY = 'jomopak.notifications.read';
const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.floor((t - Date.now()) / DAY_MS);
}

function daysAgo(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - t) / DAY_MS);
}

function severityForDays(daysOverdue: number): NotificationSeverity {
  if (daysOverdue >= 14) return 'urgent';
  if (daysOverdue >= 3) return 'warn';
  return 'info';
}

/** Build the full list of derived notifications from current app data. */
export function deriveNotifications(data: AppData): AppNotification[] {
  const list: AppNotification[] = [];
  const now = new Date().toISOString();

  // ── Overdue invoices ───────────────────────────────────────────────────
  for (const inv of data.invoices) {
    if (!inv.dueDate) continue;
    if (inv.status === 'Paid' || inv.status === 'Cancelled') continue;
    const overdueDays = daysAgo(inv.dueDate);
    if (overdueDays < 1) continue;
    list.push({
      id: `inv-overdue-${inv.id}-${overdueDays}`,
      kind: 'invoiceOverdue',
      severity: severityForDays(overdueDays),
      title: `Invoice ${inv.invoiceNumber} overdue`,
      message: `${inv.clientName} — ${overdueDays}d past due`,
      link: { view: 'invoices', entityId: inv.id },
      createdAt: now,
    });
  }

  // ── Jobs with no artwork approval where due in <7 days ─────────────────
  for (const job of data.jobs) {
    if (!job.dueDate) continue;
    const due = daysFromNow(job.dueDate);
    if (due > 7 || due < -30) continue;
    const art = data.artworkRecords.find((a) => a.jobId === job.id);
    if (art && art.stage === 'Approved') continue;
    list.push({
      id: `job-noart-${job.id}`,
      kind: 'jobMissingArtwork',
      severity: due < 2 ? 'urgent' : 'warn',
      title: `Job ${job.jobNumber} — artwork not approved`,
      message: `${job.customerName || ''} • due ${job.dueDate}`,
      link: { view: 'jobs', entityId: job.id },
      createdAt: now,
    });
  }

  // ── Leads with follow-up date in the past ──────────────────────────────
  for (const lead of data.leads) {
    if (lead.status === 'Won' || lead.status === 'Lost') continue;
    if (!lead.nextFollowUpDate) continue;
    const overdue = daysAgo(lead.nextFollowUpDate);
    if (overdue < 1) continue;
    list.push({
      id: `lead-followup-${lead.id}-${overdue}`,
      kind: 'leadFollowUpDue',
      severity: severityForDays(overdue),
      title: `Lead ${lead.leadNumber} — follow-up overdue`,
      message: `${lead.companyName || lead.contactName} • ${overdue}d`,
      link: { view: 'leads', entityId: lead.id },
      createdAt: now,
    });
  }

  // ── Spare parts at/under reorder point ─────────────────────────────────
  for (const part of data.spareParts) {
    const reorder = part.reorderLevel ?? 0;
    const onHand = part.quantityOnHand ?? 0;
    if (reorder <= 0) continue;
    if (onHand > reorder) continue;
    list.push({
      id: `spare-low-${part.id}`,
      kind: 'sparePartLowStock',
      severity: onHand === 0 ? 'urgent' : 'warn',
      title: `${part.partName || part.partCode || 'Spare'} below reorder`,
      message: `${onHand} on hand • reorder ${reorder}`,
      link: { view: 'spares', entityId: part.id },
      createdAt: now,
    });
  }

  // ── Cleaning logs overdue (no entry for the area in N days) ────────────
  // We only flag when the area's last cleaning is more than 7 days old.
  const lastCleanByArea = new Map<string, string>();
  for (const cl of data.cleaningLogs) {
    const area = cl.area || '';
    if (!area) continue;
    const prev = lastCleanByArea.get(area);
    const cur = cl.performedAt || cl.createdAt || '';
    if (!prev || (cur && cur > prev)) lastCleanByArea.set(area, cur);
  }
  for (const [area, last] of lastCleanByArea) {
    const since = daysAgo(last);
    if (since < 7) continue;
    list.push({
      id: `cleaning-${area}-${since}`,
      kind: 'cleaningOverdue',
      severity: severityForDays(since - 7),
      title: `Cleaning overdue — ${area}`,
      message: `Last cleaned ${since}d ago`,
      link: { view: 'cleaningLogs' },
      createdAt: now,
    });
  }

  // ── SOPs expiring/expired ──────────────────────────────────────────────
  for (const sop of data.sopDocuments) {
    const review = sop.reviewDate || '';
    if (!review) continue;
    const until = daysFromNow(review);
    if (until > 30) continue;
    list.push({
      id: `sop-exp-${sop.id}-${until}`,
      kind: 'sopExpiring',
      severity: until < 0 ? 'urgent' : until < 7 ? 'warn' : 'info',
      title: `SOP ${sop.title || sop.documentNumber || sop.id} review due`,
      message: until < 0 ? `Expired ${-until}d ago` : `In ${until}d`,
      link: { view: 'sopRegister', entityId: sop.id },
      createdAt: now,
    });
  }

  // ── Machine maintenance due / overdue ──────────────────────────────────
  for (const m of data.machines) {
    const next = m.nextServiceDate || '';
    if (!next) continue;
    const until = daysFromNow(next);
    if (until > 14) continue;
    list.push({
      id: `maint-${m.id}-${until}`,
      kind: 'maintenanceDue',
      severity: until < 0 ? 'urgent' : until < 3 ? 'warn' : 'info',
      title: `Machine ${m.name || m.id} service due`,
      message: until < 0 ? `Overdue by ${-until}d` : `In ${until}d`,
      link: { view: 'machines', entityId: m.id },
      createdAt: now,
    });
  }

  // ── Credit-block clients ────────────────────────────────────────────────
  // We don't have a categorical creditStatus column. Use the structured
  // signals we do have:
  //   • accountHold === true → soft "On Hold" (operator should review)
  //   • currentBalance >= creditLimit (limit > 0) → hard "Block"
  // Live AR outstanding per client (unpaid non-draft invoices) — credit checks
  // use this rather than the stored currentBalance so they reflect reality.
  const arByClient = new Map<string, number>();
  for (const inv of data.invoices) {
    if (inv.status === 'Draft' || inv.status === 'Cancelled') continue;
    arByClient.set(inv.clientId, (arByClient.get(inv.clientId) || 0) + (Number(inv.amountOutstanding) || 0));
  }
  for (const c of data.clients) {
    const liveBalance = arByClient.has(c.id)
      ? arByClient.get(c.id)! + (Number(c.openingBalance) || 0)
      : (Number(c.currentBalance) || 0);
    const onHold = c.accountHold === true;
    const overLimit = (c.creditLimit || 0) > 0 && liveBalance >= (c.creditLimit || 0);
    if (!onHold && !overLimit) continue;
    list.push({
      id: `credit-${c.id}`,
      kind: 'creditBlock',
      severity: overLimit ? 'urgent' : 'warn',
      title: `${c.companyName || c.name || 'Client'} ${overLimit ? 'over credit limit' : 'on credit hold'}`,
      message: overLimit
        ? `Balance ${Math.round(liveBalance).toLocaleString()} ≥ limit ${Math.round(c.creditLimit || 0).toLocaleString()}`
        : 'Account hold flag set — review before new orders',
      link: { view: 'clients', entityId: c.id },
      createdAt: now,
    });
  }

  // ── Documents expiring / expired (Document Vault) ──────────────────────
  for (const doc of data.documents || []) {
    if (!doc.expiryDate) continue;
    const until = daysFromNow(doc.expiryDate);
    if (until > 30) continue;
    list.push({
      id: `doc-exp-${doc.id}-${until}`,
      kind: 'sopExpiring',
      severity: until < 0 ? 'urgent' : until < 7 ? 'warn' : 'info',
      title: `${doc.category} expiring — ${doc.ownerName}`,
      message: `${doc.title} · ${until < 0 ? `expired ${-until}d ago` : `in ${until}d`}`,
      link: { view: 'documentVault' },
      createdAt: now,
    });
  }

  // ── SARS deadlines due soon / overdue (Phase 25) ───────────────────────
  if (data.appSettings?.sarsConfig) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const savedByKey = new Map((data.sarsFilings || []).map((f) => [f.periodKey, f]));
    for (const slot of buildSarsCalendar(data.appSettings.sarsConfig, todayStr)) {
      const saved = savedByKey.get(slot.periodKey);
      // Already filed/paid — nothing to nag about.
      if (saved && (saved.status === 'Submitted' || saved.status === 'Paid')) continue;
      const until = daysFromNow(slot.dueDate);
      if (until > 30) continue; // only surface the near horizon
      const short = SARS_OBLIGATION_SHORT[slot.obligationType];
      list.push({
        id: `sars-${slot.periodKey}-${until}`,
        kind: 'sarsDeadline',
        severity: until < 0 ? 'urgent' : until < 7 ? 'warn' : 'info',
        title: `SARS ${short} due — ${slot.periodLabel}`,
        message: until < 0 ? `Overdue by ${-until}d (was ${slot.dueDate})` : until === 0 ? 'Due today' : `Due in ${until}d (${slot.dueDate})`,
        link: { view: 'sarsCentre' },
        createdAt: now,
      });
    }
  }

  // ── Driver POD captured (Phase 60) ─────────────────────────────────────
  // We surface PODs from the last 7 days so dispatch / sales / accounts
  // can react to refusals or COD-on-delivery quickly. Older PODs aren't
  // bell-worthy — they belong to the audit trail. We segment by outcome:
  //   • Delivered → low-priority info ("POD received for X")
  //   • Partial / Failed → warn (someone needs to chase up)
  //   • Refused → urgent (customer returned the load — call now)
  //   • Cash-on-delivery → urgent flag for accounts to collect balance
  const recentPodCutoff = Date.now() - 7 * DAY_MS;
  const invoiceByJob = new Map<string, typeof data.invoices[number]>();
  for (const inv of data.invoices) {
    if (inv.jobId) invoiceByJob.set(inv.jobId, inv);
  }
  for (const pod of data.proofOfDeliveries || []) {
    const ts = new Date(pod.createdAt).getTime();
    if (Number.isNaN(ts) || ts < recentPodCutoff) continue;
    // Base "captured" notification — visible to dispatch / sales / ops.
    const sev: NotificationSeverity = pod.outcome === 'Refused'
      ? 'urgent'
      : pod.outcome === 'Failed' || pod.outcome === 'Partial'
        ? 'warn'
        : 'info';
    list.push({
      id: `pod-${pod.id}-${pod.outcome}`,
      kind: pod.outcome === 'Refused' ? 'podRefused' : 'podCaptured',
      severity: sev,
      title: pod.outcome === 'Delivered'
        ? `POD ${pod.podNumber} — Delivered`
        : `POD ${pod.podNumber} — ${pod.outcome}`,
      message: pod.outcome === 'Delivered'
        ? `${pod.clientName} • signed by ${pod.receiverName || 'recipient'}`
        : `${pod.clientName} • ${pod.failureReason || pod.outcome}`,
      link: { view: 'deliveryNotes', entityId: pod.dispatchRecordId },
      createdAt: pod.createdAt,
    });
    // Accounts-targeted notification for COD / deposit-required jobs that
    // were just delivered — they need to collect the outstanding balance.
    if (pod.outcome === 'Delivered' && pod.jobId) {
      const inv = invoiceByJob.get(pod.jobId);
      if (inv && (Number(inv.amountOutstanding) || 0) > 0) {
        const job = data.jobs.find((j) => j.id === pod.jobId);
        const isCod = job?.paymentRequirement === 'Full Payment' || job?.paymentRequirement === '50% Deposit';
        if (isCod) {
          list.push({
            id: `pod-cod-${pod.id}`,
            kind: 'podCodReady',
            severity: 'urgent',
            title: `Collect outstanding — ${inv.invoiceNumber}`,
            message: `${pod.clientName} • ${Math.round(Number(inv.amountOutstanding) || 0).toLocaleString()} owed (COD job delivered)`,
            link: { view: 'invoices', entityId: inv.id },
            createdAt: pod.createdAt,
          });
        }
      }
    }
  }

  // Sort: urgent → warn → info, then by stable id so the list doesn't
  // shuffle every render.
  const order: Record<NotificationSeverity, number> = { urgent: 0, warn: 1, info: 2 };
  list.sort((a, b) => {
    const s = order[a.severity] - order[b.severity];
    if (s !== 0) return s;
    return a.id.localeCompare(b.id);
  });
  return list;
}

function readStoredIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v: unknown): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  isRead: (id: string) => boolean;
}

export function useNotifications(data: AppData): UseNotificationsResult {
  const [readIds, setReadIds] = useState<Set<string>>(() => readStoredIds());

  const notifications = useMemo(() => deriveNotifications(data), [data]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch {
      /* ignore quota */
    }
  }, [readIds]);

  // Garbage-collect read ids that no longer exist in the current set, so
  // localStorage doesn't grow unbounded across weeks of usage.
  useEffect(() => {
    const live = new Set(notifications.map((n) => n.id));
    setReadIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (live.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [notifications]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const unreadCount = notifications.reduce((sum, n) => (readIds.has(n.id) ? sum : sum + 1), 0);

  return { notifications, unreadCount, markRead, markAllRead, isRead };
}
