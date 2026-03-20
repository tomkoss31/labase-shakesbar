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
  Dumbbell,
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
    accent: 'from-yellow-400 to-amber-500',
    description:
      '24g de protéines végétales • 25 vitamines & minéraux • texture gourmande',
    items: [
      {
        name: 'Choco Buenos',
        description:
          'Le smoothie signature ultra gourmand, inspiré d’une saveur type Bueno, parfait pour se faire plaisir avec une vraie logique nutrition.',
        flavors: 'Saveur type Kinder Bueno',
        badge: 'Produit du mois',
        basePriceCents: 890,
        image: '/images/shake/bueno.png',
      },
      {
        name: 'M&M',
        description:
          'Une recette fun et généreuse, pensée pour un maximum d’effet waouh dès le premier regard.',
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
        description:
          'Une recette fraîche et exotique, à l’esprit vacances.',
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
          'Une association fruitée et chocolatée avec une belle intensité en bouche.',
        flavors: 'Chocolat • Framboise',
        basePriceCents: 890,
        image: '/images/shake/pims.png',
      },
      {
        name: 'Tarte à la pomme',
        description:
          'Un smoothie inspiré d’une pâtisserie iconique, avec une note pomme/vanille très agréable.',
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
    price: 'Start 6,90€ • Boost 8,90€',
    accent: 'from-fuchsia-500 to-pink-600',
    description:
      '0 sucre • 20 calories • vitamines B & C • extraits végétaux',
    items: [
      {
        name: 'Apple Kiss',
        description:
          'Une boisson fraîche et vive, parfaite pour un boost léger ou renforcé.',
        flavors: 'Citron • Pomme verte',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
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
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/black-panther.png',
      },
      {
        name: 'Cherry White Grappe',
        description:
          'Une création fruitée très complète, avec un profil original et rafraîchissant.',
        flavors: 'Citron • Framboise • Cerise • Raisin blanc',
        badge: 'Nouveau',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
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
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/electric-blue.png',
      },
      {
        name: 'Elf',
        description:
          'Une recette fun et fruitée, très agréable et très accessible.',
        flavors: 'Citron • Pêche • Framboise bleue • Pomme • Ananas',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/elf.png',
      },
      {
        name: 'La Vie en Rose',
        description:
          'Une boisson pleine de fraîcheur avec un vrai côté pink signature.',
        flavors: 'Citron • Framboise • Pomme • Fruit du dragon',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/la-vie-en-rose.png',
      },
      {
        name: "L'Exotic",
        description:
          'La recette exotique par excellence pour ceux qui aiment les notes tropicales.',
        flavors: 'Citron • Pêche • Passion • Fruit du dragon • Ananas',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/l-exotic.png',
      },
      {
        name: 'Perroquet',
        description:
          'Une boisson très colorée et très fun, pensée pour marquer visuellement.',
        flavors: 'Citron • Fraise • Framboise bleue • Raisin • Pêche',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/perroquet.png',
      },
      {
        name: 'Pina Colada',
        description:
          'Une version énergisante à l’esprit vacances, très facile à aimer.',
        flavors: 'Citron • Pina colada • Ananas',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/pina-colada.png',
      },
      {
        name: 'Po Melon',
        description:
          'Une recette fraîche et fruitée avec une belle personnalité.',
        flavors: 'Citron • Framboise • Melon • Pomme',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/po-melon.png',
      },
      {
        name: 'Red Paradize',
        description:
          'Une boisson lumineuse, fruitée et très agréable à boire.',
        flavors: 'Citron • Pêche • Ananas',
        badge: 'Nouveau',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/red-paradize.png',
      },
      {
        name: 'Soleil',
        description:
          'Un mix ensoleillé aux notes pêche, mandarine et ananas.',
        flavors: 'Citron • Pêche • Mandarine • Ananas',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/soleil.png',
      },
      {
        name: 'Sortilège Noir',
        description:
          'Une recette mystérieuse, fruitée et très impactante visuellement.',
        flavors: 'Citron • Framboise • Cerise • Fraise • Myrtille',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
        image: '/images/drinks/sortilege-noir.png',
      },
    ],
  },
  {
    id: 'health',
    name: 'Boissons santé',
    icon: Heart,
    price: '6,90€',
    accent: 'from-emerald-400 to-lime-500',
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
          'Une recette pensée autour du confort, de la chaleur et du soutien immunité.',
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
          'Un soutien ciblé avec fibres et probiotiques, dans une version simple et efficace.',
        flavors: 'Pomme • Fraise • Citron',
        badge: 'Fibres & probiotiques',
        basePriceCents: 690,
        image: '/images/sante/di-gest.png',
      },
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: Dumbbell,
    price: 'Start 6,90€ • Boost 8,90€',
    accent: 'from-violet-500 to-blue-600',
    description: 'Hydratation sport • électrolytes • récupération',
    items: [
      {
        name: 'Electro’Lyte',
        description:
          'La boisson sport pensée pour l’hydratation et le soutien de l’effort.',
        flavors: 'Boisson glucidique & électrolytes',
        badge: 'Performance',
        image: '/images/sport/electro-lyte.png',
        options: [
          { label: 'Start 6,90€', priceCents: 690 },
          { label: 'Boost 8,90€', priceCents: 890 },
        ],
      },
    ],
  },
  {
    id: 'hot',
    name: 'Café / Thé',
    icon: Coffee,
    price: 'Petit 3,90€ • Grand 5,90€',
    accent: 'from-orange-400 to-yellow-500',
    description: 'Boissons chaudes simples, efficaces et gourmandes',
    items: [
      {
        name: 'Café',
        description:
          'Un café chaud simple et efficace, en petit ou grand format.',
        flavors: 'Petit ou grand format',
        options: [
          { label: 'Petit 3,90€', priceCents: 390 },
          { label: 'Grand 5,90€', priceCents: 590 },
        ],
        image: '/images/sante/cafe.png',
      },
      {
        name: 'Thé',
        description:
          'Une boisson chaude légère et agréable, idéale à tout moment.',
        flavors: 'Petit ou grand format',
        options: [
          { label: 'Petit 3,90€', priceCents: 390 },
          { label: 'Grand 5,90€', priceCents: 590 },
        ],
        image: '/images/sante/the.png',
      },
    ],
  },
  {
    id: 'waffles',
    name: 'Gaufre',
    icon: Coffee,
    price: '6,90€',
    accent: 'from-amber-400 to-orange-500',
    description: 'Gaufre healthy • toppings inclus',
    items: [
      {
        name: 'Gaufre healthy',
        description:
          'Une gaufre gourmande avec toppings inclus, pensée pour le plaisir sans casser l’univers healthy du club.',
        flavors:
          'Toppings inclus : Miel • Chocolat • Chocolat blanc • Caramel • Caramel beurre salé',
        options: [
          { label: 'Gaufre 6,90€', priceCents: 690 },
        ],
        image: '/images/shake/gaufre.png',
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

function getProductImageFallback(name: string) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white text-center">
      <div className="px-4">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-neutral-400">
          La Base
        </p>
        <p className="mt-2 text-lg font-black text-neutral-900">{name}</p>
      </div>
    </div>
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
          'Une recette ultra gourmande inspirée de l’univers Bueno, parfaite pour attirer l’œil et donner envie immédiatement.',
        image: '/images/shake/bueno.png',
        color: 'from-amber-400 to-orange-500',
      },
      {
        name: 'M&M',
        subtitle: 'Produit du mois',
        description:
          'Une saveur fun, généreuse et très visuelle, idéale pour créer l’effet waouh dès le premier regard.',
        image: '/images/shake/mm.png',
        color: 'from-red-500 to-yellow-400',
      },
    ],
    [],
  );

  const featuredItems = useMemo(
    () => [
      { name: 'Choco Buenos', subtitle: 'Produit du mois', image: '/images/shake/bueno.png' },
      { name: 'M&M', subtitle: 'Produit du mois', image: '/images/shake/mm.png' },
      { name: 'Snickers', subtitle: 'Ultra gourmand', image: '/images/shake/snikers.png' },
      { name: 'Electric Blue', subtitle: 'Iconique', image: '/images/drinks/electric-blue.png' },
      { name: 'Limonade Rose', subtitle: 'Glow', image: '/images/sante/limonade-rose.png' },
      { name: 'Electro’Lyte', subtitle: 'Performance', image: '/images/sport/electro-lyte.png' },
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
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),_transparent_30%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-2xl font-black tracking-tight">{BRAND.shortName}</p>
            <p className="text-xs text-white/60">
              Shakes & Drinks • Verdun • Commande rapide
            </p>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-2xl border border-yellow-400/40 bg-yellow-400 px-4 py-2 font-bold text-black shadow-lg shadow-yellow-500/20"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={18} /> Panier
            </span>

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-pink-600 px-1 text-xs text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32">
        {showThankYou && (
          <section className="pt-6">
            <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-6">
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
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black"
                  >
                    <Star size={16} /> Laisser un avis Google
                  </a>

                  <button
                    onClick={() => setShowThankYou(false)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white"
                  >
                    Revenir au menu
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="pb-6 pt-8">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-fuchsia-600/20 via-yellow-400/10 to-cyan-400/20 p-1 shadow-2xl">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.20),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_26%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(20,20,20,0.94))] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                    {BRAND.name}
                  </div>

                  <h1 className="text-3xl font-black leading-none tracking-tight md:text-5xl">
                    Le <span className="text-yellow-400">Shake Bar</span> de Verdun,
                    <br />
                    entre plaisir, énergie et nutrition.
                  </h1>

                  <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">
                    Smoothies, boissons énergisantes, boissons santé, sport, café,
                    thé et gaufre : une app simple, rapide et pensée pour commander
                    facilement avec panier, WhatsApp et paiement Square.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <MapPin size={16} className="text-yellow-400" /> {BRAND.address}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.pickup}
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.prep}
                    </div>

                    <a
                      href={BRAND.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 font-bold text-black"
                    >
                      <MapPin size={16} /> Je m’y rends
                    </a>
                  </div>
                </div>

                <div className="hidden items-end gap-2 md:flex md:flex-col">
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">
                    Rapide
                  </span>
                  <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                    Fluide
                  </span>
                  <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white">
                    Commande facile
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">
                  Produits du mois
                </p>
                <h2 className="mt-1 text-2xl font-black md:text-3xl">
                  Les saveurs à découvrir maintenant
                </h2>
              </div>

              <span className="hidden rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300 md:inline-flex">
                Mise en avant
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {monthlyItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => openProduct(item.name)}
                  className="group overflow-hidden rounded-[24px] border border-white/10 bg-black/30 text-left transition hover:border-yellow-400/30"
                >
                  <div className="relative h-56 overflow-hidden border-b border-white/10 bg-white">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-contain bg-white p-3 transition duration-300 group-hover:scale-[1.03]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const next = e.currentTarget.nextElementSibling;
                        if (next instanceof HTMLElement) next.style.display = 'flex';
                      }}
                    />
                    <div
                      className={`hidden h-full w-full items-center justify-center bg-gradient-to-br ${item.color} opacity-90`}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">
                        {item.subtitle}
                      </p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-sm leading-relaxed text-white/70">
                      {item.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300">
                      Voir la fiche produit <ChevronRight size={15} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Commande simple & rapide
            </p>
            <h2 className="mt-1 text-2xl font-black">Choisis, complète, confirme</h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">1. Je choisis mon produit</p>
                <p className="mt-1 text-sm text-white/65">
                  Via les catégories, la recherche ou les produits mis en avant.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">2. Je personnalise</p>
                <p className="mt-1 text-sm text-white/65">
                  Format Start / Boost, petit / grand, extras à +2,50€, puis ajout
                  au panier.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">3. Je valide</p>
                <p className="mt-1 text-sm text-white/65">
                  Je renseigne mon nom et mon heure de retrait, puis j’envoie sur
                  WhatsApp ou je paie directement avec Square.
                </p>
              </div>

              <button
                onClick={() => setDrawerOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-yellow-400 px-4 py-3 font-bold text-black"
              >
                <ShoppingCart size={18} /> Ouvrir mon panier
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une saveur, une catégorie, un goût..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-11 pr-4 outline-none focus:border-yellow-400/50"
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

        <section className="mb-8 space-y-8">
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div
                      className={`mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${category.accent} px-3 py-1 text-sm font-bold text-black`}
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
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openProductFromCategory(category, item)}
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 text-left transition hover:border-yellow-400/30 hover:bg-white/[0.07]"
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.16),_transparent_25%)] opacity-0 transition group-hover:opacity-100" />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {item.image && (
                              <div className="mb-4 overflow-hidden rounded-[20px] border border-white/10 bg-white">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-44 w-full object-contain bg-white p-3"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const next = e.currentTarget.nextElementSibling;
                                    if (next instanceof HTMLElement) next.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden h-44 w-full items-center justify-center bg-white">
                                  {getProductImageFallback(item.name)}
                                </div>
                              </div>
                            )}

                            <p className="text-xl font-black leading-tight">{item.name}</p>
                            <p className="mt-2 text-sm text-white/65">{item.flavors}</p>
                          </div>

                          <div
                            className={`ml-3 h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${category.accent} opacity-90`}
                          />
                        </div>

                        <div className="relative mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {item.badge && (
                              <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                                {item.badge}
                              </span>
                            )}
                          </div>

                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                            Ajouter <ChevronRight size={15} />
                          </span>
                        </div>
                      </motion.button>
                    ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-8 grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.10),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
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
              {featuredItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => openProduct(item.name)}
                  className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-4 text-left transition hover:border-yellow-400/30"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400" />

                  <div className="mb-4 overflow-hidden rounded-[20px] border border-white/10 bg-white">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-40 w-full object-contain bg-white p-3"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const next = e.currentTarget.nextElementSibling;
                        if (next instanceof HTMLElement) next.style.display = 'flex';
                      }}
                    />
                    <div className="hidden h-40 w-full items-center justify-center bg-white">
                      {getProductImageFallback(item.name)}
                    </div>
                  </div>

                  <p className="text-lg font-black">{item.name}</p>
                  <p className="mt-1 text-sm text-white/60">{item.subtitle}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[28px] border border-yellow-400/20 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/15"
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
              className="block rounded-[28px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5 transition hover:bg-fuchsia-500/15"
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

        <footer className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
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
                sport, café, thé et gaufre : tout est pensé pour allier plaisir,
                rapidité et expérience simple à commander.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                <p className="font-bold text-white">Adresse</p>
                <p className="mt-1">{BRAND.address}</p>
              </div>

              <a
                href={BRAND.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-yellow-400 px-4 py-3 font-bold text-black"
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
            className="fixed inset-0 z-40 bg-black/70 p-4 backdrop-blur-sm md:grid md:place-items-center"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_32%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.98))] p-6 md:static md:max-w-xl md:rounded-[32px]"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${selected.categoryAccent} px-3 py-1 text-sm font-bold text-black`}
                >
                  {selected.categoryName}
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {selected.image && (
                <div className="mb-4 overflow-hidden rounded-[24px] border border-white/10 bg-white">
                  <img
                    src={selected.image}
                    alt={selected.name}
                    className="h-64 w-full object-contain bg-white p-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const next = e.currentTarget.nextElementSibling;
                      if (next instanceof HTMLElement) next.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-64 w-full items-center justify-center bg-white">
                    {getProductImageFallback(selected.name)}
                  </div>
                </div>
              )}

              <h3 className="text-3xl font-black">{selected.name}</h3>
              <p className="mt-2 text-white/65">{selected.description}</p>
              <p className="mt-3 text-sm text-white/55">{selected.flavors}</p>
              <p className="mt-4 font-bold text-yellow-400">
                Prix : {euroFromCents(selectedTotal)}
              </p>

              {selected.options && selected.options.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 font-bold">Choix de format</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.options.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedOption(opt.label)}
                        className={`rounded-2xl border px-4 py-2 ${
                          selectedOption === opt.label
                            ? 'border-yellow-400 bg-yellow-400 font-bold text-black'
                            : 'border-white/10 bg-white/5 text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="mb-2 font-bold">Extras +2,50€</p>
                <div className="flex flex-wrap gap-2">
                  {extraCatalog.map((extra) => (
                    <button
                      key={extra.name}
                      type="button"
                      onClick={() => toggleExtra(extra.name)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        selectedExtras.includes(extra.name)
                          ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-white/80'
                      }`}
                    >
                      {extra.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => addToCart(selected)}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 py-4 text-lg font-black text-black shadow-lg shadow-yellow-500/20"
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
              className="fixed inset-0 z-40 bg-black/55"
              onClick={() => setDrawerOpen(false)}
            />

            <div className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto border-l border-black/10 bg-white text-black shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
                <div>
                  <h3 className="text-2xl font-black">Ton panier</h3>
                  <p className="text-sm text-black/55">
                    {cartCount} article{cartCount > 1 ? 's' : ''} • {euroFromCents(cartTotalCents)}
                  </p>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold text-black/70 hover:bg-black/5"
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
                        className="rounded-3xl border border-black/10 bg-black/[0.03] p-4"
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
                            <p className="mt-2 text-sm font-bold text-black">
                              {euroFromCents(item.unitPriceCents * item.quantity)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.key, -1)}
                              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white hover:bg-black/[0.04]"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-5 text-center font-bold text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.key, 1)}
                              className="grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white hover:bg-black/[0.04]"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-black/70">Total</span>
                        <span className="text-xl font-black text-black">
                          {euroFromCents(cartTotalCents)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-3xl border border-black/10 bg-black/[0.03] p-4">
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-lg font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MessageCircle size={18} /> Envoyer sur WhatsApp
                    </button>

                    <button
                      onClick={handleSquareCheckout}
                      disabled={!hasRequiredPickupInfo || isCreatingPayment}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingPayment
                        ? 'Création du paiement...'
                        : 'Payer avec Square'}
                    </button>
                  </div>
                )}
              </div>
            </div>
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
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
        active
          ? 'border-yellow-400 bg-yellow-400 font-bold text-black'
          : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

export default App;