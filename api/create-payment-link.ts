// Crée un lien de paiement Square pour le panier du client.
// ZÉRO import externe (sauf node:crypto natif) pour éviter les pièges
// de bundling ESM/CommonJS de Vercel qui causaient FUNCTION_INVOCATION_FAILED.

import { randomUUID } from 'node:crypto';

// ───────────────────────────────────────────────────────────────────
// CATALOGUE PRIX INLINÉ
// Doit rester synchrone avec src/data/menu.ts (source UI)
// ───────────────────────────────────────────────────────────────────

function normalizeKey(value: string = ''): string {
  return value
    .normalize('NFKC')
    .replace(/â€™|â€˜/g, "'")
    .replace(/[‘’]/g, "'")
    .replace(/â€“|â€”/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã©/g, 'é')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã»/g, 'û')
    .replace(/Ã¼/g, 'ü')
    .replace(/\s+/g, ' ')
    .trim();
}

// Smoothies (890), enfants (590), café glacé simple (690), post workout (590)
const PRODUCT_PRICE_ENTRIES: Array<[string, number]> = [
  ['Casse Noisette', 890], ['Cappuccino', 890], ['Pina Colada', 890],
  ['Fraise bonbon', 890], ["Pim's", 890], ['Tarte à la pomme', 890],
  ['Snickers', 890], ['Full Oréo', 890], ['Speculoos', 890],
  ['Banana Split', 890], ['Banana Noisette', 890], ['Cookies', 890], ['Tropical', 890],
  // Enfants (5€, sans énergisant)
  ['Bulle de Fée', 500], ['Spiderman', 500], ['Stitch', 500],
  ['Licorne', 500], ['Hulk', 500], ['Tropicool', 500], ['Jungle Kid', 500],
  // Cafés / sportifs uniques
  ['Café glacé simple', 690],
  ['Post Workout', 590],
];

// Options : Start/Boost drinks/santé/sportifs, café/thé Petit/Grand,
// chocolat chaud saveurs, café gourmet glacé recettes, gaufre toppings
const OPTION_PRICE_ENTRIES: Array<[string, number]> = [
  ['Start 550ml — 6,90€', 690],
  ['Boost 950ml — 8,90€', 890],
  ['Petit 250ml — 3,90€', 390],
  ['Grand 450ml — 5,90€', 590],
  ['Nature — 5,90€', 590],
  ['Saveur Noisette — 6,40€', 640],
  ['Saveur Spéculoos — 6,40€', 640],
  ['Saveur Caramel — 6,40€', 640],
  ['Saveur Vanille — 6,40€', 640],
  ['Saveur Cookie — 6,40€', 640],
  ['Macchiato — 650ml — 8,90€', 890],
  ['Choco Mocha — 650ml — 8,90€', 890],
  ['Latte aux Noisettes — 650ml — 8,90€', 890],
  ['Vanille Latte — 650ml — 8,90€', 890],
  ['Miel — 6,90€', 690],
  ['Chocolat — 6,90€', 690],
  ['Chocolat blanc — 6,90€', 690],
  ['Caramel — 6,90€', 690],
  ['Caramel beurre salé — 6,90€', 690],
];

const COMBO_PRICE_ENTRIES: Array<[string, number]> = [
  ['Combo Medium', 1480],
  ['Combo Power', 1590],
  ['Tea Time', 1090],
  ['Coffee Break', 1090],
  ['Choco Cocoon', 1190],
  ['Gourmet Break', 1390],
];

const EXTRA_PRICE_ENTRIES: Array<[string, number]> = [
  ['Collagène', 250],
  ['Booster Immunité', 250],
  ['Fibres à la pomme', 250],
  ['Probiotiques', 250],
  ['Électrolytes', 250],
  ['Créatine', 250],
  ['Protéines', 250],
];

const productPrices: Record<string, number> = Object.fromEntries(PRODUCT_PRICE_ENTRIES);
const optionPrices: Record<string, number> = Object.fromEntries(OPTION_PRICE_ENTRIES);
const comboPrices: Record<string, number> = Object.fromEntries(COMBO_PRICE_ENTRIES);
const extraPrices: Record<string, number> = Object.fromEntries(EXTRA_PRICE_ENTRIES);

const normalizedProductPrices: Record<string, number> = Object.fromEntries(
  PRODUCT_PRICE_ENTRIES.map(([k, v]) => [normalizeKey(k), v]),
);
const normalizedOptionPrices: Record<string, number> = Object.fromEntries(
  OPTION_PRICE_ENTRIES.map(([k, v]) => [normalizeKey(k), v]),
);
const normalizedComboPrices: Record<string, number> = Object.fromEntries(
  COMBO_PRICE_ENTRIES.map(([k, v]) => [normalizeKey(k), v]),
);
const normalizedExtraPrices: Record<string, number> = Object.fromEntries(
  EXTRA_PRICE_ENTRIES.map(([k, v]) => [normalizeKey(k), v]),
);

// ───────────────────────────────────────────────────────────────────
// HANDLER
// ───────────────────────────────────────────────────────────────────

type CartItemPayload = {
  name?: string;
  categoryName?: string;
  quantity?: number;
  option?: string;
  unitPriceCents?: number;
  extras?: string[];
};

function getBody(req: any) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return {};
    }
  }
  return req.body ?? {};
}

function getRequestOrigin(req: any) {
  const forwardedProto = req.headers?.['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto
      : 'https';
  const host = req.headers?.host;
  if (typeof host === 'string' && host.length > 0) {
    return `${protocol}://${host}`;
  }
  return 'https://commande.labase-nutrition.com';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      return res.status(500).json({ error: 'Variables Square manquantes' });
    }

    const bodyPayload = getBody(req);
    const cart = bodyPayload?.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Panier vide ou invalide' });
    }

    const getBaseAmount = (item: CartItemPayload): number => {
      if (item.categoryName === 'Formule combo') {
        const key = normalizeKey(item.name ?? '');
        const comboAmount =
          normalizedComboPrices[key] ??
          (Number.isFinite(Number(item.unitPriceCents))
            ? Number(item.unitPriceCents)
            : undefined);
        if (!comboAmount) {
          throw new Error(`Combo inconnu: ${item.name}`);
        }
        return comboAmount;
      }

      const optionAmount = normalizedOptionPrices[normalizeKey(item.option ?? '')];
      if (optionAmount) return optionAmount;

      const productAmount = normalizedProductPrices[normalizeKey(item.name ?? '')];
      if (productAmount) return productAmount;

      // Fallback : si le front a envoyé un unitPriceCents valide, on accepte
      if (Number.isFinite(Number(item.unitPriceCents)) && Number(item.unitPriceCents) > 0) {
        return Number(item.unitPriceCents);
      }

      throw new Error(`Produit inconnu: ${item.name}`);
    };

    const lineItems = cart.map((item: CartItemPayload) => {
      const quantity = Number(item.quantity || 1);
      if (!item.name || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Article invalide dans le panier');
      }

      const baseAmount = getBaseAmount(item);

      const extrasTotal = Array.isArray(item.extras)
        ? item.extras.reduce((sum: number, extra: string) => {
            return (
              sum +
              (extraPrices[extra] ??
                normalizedExtraPrices[normalizeKey(extra)] ??
                0)
            );
          }, 0)
        : 0;

      const totalUnitAmount = baseAmount + extrasTotal;

      const extrasLabel =
        Array.isArray(item.extras) && item.extras.length > 0
          ? ` + ${item.extras.join(', ')}`
          : '';
      const optionLabel = item.option ? ` (${item.option})` : '';

      return {
        name: `${item.name}${optionLabel}${extrasLabel}`,
        quantity: String(quantity),
        base_price_money: {
          amount: totalUnitAmount,
          currency: 'EUR',
        },
      };
    });

    const userEmail =
      typeof bodyPayload?.userEmail === 'string'
        ? bodyPayload.userEmail.trim().toLowerCase()
        : undefined;
    const customerName =
      typeof bodyPayload?.customerName === 'string'
        ? bodyPayload.customerName.trim()
        : undefined;
    const rewardCode =
      typeof bodyPayload?.rewardCode === 'string' && bodyPayload.rewardCode.trim().length > 0
        ? bodyPayload.rewardCode.trim()
        : null;
    const requestedXpToSpend =
      Number.isFinite(Number(bodyPayload?.xpToSpend)) && Number(bodyPayload.xpToSpend) > 0
        ? Math.floor(Number(bodyPayload.xpToSpend) / 100) * 100 // arrondi à 100
        : 0;

    // Application du reward code roue (discount_percent uniquement pour l'instant)
    // - Vérifie en DB que le code existe, n'est pas utilisé, n'est pas expiré
    // - Calcule la réduction
    // - Ajoute une line négative dans la commande Square
    // - Marque le code comme utilisé (used_at = now)
    let discountCents = 0;
    let rewardLineItem: any = null;
    let rewardSpinId: string | null = null;

    if (rewardCode && userEmail) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          // Trouver le user_id depuis l'email
          const { data: profile } = await admin
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .maybeSingle();

          if (profile?.id) {
            // Récupérer le spin
            const { data: spin } = await admin
              .from('wheel_spins')
              .select('id, reward_type, reward_value, used_at, expires_at, reward_label')
              .eq('reward_code', rewardCode)
              .eq('user_id', profile.id)
              .maybeSingle();

            if (
              spin &&
              !spin.used_at &&
              new Date(spin.expires_at).getTime() > Date.now() &&
              spin.reward_type === 'discount_percent'
            ) {
              const pct = parseInt(spin.reward_value ?? '0', 10);
              const subtotal = lineItems.reduce(
                (s: number, li: any) => s + Number(li.base_price_money?.amount ?? 0) * Number(li.quantity ?? 1),
                0,
              );
              discountCents = Math.round((subtotal * pct) / 100);

              if (discountCents > 0) {
                rewardLineItem = {
                  name: `🎁 Réduction ${pct}% (code ${rewardCode})`,
                  quantity: '1',
                  base_price_money: {
                    amount: -discountCents,
                    currency: 'EUR',
                  },
                };
                rewardSpinId = spin.id;
              }
            }
          }
        } catch (err: any) {
          console.warn('[create-payment-link] reward fetch failed:', err?.message);
        }
      }
    }

    // Application XP utilisables (100 XP = 1€, plafond 30% du total après reward)
    // Vérifications côté serveur pour éviter triche.
    let xpSpent = 0;
    let xpDiscountCents = 0;
    let xpUserIdToDebit: string | null = null;
    let xpLineItem: any = null;

    if (requestedXpToSpend > 0 && userEmail) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data: profile } = await admin
            .from('profiles')
            .select('id, xp')
            .eq('email', userEmail)
            .maybeSingle();

          if (profile?.id) {
            const subtotal = lineItems.reduce(
              (s: number, li: any) => s + Number(li.base_price_money?.amount ?? 0) * Number(li.quantity ?? 1),
              0,
            );
            const subtotalAfterReward = Math.max(0, subtotal - discountCents);
            const capCents = Math.floor((subtotalAfterReward * 30) / 100);
            const capInXp = capCents; // 100 XP = 100 cents = 1€
            const safeXp = Math.min(requestedXpToSpend, profile.xp, capInXp);
            const roundedXp = Math.floor(safeXp / 100) * 100;

            if (roundedXp > 0) {
              xpSpent = roundedXp;
              xpDiscountCents = roundedXp; // 100 XP = 100 cents
              xpUserIdToDebit = profile.id;
              xpLineItem = {
                name: `⚡ Utilisation de ${roundedXp} XP`,
                quantity: '1',
                base_price_money: {
                  amount: -xpDiscountCents,
                  currency: 'EUR',
                },
              };
            }
          }
        } catch (err: any) {
          console.warn('[create-payment-link] xp spend failed:', err?.message);
        }
      }
    }

    // Construire la liste finale (line items + reward discount + xp discount)
    const finalLineItems = [
      ...lineItems,
      ...(rewardLineItem ? [rewardLineItem] : []),
      ...(xpLineItem ? [xpLineItem] : []),
    ];

    const squarePayload: any = {
      idempotency_key: randomUUID(),
      order: {
        location_id: locationId,
        line_items: finalLineItems,
      },
      checkout_options: {
        redirect_url: `${getRequestOrigin(req)}/?payment=success`,
      },
    };

    if (userEmail) {
      squarePayload.pre_populated_data = { buyer_email: userEmail };
    }
    if (customerName) {
      squarePayload.order.metadata = { customer_name: customerName };
    }

    const squareResponse = await fetch(
      'https://connect.squareup.com/v2/online-checkout/payment-links',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2025-10-16',
        },
        body: JSON.stringify(squarePayload),
      },
    );

    const raw = await squareResponse.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { raw };
    }

    if (!squareResponse.ok) {
      console.error('Square API error', data);
      return res.status(500).json({ error: 'Erreur Square', details: data });
    }

    // Débiter les XP du profil (best-effort, non-bloquant)
    if (xpUserIdToDebit && xpSpent > 0) {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          // Refetch puis update (évite race condition)
          const { data: prof } = await admin
            .from('profiles')
            .select('xp')
            .eq('id', xpUserIdToDebit)
            .single();
          if (prof) {
            const newXp = Math.max(0, prof.xp - xpSpent);
            await admin.from('profiles').update({ xp: newXp }).eq('id', xpUserIdToDebit);
          }
        }
      } catch (err: any) {
        console.warn('[create-payment-link] xp debit failed:', err?.message);
      }
    }

    // Marquer le reward comme utilisé (best-effort, non-bloquant)
    if (rewardSpinId) {
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await admin
            .from('wheel_spins')
            .update({ used_at: new Date().toISOString() })
            .eq('id', rewardSpinId);
        }
      } catch (err: any) {
        console.warn('[create-payment-link] mark used failed:', err?.message);
      }
    }

    return res.status(200).json({
      url: data.payment_link?.url,
      orderId: data.payment_link?.order_id,
    });
  } catch (error: any) {
    console.error('Create payment link failed', error);
    return res.status(500).json({ error: error?.message ?? 'Erreur serveur' });
  }
}
