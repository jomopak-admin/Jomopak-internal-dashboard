/**
 * Phase 117 — WaitingOnPanel.
 *
 * Drop-in panel that captures blockers on a Quote or Job — "waiting for
 * die cost from toolmaker", "waiting for board price from Sappi". Same
 * component used on both forms so quote and job blockers look and feel
 * identical.
 *
 * Self-contained: takes a `value: WaitingOnBlocker[]` and `onChange`.
 * Parent owns the entity (quote / job) and persists; we never mutate
 * in place.
 *
 * Behaviour:
 *  - Add form: party dropdown + (optional) named contact + reason +
 *    expected-by date → push new blocker.
 *  - Existing blockers list, unresolved first. Each row has a "Mark
 *    resolved" button + optional note.
 *  - Overdue (past expectedBy + still unresolved) gets an orange chip.
 *  - Resolved entries collapse into an "Audit trail" section so the
 *    record stays useful but doesn't clutter the active view.
 */

import { useMemo, useState } from 'react';
import { WaitingOnBlocker, WaitingOnParty } from '../types';

const PARTIES: WaitingOnParty[] = [
  'Supplier',
  'Client',
  'Toolmaker',
  'Paper rep',
  'Internal',
  'Other',
];

interface WaitingOnPanelProps {
  value: WaitingOnBlocker[] | undefined;
  onChange: (next: WaitingOnBlocker[]) => void;
  /** Stamped on createdBy / resolvedBy. Empty string is fine. */
  actingUserName?: string;
  /** Read-only render — used on list previews / printables. */
  readOnly?: boolean;
}

function newId(): string {
  return `wait-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(): string {
  return new Date().toISOString();
}

/** True if the blocker is past its expectedBy date and not yet resolved. */
export function isBlockerOverdue(b: WaitingOnBlocker, todayYMD: string): boolean {
  if (b.resolvedAt) return false;
  if (!b.expectedBy) return false;
  return b.expectedBy < todayYMD;
}

export function WaitingOnPanel({
  value,
  onChange,
  actingUserName = '',
  readOnly = false,
}: WaitingOnPanelProps) {
  const list = value ?? [];
  // Local add-form state lives in the panel — the parent only sees
  // committed blockers via onChange.
  const [party, setParty] = useState<WaitingOnParty>('Supplier');
  const [partyName, setPartyName] = useState('');
  const [reason, setReason] = useState('');
  const [expectedBy, setExpectedBy] = useState('');

  const todayYMD = new Date().toISOString().slice(0, 10);

  const { active, resolved } = useMemo(() => {
    const a: WaitingOnBlocker[] = [];
    const r: WaitingOnBlocker[] = [];
    for (const b of list) {
      if (b.resolvedAt) r.push(b);
      else a.push(b);
    }
    // Active: overdue first, then by expectedBy ascending, then by createdAt.
    a.sort((x, y) => {
      const xo = isBlockerOverdue(x, todayYMD) ? 0 : 1;
      const yo = isBlockerOverdue(y, todayYMD) ? 0 : 1;
      if (xo !== yo) return xo - yo;
      const xe = x.expectedBy || '9999-12-31';
      const ye = y.expectedBy || '9999-12-31';
      if (xe !== ye) return xe.localeCompare(ye);
      return (x.createdAt || '').localeCompare(y.createdAt || '');
    });
    // Resolved: most recently resolved first.
    r.sort((x, y) => (y.resolvedAt || '').localeCompare(x.resolvedAt || ''));
    return { active: a, resolved: r };
  }, [list, todayYMD]);

  function addBlocker() {
    if (!reason.trim()) return;
    const next: WaitingOnBlocker = {
      id: newId(),
      party,
      partyName: partyName.trim() || undefined,
      reason: reason.trim(),
      expectedBy: expectedBy || undefined,
      createdAt: todayISO(),
      createdBy: actingUserName || undefined,
    };
    onChange([...(list || []), next]);
    // Reset add-form so the user can drop in another blocker.
    setParty('Supplier');
    setPartyName('');
    setReason('');
    setExpectedBy('');
  }

  function resolveBlocker(id: string, note: string) {
    onChange(
      list.map((b) =>
        b.id === id
          ? {
              ...b,
              resolvedAt: todayISO(),
              resolvedBy: actingUserName || undefined,
              resolutionNote: note.trim() || undefined,
            }
          : b,
      ),
    );
  }

  function removeBlocker(id: string) {
    onChange(list.filter((b) => b.id !== id));
  }

  return (
    <section className="card" style={{ padding: '14px 16px' }}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, letterSpacing: '0.02em' }}>Waiting on</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>
            Park anything blocking this work — a cost, an approval, artwork. Cleared blockers stay in the audit trail below.
          </p>
        </div>
        {active.length > 0 ? (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 999,
            background: active.some((b) => isBlockerOverdue(b, todayYMD)) ? 'rgba(219, 90, 31, 0.12)' : 'rgba(100, 116, 139, 0.12)',
            color: active.some((b) => isBlockerOverdue(b, todayYMD)) ? 'var(--jp-orange, #db5a1f)' : 'var(--jp-ink-3, #64748b)',
          }}>
            {active.length} active{active.some((b) => isBlockerOverdue(b, todayYMD)) ? ' · some overdue' : ''}
          </span>
        ) : null}
      </header>

      {/* Active blockers list */}
      {active.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', display: 'grid', gap: 6 }}>
          {active.map((b) => (
            <WaitingRow
              key={b.id}
              blocker={b}
              overdue={isBlockerOverdue(b, todayYMD)}
              readOnly={readOnly}
              onResolve={(note) => resolveBlocker(b.id, note)}
              onRemove={() => removeBlocker(b.id)}
            />
          ))}
        </ul>
      ) : (
        <p style={{ margin: '8px 0', fontSize: 12, color: 'var(--jp-ink-3, #64748b)', fontStyle: 'italic' }}>
          Nothing blocking right now.
        </p>
      )}

      {/* Add new blocker — hidden in read-only mode */}
      {!readOnly ? (
        <div style={{ borderTop: '0.5px solid var(--jp-line, #e2e8f0)', paddingTop: 10, marginTop: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 140px auto', gap: 8, alignItems: 'end' }}>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Who</span>
              <select value={party} onChange={(e) => setParty(e.target.value as WaitingOnParty)}>
                {PARTIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Name (optional)</span>
              <input
                type="text"
                placeholder="Polipack, John at Sappi…"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Waiting for</span>
              <input
                type="text"
                placeholder="Die cost, board price, artwork approval…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, color: 'var(--jp-ink-3, #64748b)' }}>Expected by</span>
              <input type="date" value={expectedBy} onChange={(e) => setExpectedBy(e.target.value)} />
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={addBlocker}
              disabled={!reason.trim()}
              title={!reason.trim() ? 'Add a short reason first' : 'Park this blocker'}
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      {/* Resolved audit trail — collapsible-feeling block */}
      {resolved.length > 0 ? (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: 'var(--jp-ink-3, #64748b)' }}>
            {resolved.length} resolved (audit trail)
          </summary>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 6 }}>
            {resolved.map((b) => (
              <WaitingRow
                key={b.id}
                blocker={b}
                overdue={false}
                readOnly
                onResolve={() => {}}
                onRemove={() => removeBlocker(b.id)}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/** Single row inside the panel. Split out so resolved and active rows
 *  share rendering logic — the only difference is the action buttons. */
function WaitingRow({
  blocker,
  overdue,
  readOnly,
  onResolve,
  onRemove,
}: {
  blocker: WaitingOnBlocker;
  overdue: boolean;
  readOnly: boolean;
  onResolve: (note: string) => void;
  onRemove: () => void;
}) {
  const [showResolveBox, setShowResolveBox] = useState(false);
  const [note, setNote] = useState('');
  const isResolved = Boolean(blocker.resolvedAt);

  return (
    <li
      style={{
        border: '0.5px solid var(--jp-line, #e2e8f0)',
        borderLeft: `3px solid ${overdue ? 'var(--jp-orange, #db5a1f)' : isResolved ? 'var(--jp-line, #cbd5e1)' : 'var(--jp-ink-3, #64748b)'}`,
        borderRadius: 6,
        padding: '8px 10px',
        background: isResolved ? 'rgba(100, 116, 139, 0.04)' : '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isResolved ? 'var(--jp-ink-3, #64748b)' : 'var(--jp-ink, #111)' }}>
            {blocker.party}{blocker.partyName ? ` · ${blocker.partyName}` : ''}
            {overdue ? (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(219, 90, 31, 0.12)', color: 'var(--jp-orange, #db5a1f)' }}>
                OVERDUE
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 12, color: isResolved ? 'var(--jp-ink-3, #64748b)' : 'var(--jp-ink-2, #334155)', marginTop: 2 }}>
            {blocker.reason}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--jp-ink-3, #64748b)', marginTop: 4 }}>
            {blocker.expectedBy ? <>Expected by {blocker.expectedBy}</> : <>No expected date</>}
            {blocker.createdBy ? <> · added by {blocker.createdBy}</> : null}
            {blocker.resolvedAt ? (
              <>
                {' · '}resolved {blocker.resolvedAt.slice(0, 10)}
                {blocker.resolvedBy ? <> by {blocker.resolvedBy}</> : null}
                {blocker.resolutionNote ? ` — ${blocker.resolutionNote}` : ''}
              </>
            ) : null}
          </div>
        </div>
        {!readOnly && !isResolved ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {showResolveBox ? null : (
              <button type="button" className="ghost-button" onClick={() => setShowResolveBox(true)}>
                Mark resolved
              </button>
            )}
            <button type="button" className="ghost-button" onClick={onRemove} title="Remove blocker">
              Remove
            </button>
          </div>
        ) : !readOnly ? (
          // Resolved-row remove action (audit-trail cleanup if needed).
          <button type="button" className="ghost-button" onClick={onRemove} title="Remove from audit trail">
            Remove
          </button>
        ) : null}
      </div>
      {showResolveBox && !isResolved ? (
        <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Resolution note (optional) — what was the answer?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => { onResolve(note); setShowResolveBox(false); setNote(''); }}
          >
            Resolve
          </button>
          <button type="button" className="ghost-button" onClick={() => { setShowResolveBox(false); setNote(''); }}>
            Cancel
          </button>
        </div>
      ) : null}
    </li>
  );
}

/** Helper for list pages — counts how many blockers are unresolved
 *  on a record. Returns 0 for undefined arrays. */
export function countActiveBlockers(list: WaitingOnBlocker[] | undefined): number {
  if (!list) return 0;
  let n = 0;
  for (const b of list) if (!b.resolvedAt) n += 1;
  return n;
}

/** Helper for list pages — true if any unresolved blocker is past
 *  its expectedBy date. */
export function hasOverdueBlocker(list: WaitingOnBlocker[] | undefined, todayYMD: string): boolean {
  if (!list) return false;
  for (const b of list) if (isBlockerOverdue(b, todayYMD)) return true;
  return false;
}
