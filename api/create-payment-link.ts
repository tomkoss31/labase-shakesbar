import { randomUUID } from 'node:crypto';
import {
  normalizedComboPrices,
  normalizedOptionPrices,
  normalizedProductPrices,
  normalizeCatalogKey,
} from '../src/data/pricing-catalog';

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
    return JSON.parse(req.body || '{}');
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

  return 'https://labase-shakesbar.vercel.app';
}

// Extras non présents dans le menu UI mais possiblement envoyés par d'anciens clients.
// Conservés ici pour ne pas casser une commande en transit.
const extraPrices: Record<string, number> = {
  Collagène: 250,
  'Booster immunité': 250,
  'Fibres à la pomme': 250,
  Probiotiques: 250,
  Électrolytes: 250,
  Créatine: 250,
  Protéines: 250,
};

const normalizedExtraPrices = Object.fromEntries(
  Object.entries(extraPrices).map(([key, value]) => [normalizeCatalogKey(key), value]),
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      return res.status(500).json({
        error: 'Variables Square manquantes dans Vercel',
      });
    }

    const bodyPayload = getBody(req);
    const cart = bodyPayload?.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        error: 'Panier vide ou invalide',
      });
    }

    const getBaseAmount = (item: CartItemPayload) => {
      if (item.categoryName === 'Formule combo') {
        const key = normalizeCatalogKey(item.name);
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

      const optionAmount = normalizedOptionPrices[normalizeCatalogKey(item.option)];
      if (optionAmount) return optionAmount;

      const productAmount = normalizedProductPrices[normalizeCatalogKey(item.name)];
      if (productAmount) return productAmount;

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
              (extraPrices[extra] ?? normalizedExtraPrices[normalizeCatalogKey(extra)] ?? 0)
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

    // Récupération de l'email utilisateur (si connecté) pour que le webhook
    // Square puisse associer le paiement à un compte et créditer XP / VIP
    const userEmail = typeof bodyPayload?.userEmail === 'string' ? bodyPayload.userEmail.trim().toLowerCase() : undefined;
    const customerName = typeof bodyPayload?.customerName === 'string' ? bodyPayload.customerName.trim() : undefined;

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

    // Si on a l'email du user authentifié, on l'ajoute pour le matching webhook
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
      return res.status(500).json({
        error: 'Erreur Square',
        details: data,
      });
    }

    return res.status(200).json({
      url: data.payment_link?.url,
      orderId: data.payment_link?.order_id,
    });
  } catch (error: any) {
    console.error('Create payment link failed', error);
    return res.status(500).json({
      error: error.message || 'Erreur serveur',
    });
  }
}
