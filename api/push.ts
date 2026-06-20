// Route consolidée push
// POST   ?action=subscribe   → enregistre un abonnement
// DELETE ?action=subscribe   → supprime un abonnement
// POST   ?action=send        → envoie une push (admin)

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

// Résout les user_ids cibles d'un segment. Renvoie null pour "tous".
async function resolveSegment(admin: any, segment: string): Promise<string[] | null> {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  if (segment === 'all' || !segment) return null;

  if (segment === 'vip') {
    const { data } = await admin.from('profiles').select('id').in('vip_tier', ['vip', 'elite', 'legende']);
    return (data ?? []).map((p: any) => p.id);
  }
  if (segment === 'active') {
    const since = new Date(now - 14 * DAY).toISOString();
    const { data } = await admin
      .from('orders').select('user_id').eq('status', 'paid').gte('paid_at', since).not('user_id', 'is', null);
    return Array.from(new Set((data ?? []).map((o: any) => o.user_id)));
  }
  if (segment === 'dormant') {
    const since = new Date(now - 21 * DAY).toISOString();
    const { data: recent } = await admin
      .from('orders').select('user_id').eq('status', 'paid').gte('paid_at', since).not('user_id', 'is', null);
    const recentSet = new Set((recent ?? []).map((o: any) => o.user_id));
    const { data: buyers } = await admin.from('profiles').select('id').gt('total_orders', 0);
    return (buyers ?? []).map((p: any) => p.id).filter((id: string) => !recentSet.has(id));
  }
  return [];
}

export default async function handler(req: any, res: any) {
  const action = getActionFromQuery(req);
  if (!action) return res.status(400).json({ error: 'action requise' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ─── broadcasts (GET, public) : liste des messages pour la boîte de réception ─
  if (action === 'broadcasts' && req.method === 'GET') {
    const { data, error } = await admin
      .from('broadcasts')
      .select('id, title, body, url, emoji, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ broadcasts: data ?? [] });
  }

  // ─── my-notifications (GET, auth JWT) : messages PERSONNELS du client ─
  // Relances, anniversaires, push ciblées. Inclut l'état lu (read_at).
  if (action === 'my-notifications' && req.method === 'GET') {
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });

    const { data, error } = await admin
      .from('user_notifications')
      .select('id, title, body, url, emoji, read_at, created_at')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ notifications: data ?? [] });
  }

  // ─── mark-read (POST, auth JWT) : marque un message lu, ou tous ──────
  // Body : { id } pour un seul, ou { all: true } pour tout marquer lu.
  if (action === 'mark-read' && req.method === 'POST') {
    const authHeader = req.headers?.authorization ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/, '').trim();
    if (!accessToken) return res.status(401).json({ error: 'Token manquant' });
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Session invalide' });
    const uid = userData.user.id;

    const body = await readBody(req);
    const nowIso = new Date().toISOString();
    let q = admin
      .from('user_notifications')
      .update({ read_at: nowIso })
      .eq('user_id', uid)
      .is('read_at', null);
    if (body?.all !== true) {
      const id = typeof body?.id === 'string' ? body.id : null;
      if (!id) return res.status(400).json({ error: 'id ou all requis' });
      q = q.eq('id', id);
    }
    const { error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ─── subscribe (POST = add, DELETE = remove) ─────────────────
  if (action === 'subscribe') {
    if (req.method === 'POST') {
      const body = await readBody(req);
      const { endpoint, p256dh, auth, userId, userAgent } = body;
      if (!endpoint || !p256dh || !auth) {
        return res.status(400).json({ error: 'Champs requis : endpoint, p256dh, auth' });
      }
      const { error } = await admin.from('push_subscriptions').upsert(
        {
          endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_id: userId ?? null,
          user_agent: userAgent ?? null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' },
      );
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const body = await readBody(req);
      const { endpoint } = body;
      if (!endpoint) return res.status(400).json({ error: 'endpoint requis' });
      const { error } = await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ─── send (admin push to all) ────────────────────────────────
  if (action === 'send' && req.method === 'POST') {
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_PUSH_PASSWORD;
    if (!expectedPassword) return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
    const authHeader = req.headers?.authorization ?? '';
    const provided = authHeader.replace(/^Bearer\s+/, '').trim();
    if (provided !== expectedPassword) return res.status(401).json({ error: 'Non autorisé' });

    const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
    if (!vapidPublic || !vapidPrivate) return res.status(500).json({ error: 'Clés VAPID manquantes' });

    const webpushMod = await import('web-push');
    const webpush: any = (webpushMod as any).default ?? webpushMod;
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const body = await readBody(req);
    if (!body.title || !body.body) return res.status(400).json({ error: 'title et body requis' });

    const segment = typeof body.segment === 'string' ? body.segment : 'all';
    const targetUserIds = await resolveSegment(admin, segment);
    if (targetUserIds && targetUserIds.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, total: 0, segment, note: 'Aucun client dans ce segment' });
    }

    // Archive dans la boîte de réception. « tous » → broadcasts (boîte
    // commune publique). Segment ciblé → une ligne personnelle par
    // destinataire (user_notifications) pour que CHACUN la retrouve et
    // puisse la marquer lue, sans l'exposer aux non-ciblés.
    if (segment === 'all') {
      await admin.from('broadcasts').insert({
        title: body.title,
        body: body.body,
        url: body.url ?? null,
        emoji: body.emoji ?? null,
      });
    } else if (targetUserIds && targetUserIds.length > 0) {
      const rows = targetUserIds.map((uid: string) => ({
        user_id: uid,
        title: body.title,
        body: body.body,
        url: body.url ?? null,
        emoji: body.emoji ?? null,
        kind: 'targeted',
      }));
      await admin.from('user_notifications').insert(rows);
    }

    let subsQuery = admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh_key, auth_key, user_id');
    if (targetUserIds) subsQuery = subsQuery.in('user_id', targetUserIds);
    const { data: subs } = await subsQuery;
    if (!subs || subs.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, total: 0, segment });
    }

    const payload = JSON.stringify({
      title: body.title,
      body: body.body,
      url: body.url ?? '/',
      icon: body.icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      image: body.image,
      tag: body.tag ?? 'labase-push',
      requireInteraction: body.requireInteraction ?? false,
    });

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    await Promise.all(
      subs.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
            payload,
          );
          sent++;
          await admin
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } catch (err: any) {
          failed++;
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            expired.push(sub.endpoint);
          }
        }
      }),
    );

    if (expired.length > 0) {
      await admin.from('push_subscriptions').delete().in('endpoint', expired);
    }

    return res.status(200).json({
      ok: true,
      sent,
      failed,
      total: subs.length,
      segment,
      cleanedExpired: expired.length,
    });
  }

  return res.status(400).json({ error: 'Action non reconnue' });
}
