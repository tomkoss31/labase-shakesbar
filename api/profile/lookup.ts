// Récupère un profil par user_id (admin only)
// GET /api/profile/lookup?id=<user_id>
// Headers : Authorization: Bearer <ADMIN_PUSH_PASSWORD>

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedPassword = process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ADMIN_PUSH_PASSWORD non configuré' });
  }
  const authHeader = req.headers?.authorization ?? '';
  const provided = authHeader.replace(/^Bearer\s+/, '').trim();
  if (provided !== expectedPassword) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const userId =
    typeof req.query?.id === 'string'
      ? req.query.id
      : typeof (req.url || '').split('?')[1] === 'string'
        ? new URLSearchParams((req.url || '').split('?')[1]).get('id')
        : null;

  if (!userId) {
    return res.status(400).json({ error: 'id requis' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, email, first_name, vip_tier, xp, level, total_orders, total_spent_cents')
    .eq('id', userId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

  // Compter les rewards actifs (non utilisés non expirés)
  const nowIso = new Date().toISOString();
  const { data: rewards } = await admin
    .from('wheel_spins')
    .select('id, reward_code, reward_label, reward_type, reward_value, expires_at')
    .eq('user_id', userId)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .neq('reward_type', 'retry');

  return res.status(200).json({ profile, rewards: rewards ?? [] });
}
