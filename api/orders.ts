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
    return res.status(200).json({ orders: data });
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

  return res.status(400).json({ error: 'Action non reconnue' });
}
