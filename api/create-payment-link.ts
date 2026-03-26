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

    const { cart } = req.body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        error: 'Panier vide ou invalide',
      });
    }

    const normalizeKey = (value: string = '') =>
      value
        .normalize('NFKC')
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .trim();

    const productPrices: Record<string, number> = {
      'Choco Buenos': 890,
      'M&M': 890,
      'Casse Noisette': 890,
      'Cappuccino': 890,
      'Pina Colada': 890,
      'Fraise Bonbon': 890,
      "Pim's": 890,
      'Tarte à la pomme': 890,
      'Snickers': 890,
      'Full Oréo': 890,
      'Speculoos': 890,
      'Banana Split': 890,
      'Banana Noisette': 890,
      'Cookies': 890,
      'Tropical': 890,

      'Apple Kiss': 690,
      'Black Panther': 690,
      'Cherry White Grappe': 690,
      'Electric Blue': 690,
      'Elf': 690,
      'La Vie en Rose': 690,
      "L'Exotic": 690,
      'Perroquet': 690,
      'Po Melon': 690,
      'Red Paradize': 690,
      'Soleil': 690,
      'Sortilège Noir': 690,
      'Electro’Lyte': 690,

      'Hydrat’Max': 690,
      'Casse Grippe': 690,
      'Limonade Rose': 690,
      'Digest': 690,

      'Gaufre healthy': 690,
    };

    const comboPrices: Record<string, number> = {
      'Combo Medium': 1480,
      'Combo Power': 1590,
      'Tea Time': 1090,
      'Coffee Break': 1090,
      'Choco Cocoon': 1190,
      'Gourmet Break': 1390,
    };

    const extraPrices: Record<string, number> = {
      'Collagène': 250,
      'Booster immunité': 250,
      'Fibres à la pomme': 250,
      'Probiotiques': 250,
      'Électrolytes': 250,
      'Créatine': 250,
      'Protéines': 250,
    };

    const optionPrices: Record<string, number> = {
      'Medium 550ml — 6,90€': 690,
      'Large 950ml — 8,90€': 890,

      'Petit 250ml — 3,90€': 390,
      'Grand 450ml — 5,90€': 590,

      'Petit 250ml — 5,90€': 590,
      'Grand 450ml — 6,90€': 690,

      'Macchiato — 650ml — 8,90€': 890,
      'Choco mocha — 650ml — 8,90€': 890,
      'Latte noisette — 650ml — 8,90€': 890,
      'Vanille latte — 650ml — 8,90€': 890,

      'Miel — 6,90€': 690,
      'Chocolat — 6,90€': 690,
      'Chocolat blanc — 6,90€': 690,
      'Caramel — 6,90€': 690,
      'Caramel beurre salé — 6,90€': 690,
    };

    const normalizedProductPrices = Object.fromEntries(
      Object.entries(productPrices).map(([key, value]) => [normalizeKey(key), value]),
    );

    const normalizedComboPrices = Object.fromEntries(
      Object.entries(comboPrices).map(([key, value]) => [normalizeKey(key), value]),
    );

    const normalizedOptionPrices = Object.fromEntries(
      Object.entries(optionPrices).map(([key, value]) => [normalizeKey(key), value]),
    );

    const getBaseAmount = (item: any) => {
      if (item.categoryName === 'Formule combo') {
        const comboAmount =
          comboPrices[item.name] ??
          normalizedComboPrices[normalizeKey(item.name)] ??
          (Number.isFinite(Number(item.unitPriceCents))
            ? Number(item.unitPriceCents)
            : undefined);

        if (!comboAmount) {
          throw new Error(`Combo inconnu: ${item.name}`);
        }

        return comboAmount;
      }

      const optionAmount =
        optionPrices[item.option] ??
        normalizedOptionPrices[normalizeKey(item.option)];

      if (optionAmount) {
        return optionAmount;
      }

      const productAmount =
        productPrices[item.name] ??
        normalizedProductPrices[normalizeKey(item.name)];

      if (productAmount) {
        return productAmount;
      }

      throw new Error(`Produit inconnu: ${item.name}`);
    };

    const lineItems = cart.map((item: any) => {
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