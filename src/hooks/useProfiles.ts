import { useEffect, useState } from 'react';
import { normalizeDashboardWidgets, normalizeProfilePermissions, UserProfile } from '../types';
import { supabase } from '../utils/supabase';

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserProfile['role'];
  permissions: UserProfile['permissions'];
  dashboardWidgets: UserProfile['dashboardWidgets'];
}

interface CreateUserResultRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  permissions: string[] | null;
  dashboard_widgets?: string[] | null;
}

const DASHBOARD_WIDGETS_STORAGE_KEY = 'jomopak-dashboard-widgets';

function loadDashboardWidgetOverrides(): Record<string, UserProfile['dashboardWidgets']> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(DASHBOARD_WIDGETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, UserProfile['dashboardWidgets']> : {};
  } catch {
    return {};
  }
}

function saveDashboardWidgetOverrides(overrides: Record<string, UserProfile['dashboardWidgets']>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(DASHBOARD_WIDGETS_STORAGE_KEY, JSON.stringify(overrides));
}

export function useProfiles(enabled: boolean) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Failed to load profiles', error);
      } else if (active) {
        const widgetOverrides = loadDashboardWidgetOverrides();
        setProfiles(
          (data ?? []).map((row) => ({
            id: row.id,
            email: row.email ?? '',
            fullName: row.full_name ?? '',
            role: (row.role ?? 'ops') as UserProfile['role'],
            permissions: normalizeProfilePermissions(row.role ?? 'ops', row.permissions),
            dashboardWidgets: normalizeDashboardWidgets(
              row.role ?? 'ops',
              row.dashboard_widgets ?? widgetOverrides[row.id],
            ),
          })),
        );
      }

      if (active) {
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [enabled]);

  async function saveProfile(nextProfile: UserProfile) {
    const payload = {
      id: nextProfile.id,
      email: nextProfile.email || null,
      full_name: nextProfile.fullName || null,
      role: nextProfile.role,
      permissions: nextProfile.permissions,
      dashboard_widgets: nextProfile.dashboardWidgets,
    };

    let { error } = await supabase.from('profiles').upsert(payload);
    if (error && String(error.message || '').includes('dashboard_widgets')) {
      const overrides = loadDashboardWidgetOverrides();
      overrides[nextProfile.id] = nextProfile.dashboardWidgets;
      saveDashboardWidgetOverrides(overrides);
      ({ error } = await supabase.from('profiles').upsert({
        id: nextProfile.id,
        email: nextProfile.email || null,
        full_name: nextProfile.fullName || null,
        role: nextProfile.role,
        permissions: nextProfile.permissions,
      }));
    }

    if (error) {
      throw error;
    }

    setProfiles((current) =>
      current.map((profile) => (profile.id === nextProfile.id ? nextProfile : profile)),
    );
  }

async function createUser(input: CreateUserInput) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error('No active admin session found. Please sign in again.');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/admin-create-dashboard-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        role: input.role,
        permissions: input.permissions,
        dashboardWidgets: input.dashboardWidgets,
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to create dashboard user.');
  }

  const row = payload as CreateUserResultRow;
  if (!row?.id) {
    throw new Error('User creation did not return a profile record.');
  }

  const nextProfile: UserProfile = {
    id: row.id,
    email: row.email ?? input.email,
    fullName: row.full_name ?? input.fullName,
    role: (row.role ?? input.role) as UserProfile['role'],
    permissions: normalizeProfilePermissions(
      (row.role ?? input.role) as UserProfile['role'],
      row.permissions ?? input.permissions,
    ),
    dashboardWidgets: normalizeDashboardWidgets(
      (row.role ?? input.role) as UserProfile['role'],
      row.dashboard_widgets ?? input.dashboardWidgets,
    ),
  };

  setProfiles((current) =>
    [...current, nextProfile].sort((left, right) =>
      (left.fullName || left.email).localeCompare(right.fullName || right.email),
    ),
  );
}


  return {
    profiles,
    setProfiles,
    loading,
    saveProfile,
    createUser,
  };
}
