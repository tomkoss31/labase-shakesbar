// Liste les commandes du jour pour le comptoir
// GET /api/orders/today
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

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Commandes payées des 12 dernières heures
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // Récupère orders payées des 12h + toutes les pending_cash en attente
  const { data: paidData, error: paidErr } = await admin
    .from('orders')
    .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method')
    .gte('paid_at', since)
    .in('status', ['paid', 'preparing', 'ready'])
    .order('paid_at', { ascending: false })
    .limit(50);

  const { data: pendingCashData, error: pendingErr } = await admin
    .from('orders')
    .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method')
    .eq('status', 'pending_cash')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);

  const error = paidErr || pendingErr;
  const data = [...(pendingCashData ?? []), ...(paidData ?? [])];

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ orders: data ?? [] });
}
