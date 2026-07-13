// Helpers produit purs (sans état React) — extraits d'App.tsx pour être
// réutilisables et testables. Le type SelectedProduct était dupliqué dans
// App.tsx et ProductModalV2.tsx : source unique ici.
import type { Product, ComboSelectionConfig } from './menu';

// Un produit + le contexte de sa catégorie (posé à l'ouverture de la fiche).
export type SelectedProduct = Product & {
  categoryId: string;
  categoryName: string;
  categoryAccent: string;
  categoryPriceLabel: string;
};

// Prix de base (en centimes) d'un produit pour une option donnée. Retombe sur
// le basePriceCents, sinon la 1re option, sinon 0.
export function getConfiguredBasePrice(product: Product, optionLabel = ''): number {
  if (optionLabel && product.options?.length) {
    const option = product.options.find((opt) => opt.label === optionLabel);
    if (option) return option.priceCents;
  }
  return product.basePriceCents ?? product.options?.[0]?.priceCents ?? 0;
}

// Libellé de la section d'options selon la catégorie (topping / recette / format).
export function getOptionSectionLabel(product: SelectedProduct): string {
  if (product.categoryId === 'waffles') return 'Choix du topping';
  if (product.categoryId === 'hot' && product.name === 'Café gourmet') {
    return 'Choix de la recette';
  }
  return 'Choix de format';
}

// Option par défaut d'un produit dans un combo (option fixée sinon 1re option).
export function getDefaultOptionForComboProduct(
  product: SelectedProduct | undefined,
  config: ComboSelectionConfig,
): string {
  if (config.fixedOptionLabel) return config.fixedOptionLabel;
  if (product?.options?.length) return product.options[0].label;
  return '';
}
