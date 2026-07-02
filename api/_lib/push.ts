// Helper PUSH — envoie une notification web à UN utilisateur + archive dans sa
// boîte de réception (user_notifications). Réutilisable : bienvenue, merci-visite,
// statut de commande. Best-effort : n'échoue jamais fort (le paiement/login prime).
//
// NB : la boîte de réception est remplie MÊME sans abonnement push (le client
// retrouve le message dans l'app). La push web n'est envoyée que si le client a
// activé les notifications (abonnement présent) et que les clés VAPID existent.

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  emoji?: string;
  icon?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export async function sendPushToUser(
  admin: any,
  userId: string,
  msg: PushMessage,
): Promise<{ sent: number; failed: number; inbox: boolean }> {
  // 1. Boîte de réception (toujours) — le client retrouve le message dans l'app
  let inbox = false;
  try {
    await admin.from('user_notifications').insert({
      user_id: userId,
      title: msg.title,
      body: msg.body,
      url: msg.url ?? null,
      emoji: msg.emoji ?? null,
      kind: 'targeted',
    });
    inbox = true;
  } catch {
    /* non bloquant */
  }

  // 2. Push web (best-effort)
  const vapidPublic = process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:tom@labase-nutrition.com';
  if (!vapidPublic || !vapidPrivate) return { sent: 0, failed: 0, inbox };

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key')
    .eq('user_id', userId);
  if (!subs || subs.length === 0) return { sent: 0, failed: 0, inbox };

  let webpush: any;
  try {
    const webpushMod = await import('web-push');
    webpush = (webpushMod as any).default ?? webpushMod;
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  } catch {
    return { sent: 0, failed: 0, inbox };
  }

  const payload = JSON.stringify({
    title: msg.title,
    body: msg.body,
    url: msg.url ?? '/',
    icon: msg.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    image: msg.image,
    tag: msg.tag ?? 'labase-push',
    requireInteraction: msg.requireInteraction ?? false,
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
      } catch (err: any) {
        failed++;
        if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(sub.endpoint);
      }
    }),
  );

  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('endpoint', expired);
  }

  return { sent, failed, inbox };
}
