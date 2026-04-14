import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { normalizeDashboardWidgets, normalizeProfilePermissions, UserProfile } from '../types';
import { supabase } from '../utils/supabase';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  recoveryMode: boolean;
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Failed to load user profile', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email ?? '',
    fullName: data.full_name ?? '',
    role: (data.role ?? 'ops') as UserProfile['role'],
    permissions: normalizeProfilePermissions(data.role ?? 'ops', data.permissions),
    dashboardWidgets: normalizeDashboardWidgets(data.role ?? 'ops', data.dashboard_widgets),
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
    recoveryMode: false,
  });

  useEffect(() => {
    let active = true;
    const hasRecoveryToken = () =>
      typeof window !== 'undefined' && window.location.hash.includes('type=recovery');

    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (active) {
          setState((current) => ({
            ...current,
            session,
            loading: false,
            recoveryMode: hasRecoveryToken(),
          }));
        }
      } catch (error) {
        console.error('Failed to bootstrap auth session', error);
        if (active) {
          setState((current) => ({
            ...current,
            session: null,
            profile: null,
            loading: false,
            recoveryMode: hasRecoveryToken(),
          }));
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active) {
        setState((current) => ({
          ...current,
          session,
          loading: false,
          recoveryMode: event === 'PASSWORD_RECOVERY' || hasRecoveryToken(),
        }));
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapProfile() {
      if (!state.session?.user) {
        if (active) {
          setState((current) => ({ ...current, profile: null }));
        }
        return;
      }

      const profile = await loadProfile(state.session.user.id);
      if (active) {
        setState((current) => ({ ...current, profile }));
      }
    }

    bootstrapProfile();

    return () => {
      active = false;
    };
  }, [state.session?.user?.id]);

  function clearRecoveryMode() {
    setState((current) => ({ ...current, recoveryMode: false }));
  }

  return {
    ...state,
    clearRecoveryMode,
  };
}
