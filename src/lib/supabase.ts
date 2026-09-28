// Client Supabase singleton — utilisé côté front uniquement (anon key)
// Les opérations sensibles (webhook Square, envoi de push) devront passer
// par des API routes Vercel ou Edge Functions Supabase avec la service_role.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

/**
 * Retourne le client Supabase, ou null si les variables d'env sont absentes.
 * Permet de coder des composants qui dégradent gracieusement sans Supabase
 * (utile en dev local sans .env.local, ou si Vercel n'est pas configuré).
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !anonKey) return null;

  // Clé de storage EXPLICITE — évite toute ambiguïté avec le default
  // dynamique de supabase-js qui dépend du hostname.
  const projectRef = url.replace(/^https?:\/\//, '').split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      // ⚠️ DÉSACTIVÉ : autoRefreshToken déclenche un appel /token?grant_type=refresh_token
      // au boot qui hang sur iOS PWA (même bug que setSession/verifyOtp). Tant que ce
      // bug persiste, on garde le token statique 1h max. Le user devra se reconnecter
      // après expiration. Acceptable vu la criticité.
      autoRefreshToken: false,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey,
    },
  });

  // Diagnostic visible dans la console pour traquer les sessions perdues
  if (typeof window !== 'undefined') {
    _client.auth.onAuthStateChange((event, session) => {
      console.log('[supabase auth]', event, session ? `user=${session.user.email}` : 'no session');
    });
    // Log d'erreur si le hash de magic link contient une erreur
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      console.error('[supabase auth] Magic link error in URL:', hash);
    }
  }

  return _client;
}

/**
 * Indique si Supabase est configuré (env vars présentes).
 * Utilisé pour activer/désactiver les features qui en dépendent
 * (compte VIP, XP, roue cadeau, push notifs, live tracking).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Lit la session directement depuis localStorage sans passer par
 * supabase.auth.getSession() qui hang sur iOS PWA (bug Web Lock
 * dans @supabase/auth-js v2.106). Retourne null si pas de session
 * valide.
 */
export function getStoredSession(): {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string };
  expires_at?: number;
} | null {
  if (!url || typeof window === 'undefined') return null;
  try {
    const projectRef = url.replace(/^https?:\/\//, '').split('.')[0];
    const raw = window.localStorage.getItem(`sb-${projectRef}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (parsed.expires_at && parsed.expires_at <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Rafraîchissement de session partagé (REST direct, sans Web Lock) ──
// Remplace autoRefreshToken (désactivé ci-dessus). Un seul rafraîchissement à
// la fois (« single-flight ») même si plusieurs écrans le demandent.
//   'ok'      → nouvelle session écrite en localStorage
//   'invalid' → refresh_token refusé par Supabase (400/401) : déconnexion justifiée
//   'network' → coupure / 4G faible / serveur indisponible : on GARDE la session
//               (le QR fidélité n'a besoin que de l'id client) et on réessaiera.
export type RefreshResult = 'ok' | 'invalid' | 'network';
export const SESSION_REFRESHED_EVENT = 'labase:session-refreshed';

function storageKey(): string | null {
  if (!url) return null;
  return `sb-${url.replace(/^https?:\/\//, '').split('.')[0]}-auth-token`;
}

let refreshInFlight: Promise<RefreshResult> | null = null;

export function refreshStoredSession(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async (): Promise<RefreshResult> => {
    const key = storageKey();
    if (!key || !anonKey || typeof window === 'undefined') return 'network';
    let refreshToken: string | undefined;
    try {
      refreshToken = JSON.parse(window.localStorage.getItem(key) || 'null')?.refresh_token;
    } catch {
      /* JSON corrompu */
    }
    if (!refreshToken) return 'invalid';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      });
      const data = await resp.json().catch(() => null);
      if (resp.status === 400 || resp.status === 401) return 'invalid';
      if (!resp.ok || !data?.access_token || !data?.refresh_token) return 'network';

      const sessionData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type || 'bearer',
        expires_in: data.expires_in,
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        user: data.user,
      };
      window.localStorage.setItem(key, JSON.stringify(sessionData));
      window.dispatchEvent(new CustomEvent(SESSION_REFRESHED_EVENT, { detail: sessionData }));
      return 'ok';
    } catch {
      return 'network';
    } finally {
      clearTimeout(timeoutId);
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/**
 * Comme getStoredSession(), mais rafraîchit d'abord le jeton s'il est expiré
 * ou expire dans moins de 2 min. À appeler avant chaque appel API authentifié
 * (roue, paiement, codes cadeaux…) : après une mise en veille iOS, le jeton
 * est souvent périmé alors que l'app affiche « connecté ».
 */
export async function getFreshSession(): Promise<ReturnType<typeof getStoredSession>> {
  const key = storageKey();
  if (!key || typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (!parsed?.refresh_token) return getStoredSession();
    const now = Math.floor(Date.now() / 1000);
    if (!parsed.expires_at || parsed.expires_at - now < 120) await refreshStoredSession();
  } catch {
    /* on retombe sur la lecture simple */
  }
  return getStoredSession();
}
