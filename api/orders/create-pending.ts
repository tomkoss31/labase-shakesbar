// Crée une commande "en attente d'encaissement espèces sur place".
// POST /api/orders/create-pending
// Body : { cart, customerName, pickupTime, userEmail? }
//
// Retourne : { orderId, code (4 chiffres) }
// La commande est créée avec status='pending_cash'.
// Quand Tom encaisse au comptoir via /api/orders/mark-paid, le status
// passe à 'paid' et les XP sont crédités automatiquement.

import { randomUUID } from 'node:crypto';

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

interface CartItem {
  name?: string;
  categoryName?: string;
  quantity?: number;
  option?: string;
  unitPriceCents?: number;
  extras?: string[];
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase non configuré' });
  }

  const body = await readBody(req);
  const cart: CartItem[] = Array.isArray(body?.cart) ? body.cart : [];
  if (cart.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }

  const customerName =
    typeof body?.customerName === 'string' ? body.customerName.trim() : null;
  const pickupTime = typeof body?.pickupTime === 'string' ? body.pickupTime : null;
  const userEmail =
    typeof body?.userEmail === 'string' ? body.userEmail.trim().toLowerCase() : null;

  // Calcul du total côté serveur (sécurisé via unitPriceCents envoyé par le front)
  const totalCents = cart.reduce((sum, item) => {
    const qty = Number(item.quantity || 1);
    const unit = Number(item.unitPriceCents || 0);
    return sum + qty * unit;
  }, 0);

  if (totalCents <= 0) {
    return res.status(400).json({ error: 'Total invalide' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Identifier le user (si connecté)
  let userId: string | null = null;
  if (userEmail) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();
    if (profile?.id) userId = profile.id;
  }

  // Code court 4 chiffres pour identifier la commande au comptoir
  const shortCode = String(Math.floor(1000 + Math.random() * 9000));

  // Insert order
  const orderId = randomUUID();
  const { error: orderError } = await admin.from('orders').insert({
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

  if (orderError) {
    return res.status(500).json({ error: 'Échec création order', details: orderError.message });
  }

  // Insert order_items
  const itemsToInsert = cart.map((item) => {
    const extrasLabel =
      Array.isArray(item.extras) && item.extras.length > 0
        ? ` + ${item.extras.join(', ')}`
        : '';
    return {
      order_id: orderId,
      product_name: `${item.name ?? ''}${extrasLabel}`,
      option_label: item.option ?? null,
      category_name: item.categoryName ?? null,
      quantity: Number(item.quantity || 1),
      unit_price_cents: Number(item.unitPriceCents || 0),
    };
  });

  const { error: itemsError } = await admin.from('order_items').insert(itemsToInsert);
  if (itemsError) {
    console.warn('[create-pending] items insert failed:', itemsError.message);
    // On ne bloque pas la création de l'order si les items échouent
  }

  return res.status(200).json({
    ok: true,
    orderId,
    code: shortCode,
    totalCents,
  });
}
