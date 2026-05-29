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
    const isCombo = body?.combo === true;
    const eurosSpent = Math.floor(amountCents / 100);
    // Mardi Double XP (jour creux → ramène du monde). getUTCDay: 2 = mardi.
    // Le bar opère en journée → UTC = même jour qu'à Paris, fiable.
    const isTuesday = new Date().getUTCDay() === 2;
    const xpFromEuros = eurosSpent * 10 * (isTuesday ? 2 : 1);
    const comboBonus = isCombo ? 25 : 0;
    const xpGained = xpFromEuros + 50 + comboBonus + (isFirstOrder ? 200 : 0);

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

    // Journalise le cadeau offert (suivi stock, séparé du CA Square)
    const source = typeof body?.source === 'string' ? body.source : 'comptoir';
    await admin.from('reward_redemptions').insert({
      user_id: userId,
      reward_id: rewardId,
      reward_label: reward.label,
      xp_cost: reward.cost,
      source,
    });

    return res.status(200).json({ ok: true, rewardLabel: reward.label, cost: reward.cost, newXp });
  }

  // ─── GET ?action=redemptions-summary (récap cadeaux offerts pour la console) ───
  if (action === 'redemptions-summary' && req.method === 'GET') {
    // Bornes : début du jour et début du mois (UTC, suffisant pour un récap)
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const { data: rows, error } = await admin
      .from('reward_redemptions')
      .select('reward_id, reward_label, xp_cost, created_at')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const all = rows ?? [];
    const today = all.filter((r) => r.created_at >= startOfDay);

    function tally(list: typeof all) {
      const byType: Record<string, { label: string; count: number; xp: number }> = {};
      let totalXp = 0;
      for (const r of list) {
        if (!byType[r.reward_id]) byType[r.reward_id] = { label: r.reward_label, count: 0, xp: 0 };
        byType[r.reward_id].count += 1;
        byType[r.reward_id].xp += r.xp_cost;
        totalXp += r.xp_cost;
      }
      return { total: list.length, totalXp, byType: Object.values(byType) };
    }

    return res.status(200).json({ today: tally(today), month: tally(all) });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
