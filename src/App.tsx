import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

type ProductOption = {
  label: string;
  priceCents: number;
};

type Product = {
  name: string;
  description: string;
  flavors: string;
  badge?: string;
  image?: string;
  basePriceCents?: number;
  options?: ProductOption[];
};

type Category = {
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

type ComboSelectionConfig = {
  label: string;
  categoryId: string;
  fixedProductName?: string;
  allowedProductNames?: string[];
  fixedOptionLabel?: string;
};

type ComboOffer = {
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

const BRAND = {
  name: 'La Base Shakes & Drinks',
  shortName: 'LA BASE',
  pickup: 'Retrait sur place • Verdun',
  prep: 'Commande prête en 5 à 10 min',
  whatsappNumber: '33679448759',
  address: '11 rue Saint Pierre, Verdun',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=11+rue+Saint+Pierre+Verdun',
  discoveryUrl: 'https://linktr.ee/milmel55',
};

const googleReviewUrl = 'https://g.page/r/CeJabN1yW1toEAE/review';
const instagramUrl = 'https://www.instagram.com/labase_verdun/';

const comboOffers: ComboOffer[] = [
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

const categories: Category[] = [
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

const accompagnementCards = [
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

function euroFromCents(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

function buildWhatsAppMessage(
  cart: CartItem[],
  name: string,
  pickupTime: string,
  totalCents: number,
) {
  const lines = [
    'Bonjour 👋',
    '',
    'Je souhaite commander :',
    '',
    ...cart.map((item) => {
      const optionPart = item.option ? ` (${item.option})` : '';
      return `• ${item.quantity}x ${item.name}${optionPart}`;
    }),
    '',
    `Nom : ${name || 'À compléter'}`,
    `Heure de retrait : ${pickupTime || 'À compléter'}`,
    `Total estimé : ${euroFromCents(totalCents)}`,
    '',
    'Merci 🙂',
    'La Base Shakes & Drinks',
  ];

  return encodeURIComponent(lines.join('\n'));
}

function getBadgeLabel(badge?: string) {
  switch (badge) {
    case 'Produit du mois':
      return 'Nouveau';
    case 'Best-seller':
      return 'Le plus commandé';
    case 'Ultra gourmand':
    case 'Gourmand':
      return 'Gourmand';
    case 'Performance':
      return 'Perf';
    case 'Iconique':
      return 'Le plus commandé';
    default:
      return badge ?? '';
  }
}

function getBadgeClassName(badge?: string) {
  switch (badge) {
    case 'Produit du mois':
    case 'Nouveau':
      return 'border-cyan-400/20 bg-cyan-400/12 text-cyan-200';
    case 'Best-seller':
    case 'Iconique':
      return 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200';
    case 'Ultra gourmand':
    case 'Gourmand':
      return 'border-pink-400/20 bg-pink-400/12 text-pink-200';
    case 'Performance':
      return 'border-orange-400/20 bg-orange-400/12 text-orange-200';
    default:
      return 'border-yellow-400/20 bg-yellow-400/12 text-yellow-300';
  }
}

function ProductCardBackground({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!image || errored) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_55%),linear-gradient(180deg,rgba(20,20,20,0.95),rgba(5,5,5,1))]" />
    );
  }

  return (
    <div className="absolute inset-0">
      <img
        src={image}
        alt={name}
        onError={() => setErrored(true)}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.28)_35%,rgba(0,0,0,0.78)_78%,rgba(0,0,0,0.95)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),transparent_35%)]" />
    </div>
  );
}

function ProductModalImage({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!image || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.07),_transparent_55%),linear-gradient(180deg,rgba(20,20,20,0.95),rgba(5,5,5,1))]">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
            LA BASE
          </p>
          <p className="mt-2 text-xl font-black text-white/80">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      onError={() => setErrored(true)}
      className="h-full w-full object-cover"
    />
  );
}

function ComboCardImage({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!image || errored) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%),linear-gradient(180deg,rgba(30,30,30,0.98),rgba(8,8,8,1))]" />
    );
  }

  return (
    <div className="absolute inset-0">
      <img
        src={image}
        alt={name}
        onError={() => setErrored(true)}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.28)_45%,rgba(0,0,0,0.88)_100%)]" />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 font-black text-black shadow-[0_10px_24px_rgba(250,204,21,0.16)]'
          : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'
      }`}
    >
      {label}
    </button>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedCombo, setSelectedCombo] = useState<ComboOffer | null>(null);
  const [selectedComboPrimaryName, setSelectedComboPrimaryName] = useState('');
  const [selectedComboSecondaryName, setSelectedComboSecondaryName] = useState('');
  const [selectedComboPrimaryOption, setSelectedComboPrimaryOption] = useState('');
  const [selectedComboSecondaryOption, setSelectedComboSecondaryOption] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.get('payment') === 'success') {
      setShowThankYou(true);
      setCart([]);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const allProducts = useMemo(() => {
    return categories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        categoryId: category.id,
        categoryName: category.name,
        categoryAccent: category.accent,
        categoryPriceLabel: category.price,
      })),
    );
  }, []);

  const monthlyItems = useMemo(
    () => [
      {
        name: 'Choco Buenos',
        subtitle: 'Produit du mois',
        description:
          'Une recette ultra gourmande inspirée de l’univers Bueno.',
      },
      {
        name: 'M&M',
        subtitle: 'Produit du mois',
        description:
          'Une saveur fun, généreuse et très visuelle, idéale pour créer l’effet waouh.',
      },
    ],
    [],
  );

  const featuredItems = useMemo(
    () => [
      { name: 'Choco Buenos', subtitle: 'Produit du mois' },
      { name: 'M&M', subtitle: 'Produit du mois' },
      { name: 'Snickers', subtitle: 'Ultra gourmand' },
      { name: 'Electric Blue', subtitle: 'Iconique' },
      { name: 'Café gourmet', subtitle: 'Premium' },
      { name: 'Electro’Lyte', subtitle: 'Performance' },
    ],
    [],
  );

  const bestCombo = useMemo(
    () => comboOffers.find((combo) => combo.id === 'combo-power') ?? comboOffers[0],
    [],
  );

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return categories
      .map((category) => {
        const matchesCategory =
          activeCategory === 'all' || activeCategory === category.id;

        if (!matchesCategory) {
          return { ...category, items: [] };
        }

        if (!normalizedQuery) {
          return category;
        }

        return {
          ...category,
          items: category.items.filter((item) => {
            return (
              item.name.toLowerCase().includes(normalizedQuery) ||
              item.description.toLowerCase().includes(normalizedQuery) ||
              item.flavors.toLowerCase().includes(normalizedQuery) ||
              category.name.toLowerCase().includes(normalizedQuery)
            );
          }),
        };
      })
      .filter((category) => category.items.length > 0);
  }, [activeCategory, query]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartTotalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [cart],
  );

  const hasRequiredPickupInfo =
    customerName.trim().length > 0 && pickupTime.trim().length > 0;

  const firstSmoothieInCart = cart.find(
    (item) => item.categoryName === 'Smoothies nutritionnels',
  );
  const firstDrinkInCart = cart.find(
    (item) => item.categoryName === 'Boissons énergisantes',
  );
  const firstHotInCart = cart.find((item) => item.categoryName === 'Café / Thé');
  const firstWaffleInCart = cart.find((item) => item.categoryName === 'Gaufre');

  function getSelectedBasePrice(product: SelectedProduct) {
    if (selectedOption && product.options?.length) {
      const option = product.options.find((opt) => opt.label === selectedOption);
      if (option) return option.priceCents;
    }
    return product.basePriceCents ?? 0;
  }

  function getStartingPriceLabel(product: Product) {
    if (product.options?.length) {
      return euroFromCents(Math.min(...product.options.map((opt) => opt.priceCents)));
    }

    if (typeof product.basePriceCents === 'number') {
      return euroFromCents(product.basePriceCents);
    }

    return '';
  }

  function getOptionSectionLabel(product: SelectedProduct) {
    if (product.categoryId === 'waffles') return 'Choix du topping';
    if (product.categoryId === 'hot' && product.name === 'Café gourmet') {
      return 'Choix de la recette';
    }
    return 'Choix de format';
  }

  function getComboCandidates(config: ComboSelectionConfig) {
    return allProducts.filter((product) => {
      if (product.categoryId !== config.categoryId) return false;
      if (config.fixedProductName && product.name !== config.fixedProductName) {
        return false;
      }
      if (
        config.allowedProductNames &&
        !config.allowedProductNames.includes(product.name)
      ) {
        return false;
      }
      if (
        config.fixedOptionLabel &&
        product.options &&
        !product.options.some((opt) => opt.label === config.fixedOptionLabel)
      ) {
        return false;
      }
      return true;
    });
  }

  function getDefaultOptionForComboProduct(
    product: SelectedProduct | undefined,
    config: ComboSelectionConfig,
  ) {
    if (config.fixedOptionLabel) return config.fixedOptionLabel;
    if (product?.options?.length) return product.options[0].label;
    return '';
  }

  function openProduct(productName: string) {
    const product = allProducts.find((entry) => entry.name === productName);
    if (!product) return;
    setSelectedCombo(null);
    setSelected(product);
    setSelectedOption(product.options?.[0]?.label ?? '');
  }

  function openProductFromCategory(category: Category, item: Product) {
    setSelectedCombo(null);
    setSelected({
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      categoryAccent: category.accent,
      categoryPriceLabel: category.price,
    });
    setSelectedOption(item.options?.[0]?.label ?? '');
  }

  function openCombo(
    comboId: ComboOffer['id'],
    presets?: { primaryName?: string; secondaryName?: string },
  ) {
    const combo = comboOffers.find((offer) => offer.id === comboId);
    if (!combo) return;

    const primaryCandidates = getComboCandidates(combo.primary);
    const secondaryCandidates = getComboCandidates(combo.secondary);

    const initialPrimary =
      presets?.primaryName &&
      primaryCandidates.some((product) => product.name === presets.primaryName)
        ? presets.primaryName
        : combo.primary.fixedProductName ?? primaryCandidates[0]?.name ?? '';

    const initialSecondary =
      presets?.secondaryName &&
      secondaryCandidates.some((product) => product.name === presets.secondaryName)
        ? presets.secondaryName
        : combo.secondary.fixedProductName ?? secondaryCandidates[0]?.name ?? '';

    const primaryProduct = primaryCandidates.find(
      (product) => product.name === initialPrimary,
    );
    const secondaryProduct = secondaryCandidates.find(
      (product) => product.name === initialSecondary,
    );

    setSelected(null);
    setSelectedOption('');
    setSelectedCombo(combo);
    setSelectedComboPrimaryName(initialPrimary);
    setSelectedComboSecondaryName(initialSecondary);
    setSelectedComboPrimaryOption(
      getDefaultOptionForComboProduct(primaryProduct, combo.primary),
    );
    setSelectedComboSecondaryOption(
      getDefaultOptionForComboProduct(secondaryProduct, combo.secondary),
    );
  }

  function handleComboPrimaryProductChange(name: string) {
    if (!selectedCombo) return;
    const primaryProduct = getComboCandidates(selectedCombo.primary).find(
      (product) => product.name === name,
    );
    setSelectedComboPrimaryName(name);
    setSelectedComboPrimaryOption(
      getDefaultOptionForComboProduct(primaryProduct, selectedCombo.primary),
    );
  }

  function handleComboSecondaryProductChange(name: string) {
    if (!selectedCombo) return;
    const secondaryProduct = getComboCandidates(selectedCombo.secondary).find(
      (product) => product.name === name,
    );
    setSelectedComboSecondaryName(name);
    setSelectedComboSecondaryOption(
      getDefaultOptionForComboProduct(secondaryProduct, selectedCombo.secondary),
    );
  }

  function addToCart(product: SelectedProduct) {
    const unitPriceCents = getSelectedBasePrice(product);
    const key = `${product.categoryId}-${product.name}-${selectedOption}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);

      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          key,
          name: product.name,
          categoryName: product.categoryName,
          quantity: 1,
          option: selectedOption,
          unitPriceCents,
        },
      ];
    });

    setToastMessage(`${product.name} ajouté au panier`);
    setSelected(null);
    setSelectedOption('');
  }

  function addComboToCart() {
    if (!selectedCombo || !selectedComboPrimaryName || !selectedComboSecondaryName) {
      return;
    }

    const primaryCandidates = getComboCandidates(selectedCombo.primary);
    const secondaryCandidates = getComboCandidates(selectedCombo.secondary);

    const primaryProduct = primaryCandidates.find(
      (product) => product.name === selectedComboPrimaryName,
    );
    const secondaryProduct = secondaryCandidates.find(
      (product) => product.name === selectedComboSecondaryName,
    );

    if (primaryProduct?.options?.length && !selectedComboPrimaryOption) return;
    if (secondaryProduct?.options?.length && !selectedComboSecondaryOption) return;

    const primaryOptionPart = selectedComboPrimaryOption
      ? `${selectedComboPrimaryName} (${selectedComboPrimaryOption})`
      : selectedComboPrimaryName;

    const secondaryOptionPart = selectedComboSecondaryOption
      ? `${selectedComboSecondaryName} (${selectedComboSecondaryOption})`
      : selectedComboSecondaryName;

    const optionText = `${primaryOptionPart} + ${secondaryOptionPart}`;
    const key = `${selectedCombo.id}-${optionText}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          key,
          name: selectedCombo.name,
          categoryName: 'Formule combo',
          quantity: 1,
          option: optionText,
          unitPriceCents: selectedCombo.priceCents,
        },
      ];
    });

    setToastMessage(`${selectedCombo.name} ajoutée au panier`);
    setSelectedCombo(null);
    setSelectedComboPrimaryName('');
    setSelectedComboSecondaryName('');
    setSelectedComboPrimaryOption('');
    setSelectedComboSecondaryOption('');
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function getHotComboSuggestions(productName?: string) {
    if (!productName) return [];
    if (productName === 'Thé') {
      return comboOffers.filter((combo) => combo.id === 'combo-tea-time');
    }
    if (productName === 'Café') {
      return comboOffers.filter((combo) => combo.id === 'combo-coffee-break');
    }
    if (productName === 'Chocolat chaud protéiné') {
      return comboOffers.filter((combo) => combo.id === 'combo-choco-cocoon');
    }
    if (productName === 'Café gourmet') {
      return comboOffers.filter((combo) => combo.id === 'combo-gourmet-break');
    }
    return comboOffers.filter((combo) =>
      [
        'combo-tea-time',
        'combo-coffee-break',
        'combo-choco-cocoon',
        'combo-gourmet-break',
      ].includes(combo.id),
    );
  }

  const whatsappLink = `https://wa.me/${BRAND.whatsappNumber}?text=${buildWhatsAppMessage(
    cart,
    customerName,
    pickupTime,
    cartTotalCents,
  )}`;

  function handleWhatsAppOrder() {
    if (!hasRequiredPickupInfo) {
      window.alert('Merci de renseigner ton prénom / nom et ton heure de retrait.');
      return;
    }

    if (cart.length === 0) {
      window.alert('Ton panier est vide.');
      return;
    }

    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  }

  async function handleSquareCheckout() {
    try {
      if (cart.length === 0) {
        window.alert('Ton panier est vide.');
        return;
      }

      if (!hasRequiredPickupInfo) {
        window.alert('Merci de renseigner ton prénom / nom et ton heure de retrait.');
        return;
      }

      setIsCreatingPayment(true);

      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, customerName, pickupTime }),
      });

      const raw = await response.text();
      let data: { url?: string; error?: string; message?: string } = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw || 'Réponse invalide du serveur.' };
      }

      if (!response.ok || !data?.url) {
        console.error('Square error:', data);
        window.alert(
          data?.error ||
            data?.message ||
            'Erreur lors de la création du paiement Square.',
        );
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      window.alert('Erreur lors de la création du paiement Square.');
    } finally {
      setIsCreatingPayment(false);
    }
  }

  const selectedTotal = selected ? getSelectedBasePrice(selected) : 0;
  const selectedComboPrimaryCandidates = selectedCombo
    ? getComboCandidates(selectedCombo.primary)
    : [];
  const selectedComboSecondaryCandidates = selectedCombo
    ? getComboCandidates(selectedCombo.secondary)
    : [];

  const selectedComboPrimaryProduct = selectedComboPrimaryCandidates.find(
    (product) => product.name === selectedComboPrimaryName,
  );
  const selectedComboSecondaryProduct = selectedComboSecondaryCandidates.find(
    (product) => product.name === selectedComboSecondaryName,
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.06),_transparent_28%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:40px_40px]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-[0_0_30px_rgba(255,255,255,0.04)]">
            <p className="text-3xl font-black leading-none tracking-tight">
              {BRAND.shortName}
            </p>
            <p className="mt-1 text-xs text-white/55">
              Shakes & Drinks • Verdun • Commande rapide
            </p>
          </div>

          <motion.button
            onClick={() => setDrawerOpen(true)}
            animate={
              cartCount > 0
                ? { scale: [1, 1.03, 1] }
                : { scale: 1 }
            }
            transition={
              cartCount > 0
                ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.2 }
            }
            className="relative rounded-2xl border border-yellow-300/40 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-5 py-3 font-black text-black shadow-[0_10px_40px_rgba(250,204,21,0.25)] transition hover:scale-[1.02]"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={18} /> Panier
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-pink-600 px-1 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32">
        {showThankYou && (
          <section className="pt-6">
            <div className="rounded-[32px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-emerald-400/8 to-transparent p-6 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    <CheckCircle2 size={14} /> Paiement confirmé
                  </p>
                  <h2 className="mt-3 text-2xl font-black md:text-3xl">
                    Merci pour ta commande 💛
                  </h2>
                  <p className="mt-2 text-white/75">
                    Ton paiement a bien été pris en compte. Merci pour ta confiance.
                    Ton avis compte beaucoup pour nous et aide La Base à grandir.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-500 px-5 py-3 font-bold text-black shadow-[0_10px_35px_rgba(250,204,21,0.22)]"
                  >
                    <Star size={16} /> Laisser un avis Google
                  </a>

                  <button
                    onClick={() => setShowThankYou(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Revenir au menu
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="pb-7 pt-8">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-yellow-400/8 via-white/[0.02] to-fuchsia-500/8 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="rounded-[33px] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.13),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_24%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(17,17,17,0.95))] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                    {BRAND.name}
                  </div>

                  <h1 className="text-3xl font-black leading-none tracking-tight md:text-5xl">
                    Le{' '}
                    <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                      Shake Bar healthy
                    </span>{' '}
                    de Verdun,
                    <br />
                    entre plaisir, énergie et accompagnement.
                  </h1>

                  <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
                    Smoothies nutritionnels, boissons énergisantes, café, thé, gaufres healthy et accompagnement personnalisé :
                    La Base t’accueille pour découvrir un univers orienté perte de poids, bien-être, énergie au quotidien et nutrition sportive.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Perte de poids', 'Bien-être', 'Énergie', 'Sport'].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                      <MapPin size={16} className="text-yellow-400" /> {BRAND.address}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.pickup}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.prep}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={BRAND.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-bold text-black shadow-[0_10px_30px_rgba(250,204,21,0.22)]"
                    >
                      <MapPin size={16} /> Je m’y rends
                    </a>

                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 font-semibold text-white transition hover:bg-white/[0.09]"
                    >
                      <Star size={16} /> Laisser un avis
                    </a>

                    <a
                      href={BRAND.discoveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/15"
                    >
                      <ChevronRight size={16} /> Découvrir l’accompagnement
                    </a>
                  </div>
                </div>

                <div className="hidden items-end gap-2 md:flex md:flex-col">
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                    Premium
                  </span>
                  <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                    Fast order
                  </span>
                  <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white">
                    Shake bar vibes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-9 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.10),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">
                  Produits du mois
                </p>
                <h2 className="mt-1 text-2xl font-black md:text-3xl">
                  Les saveurs qui attirent le plus en ce moment
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Deux recettes très visuelles, gourmandes et parfaites pour créer l’effet waouh dès la première visite.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                    Édition du moment
                  </span>
                  <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1 text-xs font-semibold text-pink-200">
                    Très demandé au club
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {monthlyItems.map((item) => {
                const product = allProducts.find((p) => p.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openProduct(item.name)}
                    className="group relative overflow-hidden rounded-[28px] border border-white/10 text-left shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-yellow-400/30"
                  >
                    <div className="relative h-[340px]">
                      <ProductCardBackground image={product?.image} name={item.name} />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">
                          {item.subtitle}
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">
                          {item.name}
                        </p>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/72">
                          {item.description}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300">
                          Voir la fiche produit <ChevronRight size={15} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Découvrir l’accompagnement
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Envie d’aller plus loin que la commande ?
            </h2>

            <div className="mt-4 space-y-3">
              {accompagnementCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="inline-flex items-center gap-2 font-black">
                      <Icon size={16} className="text-yellow-300" /> {card.title}
                    </p>
                    <p className="mt-1 text-sm text-white/65">{card.text}</p>
                  </div>
                );
              })}

              <a
                href={BRAND.discoveryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
              >
                <ChevronRight size={18} /> Découvrir l’accompagnement
              </a>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Formules combo
              </p>
              <h2 className="mt-1 text-2xl font-black md:text-3xl">
                Les offres les plus complètes du club
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-white/65">
                Associe un smoothie nutritionnel et une boisson énergisante, ou crée une vraie pause chaude avec thé, café, chocolat chaud ou café gourmet + gaufre topping au choix.
              </p>
            </div>
          </div>

          <div className="mb-5 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(236,72,153,0.08),rgba(250,204,21,0.10))] p-[1px] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="grid gap-5 rounded-[29px] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.96))] p-5 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">
                  <Flame size={14} /> Best combo
                </p>
                <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">
                  {bestCombo.name}
                </h3>
                <p className="mt-2 text-white/70">
                  {bestCombo.subtitle} — la formule la plus forte visuellement et la plus complète à mettre en avant.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                    Prix : {euroFromCents(bestCombo.priceCents)}
                  </span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
                    Économie : {euroFromCents(bestCombo.normalPriceCents - bestCombo.priceCents)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openCombo(bestCombo.id)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-5 py-3 font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
                >
                  Composer ce combo <ChevronRight size={18} />
                </button>
              </div>

              <div className="relative h-[220px] overflow-hidden rounded-[24px] border border-white/10">
                <ComboCardImage image={bestCombo.image} name={bestCombo.name} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {comboOffers.map((combo) => (
              <button
                key={combo.id}
                type="button"
                onClick={() => openCombo(combo.id)}
                className="group relative overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_14px_40px_rgba(0,0,0,0.30)] transition hover:-translate-y-1 hover:border-yellow-400/25"
              >
                <div className="relative h-[255px] md:h-[270px]">
                  <ComboCardImage image={combo.image} name={combo.name} />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-cyan-400 to-pink-500" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {combo.subtitle}
                      </span>
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                        Économise {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white">{combo.name}</p>
                    <p className="mt-1 max-w-lg text-sm text-white/72">{combo.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black text-white">{euroFromCents(combo.priceCents)}</p>
                        <p className="text-sm text-white/55 line-through">{euroFromCents(combo.normalPriceCents)}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                        Composer <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-7 flex flex-col gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une saveur, une catégorie, un goût..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-11 pr-4 text-white outline-none backdrop-blur focus:border-yellow-400/50"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <FilterPill
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              label="Tout"
            />
            {categories.map((category) => (
              <FilterPill
                key={category.id}
                active={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                label={category.name}
              />
            ))}
          </div>
        </section>

        <section className="mb-8 space-y-9">
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div
                      className={`mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${category.accent} px-3 py-1 text-sm font-black text-black shadow-lg`}
                    >
                      <Icon size={16} /> {category.name}
                    </div>

                    <h2 className="text-2xl font-black md:text-3xl">{category.price}</h2>
                    <p className="text-white/60">{category.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[...category.items]
                    .sort((a, b) => {
                      const rank = (item: Product) => {
                        if (item.badge === 'Produit du mois') return 4;
                        if (item.badge === 'Nouveau') return 3;
                        if (item.badge === 'Best-seller') return 2;
                        if (item.badge === 'Iconique') return 1;
                        return 0;
                      };
                      return rank(b) - rank(a);
                    })
                    .map((item) => (
                      <motion.button
                        key={`${category.id}-${item.name}`}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => openProductFromCategory(category, item)}
                        className="group relative overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_14px_40px_rgba(0,0,0,0.30)] transition hover:border-yellow-400/25 hover:shadow-[0_18px_50px_rgba(0,0,0,0.36)]"
                      >
                        <div className="relative h-[460px]">
                          <ProductCardBackground image={item.image} name={item.name} />

                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              {item.badge && (
                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${getBadgeClassName(
                                    item.badge,
                                  )}`}
                                >
                                  {getBadgeLabel(item.badge)}
                                </span>
                              )}
                              {getStartingPriceLabel(item) && (
                                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
                                  Dès {getStartingPriceLabel(item)}
                                </span>
                              )}
                            </div>

                            <p className="text-[2rem] leading-none font-black text-white drop-shadow-lg">
                              {item.name}
                            </p>
                            <p className="mt-3 text-base text-white/72">
                              {item.flavors}
                            </p>

                            <div className="mt-6 flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-white/85">
                                Personnaliser
                              </span>
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur">
                                <ChevronRight size={18} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-8 grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
          <div className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.08),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Best sellers
                </p>
                <h2 className="text-2xl font-black md:text-3xl">
                  Les signatures du club
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Une sélection qui représente le mieux l’univers La Base :
                  gourmandise, énergie, fraîcheur et visuel fort.
                </p>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70 md:inline-flex">
                Déjà testé & approuvé au club
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {featuredItems.map((item) => {
                const product = allProducts.find((p) => p.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openProduct(item.name)}
                    className="group relative overflow-hidden rounded-[24px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-yellow-400/25"
                  >
                    <div className="relative h-[250px]">
                      <ProductCardBackground image={product?.image} name={item.name} />
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                        <p className="text-lg font-black text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-white/68">{item.subtitle}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[30px] border border-yellow-400/20 bg-gradient-to-br from-yellow-400/12 via-yellow-300/8 to-transparent p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-1"
            >
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-yellow-300">
                <Star size={14} /> Avis Google
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Partage ton expérience
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Ton avis aide le club à grandir et permet à de nouvelles personnes
                de découvrir La Base Shakes & Drinks.
              </p>
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[30px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/12 via-pink-500/8 to-transparent p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-1"
            >
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-fuchsia-300">
                <Instagram size={14} /> Instagram
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Retrouve l’univers du club sur Instagram
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Nouveautés, saveurs du moment, visuels gourmands, ambiance du club
                et coulisses : tout l’univers La Base en un coup d’œil.
              </p>
            </a>
          </div>
        </section>

        <footer className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                La Base Shakes & Drinks
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Des produits gourmands avec une vraie logique bien-être
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Smoothies nutritionnels, boissons énergisantes, boissons santé,
                café, thé, formules combo et gaufre : tout est pensé pour allier plaisir,
                rapidité et expérience simple à commander. Tu peux aussi découvrir
                l’accompagnement autour du bien-être, de la perte de poids, de l’énergie
                et de la nutrition sportive.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
                <p className="font-bold text-white">Adresse</p>
                <p className="mt-1">{BRAND.address}</p>
              </div>

              <a
                href={BRAND.discoveryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/15"
              >
                <ChevronRight size={18} /> Découvrir l’accompagnement
              </a>

              <a
                href={BRAND.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)]"
              >
                <MapPin size={18} /> Je m’y rends
              </a>
            </div>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/75 p-4 backdrop-blur-md md:grid md:place-items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_26%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(17,17,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:static md:max-w-xl md:rounded-[34px]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${selected.categoryAccent} px-3 py-1 text-sm font-black text-black`}
                >
                  {selected.categoryName}
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative mb-5 h-80 overflow-hidden rounded-[26px] border border-white/8">
                <ProductModalImage image={selected.image} name={selected.name} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.56)_100%)]" />
              </div>

              <h3 className="text-3xl font-black">{selected.name}</h3>
              <p className="mt-2 text-white/68">{selected.description}</p>
              <p className="mt-3 text-sm text-white/50">{selected.flavors}</p>

              <div className="mt-4 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                Prix : {euroFromCents(selectedTotal)}
              </div>

              {selected.options && selected.options.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 font-bold">{getOptionSectionLabel(selected)}</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedOption(opt.label)}
                        className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                          selectedOption === opt.label
                            ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black shadow-[0_8px_25px_rgba(250,204,21,0.18)]'
                            : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected.categoryId === 'smoothies' && (
                <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    <Flame size={14} /> Passe en formule combo
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {comboOffers
                      .filter((combo) => combo.id === 'combo-medium' || combo.id === 'combo-power')
                      .map((combo) => (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => openCombo(combo.id, { primaryName: selected.name })}
                          className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="font-black text-white">{combo.name}</p>
                          <p className="mt-1 text-sm text-white/65">
                            {combo.subtitle} • {euroFromCents(combo.priceCents)}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-cyan-200">
                            Économie : {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {selected.categoryId === 'drinks' && (
                <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    <Flame size={14} /> Passe en formule combo
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {comboOffers
                      .filter((combo) => combo.id === 'combo-medium' || combo.id === 'combo-power')
                      .map((combo) => (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => openCombo(combo.id, { secondaryName: selected.name })}
                          className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="font-black text-white">{combo.name}</p>
                          <p className="mt-1 text-sm text-white/65">{combo.subtitle}</p>
                          <p className="mt-2 text-sm font-semibold text-cyan-200">
                            Économie : {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {selected.categoryId === 'hot' && (
                <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    <Flame size={14} /> Passe en formule combo chaude
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {getHotComboSuggestions(selected.name).map((combo) => (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => openCombo(combo.id, { primaryName: selected.name })}
                        className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                      >
                        <p className="font-black text-white">{combo.name}</p>
                        <p className="mt-1 text-sm text-white/65">{combo.subtitle}</p>
                        <p className="mt-2 text-sm font-semibold text-cyan-200">
                          Économie : {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected.categoryId === 'waffles' && (
                <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-cyan-400/5 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                    <Flame size={14} /> Ajoute une boisson chaude en formule
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {comboOffers
                      .filter((combo) =>
                        ['combo-tea-time', 'combo-coffee-break', 'combo-choco-cocoon', 'combo-gourmet-break'].includes(combo.id),
                      )
                      .map((combo) => (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => openCombo(combo.id, { secondaryName: selected.name })}
                          className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                        >
                          <p className="font-black text-white">{combo.name}</p>
                          <p className="mt-1 text-sm text-white/65">{combo.subtitle}</p>
                          <p className="mt-2 text-sm font-semibold text-cyan-200">
                            Économie : {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => addToCart(selected)}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_14px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
              >
                Ajouter au panier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCombo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 p-4 backdrop-blur-md md:grid md:place-items-center"
            onClick={() => setSelectedCombo(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_26%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(17,17,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:static md:max-w-2xl md:rounded-[34px]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${selectedCombo.accent} px-3 py-1 text-sm font-black text-black`}>
                  Formule combo
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCombo(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative mb-5 h-72 overflow-hidden rounded-[26px] border border-white/8">
                <ComboCardImage image={selectedCombo.image} name={selectedCombo.name} />
              </div>

              <h3 className="text-3xl font-black text-white">{selectedCombo.name}</h3>
              <p className="mt-2 text-white/68">{selectedCombo.description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
                  Prix : {euroFromCents(selectedCombo.priceCents)}
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Économie : {euroFromCents(selectedCombo.normalPriceCents - selectedCombo.priceCents)}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-3 font-bold text-white">{selectedCombo.primary.label}</p>

                  {selectedComboPrimaryCandidates.length > 1 && !selectedCombo.primary.fixedProductName && (
                    <div className="space-y-2">
                      {selectedComboPrimaryCandidates.map((product) => (
                        <button
                          key={product.name}
                          type="button"
                          onClick={() => handleComboPrimaryProductChange(product.name)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            selectedComboPrimaryName === product.name
                              ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black'
                              : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCombo.primary.fixedProductName && selectedComboPrimaryProduct && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white">
                      {selectedComboPrimaryProduct.name}
                    </div>
                  )}

                  {selectedComboPrimaryProduct?.options?.length && !selectedCombo.primary.fixedOptionLabel && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedComboPrimaryProduct.options.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setSelectedComboPrimaryOption(opt.label)}
                          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                            selectedComboPrimaryOption === opt.label
                              ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black'
                              : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCombo.primary.fixedOptionLabel && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80">
                      {selectedCombo.primary.fixedOptionLabel}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-3 font-bold text-white">{selectedCombo.secondary.label}</p>

                  {selectedComboSecondaryCandidates.length > 1 && !selectedCombo.secondary.fixedProductName && (
                    <div className="space-y-2">
                      {selectedComboSecondaryCandidates.map((product) => (
                        <button
                          key={product.name}
                          type="button"
                          onClick={() => handleComboSecondaryProductChange(product.name)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            selectedComboSecondaryName === product.name
                              ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black'
                              : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCombo.secondary.fixedProductName && selectedComboSecondaryProduct && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white">
                      {selectedComboSecondaryProduct.name}
                    </div>
                  )}

                  {selectedComboSecondaryProduct?.options?.length && !selectedCombo.secondary.fixedOptionLabel && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedComboSecondaryProduct.options.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setSelectedComboSecondaryOption(opt.label)}
                          className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                            selectedComboSecondaryOption === opt.label
                              ? 'border-yellow-400 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 text-black'
                              : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCombo.secondary.fixedOptionLabel && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80">
                      {selectedCombo.secondary.fixedOptionLabel}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-white/70">Formule sélectionnée</p>
                <p className="mt-2 text-lg font-black text-white">
                  {selectedComboPrimaryName || 'Choisis le premier produit'} + {selectedComboSecondaryName || 'Choisis le second produit'}
                </p>
                <p className="mt-1 text-sm text-white/60">{selectedCombo.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={addComboToCart}
                disabled={!selectedComboPrimaryName || !selectedComboSecondaryName}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_14px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ajouter la formule au panier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,#ffffff,#f8f8f8)] text-black shadow-[0_0_80px_rgba(0,0,0,0.35)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur">
                <div>
                  <h3 className="text-2xl font-black">Ton panier</h3>
                  <p className="text-sm text-black/55">
                    {cartCount} article{cartCount > 1 ? 's' : ''} • {euroFromCents(cartTotalCents)}
                  </p>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-black/70 transition hover:bg-black/5"
                >
                  Fermer
                </button>
              </div>

              <div className="p-5">
                {cart.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-black/15 bg-black/[0.03] p-6 text-center text-black/60">
                    Ton panier est vide pour le moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-black">{item.name}</p>
                            <p className="text-sm text-black/60">{item.categoryName}</p>
                            {item.option && (
                              <p className="mt-1 text-sm font-medium text-amber-700">
                                {item.option}
                              </p>
                            )}
                            <p className="mt-2 text-sm font-black text-black">
                              {euroFromCents(item.unitPriceCents * item.quantity)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.key, -1)}
                              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-black/[0.04]"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-5 text-center font-bold text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.key, 1)}
                              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white transition hover:bg-black/[0.04]"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {firstSmoothieInCart && !firstDrinkInCart && (
                      <div className="rounded-3xl border border-black/10 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                          <Flame size={14} /> Passe en formule combo
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute une boisson et profite d’un tarif plus avantageux.
                        </p>
                        <div className="mt-3 space-y-2">
                          {comboOffers
                            .filter((combo) => combo.id === 'combo-medium' || combo.id === 'combo-power')
                            .map((combo) => (
                              <button
                                key={combo.id}
                                type="button"
                                onClick={() => openCombo(combo.id, { primaryName: firstSmoothieInCart.name })}
                                className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:bg-black/[0.03]"
                              >
                                <div>
                                  <p className="font-black text-black">{combo.name}</p>
                                  <p className="text-sm text-black/60">{combo.subtitle}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-black">{euroFromCents(combo.priceCents)}</p>
                                  <p className="text-xs font-semibold text-cyan-700">
                                    Économie {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {!firstSmoothieInCart && firstDrinkInCart && (
                      <div className="rounded-3xl border border-black/10 bg-gradient-to-r from-fuchsia-50 to-yellow-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700">
                          <Flame size={14} /> Complète avec un smoothie
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Passe en formule combo et ajoute un smoothie pour un prix plus fort et plus lisible.
                        </p>
                        <div className="mt-3 space-y-2">
                          {comboOffers
                            .filter((combo) => combo.id === 'combo-medium' || combo.id === 'combo-power')
                            .map((combo) => (
                              <button
                                key={combo.id}
                                type="button"
                                onClick={() => openCombo(combo.id, { secondaryName: firstDrinkInCart.name })}
                                className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:bg-black/[0.03]"
                              >
                                <div>
                                  <p className="font-black text-black">{combo.name}</p>
                                  <p className="text-sm text-black/60">{combo.subtitle}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-black">{euroFromCents(combo.priceCents)}</p>
                                  <p className="text-xs font-semibold text-fuchsia-700">
                                    Économie {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {firstHotInCart && !firstWaffleInCart && (
                      <div className="rounded-3xl border border-black/10 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                          <Flame size={14} /> Passe en formule chaude
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute une gaufre topping au choix et profite d’une formule plus avantageuse.
                        </p>
                        <div className="mt-3 space-y-2">
                          {getHotComboSuggestions(firstHotInCart.name).map((combo) => (
                            <button
                              key={combo.id}
                              type="button"
                              onClick={() => openCombo(combo.id, { primaryName: firstHotInCart.name })}
                              className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:bg-black/[0.03]"
                            >
                              <div>
                                <p className="font-black text-black">{combo.name}</p>
                                <p className="text-sm text-black/60">{combo.subtitle}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-black">{euroFromCents(combo.priceCents)}</p>
                                <p className="text-xs font-semibold text-orange-700">
                                  Économie {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!firstHotInCart && firstWaffleInCart && (
                      <div className="rounded-3xl border border-black/10 bg-gradient-to-r from-amber-50 to-rose-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                          <Flame size={14} /> Ajoute une boisson chaude en formule
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Associe ta gaufre à un thé, café, chocolat chaud ou café gourmet avec une économie directe.
                        </p>
                        <div className="mt-3 space-y-2">
                          {comboOffers
                            .filter((combo) =>
                              ['combo-tea-time', 'combo-coffee-break', 'combo-choco-cocoon', 'combo-gourmet-break'].includes(combo.id),
                            )
                            .map((combo) => (
                              <button
                                key={combo.id}
                                type="button"
                                onClick={() => openCombo(combo.id, { secondaryName: 'Gaufre healthy' })}
                                className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:bg-black/[0.03]"
                              >
                                <div>
                                  <p className="font-black text-black">{combo.name}</p>
                                  <p className="text-sm text-black/60">{combo.subtitle}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-black">{euroFromCents(combo.priceCents)}</p>
                                  <p className="text-xs font-semibold text-amber-700">
                                    Économie {euroFromCents(combo.normalPriceCents - combo.priceCents)}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-3xl border border-black/10 bg-gradient-to-r from-yellow-50 to-amber-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-black/70">Total</span>
                        <span className="text-xl font-black text-black">
                          {euroFromCents(cartTotalCents)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                      <p className="font-bold text-black">Infos de retrait</p>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ton prénom / nom"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none placeholder:text-black/35 focus:border-yellow-500"
                      />
                      <input
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        placeholder="Heure de retrait souhaitée"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none placeholder:text-black/35 focus:border-yellow-500"
                      />
                    </div>

                    {!hasRequiredPickupInfo && (
                      <div className="rounded-2xl border border-amber-300/40 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900">
                        Merci de renseigner ton prénom / nom et ton heure de retrait
                        avant d’envoyer ou payer la commande.
                      </div>
                    )}

                    <button
                      onClick={handleWhatsAppOrder}
                      disabled={!hasRequiredPickupInfo}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-black text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle size={18} /> Envoyer sur WhatsApp
                    </button>

                    <button
                      onClick={handleSquareCheckout}
                      disabled={!hasRequiredPickupInfo || isCreatingPayment}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingPayment
                        ? 'Création du paiement...'
                        : 'Payer avec Square'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 overflow-hidden rounded-[22px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(0,0,0,0.86))] px-4 py-3 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Ajout confirmé
                </p>
                <p className="text-sm font-black text-white">{toastMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;