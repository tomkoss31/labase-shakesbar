// La Base Shakes & Drinks — Catalogue produits source de vérité
// Mis à jour depuis les vraies cartes papier du club (2026-05-26).
//
// IMPORTANT : tout changement de prix ou de produit doit aussi être répercuté
// dans api/create-payment-link.ts (qui contient son propre catalogue inliné
// pour éviter les pièges de bundling Vercel ESM/CommonJS).

import type { LucideIcon } from 'lucide-react';
import {
  Coffee,
  Zap,
  Heart,
  Sparkles,
  Trophy,
  Target,
} from 'lucide-react';

export type ProductOption = {
  label: string;
  priceCents: number;
};

export type Product = {
  name: string;
  description: string;
  flavors: string;
  badge?: string;
  image?: string;
  basePriceCents?: number;
  options?: ProductOption[];
};

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  price: string;
  accent: string;
  description: string;
  items: Product[];
};

export type ComboSelectionConfig = {
  label: string;
  categoryId: string;
  fixedProductName?: string;
  allowedProductNames?: string[];
  fixedOptionLabel?: string;
};

export type ComboOffer = {
  id:
    | 'combo-medium'
    | 'combo-power'
    | 'combo-tea-time'
    | 'combo-coffee-break'
    | 'combo-choco-cocoon'
    | 'combo-gourmet-break';
  name: string;
  subtitle: string;
  description: string;
  image: string;
  priceCents: number;
  normalPriceCents: number;
  accent: string;
  primary: ComboSelectionConfig;
  secondary: ComboSelectionConfig;
};

// ─── Extras santé ───────────────────────────────────────────────────
// Ajoutables sur les catégories listées dans CATEGORIES_WITH_EXTRAS.
export type ProductExtra = {
  id: string;
  label: string;
  priceCents: number;
};

export const EXTRAS: ProductExtra[] = [
  { id: 'collagene', label: 'Collagène', priceCents: 250 },
  { id: 'booster-immunite', label: 'Booster Immunité', priceCents: 250 },
  { id: 'fibres', label: 'Fibres à la pomme', priceCents: 250 },
  { id: 'probiotiques', label: 'Probiotiques', priceCents: 250 },
  { id: 'electrolytes', label: 'Électrolytes', priceCents: 250 },
  { id: 'creatine', label: 'Créatine', priceCents: 250 },
  { id: 'proteines', label: 'Protéines', priceCents: 250 },
];

// Catégories qui acceptent les extras (+2,50€)
export const CATEGORIES_WITH_EXTRAS = ['smoothies', 'drinks', 'health'];

// ─── BRAND ──────────────────────────────────────────────────────────
export const BRAND = {
  name: 'La Base Shakes & Drinks',
  shortName: 'LA BASE',
  pickup: 'Retrait sur place • Verdun',
  prep: 'Commande prête en 5 à 10 min',
  whatsappNumber: '33679448759',
  address: '11 rue Saint Pierre, Verdun',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=11+rue+Saint+Pierre+Verdun',
  discoveryUrl: 'https://linktr.ee/labaseverdun',
};

export const googleReviewUrl = 'https://g.page/r/CeJabN1yW1toEAE/review';
export const instagramUrl = 'https://www.instagram.com/labase_verdun/';

// ─── COMBOS ─────────────────────────────────────────────────────────
export const comboOffers: ComboOffer[] = [
  {
    id: 'combo-medium',
    name: 'Combo Medium',
    subtitle: 'Smoothie + boisson Start',
    description:
      'Une formule complète pour profiter d’un smoothie nutritionnel et d’une boisson énergisante format Start à prix avantage.',
    image: '/images/combo/combo-medium.png',
    priceCents: 1480,
    normalPriceCents: 1580,
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    primary: { label: 'Choisis ton smoothie', categoryId: 'smoothies' },
    secondary: {
      label: 'Choisis ta boisson',
      categoryId: 'drinks',
      fixedOptionLabel: 'Start 550ml — 6,90€',
    },
  },
  {
    id: 'combo-power',
    name: 'Combo Power',
    subtitle: 'Smoothie + boisson Boost',
    description:
      'La formule la plus complète pour associer un smoothie nutritionnel et une grande boisson énergisante.',
    image: '/images/combo/combo-power.png',
    priceCents: 1590,
    normalPriceCents: 1780,
    accent: 'from-fuchsia-500 via-pink-500 to-orange-500',
    primary: { label: 'Choisis ton smoothie', categoryId: 'smoothies' },
    secondary: {
      label: 'Choisis ta boisson',
      categoryId: 'drinks',
      fixedOptionLabel: 'Boost 950ml — 8,90€',
    },
  },
  {
    id: 'combo-tea-time',
    name: 'Tea Time',
    subtitle: 'Thé grand + gaufre topping au choix',
    description:
      'Une formule pause douce et gourmande, idéale pour associer une boisson chaude légère et une gaufre healthy.',
    image: '/images/combo/combo-tea-time.png',
    priceCents: 1090,
    normalPriceCents: 1280,
    accent: 'from-emerald-400 via-lime-400 to-yellow-400',
    primary: {
      label: 'Choisis ton thé',
      categoryId: 'hot',
      allowedProductNames: ['Thé Aloé Vera chaud'],
      fixedOptionLabel: 'Grand 450ml — 5,90€',
    },
    secondary: {
      label: 'Choisis ton topping',
      categoryId: 'waffles',
      fixedProductName: 'Gaufre healthy',
    },
  },
  {
    id: 'combo-coffee-break',
    name: 'Coffee Break',
    subtitle: 'Café grand + gaufre topping au choix',
    description:
      'Une formule simple, lisible et efficace pour une vraie pause café gourmande au club.',
    image: '/images/combo/combo-coffee-break.png',
    priceCents: 1090,
    normalPriceCents: 1280,
    accent: 'from-amber-400 via-orange-400 to-yellow-500',
    primary: {
      label: 'Choisis ton café',
      categoryId: 'hot',
      allowedProductNames: ['Café chaud'],
      fixedOptionLabel: 'Grand 450ml — 5,90€',
    },
    secondary: {
      label: 'Choisis ton topping',
      categoryId: 'waffles',
      fixedProductName: 'Gaufre healthy',
    },
  },
  {
    id: 'combo-choco-cocoon',
    name: 'Choco Cocoon',
    subtitle: 'Chocolat chaud + gaufre topping au choix',
    description:
      'La formule cocooning du menu pour les amateurs de chocolat chaud protéiné et de pause réconfortante.',
    image: '/images/combo/combo-choco-cocoon.png',
    priceCents: 1190,
    normalPriceCents: 1380,
    accent: 'from-rose-500 via-orange-400 to-yellow-400',
    primary: {
      label: 'Choisis ton chocolat chaud',
      categoryId: 'hot',
      allowedProductNames: ['Chocolat chaud protéiné'],
    },
    secondary: {
      label: 'Choisis ton topping',
      categoryId: 'waffles',
      fixedProductName: 'Gaufre healthy',
    },
  },
  {
    id: 'combo-gourmet-break',
    name: 'Gourmet Break',
    subtitle: 'Café gourmet glacé + gaufre topping au choix',
    description:
      'La formule premium pour associer un café gourmet glacé 24g protéines à une gaufre healthy.',
    image: '/images/combo/combo-gourmet-break.png',
    priceCents: 1390,
    normalPriceCents: 1580,
    accent: 'from-violet-500 via-fuchsia-500 to-orange-400',
    primary: {
      label: 'Choisis ta recette café gourmet glacé',
      categoryId: 'hot',
      fixedProductName: 'Café gourmet glacé',
    },
    secondary: {
      label: 'Choisis ton topping',
      categoryId: 'waffles',
      fixedProductName: 'Gaufre healthy',
    },
  },
];

// ─── CATÉGORIES ─────────────────────────────────────────────────────
export const categories: Category[] = [
  // 🥤 SMOOTHIES NUTRITIONNELS (8,90€)
  {
    id: 'smoothies',
    name: 'Smoothies nutritionnels',
    icon: Coffee,
    price: '650 ml • 8,90€',
    accent: 'from-yellow-400 via-amber-400 to-orange-500',
    description:
      '24g protéines végétales • 25 vitamines & minéraux • 250 cal • Sans lactose & sans gluten',
    items: [
      {
        name: "M&M's",
        description: 'Smoothie chocolat gourmand caramel-noisette, topping M&M\'s.',
        flavors: 'Chocolat • Caramel • Noisette • Topping M&M\'s • 24g protéines • 250 cal',
        badge: 'Gourmand',
        basePriceCents: 890,
        image: '/images/shake/mm.png',
      },
      {
        name: 'Bueno',
        description: 'Smoothie choco-noisette, topping gaufrette gourmande.',
        flavors: 'Chocolat • Noisette • Topping gaufrette • 24g protéines • 250 cal',
        badge: 'Gourmand',
        basePriceCents: 890,
        image: '/images/shake/bueno.png',
      },
      {
        name: 'Casse Noisette',
        description: 'Un smoothie rond et réconfortant, café latte et noisette.',
        flavors: 'Café latte • Noisette • 24g protéines • 250 cal',
        badge: 'Best-seller',
        basePriceCents: 890,
        image: '/images/shake/casse-noisette.png',
      },
      {
        name: 'Cappuccino',
        description: 'Le grand classique pour les amateurs de café et chocolat.',
        flavors: 'Café latte • Chocolat intense • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/cappuccino.png',
      },
      {
        name: 'Pina Colada',
        description: 'Une recette fraîche et exotique, à l’esprit vacances.',
        flavors: 'Vanille • Ananas • Coco • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/pina-colada.png',
      },
      {
        name: 'Fraise bonbon',
        description: 'Une saveur douce et régressive, dessert assumé.',
        flavors: 'Vanille • Fraise • 24g protéines • 250 cal',
        badge: 'Gourmand',
        basePriceCents: 890,
        image: '/images/shake/fraise-bonbon.png',
      },
      {
        name: "Pim's",
        description: 'Une association fruitée et chocolatée avec belle intensité.',
        flavors: 'Chocolat • Framboise • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/pims.png',
      },
      {
        name: 'Tarte à la pomme',
        description: 'Inspiré de la pâtisserie iconique, note pomme/vanille.',
        flavors: 'Vanille • Pomme • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/tarte-a-la-pomme.png',
      },
      {
        name: 'Snickers',
        description: 'Très gourmand pour les amateurs de chocolat et cacahuètes.',
        flavors: 'Chocolat • Cacahuètes • 24g protéines • 250 cal',
        badge: 'Ultra gourmand',
        basePriceCents: 890,
        image: '/images/shake/snikers.png',
      },
      {
        name: 'Full Oréo',
        description: 'Texture onctueuse, profil cookie cream très réconfortant.',
        flavors: 'Cookies cream • Oréo • 24g protéines • 250 cal',
        badge: 'Iconique',
        basePriceCents: 890,
        image: '/images/shake/full-oreo.png',
      },
      {
        name: 'Speculoos',
        description: 'Saveur chaude, épicée et gourmande, parfaite toute l’année.',
        flavors: 'Chocolat • Speculoos • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/speculoos.png',
      },
      {
        name: 'Banana Split',
        description: 'Recette inspirée du dessert culte, version nutritionnelle.',
        flavors: 'Banane • Caramel • Cerise • Chocolat • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/banana-split.png',
      },
      {
        name: 'Banana Noisette',
        description: 'Le mariage réussi de la banane, du chocolat et de la noisette.',
        flavors: 'Banane • Caramel • Noisette • Chocolat • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/banane-noisette.png',
      },
      {
        name: 'Cookies',
        description: 'Recette douce et crémeuse, dessert assumé.',
        flavors: 'Cookies cream • Chocolat blanc • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/cookies-cream.png',
      },
      {
        name: 'Tropical',
        description: 'Un smoothie ensoleillé aux notes fruitées faciles à boire.',
        flavors: 'Vanille • Fraise • Banane • 24g protéines • 250 cal',
        basePriceCents: 890,
        image: '/images/shake/tropical.png',
      },
    ],
  },

  // ⚡ BOISSONS ÉNERGISANTES (Start 6,90€ / Boost 8,90€)
  {
    id: 'drinks',
    name: 'Boissons énergisantes',
    icon: Zap,
    price: 'Start 550ml • 6,90€ | Boost 950ml • 8,90€',
    accent: 'from-fuchsia-500 via-pink-500 to-rose-500',
    description:
      'Ginseng • Guarana • Vit B & C • extraits végétaux • aloé vera • 0 sucre • 20 cal • colorants naturels',
    items: [
      {
        name: 'Phénix',
        description: 'Signature coucher de soleil — un dégradé flamboyant, fruité et pétillant.',
        flavors: 'Fraise • Pêche • Ananas',
        badge: 'Nouveau',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/phenix.png',
      },
      {
        name: 'Aurora',
        description: 'Signature aurore boréale — un dégradé hypnotique, frais et acidulé.',
        flavors: 'Framboise • Myrtille • Citron',
        badge: 'Nouveau',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/aurora.png',
      },
      {
        name: 'Jungle',
        description: 'Signature melon-ananas, énergisante & naturelle. Version enfant sans énergisant sur demande.',
        flavors: 'Melon • Ananas',
        badge: 'Nouveau',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/jungle.png',
      },
      {
        name: 'Electric Blue',
        description: 'Boisson iconique ultra visuelle, parfaite Shake Bar.',
        flavors: 'Citron • Framboise bleue • Myrtille • Raisin',
        badge: 'Iconique',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/electric-blue.png',
      },
      {
        name: 'Pomelon',
        description: 'Recette fraîche et fruitée avec belle personnalité.',
        flavors: 'Citron • Framboise • Melon • Pomme',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/po-melon.png',
      },
      {
        name: 'Tonic Mandarine',
        description: 'Simple, vif, désaltérant.',
        flavors: 'Citron • Mandarine',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Apple Kiss',
        description: 'Boisson fraîche et vive, parfaite pour un boost.',
        flavors: 'Citron • Pomme verte',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/apple-kiss.png',
      },
      {
        name: 'Pina Colada',
        description: 'Version énergisante esprit vacances.',
        flavors: 'Citron • Pina colada • Ananas',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/pina-colada.png',
      },
      {
        name: 'Soleil',
        description: 'Mix ensoleillé pêche-mandarine-ananas.',
        flavors: 'Citron • Pêche • Mandarine • Ananas',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/soleil.png',
      },
      {
        name: 'Black Panther',
        description: 'Recette intense et dark, très visuelle.',
        flavors: 'Citron • Cerise • Framboise bleue',
        badge: 'Dark vibe',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/black-panther.png',
      },
      {
        name: "L'Exotic",
        description: 'La recette exotique pour les notes tropicales.',
        flavors: 'Citron • Pêche • Passion • Fruit du dragon • Ananas',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/l-exotic.png',
      },
      {
        name: "T'Coco",
        description: 'Tonique et coco, signature originale.',
        flavors: 'Citron • Pêche • Mandarine • Coco',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/t-coco.png',
      },
      {
        name: 'Elf',
        description: 'Recette fun et fruitée, très accessible.',
        flavors: 'Citron • Pêche • Framboise bleue • Pomme • Ananas',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/elf.png',
      },
      {
        name: 'Perroquet',
        description: 'Très colorée et fun, marque visuellement.',
        flavors: 'Citron • Fraise • Framboise bleue • Raisin • Pêche',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/perroquet.png',
      },
      {
        name: 'La vie en Rose',
        description: 'Pleine de fraîcheur avec côté pink signature.',
        flavors: 'Citron • Framboise • Pomme • Fruit du dragon',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/la-vie-en-rose.png',
      },
      {
        name: 'Sortilège noir',
        description: 'Mystérieuse, fruitée, très impactante visuellement.',
        flavors: 'Citron • Framboise • Cerise • Fraise • Myrtille',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/sortilege-noir.png',
      },
    ],
  },

  // 💧 BOISSONS SANTÉ (Start 6,90€ / Boost 8,90€)
  {
    id: 'health',
    name: 'Boissons santé',
    icon: Heart,
    price: 'Start 550ml • 6,90€ | Boost 950ml • 8,90€',
    accent: 'from-emerald-400 via-lime-400 to-green-500',
    description: 'Hydratation • fibres • probiotiques • bien-être ciblé',
    items: [
      {
        name: "Hydrat'Max",
        description: 'Orientée hydratation et fraîcheur, parfaite au quotidien.',
        flavors: 'Orange • Mandarine • Vitamine C',
        badge: 'Vitamine C',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/sante/hydrat-max.png',
      },
      {
        name: 'Casse Grippe',
        description: 'Pensée confort, soutien immunité, Epicor + Vitamines.',
        flavors: 'Baies sauvages • Framboise • Pomme • Thé vert • Aloé vera',
        badge: 'Immunité',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/sante/casse-grippe.png',
      },
      {
        name: 'Limonade Rose',
        description: 'Beauté de la peau, collagène + aloé vera.',
        flavors: 'Fraise • Citron • Framboise • Collagène • Aloé vera',
        badge: 'Glow',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/sante/limonade-rose.png',
      },
      {
        name: "Di'geste",
        description: 'Soutien digestif, fibres + probiotiques + thé vert.',
        flavors: 'Pomme • Fraise • Citron • Fibres • Probiotiques • Aloé vera',
        badge: 'Fibres & probiotiques',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/sante/di-gest.png',
      },
    ],
  },

  // 🧒 BOISSONS ENFANTS (5,90€) — 0 sucre / 0 calorie
  {
    id: 'kids',
    name: 'Boissons enfants',
    icon: Sparkles,
    price: '5,90€',
    accent: 'from-pink-400 via-fuchsia-400 to-violet-400',
    description: '0 sucre • 0 calorie • naturellement parfumées',
    items: [
      {
        name: 'Bulle de Fée',
        description: 'Une bulle douce et fruitée.',
        flavors: 'Pomme • Fruit du dragon',
        basePriceCents: 590,
      },
      {
        name: 'Spiderman',
        description: 'Fruits rouges qui font sourire.',
        flavors: 'Fruits rouges',
        basePriceCents: 590,
      },
      {
        name: 'Stitch',
        description: 'Limonade non pétillante, passion-citron.',
        flavors: 'Passion • Limonade (non pétillant)',
        basePriceCents: 590,
      },
      {
        name: 'Licorne',
        description: 'Le mix coloré qui fait rêver.',
        flavors: 'Myrtille • Fraise • Raisin',
        basePriceCents: 590,
      },
      {
        name: 'Hulk',
        description: 'Vert vif et acidulé.',
        flavors: 'Pomme verte',
        basePriceCents: 590,
      },
      {
        name: 'Tropicool',
        description: 'Esprit vacances pour les petits.',
        flavors: 'Melon • Ananas',
        basePriceCents: 590,
      },
    ],
  },

  // ☕ CAFÉS / CHOCOLATS / THÉS
  {
    id: 'hot',
    name: 'Cafés / Chocolats / Thés',
    icon: Coffee,
    price: 'Dès 3,90€',
    accent: 'from-orange-400 via-amber-400 to-yellow-500',
    description:
      'Boissons chaudes simples ou premium, cafés glacés gourmets protéinés.',
    items: [
      {
        name: 'Café chaud',
        description: 'Un café chaud simple, en petit ou grand format.',
        flavors: '6 à 11g protéines • Petit 250ml ou Grand 450ml',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/cafe-classique.png',
      },
      {
        name: 'Thé Aloé Vera chaud',
        description: '50 extraits végétaux & Aloé Vera, à choisir parmi 3 saveurs.',
        flavors: 'Saveurs : Pêche • Framboise • Citron',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/the-aloe-vera.png',
      },
      {
        name: 'Chocolat chaud protéiné',
        description: '25g protéines, sans gluten, riche en BCAA.',
        flavors: 'Nature ou saveur au choix (+0,50€)',
        badge: '25g protéines',
        options: [
          { label: 'Nature — 5,90€', priceCents: 590 },
          { label: 'Saveur Noisette — 6,40€', priceCents: 640 },
          { label: 'Saveur Spéculoos — 6,40€', priceCents: 640 },
          { label: 'Saveur Caramel — 6,40€', priceCents: 640 },
          { label: 'Saveur Vanille — 6,40€', priceCents: 640 },
          { label: 'Saveur Cookie — 6,40€', priceCents: 640 },
        ],
        image: '/images/hot/chocolat-chaud.png',
      },
      {
        name: 'Café gourmet glacé',
        description: '24g protéines, 190 calories. Recettes café premium glacées.',
        flavors: 'Macchiato • Choco Mocha • Latte aux Noisettes • Vanille Latte',
        badge: 'Gourmet',
        options: [
          { label: 'Macchiato — 650ml — 8,90€', priceCents: 890 },
          { label: 'Choco Mocha — 650ml — 8,90€', priceCents: 890 },
          { label: 'Latte aux Noisettes — 650ml — 8,90€', priceCents: 890 },
          { label: 'Vanille Latte — 650ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/hot/cafe-gourmet.png',
      },
      {
        name: 'Café glacé simple',
        description: '15g protéines, 2g de sucre, 100 calories.',
        flavors: 'Macchiato',
        basePriceCents: 690,
        image: '/images/hot/cafe-classique.png',
      },
    ],
  },

  // 🧇 GAUFRE HEALTHY (6,90€)
  {
    id: 'waffles',
    name: 'Gaufre',
    icon: Coffee,
    price: '6,90€',
    accent: 'from-amber-400 via-yellow-400 to-orange-500',
    description:
      'Une gaufre healthy gourmande avec topping au choix.',
    items: [
      {
        name: 'Gaufre healthy',
        description: 'Topping au choix : miel, chocolat, caramel beurre salé…',
        flavors: 'Miel • Chocolat • Chocolat blanc • Caramel • Caramel beurre salé',
        options: [
          { label: 'Miel — 6,90€', priceCents: 690 },
          { label: 'Chocolat — 6,90€', priceCents: 690 },
          { label: 'Chocolat blanc — 6,90€', priceCents: 690 },
          { label: 'Caramel — 6,90€', priceCents: 690 },
          { label: 'Caramel beurre salé — 6,90€', priceCents: 690 },
        ],
        image: '/images/waffle/gaufre-healthy.png',
      },
    ],
  },

  // 💪 SPORTIFS
  {
    id: 'sports',
    name: 'Sportifs',
    icon: Trophy,
    price: 'Start 6,90€ / Boost 8,90€',
    accent: 'from-emerald-400 via-cyan-400 to-blue-500',
    description:
      'Boissons sport, hydratation, électrolytes, récupération post-workout.',
    items: [
      {
        name: "Electro'Lyte",
        description:
          'Boisson glucidique et électrolytique pour effort + récupération.',
        flavors: 'Boisson sport • Hydratation • +extra Créatine possible',
        badge: 'Performance',
        options: [
          { label: 'Start 550ml — 6,90€', priceCents: 690 },
          { label: 'Boost 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/sport/electro-lyte.png',
      },
      {
        name: 'Post Workout',
        description: 'Boisson chocolat de récupération, 25g protéines + BCAA + fer.',
        flavors: '25g protéines • 6,3mg fer • BCAA',
        badge: 'Récup',
        basePriceCents: 590,
      },
    ],
  },

  // 🧒 BOISSONS ENFANTS — 0 sucre / 0 calorie • SANS énergisant • 5€
  {
    id: 'kids',
    name: 'Boissons enfants',
    icon: Sparkles,
    price: 'Sans énergisant • 5€',
    accent: 'from-sky-400 via-fuchsia-400 to-amber-400',
    description: '0 sucre • 0 calorie • SANS énergisant • spécial enfants 🧒',
    items: [
      {
        name: 'Bulle de Fée',
        description: 'Douce et féerique, pensée pour les enfants. Sans énergisant.',
        flavors: 'Pomme • Fruit du dragon',
        basePriceCents: 500,
      },
      {
        name: 'Spiderman',
        description: 'Pleine de fruits rouges, l’héroïne des petits. Sans énergisant.',
        flavors: 'Fruits rouges',
        basePriceCents: 500,
      },
      {
        name: 'Stitch',
        description: 'Passion & limonade, sans bulles. Sans énergisant.',
        flavors: 'Passion • Limonade (non pétillant)',
        basePriceCents: 500,
      },
      {
        name: 'Licorne',
        description: 'Magique et fruitée, pour rêver. Sans énergisant.',
        flavors: 'Myrtille • Fraise • Raisin',
        basePriceCents: 500,
      },
      {
        name: 'Hulk',
        description: 'Pomme verte qui pète la forme. Sans énergisant.',
        flavors: 'Pomme verte',
        basePriceCents: 500,
      },
      {
        name: 'Tropicool',
        description: 'Évasion tropicale tout en douceur. Sans énergisant.',
        flavors: 'Melon • Ananas',
        basePriceCents: 500,
      },
      {
        name: 'Jungle Kid',
        description: 'La Jungle en version enfant : même goût, sans énergisant.',
        flavors: 'Melon • Ananas',
        basePriceCents: 500,
      },
    ],
  },
];

// ─── Sections home page (legacy + V2) ───────────────────────────────
export const accompagnementCards = [
  {
    icon: Target,
    title: 'Perte de poids & bien-être',
    text: 'Fais le point sur tes habitudes, ton objectif et la meilleure direction à prendre.',
  },
  {
    icon: Trophy,
    title: 'Énergie & nutrition sportive',
    text: 'Découvre un accompagnement orienté routine, récupération, effort.',
  },
  {
    icon: Sparkles,
    title: 'Découverte du projet',
    text: 'Réserve un créneau pour échanger sur le club, les produits ou le côté activité.',
  },
];

export const productStories = [
  {
    name: 'Snickers',
    subtitle: 'Ultra gourmand',
    description: 'Notre best-seller chocolat-cacahuètes, addictif dès la première gorgée.',
  },
  {
    name: 'Full Oréo',
    subtitle: 'Iconique',
    description: 'La texture cookie cream qui plaît à 100% des dégustateurs.',
  },
];

export const featuredSelections = [
  { name: 'Snickers', subtitle: 'Ultra gourmand' },
  { name: 'Full Oréo', subtitle: 'Iconique' },
  { name: 'Casse Noisette', subtitle: 'Best-seller' },
  { name: 'Electric Blue', subtitle: 'Iconique drink' },
  { name: 'Café gourmet glacé', subtitle: 'Pause premium' },
  { name: "Electro'Lyte", subtitle: 'Boost sport' },
];

export const socialProofStats = [
  {
    value: '4,9/5',
    label: 'Avis Google',
    text: 'Une adresse qui se recommande autant pour les produits que pour l’accueil.',
  },
  {
    value: '5 à 10 min',
    label: 'Retrait rapide',
    text: 'Commande simple à passer et rapide à récupérer au club.',
  },
  {
    value: 'Healthy & gourmand',
    label: 'Esprit La Base',
    text: 'Le bon équilibre entre plaisir, énergie et accompagnement.',
  },
];

export const testimonials = [
  {
    title: 'Le club qu’on recommande',
    text: 'On vient pour un shake, on revient pour l’ambiance et la régularité.',
    author: 'Clients du club',
  },
  {
    title: 'Des recettes qui marquent',
    text: 'Les visuels donnent envie, les goûts suivent, et la commande reste simple.',
    author: 'Habitués de Verdun',
  },
  {
    title: 'Plaisir + énergie',
    text: 'La Base a ce côté gourmand sans perdre la logique bien-être.',
    author: 'Communauté La Base',
  },
];
