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

type ExtraOption = {
  name: string;
  label: string;
  priceCents: number;
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
  extras: string[];
  unitPriceCents: number;
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
};

const googleReviewUrl = 'https://g.page/r/CeJabN1yW1toEAE/review';
const instagramUrl = 'https://www.instagram.com/labase_verdun/';

const extraCatalog: ExtraOption[] = [
  { name: 'Collagène', label: 'Collagène +2,50€', priceCents: 250 },
  { name: 'Booster immunité', label: 'Booster immunité +2,50€', priceCents: 250 },
  { name: 'Fibres à la pomme', label: 'Fibres à la pomme +2,50€', priceCents: 250 },
  { name: 'Probiotiques', label: 'Probiotiques +2,50€', priceCents: 250 },
  { name: 'Électrolytes', label: 'Électrolytes +2,50€', priceCents: 250 },
  { name: 'Créatine', label: 'Créatine +2,50€', priceCents: 250 },
  { name: 'Protéines', label: 'Protéines +2,50€', priceCents: 250 },
];

const categories: Category[] = [
  {
    id: 'smoothies',
    name: 'Smoothies nutritionnels',
    icon: Coffee,
    price: '8,90€',
    accent: 'from-yellow-400 via-amber-400 to-orange-500',
    description:
      '24g de protéines végétales • 25 vitamines & minéraux • texture gourmande',
    items: [
      {
        name: 'Choco Buenos',
        description:
          'Le smoothie signature ultra gourmand, inspiré d’une saveur type Bueno.',
        flavors: 'Saveur type Kinder Bueno',
        badge: 'Produit du mois',
        basePriceCents: 890,
        image: '/images/shake/bueno.png',
      },
      {
        name: 'M&M',
        description:
          'Une recette fun et généreuse, pensée pour un maximum d’effet waouh.',
        flavors: 'Saveur type M&M',
        badge: 'Produit du mois',
        basePriceCents: 890,
        image: '/images/shake/mm.png',
      },
      {
        name: 'Casse Noisette',
        description:
          'Un smoothie rond et réconfortant, avec une vraie identité café/noisette.',
        flavors: 'Café latte • Noisette',
        badge: 'Best-seller',
        basePriceCents: 890,
        image: '/images/shake/casse-noisette.png',
      },
      {
        name: 'Cappuccino',
        description:
          'Un grand classique gourmand pour les amateurs de café et chocolat.',
        flavors: 'Café latte • Chocolat intense',
        basePriceCents: 890,
        image: '/images/shake/cappuccino.png',
      },
      {
        name: 'Pina Colada',
        description: 'Une recette fraîche et exotique, à l’esprit vacances.',
        flavors: 'Vanille • Ananas • Coco',
        basePriceCents: 890,
        image: '/images/shake/pina-colada.png',
      },
      {
        name: 'Fraise Bonbon',
        description:
          'Une saveur douce et régressive, très appréciée pour son côté dessert.',
        flavors: 'Vanille • Fraise',
        badge: 'Gourmand',
        basePriceCents: 890,
        image: '/images/shake/fraise-bonbon.png',
      },
      {
        name: "Pim's",
        description:
          'Une association fruitée et chocolatée avec une belle intensité.',
        flavors: 'Chocolat • Framboise',
        basePriceCents: 890,
        image: '/images/shake/pims.png',
      },
      {
        name: 'Tarte à la pomme',
        description:
          'Un smoothie inspiré d’une pâtisserie iconique, avec une note pomme/vanille.',
        flavors: 'Vanille • Pomme',
        basePriceCents: 890,
        image: '/images/shake/tarte-a-la-pomme.png',
      },
      {
        name: 'Snickers',
        description:
          'Le smoothie très gourmand pour les amateurs de chocolat et cacahuètes.',
        flavors: 'Chocolat • Cacahuètes',
        badge: 'Ultra gourmand',
        basePriceCents: 890,
        image: '/images/shake/snikers.png',
      },
      {
        name: 'Full Oréo',
        description:
          'Une texture onctueuse et un profil cookie cream très réconfortant.',
        flavors: 'Cookies cream • Oréo',
        basePriceCents: 890,
        image: '/images/shake/full-oreo.png',
      },
      {
        name: 'Speculoos',
        description:
          'Une saveur chaude, épicée et gourmande, parfaite toute l’année.',
        flavors: 'Chocolat • Speculoos',
        basePriceCents: 890,
        image: '/images/shake/speculoos.png',
      },
      {
        name: 'Banana Split',
        description:
          'Une recette inspirée du dessert culte, version smoothie nutritionnel.',
        flavors: 'Banane • Caramel • Cerise • Chocolat',
        basePriceCents: 890,
        image: '/images/shake/banana-split.png',
      },
      {
        name: 'Banana Noisette',
        description:
          'Le mariage réussi de la banane, du chocolat et de la noisette.',
        flavors: 'Banane • Caramel • Noisette • Chocolat',
        basePriceCents: 890,
        image: '/images/shake/banane-noisette.png',
      },
      {
        name: 'Cookies',
        description:
          'Une recette douce, crémeuse et très appréciée des amateurs de saveurs dessert.',
        flavors: 'Cookies cream • Chocolat blanc',
        basePriceCents: 890,
        image: '/images/shake/cookies-cream.png',
      },
      {
        name: 'Tropical',
        description:
          'Un smoothie ensoleillé aux notes fruitées et faciles à boire.',
        flavors: 'Vanille • Fraise • Banane',
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
        image: '/images/sante/limonade rose.png',
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
    price: 'Petit 250ml • 3,90€ | Grand 450ml • 6,90€',
    accent: 'from-orange-400 via-amber-400 to-yellow-500',
    description: 'Boissons chaudes simples, premium et gourmandes',
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
      },
      {
        name: 'Café gourmet',
        description:
          'Une boisson café premium déclinée en plusieurs recettes gourmandes.',
        flavors: 'Macchiato • Choco mocha • Latte noisette • Vanille latte',
        badge: 'Gourmet',
        options: [
          { label: 'Macchiato — Grand 450ml — 5,90€', priceCents: 590 },
          { label: 'Choco mocha — Grand 450ml — 5,90€', priceCents: 590 },
          { label: 'Latte noisette — Grand 450ml — 5,90€', priceCents: 590 },
          { label: 'Vanille latte — Grand 450ml — 5,90€', priceCents: 590 },
        ],
      },
    ],
  },
  {
    id: 'waffles',
    name: 'Gaufre',
    icon: Coffee,
    price: '6,90€',
    accent: 'from-amber-400 via-yellow-400 to-orange-500',
    description: 'Gaufre healthy • toppings inclus',
    items: [
      {
        name: 'Gaufre healthy',
        description:
          'Une gaufre gourmande avec toppings inclus, pensée pour le plaisir.',
        flavors:
          'Toppings inclus : Miel • Chocolat • Chocolat blanc • Caramel • Caramel beurre salé',
        options: [{ label: 'Gaufre 6,90€', priceCents: 690 }],
      },
    ],
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
      const extrasPart = item.extras.length ? ` + ${item.extras.join(', ')}` : '';
      return `• ${item.quantity}x ${item.name}${optionPart}${extrasPart}`;
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
        className="h-full w-full object-cover"
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

function App() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setShowThankYou(true);
      setCart([]);
    }
  }, []);

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

  function getSelectedBasePrice(product: SelectedProduct) {
    if (selectedOption && product.options?.length) {
      const option = product.options.find((opt) => opt.label === selectedOption);
      if (option) return option.priceCents;
    }
    return product.basePriceCents ?? 0;
  }

  function getSelectedExtrasTotal() {
    return selectedExtras.reduce((sum, extraName) => {
      const extra = extraCatalog.find((entry) => entry.name === extraName);
      return sum + (extra?.priceCents ?? 0);
    }, 0);
  }

  function openProduct(productName: string) {
    const product = allProducts.find((entry) => entry.name === productName);
    if (!product) return;
    setSelected(product);
    setSelectedOption(product.options?.[0]?.label ?? '');
    setSelectedExtras([]);
  }

  function openProductFromCategory(category: Category, item: Product) {
    setSelected({
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      categoryAccent: category.accent,
      categoryPriceLabel: category.price,
    });
    setSelectedOption(item.options?.[0]?.label ?? '');
    setSelectedExtras([]);
  }

  function toggleExtra(extraName: string) {
    setSelectedExtras((prev) =>
      prev.includes(extraName)
        ? prev.filter((entry) => entry !== extraName)
        : [...prev, extraName],
    );
  }

  function addToCart(product: SelectedProduct) {
    const basePrice = getSelectedBasePrice(product);
    const extrasTotal = getSelectedExtrasTotal();
    const unitPriceCents = basePrice + extrasTotal;

    const key = `${product.categoryId}-${product.name}-${selectedOption}-${selectedExtras
      .slice()
      .sort()
      .join('|')}`;

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
          extras: [...selectedExtras].sort(),
          unitPriceCents,
        },
      ];
    });

    setSelected(null);
    setSelectedOption('');
    setSelectedExtras([]);
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

      const data = await response.json();

      if (!response.ok || !data.url) {
        console.error(data);
        window.alert(JSON.stringify(data, null, 2));
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

  const selectedTotal = selected
    ? getSelectedBasePrice(selected) + getSelectedExtrasTotal()
    : 0;

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

          <button
            onClick={() => setDrawerOpen(true)}
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
          </button>
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
                      Shake Bar
                    </span>{' '}
                    de Verdun,
                    <br />
                    entre plaisir, énergie et nutrition.
                  </h1>

                  <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
                    Smoothies, boissons énergisantes, santé, café, thé et gaufre :
                    une expérience plus premium, plus fluide et pensée pour commander
                    rapidement avec panier, WhatsApp et paiement Square.
                  </p>

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
                    <a
                      href={BRAND.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-2 font-bold text-black shadow-[0_10px_30px_rgba(250,204,21,0.22)]"
                    >
                      <MapPin size={16} /> Je m’y rends
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
                  Les saveurs à découvrir maintenant
                </h2>
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
                      <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-500 shadow-lg" />
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
              Commande simple & rapide
            </p>
            <h2 className="mt-1 text-2xl font-black">Choisis, complète, confirme</h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black">1. Je choisis mon produit</p>
                <p className="mt-1 text-sm text-white/65">
                  Via les catégories, la recherche ou les produits mis en avant.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black">2. Je personnalise</p>
                <p className="mt-1 text-sm text-white/65">
                  Format Medium / Large, petit / grand, extras à +2,50€, puis ajout
                  au panier.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black">3. Je valide</p>
                <p className="mt-1 text-sm text-white/65">
                  Je renseigne mon nom et mon heure de retrait, puis j’envoie sur
                  WhatsApp ou je paie directement avec Square.
                </p>
              </div>

              <button
                onClick={() => setDrawerOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
              >
                <ShoppingCart size={18} /> Ouvrir mon panier
              </button>
            </div>
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

                          <div className="absolute right-4 top-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-orange-500 shadow-lg opacity-95" />

                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <div className="mb-3 flex flex-wrap gap-2">
                              {item.badge && (
                                <span className="rounded-full border border-yellow-400/20 bg-yellow-400/12 px-3 py-1 text-xs font-semibold text-yellow-300 backdrop-blur">
                                  {item.badge}
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
                                Ajouter
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
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                Best sellers
              </p>
              <h2 className="text-2xl font-black md:text-3xl">
                Les boissons signatures du club
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Une sélection qui représente le mieux l’univers La Base : gourmandise,
                énergie, fraîcheur et visuel fort.
              </p>
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
                café, thé et gaufre : tout est pensé pour allier plaisir,
                rapidité et expérience simple à commander.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
                <p className="font-bold text-white">Adresse</p>
                <p className="mt-1">{BRAND.address}</p>
              </div>

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
                  <p className="mb-3 font-bold">Choix de format</p>
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

              <div className="mt-6">
                <p className="mb-3 font-bold">Extras +2,50€</p>
                <div className="flex flex-wrap gap-2">
                  {extraCatalog.map((extra) => (
                    <button
                      key={extra.name}
                      type="button"
                      onClick={() => toggleExtra(extra.name)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                        selectedExtras.includes(extra.name)
                          ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
                      }`}
                    >
                      {extra.label}
                    </button>
                  ))}
                </div>
              </div>

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
                            {item.extras.length > 0 && (
                              <p className="mt-1 text-sm text-emerald-700">
                                + {item.extras.join(', ')}
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

export default App;