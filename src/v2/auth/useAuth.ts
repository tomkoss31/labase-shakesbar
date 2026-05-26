// Hook auth Supabase — magic link email + récupération profil
import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile } from './types';

export type AuthStatus = 'loading' | 'unconfigured' | 'anonymous' | 'authenticated';

interface UseAuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  email: string | null;
}

export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    status: 'loading',
    session: null,
    profile: null,
    email: null,
  });

  // Récupération du profil depuis Supabase
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
      // Profil pas encore créé (peut arriver si le trigger n'a pas tourné)
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

    // Récupère la session existante au chargement
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

    // Écoute les changements (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

  // Envoi du magic link
  const sendMagicLink = useCallback(async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: 'Supabase non configuré' };

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Email invalide' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined,
        shouldCreateUser: true,
      },
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  // Déconnexion
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // Mise à jour profil (ex: prénom)
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
    signOut,
    updateProfile,
  };
}
