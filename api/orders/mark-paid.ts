// Marque une commande comme payée + crédite XP / recalcule VIP tier
// POST /api/orders/mark-paid
// Headers : Authorization: Bearer <ADMIN_PUSH_PASSWORD>
// Body : { orderId: string }
//
// Logique XP synchrone avec le webhook Square :
// +10 XP par € + 50 XP par commande + 200 XP si 1ère commande

const VIP_TIERS = [
  { id: 'starter', minSpentCents: 0 },
  { id: 'regulier', minSpentCents: 5000 },
  { id: 'vip', minSpentCents: 15000 },
  { id: 'elite', minSpentCents: 40000 },
  { id: 'legende', minSpentCents: 80000 },
];

function computeVipTier(totalSpentCents: number): string {
  let tier = 'starter';
  for (const t of VIP_TIERS) {
    if (totalSpentCents >= t.minSpentCents) tier = t.id;
  }
  return tier;
}

function computeMascotteLevel(xp: number): string {
  if (xp >= 1500) return 'pro';
  if (xp >= 500) return 'regulier';
  return 'apprenti';
}

async function readBody(req: any): Promise<any> {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
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

  const body = await readBody(req);
  const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId requis' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Récupère l'order
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('id, user_id, status, total_cents')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: 'Order non trouvée' });
  }

  if (order.status === 'paid') {
    return res.status(200).json({ ok: true, alreadyPaid: true });
  }

  // Mark as paid
  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', orderId);

  if (updateError) {
    return res.status(500).json({ error: 'Échec update', details: updateError.message });
  }

  // Crédit XP si user identifié
  if (order.user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('total_spent_cents, total_orders, xp')
      .eq('id', order.user_id)
      .single();

    if (profile) {
      const isFirstOrder = profile.total_orders === 0;
      const eurosSpent = Math.floor(order.total_cents / 100);
      const xpGained = eurosSpent * 10 + 50 + (isFirstOrder ? 200 : 0);

      const newTotalSpent = profile.total_spent_cents + order.total_cents;
      const newTotalOrders = profile.total_orders + 1;
      const newXp = profile.xp + xpGained;

      await admin
        .from('profiles')
        .update({
          total_spent_cents: newTotalSpent,
          total_orders: newTotalOrders,
          xp: newXp,
          vip_tier: computeVipTier(newTotalSpent),
          level: computeMascotteLevel(newXp),
        })
        .eq('id', order.user_id);

      return res.status(200).json({
        ok: true,
        orderId,
        xpGained,
        newTotalSpent,
      });
    }
  }

  return res.status(200).json({ ok: true, orderId, anonymous: true });
}
