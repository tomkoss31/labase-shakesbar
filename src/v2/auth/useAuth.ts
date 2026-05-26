// Hook auth Supabase — OTP code 6 chiffres + récupération profil
// ⚠️ Désormais un Context : instancié UNE FOIS dans AuthProvider en haut de
// l'app. Plus de double listener onAuthStateChange (qui causait race conditions
// pendant verifyOtp).
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile } from './types';

export type AuthStatus = 'loading' | 'unconfigured' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  email: string | null;
}

interface AuthContextValue extends AuthState {
  sendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    patch: Partial<Pick<Profile, 'first_name' | 'birthday'>>,
  ) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuthState(): AuthContextValue {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    session: null,
    profile: null,
    email: null,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      if (error.code === 'PGRST116') {
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single();
        return created as Profile | null;
      }
      console.warn('[useAuth] fetchProfile error:', error.message);
      return null;
    }
    return data as Profile;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState({ status: 'unconfigured', session: null, profile: null, email: null });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setState({ status: 'unconfigured', session: null, profile: null, email: null });
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        setState({ status: 'anonymous', session: null, profile: null, email: null });
        return;
      }
      const profile = await fetchProfile(data.session.user.id);
      if (cancelled) return;
      setState({
        status: 'authenticated',
        session: data.session,
        profile,
        email: data.session.user.email ?? null,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange', event, session ? `user=${session.user.email}` : 'no session');
      if (cancelled) return;
      if (!session) {
        setState({ status: 'anonymous', session: null, profile: null, email: null });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (cancelled) return;
      setState({
        status: 'authenticated',
        session,
        profile,
        email: session.user.email ?? null,
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const sendMagicLink = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: 'Supabase non configuré' };
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false, error: 'Email invalide' };
      }
      console.log('[useAuth] sendMagicLink (OTP) for', cleanEmail);
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' ? window.location.origin + '/' : undefined,
          shouldCreateUser: true,
        },
      });
      if (error) {
        console.error('[useAuth] sendMagicLink error:', error.message);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [],
  );

  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: 'Supabase non configuré' };
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim().replace(/\s+/g, '');
      if (cleanToken.length !== 6) {
        return { ok: false, error: 'Le code doit faire 6 chiffres' };
      }

      console.log('[useAuth] verifyOtp start', { email: cleanEmail });

      // Timeout 15s pour éviter un hang infini si Supabase ne répond pas
      const timeoutMs = 15000;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve({
            error: {
              message:
                'Délai dépassé — vérifie ta connexion ou redemande un nouveau code.',
            },
          });
        }, timeoutMs);
      });

      try {
        const verifyPromise = supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });

        const result = (await Promise.race([verifyPromise, timeoutPromise])) as {
          error: { message: string } | null;
        };
        if (timeoutId) clearTimeout(timeoutId);

        if (result.error) {
          console.error('[useAuth] verifyOtp error:', result.error.message);
          return { ok: false, error: result.error.message };
        }

        console.log('[useAuth] verifyOtp OK');
        return { ok: true };
      } catch (e: any) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('[useAuth] verifyOtp threw:', e?.message ?? e);
        return { ok: false, error: e?.message ?? 'Erreur inconnue' };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, 'first_name' | 'birthday'>>) => {
      const supabase = getSupabase();
      if (!supabase || !state.session) return { ok: false, error: 'Non authentifié' };
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', state.session.user.id)
        .select()
        .single();
      if (error) return { ok: false, error: error.message };
      setState((s) => ({ ...s, profile: data as Profile }));
      return { ok: true };
    },
    [state.session],
  );

  return {
    ...state,
    sendMagicLink,
    verifyOtp,
    signOut,
    updateProfile,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value = useAuthState();
  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback : si pas de Provider (ex: rendu isolé), crée une instance locale
    // Pas idéal mais évite un crash.
    console.warn('[useAuth] No AuthProvider in tree, falling back to local instance');
    return useAuthState();
  }
  return ctx;
}
