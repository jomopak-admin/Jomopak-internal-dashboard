/**
 * Phase 104 — Global toast notifications.
 *
 * A tiny pub-sub toast system so ANY code in the app can pop a
 * "Saved" / "Permissions updated" / "Failed to save" notice without
 * threading props through to the call-site.
 *
 *   import { toast } from './components/Toast';
 *
 *   toast.success('Permissions updated');
 *   toast.error('Save failed: …');
 *   toast.info('Synced 4 records');
 *
 * Mount <ToastContainer /> ONCE near the root (we do it inside AppLayout
 * so it sits above all pages). The container subscribes to the queue and
 * renders the active stack at top-right with auto-dismiss.
 *
 * Why a singleton + pub-sub instead of React context?
 *   - works from outside React (e.g. inside data-layer / supabase mappers
 *     when a save succeeds), no `useContext` ceremony at the call site
 *   - call site stays one line — the whole point of a toast
 *   - the container is the only consumer of the queue, so there's no
 *     re-render fan-out
 *
 * Design choices:
 *   - 3-second default duration, swipable / closable
 *   - new toasts STACK (most recent at top), max 5 visible to avoid spam
 *   - errors stay 6 seconds (longer because the user usually needs to read)
 *   - announces via aria-live="polite" for screen readers
 *   - intentionally no emoji per Aman's "no emoji in UI" rule
 */

import { useEffect, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  message: string;
  /** Auto-dismiss after this many ms. Default 3000 (success/info) or 6000 (error). */
  durationMs: number;
}

type Listener = (toasts: ToastEntry[]) => void;

let queue: ToastEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const fn of listeners) fn(queue);
}

function push(tone: ToastTone, message: string, durationMs?: number) {
  const entry: ToastEntry = {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tone,
    message,
    durationMs: durationMs ?? (tone === 'error' ? 6000 : 3000),
  };
  // Cap the visible stack at 5 so a save loop never floods the corner.
  queue = [entry, ...queue].slice(0, 5);
  emit();
  if (entry.durationMs > 0) {
    window.setTimeout(() => dismiss(entry.id), entry.durationMs);
  }
}

function dismiss(id: string) {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

/** Public API. Call from anywhere — inside React components or plain code. */
export const toast = {
  success(message: string, durationMs?: number) { push('success', message, durationMs); },
  error(message: string, durationMs?: number)   { push('error', message, durationMs); },
  info(message: string, durationMs?: number)    { push('info', message, durationMs); },
  warning(message: string, durationMs?: number) { push('warning', message, durationMs); },
  /** Manual dismiss — used by the container's close button. */
  dismiss,
};

const TONE_STYLES: Record<ToastTone, { bg: string; border: string; ink: string }> = {
  // Restrained palette — green accent for success, alert-red for errors,
  // amber for warnings, neutral grey for info. Match the rest of the app.
  success: { bg: 'var(--jp-success-soft, #e8f3ec)', border: 'var(--jp-success, #2e6f3e)', ink: 'var(--jp-success-ink, #1d4a28)' },
  error:   { bg: 'rgba(178,43,43,0.06)',            border: '#b22b2b',                    ink: '#7a1d1d' },
  warning: { bg: 'rgba(184,134,11,0.08)',           border: '#b8860b',                    ink: '#7a5b08' },
  info:    { bg: 'var(--jp-paper, #fff)',           border: 'var(--jp-divider, #cbd5e1)', ink: 'var(--jp-ink-1, #1e293b)' },
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const fn: Listener = (next) => setItems([...next]);
    listeners.add(fn);
    // Sync the initial state in case toasts fired during boot.
    fn(queue);
    return () => { listeners.delete(fn); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 'min(380px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => {
        const tone = TONE_STYLES[t.tone];
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              borderLeft: `4px solid ${tone.border}`,
              color: tone.ink,
              padding: '10px 12px',
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 13.5,
              lineHeight: 1.35,
              animation: 'toast-in 160ms ease-out',
            }}
          >
            <div style={{ flex: 1 }}>{t.message}</div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: 'none',
                color: tone.ink,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 4px',
                opacity: 0.7,
              }}
            >×</button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
