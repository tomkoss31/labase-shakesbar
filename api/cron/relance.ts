// Cron Vercel quotidien (18h) : relance les clients absents
// - Détecte les profils :
//   · total_orders > 0 (ont déjà commandé)
//   · Pas de commande paid dans les 14 derniers jours
//   · last_relance_at NULL ou > 7 jours (anti-spam)
// - Envoie une push "Tu nous manques ! 🎁"
// - Marque last_relance_at = now
//
// Auth : Bearer token CRON_SECRET

async function sendRelancePush(
  supabase: any,
  userId: string,
  firstName: string | null,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string,
) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return false;

  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const payload = JSON.stringify({
    title: `${firstName ? firstName + ', t' : 'T'}u nous manques 🩵`,
    body: 'Une roue bonus t\'attend pour ton retour. Viens tenter ta chance !',
    url: '/',
    tag: 'labase-relance',
  });

  let success = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
      success = true;
    } catch (err: any) {
      console.warn('[cron/relance] push failed:', err?.message);
    }
  }
  return success;
}

export default async function handler(req: any, res: any) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers?.authorization ?? '';
    const provided = authHeader.replace(/^Bearer\s+/, '').trim();
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = Date.now();
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Trouver les user_id avec une order paid dans les 14 derniers jours
  //    → ces users-là on les exclut.
  const { data: recentBuyers } = await admin
    .from('orders')
    .select('user_id')
    .eq('status', 'paid')
    .gte('paid_at', fourteenDaysAgo)
    .not('user_id', 'is', null);

  const recentUserIds = new Set((recentBuyers ?? []).map((o) => o.user_id));

  // 2. Récupérer les profils éligibles :
  //    · total_orders > 0
  //    · pas de relance récente (< 7 jours)
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, first_name, total_orders, last_relance_at')
    .gt('total_orders', 0)
    .or(`last_relance_at.is.null,last_relance_at.lt.${sevenDaysAgo}`);

  if (error) {
    return res.status(500).json({ error: 'Erreur fetch', details: error.message });
  }

  const eligible = (profiles ?? []).filter((p) => !recentUserIds.has(p.id));

  if (eligible.length === 0) {
    return res.status(200).json({ ok: true, relanced: 0, message: 'Aucun client à relancer' });
  }

  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  const canPush = Boolean(vapidPublic && vapidPrivate);

  const nowIso = new Date().toISOString();
  const results = [];

  for (const p of eligible) {
    try {
      let pushSent = false;
      if (canPush) {
        pushSent = await sendRelancePush(
          admin,
          p.id,
          p.first_name,
          vapidPublic!,
          vapidPrivate!,
          vapidSubject,
        );
      }

      // On marque last_relance_at uniquement si on a effectivement envoyé une push
      // (sinon on retentera demain quand l'utilisateur aura peut-être activé les notifs)
      if (pushSent) {
        await admin
          .from('profiles')
          .update({ last_relance_at: nowIso })
          .eq('id', p.id);
      }

      results.push({ userId: p.id, pushSent });
    } catch (err: any) {
      console.error('[cron/relance]', p.id, err?.message);
      results.push({ userId: p.id, error: err?.message });
    }
  }

  return res.status(200).json({
    ok: true,
    relanced: results.filter((r) => r.pushSent).length,
    skipped: results.filter((r) => !r.pushSent).length,
    total: eligible.length,
  });
}
