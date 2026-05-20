/**
 * RecordHistoryDrawer — Phase 18
 *
 * Slide-out panel that shows the snapshot history for a single record.
 * Reads from the `record_history` table populated by the
 * snapshot_record_history() trigger. Each entry shows who changed it,
 * when, and which columns differed — old value vs new value.
 *
 * Strictly read-only. The DB has no insert/update/delete policy on
 * record_history for clients, so nothing here can corrupt the log.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

interface RecordHistoryEntry {
  id: number;
  table_name: string;
  record_id: string;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  changed_by_user_id: string | null;
  changed_by_name: string;
  changed_at: string;
  changed_columns: string[];
}

interface RecordHistoryDrawerProps {
  open: boolean;
  table: string;
  recordId: string | null;
  /** Optional human label for the record (e.g. invoice number) shown in
   *  the drawer header. */
  recordLabel?: string;
  onClose: () => void;
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function RecordHistoryDrawer({ open, table, recordId, recordLabel, onClose }: RecordHistoryDrawerProps) {
  const [entries, setEntries] = useState<RecordHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!open || !recordId) return;
    setLoading(true);
    setError('');
    supabase
      .from('record_history')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          setError(error.message);
          return;
        }
        setEntries((data || []) as RecordHistoryEntry[]);
      });
  }, [open, table, recordId]);

  const title = recordLabel ? `History — ${recordLabel}` : 'History';

  if (!open) return null;
  return (
    <div className="history-drawer" role="dialog" aria-modal="true">
      <div className="history-drawer-overlay" onClick={onClose} />
      <aside className="history-drawer-panel">
        <header>
          <h3>{title}</h3>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </header>
        <div className="history-drawer-body">
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="callout error">Failed to load history: {error}</p>}
          {!loading && entries.length === 0 && (
            <p className="muted">No edits yet. Future changes will appear here.</p>
          )}
          {entries.map((entry) => (
            <HistoryEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function HistoryEntryCard({ entry }: { entry: RecordHistoryEntry }) {
  const diffs = useMemo(() => {
    return entry.changed_columns.map((col) => ({
      column: col,
      previous: (entry.previous_state as any)[col],
      next: (entry.new_state as any)[col],
    }));
  }, [entry]);

  return (
    <div className="history-entry">
      <header>
        <strong>{entry.changed_by_name || 'Unknown user'}</strong>
        <small>{new Date(entry.changed_at).toLocaleString()}</small>
      </header>
      <ul>
        {diffs.map((d) => (
          <li key={d.column}>
            <span className="history-col">{d.column}</span>
            <span className="history-prev">{fmtValue(d.previous)}</span>
            <span className="history-arrow">→</span>
            <span className="history-next">{fmtValue(d.next)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
