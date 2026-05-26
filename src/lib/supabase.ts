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

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // pour le magic link
    },
  });

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
