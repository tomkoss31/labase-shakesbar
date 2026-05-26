import { categories, comboOffers } from './menu';

export function normalizeCatalogKey(value: string = '') {
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

function buildPriceMap(entries: Array<[string, number]>) {
  return Object.fromEntries(entries);
}

function buildNormalizedPriceMap(entries: Array<[string, number]>) {
  return Object.fromEntries(
    entries.map(([key, value]) => [normalizeCatalogKey(key), value]),
  );
}

const productPriceEntries: Array<[string, number]> = categories.flatMap((category) =>
  category.items.flatMap((item) =>
    typeof item.basePriceCents === 'number'
      ? ([[item.name, item.basePriceCents]] as Array<[string, number]>)
      : [],
  ),
);

const optionPriceEntries: Array<[string, number]> = categories.flatMap((category) =>
  category.items.flatMap((item) =>
    item.options?.map((option) => [option.label, option.priceCents] as [string, number]) ??
    [],
  ),
);

const comboPriceEntries: Array<[string, number]> = comboOffers.map((combo) => [
  combo.name,
  combo.priceCents,
]);

export const productPrices = buildPriceMap(productPriceEntries);
export const optionPrices = buildPriceMap(optionPriceEntries);
export const comboPrices = buildPriceMap(comboPriceEntries);

export const normalizedProductPrices = buildNormalizedPriceMap(productPriceEntries);
export const normalizedOptionPrices = buildNormalizedPriceMap(optionPriceEntries);
export const normalizedComboPrices = buildNormalizedPriceMap(comboPriceEntries);
