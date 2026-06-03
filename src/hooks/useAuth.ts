import { useCallback, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { InboxCategory, normalizeDashboardWidgets, normalizeProfilePermissions, PartnerScope, UserProfile } from '../types';
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
    username: data.username ?? '',
    phoneNumber: data.phone_number ?? '',
    clientId: data.client_id ?? '',
    accountType: data.account_type === 'client'
      ? 'client'
      : (data.account_type === 'external_partner' ? 'external_partner' : 'internal'),
    publicDisplayName: data.public_display_name ?? data.full_name ?? '',
    publicDisplayRole: data.public_display_role ?? data.role ?? '',
    role: (data.role ?? 'ops') as UserProfile['role'],
    permissions: normalizeProfilePermissions(data.role ?? 'ops', data.permissions),
    dashboardWidgets: normalizeDashboardWidgets(data.role ?? 'ops', data.dashboard_widgets),
    // Phase 124.3 — previously dropped. Without these on the profile, the
    // staff portal can't find the linked Employee, the inbox doesn't filter,
    // partner-scoping breaks, and the stock-redact + approval-PIN features
    // silently revert to defaults.
    linkedEmployeeId: data.linked_employee_id ?? undefined,
    inboxCategories: Array.isArray(data.inbox_categories) && data.inbox_categories.length > 0
      ? (data.inbox_categories as InboxCategory[])
      : undefined,
    partnerScope: Array.isArray(data.partner_scope) && data.partner_scope.length > 0
      ? (data.partner_scope as PartnerScope[])
      : undefined,
    canPostInvoices: Boolean(data.can_post_invoices),
    pricingEditor: Boolean(data.pricing_editor),
    stockVisibility: (data.stock_visibility === 'restricted' ? 'restricted' : 'full'),
    approvalPin: data.approval_pin ?? undefined,
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

  /**
   * Phase 124.3 — Force-refresh the cached profile from Supabase. Called
   * after the user links themselves to an Employee (or any other in-app
   * profile patch) so the UI reflects the change without requiring a
   * full page reload.
   */
  const refreshProfile = useCallback(async () => {
    if (!state.session?.user) return;
    const fresh = await loadProfile(state.session.user.id);
    if (fresh) setState((current) => ({ ...current, profile: fresh }));
  }, [state.session?.user?.id]);

  return {
    ...state,
    clearRecoveryMode,
    refreshProfile,
  };
}
