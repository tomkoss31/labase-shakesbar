import { randomUUID } from 'node:crypto';
import {
  normalizedComboPrices,
  normalizedOptionPrices,
  normalizedProductAllowedAmounts,
  normalizedProductPrices,
  normalizeCatalogKey,
} from './payment-catalog';

type CartItemPayload = {
  name?: string;
  categoryName?: string;
  quantity?: number;
  option?: string;
  unitPriceCents?: number;
  extras?: string[];
};

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

function getBody(req: any) {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }

  return req.body ?? {};
}

function getCatalogAmount(item: CartItemPayload) {
  if (item.categoryName === 'Formule combo') {
    return normalizedComboPrices[normalizeCatalogKey(item.name)];
  }

  if (item.option) {
    const optionAmount = normalizedOptionPrices[normalizeCatalogKey(item.option)];
    if (optionAmount) return optionAmount;
  }

  return normalizedProductPrices[normalizeCatalogKey(item.name)];
}

function getAllowedProductAmounts(item: CartItemPayload) {
  return normalizedProductAllowedAmounts[normalizeCatalogKey(item.name)] ?? [];
}

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

    const extraPrices: Record<string, number> = {
      'Collagène': 250,
      'Booster immunité': 250,
      'Fibres à la pomme': 250,
      'Probiotiques': 250,
      'Électrolytes': 250,
      'Créatine': 250,
      'Protéines': 250,
    };

    const lineItems = cart.map((item: CartItemPayload) => {
      const quantity = Number(item.quantity || 1);
      const clientAmount = Number(item.unitPriceCents);
      const catalogAmount = getCatalogAmount(item);
      const allowedProductAmounts = getAllowedProductAmounts(item);

      if (!item.name || !Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Article invalide dans le panier');
      }

      if (!Number.isInteger(clientAmount) || clientAmount <= 0) {
        throw new Error(`Montant invalide pour l'article: ${item.name}`);
      }

      if (!Number.isInteger(catalogAmount) || catalogAmount <= 0) {
        if (!allowedProductAmounts.includes(clientAmount)) {
          throw new Error(`Article inconnu dans le catalogue: ${item.name}`);
        }
      } else if (catalogAmount !== clientAmount) {
        throw new Error(`Montant incohérent pour l'article: ${item.name}`);
      }

      const extrasTotal = Array.isArray(item.extras)
        ? item.extras.reduce((sum: number, extra: string) => {
            return sum + (extraPrices[extra] || 0);
          }, 0)
        : 0;

      const totalUnitAmount = clientAmount + extrasTotal;
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

    const squarePayload = {
      idempotency_key: randomUUID(),
      order: {
        location_id: locationId,
        line_items: lineItems,
      },
      checkout_options: {
        redirect_url: `${getRequestOrigin(req)}/?payment=success`,
      },
    };

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

    const data = await squareResponse.json();

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
