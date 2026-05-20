import { useEffect, useMemo, useState } from 'react';
import { BiEvent } from '../types';
import { fetchAuditEventsFor } from '../utils/supabaseData';

/**
 * HistoryDrawer — slide-in panel that shows the audit timeline for a single
 * record. Pass `target = { sourceTable, sourceRecordId, label }` and the
 * drawer fetches recent bi_events filtered to that record.
 *
 * The drawer is dumb about *where* it shows — the parent (App.tsx) holds a
 * `historyTarget: HistoryDrawerTarget | null` slot and renders this when set.
 *
 * Why bi_events? See schema-phase9-bi-backend.sql — every status change,
 * artwork stage move, dispatch, paper log, etc. is already trigger-logged.
 * For client-only actions (undo, delete, manual notes) the caller uses
 * `recordAuditEvent()` from supabaseData.ts to push events into the same table.
 */
export interface HistoryDrawerTarget {
  sourceTable: string;
  sourceRecordId: string;
  /** What the user sees at the top, e.g. "Job ABC-001" or "Invoice INV-2026-014". */
  label: string;
  /** Optional secondary line for context (client name, status, etc). */
  subtitle?: string;
}

interface HistoryDrawerProps {
  target: HistoryDrawerTarget;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryColor(category: string): string {
  // Visual cues so the eye can scan a long timeline. Keep palette small.
  switch (category) {
    case 'job':
      return 'history-dot-blue';
    case 'artwork':
      return 'history-dot-purple';
    case 'production':
      return 'history-dot-green';
    case 'waste':
      return 'history-dot-amber';
    case 'paper':
      return 'history-dot-teal';
    case 'dispatch':
      return 'history-dot-indigo';
    case 'inventory':
      return 'history-dot-orange';
    case 'delivery_note':
      return 'history-dot-cyan';
    case 'invoice':
      return 'history-dot-emerald';
    case 'spares':
      return 'history-dot-rose';
    default:
      return 'history-dot-grey';
  }
}

export function HistoryDrawer({ target, onClose }: HistoryDrawerProps) {
  const [events, setEvents] = useState<BiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAuditEventsFor(target.sourceTable, target.sourceRecordId, 200)
      .then((rows) => {
        if (cancelled) return;
        setEvents(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Could not load history');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [target.sourceTable, target.sourceRecordId]);

  // Close on Escape — common drawer affordance.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const grouped = useMemo(() => {
    // Group by day-of-occurrence so the user sees "Today / Yesterday / 2026-04-30" headers
    const buckets = new Map<string, BiEvent[]>();
    for (const ev of events) {
      const key = (ev.occurredAt || ev.createdAt || '').slice(0, 10);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(ev);
    }
    return Array.from(buckets.entries());
  }, [events]);

  return (
    <div className="history-drawer-shell" role="dialog" aria-modal="true" aria-label="Record history">
      <div className="history-drawer-backdrop" onClick={onClose} />
      <aside className="history-drawer-panel">
        <header className="history-drawer-header">
          <div>
            <p className="history-drawer-eyebrow">History</p>
            <h2 className="history-drawer-title">{target.label}</h2>
            {target.subtitle ? <p className="history-drawer-subtitle">{target.subtitle}</p> : null}
          </div>
          <button type="button" className="history-drawer-close" onClick={onClose} aria-label="Close history">
            ×
          </button>
        </header>

        <div className="history-drawer-body">
          {loading ? <p className="history-drawer-empty">Loading…</p> : null}
          {!loading && error ? <p className="history-drawer-empty">{error}</p> : null}
          {!loading && !error && events.length === 0 ? (
            <p className="history-drawer-empty">No history recorded for this record yet.</p>
          ) : null}

          {!loading && !error && grouped.map(([day, dayEvents]) => (
            <section key={day} className="history-drawer-day">
              <h3 className="history-drawer-day-title">{day || 'Unknown date'}</h3>
              <ol className="history-drawer-list">
                {dayEvents.map((ev) => (
                  <li key={ev.id} className="history-drawer-item">
                    <span className={`history-drawer-dot ${categoryColor(ev.eventCategory)}`} aria-hidden="true" />
                    <div className="history-drawer-item-body">
                      <p className="history-drawer-item-summary">{ev.summary}</p>
                      <p className="history-drawer-item-meta">
                        {formatTimestamp(ev.occurredAt || ev.createdAt)}
                        {ev.actorName ? ` · ${ev.actorName}` : ''}
                        {ev.action ? ` · ${ev.action.replace(/_/g, ' ')}` : ''}
                      </p>
                      {ev.details && Object.keys(ev.details).length > 0 ? (
                        <details className="history-drawer-details">
                          <summary>Details</summary>
                          <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                        </details>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
