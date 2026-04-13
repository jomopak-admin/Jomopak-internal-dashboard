import { useEffect, useState } from 'react';
import { normalizeProfilePermissions, UserProfile } from '../types';
import { supabase } from '../utils/supabase';

interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserProfile['role'];
  permissions: UserProfile['permissions'];
}

interface CreateUserResultRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  permissions: string[] | null;
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
        setProfiles(
          (data ?? []).map((row) => ({
            id: row.id,
            email: row.email ?? '',
            fullName: row.full_name ?? '',
            role: (row.role ?? 'ops') as UserProfile['role'],
            permissions: normalizeProfilePermissions(row.role ?? 'ops', row.permissions),
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
    const { error } = await supabase.from('profiles').upsert({
      id: nextProfile.id,
      email: nextProfile.email || null,
      full_name: nextProfile.fullName || null,
      role: nextProfile.role,
      permissions: nextProfile.permissions,
    });

    if (error) {
      throw error;
    }

    setProfiles((current) =>
      current.map((profile) => (profile.id === nextProfile.id ? nextProfile : profile)),
    );
  }

  async function createUser(input: CreateUserInput) {
    const { data, error } = await supabase.functions.invoke('admin-create-dashboard-user', {
      body: {
        email: input.email,
        password: input.password,
        fullName: input.fullName,
        role: input.role,
        permissions: input.permissions,
      },
    });

    if (error) {
      throw error;
    }

    const row = data as CreateUserResultRow | null;
    if (!row?.id) {
      throw new Error('User creation did not return a profile record.');
    }

    const nextProfile: UserProfile = {
      id: row.id,
      email: row.email ?? input.email,
      fullName: row.full_name ?? input.fullName,
      role: (row.role ?? input.role) as UserProfile['role'],
      permissions: normalizeProfilePermissions((row.role ?? input.role) as UserProfile['role'], row.permissions ?? input.permissions),
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
