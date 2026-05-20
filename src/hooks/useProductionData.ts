import { useCallback, useEffect, useRef, useState } from 'react';
import { AppData } from '../types';
import { loadAppData, saveAppData } from '../utils/storage';
import { fetchAppData, syncAppData } from '../utils/supabaseData';

export function useProductionData(enabled = true) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [loading, setLoading] = useState(enabled);
  const hasLoaded = useRef(false);
  // Always-current snapshot of data for the debounced flusher to read.
  const dataRef = useRef(data);
  dataRef.current = data;
  // Concurrency guards: never run two full-dataset upserts at once (that
  // deadlocks high-contention tables like `clients`), and coalesce any
  // changes that arrive mid-sync into a single follow-up sync.
  const syncing = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setLoading(true);
      hasLoaded.current = false;
      return;
    }

    let isActive = true;

    async function load() {
      try {
        const nextData = await fetchAppData();
        if (isActive) {
          setData(nextData);
        }
      } catch (error) {
        console.error('Failed to load Supabase data', error);
      } finally {
        if (isActive) {
          hasLoaded.current = true;
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, [enabled]);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Run a single Supabase sync, never overlapping with another. If the data
  // changed while a sync was in flight, run exactly one more afterward.
  const flushSync = useCallback(async () => {
    if (syncing.current) {
      pending.current = true;
      return;
    }
    syncing.current = true;
    try {
      await syncAppData(dataRef.current);
    } catch (error) {
      console.error('Failed to sync Supabase data', error);
    } finally {
      syncing.current = false;
      if (pending.current) {
        pending.current = false;
        // Re-run for the changes that landed mid-sync.
        void flushSync();
      }
    }
  }, []);

  // Debounce: wait for edits to settle (1.2s) before syncing, so a burst of
  // state changes (or a form being typed into) produces one upsert, not 40.
  useEffect(() => {
    if (!enabled || !hasLoaded.current) {
      return;
    }
    const timer = setTimeout(() => {
      void flushSync();
    }, 1200);
    return () => clearTimeout(timer);
  }, [data, enabled, flushSync]);

  return { data, setData, loading };
}
