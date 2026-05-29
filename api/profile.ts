// Route consolidée profile (admin)
// GET  ?action=lookup&id=<uuid> → récupère un profil + rewards actifs
// POST ?action=credit-manual    → crédite XP après paiement caisse

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
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function getQuery(req: any, key: string): string | null {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get(key);
}

export default async function handler(req: any, res: any) {
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
  const authHeader = req.headers?.authorization ?? '';
  const provided = authHeader.replace(/^Bearer\s+/, '').trim();
  if (provided !== expectedPassword) return res.status(401).json({ error: 'Non autorisé' });

  const action = getQuery(req, 'action');
  if (!action) return res.status(400).json({ error: 'action requise' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase non configuré' });

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── GET ?action=lookup&id=<uuid> ─────────────────────────────
  if (action === 'lookup' && req.method === 'GET') {
    const userId = getQuery(req, 'id');
    if (!userId) return res.status(400).json({ error: 'id requis' });

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, first_name, vip_tier, xp, level, total_orders, total_spent_cents')
      .eq('id', userId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

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

  // ─── POST ?action=credit-manual ───────────────────────────────
  if (action === 'credit-manual' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const amountCents = Number(body?.amountCents);
    const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'square_pos';

    if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'userId + amountCents > 0 requis' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('total_spent_cents, total_orders, xp')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const nowIso = new Date().toISOString();
    await admin.from('orders').insert({
      user_id: userId,
      status: 'paid',
      payment_method: paymentMethod,
      total_cents: amountCents,
      paid_at: nowIso,
      created_at: nowIso,
    });

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

    return res.status(200).json({ ok: true, xpGained, newTotalSpent, newXp });
  }

  // ─── POST ?action=redeem-reward (admin déduit XP pour offrir un cadeau) ───
  // Catalogue serveur = source de vérité du coût (empêche un client de
  // tricher en envoyant un coût faux). Garder synchro avec
  // src/v2/rewards/catalog.ts côté front.
  if (action === 'redeem-reward' && req.method === 'POST') {
    const REWARDS: Record<string, { cost: number; label: string }> = {
      topping: { cost: 250, label: 'Topping offert' },
      boisson: { cost: 800, label: 'Une boisson au choix' },
      'combo-gaufre': { cost: 1500, label: 'Boisson + gaufre healthy' },
      'cadeau-mois': { cost: 2500, label: 'Cadeau du mois' },
    };

    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const rewardId = typeof body?.rewardId === 'string' ? body.rewardId : null;
    if (!userId || !rewardId) return res.status(400).json({ error: 'userId + rewardId requis' });

    const reward = REWARDS[rewardId];
    if (!reward) return res.status(400).json({ error: 'Cadeau inconnu' });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    if (profile.xp < reward.cost) {
      return res.status(400).json({ error: `XP insuffisants (${profile.xp}/${reward.cost})` });
    }

    const newXp = profile.xp - reward.cost;
    const { error: updateError } = await admin
      .from('profiles')
      .update({ xp: newXp, level: computeMascotteLevel(newXp) })
      .eq('id', userId);
    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.status(200).json({ ok: true, rewardLabel: reward.label, cost: reward.cost, newXp });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
