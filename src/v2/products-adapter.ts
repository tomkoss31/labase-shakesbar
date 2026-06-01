// Adapter : transforme les vraies données menu.ts en structure exploitable
// par les composants v2 (ProductCard, ComboCard). Conserve la cohérence
// d'IDs pour brancher avec la logique panier existante.

import {
  categories,
  comboOffers,
  featuredSelections,
  type Product,
  type Category,
  type ComboOffer,
} from '../data/menu';

export type V2Product = {
  id: string;
  name: string;
  sub: string;
  price: number;
  startingPrice?: number;
  badge?: string;
  image?: string;
  categoryId: string;
  categoryName: string;
  raw: Product;
  category: Category;
};

export type V2Combo = {
  id: string;
  name: string;
  sub: string;
  price: number;
  save: number;
  image?: string;
  raw: ComboOffer;
};

function getProductPrice(p: Product): number {
  if (typeof p.basePriceCents === 'number') return p.basePriceCents / 100;
  if (p.options?.length) return Math.min(...p.options.map((o) => o.priceCents)) / 100;
  return 0;
}

function getProductSub(p: Product, category: Category): string {
  // Extraire les infos clé du `flavors` du menu.ts existant
  const flavors = p.flavors || '';
  // On veut une description courte type "24g protéines · 250 kcal"
  const matches = flavors.match(/(\d+g\s*prot[ée]ines?|\d+\s*calories?|\d+\s*kcal)/gi);
  if (matches && matches.length > 0) {
    return matches.slice(0, 2).join(' · ');
  }
  // Fallback : utiliser le début de flavors avant le premier "•"
  const firstPart = flavors.split('•')[0]?.trim();
  if (firstPart && firstPart.length < 50) return firstPart;
  return category.name;
}

function adaptProduct(p: Product, category: Category): V2Product {
  return {
    id: `${category.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: p.name,
    sub: getProductSub(p, category),
    price: getProductPrice(p),
    startingPrice: getProductPrice(p),
    badge: p.badge,
    image: p.image,
    categoryId: category.id,
    categoryName: category.name,
    raw: p,
    category,
  };
}

// Catégories sources
const smoothiesCat = categories.find((c) => c.id === 'smoothies');
const drinksCat = categories.find((c) => c.id === 'drinks');
const hotCat = categories.find((c) => c.id === 'hot');
const wafflesCat = categories.find((c) => c.id === 'waffles');
const healthCat = categories.find((c) => c.id === 'health');
const kidsCat = categories.find((c) => c.id === 'kids');

// Liste plate de tous les produits avec leur catégorie
export const ALL_V2_PRODUCTS: V2Product[] = categories.flatMap((category) =>
  category.items.map((item) => adaptProduct(item, category)),
);

// Helper : trouve un produit par son nom
export function findV2ProductByName(name: string): V2Product | undefined {
  return ALL_V2_PRODUCTS.find((p) => p.name === name);
}

// Nouveautés : tous les produits badgés "Nouveau" (carrousel d'accueil)
export const V2_NEW: V2Product[] = ALL_V2_PRODUCTS.filter((p) => p.badge === 'Nouveau');

// Populaires : utilise featuredSelections du menu.ts, fallback sur premiers smoothies + drinks
export const V2_POPULAR: V2Product[] = (() => {
  const fromFeatured = featuredSelections
    .map((f) => findV2ProductByName(f.name))
    .filter((p): p is V2Product => Boolean(p));

  if (fromFeatured.length >= 4) return fromFeatured;

  // Fallback : prendre les premiers smoothies et drinks
  const fallback = [
    ...(smoothiesCat?.items.slice(0, 4).map((p) => adaptProduct(p, smoothiesCat)) || []),
    ...(drinksCat?.items.slice(0, 2).map((p) => adaptProduct(p, drinksCat)) || []),
  ];
  return [...fromFeatured, ...fallback].slice(0, 6);
})();

export const V2_SMOOTHIES: V2Product[] = smoothiesCat
  ? smoothiesCat.items.map((p) => adaptProduct(p, smoothiesCat))
  : [];

export const V2_DRINKS: V2Product[] = drinksCat
  ? drinksCat.items.map((p) => adaptProduct(p, drinksCat))
  : [];

export const V2_HOT: V2Product[] = hotCat
  ? hotCat.items.map((p) => adaptProduct(p, hotCat))
  : [];

export const V2_HEALTH: V2Product[] = healthCat
  ? healthCat.items.map((p) => adaptProduct(p, healthCat))
  : [];

export const V2_KIDS: V2Product[] = kidsCat
  ? kidsCat.items.map((p) => adaptProduct(p, kidsCat))
  : [];

export const V2_WAFFLES: V2Product[] = wafflesCat
  ? wafflesCat.items.map((p) => adaptProduct(p, wafflesCat))
  : [];

// Combos
export const V2_COMBOS: V2Combo[] = comboOffers.map((c) => ({
  id: c.id,
  name: c.name,
  sub: c.subtitle,
  price: c.priceCents / 100,
  save: (c.normalPriceCents - c.priceCents) / 100,
  image: c.image,
  raw: c,
}));

// Catégories pour les chips (alignées avec menu.ts)
export const V2_CHIP_CATEGORIES = [
  { id: 'all', label: 'Tout', icon: '' },
  { id: 'popular', label: 'Populaires', icon: '🔥' },
  { id: 'smoothies', label: 'Smoothies', icon: '🥤' },
  { id: 'drinks', label: 'Drinks', icon: '⚡' },
  { id: 'hot', label: 'Hot', icon: '☕' },
  { id: 'waffles', label: 'Gaufre', icon: '🧇' },
  { id: 'health', label: 'Santé', icon: '💧' },
  { id: 'kids', label: 'Enfants', icon: '🧒' },
  { id: 'combos', label: 'Combos', icon: '🎯' },
];

// Hero slides — combos + nouveaux + avis Google
const heroFeaturedCombo = V2_COMBOS.find((c) => c.id === 'combo-power') ?? V2_COMBOS[0];
const heroFeaturedProduct = findV2ProductByName('Choco Buenos') ?? V2_POPULAR[0];

export type V2HeroSlide = {
  type: 'combo' | 'new' | 'review';
  tag: string;
  title: string;
  sub: string;
  price?: string;
  strike?: string;
  save?: string;
  cta: string;
  product: V2Product | null;
  combo: V2Combo | null;
};

function fmtEuro(amount: number) {
  return `${amount.toFixed(2).replace('.', ',')}€`;
}

export const V2_HERO_SLIDES: V2HeroSlide[] = [
  {
    type: 'combo',
    tag: 'Combo signature',
    title: heroFeaturedCombo?.name ?? 'Combo Power',
    sub: heroFeaturedCombo?.sub ?? '',
    price: heroFeaturedCombo ? fmtEuro(heroFeaturedCombo.price) : undefined,
    strike: heroFeaturedCombo ? fmtEuro(heroFeaturedCombo.price + heroFeaturedCombo.save) : undefined,
    save: heroFeaturedCombo ? `−${fmtEuro(heroFeaturedCombo.save)}` : undefined,
    cta: 'Composer',
    product: null,
    combo: heroFeaturedCombo ?? null,
  },
  {
    type: 'new',
    tag: 'Recette signature',
    title: heroFeaturedProduct?.name ?? 'Choco Buenos',
    sub: heroFeaturedProduct?.sub ?? '',
    price: heroFeaturedProduct ? fmtEuro(heroFeaturedProduct.price) : undefined,
    cta: 'Découvrir',
    product: heroFeaturedProduct ?? null,
    combo: null,
  },
  {
    type: 'review',
    tag: '4,9 / 5 sur Google',
    title: '« Les meilleurs shakes de Verdun »',
    sub: 'Avis vérifiés · Note moyenne 4,9',
    cta: 'Laisser un avis',
    product: null,
    combo: null,
  },
];
