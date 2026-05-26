// Crédit XP manuel après un paiement Square caisse in-person
// POST /api/profile/credit-manual
// Headers : Authorization: Bearer <ADMIN_PUSH_PASSWORD>
// Body : { userId: string, amountCents: number, paymentMethod?: 'square_pos' | 'cash' }
//
// Crée une order paid + crédite XP comme un paiement normal.

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
  const userId = typeof body?.userId === 'string' ? body.userId : null;
  const amountCents = Number(body?.amountCents);
  const paymentMethod =
    typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'square_pos';

  if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) {
    return res.status(400).json({ error: 'userId + amountCents > 0 requis' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Récupère le profil
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('total_spent_cents, total_orders, xp')
    .eq('id', userId)
    .single();
  if (profileError || !profile) {
    return res.status(404).json({ error: 'Profil non trouvé' });
  }

  const nowIso = new Date().toISOString();

  // Insert order avec status='paid' (registre tracé pour historique client)
  await admin.from('orders').insert({
    user_id: userId,
    status: 'paid',
    payment_method: paymentMethod,
    total_cents: amountCents,
    paid_at: nowIso,
    created_at: nowIso,
  });

  // Crédit XP : +10/€ + 50/cmd + 200 si 1ère
  const isFirstOrder = profile.total_orders === 0;
  const eurosSpent = Math.floor(amountCents / 100);
  const xpGained = eurosSpent * 10 + 50 + (isFirstOrder ? 200 : 0);

  const newTotalSpent = profile.total_spent_cents + amountCents;
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
    .eq('id', userId);

  return res.status(200).json({
    ok: true,
    xpGained,
    newTotalSpent,
    newXp,
  });
}
