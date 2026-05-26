// Liste des récompenses actives (codes promo gagnés à la roue) du user.
// GET /api/rewards/active (Bearer token Supabase)
// Renvoie [{ id, code, label, reward_type, reward_value, expires_at }]
//
// Dynamic import @supabase/supabase-js pour éviter le piège ESM/CJS Vercel.

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const authHeader = req.headers?.authorization ?? '';
  const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
  if (!accessToken) return res.status(401).json({ error: 'Auth requise' });

  const { createClient } = await import('@supabase/supabase-js');

  // Auth check via JWT
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await publicClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  // Admin client pour requêter sans soucis de RLS
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('wheel_spins')
    .select('id, reward_code, reward_label, reward_type, reward_value, expires_at, spun_at')
    .eq('user_id', userData.user.id)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .neq('reward_type', 'retry')
    .order('spun_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Erreur fetch', details: error.message });
  }

  return res.status(200).json({ rewards: data ?? [] });
}
