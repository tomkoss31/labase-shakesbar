import type { LucideIcon } from 'lucide-react';
import {
  ShoppingCart,
  MessageCircle,
  MapPin,
  Clock3,
  Search,
  Plus,
  Minus,
  ChevronRight,
  Coffee,
  Zap,
  Heart,
  Instagram,
  Star,
  CheckCircle2,
  X,
  Sparkles,
  Flame,
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

type SelectedProduct = Product & {
  categoryId: string;
  categoryName: string;
  categoryAccent: string;
  categoryPriceLabel: string;
};

type CartItem = {
  key: string;
  name: string;
  categoryName: string;
  quantity: number;
  option: string;
  unitPriceCents: number;
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

// Editing guide:
// 1. Add or edit products inside `categories`.
// 2. Add or edit combos inside `comboOffers`.
// 3. Update homepage highlights in `productStories`, `featuredSelections`,
//    `socialProofStats`, and `testimonials`.
// The UI logic in App.tsx can stay mostly unchanged.

export const comboOffers: ComboOffer[] = [
  {
    id: 'combo-medium',
    name: 'Combo Medium',
    subtitle: 'Smoothie + boisson Medium',
    description:
      'Une formule complète pour profiter d’un smoothie nutritionnel et d’une boisson énergisante medium à prix avantage.',
    image: '/images/combo/combo-medium.png',
    priceCents: 1480,
    normalPriceCents: 1580,
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    primary: {
      label: 'Choisis ton smoothie',
      categoryId: 'smoothies',
    },
    secondary: {
      label: 'Choisis ta boisson',
      categoryId: 'drinks',
      fixedOptionLabel: 'Medium 550ml — 6,90€',
    },
  },
  {
    id: 'combo-power',
    name: 'Combo Power',
    subtitle: 'Smoothie + boisson Large',
    description:
      'La formule la plus complète pour associer un smoothie nutritionnel et une grande boisson énergisante tout en profitant d’un tarif avantageux.',
    image: '/images/combo/combo-power.png',
    priceCents: 1590,
    normalPriceCents: 1780,
    accent: 'from-fuchsia-500 via-pink-500 to-orange-500',
    primary: {
      label: 'Choisis ton smoothie',
      categoryId: 'smoothies',
    },
    secondary: {
      label: 'Choisis ta boisson',
      categoryId: 'drinks',
      fixedOptionLabel: 'Large 950ml — 8,90€',
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
      allowedProductNames: ['Thé'],
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
      allowedProductNames: ['Café'],
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
      fixedOptionLabel: 'Grand 450ml — 6,90€',
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
    subtitle: 'Café gourmet + gaufre topping au choix',
    description:
      'La formule premium pour associer un café gourmet 650 ml à une gaufre healthy et créer un panier plus fort.',
    image: '/images/combo/combo-gourmet-break.png',
    priceCents: 1390,
    normalPriceCents: 1580,
    accent: 'from-violet-500 via-fuchsia-500 to-orange-400',
    primary: {
      label: 'Choisis ta recette café gourmet',
      categoryId: 'hot',
      fixedProductName: 'Café gourmet',
    },
    secondary: {
      label: 'Choisis ton topping',
      categoryId: 'waffles',
      fixedProductName: 'Gaufre healthy',
    },
  },
];

export const categories: Category[] = [
  {
    id: 'smoothies',
    name: 'Smoothies nutritionnels',
    icon: Coffee,
    price: '650 ml • 8,90€',
    accent: 'from-yellow-400 via-amber-400 to-orange-500',
    description:
      '24g de protéines • 25 vitamines & minéraux • 250 calories • texture gourmande',
    items: [
      {
        name: 'Choco Buenos',
        description:
          'Le smoothie signature ultra gourmand, inspiré d’une saveur type Bueno.',
        flavors:
          'Saveur type Kinder Bueno • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        badge: 'Produit du mois',
        basePriceCents: 890,
        image: '/images/shake/bueno.png',
      },
      {
        name: 'M&M',
        description:
          'Une recette fun et généreuse, pensée pour un maximum d’effet waouh.',
        flavors:
          'Saveur type M&M • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        badge: 'Produit du mois',
        basePriceCents: 890,
        image: '/images/shake/mm.png',
      },
      {
        name: 'Casse Noisette',
        description:
          'Un smoothie rond et réconfortant, avec une vraie identité café/noisette.',
        flavors:
          'Café latte • Noisette • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        badge: 'Best-seller',
        basePriceCents: 890,
        image: '/images/shake/casse-noisette.png',
      },
      {
        name: 'Cappuccino',
        description:
          'Un grand classique gourmand pour les amateurs de café et chocolat.',
        flavors:
          'Café latte • Chocolat intense • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/cappuccino.png',
      },
      {
        name: 'Pina Colada',
        description: 'Une recette fraîche et exotique, à l’esprit vacances.',
        flavors:
          'Vanille • Ananas • Coco • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/pina-colada.png',
      },
      {
        name: 'Fraise Bonbon',
        description:
          'Une saveur douce et régressive, très appréciée pour son côté dessert.',
        flavors:
          'Vanille • Fraise • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        badge: 'Gourmand',
        basePriceCents: 890,
        image: '/images/shake/fraise-bonbon.png',
      },
      {
        name: "Pim's",
        description:
          'Une association fruitée et chocolatée avec une belle intensité.',
        flavors:
          'Chocolat • Framboise • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/pims.png',
      },
      {
        name: 'Tarte à la pomme',
        description:
          'Un smoothie inspiré d’une pâtisserie iconique, avec une note pomme/vanille.',
        flavors:
          'Vanille • Pomme • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/tarte-a-la-pomme.png',
      },
      {
        name: 'Snickers',
        description:
          'Le smoothie très gourmand pour les amateurs de chocolat et cacahuètes.',
        flavors:
          'Chocolat • Cacahuètes • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        badge: 'Ultra gourmand',
        basePriceCents: 890,
        image: '/images/shake/snikers.png',
      },
      {
        name: 'Full Oréo',
        description:
          'Une texture onctueuse et un profil cookie cream très réconfortant.',
        flavors:
          'Cookies cream • Oréo • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/full-oreo.png',
      },
      {
        name: 'Speculoos',
        description:
          'Une saveur chaude, épicée et gourmande, parfaite toute l’année.',
        flavors:
          'Chocolat • Speculoos • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/speculoos.png',
      },
      {
        name: 'Banana Split',
        description:
          'Une recette inspirée du dessert culte, version smoothie nutritionnel.',
        flavors:
          'Banane • Caramel • Cerise • Chocolat • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/banana-split.png',
      },
      {
        name: 'Banana Noisette',
        description:
          'Le mariage réussi de la banane, du chocolat et de la noisette.',
        flavors:
          'Banane • Caramel • Noisette • Chocolat • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/banane-noisette.png',
      },
      {
        name: 'Cookies',
        description:
          'Une recette douce, crémeuse et très appréciée des amateurs de saveurs dessert.',
        flavors:
          'Cookies cream • Chocolat blanc • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/cookies-cream.png',
      },
      {
        name: 'Tropical',
        description:
          'Un smoothie ensoleillé aux notes fruitées et faciles à boire.',
        flavors:
          'Vanille • Fraise • Banane • 650 ml • 24g protéines • 25 vitamines & minéraux • 250 calories',
        basePriceCents: 890,
        image: '/images/shake/tropical.png',
      },
    ],
  },
  {
    id: 'drinks',
    name: 'Boissons énergisantes',
    icon: Zap,
    price: 'Medium 550ml • 6,90€ | Large 950ml • 8,90€',
    accent: 'from-fuchsia-500 via-pink-500 to-rose-500',
    description:
      '0 sucre • 20 calories • vitamines B & C • extraits végétaux • hydratation sport intégrée',
    items: [
      {
        name: 'Apple Kiss',
        description:
          'Une boisson fraîche et vive, parfaite pour un boost léger ou renforcé.',
        flavors: 'Citron • Pomme verte',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/apple-kiss.png',
      },
      {
        name: 'Black Panther',
        description:
          'Une recette plus intense et plus dark dans l’esprit, très visuelle.',
        flavors: 'Citron • Cerise • Framboise bleue',
        badge: 'Dark vibe',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/black-panther.png',
      },
      {
        name: 'Cherry White Grappe',
        description:
          'Une création fruitée très complète, avec un profil original.',
        flavors: 'Citron • Framboise • Cerise • Raisin blanc',
        badge: 'Nouveau',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/cherry-white-grappe.png',
      },
      {
        name: 'Electric Blue',
        description:
          'Une boisson iconique, ultra visuelle, parfaite pour l’univers Shake Bar.',
        flavors: 'Citron • Framboise bleue • Myrtille • Raisin',
        badge: 'Iconique',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/electric-blue.png',
      },
      {
        name: 'Elf',
        description: 'Une recette fun et fruitée, très agréable et accessible.',
        flavors: 'Citron • Pêche • Framboise bleue • Pomme • Ananas',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/elf.png',
      },
      {
        name: 'La Vie en Rose',
        description:
          'Une boisson pleine de fraîcheur avec un vrai côté pink signature.',
        flavors: 'Citron • Framboise • Pomme • Fruit du dragon',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/la-vie-en-rose.png',
      },
      {
        name: "L'Exotic",
        description:
          'La recette exotique par excellence pour ceux qui aiment les notes tropicales.',
        flavors: 'Citron • Pêche • Passion • Fruit du dragon • Ananas',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/l-exotic.png',
      },
      {
        name: 'Perroquet',
        description:
          'Une boisson très colorée et très fun, pensée pour marquer visuellement.',
        flavors: 'Citron • Fraise • Framboise bleue • Raisin • Pêche',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/perroquet.png',
      },
      {
        name: 'Pina Colada',
        description:
          'Une version énergisante à l’esprit vacances, très facile à aimer.',
        flavors: 'Citron • Pina colada • Ananas',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/pina-colada.png',
      },
      {
        name: 'Po Melon',
        description:
          'Une recette fraîche et fruitée avec une belle personnalité.',
        flavors: 'Citron • Framboise • Melon • Pomme',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/po-melon.png',
      },
      {
        name: 'Red Paradize',
        description: 'Une boisson lumineuse, fruitée et très agréable à boire.',
        flavors: 'Citron • Pêche • Ananas',
        badge: 'Nouveau',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/red-paradize.png',
      },
      {
        name: 'Soleil',
        description: 'Un mix ensoleillé aux notes pêche, mandarine et ananas.',
        flavors: 'Citron • Pêche • Mandarine • Ananas',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/soleil.png',
      },
      {
        name: 'Sortilège Noir',
        description:
          'Une recette mystérieuse, fruitée et très impactante visuellement.',
        flavors: 'Citron • Framboise • Cerise • Fraise • Myrtille',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/sortilege-noir.png',
      },
      {
        name: 'Electro’Lyte',
        description:
          'La boisson sport pensée pour l’hydratation, le soutien de l’effort et la récupération.',
        flavors: 'Boisson glucidique • électrolytes • hydratation',
        badge: 'Performance',
        image: '/images/sport/electro-lyte.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
    ],
  },
  {
    id: 'health',
    name: 'Boissons santé',
    icon: Heart,
    price: '6,90€',
    accent: 'from-emerald-400 via-lime-400 to-green-500',
    description: 'Hydratation • fibres • probiotiques • bien-être ciblé',
    items: [
      {
        name: 'Hydrat’Max',
        description:
          'Une boisson orientée hydratation et fraîcheur, parfaite au quotidien.',
        flavors: 'Orange • Mandarine',
        badge: 'Vitamine C',
        basePriceCents: 690,
        image: '/images/sante/hydrat-max.png',
      },
      {
        name: 'Casse Grippe',
        description:
          'Une recette pensée autour du confort et du soutien immunité.',
        flavors: 'Baies sauvages • Framboise • Pomme',
        badge: 'Immunité',
        basePriceCents: 690,
        image: '/images/sante/casse-grippe.png',
      },
      {
        name: 'Limonade Rose',
        description:
          'Une boisson fraîche et légère avec une belle identité visuelle.',
        flavors: 'Fraise • Citron • Framboise',
        badge: 'Glow',
        basePriceCents: 690,
        image: '/images/sante/limonade-rose.png',
      },
      {
        name: 'Digest',
        description:
          'Un soutien ciblé avec fibres et probiotiques, simple et efficace.',
        flavors: 'Pomme • Fraise • Citron',
        badge: 'Fibres & probiotiques',
        basePriceCents: 690,
        image: '/images/sante/di-gest.png',
      },
    ],
  },
  {
    id: 'hot',
    name: 'Café / Thé',
    icon: Coffee,
    price: 'Petit 250ml • 3,90€ | Grand 450ml • 5,90€ | Café gourmet 650ml • 8,90€',
    accent: 'from-orange-400 via-amber-400 to-yellow-500',
    description:
      'Boissons chaudes simples, premium et gourmandes • café gourmet 24g protéines • 190 calories',
    items: [
      {
        name: 'Café',
        description:
          'Un café chaud simple et efficace, en petit ou grand format.',
        flavors: 'Petit ou grand format',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/cafe-classique.png',
      },
      {
        name: 'Thé',
        description:
          'Une boisson chaude légère et agréable, idéale à tout moment.',
        flavors: 'Petit ou grand format',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/the-aloe-vera.png',
      },
      {
        name: 'Chocolat chaud protéiné',
        description:
          'Une boisson chaude gourmande enrichie en protéines, parfaite en collation.',
        flavors: 'Vanille • Caramel • Noisette • Cookie',
        badge: '25g protéines',
        options: [
          { label: 'Petit 250ml — 5,90€', priceCents: 590 },
          { label: 'Grand 450ml — 6,90€', priceCents: 690 },
        ],
        image: '/images/hot/chocolat-chaud.png',
      },
      {
        name: 'Café gourmet',
        description:
          'Une boisson café premium déclinée en plusieurs recettes gourmandes avec un format plus généreux.',
        flavors:
          'Macchiato • Choco mocha • Latte noisette • Vanille latte • 650 ml • 24g protéines • 190 calories',
        badge: 'Gourmet',
        options: [
          { label: 'Macchiato — 650ml — 8,90€', priceCents: 890 },
          { label: 'Choco mocha — 650ml — 8,90€', priceCents: 890 },
          { label: 'Latte noisette — 650ml — 8,90€', priceCents: 890 },
          { label: 'Vanille latte — 650ml — 8,90€', priceCents: 890 },
        ],
        image: '/images/hot/cafe-gourmet.png',
      },
    ],
  },
  {
    id: 'waffles',
    name: 'Gaufre',
    icon: Coffee,
    price: '6,90€',
    accent: 'from-amber-400 via-yellow-400 to-orange-500',
    description:
      'Choisis ton topping • miel • chocolat • chocolat blanc • caramel • caramel beurre salé',
    items: [
      {
        name: 'Gaufre healthy',
        description:
          'Une gaufre gourmande avec topping au choix, pensée pour le plaisir.',
        flavors:
          'Choix du topping : Miel • Chocolat • Chocolat blanc • Caramel • Caramel beurre salé',
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
];

export const accompagnementCards = [
  {
    icon: Target,
    title: 'Perte de poids & bien-être',
    text: 'Fais le point sur tes habitudes, ton objectif et la meilleure direction à prendre.',
  },
  {
    icon: Trophy,
    title: 'Énergie & nutrition sportive',
    text: 'Découvre un accompagnement orienté routine, récupération, effort et équilibre au quotidien.',
  },
  {
    icon: Sparkles,
    title: 'Découverte du projet',
    text: 'Tu peux aussi réserver un créneau pour échanger sur le club, les produits ou le côté activité.',
  },
];

export const productStories = [
  {
    name: 'Choco Buenos',
    subtitle: 'Signature du moment',
    description:
      'La recette qu’on recommande souvent pour découvrir La Base.',
  },
  {
    name: 'M&M',
    subtitle: 'Très demandé',
    description:
      'Un shake ultra gourmand, visuel et facile à aimer dès la première commande.',
  },
];

export const featuredSelections = [
  { name: 'Choco Buenos', subtitle: 'Signature du moment' },
  { name: 'M&M', subtitle: 'Très demandé' },
  { name: 'Snickers', subtitle: 'Ultra gourmand' },
  { name: 'Electric Blue', subtitle: 'Iconique' },
  { name: 'Café gourmet', subtitle: 'Pause premium' },
  { name: 'Electro’Lyte', subtitle: 'Boost énergie' },
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
    text: 'Une commande simple à passer et rapide à récupérer au club.',
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
    text: 'On vient pour un shake, on revient pour l’ambiance, les conseils et la régularité.',
    author: 'Clients du club',
  },
  {
    title: 'Des recettes qui marquent',
    text: 'Les visuels donnent envie, les goûts suivent, et la commande reste hyper simple.',
    author: 'Habitués de Verdun',
  },
  {
    title: 'Plaisir + énergie',
    text: 'La Base a ce côté gourmand sans perdre la logique bien-être qui fait la différence.',
    author: 'Communauté La Base',
  },
];
