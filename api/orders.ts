// Route consolidée orders (limite 12 functions Vercel Hobby)
// Dispatch selon ?action=
//
// GET  ?action=list           → liste les commandes du user authentifié (Bearer Supabase JWT)
// GET  ?action=today          → liste des commandes paid + pending_cash 12h (admin)
// POST ?action=create-pending → crée une order pending_cash
// POST ?action=mark-paid      → marque pending_cash → paid (+XP) (admin)
// POST ?action=update-status  → change le status (admin)

import { randomUUID } from 'node:crypto';

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

// Notifie les admins (push) d'une nouvelle commande. 100% gardé : toute erreur
// ici ne doit jamais empêcher la création de la commande.
async function notifyAdminsNewOrder(admin: any, title: string, body: string): Promise<void> {
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return;

  const adminEmails = String(process.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return;

  const { data: admins } = await admin.from('profiles').select('id').in('email', adminEmails);
  const adminIds = (admins ?? []).map((a: any) => a.id);
  if (adminIds.length === 0) return;

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .in('user_id', adminIds);
  if (!subs || subs.length === 0) return;

  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({ title, body, url: '/console.html', tag: 'labase-admin-order' });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
    } catch {
      /* abonnement mort : on ignore */
    }
  }
}

const ALLOWED_STATUSES = ['paid', 'preparing', 'ready', 'cancelled', 'refunded'];

async function readBody(req: any): Promise<any> {
  if (typeof req.body === 'object' && req.body !== null) return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function getActionFromQuery(req: any): string | null {
  if (typeof req.query?.action === 'string') return req.query.action;
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get('action');
}

function requireAdmin(req: any): boolean {
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = req.headers?.authorization ?? '';
  const provided = authHeader.replace(/^Bearer\s+/, '').trim();
  return provided === expectedPassword;
}

async function getSupabaseClients() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return {
    public: anonKey ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } }) : null,
    admin: createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

export default async function handler(req: any, res: any) {
  const action = getActionFromQuery(req);
  if (!action) return res.status(400).json({ error: 'action requise' });

  const clients = await getSupabaseClients();
  if (!clients) return res.status(500).json({ error: 'Supabase non configuré' });

  // ─── GET ?action=list ────────────────────────────────────────
  if (action === 'list' && req.method === 'GET') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });

    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });

    const { data, error } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, created_at, paid_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data ?? [] });
  }

  // ─── GET ?action=last-order (CLIENT, JWT) : dernière commande + articles ───
  // Sert au bouton "Recommander" (Order Again). On renvoie la commande la plus
  // récente QUI A des lignes (les ventes Square pures n'ont pas de lignes).
  if (action === 'last-order' && req.method === 'GET') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });

    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });

    const { data: orders } = await clients.admin
      .from('orders')
      .select('id, total_cents, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const o of orders ?? []) {
      const { data: items } = await clients.admin
        .from('order_items')
        .select('product_name, option_label, category_name, quantity, unit_price_cents')
        .eq('order_id', o.id);
      if (items && items.length) {
        return res.status(200).json({ order: o, items });
      }
    }
    return res.status(200).json({ order: null, items: [] });
  }

  // ─── GET ?action=today ─────────────────────────────────────────
  if (action === 'today' && req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });

    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: paidData, error: paidErr } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method')
      .gte('paid_at', since)
      .in('status', ['paid', 'preparing', 'ready'])
      .order('paid_at', { ascending: false })
      .limit(50);

    const { data: pendingCashData, error: pendingErr } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method')
      .eq('status', 'pending_cash')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    const error = paidErr || pendingErr;
    if (error) return res.status(500).json({ error: error.message });

    const data = [...(pendingCashData ?? []), ...(paidData ?? [])];

    // Joindre le détail des articles (pour savoir quoi préparer au comptoir).
    // Les commandes Square (webhook) n'ont pas de lignes -> items vide, normal.
    const orderIds = data.map((o: any) => o.id);
    const itemsByOrder: Record<string, any[]> = {};
    if (orderIds.length > 0) {
      const { data: items } = await clients.admin
        .from('order_items')
        .select('order_id, product_name, option_label, category_name, quantity, unit_price_cents')
        .in('order_id', orderIds);
      for (const it of items ?? []) {
        (itemsByOrder[it.order_id] ||= []).push(it);
      }
    }
    const withItems = data.map((o: any) => ({ ...o, items: itemsByOrder[o.id] ?? [] }));
    return res.status(200).json({ orders: withItems });
  }

  // ─── POST ?action=create-pending ─────────────────────────────
  if (action === 'create-pending' && req.method === 'POST') {
    const body = await readBody(req);
    const cart: any[] = Array.isArray(body?.cart) ? body.cart : [];
    if (cart.length === 0) return res.status(400).json({ error: 'Panier vide' });

    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : null;
    const pickupTime = typeof body?.pickupTime === 'string' ? body.pickupTime : null;
    const userEmail = typeof body?.userEmail === 'string' ? body.userEmail.trim().toLowerCase() : null;

    const totalCents = cart.reduce((sum, item) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPriceCents || 0);
      return sum + qty * unit;
    }, 0);
    if (totalCents <= 0) return res.status(400).json({ error: 'Total invalide' });

    let userId: string | null = null;
    if (userEmail) {
      const { data: profile } = await clients.admin
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (profile?.id) userId = profile.id;
    }

    const shortCode = String(Math.floor(1000 + Math.random() * 9000));
    const orderId = randomUUID();

    const { error: orderError } = await clients.admin.from('orders').insert({
      id: orderId,
      user_id: userId,
      square_order_id: `CASH-${shortCode}`,
      status: 'pending_cash',
      payment_method: 'cash',
      total_cents: totalCents,
      customer_name: customerName,
      pickup_time: pickupTime,
      created_at: new Date().toISOString(),
    });

    if (orderError) return res.status(500).json({ error: 'Échec création', details: orderError.message });

    const itemsToInsert = cart.map((item) => {
      const extrasLabel = Array.isArray(item.extras) && item.extras.length > 0
        ? ` + ${item.extras.join(', ')}` : '';
      return {
        order_id: orderId,
        product_name: `${item.name ?? ''}${extrasLabel}`,
        option_label: item.option ?? null,
        category_name: item.categoryName ?? null,
        quantity: Number(item.quantity || 1),
        unit_price_cents: Number(item.unitPriceCents || 0),
      };
    });
    await clients.admin.from('order_items').insert(itemsToInsert);

    // Notifie les admins : nouvelle commande espèces à préparer (gardé)
    try {
      const euros = (totalCents / 100).toFixed(2).replace('.', ',');
      await notifyAdminsNewOrder(
        clients.admin,
        '🛎️ Nouvelle commande (espèces)',
        `${customerName || 'Client'} · ${euros}€ · code ${shortCode}${pickupTime ? ` · retrait ${pickupTime}` : ''}`,
      );
    } catch (err: any) {
      console.warn('[create-pending] admin notify failed:', err?.message);
    }

    return res.status(200).json({ ok: true, orderId, code: shortCode, totalCents });
  }

  // ─── POST ?action=mark-paid (admin, crédite XP) ──────────────
  if (action === 'mark-paid' && req.method === 'POST') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
    const body = await readBody(req);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
    if (!orderId) return res.status(400).json({ error: 'orderId requis' });

    const { data: order, error: orderError } = await clients.admin
      .from('orders')
      .select('id, user_id, status, total_cents')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order non trouvée' });
    if (order.status === 'paid') return res.status(200).json({ ok: true, alreadyPaid: true });

    await clients.admin
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId);

    if (order.user_id) {
      const { data: profile } = await clients.admin
        .from('profiles')
        .select('total_spent_cents, total_orders, xp, referred_by, referral_rewarded')
        .eq('id', order.user_id)
        .single();
      if (profile) {
        const isFirstOrder = profile.total_orders === 0;
        const eurosSpent = Math.floor(order.total_cents / 100);
        // Mardi Double XP (cohérent avec le webhook Square carte)
        const isTuesday = new Date().getUTCDay() === 2;
        const xpGained = eurosSpent * 10 * (isTuesday ? 2 : 1) + 50 + (isFirstOrder ? 200 : 0);
        const newTotalSpent = profile.total_spent_cents + order.total_cents;
        const newTotalOrders = profile.total_orders + 1;
        const newXp = profile.xp + xpGained;
        await clients.admin
          .from('profiles')
          .update({
            total_spent_cents: newTotalSpent,
            total_orders: newTotalOrders,
            xp: newXp,
            vip_tier: computeVipTier(newTotalSpent),
            level: computeMascotteLevel(newXp),
          })
          .eq('id', order.user_id);

        // Récompense parrainage à la 1ère commande payée (gardé)
        if (isFirstOrder && profile.referred_by && !profile.referral_rewarded) {
          try {
            const { data: sponsor } = await clients.admin
              .from('profiles')
              .select('xp')
              .eq('id', profile.referred_by)
              .single();
            if (sponsor) {
              await clients.admin
                .from('profiles')
                .update({ xp: (sponsor.xp ?? 0) + 500 })
                .eq('id', profile.referred_by);
              await clients.admin
                .from('profiles')
                .update({ referral_rewarded: true })
                .eq('id', order.user_id);
            }
          } catch (err: any) {
            console.warn('[mark-paid] referral reward failed:', err?.message);
          }
        }

        return res.status(200).json({ ok: true, xpGained, newTotalSpent });
      }
    }
    return res.status(200).json({ ok: true, anonymous: true });
  }

  // ─── POST ?action=update-status (admin) ───────────────────────
  if (action === 'update-status' && req.method === 'POST') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
    const body = await readBody(req);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
    const status = typeof body?.status === 'string' ? body.status : null;
    if (!orderId || !status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'orderId + status valides requis' });
    }
    const { data, error } = await clients.admin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, order: data });
  }

  // ─── POST ?action=claim-reward (CLIENT, auth JWT) ─────────────────
  // Le client réclame un cadeau du catalogue avec SES XP (depuis le panier).
  // Authentifié par son token Supabase (pas le mdp admin) → ne peut déduire
  // que ses propres XP. Catalogue serveur = source de vérité (anti-triche).
  // GARDER SYNCHRO avec src/v2/rewards/catalog.ts.
  if (action === 'claim-reward' && req.method === 'POST') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });

    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });
    const userId = userData.user.id;

    const REWARDS: Record<string, { cost: number; label: string }> = {
      topping: { cost: 250, label: 'Topping offert' },
      boisson: { cost: 800, label: 'Une boisson au choix' },
      'combo-gaufre': { cost: 1500, label: 'Boisson + gaufre healthy' },
      'cadeau-mois': { cost: 2500, label: 'Cadeau du mois' },
    };
    const body = await readBody(req);
    const rewardId = typeof body?.rewardId === 'string' ? body.rewardId : null;
    const reward = rewardId ? REWARDS[rewardId] : null;
    if (!reward) return res.status(400).json({ error: 'Cadeau inconnu' });

    const { data: profile, error: pErr } = await clients.admin
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    if (pErr || !profile) return res.status(404).json({ error: 'Profil non trouvé' });
    if (profile.xp < reward.cost) {
      return res.status(400).json({ error: `XP insuffisants (${profile.xp}/${reward.cost})` });
    }

    const newXp = profile.xp - reward.cost;
    const { error: uErr } = await clients.admin
      .from('profiles')
      .update({ xp: newXp, level: computeMascotteLevel(newXp) })
      .eq('id', userId);
    if (uErr) return res.status(500).json({ error: uErr.message });

    await clients.admin.from('reward_redemptions').insert({
      user_id: userId,
      reward_id: rewardId,
      reward_label: reward.label,
      xp_cost: reward.cost,
      source: 'panier',
    });

    return res.status(200).json({ ok: true, rewardLabel: reward.label, cost: reward.cost, newXp });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
