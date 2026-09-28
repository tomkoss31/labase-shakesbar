// Hook auth Supabase — OTP code 6 chiffres + récupération profil
// ⚠️ Désormais un Context : instancié UNE FOIS dans AuthProvider en haut de
// l'app. Plus de double listener onAuthStateChange (qui causait race conditions
// pendant verifyOtp).
import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  getSupabase,
  isSupabaseConfigured,
  refreshStoredSession,
  SESSION_REFRESHED_EVENT,
  type RefreshResult,
} from '../../lib/supabase';
import type { Profile } from './types';
import { track } from '../../lib/analytics';

// ─── Dernier profil connu, gardé sur le téléphone ───────────────────
// Affiché immédiatement au démarrage (et sans réseau au comptoir : solde XP,
// prénom), puis remplacé dès que le serveur répond. Lié à l'id du compte :
// jamais le profil d'un autre client. Effacé à la déconnexion.
const PROFILE_CACHE_KEY = 'labase-profile-cache-v1';

function readCachedProfile(userId: string | undefined | null): Profile | null {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return cached?.id === userId && cached.profile ? (cached.profile as Profile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile: Profile | null | undefined): void {
  if (!profile?.id) return;
  try {
    window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ id: profile.id, profile, savedAt: Date.now() }));
  } catch {
    /* stockage plein / privé : pas grave */
  }
}

function clearCachedProfile(): void {
  try {
    window.localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

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
  refreshProfile: () => Promise<void>;
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

  // Bypass supabase.from() qui hang iOS PWA — passe par REST PostgREST direct
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!envUrl || !anonKey) return null;

    // On a besoin du token pour passer RLS
    const stored = (() => {
      try {
        const projectRef = envUrl.replace(/^https?:\/\//, '').split('.')[0];
        const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    const token = stored?.access_token;
    if (!token) return null;

    // Déclenche la bienvenue (email + push) au 1er login. On l'appelle ICI
    // (et non sur l'événement SIGNED_IN, trop fragile : souvent raté au clic
    // du magic link car l'abonnement arrive après → on reçoit INITIAL_SESSION)
    // car fetchProfile tourne à CHAQUE chargement authentifié. Idempotent :
    // on n'appelle que si welcome_sent === false, et le serveur re-vérifie.
    const maybeWelcome = (p: any) => {
      if (p && p.welcome_sent === false) {
        fetch('/api/profile?action=welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch(
        `${envUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (!resp.ok) {
        console.warn('[useAuth] fetchProfile HTTP', resp.status);
        return null;
      }
      const rows = (await resp.json()) as Profile[];
      if (rows.length > 0) {
        maybeWelcome(rows[0]);
        writeCachedProfile(rows[0]);
        return rows[0];
      }

      // Pas de profile → on en crée un (trigger handle_new_user a peut-être raté)
      const createResp = await fetch(`${envUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ id: userId }),
      });
      if (createResp.ok) {
        const created = (await createResp.json()) as Profile[];
        maybeWelcome(created[0]);
        writeCachedProfile(created[0]);
        return created[0] ?? null;
      }
      return null;
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('[useAuth] fetchProfile error:', e?.message ?? e);
      return null;
    }
  }, []);

  // Rafraîchit la session via le helper partagé lib/supabase (REST direct,
  // bypass autoRefreshToken désactivé car il hang sur iOS PWA). Le state est
  // mis à jour par l'écouteur SESSION_REFRESHED_EVENT ci-dessous.
  //   'invalid' = refresh_token refusé → déconnexion justifiée
  //   'network' = coupure / 4G faible → on GARDE la session et on réessaie
  const refreshSession = useCallback((): Promise<RefreshResult> => refreshStoredSession(), []);

  // Toute session rafraîchie (par useAuth, la roue, le paiement…) met à jour le state.
  useEffect(() => {
    const onRefreshed = (e: Event) => {
      const sessionData = (e as CustomEvent).detail;
      if (!sessionData?.access_token) return;
      setState((s) => ({
        ...s,
        status: 'authenticated',
        session: sessionData as unknown as Session,
        email: sessionData.user?.email ?? s.email,
      }));
    };
    window.addEventListener(SESSION_REFRESHED_EVENT, onRefreshed);
    return () => window.removeEventListener(SESSION_REFRESHED_EVENT, onRefreshed);
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
    let bootRetry: number | undefined;

    // ⚠️ BYPASS supabase.auth.getSession() qui HANG sur iOS PWA et même
    // sur Chrome dans certains cas (Web Lock acquise et jamais relâchée par
    // un call refresh planté). On lit localStorage MANUELLEMENT pour
    // déterminer si on a une session valide.
    (async () => {
      try {
        const envUrl = import.meta.env.VITE_SUPABASE_URL;
        const projectRef = envUrl?.replace(/^https?:\/\//, '').split('.')[0];
        const key = `sb-${projectRef}-auth-token`;
        const raw = window.localStorage.getItem(key);
        console.log('[useAuth] BOOT — localStorage key:', key, 'present:', !!raw);

        if (!raw) {
          setState({
            status: 'anonymous',
            session: null,
            profile: null,
            email: null,
            inPasswordRecovery: false,
          });
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          console.warn('[useAuth] BOOT — localStorage JSON invalide, suppression');
          window.localStorage.removeItem(key);
          setState({
            status: 'anonymous',
            session: null,
            profile: null,
            email: null,
            inPasswordRecovery: false,
          });
          return;
        }

        const expiresAt = parsed.expires_at as number | undefined;
        const now = Math.floor(Date.now() / 1000);
        console.log('[useAuth] BOOT — session expires_at:', expiresAt, 'now:', now);

        if (!expiresAt || expiresAt <= now) {
          // Session expirée (token statique 1h, autoRefreshToken désactivé —
          // cf. lib/supabase.ts) : on tente un rafraîchissement REST direct
          // avant de déconnecter. C'est ce qui évitait auparavant TOUTE
          // reconnexion automatique après 1h d'inactivité de l'app.
          const refreshToken = parsed.refresh_token as string | undefined;
          if (refreshToken) {
            console.log('[useAuth] BOOT — session expirée, tentative de rafraîchissement');
            const result = await refreshSession();
            const userId = parsed.user?.id as string | undefined;
            if (result === 'ok') {
              if (userId && !cancelled) {
                const profile = await fetchProfile(userId);
                if (!cancelled && profile) setState((s) => ({ ...s, profile }));
              }
              return;
            }
            if (result === 'network' && userId) {
              // Coupure réseau / 4G faible (ex. dans la boutique) : on NE
              // déconnecte PAS. On garde la session pour que le QR fidélité
              // (qui n'a besoin que de l'id client) reste affichable, et on
              // réessaie en arrière-plan jusqu'à ce que le réseau revienne.
              console.log('[useAuth] BOOT — réseau indisponible, session conservée');
              if (!cancelled) {
                setState({
                  status: 'authenticated',
                  session: {
                    access_token: parsed.access_token,
                    refresh_token: refreshToken,
                    expires_in: parsed.expires_in ?? 3600,
                    expires_at: parsed.expires_at,
                    token_type: parsed.token_type ?? 'bearer',
                    user: parsed.user,
                  } as Session,
                  profile: readCachedProfile(userId),
                  email: parsed.user?.email ?? null,
                  inPasswordRecovery: false,
                });
              }
              const retry = async () => {
                if (cancelled) return;
                const r = await refreshSession();
                if (cancelled) return;
                if (r === 'ok') {
                  const profile = await fetchProfile(userId);
                  if (!cancelled && profile) setState((s) => ({ ...s, profile }));
                } else if (r === 'network') {
                  bootRetry = window.setTimeout(retry, 20000);
                } else {
                  window.localStorage.removeItem(key);
                  setState({ status: 'anonymous', session: null, profile: null, email: null, inPasswordRecovery: false });
                }
              };
              bootRetry = window.setTimeout(retry, 15000);
              return;
            }
          }
          console.log('[useAuth] BOOT — rafraîchissement impossible, déconnexion');
          window.localStorage.removeItem(key);
          setState({
            status: 'anonymous',
            session: null,
            profile: null,
            email: null,
            inPasswordRecovery: false,
          });
          return;
        }

        // Session VALIDE → on set le state IMMÉDIATEMENT (état authenticated)
        // pour que l'UI affiche le compte tout de suite. fetchProfile est
        // chargé en arrière-plan sans bloquer l'affichage.
        console.log('[useAuth] BOOT — session valide, état authenticated (instant)');
        const fakeSession = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          expires_in: parsed.expires_in ?? 3600,
          expires_at: parsed.expires_at,
          token_type: parsed.token_type ?? 'bearer',
          user: parsed.user,
        } as Session;

        // Set state immédiat avec le DERNIER PROFIL CONNU (solde XP affiché
        // tout de suite, même sans réseau) — UI montre "Mon compte" direct
        const userId = parsed.user?.id;
        if (!cancelled) {
          setState({
            status: 'authenticated',
            session: fakeSession,
            profile: readCachedProfile(userId),
            email: parsed.user?.email ?? null,
            inPasswordRecovery: false,
          });
        }

        // Profil serveur en arrière-plan : remplace le cache DÈS qu'il arrive,
        // même lentement (avant : ignoré après 1,5 s → 0 XP en 4G faible).
        if (userId) {
          fetchProfile(userId).then((profile) => {
            if (cancelled || !profile) return;
            setState((s) => ({ ...s, profile }));
          });
        }
      } catch (e) {
        console.error('[useAuth] BOOT failed:', e);
        if (!cancelled) {
          setState({
            status: 'anonymous',
            session: null,
            profile: null,
            email: null,
            inPasswordRecovery: false,
          });
        }
      }
    })();

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
      const profile = (await fetchProfile(session.user.id)) ?? readCachedProfile(session.user.id);
      if (cancelled) return;
      // (La bienvenue est déclenchée dans fetchProfile si welcome_sent=false.)
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
      if (bootRetry) window.clearTimeout(bootRetry);
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile, refreshSession]);

  // Rafraîchit la session AVANT expiration tant que l'app reste ouverte
  // (remplace autoRefreshToken, désactivé — cf. lib/supabase.ts). Sans ça,
  // toute session mourait exactement 1h après connexion, sans exception :
  // c'était la déconnexion « systématique » observée en usage réel.
  // + au retour au premier plan : iOS met les minuteries en pause quand l'app
  // est en arrière-plan, donc le jeton est souvent périmé à la réouverture.
  useEffect(() => {
    const readStored = (): any => {
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!envUrl) return null;
      try {
        const projectRef = envUrl.replace(/^https?:\/\//, '').split('.')[0];
        return JSON.parse(window.localStorage.getItem(`sb-${projectRef}-auth-token`) || 'null');
      } catch {
        return null;
      }
    };
    const refreshIfNeeded = async (reloadProfile: boolean) => {
      const parsed = readStored();
      const expiresAt = parsed?.expires_at as number | undefined;
      if (!expiresAt || !parsed?.refresh_token) return;
      const now = Math.floor(Date.now() / 1000);
      // Rafraîchit dès qu'il reste moins de 10 min avant expiration —
      // l'utilisateur ne voit jamais la session mourir en cours d'usage.
      if (expiresAt - now < 600) {
        const r = await refreshSession();
        if (r === 'invalid') return;
      }
      // Retour dans l'app : recharge le profil (solde XP à jour après un scan
      // au comptoir, sans avoir à relancer l'app).
      const userId = parsed?.user?.id as string | undefined;
      if (reloadProfile && userId) {
        const profile = await fetchProfile(userId);
        if (profile) setState((s) => (s.status === 'authenticated' ? { ...s, profile } : s));
      }
    };
    const interval = window.setInterval(() => void refreshIfNeeded(false), 4 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshIfNeeded(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshSession, fetchProfile]);

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
            // Délai minimal pour flush storage iOS PWA, puis reload
            window.setTimeout(() => window.location.reload(), 80);
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

  // Re-fetch le profil (après crédit/réclamation XP) pour rafraîchir l'affichage
  const refreshProfile = useCallback(async () => {
    const uid = state.session?.user?.id;
    if (!uid) return;
    const p = await fetchProfile(uid);
    if (p) setState((s) => ({ ...s, profile: p }));
  }, [state.session, fetchProfile]);

  const signOut = useCallback(async () => {
    clearCachedProfile();
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // Bypass supabase.from() qui hang iOS PWA — passe par REST PostgREST direct
  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, 'first_name' | 'birthday'>>) => {
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!envUrl || !anonKey || !state.session)
        return { ok: false, error: 'Non authentifié' };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const resp = await fetch(
          `${envUrl}/rest/v1/profiles?id=eq.${state.session.user.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: anonKey,
              Authorization: `Bearer ${state.session.access_token}`,
              Prefer: 'return=representation',
            },
            body: JSON.stringify(patch),
            signal: controller.signal,
          },
        );
        clearTimeout(timeoutId);

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          return { ok: false, error: data?.message || `HTTP ${resp.status}` };
        }

        const rows = (await resp.json()) as Profile[];
        const updated = rows?.[0];
        if (updated) setState((s) => ({ ...s, profile: updated }));
        return { ok: true };
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (e?.name === 'AbortError') {
          return { ok: false, error: 'Délai dépassé — réessaie' };
        }
        return { ok: false, error: e?.message ?? 'Erreur réseau' };
      }
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
    refreshProfile,
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
