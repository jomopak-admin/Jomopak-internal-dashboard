import { useEffect, useRef, useState } from 'react';
import { buildSeedData } from '../data/seedData';
import { AppData } from '../types';
import { fetchAppData, syncAppData } from '../utils/supabaseData';

export function useProductionData() {
  const [data, setData] = useState<AppData>(buildSeedData());
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) {
      return;
    }

    syncAppData(data).catch((error) => {
      console.error('Failed to sync Supabase data', error);
    });
  }, [data]);

  return { data, setData, loading };
}
