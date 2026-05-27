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
