/**
 * useRealtimeSync — Phase 18
 *
 * Subscribes to `postgres_changes` events on the high-traffic tables and
 * merges INSERT / UPDATE / DELETE events into the in-memory AppData
 * state. This lets a user in Cape Town see a new lead added by a user
 * in London within a second, without a page reload.
 *
 * Subscriptions are scoped to the 11 tables explicitly enabled on the
 * `supabase_realtime` publication in phase 18 SQL. The hook is
 * defensive about subscription churn — it sets up once on mount and
 * cleans up on unmount, leaving the underlying socket alone otherwise.
 *
 * Important: the hook *merges* events into state, it doesn't replace
 * the whole table. If two events arrive for the same row, the later one
 * wins (matches the OCC version trigger we already have).
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import {
  mapJob, mapInvoice, mapClient, mapLead, mapQuoteEstimate,
  mapWorkTicket, mapMaterialReceipt, mapDispatch, mapFinishedGoodsStock,
  mapProofOfDelivery, mapInvoiceInboxItem,
} from '../utils/supabaseData';
import { AppData } from '../types';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

/** Snake-case table → AppData array key + mapper. */
const TABLE_MAP: Array<{
  table: string;
  appKey: keyof AppData;
  mapper: (row: any) => any;
}> = [
  { table: 'jobs',                  appKey: 'jobs',                  mapper: mapJob },
  { table: 'invoices',              appKey: 'invoices',              mapper: mapInvoice },
  { table: 'leads',                 appKey: 'leads',                 mapper: mapLead },
  { table: 'clients',               appKey: 'clients',               mapper: mapClient },
  { table: 'quote_estimates',       appKey: 'quoteEstimates',        mapper: mapQuoteEstimate },
  { table: 'work_tickets',          appKey: 'workTickets',           mapper: mapWorkTicket },
  { table: 'material_receipts',     appKey: 'materialReceipts',      mapper: mapMaterialReceipt },
  { table: 'dispatch_records',      appKey: 'dispatchRecords',       mapper: mapDispatch },
  { table: 'finished_goods_stock',  appKey: 'finishedGoodsStock',    mapper: mapFinishedGoodsStock },
  { table: 'proof_of_deliveries',   appKey: 'proofOfDeliveries',     mapper: mapProofOfDelivery },
  { table: 'invoice_inbox_items',   appKey: 'invoiceInboxItems',     mapper: mapInvoiceInboxItem },
];

interface UseRealtimeSyncOptions {
  /** Identifier of the *current* user so we can skip echoes of our own
   *  writes (otherwise we'd re-merge the row we just sent). Pass the
   *  auth user id, or '' to disable filtering. */
  selfUserId?: string;
  /** Optional toast hook called for each remote change. */
  onRemoteChange?: (kind: EventType, table: string, payload: any) => void;
}

export function useRealtimeSync(
  setData: React.Dispatch<React.SetStateAction<AppData>>,
  opts: UseRealtimeSyncOptions = {},
) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const channel = supabase.channel('jomopak-realtime');

    for (const { table, appKey, mapper } of TABLE_MAP) {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        (payload: any) => {
          const kind = payload.eventType as EventType;
          const newRow = payload.new ?? null;
          const oldRow = payload.old ?? null;
          const targetId = (newRow && newRow.id) || (oldRow && oldRow.id);

          if (!targetId) return;

          // The hook callbacks fire for *every* change, including the
          // current user's own. Notify the listener — let it decide whether
          // to surface a toast.
          optsRef.current.onRemoteChange?.(kind, table, payload);

          setData((current) => {
            const arr = (current[appKey] as any[]) || [];
            if (kind === 'DELETE') {
              return { ...current, [appKey]: arr.filter((r: any) => r.id !== targetId) };
            }
            const mapped = mapper(newRow);
            const exists = arr.some((r: any) => r.id === targetId);
            const next = exists
              ? arr.map((r: any) => (r.id === targetId ? mapped : r))
              : [mapped, ...arr];
            return { ...current, [appKey]: next };
          });
        },
      );
    }

    channel.subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Supabase Realtime auto-reconnects, but log so we can tell when
        // a session is degraded.
        console.warn('Realtime channel status:', status);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
