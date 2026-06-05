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
  const action = getQuery(req, 'action');
  if (!action) return res.status(400).json({ error: 'action requise' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase non configuré' });

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ════ ACTIONS PUBLIQUES (avant la barrière admin) ════

  // ─── GET ?action=get-settings (statut magasin, lu par l'app cliente) ───
  if (action === 'get-settings' && req.method === 'GET') {
    const { data } = await admin
      .from('store_settings')
      .select('override_mode, hours')
      .eq('id', 1)
      .maybeSingle();
    return res.status(200).json({
      override_mode: data?.override_mode ?? 'auto',
      hours: data?.hours ?? null,
    });
  }

  // ─── GET ?action=referral-stats (CLIENT, auth JWT) ────────────
  // Renvoie le code de parrainage du client + nb de filleuls / validés.
  if (action === 'referral-stats' && req.method === 'GET') {
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });

    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const uid = userData.user.id;

    const { data: me } = await admin
      .from('profiles')
      .select('referral_code')
      .eq('id', uid)
      .maybeSingle();

    const { count: filleuls } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', uid);

    const { count: rewarded } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', uid)
      .eq('referral_rewarded', true);

    return res.status(200).json({
      code: me?.referral_code ?? null,
      filleuls: filleuls ?? 0,
      rewarded: rewarded ?? 0,
    });
  }

  // ════ BARRIÈRE ADMIN (mot de passe) pour toutes les actions suivantes ════
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
  const adminAuthHeader = req.headers?.authorization ?? '';
  const adminProvided = adminAuthHeader.replace(/^Bearer\s+/, '').trim();
  if (adminProvided !== expectedPassword) return res.status(401).json({ error: 'Non autorisé' });

  // ─── POST ?action=set-settings (admin : pilote l'ouverture) ───
  if (action === 'set-settings' && req.method === 'POST') {
    const body = await readBody(req);
    const mode = typeof body?.override_mode === 'string' ? body.override_mode : null;
    if (!mode || !['auto', 'force_open', 'force_closed'].includes(mode)) {
      return res.status(400).json({ error: 'override_mode invalide' });
    }
    const { error } = await admin
      .from('store_settings')
      .update({ override_mode: mode, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, override_mode: mode });
  }

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
  // Encaisse une vente Square caisse + crédit XP.
  // Optionnel : wheelSpinId → marque le code promo comme utilisé
  // ATOMIQUEMENT avec la vente (pas de marquage si l'encaissement plante).
  if (action === 'credit-manual' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const amountCents = Number(body?.amountCents);
    const paymentMethod = typeof body?.paymentMethod === 'string' ? body.paymentMethod : 'square_pos';
    const wheelSpinId = typeof body?.wheelSpinId === 'string' && body.wheelSpinId
      ? body.wheelSpinId
      : null;
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 120) : '';

    if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'userId + amountCents > 0 requis' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('total_spent_cents, total_orders, xp, first_name, email')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    // Si un code promo est passé : vérifier qu'il est valide (appartient au
    // client, non utilisé, non expiré) AVANT d'encaisser. Évite de marquer un
    // code utilisé qui ne l'était pas, et évite l'attaque "wheelSpinId d'un
    // autre client".
    let validatedSpin: { id: string; reward_code: string; reward_label: string } | null = null;
    if (wheelSpinId) {
      const nowIso = new Date().toISOString();
      const { data: spin } = await admin
        .from('wheel_spins')
        .select('id, reward_code, reward_label, used_at, expires_at, user_id')
        .eq('id', wheelSpinId)
        .maybeSingle();
      if (!spin) return res.status(400).json({ error: 'Code promo introuvable' });
      if (spin.user_id !== userId) return res.status(400).json({ error: 'Code promo ne correspond pas à ce client' });
      if (spin.used_at) return res.status(400).json({ error: 'Code déjà utilisé' });
      if (spin.expires_at && spin.expires_at <= nowIso) return res.status(400).json({ error: 'Code expiré' });
      validatedSpin = { id: spin.id, reward_code: spin.reward_code, reward_label: spin.reward_label };
    }

    const nowIso = new Date().toISOString();
    const { data: createdOrder } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'paid',
        payment_method: paymentMethod,
        total_cents: amountCents,
        customer_name: profile.first_name || profile.email || null,
        paid_at: nowIso,
        created_at: nowIso,
      })
      .select('id')
      .maybeSingle();

    // Note libre du comptoir (« 2 smoothies + gaufre ») → on la stocke comme
    // un order_item unique, ce qui la fait apparaître dans le détail de la
    // commande (sinon « Détail non dispo »). Best-effort, ne casse pas la vente.
    if (note && createdOrder?.id) {
      try {
        await admin.from('order_items').insert({
          order_id: createdOrder.id,
          product_name: note,
          quantity: 1,
          unit_price_cents: amountCents,
        });
      } catch { /* non bloquant */ }
    }

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

    // Marquer le code promo comme utilisé MAINTENANT (après la vente OK).
    // Si ça plante ici, on log mais on ne casse pas la réponse — la vente
    // est passée, le code reste actif (le client peut le réutiliser une fois,
    // c'est moins grave qu'une vente refusée).
    let rewardUsed: { code: string; label: string } | null = null;
    if (validatedSpin) {
      const { error: markErr } = await admin
        .from('wheel_spins')
        .update({ used_at: nowIso, used_in_order_id: createdOrder?.id ?? null })
        .eq('id', validatedSpin.id)
        .is('used_at', null); // double-check anti race condition
      if (markErr) {
        console.warn('[credit-manual] mark-used failed:', markErr.message);
      } else {
        rewardUsed = { code: validatedSpin.reward_code, label: validatedSpin.reward_label };
      }
    }

    return res.status(200).json({ ok: true, xpGained, newTotalSpent, newXp, rewardUsed });
  }

  // ─── POST ?action=credit-xp-manual ────────────────────────────
  // Crédit XP direct sans vente (migration carte fidélité papier).
  // Ne touche PAS total_spent_cents / total_orders : c'est pas une vente.
  // Trace dans xp_manual_credits avec la raison libre saisie par l'admin.
  if (action === 'credit-xp-manual' && req.method === 'POST') {
    const body = await readBody(req);
    const userId = typeof body?.userId === 'string' ? body.userId : null;
    const xpAmount = Number(body?.xpAmount);
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 280) : '';

    if (!userId) return res.status(400).json({ error: 'userId requis' });
    if (!Number.isFinite(xpAmount) || xpAmount <= 0 || xpAmount > 100000) {
      return res.status(400).json({ error: 'XP invalide (1 à 100000)' });
    }
    if (!reason || reason.length < 3) {
      return res.status(400).json({ error: 'Raison requise (3 caractères min)' });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (profileError || !profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const newXp = profile.xp + Math.floor(xpAmount);

    const { error: updateError } = await admin
      .from('profiles')
      .update({ xp: newXp, level: computeMascotteLevel(newXp) })
      .eq('id', userId);
    if (updateError) return res.status(500).json({ error: updateError.message });

    // Log la trace même si l'insert échoue (table absente sur prod p.ex.) :
    // l'XP a été crédité, on ne reverse pas pour un log raté.
    const { error: logError } = await admin.from('xp_manual_credits').insert({
      user_id: userId,
      xp_added: Math.floor(xpAmount),
      reason,
      source: 'console_admin',
    });
    if (logError) console.warn('[credit-xp-manual] log failed:', logError.message);

    return res.status(200).json({ ok: true, xpAdded: Math.floor(xpAmount), newXp });
  }

  // ─── POST ?action=redeem-reward (admin déduit XP pour offrir un cadeau) ───
  // Catalogue serveur = source de vérité du coût (empêche un client de
  // tricher en envoyant un coût faux). Garder synchro avec
  // src/v2/rewards/catalog.ts côté front.
  if (action === 'redeem-reward' && req.method === 'POST') {
    const REWARDS: Record<string, { cost: number; label: string }> = {
      boost: { cost: 100, label: 'Sirop / boost offert' },
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

    // ─── Cadeaux roue RÉELLEMENT donnés au comptoir (used_at) ───
    // Suivi stock à part : ces cadeaux ne passent pas par les XP, ils sont
    // gagnés à la roue puis remis au comptoir (used_at horodate la remise).
    const { data: wheelRows } = await admin
      .from('wheel_spins')
      .select('reward_label, reward_type, used_at')
      .gte('used_at', startOfMonth)
      .in('reward_type', ['free_product', 'manual_pickup'])
      .order('used_at', { ascending: false });

    const wheelAll = (wheelRows ?? []) as { reward_label: string; used_at: string }[];
    const wheelToday = wheelAll.filter((r) => r.used_at >= startOfDay);

    function wheelTally(list: typeof wheelAll) {
      const byType: Record<string, { label: string; count: number }> = {};
      for (const r of list) {
        if (!byType[r.reward_label]) byType[r.reward_label] = { label: r.reward_label, count: 0 };
        byType[r.reward_label].count += 1;
      }
      return { total: list.length, byType: Object.values(byType) };
    }

    return res.status(200).json({
      today: tally(today),
      month: tally(all),
      wheel: { today: wheelTally(wheelToday), month: wheelTally(wheelAll) },
    });
  }

  // ─── GET ?action=stats (dashboard admin : compteurs business) ───
  if (action === 'stats' && req.method === 'GET') {
    const countOf = async (table: string, filter?: (q: any) => any) => {
      let q = admin.from(table).select('id', { count: 'exact', head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count ?? 0;
    };

    const [members, publicPlayers, wheelSpins, pushSubs, redemptions, paidOrders] =
      await Promise.all([
        countOf('profiles'),
        countOf('public_spins'),
        countOf('wheel_spins'),
        countOf('push_subscriptions'),
        countOf('reward_redemptions'),
        countOf('orders', (q) => q.eq('status', 'paid')),
      ]);

    // CA encaissé (somme des commandes payées) — fetch léger
    const { data: paidRows } = await admin
      .from('orders')
      .select('total_cents')
      .eq('status', 'paid');
    const revenueCents = (paidRows ?? []).reduce((s: number, r: any) => s + (r.total_cents || 0), 0);

    // Nouveaux membres aujourd'hui
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const newToday = await countOf('profiles', (q) => q.gte('created_at', startOfDay));

    // Parrainage : filleuls rattachés + parrainages validés (1ère commande)
    const [referredTotal, referredRewarded] = await Promise.all([
      countOf('profiles', (q) => q.not('referred_by', 'is', null)),
      countOf('profiles', (q) => q.eq('referral_rewarded', true)),
    ]);

    return res.status(200).json({
      members,
      newToday,
      publicPlayers,
      wheelSpins,
      pushSubs,
      redemptions,
      paidOrders,
      revenueCents,
      referredTotal,
      referredRewarded,
    });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
