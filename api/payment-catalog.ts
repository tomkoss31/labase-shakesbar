export function normalizeCatalogKey(value: string = '') {
  return value
    .normalize('NFKC')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNormalizedPriceMap(entries: Array<[string, number]>) {
  return Object.fromEntries(
    entries.map(([key, value]) => [normalizeCatalogKey(key), value]),
  );
}

function buildNormalizedAmountMap(entries: Array<[string, number[]]>) {
  return entries.reduce<Record<string, number[]>>((acc, [key, values]) => {
    const normalizedKey = normalizeCatalogKey(key);
    const existing = acc[normalizedKey] ?? [];

    acc[normalizedKey] = Array.from(new Set([...existing, ...values])).sort(
      (a, b) => a - b,
    );

    return acc;
  }, {});
}

const productPriceEntries: Array<[string, number]> = [
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
  ['Hydrat’Max', 690],
  ['Casse Grippe', 690],
  ['Limonade Rose', 690],
  ['Digest', 690],
];

const optionPriceEntries: Array<[string, number]> = [
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

const comboPriceEntries: Array<[string, number]> = [
  ['Combo Medium', 1480],
  ['Combo Power', 1590],
  ['Tea Time', 1090],
  ['Coffee Break', 1090],
  ['Choco Cocoon', 1190],
  ['Gourmet Break', 1390],
];

const productAllowedAmountEntries: Array<[string, number[]]> = [
  ['Choco Buenos', [890]],
  ['M&M', [890]],
  ['Casse Noisette', [890]],
  ['Cappuccino', [890]],
  ['Pina Colada', [890]],
  ['Fraise Bonbon', [890]],
  ["Pim's", [890]],
  ['Tarte à la pomme', [890]],
  ['Snickers', [890]],
  ['Full Oréo', [890]],
  ['Speculoos', [890]],
  ['Banana Split', [890]],
  ['Banana Noisette', [890]],
  ['Cookies', [890]],
  ['Tropical', [890]],
  ['Apple Kiss', [690, 890]],
  ['Black Panther', [690, 890]],
  ['Cherry White Grappe', [690, 890]],
  ['Electric Blue', [690, 890]],
  ['Elf', [690, 890]],
  ['La Vie en Rose', [690, 890]],
  ["L'Exotic", [690, 890]],
  ['Perroquet', [690, 890]],
  ['Pina Colada', [690, 890]],
  ['Po Melon', [690, 890]],
  ['Red Paradize', [690, 890]],
  ['Soleil', [690, 890]],
  ['Sortilège Noir', [690, 890]],
  ['Electro’Lyte', [690, 890]],
  ['Hydrat’Max', [690]],
  ['Casse Grippe', [690]],
  ['Limonade Rose', [690]],
  ['Digest', [690]],
  ['Café', [390, 590]],
  ['Thé', [390, 590]],
  ['Chocolat chaud protéiné', [590, 690]],
  ['Café gourmet', [890]],
  ['Gaufre healthy', [690]],
  ['Combo Medium', [1480]],
  ['Combo Power', [1590]],
  ['Tea Time', [1090]],
  ['Coffee Break', [1090]],
  ['Choco Cocoon', [1190]],
  ['Gourmet Break', [1390]],
];

export const normalizedProductPrices =
  buildNormalizedPriceMap(productPriceEntries);
export const normalizedOptionPrices =
  buildNormalizedPriceMap(optionPriceEntries);
export const normalizedComboPrices = buildNormalizedPriceMap(comboPriceEntries);
export const normalizedProductAllowedAmounts =
  buildNormalizedAmountMap(productAllowedAmountEntries);
