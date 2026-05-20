/**
 * EditFormGuard — Phase 18 composite
 *
 * Drops into an edit form to provide:
 *   • Soft presence-based lock (useRecordLock + EditLockBanner)
 *   • A small "View history" button that opens RecordHistoryDrawer
 *   • Optional audit-event for lock overrides
 *
 * Wiring is one line per form:
 *
 *   <EditFormGuard
 *     table="jobs"
 *     recordId={jobEditingId}
 *     recordLabel={jobForm.jobNumber || 'New job'}
 *     currentUser={{ id: profile?.id, name: profile?.fullName }}
 *   />
 *
 * The component renders nothing when recordId is null (create mode) —
 * no record to lock or have history for.
 */

import { useEffect, useState } from 'react';
import { EditLockBanner } from './EditLockBanner';
import { RecordHistoryDrawer } from './RecordHistoryDrawer';
import { useRecordLock } from '../hooks/useRecordLock';
import { recordAuditEvent } from '../utils/supabaseData';

interface EditFormGuardProps {
  /** Table name in snake_case (matches the DB). */
  table: string;
  /** Null in create mode. The guard renders nothing in that case. */
  recordId: string | null;
  /** Optional human label shown in the history drawer header. */
  recordLabel?: string;
  /** Current user's id + display name for the presence channel. */
  currentUser: { id?: string; name?: string };
}

export function EditFormGuard({ table, recordId, recordLabel, currentUser }: EditFormGuardProps) {
  const [overridden, setOverridden] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { otherEditors, isLocked } = useRecordLock({
    table,
    recordId,
    user: { id: currentUser.id || '', name: currentUser.name || 'Unknown' },
    enabled: Boolean(recordId),
  });

  // Reset the override flag when the user switches to a different record.
  useEffect(() => {
    setOverridden(false);
  }, [recordId]);

  if (!recordId) return null;

  function handleOverride() {
    setOverridden(true);
    void recordAuditEvent({
      sourceTable: table,
      sourceRecordId: recordId || '',
      eventCategory: 'edit',
      eventType: 'concurrency',
      action: 'lock_override',
      summary: `${currentUser.name || 'A user'} overrode the soft edit-lock on ${table}/${recordId}`,
      actorName: currentUser.name || '',
      visibilityScope: 'internal',
      details: {
        displaced: otherEditors.map((e) => ({ userId: e.userId, userName: e.userName })),
        by: { userId: currentUser.id || '', userName: currentUser.name || '' },
      },
    });
  }

  return (
    <>
      {isLocked && (
        <EditLockBanner
          editors={otherEditors}
          overridden={overridden}
          onOverride={handleOverride}
        />
      )}
      <div className="edit-form-guard-actions">
        <button
          type="button"
          className="link-button"
          onClick={() => setHistoryOpen(true)}
        >
          View history
        </button>
      </div>
      <RecordHistoryDrawer
        open={historyOpen}
        table={table}
        recordId={recordId}
        recordLabel={recordLabel}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
