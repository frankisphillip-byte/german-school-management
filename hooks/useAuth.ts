/**
 * hooks/useAuth.ts
 *
 * Zero-Trust auth hook.
 *
 * Key security guarantee:
 *   The user's `role` is NEVER read from localStorage, JWT claims, or React state
 *   passed from a parent component. It is fetched fresh from the `profiles` table
 *   on every session mount and after every token refresh — making client-side
 *   role tampering impossible (the DB RLS policies enforce it anyway).
 *
 * Usage:
 *   const { user, profile, role, isLoading, isAuthenticated } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  assertDomainRestriction,
  onAuthStateChange,
} from '../services/supabase';
import type { Profile, UserRole } from '../types';

export interface AuthState {
  user:            User    | null;
  profile:         Profile | null;
  role:            UserRole | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  error:           string  | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user:            null,
    profile:         null,
    role:            null,
    isLoading:       true,
    isAuthenticated: false,
    error:           null,
  });

  /**
   * Fetches the user's profile (including role) from the DB.
   * This is the ONLY place role is determined — never from client state.
   */
  const fetchProfile = useCallback(async (user: User): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[useAuth] Failed to fetch profile:', error.message);
      return null;
    }

    return data as Profile;
  }, []);

  const handleAuthChange = useCallback(
    async (_event: string, session: Session | null) => {
      if (!session?.user) {
        setState({
          user: null, profile: null, role: null,
          isLoading: false, isAuthenticated: false, error: null,
        });
        return;
      }

      const { user } = session;

      try {
        assertDomainRestriction(user);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Domain not allowed';
        setState({
          user: null, profile: null, role: null,
          isLoading: false, isAuthenticated: false, error: message,
        });
        return;
      }

      const profile = await fetchProfile(user);

      if (!profile) {
        setState({
          user, profile: null, role: null,
          isLoading: false, isAuthenticated: false,
          error: 'Profile not found. Contact your administrator.',
        });
        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        setState({
          user: null, profile: null, role: null,
          isLoading: false, isAuthenticated: false,
          error: 'Your account has been deactivated. Contact your administrator.',
        });
        return;
      }

      setState({
        user,
        profile,
        role:            profile.role,
        isLoading:       false,
        isAuthenticated: true,
        error:           null,
      });
    },
    [fetchProfile]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL_SESSION', session);
    });

    const unsubscribe = onAuthStateChange(handleAuthChange);
    return unsubscribe;
  }, [handleAuthChange]);

  return state;
}
