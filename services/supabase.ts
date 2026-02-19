/**
 * services/supabase.ts
 *
 * Production Supabase client — replaces the previous mock implementation.
 *
 * Features:
 *  - Official @supabase/supabase-js v2 client
 *  - Google Workspace OIDC restricted to @deutschlern.de domain
 *  - Centralised signIn / signOut / getSession helpers
 *  - Session persistence via localStorage (pkce flow for CSRF protection)
 *
 * Environment variables required (in .env.local / Supabase Dashboard):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '../types/database'; // generated via `supabase gen types`

// ── Env validation ────────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const ALLOWED_DOMAIN = 'deutschlern.de';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Add them to your .env.local file.'
  );
}

// ── Client singleton ──────────────────────────────────────────────────────────
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON,
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'german-school-management/1.0',
      },
    },
  }
);

// ── Google Workspace OIDC Sign-In ─────────────────────────────────────────────
/**
 * Initiates Google OAuth sign-in restricted to the @deutschlern.de domain.
 *
 * The `hd` (hosted domain) hint tells Google to pre-select the school account
 * and reject sign-ins from personal Google accounts at the consent screen.
 *
 * IMPORTANT: Also configure "Authorized domain restriction" in your
 * Supabase Dashboard → Auth → Providers → Google to enforce this server-side.
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        hd: ALLOWED_DOMAIN,
        access_type: 'offline',
        prompt: 'select_account consent',
      },
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'openid email profile',
    },
  });

  if (error) {
    console.error('[Auth] Google sign-in failed:', error.message);
    throw error;
  }
}

/**
 * Validates that the signed-in user belongs to @deutschlern.de.
 * Called after the OAuth callback as a second line of defence.
 * Primary enforcement is server-side via Supabase Dashboard settings.
 */
export function assertDomainRestriction(user: User): void {
  const email = user.email ?? '';
  const domain = email.split('@')[1];

  if (domain !== ALLOWED_DOMAIN) {
    supabase.auth.signOut();
    throw new Error(
      `[Auth] Access denied. Only @${ALLOWED_DOMAIN} accounts are permitted. ` +
      `Received: @${domain}`
    );
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[Auth] getSession error:', error.message);
    return null;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    console.error('[Auth] Sign-out error:', error.message);
    throw error;
  }
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ── Storage helper ────────────────────────────────────────────────────────────
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error('[Storage] getSignedUrl error:', error.message);
    return null;
  }
  return data.signedUrl;
}
