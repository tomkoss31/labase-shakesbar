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

    // Table de prix fiable côté serveur
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

      'Cherry White Grappe': 690,
      'Red Paradize': 690,
      'Electric Blue': 690,
      'Pomelon': 690,
      'Tonic Mandarine': 690,
      'Apple Kiss': 690,
      'Soleil': 690,
      'Black Panther': 690,
      "L'Exotic": 690,
      "T'Coco": 690,
      'Elf': 690,
      'Perroquet': 690,
      'La Vie en Rose': 690,
      'Sortilège Noir': 690,

      'Hydrat’Max': 690,
      'Casse Grippe': 690,
      'Limonade Rose': 690,
      'Digest': 690,

      'Bulle de Fée': 500,
      'Spiderman': 500,
      'Stitch': 500,
      'Licorne': 500,
      'Hulk': 500,
      'Tropicool': 500,

      'Café chaud': 390,
      'Chocolat chaud': 690,
      'Thé aloe vera chaud': 390,
      'Café gourmand glacé': 590,
      'Café glacé': 690,

      'Electro’Lyte': 590,
      'Post Workout': 890,
    };

    const extraPrices: Record<string, number> = {
      Collagène: 250,
      'Booster immunité': 250,
      'Fibres à la pomme': 250,
      Probiotiques: 250,
      Électrolytes: 250,
      Créatine: 250,
      Protéines: 250,
    };

    const optionPrices: Record<string, number> = {
      'Start 6,90€': 690,
      'Boost 8,90€': 890,
    };

    const lineItems = cart.map((item: any) => {
      const quantity = Number(item.quantity || 1);

      let baseAmount =
        optionPrices[item.option] ??
        productPrices[item.name];

      if (!baseAmount) {
        throw new Error(`Produit inconnu: ${item.name}`);
      }

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
        redirect_url: 'https://www.labase-nutrition.com/shakesbar',
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
      }
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