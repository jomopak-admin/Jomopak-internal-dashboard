/**
 * useRecordLock — Phase 18
 *
 * Soft, presence-based lock on a single record. When a user opens an
 * edit form, the hook joins a Supabase Realtime channel scoped to
 * `lock:{table}:{id}` and tracks who else is currently in the same
 * channel. The form can then show a banner like:
 *
 *   "Alice is editing this right now — view only?  [Override]"
 *
 * On Override, the caller writes a `lock_override` row to audit_events
 * so the displacement is traceable.
 *
 * Limitations (deliberate):
 *   • Presence is best-effort. If a tab is force-closed the presence
 *     entry remains until the Realtime server's heartbeat timeout
 *     (~30s). That's fine — banner clears itself when the ghost expires.
 *   • There's no DB-level lock. The OCC version column on critical
 *     tables still catches a concurrent save at write time, so even if
 *     two users both override, the second saver gets blocked.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export interface LockPresence {
  userId: string;
  userName: string;
  joinedAt: string;
  /** True when this presence is *us* (so the banner can ignore self). */
  isSelf: boolean;
}

interface UseRecordLockOptions {
  table: string;
  recordId: string | null;
  /** Display info for the joining user — shown in the banner that
   *  other users see. */
  user: { id: string; name: string };
  /** Optional flag to skip subscribing entirely (e.g. when the form is
   *  in create-mode and there's no record yet). */
  enabled?: boolean;
}

export interface UseRecordLockResult {
  /** Everyone else currently editing this record. */
  otherEditors: LockPresence[];
  /** True iff anyone other than us is in the channel. */
  isLocked: boolean;
  /** Lets the form release the channel manually (e.g. on Save). */
  release: () => void;
}

export function useRecordLock(opts: UseRecordLockOptions): UseRecordLockResult {
  const { table, recordId, user, enabled = true } = opts;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presences, setPresences] = useState<LockPresence[]>([]);

  useEffect(() => {
    if (!enabled || !recordId) {
      setPresences([]);
      return;
    }

    const channelName = `edit-lock:${table}:${recordId}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: user.id || crypto.randomUUID() } },
    });
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, Array<{ user_id: string; user_name: string; joined_at: string }>>;
      const all: LockPresence[] = [];
      for (const [key, entries] of Object.entries(state)) {
        for (const entry of entries) {
          all.push({
            userId: entry.user_id || key,
            userName: entry.user_name || 'Unknown',
            joinedAt: entry.joined_at,
            isSelf: (entry.user_id || key) === user.id,
          });
        }
      }
      setPresences(all);
    });

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          user_name: user.name,
          joined_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      void channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, recordId, enabled]);

  const otherEditors = useMemo(
    () => presences.filter((p) => !p.isSelf),
    [presences],
  );

  return {
    otherEditors,
    isLocked: otherEditors.length > 0,
    release: () => {
      const c = channelRef.current;
      if (!c) return;
      void c.untrack();
      supabase.removeChannel(c);
      channelRef.current = null;
    },
  };
}
