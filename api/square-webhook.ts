// Webhook Square — reçoit payment.created / payment.updated
// Quand un paiement passe à COMPLETED, crée/met à jour l'order côté Supabase,
// crédite XP (+10 par €, +50 par commande, +200 si 1ère commande) et
// recalcule vip_tier en fonction du total_spent_cents.
//
// Configuration requise :
// - SQUARE_WEBHOOK_SIGNATURE_KEY : à créer dans Square Dashboard → Webhooks
//   → ajouter cette URL : https://commande.labase-nutrition.com/api/square-webhook
//   → événements : payment.created, payment.updated
// - SUPABASE_URL : déjà OK
// - SUPABASE_SERVICE_ROLE_KEY : Supabase → Settings → API → service_role secret
//   (à ajouter dans Vercel env vars)

// IMPORTANT : @supabase/supabase-js est chargé via dynamic import dans le
// handler pour éviter le piège ESM/CJS de Vercel (FUNCTION_INVOCATION_FAILED).
import { createHmac, timingSafeEqual } from 'node:crypto';

// VIP tier seuils (€ cumulés en cents)
const VIP_TIERS: Array<{ id: string; minSpentCents: number }> = [
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

// Push « merci pour ta visite » après paiement CB (récap + XP + avis Google).
// Copie locale (les imports cross-fichier api/ cassent sur Vercel). Best-effort.
const GOOGLE_REVIEW_URL = 'https://g.page/r/CeJabN1yW1toEAE/review';
const REWARD_TIERS = [
  { cost: 150, label: 'un boost offert' },
  { cost: 300, label: 'un topping offert' },
  { cost: 1500, label: 'une boisson offerte' },
  { cost: 2200, label: 'une boisson + gaufre' },
  { cost: 3800, label: 'le cadeau du mois' },
];

async function notifyThanks(
  admin: any,
  orderId: string,
  userId: string,
  opts: { xpTotal: number; xpGained: number; firstName?: string | null },
): Promise<void> {
  if (!userId) return;
  const { data: items } = await admin
    .from('order_items')
    .select('product_name, quantity')
    .eq('order_id', orderId);
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
  try {
    await admin.from('user_notifications').insert({
      user_id: userId, title, body, url: GOOGLE_REVIEW_URL, emoji: '💚', kind: 'order',
    });
  } catch { /* best-effort */ }
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
    title, body, url: GOOGLE_REVIEW_URL, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'labase-thanks',
  });
  const expired: string[] = [];
  await Promise.all((subs as any[]).map(async (sub: any) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(sub.endpoint);
    }
  }));
  if (expired.length > 0) await admin.from('push_subscriptions').delete().in('endpoint', expired);
}

async function readBody(req: any): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => (raw += chunk.toString('utf-8')));
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function verifySignature(rawBody: string, signature: string | undefined, notificationUrl: string, signatureKey: string): boolean {
  if (!signature) return false;
  const stringToSign = notificationUrl + rawBody;
  const expected = createHmac('sha256', signatureKey).update(stringToSign).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[square-webhook] Supabase env vars manquantes');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const rawBody = await readBody(req);

  // Vérification signature (skippée en dev si la clé n'est pas définie,
  // utile pour tester localement, ne JAMAIS skip en prod)
  if (signatureKey) {
    const forwardedProto = req.headers?.['x-forwarded-proto'] || 'https';
    const host = req.headers?.host;
    const notificationUrl = `${forwardedProto}://${host}${req.url}`;
    const signature = req.headers?.['x-square-hmacsha256-signature'] as string | undefined;

    if (!verifySignature(rawBody, signature, notificationUrl, signatureKey)) {
      console.warn('[square-webhook] Signature invalide');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[square-webhook] SQUARE_WEBHOOK_SIGNATURE_KEY manquante en prod !');
    return res.status(500).json({ error: 'Webhook signature key not configured' });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const type = event?.type;
  const payment = event?.data?.object?.payment;

  if (!payment || (type !== 'payment.created' && type !== 'payment.updated')) {
    // Ignorer les autres événements
    return res.status(200).json({ ok: true, ignored: true, type });
  }

  // On ne crédite QUE pour les paiements COMPLETED
  if (payment.status !== 'COMPLETED') {
    return res.status(200).json({ ok: true, skipped: true, status: payment.status });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const squarePaymentId = payment.id as string;
  const squareOrderId = payment.order_id as string | undefined;
  const totalCents = (payment.total_money?.amount as number) ?? 0;
  const buyerEmail = payment.buyer_email_address as string | undefined;
  const note = payment.note as string | undefined;
  // Heure RÉELLE du paiement Square (pas l'heure de traitement du webhook),
  // sinon les heures affichées sont fausses quand Square renvoie d'anciens
  // événements (retry / reconfig webhook).
  const paidAtIso = payment.created_at
    ? new Date(payment.created_at as string).toISOString()
    : new Date().toISOString();

  // Vérifier si on a déjà traité ce paiement (idempotence)
  if (squareOrderId) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id, status')
      .eq('square_order_id', squareOrderId)
      .maybeSingle();

    if (existing && existing.status === 'paid') {
      return res.status(200).json({ ok: true, alreadyProcessed: true });
    }
  }

  // Tenter de matcher l'utilisateur via email
  let userId: string | null = null;
  if (buyerEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', buyerEmail.toLowerCase())
      .maybeSingle();
    if (profile) userId = profile.id;
  }

  // Upsert de l'order
  const orderPayload = {
    user_id: userId,
    square_order_id: squareOrderId,
    square_payment_id: squarePaymentId,
    status: 'paid',
    total_cents: totalCents,
    customer_name: note || null,
    paid_at: paidAtIso,
    created_at: paidAtIso,
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .upsert(orderPayload, { onConflict: 'square_order_id' })
    .select()
    .single();

  if (orderError) {
    console.error('[square-webhook] order upsert failed:', orderError.message);
    return res.status(500).json({ error: 'Failed to record order', details: orderError.message });
  }

  // Crédit XP si utilisateur identifié
  if (userId) {
    // Claim ATOMIQUE du crédit : on ne crédite que si xp_credited bascule
    // false→true. Si un autre event Square (created/updated) l'a déjà fait en
    // parallèle, ce claim renvoie 0 ligne → on ne double PAS les XP.
    const { data: claimedCredit } = await supabase
      .from('orders')
      .update({ xp_credited: true })
      .eq('id', order.id)
      .eq('xp_credited', false)
      .select('id');
    if (!claimedCredit || claimedCredit.length === 0) {
      return res.status(200).json({ ok: true, alreadyCredited: true });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, total_spent_cents, total_orders, xp, referred_by, referral_rewarded, xp_multiplier_until')
      .eq('id', userId)
      .single();

    if (profile) {
      const isFirstOrder = profile.total_orders === 0;
      const eurosSpent = Math.floor(totalCents / 100);
      // Mardi Double XP (cohérent avec le crédit comptoir)
      const isTuesday = new Date().getUTCDay() === 2;
      // 🎁 Boost XP ×2 (roue) : actif tant que xp_multiplier_until > maintenant.
      const xpBoostActive = !!profile.xp_multiplier_until && new Date(profile.xp_multiplier_until).getTime() > Date.now();
      const xpFromEuros = eurosSpent * 10 * (isTuesday ? 2 : 1) * (xpBoostActive ? 2 : 1);
      const xpFromOrder = 50;
      const xpFirstOrderBonus = isFirstOrder ? 200 : 0;
      // Bonus combo +25 XP / combo (posé sur la commande par create-payment-link)
      const comboBonus = ((order as any).combo_count ?? 0) * 25;
      const xpGained = xpFromEuros + xpFromOrder + xpFirstOrderBonus + comboBonus;

      const newTotalSpent = profile.total_spent_cents + totalCents;
      const newTotalOrders = profile.total_orders + 1;
      const newXp = profile.xp + xpGained;
      const newVipTier = computeVipTier(newTotalSpent);
      const newLevel = computeMascotteLevel(newXp);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_spent_cents: newTotalSpent,
          total_orders: newTotalOrders,
          xp: newXp,
          vip_tier: newVipTier,
          level: newLevel,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[square-webhook] profile update failed:', updateError.message);
      }

      // 💚 Push « merci pour ta visite » (récap + XP + avis) — best-effort
      try {
        await notifyThanks(supabase, order.id, userId, {
          xpTotal: newXp,
          xpGained,
          firstName: (profile as any).first_name,
        });
      } catch (err: any) {
        console.warn('[square-webhook] thanks push failed:', err?.message);
      }

      // ─── Récompense parrainage ───────────────────────────────────
      // À la 1ère commande payée du filleul, le parrain gagne +500 XP.
      // Bloc 100% gardé : toute erreur ici ne doit JAMAIS perturber
      // l'enregistrement du paiement (déjà fait au-dessus).
      if (isFirstOrder && profile.referred_by && !profile.referral_rewarded) {
        try {
          // Claim ATOMIQUE du flag (anti double +500) + crédit parrain atomique.
          const { data: claimedRef } = await supabase
            .from('profiles')
            .update({ referral_rewarded: true })
            .eq('id', userId)
            .eq('referral_rewarded', false)
            .select('id');
          if (claimedRef && claimedRef.length > 0) {
            await supabase.rpc('add_xp', { p_user: profile.referred_by, p_amount: 500 });
          }
        } catch (err: any) {
          console.warn('[square-webhook] referral reward failed:', err?.message);
        }
      }

      return res.status(200).json({
        ok: true,
        orderId: order.id,
        xpGained,
        newTotalSpent,
        newVipTier,
        newLevel,
      });
    }
  }

  return res.status(200).json({ ok: true, orderId: order.id, anonymous: true });
}
