import { useEffect, useState } from 'react';

/**
 * Undo toast — appears bottom-right after a destructive op, gives the user a
 * countdown window (default 6s) to undo. The caller hands us:
 *   - `message`: short description, e.g. "Job ABC-001 deleted"
 *   - `onUndo`: function that restores the original state
 *   - `onDismiss`: called when the timer runs out (so the parent can clear the toast)
 *
 * The component is intentionally dumb: it does not own the data or the
 * "what to do on dismiss" logic. The parent (App.tsx) holds an
 * `undoToast: UndoToastState | null` slot and renders <UndoToast/> when set.
 */
export interface UndoToastState {
  id: string;
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

interface UndoToastProps extends UndoToastState {
  onDismiss: () => void;
}

export function UndoToast({ id, message, onUndo, durationMs = 6000, onDismiss }: UndoToastProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    setRemaining(durationMs);
    const tickEveryMs = 100;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - tickEveryMs;
        if (next <= 0) {
          clearInterval(interval);
          // Defer onDismiss so we don't update parent state during render.
          setTimeout(onDismiss, 0);
          return 0;
        }
        return next;
      });
    }, tickEveryMs);
    return () => clearInterval(interval);
  }, [id, durationMs, onDismiss]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.max(0, Math.min(100, (remaining / durationMs) * 100));

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <div className="undo-toast-progress" style={{ width: `${progress}%` }} />
      <div className="undo-toast-content">
        <span className="undo-toast-message">{message}</span>
        <button
          type="button"
          className="undo-toast-button"
          onClick={() => {
            onUndo();
            onDismiss();
          }}
        >
          Undo · {seconds}s
        </button>
      </div>
    </div>
  );
}
