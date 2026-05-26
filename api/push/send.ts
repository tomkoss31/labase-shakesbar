// Envoi de push notifications à tous les abonnés
// POST /api/push/send
// Headers: Authorization: Bearer <ADMIN_PASSWORD>
// Body: { title, body, url?, icon?, image?, tag? }
//
// Variables Vercel requises :
// - VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY, VAPID_SUBJECT (mailto:...)
// - ADMIN_PUSH_PASSWORD : mot de passe simple pour protéger l'endpoint
// - SUPABASE_SERVICE_ROLE_KEY

// IMPORTANT : web-push et @supabase/supabase-js sont chargés via dynamic
// import dans le handler pour éviter le piège ESM/CJS Vercel.

interface PushBody {
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
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

  // Auth simple par bearer token
  const expectedPassword = process.env.ADMIN_PUSH_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ADMIN_PUSH_PASSWORD non configuré côté serveur' });
  }
  const authHeader = req.headers?.authorization ?? '';
  const providedToken = authHeader.replace(/^Bearer\s+/, '').trim();
  if (providedToken !== expectedPassword) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // Config VAPID
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) {
    return res.status(500).json({ error: 'Clés VAPID manquantes' });
  }
  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  // Supabase admin (dynamic import)
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // Payload
  const body = (await readBody(req)) as PushBody;
  if (!body.title || !body.body) {
    return res.status(400).json({ error: 'title et body requis' });
  }

  // Fetch toutes les subscriptions
  const { data: subs, error: fetchErr } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key');

  if (fetchErr) {
    return res.status(500).json({ error: 'Échec fetch subscriptions', details: fetchErr.message });
  }
  if (!subs || subs.length === 0) {
    return res.status(200).json({ ok: true, sent: 0, total: 0, note: 'Aucun abonné' });
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
  const expiredEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
          },
          payload,
        );
        sent++;
        // Met à jour last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } catch (err: any) {
        failed++;
        // Endpoints expirés : 404 ou 410 → on les supprime
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.warn('[push/send] Erreur envoi :', err?.message ?? err);
        }
      }
    }),
  );

  // Cleanup des subscriptions expirées
  if (expiredEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
  }

  return res.status(200).json({
    ok: true,
    sent,
    failed,
    total: subs.length,
    cleanedExpired: expiredEndpoints.length,
  });
}
