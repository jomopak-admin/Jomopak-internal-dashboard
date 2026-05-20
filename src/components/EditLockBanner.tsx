/**
 * EditLockBanner — Phase 18
 *
 * Shown inside edit forms whenever another user is currently editing
 * the same record (detected via useRecordLock). The default state is
 * "view-only with override" — the form respects the lock but lets the
 * user explicitly bypass it. Every override writes an audit event so
 * displacements stay traceable.
 *
 * Usage:
 *   const { otherEditors, isLocked } = useRecordLock(...);
 *   const [overridden, setOverridden] = useState(false);
 *   <EditLockBanner
 *     editors={otherEditors}
 *     overridden={overridden}
 *     onOverride={() => { setOverridden(true); recordOverrideAudit(...); }}
 *   />
 *   // pass `readOnly={isLocked && !overridden}` into your form fields
 */

import { LockPresence } from '../hooks/useRecordLock';

interface EditLockBannerProps {
  editors: LockPresence[];
  overridden: boolean;
  onOverride: () => void;
}

export function EditLockBanner({ editors, overridden, onOverride }: EditLockBannerProps) {
  if (editors.length === 0) return null;
  const names = editors.map((e) => e.userName).join(', ');
  const plural = editors.length > 1;
  if (overridden) {
    return (
      <div className="edit-lock-banner overridden">
        <strong>Editing alongside {names}.</strong>
        <span>You overrode the soft lock — your save may be rejected if {plural ? 'they' : 'they'} commit first.</span>
      </div>
    );
  }
  return (
    <div className="edit-lock-banner active">
      <strong>{names} {plural ? 'are' : 'is'} editing this right now.</strong>
      <span>The form is read-only to avoid mix-ups. You can override if you need to.</span>
      <button type="button" className="ghost-button" onClick={onOverride}>
        Override anyway
      </button>
    </div>
  );
}
