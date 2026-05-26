// Cron Vercel quotidien (9h) : célèbre les anniversaires des utilisateurs
// - Détecte profiles.birthday qui correspond à aujourd'hui (jour + mois)
// - last_birthday_celebrated_year != année courante (anti-double déclenchement)
// - Pour chaque user :
//   · +500 XP
//   · Crée un wheel_spin bonus (hors cooldown) — segment manuel "Tente la roue"
//   · Envoie une push notification "🎂 Joyeux anniversaire !"
//   · Marque l'année comme célébrée
//
// Auth : Bearer token CRON_SECRET (env var Vercel) — auto-envoyé par Vercel Cron

function generateRewardCode(): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-BDAY-${r()}`;
}

async function sendBirthdayPush(
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

  if (!subs || subs.length === 0) return;

  const webpushMod = await import('web-push');
  const webpush: any = (webpushMod as any).default ?? webpushMod;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const payload = JSON.stringify({
    title: '🎂 Joyeux anniversaire !',
    body: `${firstName ? firstName + ', t' : 'T'}u viens de gagner +500 XP et une roue cadeau bonus. À toi de jouer !`,
    url: '/',
    tag: 'labase-birthday',
    requireInteraction: true,
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
    } catch (err: any) {
      console.warn('[cron/birthday] push failed:', err?.message);
    }
  }
}

export default async function handler(req: any, res: any) {
  // Auth : Vercel Cron envoie automatiquement Authorization: Bearer <CRON_SECRET>
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

  const today = new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate(); // 1-31
  const year = today.getFullYear();

  // Récupère tous les profils avec un anniversaire renseigné
  // (Postgres ne permet pas directement de filtrer sur extract(month from birthday),
  //  donc on fait le filtre côté Node sur la liste complète.
  //  Si la table grossit > 10k profils, optimiser en RPC SQL côté Supabase.)
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, first_name, birthday, xp, last_birthday_celebrated_year')
    .not('birthday', 'is', null);

  if (error) {
    return res.status(500).json({ error: 'Erreur fetch profiles', details: error.message });
  }

  const todayBirthdays = (profiles ?? []).filter((p) => {
    if (!p.birthday) return false;
    if (p.last_birthday_celebrated_year === year) return false; // déjà célébré cette année
    const d = new Date(p.birthday);
    return d.getMonth() + 1 === month && d.getDate() === day;
  });

  if (todayBirthdays.length === 0) {
    return res.status(200).json({ ok: true, celebrated: 0, message: 'Aucun anniversaire aujourd\'hui' });
  }

  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  const canPush = Boolean(vapidPublic && vapidPrivate);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const results = [];

  for (const p of todayBirthdays) {
    try {
      // +500 XP
      const newXp = (p.xp ?? 0) + 500;
      await admin
        .from('profiles')
        .update({ xp: newXp, last_birthday_celebrated_year: year })
        .eq('id', p.id);

      // Spin bonus (segment manuel "Anniversaire" — créé en tant que retry pour
      // débloquer une utilisation immédiate de la roue hors cooldown)
      await admin.from('wheel_spins').insert({
        user_id: p.id,
        reward_code: generateRewardCode(),
        reward_label: '🎂 Cadeau d\'anniversaire (utilise ta roue bonus)',
        reward_type: 'manual_pickup',
        reward_value: 'birthday_bonus',
        expires_at: expiresAt,
      });

      // Push
      if (canPush) {
        await sendBirthdayPush(admin, p.id, p.first_name, vapidPublic!, vapidPrivate!, vapidSubject);
      }

      results.push({ userId: p.id, xpAdded: 500, pushSent: canPush });
    } catch (err: any) {
      console.error('[cron/birthday]', p.id, err?.message);
      results.push({ userId: p.id, error: err?.message });
    }
  }

  return res.status(200).json({
    ok: true,
    celebrated: results.length,
    date: today.toISOString(),
    results,
  });
}
