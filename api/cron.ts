// Route consolidée crons Vercel
// GET ?type=birthday → célèbre les anniversaires du jour
// GET ?type=relance  → relance les clients absents 14j+

function getQuery(req: any, key: string): string | null {
  if (typeof req.query?.[key] === 'string') return req.query[key];
  const url = req.url || '';
  const qs = url.split('?')[1];
  if (!qs) return null;
  return new URLSearchParams(qs).get(key);
}

function generateRewardCode(prefix: string): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-${prefix}-${r()}`;
}

async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  tag: string,
  vapidPublic: string,
  vapidPrivate: string,
  vapidSubject: string,
): Promise<boolean> {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return false;

  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  // url → boîte de réception : le client retrouve le message archivé.
  const payload = JSON.stringify({ title, body, url: '/?inbox=1', tag });

  let success = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
      success = true;
    } catch (err: any) {
      console.warn('[cron] push failed:', err?.message);
    }
  }
  return success;
}

// Archive un message dans la boîte de réception PERSONNELLE du client
// (table user_notifications). Best-effort : un échec ne casse pas le cron.
async function archiveNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  emoji: string,
  kind: string,
): Promise<void> {
  try {
    await supabase.from('user_notifications').insert({
      user_id: userId,
      title,
      body,
      emoji,
      kind,
    });
  } catch (err: any) {
    console.warn('[cron] archive notification failed:', err?.message);
  }
}

export default async function handler(req: any, res: any) {
  // Auth optionnelle via CRON_SECRET (auto-envoyé par Vercel Cron)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers?.authorization ?? '';
    const provided = authHeader.replace(/^Bearer\s+/, '').trim();
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
  }

  const type = getQuery(req, 'type');
  if (!type) return res.status(400).json({ error: 'type requis (birthday|relance)' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase non configuré' });

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  const canPush = Boolean(vapidPublic && vapidPrivate);

  // ─── BIRTHDAY ─────────────────────────────────────────────────
  if (type === 'birthday') {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, first_name, birthday, xp, last_birthday_celebrated_year')
      .not('birthday', 'is', null);

    if (error) return res.status(500).json({ error: error.message });

    const todayBirthdays = (profiles ?? []).filter((p: any) => {
      if (!p.birthday) return false;
      if (p.last_birthday_celebrated_year === year) return false;
      const d = new Date(p.birthday);
      return d.getMonth() + 1 === month && d.getDate() === day;
    });

    if (todayBirthdays.length === 0) {
      return res.status(200).json({ ok: true, celebrated: 0 });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const results = [];

    for (const p of todayBirthdays) {
      try {
        const newXp = (p.xp ?? 0) + 500;
        await admin
          .from('profiles')
          .update({ xp: newXp, last_birthday_celebrated_year: year })
          .eq('id', p.id);

        await admin.from('wheel_spins').insert({
          user_id: p.id,
          reward_code: generateRewardCode('BDAY'),
          reward_label: '🎂 Cadeau d\'anniversaire (utilise ta roue bonus)',
          reward_type: 'manual_pickup',
          reward_value: 'birthday_bonus',
          expires_at: expiresAt,
        });

        const bdayTitle = '🎂 Joyeux anniversaire !';
        const bdayBody = `${p.first_name ? p.first_name + ', t' : 'T'}u viens de gagner +500 XP et une roue cadeau bonus.`;

        // Archive d'abord → visible dans « Mes messages » même sans push.
        await archiveNotification(admin, p.id, bdayTitle, bdayBody, '🎂', 'birthday');

        let pushSent = false;
        if (canPush) {
          pushSent = await sendPushToUser(
            admin, p.id, bdayTitle, bdayBody, 'labase-birthday',
            vapidPublic!, vapidPrivate!, vapidSubject,
          );
        }

        results.push({ userId: p.id, xpAdded: 500, pushSent });
      } catch (err: any) {
        results.push({ userId: p.id, error: err?.message });
      }
    }

    return res.status(200).json({ ok: true, celebrated: results.length, results });
  }

  // ─── RELANCE 14j ──────────────────────────────────────────────
  if (type === 'relance') {
    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: recentBuyers } = await admin
      .from('orders')
      .select('user_id')
      .eq('status', 'paid')
      .gte('paid_at', fourteenDaysAgo)
      .not('user_id', 'is', null);

    const recentUserIds = new Set((recentBuyers ?? []).map((o: any) => o.user_id));

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, first_name, total_orders, last_relance_at')
      .gt('total_orders', 0)
      .or(`last_relance_at.is.null,last_relance_at.lt.${sevenDaysAgo}`);

    if (error) return res.status(500).json({ error: error.message });

    const eligible = (profiles ?? []).filter((p: any) => !recentUserIds.has(p.id));

    if (eligible.length === 0) return res.status(200).json({ ok: true, relanced: 0 });

    const nowIso = new Date().toISOString();
    const results = [];

    for (const p of eligible) {
      try {
        const relanceTitle = `${p.first_name ? p.first_name + ', t' : 'T'}u nous manques 🩵`;
        const relanceBody = 'Une roue bonus t\'attend pour ton retour. Viens tenter ta chance !';

        // Archive dans la boîte perso → le client retrouve le message dans
        // l'app, même s'il n'a pas autorisé les push.
        await archiveNotification(admin, p.id, relanceTitle, relanceBody, '🩵', 'relance');

        let pushSent = false;
        if (canPush) {
          pushSent = await sendPushToUser(
            admin, p.id, relanceTitle, relanceBody, 'labase-relance',
            vapidPublic!, vapidPrivate!, vapidSubject,
          );
        }

        // On pose last_relance_at dès qu'on a relancé (archive faite), même
        // sans push : évite de ré-archiver le même message à chaque cron.
        await admin
          .from('profiles')
          .update({ last_relance_at: nowIso })
          .eq('id', p.id);

        results.push({ userId: p.id, pushSent });
      } catch (err: any) {
        results.push({ userId: p.id, error: err?.message });
      }
    }

    return res.status(200).json({
      ok: true,
      relanced: results.length,
      pushed: results.filter((r) => r.pushSent).length,
      total: eligible.length,
    });
  }

  return res.status(400).json({ error: 'type non reconnu' });
}
