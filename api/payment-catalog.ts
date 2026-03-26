import { categories, comboOffers } from '../src/data/menu';

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
  return Object.fromEntries(
    entries.map(([key, values]) => [
      normalizeCatalogKey(key),
      Array.from(new Set(values)).sort((a, b) => a - b),
    ]),
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
  category.items.flatMap(
    (item) =>
      item.options?.map((option) => [option.label, option.priceCents] as [string, number]) ??
      [],
  ),
);

const comboPriceEntries: Array<[string, number]> = comboOffers.map((combo) => [
  combo.name,
  combo.priceCents,
]);

const productAllowedAmountEntries: Array<[string, number[]]> = categories.flatMap(
  (category) =>
    category.items.map((item) => {
      const amounts = [
        ...(typeof item.basePriceCents === 'number' ? [item.basePriceCents] : []),
        ...(item.options?.map((option) => option.priceCents) ?? []),
      ];

      return [item.name, amounts] as [string, number[]];
    }),
);

export const normalizedProductPrices =
  buildNormalizedPriceMap(productPriceEntries);
export const normalizedOptionPrices = buildNormalizedPriceMap(optionPriceEntries);
export const normalizedComboPrices = buildNormalizedPriceMap(comboPriceEntries);
export const normalizedProductAllowedAmounts =
  buildNormalizedAmountMap(productAllowedAmountEntries);
