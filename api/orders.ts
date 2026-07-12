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

// Notifie le CLIENT (push + boîte de réception) quand SA commande passe en
// préparation / prête — façon Uber Eats. Best-effort : aucune erreur ici ne
// doit empêcher la mise à jour du statut.
async function notifyCustomerStatus(
  admin: any,
  order: { user_id?: string | null; customer_name?: string | null } | null,
  status: string,
): Promise<void> {
  const userId = order?.user_id;
  if (!userId) return; // commande non liée à un compte → pas de destinataire

  const MESSAGES: Record<
    string,
    { emoji: string; title: string; body: (name: string) => string; urgent: boolean }
  > = {
    preparing: {
      emoji: '👨‍🍳',
      title: 'Ta commande est en préparation',
      body: (n) =>
        `${n ? n + ', on' : 'On'} prépare ta commande 🥤 On te prévient dès qu'elle est prête !`,
      urgent: false,
    },
    ready: {
      emoji: '✅',
      title: 'Ta commande est prête !',
      body: (n) => `${n ? n + ', ta' : 'Ta'} commande t'attend au comptoir. À tout de suite 🎉`,
      urgent: true,
    },
  };
  const msg = MESSAGES[status];
  if (!msg) return; // on ne notifie que preparing / ready

  const firstName = (order?.customer_name || '').trim().split(' ')[0] || '';
  const title = `${msg.emoji} ${msg.title}`;
  const body = msg.body(firstName);

  // 1) Archive dans la boîte de réception (persistant, multi-appareils) — même
  //    si la push échoue ou si le client n'a pas activé les notifications.
  try {
    await admin.from('user_notifications').insert({
      user_id: userId,
      title,
      body,
      url: '/',
      emoji: msg.emoji,
      kind: 'order',
    });
  } catch {
    /* best-effort */
  }

  // 2) Push web (si VAPID configuré + abonnements existants)
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return;

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return;

  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({
    title,
    body,
    url: '/',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'labase-order-status',
    requireInteraction: msg.urgent,
  });

  const expired: string[] = [];
  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
          payload,
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(sub.endpoint);
      }
    }),
  );
  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expired);
  }
}

// Lien avis Google (cf. src/data/menu.ts googleReviewUrl) + barème cadeaux
// (cf. claim-reward REWARDS) pour la deadline « prochain cadeau ».
const GOOGLE_REVIEW_URL = 'https://g.page/r/CeJabN1yW1toEAE/review';
const REWARD_TIERS = [
  { cost: 150, label: 'un boost offert' },
  { cost: 300, label: 'un topping offert' },
  { cost: 1500, label: 'une boisson offerte' },
  { cost: 2200, label: 'une boisson + gaufre' },
  { cost: 3800, label: 'le cadeau du mois' },
];

// Push « merci pour ta visite » ~à la fin d'un paiement : récap commande + XP
// gagnés + deadline prochain cadeau + lien avis Google EN ÉVIDENCE. Best-effort.
async function notifyThanks(
  admin: any,
  order: { id: string; user_id?: string | null } | null,
  opts: { xpTotal: number; xpGained: number; firstName?: string | null },
): Promise<void> {
  const userId = order?.user_id;
  if (!userId) return;

  const { data: items } = await admin
    .from('order_items')
    .select('product_name, quantity')
    .eq('order_id', order!.id);
  const recap = (items ?? [])
    .map((it: any) => `${it.quantity > 1 ? it.quantity + '× ' : ''}${it.product_name}`)
    .join(', ');

  const first = (opts.firstName || '').trim().split(' ')[0] || '';
  const next = REWARD_TIERS.find((t) => t.cost > opts.xpTotal);
  const xpLine = next
    ? `+${opts.xpGained} XP 🎉 Te voilà à ${opts.xpTotal} XP — plus que ${next.cost - opts.xpTotal} avant ${next.label} !`
    : `+${opts.xpGained} XP 🎉 Te voilà à ${opts.xpTotal} XP — tu peux tout débloquer 🎁`;

  const title = `💚 Merci${first ? ' ' + first : ''} pour ta visite !`;
  const body = `${recap ? 'Ta commande : ' + recap + '. ' : ''}${xpLine}  ⭐ Laisse-nous un avis, ça aide énormément le club !`;

  // 1) Boîte de réception (url = page d'avis → l'avis reste « en évidence »)
  try {
    await admin.from('user_notifications').insert({
      user_id: userId,
      title,
      body,
      url: GOOGLE_REVIEW_URL,
      emoji: '💚',
      kind: 'order',
    });
  } catch {
    /* best-effort */
  }

  // 2) Push web
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return;
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return;
  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const payload = JSON.stringify({
    title,
    body,
    url: GOOGLE_REVIEW_URL,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'labase-thanks',
    requireInteraction: false,
  });
  const expired: string[] = [];
  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
          payload,
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(sub.endpoint);
      }
    }),
  );
  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expired);
  }
}

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

function getQueryParam(req: any, key: string): string | null {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get(key);
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

  // ─── GET ?action=history (CLIENT, auth JWT) : historique + XP ─────────
  // Renvoie les 10 dernières commandes (avec articles + XP gagnés estimés) et
  // les 10 derniers cadeaux réclamés (XP dépensés). Sert l'écran « Mon historique ».
  if (action === 'history' && req.method === 'GET') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const accessToken = (req.headers?.authorization ?? '').replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });
    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });
    const uid = userData.user.id;

    const { data: orders } = await clients.admin
      .from('orders')
      .select('id, total_cents, status, payment_method, created_at, paid_at')
      .eq('user_id', uid)
      .in('status', ['paid', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(10);

    const orderIds = (orders ?? []).map((o: any) => o.id);
    const itemsByOrder: Record<string, any[]> = {};
    if (orderIds.length) {
      const { data: items } = await clients.admin
        .from('order_items')
        .select('order_id, product_name, option_label, quantity, unit_price_cents')
        .in('order_id', orderIds);
      for (const it of items ?? []) (itemsByOrder[it.order_id] ||= []).push(it);
    }
    const withItems = (orders ?? []).map((o: any) => ({
      ...o,
      items: itemsByOrder[o.id] ?? [],
      xpEstimate: Math.round((o.total_cents || 0) / 10) + 50,
    }));

    const { data: rewards } = await clients.admin
      .from('reward_redemptions')
      .select('reward_label, xp_cost, source, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.status(200).json({ orders: withItems, rewards: rewards ?? [] });
  }

  // ─── GET ?action=challenges (CLIENT, JWT) : défis de la semaine ───
  // Défis basés sur le nb de commandes payées de la semaine (lundi→). On
  // crédite les XP dès qu'un palier est atteint (1×/semaine via contrainte unique).
  if (action === 'challenges' && req.method === 'GET') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });
    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });
    const uid = userData.user.id;

    // Lundi 00:00 (heure de Paris) de la semaine courante
    const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const dow = parisNow.getDay(); // 0=dim..6=sam
    const toMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(parisNow);
    monday.setDate(parisNow.getDate() + toMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStartDate = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const weekStartIso = monday.toISOString();

    // Toutes les commandes payées (pour le compteur de la semaine ET la série)
    const { data: paidOrders } = await clients.admin
      .from('orders')
      .select('paid_at')
      .eq('user_id', uid)
      .eq('status', 'paid')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(500);

    const orderCount = (paidOrders ?? []).filter(
      (o: any) => o.paid_at && o.paid_at >= weekStartIso,
    ).length;

    // ── Série de visites (semaines consécutives avec ≥1 commande) ──
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const mondayOf = (iso: string) => {
      const p = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
      const dd = p.getDay();
      p.setDate(p.getDate() + (dd === 0 ? -6 : 1 - dd));
      p.setHours(0, 0, 0, 0);
      return ymd(p);
    };
    const weekSet = new Set((paidOrders ?? []).map((o: any) => mondayOf(o.paid_at)));
    let streak = 0;
    const cursor = new Date(monday);
    // Tolérance : si pas encore commandé cette semaine, on part de la semaine dernière
    if (!weekSet.has(ymd(cursor))) cursor.setDate(cursor.getDate() - 7);
    while (weekSet.has(ymd(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    }

    const DEFS = [
      { id: 'orders-2', title: '2 commandes cette semaine', goal: 2, xp: 100, emoji: '☕' },
      { id: 'orders-3', title: '3 commandes cette semaine', goal: 3, xp: 250, emoji: '🔥' },
    ];

    // Réclamations déjà faites cette semaine
    const { data: claims } = await clients.admin
      .from('challenge_claims')
      .select('challenge_id')
      .eq('user_id', uid)
      .eq('week_start', weekStartDate);
    const claimed = new Set((claims ?? []).map((c: any) => c.challenge_id));

    const out = [];
    for (const d of DEFS) {
      const completed = orderCount >= d.goal;
      let justAwarded = false;
      if (completed && !claimed.has(d.id)) {
        // Crédit gardé par la contrainte unique (anti double-crédit)
        const { error: insErr } = await clients.admin.from('challenge_claims').insert({
          user_id: uid,
          challenge_id: d.id,
          week_start: weekStartDate,
          xp_awarded: d.xp,
        });
        if (!insErr) {
          const { data: p } = await clients.admin.from('profiles').select('xp').eq('id', uid).single();
          if (p) await clients.admin.from('profiles').update({ xp: (p.xp ?? 0) + d.xp }).eq('id', uid);
          justAwarded = true;
          claimed.add(d.id);
        }
      }
      out.push({
        id: d.id,
        title: d.title,
        emoji: d.emoji,
        goal: d.goal,
        progress: Math.min(orderCount, d.goal),
        xp: d.xp,
        completed,
        claimed: claimed.has(d.id),
        justAwarded,
      });
    }

    // ── Paliers de série : bonus crédité une seule fois dans la vie ──
    // (sentinel week_start fixe → la contrainte unique garantit le once-ever)
    const STREAK_MILESTONES = [
      { id: 'streak-3', weeks: 3, xp: 150 },
      { id: 'streak-8', weeks: 8, xp: 500 },
    ];
    const STREAK_SENTINEL = '2000-01-01';
    const { data: sClaims } = await clients.admin
      .from('challenge_claims')
      .select('challenge_id')
      .eq('user_id', uid)
      .eq('week_start', STREAK_SENTINEL);
    const sClaimed = new Set((sClaims ?? []).map((c: any) => c.challenge_id));
    let streakBonus: { weeks: number; xp: number } | null = null;
    for (const m of STREAK_MILESTONES) {
      if (streak >= m.weeks && !sClaimed.has(m.id)) {
        const { error: insErr } = await clients.admin.from('challenge_claims').insert({
          user_id: uid,
          challenge_id: m.id,
          week_start: STREAK_SENTINEL,
          xp_awarded: m.xp,
        });
        if (!insErr) {
          const { data: p } = await clients.admin.from('profiles').select('xp').eq('id', uid).single();
          if (p) await clients.admin.from('profiles').update({ xp: (p.xp ?? 0) + m.xp }).eq('id', uid);
          streakBonus = { weeks: m.weeks, xp: m.xp };
        }
      }
    }
    const nextStreakMilestone = STREAK_MILESTONES.find((m) => m.weeks > streak) ?? null;

    return res.status(200).json({
      weekStart: weekStartDate,
      orderCount,
      challenges: out,
      streak,
      nextStreakMilestone,
      streakBonus,
    });
  }

  // ─── Défi bien-être 7 jours (C2) — wellness / start / checkin ───
  if (action === 'wellness' || action === 'wellness-start' || action === 'wellness-checkin') {
    if (!clients.public) return res.status(500).json({ error: 'Anon key manquante' });
    const accessToken = (req.headers?.authorization ?? '').replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Auth requise' });
    const { data: userData, error: userError } = await clients.public.auth.getUser(accessToken);
    if (userError || !userData.user) return res.status(401).json({ error: 'Token invalide' });
    const uid = userData.user.id;

    const pNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const parisToday = `${pNow.getFullYear()}-${String(pNow.getMonth() + 1).padStart(2, '0')}-${String(pNow.getDate()).padStart(2, '0')}`;
    const TOTAL = 7;
    const XP_PER_DAY = 30;
    const XP_BONUS = 300;

    // GET ?action=wellness : état du parcours + compteur communautaire
    if (action === 'wellness' && req.method === 'GET') {
      const { count: participants } = await clients.admin
        .from('wellness_challenge')
        .select('user_id', { count: 'exact', head: true });
      const { data: row } = await clients.admin
        .from('wellness_challenge')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (!row) {
        return res.status(200).json({ started: false, total: TOTAL, participants: participants ?? 0 });
      }
      return res.status(200).json({
        started: true,
        count: row.count,
        total: TOTAL,
        completed: Boolean(row.completed_at),
        canCheckInToday: row.count < TOTAL && row.last_checkin !== parisToday,
        participants: participants ?? 0,
      });
    }

    // POST ?action=wellness-start : démarre le parcours
    if (action === 'wellness-start' && req.method === 'POST') {
      const { data: existing } = await clients.admin
        .from('wellness_challenge')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle();
      if (!existing) {
        await clients.admin
          .from('wellness_challenge')
          .insert({ user_id: uid, started_on: parisToday, count: 0 });
      }
      return res.status(200).json({ ok: true });
    }

    // POST ?action=wellness-checkin : valide la mission du jour (1/jour)
    if (action === 'wellness-checkin' && req.method === 'POST') {
      const { data: row } = await clients.admin
        .from('wellness_challenge')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (!row) return res.status(400).json({ error: 'Défi non démarré' });
      if (row.completed_at || row.count >= TOTAL) {
        return res.status(200).json({ ok: true, count: row.count, completed: true, xpAwarded: 0 });
      }
      if (row.last_checkin === parisToday) {
        return res.status(409).json({ error: 'Déjà validé aujourd’hui', count: row.count });
      }
      const newCount = row.count + 1;
      const completedNow = newCount >= TOTAL;
      await clients.admin
        .from('wellness_challenge')
        .update({
          count: newCount,
          last_checkin: parisToday,
          completed_at: completedNow ? new Date().toISOString() : null,
        })
        .eq('user_id', uid);

      const xpAwarded = XP_PER_DAY + (completedNow ? XP_BONUS : 0);
      const { data: p } = await clients.admin.from('profiles').select('xp').eq('id', uid).single();
      if (p) await clients.admin.from('profiles').update({ xp: (p.xp ?? 0) + xpAwarded }).eq('id', uid);

      return res.status(200).json({ ok: true, count: newCount, completed: completedNow, xpAwarded });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // ─── GET ?action=today ─────────────────────────────────────────
  if (action === 'today' && req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });

    const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

    const { data: paidData, error: paidErr } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method, user_id')
      .gte('paid_at', since)
      .in('status', ['paid', 'preparing', 'ready'])
      .order('paid_at', { ascending: false })
      .limit(50);

    const { data: pendingCashData, error: pendingErr } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method, user_id')
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
    // Résoudre le nom du client pour les commandes liées à un compte (scan XP /
    // commande app) dont customer_name est vide → on affiche le prénom au comptoir.
    const userIds = Array.from(
      new Set(data.filter((o: any) => o.user_id && !o.customer_name).map((o: any) => o.user_id)),
    );
    const nameByUser: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profs } = await clients.admin
        .from('profiles')
        .select('id, first_name, email')
        .in('id', userIds);
      for (const p of profs ?? []) nameByUser[p.id] = p.first_name || p.email || '';
    }

    const withItems = data.map((o: any) => ({
      ...o,
      customer_name: o.customer_name || (o.user_id ? nameByUser[o.user_id] : null) || null,
      items: itemsByOrder[o.id] ?? [],
    }));
    return res.status(200).json({ orders: withItems });
  }

  // ─── GET ?action=order-detail&orderId=... (ADMIN) : détail complet ───
  // Articles + infos client (prénom, XP, nb commandes, VIP) + cadeaux récents
  // du client (reward_redemptions — pas liés à la commande, mais donnent le
  // contexte « a utilisé une boisson offerte »). Chargé au clic sur l'icône ℹ️.
  if (action === 'order-detail' && req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
    const orderId = getQueryParam(req, 'orderId');
    if (!orderId) return res.status(400).json({ error: 'orderId requis' });

    const { data: order, error: oErr } = await clients.admin
      .from('orders')
      .select('id, square_order_id, status, total_cents, customer_name, pickup_time, paid_at, created_at, payment_method, user_id, combo_count')
      .eq('id', orderId)
      .maybeSingle();
    if (oErr) return res.status(500).json({ error: oErr.message });
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    const { data: items } = await clients.admin
      .from('order_items')
      .select('product_name, option_label, category_name, quantity, unit_price_cents')
      .eq('order_id', orderId);

    let client: any = null;
    let rewards: any[] = [];
    if (order.user_id) {
      const { data: prof } = await clients.admin
        .from('profiles')
        .select('first_name, email, xp, total_orders, total_spent_cents, vip_tier, created_at')
        .eq('id', order.user_id)
        .maybeSingle();
      client = prof ?? null;
      // Cadeaux récents du client (contexte « boisson offerte utilisée »).
      const { data: reds } = await clients.admin
        .from('reward_redemptions')
        .select('reward_label, xp_cost, source, created_at')
        .eq('user_id', order.user_id)
        .order('created_at', { ascending: false })
        .limit(5);
      rewards = reds ?? [];
    }

    // XP gagnés sur cette commande : non stockés → estimation (10 XP/€ + 50 de
    // bonus commande). Les multiplicateurs (mardi/roue) ne sont pas connus a
    // posteriori, d'où le « ≈ ».
    const xpEstimate = Math.round((order.total_cents || 0) / 10) + 50;

    return res.status(200).json({ order, items: items ?? [], client, rewards, xpEstimate });
  }

  // ─── GET ?action=client-history&userId=... (ADMIN) : historique complet ───
  // Pour le scanner comptoir : toutes les commandes (avec articles) + tous les
  // cadeaux/points consommés d'un client, avec dates. Admin-authed par mdp.
  if (action === 'client-history' && req.method === 'GET') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
    const userId = getQueryParam(req, 'userId');
    if (!userId) return res.status(400).json({ error: 'userId requis' });

    const { data: orders } = await clients.admin
      .from('orders')
      .select('id, total_cents, status, payment_method, created_at, paid_at')
      .eq('user_id', userId)
      .in('status', ['paid', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(30);
    const orderIds = (orders ?? []).map((o: any) => o.id);
    const itemsByOrder: Record<string, any[]> = {};
    if (orderIds.length) {
      const { data: items } = await clients.admin
        .from('order_items')
        .select('order_id, product_name, option_label, quantity, unit_price_cents')
        .in('order_id', orderIds);
      for (const it of items ?? []) (itemsByOrder[it.order_id] ||= []).push(it);
    }
    const withItems = (orders ?? []).map((o: any) => ({ ...o, items: itemsByOrder[o.id] ?? [] }));

    const { data: rewards } = await clients.admin
      .from('reward_redemptions')
      .select('reward_label, xp_cost, source, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    return res.status(200).json({ orders: withItems, rewards: rewards ?? [] });
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

    const comboCount = cart.reduce(
      (n, it) => n + (it?.categoryName === 'Formule combo' ? Number(it.quantity || 1) : 0),
      0,
    );

    const { error: orderError } = await clients.admin.from('orders').insert({
      id: orderId,
      user_id: userId,
      square_order_id: `CASH-${shortCode}`,
      status: 'pending_cash',
      payment_method: 'cash',
      total_cents: totalCents,
      combo_count: comboCount,
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
      .select('id, user_id, status, total_cents, combo_count')
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
        .select('first_name, total_spent_cents, total_orders, xp, referred_by, referral_rewarded, xp_multiplier_until')
        .eq('id', order.user_id)
        .single();
      if (profile) {
        const isFirstOrder = profile.total_orders === 0;
        const eurosSpent = Math.floor(order.total_cents / 100);
        // Mardi Double XP (cohérent avec le webhook Square carte)
        const isTuesday = new Date().getUTCDay() === 2;
        // 🎁 Boost XP ×2 (roue) : actif tant que xp_multiplier_until > maintenant
        // (cohérent avec square-webhook.ts et credit-manual ; cumulable avec mardi)
        const xpBoostActive = !!profile.xp_multiplier_until && new Date(profile.xp_multiplier_until).getTime() > Date.now();
        // Bonus combo +25 XP / combo (posé sur la commande par create-pending)
        const comboBonus = ((order as any).combo_count ?? 0) * 25;
        const xpGained = eurosSpent * 10 * (isTuesday ? 2 : 1) * (xpBoostActive ? 2 : 1) + 50 + (isFirstOrder ? 200 : 0) + comboBonus;
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

        // 💚 Push « merci pour ta visite » (récap + XP + avis) — best-effort
        try {
          await notifyThanks(clients.admin, order, {
            xpTotal: newXp,
            xpGained,
            firstName: (profile as any).first_name,
          });
        } catch {
          /* ne bloque jamais l'encaissement */
        }

        // Récompense parrainage à la 1ère commande payée. Claim ATOMIQUE du flag
        // (WHERE referral_rewarded=false) : un seul appel concurrent gagne → pas
        // de double +500. Crédit parrain via add_xp (incrément atomique).
        if (isFirstOrder && profile.referred_by && !profile.referral_rewarded) {
          try {
            const { data: claimedRef } = await clients.admin
              .from('profiles')
              .update({ referral_rewarded: true })
              .eq('id', order.user_id)
              .eq('referral_rewarded', false)
              .select('id');
            if (claimedRef && claimedRef.length > 0) {
              await clients.admin.rpc('add_xp', { p_user: profile.referred_by, p_amount: 500 });
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
    // Notifie le client (push + boîte de réception) sur les transitions
    // visibles (préparation / prête). Best-effort, ne bloque pas la réponse.
    try {
      await notifyCustomerStatus(clients.admin, data, status);
    } catch {
      /* noop : la notif client ne doit jamais casser la mise à jour de statut */
    }
    return res.status(200).json({ ok: true, order: data });
  }

  // ─── POST ?action=update-pickup (admin) : change l'heure de retrait ───
  // Autorisé UNIQUEMENT tant que la commande n'est pas « en prépa » (règle :
  // verrouillé dès qu'on clique En prépa). Ne touche QUE l'heure — pas le
  // contenu ni Square (changer le contenu d'une commande payée = casse Square).
  if (action === 'update-pickup' && req.method === 'POST') {
    if (!requireAdmin(req)) return res.status(401).json({ error: 'Non autorisé' });
    const body = await readBody(req);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : null;
    const pickupTime = typeof body?.pickupTime === 'string' ? body.pickupTime.trim() : '';
    if (!orderId) return res.status(400).json({ error: 'orderId requis' });

    const { data: order } = await clients.admin
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });
    if (!['pending_cash', 'paid'].includes(order.status)) {
      return res.status(409).json({ error: 'Commande déjà en préparation — heure verrouillée' });
    }

    const { error } = await clients.admin
      .from('orders')
      .update({ pickup_time: pickupTime || null })
      .eq('id', orderId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true, pickup_time: pickupTime || null });
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
      boost: { cost: 150, label: 'Sirop / boost offert' },
      topping: { cost: 300, label: 'Topping offert' },
      boisson: { cost: 1500, label: 'Une boisson au choix' },
      'combo-gaufre': { cost: 2200, label: 'Boisson + gaufre healthy' },
      'cadeau-mois': { cost: 3800, label: 'Cadeau du mois' },
    };
    const body = await readBody(req);
    const rewardId = typeof body?.rewardId === 'string' ? body.rewardId : null;
    const reward = rewardId ? REWARDS[rewardId] : null;
    if (!reward) return res.status(400).json({ error: 'Cadeau inconnu' });

    // Débit ATOMIQUE (anti double-cadeau en concurrence). NULL = XP insuffisants.
    const { data: newXp, error: spendErr } = await clients.admin.rpc('spend_xp', {
      p_user: userId,
      p_cost: reward.cost,
    });
    if (spendErr) return res.status(500).json({ error: spendErr.message });
    if (newXp === null || typeof newXp !== 'number') {
      return res.status(400).json({ error: 'XP insuffisants' });
    }

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
