/**
 * Phase 102 — Activity Inbox page.
 *
 * One scrollable feed of "everything happening" across the business.
 * Filter chips at the top let you slice by category and status.
 * Each event has inline actions (approve / decline / snooze / dismiss /
 * open) so you can clear the inbox without leaving the page.
 *
 * Scale design:
 *   - Filter chips reduce a 200-event day to a focused slice.
 *   - Similar events batch under one "12 first aid treatments" row that
 *     expands when clicked.
 *   - Dismissed / actioned items fade and collapse but stay visible so
 *     you can spot history mistakes.
 *   - Snooze pushes items back to unread after the period elapses.
 *   - State (read / snoozed / dismissed) lives in localStorage so
 *     status survives refresh without needing a Supabase round-trip.
 */

import { useMemo, useState } from 'react';
import { SectionTitle } from '../../components/SectionTitle';
import {
  BatchGroup,
  INBOX_CATEGORIES,
  InboxAction,
  InboxCategory,
  InboxEvent,
  InboxEventState,
  InboxStatus,
  batchEvents,
  effectiveStatus,
  relativeTime,
} from '../../utils/inbox';

interface InboxPageProps {
  events: InboxEvent[];
  state: Record<string, InboxEventState>;
  /** Update one event's state. Persisted by the parent. */
  setState: (id: string, next: InboxEventState | null) => void;
  /** Bulk-mark every visible event as seen. */
  markAllSeen: (ids: string[]) => void;
  /** Top-level dispatch for actions that aren't pure state changes
   *  (approve leave actually updates a LeaveRequest, etc.). */
  onAction: (action: InboxAction, event: InboxEvent) => void;
  /**
   * Phase 103.3 — per-user inbox category filter.
   *
   * When supplied (and non-empty), the Inbox only ever shows / chips these
   * categories — useful for HR-only staff, external partners, marketing,
   * accountant, etc. When undefined or empty, the user sees everything
   * (default for admin / ops).
   */
  allowedCategories?: InboxCategory[];
}

type StatusFilter = 'all' | 'unread' | 'open' | 'snoozed' | 'done';

const CAT_COLOUR: Record<InboxCategory, string> = {
  HR: '#8c4cb6',
  Sales: '#2563eb',
  Production: '#2e6f3e',
  Safety: '#b22b2b',
  Finance: '#b8860b',
  Operations: '#5a6e60',
};

const TONE_BG: Record<string, string> = {
  alert: 'rgba(178,43,43,0.04)',
  warning: 'rgba(184,134,11,0.04)',
  info: 'var(--jp-paper, #fff)',
  success: 'rgba(46,111,62,0.04)',
};

export function InboxPage({ events, state, setState, markAllSeen, onAction, allowedCategories }: InboxPageProps) {
  const today = new Date().toISOString().slice(0, 10);

  // Effective category universe = the user's allowed list (if any), else all.
  const universe = useMemo<InboxCategory[]>(
    () => (allowedCategories && allowedCategories.length > 0 ? allowedCategories : INBOX_CATEGORIES),
    [allowedCategories],
  );
  const [categories, setCategories] = useState<Set<InboxCategory>>(() => new Set(universe));
  // Keep the active filter set in sync when permissions change underneath us
  // (e.g. admin grants/revokes a category mid-session).
  useMemo(() => { setCategories(new Set(universe)); }, [universe.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  // Apply category + status filters.
  const allowedSet = useMemo(() => new Set(universe), [universe]);
  const visible = useMemo(() => {
    return events.filter((e) => {
      // First: user must be permitted to see this category at all.
      if (!allowedSet.has(e.category)) return false;
      // Then: their active filter chips must include it.
      if (!categories.has(e.category)) return false;
      const s = effectiveStatus(state[e.id], today);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unread') return s === 'unread';
      if (statusFilter === 'open') return s === 'unread' || s === 'seen';
      if (statusFilter === 'snoozed') return s === 'snoozed';
      if (statusFilter === 'done') return s === 'actioned' || s === 'dismissed';
      return true;
    });
  }, [events, categories, statusFilter, state, today, allowedSet]);

  const { single, batched } = useMemo(() => batchEvents(visible), [visible]);

  // Headline counts for the filter row.
  const counts = useMemo(() => {
    const allCounts = { all: 0, unread: 0, open: 0, snoozed: 0, done: 0 };
    for (const e of events) {
      const s = effectiveStatus(state[e.id], today);
      allCounts.all++;
      if (s === 'unread') allCounts.unread++;
      if (s === 'unread' || s === 'seen') allCounts.open++;
      if (s === 'snoozed') allCounts.snoozed++;
      if (s === 'actioned' || s === 'dismissed') allCounts.done++;
    }
    return allCounts;
  }, [events, state, today]);

  function toggleCategory(c: InboxCategory) {
    const next = new Set(categories);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    if (next.size === 0) next.add(c); // never empty
    setCategories(next);
  }
  function toggleBatch(key: string) {
    const next = new Set(expandedBatches);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedBatches(next);
  }

  return (
    <>
      <SectionTitle
        title="Inbox"
        subtitle="Everything happening across the business. Action what you can, snooze the rest."
        action={
          <button
            type="button"
            className="ghost-button"
            onClick={() => markAllSeen(visible.map((e) => e.id))}
            disabled={visible.length === 0}
          >Mark all seen</button>
        }
      />

      {/* ═══ Filter chips ═══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {/* Category row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 64 }}>
            Categories
          </span>
          {universe.map((c) => {
            const active = categories.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  border: `1px solid ${active ? CAT_COLOUR[c] : 'var(--jp-border, #e5e2dc)'}`,
                  background: active ? CAT_COLOUR[c] : 'var(--jp-paper, #fff)',
                  color: active ? '#fff' : 'var(--jp-ink, #444)',
                  cursor: 'pointer',
                }}
              >{c}</button>
            );
          })}
        </div>
        {/* Status row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 64 }}>
            Status
          </span>
          {([
            { key: 'open' as const, label: 'Open', count: counts.open },
            { key: 'unread' as const, label: 'Unread', count: counts.unread },
            { key: 'snoozed' as const, label: 'Snoozed', count: counts.snoozed },
            { key: 'done' as const, label: 'Done', count: counts.done },
            { key: 'all' as const, label: 'All', count: counts.all },
          ]).map((s) => {
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(s.key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  border: `1px solid ${active ? 'var(--jp-accent, #2563eb)' : 'var(--jp-border, #e5e2dc)'}`,
                  background: active ? 'var(--jp-accent, #2563eb)' : 'var(--jp-paper, #fff)',
                  color: active ? '#fff' : 'var(--jp-ink, #444)',
                  cursor: 'pointer',
                }}
              >{s.label} <span style={{ opacity: 0.7 }}>({s.count})</span></button>
            );
          })}
        </div>
      </div>

      {/* ═══ Feed body ═══════════════════════════════════════════════════ */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'var(--jp-paper, #fff)', border: '1px solid var(--jp-border, #e5e2dc)', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 4px' }}>Inbox zero</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Nothing in this filter. Switch to <strong>All</strong> if you want to see actioned items too.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Batched groups first — they're usually high-volume, low-priority */}
          {batched.map((g) => (
            <BatchRow
              key={`${g.category}:${g.batchKey}`}
              group={g}
              expanded={expandedBatches.has(`${g.category}:${g.batchKey}`)}
              toggle={() => toggleBatch(`${g.category}:${g.batchKey}`)}
              state={state}
              setState={setState}
              onAction={onAction}
              today={today}
            />
          ))}
          {/* Single rows */}
          {single.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              status={effectiveStatus(state[e.id], today)}
              setState={setState}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ─── single event row ───────────────────────────────────────────────── */

function EventRow(props: {
  event: InboxEvent;
  status: InboxStatus;
  setState: (id: string, next: InboxEventState | null) => void;
  onAction: (action: InboxAction, event: InboxEvent) => void;
}) {
  const { event: e, status, setState, onAction } = props;
  const isInactive = status === 'actioned' || status === 'dismissed' || status === 'snoozed';
  const cat = CAT_COLOUR[e.category];

  function handleAction(a: InboxAction) {
    if (a.type === 'mark-seen') {
      setState(e.id, { status: 'seen' });
      return;
    }
    if (a.type === 'dismiss') {
      setState(e.id, { status: 'dismissed' });
      return;
    }
    if (a.type === 'snooze-1d' || a.type === 'snooze-1w') {
      const days = a.type === 'snooze-1d' ? 1 : 7;
      const until = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      setState(e.id, { status: 'snoozed', snoozedUntil: until });
      return;
    }
    // Everything else delegates up (approve, open, etc.)
    onAction(a, e);
    if (a.type === 'approve-leave' || a.type === 'decline-leave' || a.type === 'approve-claim' || a.type === 'decline-claim') {
      setState(e.id, { status: 'actioned', actionedAt: new Date().toISOString() });
    } else if (a.type === 'open') {
      setState(e.id, { status: 'seen' });
    }
  }

  return (
    <div
      style={{
        background: TONE_BG[e.tone] ?? 'var(--jp-paper, #fff)',
        border: '1px solid var(--jp-border, #e5e2dc)',
        borderLeft: `3px solid ${cat}`,
        borderRadius: 10,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: isInactive ? 0.55 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      <div style={{ minWidth: 70 }}>
        <span style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 999,
          background: cat,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}>{e.category}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: status === 'unread' ? 700 : 500 }}>
          {e.title}
        </div>
        {e.detail ? (
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{e.detail}</div>
        ) : null}
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
          {relativeTime(e.occurredAt)}
          {e.actorName ? ` · ${e.actorName}` : ''}
          {status === 'snoozed' && props.event ? ' · snoozed' : ''}
          {status === 'actioned' ? ' · actioned' : ''}
          {status === 'dismissed' ? ' · dismissed' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {e.primary ? (
          <button
            type="button"
            className="primary-button"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => handleAction(e.primary!)}
          >{e.primary.label}</button>
        ) : null}
        {e.secondary ? (
          <button
            type="button"
            className="ghost-button"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => handleAction(e.secondary!)}
          >{e.secondary.label}</button>
        ) : null}
        {!isInactive ? (
          <button
            type="button"
            className="ghost-button"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => handleAction({ type: 'dismiss', label: 'Dismiss' })}
            title="Hide from open inbox"
          >×</button>
        ) : null}
      </div>
    </div>
  );
}

/* ─── batched group row ──────────────────────────────────────────────── */

function BatchRow(props: {
  group: BatchGroup;
  expanded: boolean;
  toggle: () => void;
  state: Record<string, InboxEventState>;
  setState: (id: string, next: InboxEventState | null) => void;
  onAction: (action: InboxAction, event: InboxEvent) => void;
  today: string;
}) {
  const { group: g, expanded, toggle, state, setState, onAction, today } = props;
  const cat = CAT_COLOUR[g.category];

  // Group summary label.
  const summary = batchLabel(g);

  return (
    <div
      style={{
        background: 'var(--jp-paper, #fff)',
        border: '1px solid var(--jp-border, #e5e2dc)',
        borderLeft: `3px solid ${cat}`,
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          textAlign: 'left',
          padding: 0,
          color: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        <span style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 999,
          background: cat,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}>{g.category}</span>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{summary}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {expanded ? 'hide' : `show all ${g.events.length}`}
        </span>
      </button>

      {expanded ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {g.events.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              status={effectiveStatus(state[e.id], today)}
              setState={setState}
              onAction={onAction}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function batchLabel(g: BatchGroup): string {
  const n = g.events.length;
  switch (g.batchKey) {
    case 'leave-pending':    return `${n} leave request${n === 1 ? '' : 's'} pending approval`;
    case 'claim-pending':    return `${n} expense claim${n === 1 ? '' : 's'} pending approval`;
    case 'first-aid':        return g.events[0].title;
    case 'low-stock':        return `${n} parts below reorder level`;
    case 'overdue-invoice':  return `${n} overdue invoice${n === 1 ? '' : 's'}`;
    case 'new-lead':         return `${n} new lead${n === 1 ? '' : 's'} this week`;
    case 'lead-followup':    return `${n} lead follow-up${n === 1 ? '' : 's'} due`;
    case 'job-overdue':      return `${n} job${n === 1 ? '' : 's'} past their due date`;
    case 'sars':             return `${n} SARS deadline${n === 1 ? '' : 's'} on the radar`;
    default:                 return `${n} ${g.category} event${n === 1 ? '' : 's'}`;
  }
}
