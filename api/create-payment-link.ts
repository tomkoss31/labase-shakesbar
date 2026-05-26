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

// Produits avec basePriceCents (smoothies 890, santé 690)
const PRODUCT_PRICE_ENTRIES: Array<[string, number]> = [
  ['Choco Buenos', 890], ['M&M', 890], ['Casse Noisette', 890], ['Cappuccino', 890],
  ['Pina Colada', 890], ['Fraise Bonbon', 890], ["Pim's", 890], ['Tarte à la pomme', 890],
  ['Snickers', 890], ['Full Oréo', 890], ['Speculoos', 890], ['Banana Split', 890],
  ['Banana Noisette', 890], ['Cookies', 890], ['Tropical', 890],
  ['Hydrat’Max', 690], ['Casse Grippe', 690], ['Limonade Rose', 690], ['Digest', 690],
];

// Options : drinks 2 formats, café/thé, café gourmet, gaufre toppings
const OPTION_PRICE_ENTRIES: Array<[string, number]> = [
  ['Medium 550ml — 6,90€', 690],
  ['Large 950ml — 8,90€', 890],
  ['Petit 250ml — 3,90€', 390],
  ['Grand 450ml — 5,90€', 590],
  ['Petit 250ml — 5,90€', 590],
  ['Grand 450ml — 6,90€', 690],
  ['Macchiato — 650ml — 8,90€', 890],
  ['Choco mocha — 650ml — 8,90€', 890],
  ['Latte noisette — 650ml — 8,90€', 890],
  ['Vanille latte — 650ml — 8,90€', 890],
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
  ['Booster immunité', 250],
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

    const squarePayload: any = {
      idempotency_key: randomUUID(),
      order: {
        location_id: locationId,
        line_items: lineItems,
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

    return res.status(200).json({
      url: data.payment_link?.url,
      orderId: data.payment_link?.order_id,
    });
  } catch (error: any) {
    console.error('Create payment link failed', error);
    return res.status(500).json({ error: error?.message ?? 'Erreur serveur' });
  }
}
