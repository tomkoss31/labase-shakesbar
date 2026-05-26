// Liste les commandes du user authentifié (10 dernières, plus récentes en premier)
// GET /api/orders/list (Bearer token Supabase)

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

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await publicClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin
    .from('orders')
    .select('id, square_order_id, status, total_cents, customer_name, pickup_time, created_at, paid_at')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return res.status(500).json({ error: 'Erreur fetch', details: error.message });
  }

  return res.status(200).json({ orders: data ?? [] });
}
