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
import { AppData, AppNotification, NotificationSeverity } from '../types';

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
  for (const c of data.clients) {
    const onHold = c.accountHold === true;
    const overLimit = (c.creditLimit || 0) > 0 && (c.currentBalance || 0) >= (c.creditLimit || 0);
    if (!onHold && !overLimit) continue;
    list.push({
      id: `credit-${c.id}`,
      kind: 'creditBlock',
      severity: overLimit ? 'urgent' : 'warn',
      title: `${c.companyName || c.name || 'Client'} ${overLimit ? 'over credit limit' : 'on credit hold'}`,
      message: overLimit
        ? `Balance ${Math.round(c.currentBalance || 0).toLocaleString()} ≥ limit ${Math.round(c.creditLimit || 0).toLocaleString()}`
        : 'Account hold flag set — review before new orders',
      link: { view: 'clients', entityId: c.id },
      createdAt: now,
    });
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
