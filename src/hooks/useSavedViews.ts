import { useCallback, useEffect, useState } from 'react';

/**
 * Saved views — named filter presets persisted per (scope, user) in
 * localStorage. The hook is intentionally generic over the filter shape: any
 * page that has a filters object can use it.
 *
 * Why localStorage instead of Supabase? Filter presets are a UX nicety, not
 * shared state — every user has their own. localStorage keeps the round trip
 * out of the save flow, and there's no privacy concern (a saved filter is
 * just a JSON blob of the user's own choices). If this graduates to "shared
 * team views", swap the storage layer for a `user_saved_views` Supabase table
 * with the same shape.
 */
export interface SavedView<T> {
  id: string;
  name: string;
  filters: T;
  createdAt: string;
  /** Optional. Preset/built-in views ship with the app and can't be deleted. */
  builtIn?: boolean;
}

function storageKey(scope: string, userId: string): string {
  return `jomopak.savedViews.${userId || 'anon'}.${scope}`;
}

/**
 * Reads saved views for (scope, userId). The `builtIns` array is merged on
 * read — they show up in the list but never touch storage, so the user can't
 * accidentally orphan them. Custom views the user creates land in storage
 * alongside the built-ins.
 */
export function useSavedViews<T>(
  scope: string,
  userId: string,
  builtIns: SavedView<T>[] = [],
) {
  const [views, setViews] = useState<SavedView<T>[]>(() => {
    if (typeof window === 'undefined') return builtIns;
    try {
      const raw = window.localStorage.getItem(storageKey(scope, userId));
      const stored: SavedView<T>[] = raw ? JSON.parse(raw) : [];
      // De-dup by id — built-ins always win, then custom rows.
      const customById = new Map(stored.map((v) => [v.id, v]));
      for (const b of builtIns) customById.set(b.id, { ...b, builtIn: true });
      return Array.from(customById.values());
    } catch {
      return builtIns;
    }
  });

  // Persist on every change. We don't bother debouncing — saves are infrequent
  // (user clicks "Save current") and the payload is tiny.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const customs = views.filter((v) => !v.builtIn);
    try {
      window.localStorage.setItem(storageKey(scope, userId), JSON.stringify(customs));
    } catch {
      // Quota / private mode — silent fail, don't break the page.
    }
  }, [views, scope, userId]);

  const saveView = useCallback((name: string, filters: T) => {
    setViews((prev) => [
      ...prev.filter((v) => v.builtIn || v.name.toLowerCase() !== name.toLowerCase()),
      {
        id: `view-${Date.now()}`,
        name,
        filters,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id || v.builtIn));
  }, []);

  return { views, saveView, deleteView };
}
