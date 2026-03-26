import {
  comboPrices,
  normalizedComboPrices,
  normalizedOptionPrices,
  normalizedProductPrices,
  normalizeCatalogKey,
  optionPrices,
  productPrices,
} from '../src/data/pricing';

type CartItemPayload = {
  name?: string;
  categoryName?: string;
  quantity?: number;
  option?: string;
  unitPriceCents?: number;
  extras?: string[];
};

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

    const cart = req.body?.cart;

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

    const getBaseAmount = (item: CartItemPayload) => {
      if (item.categoryName === 'Formule combo') {
        const comboAmount =
          (item.name ? comboPrices[item.name] : undefined) ??
          normalizedComboPrices[normalizeCatalogKey(item.name)] ??
          (Number.isFinite(Number(item.unitPriceCents))
            ? Number(item.unitPriceCents)
            : undefined);

        if (!comboAmount) {
          throw new Error(`Combo inconnu: ${item.name}`);
        }

        return comboAmount;
      }

      const optionAmount =
        (item.option ? optionPrices[item.option] : undefined) ??
        normalizedOptionPrices[normalizeCatalogKey(item.option)];

      if (optionAmount) {
        return optionAmount;
      }

      const productAmount =
        (item.name ? productPrices[item.name] : undefined) ??
        normalizedProductPrices[normalizeCatalogKey(item.name)];

      if (productAmount) {
        return productAmount;
      }

      throw new Error(`Produit inconnu: ${item.name}`);
    };

    const lineItems = cart.map((item: CartItemPayload) => {
      const quantity = Number(item.quantity || 1);
      const baseAmount = getBaseAmount(item);

      const extrasTotal = Array.isArray(item.extras)
        ? item.extras.reduce((sum: number, extra: string) => {
            return sum + (extraPrices[extra] || 0);
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

    const body = {
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        line_items: lineItems,
      },
      checkout_options: {
        redirect_url: 'https://labase-shakesbar.vercel.app/?payment=success',
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
        body: JSON.stringify(body),
      },
    );

    const data = await squareResponse.json();

    if (!squareResponse.ok) {
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
    return res.status(500).json({
      error: error.message || 'Erreur serveur',
    });
  }
}
