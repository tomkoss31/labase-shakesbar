// Hook auth Supabase — OTP code 6 chiffres + récupération profil
// ⚠️ Désormais un Context : instancié UNE FOIS dans AuthProvider en haut de
// l'app. Plus de double listener onAuthStateChange (qui causait race conditions
// pendant verifyOtp).
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile } from './types';
import { track } from '../../lib/analytics';

export type AuthStatus = 'loading' | 'unconfigured' | 'anonymous' | 'authenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  email: string | null;
  // Vrai quand l'utilisateur clique sur un lien "reset password" :
  // l'app doit afficher l'UI "Choisis un nouveau mot de passe".
  inPasswordRecovery: boolean;
}

interface AuthContextValue extends AuthState {
  sendMagicLink: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  dismissPasswordRecovery: () => void;
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
    inPasswordRecovery: false,
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
      setState({ status: 'unconfigured', session: null, profile: null, email: null, inPasswordRecovery: false });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setState({ status: 'unconfigured', session: null, profile: null, email: null, inPasswordRecovery: false });
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        setState({
          status: 'anonymous',
          session: null,
          profile: null,
          email: null,
          inPasswordRecovery: false,
        });
        return;
      }
      const profile = await fetchProfile(data.session.user.id);
      if (cancelled) return;
      setState({
        status: 'authenticated',
        session: data.session,
        profile,
        email: data.session.user.email ?? null,
        inPasswordRecovery: false,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange', event, session ? `user=${session.user.email}` : 'no session');
      if (event === 'SIGNED_IN') track('auth_signed_in');
      if (cancelled) return;
      if (!session) {
        setState({
          status: 'anonymous',
          session: null,
          profile: null,
          email: null,
          inPasswordRecovery: false,
        });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (cancelled) return;
      // PASSWORD_RECOVERY = user a cliqué le lien "reset password" dans le mail
      // → on lui propose direct l'UI "choisis un nouveau mot de passe"
      const isRecovery = event === 'PASSWORD_RECOVERY';
      setState({
        status: 'authenticated',
        session,
        profile,
        email: session.user.email ?? null,
        inPasswordRecovery: isRecovery,
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

  // ⚠️ Bypass supabase-js : on appelle DIRECTEMENT l'endpoint REST Supabase.
  // Cela évite tout bug interne du client (versionning, refresh token, etc.).
  // Au succès, on setSession() manuellement pour que onAuthStateChange fire.
  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: 'Supabase non configuré' };
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim().replace(/\s+/g, '');
      if (cleanToken.length !== 6) {
        return { ok: false, error: 'Le code doit faire 6 chiffres' };
      }

      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !anonKey) {
        return { ok: false, error: 'Config Supabase manquante' };
      }

      console.log('[useAuth] verifyOtp direct REST call', { email: cleanEmail, url });

      // Timeout 10s via AbortController (vrai timeout réseau, pas race promise)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const resp = await fetch(`${url}/auth/v1/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            type: 'email',
            email: cleanEmail,
            token: cleanToken,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await resp.json().catch(() => ({}));
        console.log('[useAuth] verifyOtp REST response', resp.status, data);

        if (!resp.ok) {
          const msg =
            data?.error_description || data?.msg || data?.error || `HTTP ${resp.status}`;
          return { ok: false, error: msg };
        }

        // Réponse OK → on a access_token + refresh_token + user
        if (!data.access_token || !data.refresh_token) {
          return { ok: false, error: 'Réponse Supabase invalide (pas de session)' };
        }

        // Injecte la session dans le client supabase-js avec timeout 3s
        // (au cas où setSession serait elle aussi buggée)
        const setSessionController = new AbortController();
        const setSessionTimeout = setTimeout(() => setSessionController.abort(), 3000);
        try {
          const setSessionPromise = supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          const abortPromise = new Promise<{ error: { message: string } }>((_, reject) => {
            setSessionController.signal.addEventListener('abort', () =>
              reject(new Error('setSession timeout')),
            );
          });
          await Promise.race([setSessionPromise, abortPromise]);
          clearTimeout(setSessionTimeout);
          console.log('[useAuth] verifyOtp OK + session injectée via setSession');
        } catch (setErr: any) {
          clearTimeout(setSessionTimeout);
          console.warn('[useAuth] setSession failed/timed out, fallback localStorage write:', setErr?.message);
          // Fallback nuclear option : on écrit la session DIRECTEMENT en localStorage
          // au format Supabase attend. Au prochain getSession() ou reload, ce sera lu.
          try {
            const projectRef = url.replace('https://', '').split('.')[0];
            const storageKey = `sb-${projectRef}-auth-token`;
            const sessionData = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_type: data.token_type || 'bearer',
              expires_in: data.expires_in,
              expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
              user: data.user,
            };
            window.localStorage.setItem(storageKey, JSON.stringify(sessionData));
            console.log('[useAuth] session écrite en localStorage:', storageKey);
            // Force reload pour que tout se rafraîchisse proprement
            window.setTimeout(() => window.location.reload(), 300);
          } catch (lsErr) {
            console.error('[useAuth] localStorage fallback failed:', lsErr);
          }
        }
        return { ok: true };
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (e?.name === 'AbortError') {
          return {
            ok: false,
            error: 'Délai dépassé — vérifie ta connexion ou redemande un nouveau code.',
          };
        }
        console.error('[useAuth] verifyOtp REST threw:', e?.message ?? e);
        return { ok: false, error: e?.message ?? 'Erreur réseau' };
      }
    },
    [],
  );

  // ═══ AUTH PAR MOT DE PASSE — REST DIRECT (bypass supabase-js iOS PWA bug) ═══
  // Toutes les méthodes d'auth qui touchent à la session passent par fetch
  // direct sur les endpoints REST Supabase. Cela évite les hangs internes
  // du client supabase-js v2 sur iOS PWA standalone mode.

  // Helper interne : POST sur un endpoint auth Supabase avec timeout 10s
  // et injection de session dans le client + localStorage en cas de succès.
  const callAuthEndpoint = useCallback(
    async (
      path: string,
      body: Record<string, unknown>,
      queryString = '',
    ): Promise<{ ok: boolean; error?: string; data?: any }> => {
      const supabase = getSupabase();
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabase || !url || !anonKey)
        return { ok: false, error: 'Supabase non configuré' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const resp = await fetch(`${url}/auth/v1/${path}${queryString}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await resp.json().catch(() => ({}));
        console.log('[useAuth] REST', path, resp.status, data);

        if (!resp.ok) {
          const msg =
            data?.error_description ||
            data?.msg ||
            data?.error ||
            `HTTP ${resp.status}`;
          return { ok: false, error: msg };
        }

        // Si la réponse contient une session, on écrit DIRECTEMENT en
        // localStorage au format Supabase, puis on reload la page. Plus
        // de setSession (cause systématique de hangs/déconnexions iOS PWA).
        if (data.access_token && data.refresh_token) {
          try {
            const projectRef = url.replace('https://', '').split('.')[0];
            const storageKey = `sb-${projectRef}-auth-token`;
            const sessionData = {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_type: data.token_type || 'bearer',
              expires_in: data.expires_in,
              expires_at:
                data.expires_at ||
                Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
              user: data.user,
            };
            window.localStorage.setItem(storageKey, JSON.stringify(sessionData));
            console.log('[useAuth] session écrite, reload imminent');
            // Petit délai pour que le storage soit bien flushé avant reload
            window.setTimeout(() => window.location.reload(), 300);
          } catch (e) {
            console.error('[useAuth] localStorage write failed:', e);
            return { ok: false, error: 'Impossible de stocker la session' };
          }
        }

        return { ok: true, data };
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (e?.name === 'AbortError') {
          return {
            ok: false,
            error: 'Délai dépassé — vérifie ta connexion.',
          };
        }
        console.error('[useAuth] REST threw:', e?.message ?? e);
        return { ok: false, error: e?.message ?? 'Erreur réseau' };
      }
    },
    [],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) return { ok: false, error: 'Email invalide' };
      if (password.length < 6) return { ok: false, error: 'Mot de passe trop court (6 min)' };

      return callAuthEndpoint(
        'token',
        { email: cleanEmail, password },
        '?grant_type=password',
      );
    },
    [callAuthEndpoint],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) return { ok: false, error: 'Email invalide' };
      if (password.length < 6)
        return { ok: false, error: 'Mot de passe trop court (6 caractères min)' };

      const res = await callAuthEndpoint('signup', { email: cleanEmail, password });
      // Si Supabase est en mode "Confirm email" ON, signup ne retourne pas
      // de session → l'utilisateur doit cliquer un lien. Détection :
      if (res.ok && (!res.data?.access_token || !res.data?.refresh_token)) {
        return {
          ok: false,
          error:
            'Compte créé. Vérifie ta boîte mail pour confirmer (ou désactive "Confirm email" dans Supabase Auth).',
        };
      }
      return res;
    },
    [callAuthEndpoint],
  );

  const resetPassword = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: 'Supabase non configuré' };
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) return { ok: false, error: 'Email invalide' };

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin + '/' : undefined,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
    [],
  );

  // Une fois le user landé via lien reset, il choisit son nouveau mdp
  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: 'Supabase non configuré' };
      if (newPassword.length < 6) {
        return { ok: false, error: 'Mot de passe trop court (6 caractères min)' };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      // Sortie du mode recovery
      setState((s) => ({ ...s, inPasswordRecovery: false }));
      return { ok: true };
    },
    [],
  );

  const dismissPasswordRecovery = useCallback(() => {
    setState((s) => ({ ...s, inPasswordRecovery: false }));
  }, []);

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
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    updatePassword,
    dismissPasswordRecovery,
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
