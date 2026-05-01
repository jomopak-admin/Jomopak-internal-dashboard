import { useEffect, useRef, useState } from 'react';
import { AppData } from '../types';
import { loadAppData, saveAppData } from '../utils/storage';
import { fetchAppData, syncAppData } from '../utils/supabaseData';

export function useProductionData(enabled = true) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [loading, setLoading] = useState(enabled);
  const hasLoaded = useRef(false);

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

  useEffect(() => {
    if (!enabled || !hasLoaded.current) {
      return;
    }

    syncAppData(data).catch((error) => {
      console.error('Failed to sync Supabase data', error);
    });
  }, [data, enabled]);

  return { data, setData, loading };
}
