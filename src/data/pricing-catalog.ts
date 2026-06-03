// Catalogue de prix PUR — sans aucun import React, lucide ou autre.
// Utilisable côté serverless Vercel (api/) ET côté front (src/).
// Source de vérité unique pour les montants envoyés à Square.
//
// IMPORTANT : à mettre à jour en parallèle de :
// - src/data/menu.ts (source UI)
// - api/create-payment-link.ts (catalogue inliné dans la route serverless,
//   nécessaire pour éviter le piège de bundling ESM Vercel)

export function normalizeCatalogKey(value: string = ''): string {
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

// ─── Produits avec basePriceCents ─────────────────────────────────
const productPriceEntries: Array<[string, number]> = [
  // Smoothies (890)
  ["M&M's", 890],
  ['Bueno', 890],
  ['Casse Noisette', 890],
  ['Cappuccino', 890],
  ['Pina Colada', 890],
  ['Fraise bonbon', 890],
  ["Pim's", 890],
  ['Tarte à la pomme', 890],
  ['Snickers', 890],
  ['Full Oréo', 890],
  ['Speculoos', 890],
  ['Banana Split', 890],
  ['Banana Noisette', 890],
  ['Cookies', 890],
  ['Tropical', 890],
  // Boissons enfants (500 = 5€, sans énergisant)
  ['Bulle de Fée', 500],
  ['Spiderman', 500],
  ['Stitch', 500],
  ['Licorne', 500],
  ['Hulk', 500],
  ['Tropicool', 500],
  ['Jungle Kid', 500],
  // Café glacé simple (690)
  ['Café glacé simple', 690],
  // Post workout (590)
  ['Post Workout', 590],
];

// ─── Options ──────────────────────────────────────────────────────
const optionPriceEntries: Array<[string, number]> = [
  // Drinks & santé & sportifs format Start / Boost
  ['Start 550ml — 6,90€', 690],
  ['Boost 950ml — 8,90€', 890],
  // Café / Thé Aloé Vera (petit / grand)
  ['Petit 250ml — 3,90€', 390],
  ['Grand 450ml — 5,90€', 590],
  // Chocolat chaud protéiné (nature ou saveur)
  ['Nature — 5,90€', 590],
  ['Saveur Noisette — 6,40€', 640],
  ['Saveur Spéculoos — 6,40€', 640],
  ['Saveur Caramel — 6,40€', 640],
  ['Saveur Vanille — 6,40€', 640],
  ['Saveur Cookie — 6,40€', 640],
  // Café gourmet glacé (4 recettes)
  ['Macchiato — 650ml — 8,90€', 890],
  ['Choco Mocha — 650ml — 8,90€', 890],
  ['Latte aux Noisettes — 650ml — 8,90€', 890],
  ['Vanille Latte — 650ml — 8,90€', 890],
  // Gaufre healthy (toppings)
  ['Miel — 6,90€', 690],
  ['Chocolat — 6,90€', 690],
  ['Chocolat blanc — 6,90€', 690],
  ['Caramel — 6,90€', 690],
  ['Caramel beurre salé — 6,90€', 690],
];

// ─── Combos ────────────────────────────────────────────────────────
const comboPriceEntries: Array<[string, number]> = [
  ['Combo Medium', 1480],
  ['Combo Power', 1590],
  ['Tea Time', 1090],
  ['Coffee Break', 1090],
  ['Choco Cocoon', 1190],
  ['Gourmet Break', 1390],
];

// ─── Extras (+2,50€) ───────────────────────────────────────────────
const extraPriceEntries: Array<[string, number]> = [
  ['Collagène', 250],
  ['Booster Immunité', 250],
  ['Fibres à la pomme', 250],
  ['Probiotiques', 250],
  ['Électrolytes', 250],
  ['Créatine', 250],
  ['Protéines', 250],
];

function build(entries: Array<[string, number]>): Record<string, number> {
  return Object.fromEntries(entries);
}

function buildNormalized(entries: Array<[string, number]>): Record<string, number> {
  return Object.fromEntries(entries.map(([k, v]) => [normalizeCatalogKey(k), v]));
}

export const productPrices = build(productPriceEntries);
export const optionPrices = build(optionPriceEntries);
export const comboPrices = build(comboPriceEntries);
export const extraPrices = build(extraPriceEntries);

export const normalizedProductPrices = buildNormalized(productPriceEntries);
export const normalizedOptionPrices = buildNormalized(optionPriceEntries);
export const normalizedComboPrices = buildNormalized(comboPriceEntries);
export const normalizedExtraPrices = buildNormalized(extraPriceEntries);
