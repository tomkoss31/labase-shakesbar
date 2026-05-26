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
    paid_at: new Date().toISOString(),
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_spent_cents, total_orders, xp')
      .eq('id', userId)
      .single();

    if (profile) {
      const isFirstOrder = profile.total_orders === 0;
      const eurosSpent = Math.floor(totalCents / 100);
      const xpFromEuros = eurosSpent * 10;
      const xpFromOrder = 50;
      const xpFirstOrderBonus = isFirstOrder ? 200 : 0;
      const xpGained = xpFromEuros + xpFromOrder + xpFirstOrderBonus;

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
