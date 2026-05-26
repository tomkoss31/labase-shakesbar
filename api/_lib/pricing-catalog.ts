// Catalogue de prix PUR — sans aucun import React, lucide ou autre.
// Utilisable côté serverless Vercel (api/) ET côté front (src/).
// Source de vérité unique pour les montants envoyés à Square.
//
// IMPORTANT : à mettre à jour en parallèle de src/data/menu.ts quand on ajoute/
// retire un produit ou qu'on change un prix. Le fichier menu.ts reste la
// source UI (avec les icons, descriptions, badges, etc.), ce fichier-ci est
// la source PRIX uniquement.

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

// ─── Produits avec basePriceCents (smoothies, santé) ────────────────
const productPriceEntries: Array<[string, number]> = [
  // Smoothies (890)
  ['Choco Buenos', 890],
  ['M&M', 890],
  ['Casse Noisette', 890],
  ['Cappuccino', 890],
  ['Pina Colada', 890],
  ['Fraise Bonbon', 890],
  ["Pim's", 890],
  ['Tarte à la pomme', 890],
  ['Snickers', 890],
  ['Full Oréo', 890],
  ['Speculoos', 890],
  ['Banana Split', 890],
  ['Banana Noisette', 890],
  ['Cookies', 890],
  ['Tropical', 890],
  // Boissons santé (690)
  ['Hydrat’Max', 690],
  ['Casse Grippe', 690],
  ['Limonade Rose', 690],
  ['Digest', 690],
];

// ─── Options (drinks Medium/Large, gaufre toppings, café gourmet, etc.) ─
const optionPriceEntries: Array<[string, number]> = [
  // Drinks énergisants 2 formats
  ['Medium 550ml — 6,90€', 690],
  ['Large 950ml — 8,90€', 890],
  // Café & thé classique
  ['Petit 250ml — 3,90€', 390],
  ['Grand 450ml — 5,90€', 590],
  // Chocolat chaud protéiné
  ['Petit 250ml — 5,90€', 590],
  ['Grand 450ml — 6,90€', 690],
  // Café gourmet
  ['Macchiato — 650ml — 8,90€', 890],
  ['Choco mocha — 650ml — 8,90€', 890],
  ['Latte noisette — 650ml — 8,90€', 890],
  ['Vanille latte — 650ml — 8,90€', 890],
  // Gaufre healthy toppings
  ['Miel — 6,90€', 690],
  ['Chocolat — 6,90€', 690],
  ['Chocolat blanc — 6,90€', 690],
  ['Caramel — 6,90€', 690],
  ['Caramel beurre salé — 6,90€', 690],
];

// ─── Combos ─────────────────────────────────────────────────────────
const comboPriceEntries: Array<[string, number]> = [
  ['Combo Medium', 1480],
  ['Combo Power', 1590],
  ['Tea Time', 1090],
  ['Coffee Break', 1090],
  ['Choco Cocoon', 1190],
  ['Gourmet Break', 1390],
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

export const normalizedProductPrices = buildNormalized(productPriceEntries);
export const normalizedOptionPrices = buildNormalized(optionPriceEntries);
export const normalizedComboPrices = buildNormalized(comboPriceEntries);
