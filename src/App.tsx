import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Baby,
  Instagram,
  Star,
} from 'lucide-react';

type ProductOption = {
  label: string;
  priceCents: number;
};

type Product = {
  name: string;
  flavors: string;
  badge?: string;
  description?: string;
  image?: string;
  options?: ProductOption[];
};

type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  price: string;
  accent: string;
  description: string;
  sizeHints?: string[];
  items: Product[];
};

type SelectedProduct = Product & {
  categoryId: string;
  categoryName: string;
  categoryPrice: string;
  categoryAccent: string;
  categorySizeHints: string[];
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
  domainPath: 'www.labase-nutrition.com/shakesbar',
  pickup: 'Retrait sur place • Verdun',
  prep: 'Commande prête en 5 à 10 min',
  whatsappNumber: '33679448759',
  squareCheckoutBaseUrl: 'https://square.link/u/TON-LIEN',
  address: '11 rue Saint Pierre, Verdun',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=11+rue+Saint+Pierre+Verdun',
};

const googleReviewUrl = 'https://g.page/r/CeJabN1yW1toEAE/review';
const instagramUrl = 'https://www.instagram.com/labase_verdun/';

const extraCatalog = [
  { name: 'Collagène', label: 'Collagène +2,50€', priceCents: 250 },
  { name: 'Booster immunité', label: 'Booster immunité +2,50€', priceCents: 250 },
  { name: 'Fibres à la pomme', label: 'Fibres à la pomme +2,50€', priceCents: 250 },
  { name: 'Probiotiques', label: 'Probiotiques +2,50€', priceCents: 250 },
  { name: 'Électrolytes', label: 'Électrolytes +2,50€', priceCents: 250 },
  { name: 'Créatine', label: 'Créatine +2,50€', priceCents: 250 },
  { name: 'Protéines', label: 'Protéines +2,50€', priceCents: 250 },
] as const;

const categories: Category[] = [
  {
    id: 'smoothies',
    name: 'Smoothies nutritionnels',
    icon: Coffee,
    price: '8,90€',
    accent: 'from-yellow-400 to-amber-500',
    description: '24g de protéines végétales • 25 vitamines & minéraux • 250 calories',
    items: [
      { name: 'Choco Buenos', flavors: 'Saveur type Kinder Bueno', badge: 'Produit du mois', image: '/images/shake/bueno.png', description: 'Une recette ultra gourmande inspirée de l’univers Bueno.' },
      { name: 'M&M', flavors: 'Saveur type M&M', badge: 'Produit du mois', image: '/images/shake/mm.png', description: 'Une saveur fun, régressive et généreuse.' },
      { name: 'Casse Noisette', flavors: 'Café latte • Noisette', badge: 'Best-seller', image: '/images/shake/casse-noisette.png' },
      { name: 'Cappuccino', flavors: 'Café latte • Chocolat intense', image: '/images/shake/cappuccino.png' },
      { name: 'Pina Colada', flavors: 'Vanille • Ananas • Coco', image: '/images/shake/pina-colada.png' },
      { name: 'Fraise Bonbon', flavors: 'Vanille • Fraise', badge: 'Gourmand', image: '/images/shake/fraise-bonbon.png' },
      { name: "Pim's", flavors: 'Chocolat • Framboise', image: '/images/shake/pims.png' },
      { name: 'Tarte à la pomme', flavors: 'Vanille • Pomme', image: '/images/shake/tarte-a-la-pomme.png' },
      { name: 'Snickers', flavors: 'Chocolat • Cacahuètes', badge: 'Ultra gourmand', image: '/images/shake/snikers.png' },
      { name: 'Full Oréo', flavors: 'Cookies cream • Oréo', image: '/images/shake/full-oreo.png' },
      { name: 'Speculoos', flavors: 'Chocolat • Speculoos', image: '/images/shake/speculoos.png' },
      { name: 'Banana Split', flavors: 'Banane • Caramel • Cerise • Chocolat', image: '/images/shake/banana-split.png' },
      { name: 'Banana Noisette', flavors: 'Banane • Caramel • Noisette • Chocolat', image: '/images/shake/banane-noisette.png' },
      { name: 'Cookies', flavors: 'Cookies cream • Chocolat blanc', image: '/images/shake/cookies-cream.png' },
      { name: 'Tropical', flavors: 'Vanille • Fraise • Banane', image: '/images/shake/tropical.png' },
    ],
  },
  {
    id: 'energy',
    name: 'Boissons énergisantes',
    icon: Zap,
    price: '6,90€ / 8,90€',
    accent: 'from-fuchsia-500 to-pink-600',
    description: '0 sucre • 20 calories • vitamines B & C • extraits végétaux',
    sizeHints: ['Medium 550ml — 6,90€', 'Large 950ml — 8,90€'],
    items: [
      {
        name: 'Cherry White Grappe',
        flavors: 'Citron • Framboise • Cerise • Raisin blanc',
        badge: 'Nouveau',
        image: '/images/drinks/cherry-white-grappe.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Red Paradize',
        flavors: 'Citron • Pêche • Ananas',
        badge: 'Nouveau',
        image: '/images/drinks/red-paradize.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Electric Blue',
        flavors: 'Citron • Framboise bleue • Myrtille • Raisin',
        badge: 'Iconique',
        image: '/images/drinks/electric-blue.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Po Melon',
        flavors: 'Citron • Framboise • Melon • Pomme',
        image: '/images/drinks/po-melon.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Tonic Mandarine',
        flavors: 'Citron • Mandarine',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Apple Kiss',
        flavors: 'Citron • Pomme verte',
        image: '/images/drinks/apple-kiss.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Pina Colada',
        flavors: 'Citron • Pina colada • Ananas',
        image: '/images/drinks/pina-colada.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Soleil',
        flavors: 'Citron • Pêche • Mandarine • Ananas',
        image: '/images/drinks/soleil.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Black Panther',
        flavors: 'Citron • Cerise • Framboise bleue',
        badge: 'Dark vibe',
        image: '/images/drinks/black-panther.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: "L'Exotic",
        flavors: 'Citron • Pêche • Passion • Fruit du dragon • Ananas',
        image: '/images/drinks/l-exotic.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: "T'Coco",
        flavors: 'Citron • Pêche • Mandarine • Coco',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Elf',
        flavors: 'Citron • Pêche • Framboise bleue • Pomme • Ananas',
        image: '/images/drinks/elf.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Perroquet',
        flavors: 'Citron • Fraise • Framboise bleue • Raisin • Pêche',
        image: '/images/drinks/perroquet.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'La Vie en Rose',
        flavors: 'Citron • Framboise • Pomme • Fruit du dragon',
        image: '/images/drinks/la-vie-en-rose.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Sortilège Noir',
        flavors: 'Citron • Framboise • Cerise • Fraise • Myrtille',
        image: '/images/drinks/sortilege-noir.png',
        options: [
          { label: 'Medium 550ml — 6,90€', priceCents: 690 },
          { label: 'Large 950ml — 8,90€', priceCents: 890 },
        ],
      },
      {
        name: 'Electro’Lyte',
        flavors: 'Boisson glucidique & électrolytes',
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
    price: '6,90€ / 8,90€',
    accent: 'from-emerald-400 to-lime-500',
    description: 'Hydratation • fibres • probiotiques • bien-être ciblé',
    items: [
      { name: 'Hydrat’Max', flavors: 'Orange • Mandarine', badge: 'Vitamine C', image: '/images/sante/hydrat-max.png' },
      { name: 'Casse Grippe', flavors: 'Baies sauvages • Framboise • Pomme', badge: 'Immunité', image: '/images/sante/casse-grippe.png' },
      { name: 'Limonade Rose', flavors: 'Fraise • Citron • Framboise', badge: 'Glow', image: '/images/sante/limonade rose.png' },
      { name: 'Digest', flavors: 'Pomme • Fraise • Citron', badge: 'Fibres & probiotiques', image: '/images/sante/di-gest.png' },
    ],
  },
  {
    id: 'kids',
    name: 'Boissons enfants',
    icon: Baby,
    price: '5€',
    accent: 'from-sky-400 to-indigo-500',
    description: '0 sucre • 0 calorie • saveurs fun',
    items: [
      { name: 'Bulle de Fée', flavors: 'Pomme • Fruit du dragon' },
      { name: 'Spiderman', flavors: 'Fruits rouges' },
      { name: 'Stitch', flavors: 'Passion • Limonade non pétillante' },
      { name: 'Licorne', flavors: 'Myrtille • Fraise • Raisin' },
      { name: 'Hulk', flavors: 'Pomme verte' },
      { name: 'Tropicool', flavors: 'Melon • Ananas' },
    ],
  },
  {
    id: 'hot-cold',
    name: 'Cafés • chocolats • thés',
    icon: Coffee,
    price: '3,90€ à 6,90€',
    accent: 'from-orange-400 to-yellow-500',
    description: 'Chauds ou glacés • gourmands • options protéinées',
    items: [
      {
        name: 'Café chaud',
        flavors: 'Petit 250ml • Grand 450ml',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/cafe-classique.png',
      },
      {
        name: 'Chocolat chaud protéiné',
        flavors: 'Noisette • Speculoos • Caramel • Vanille • Cookie',
        badge: '25g protéines',
        options: [
          { label: 'Noisette — 6,90€', priceCents: 690 },
          { label: 'Speculoos — 6,90€', priceCents: 690 },
          { label: 'Caramel — 6,90€', priceCents: 690 },
          { label: 'Vanille — 6,90€', priceCents: 690 },
          { label: 'Cookie — 6,90€', priceCents: 690 },
        ],
        image: '/images/hot/chocolat-chaud.png',
      },
      {
        name: 'Thé aloe vera chaud',
        flavors: 'Pêche • Framboise • Citron',
        options: [
          { label: 'Petit 250ml — 3,90€', priceCents: 390 },
          { label: 'Grand 450ml — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/the-aloe-vera.png',
      },
      {
        name: 'Café gourmet',
        flavors: 'Macchiato • Choco mocha • Latte noisettes • Vanille latte',
        badge: '5,90€',
        options: [
          { label: 'Macchiato — 5,90€', priceCents: 590 },
          { label: 'Choco mocha — 5,90€', priceCents: 590 },
          { label: 'Latte noisettes — 5,90€', priceCents: 590 },
          { label: 'Vanille latte — 5,90€', priceCents: 590 },
        ],
        image: '/images/hot/cafe-gourmet.png',
      },
      {
        name: 'Café glacé',
        flavors: 'Macchiato',
        badge: '6,90€',
        options: [{ label: 'Macchiato — 6,90€', priceCents: 690 }],
      },
    ],
  },
  {
    id: 'waffles',
    name: 'Gaufres healthy',
    icon: Coffee,
    price: '6,90€',
    accent: 'from-amber-400 to-orange-500',
    description: '24g de protéines • 200 kcal • toppings inclus',
    items: [
      {
        name: 'Gaufre healthy',
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
];

const monthlyItems = [
  {
    name: 'Choco Buenos',
    subtitle: 'Produit du mois • Mars',
    description:
      'Une recette ultra gourmande inspirée de l’univers Bueno, pensée pour celles et ceux qui veulent se faire plaisir avec une saveur forte et réconfortante.',
    image: '/images/choco-buenos.jpg',
    color: 'from-amber-400 to-orange-500',
  },
  {
    name: 'M&M',
    subtitle: 'Produit du mois • Mars',
    description:
      'Une saveur fun, régressive et généreuse, parfaite pour créer l’effet waouh dès le premier regard et la première gorgée.',
    image: '/images/mm.jpg',
    color: 'from-red-500 to-yellow-400',
  },
];

const featuredItems = [
  {
    name: 'Choco Buenos',
    category: 'Smoothies nutritionnels',
    vibe: 'Produit du mois',
    color: 'from-amber-400 to-orange-500',
    image: '/images/choco-buenos.jpg',
  },
  {
    name: 'M&M',
    category: 'Smoothies nutritionnels',
    vibe: 'Produit du mois',
    color: 'from-red-500 to-yellow-400',
    image: '/images/mm.jpg',
  },
  {
    name: 'Snickers',
    category: 'Smoothies nutritionnels',
    vibe: 'Ultra gourmand',
    color: 'from-yellow-400 to-amber-500',
    image: '/images/snickers.jpg',
  },
  {
    name: 'Electric Blue',
    category: 'Boissons énergisantes',
    vibe: 'Iconique',
    color: 'from-cyan-400 to-blue-600',
    image: '/images/electric-blue.jpg',
  },
  {
    name: 'Limonade Rose',
    category: 'Boissons santé',
    vibe: 'Glow',
    color: 'from-pink-400 to-rose-500',
    image: '/images/limonade-rose.jpg',
  },
  {
    name: 'Full Oréo',
    category: 'Smoothies nutritionnels',
    vibe: 'Crémeux',
    color: 'from-zinc-300 to-zinc-500',
    image: '/images/full-oreo.jpg',
  },
];

function euroFromCents(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
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

  const allItems = useMemo<SelectedProduct[]>(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryId: category.id,
          categoryName: category.name,
          categoryPrice: category.price,
          categoryAccent: category.accent,
          categorySizeHints: category.sizeHints || [],
        })),
      ),
    [],
  );

  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const q = query.toLowerCase().trim();
          const matchesCategory = activeCategory === 'all' || activeCategory === category.id;
          if (!q) return matchesCategory;
          return (
            matchesCategory &&
            (item.name.toLowerCase().includes(q) ||
              item.flavors.toLowerCase().includes(q) ||
              (item.description || '').toLowerCase().includes(q) ||
              category.name.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [query, activeCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalCents = cart.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

  const whatsappLink = `https://wa.me/${BRAND.whatsappNumber}?text=${buildWhatsAppMessage(
    cart.map((item) => ({
      quantity: item.quantity,
      categoryName: item.categoryName,
      name: item.name,
      option: item.option,
      extras: item.extras,
    })),
    customerName,
    pickupTime,
  )}`;

  function getSelectedBasePrice(product: SelectedProduct) {
    if (selectedOption && product.options?.length) {
      const found = product.options.find((opt) => opt.label === selectedOption);
      if (found) return found.priceCents;
    }
    return product.basePriceCents ?? 0;
  }

  function getSelectedExtrasTotal() {
    return selectedExtras.reduce((sum, extraName) => {
      const extra = extraCatalog.find((entry) => entry.name === extraName);
      return sum + (extra?.priceCents ?? 0);
    }, 0);
  }

  function openSelectedProduct(product: SelectedProduct) {
    setSelected(product);
    setSelectedOption(product.options?.[0]?.label ?? '');
    setSelectedExtras([]);
  }

  function openProductByName(productName: string) {
    const product = allItems.find((entry) => entry.name === productName);
    if (!product) return;
    openSelectedProduct(product);
  }

  function addToCart(product: SelectedProduct) {
    const unitPriceCents = getSelectedBasePrice(product) + getSelectedExtrasTotal();
    const key = `${product.categoryId}-${product.name}-${selectedOption}-${selectedExtras.join('|')}`;

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
          extras: [...selectedExtras],
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
          item.key === key ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function toggleExtra(extra: string) {
    setSelectedExtras((prev) =>
      prev.includes(extra) ? prev.filter((entry) => entry !== extra) : [...prev, extra],
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),_transparent_30%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-2xl font-black tracking-tight">LA BASE</p>
            <p className="text-xs text-white/60">Shakes & Drinks • Verdun • Commande rapide</p>
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
        <section className="pt-8 pb-6">
          <div className="rounded-[28px] overflow-hidden border border-white/10 bg-gradient-to-br from-fuchsia-600/20 via-yellow-400/10 to-cyan-400/20 p-1 shadow-2xl">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.20),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_26%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(20,20,20,0.94))] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                    {BRAND.name}
                  </div>
                  <h1 className="text-3xl font-black leading-none tracking-tight md:text-5xl">
                    Le <span className="text-yellow-400">spot healthy et gourmand</span> de Verdun,
                    <br />
                    entre plaisir, énergie et nutrition.
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">
                    Smoothie bar healthy, club de nutrition et espace bien-être : découvre des boissons gourmandes, des recettes
                    fonctionnelles et un accompagnement orienté perte de poids, prise de masse, énergie au quotidien et récupération.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <MapPin size={16} className="text-yellow-400" /> {BRAND.address}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.pickup}
                    </div>
                    <a href={BRAND.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 font-bold text-black">
                      <MapPin size={16} /> Je m’y rends
                    </a>
                  </div>
                </div>
                <div className="hidden items-end gap-2 md:flex md:flex-col">
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black">0 sucre</span>
                  <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">100% energy</span>
                  <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white">Végétal</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">Produits du mois</p>
                <h2 className="mt-1 text-2xl font-black md:text-3xl">Les saveurs à découvrir maintenant</h2>
              </div>
              <span className="hidden rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300 md:inline-flex">
                Édition mise en avant
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {monthlyItems.map((item) => {
                const linkedProduct = allItems.find((entry) => entry.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => linkedProduct && openSelectedProduct(linkedProduct)}
                    className="group overflow-hidden rounded-[24px] border border-white/10 bg-black/30 text-left transition hover:border-yellow-400/30"
                  >
                    <div className="relative h-52 overflow-hidden border-b border-white/10 bg-black/20">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const next = e.currentTarget.nextElementSibling;
                          if (next instanceof HTMLElement) next.style.display = 'block';
                        }}
                      />
                      <div className={`hidden h-full w-full bg-gradient-to-br ${item.color} opacity-90`} />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">{item.subtitle}</p>
                        <p className="mt-1 text-2xl font-black text-white">{item.name}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm leading-relaxed text-white/70">{item.description}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300">
                        Voir la fiche produit <ChevronRight size={15} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Commande rapide</p>
            <h2 className="mt-1 text-2xl font-black">Le bon format pour convertir</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">1. Je choisis ma boisson</p>
                <p className="mt-1 text-sm text-white/65">Par catégorie, par envie ou via la recherche.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">2. J’envoie ma commande</p>
                <p className="mt-1 text-sm text-white/65">Le panier prépare automatiquement le message WhatsApp.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p className="font-black">3. Je récupère au club</p>
                <p className="mt-1 text-sm text-white/65">Retrait sur place à Verdun, rapidement et simplement.</p>
              </div>
              <a
                href={`https://wa.me/${BRAND.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-green-500 px-4 py-3 font-bold text-white"
              >
                <MessageCircle size={18} /> Commander maintenant
              </a>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une saveur, une catégorie, un goût..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-11 pr-4 outline-none focus:border-yellow-400/50"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <FilterPill active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label="Tout" />
            {categories.map((category) => (
              <FilterPill key={category.id} active={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} label={category.name} />
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
                    <div className={`mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${category.accent} px-3 py-1 text-sm font-bold text-black`}>
                      <Icon size={16} /> {category.name}
                    </div>
                    <h2 className="text-2xl font-black md:text-3xl">{category.price}</h2>
                    <p className="text-white/60">{category.description}</p>
                    {category.sizeHints && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {category.sizeHints.map((opt) => (
                          <span key={opt} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="hidden items-center gap-2 text-sm text-yellow-300 md:inline-flex">
                    Voir la catégorie <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[...category.items]
                    .sort((a, b) => {
                      const rank = (item: Product) => {
                        if (item.badge === 'Produit du mois') return 3;
                        if (item.badge === 'Nouveau') return 2;
                        if (item.badge === 'Best-seller') return 1;
                        return 0;
                      };
                      return rank(b) - rank(a);
                    })
                    .map((item) => (
                      <motion.button
                        key={`${category.id}-${item.name}`}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          openSelectedProduct({
                            ...item,
                            categoryId: category.id,
                            categoryName: category.name,
                            categoryPrice: category.price,
                            categoryAccent: category.accent,
                            categorySizeHints: category.sizeHints || [],
                          })
                        }
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 text-left transition hover:border-yellow-400/30 hover:bg-white/[0.07]"
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.16),_transparent_25%)] opacity-0 transition group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xl font-black leading-tight">{item.name}</p>
                            <p className="mt-2 text-sm text-white/65">{item.flavors}</p>
                          </div>
                          <div className={`h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br ${category.accent} opacity-90`} />
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
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Best sellers</p>
                <h2 className="text-2xl font-black md:text-3xl">Les boissons signatures du club</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Une sélection pensée pour mettre en avant les recettes qui représentent le mieux l’univers La Base : gourmandise,
                  énergie, fraîcheur et visuel fort.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {featuredItems.map((item) => {
                const linkedProduct = allItems.find((entry) => entry.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => linkedProduct && openSelectedProduct(linkedProduct)}
                    className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-4 text-left transition hover:border-yellow-400/30"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.color}`} />
                    <div className="mb-4 overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-40 w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const next = e.currentTarget.nextElementSibling;
                          if (next instanceof HTMLElement) next.style.display = 'block';
                        }}
                      />
                      <div className={`hidden h-40 w-full bg-gradient-to-br ${item.color} opacity-90`} />
                    </div>
                    <p className="text-lg font-black">{item.name}</p>
                    <p className="mt-1 text-sm text-white/60">{item.category}</p>
                    <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                      {item.vibe}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <a href={googleReviewUrl} target="_blank" rel="noreferrer" className="block rounded-[28px] border border-yellow-400/20 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/15">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-yellow-300">
                <Star size={14} /> Avis Google
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Partage ton expérience</h2>
              <p className="mt-2 text-sm text-white/70">
                Ton avis aide le club à grandir et permet à de nouvelles personnes de découvrir La Base Shakes & Drinks.
              </p>
            </a>

            <a href={instagramUrl} target="_blank" rel="noreferrer" className="block rounded-[28px] border border-fuchsia-400/20 bg-fuchsia-500/10 p-5 transition hover:bg-fuchsia-500/15">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-fuchsia-300">
                <Instagram size={14} /> Instagram
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Retrouve l’univers du club sur Instagram</h2>
              <p className="mt-2 text-sm text-white/70">
                Nouveautés, saveurs du moment, visuels gourmands, ambiance du club et coulisses : tout l’univers La Base en un coup d’œil.
              </p>
            </a>
          </div>
        </section>

        <footer className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">La Base Shakes & Drinks</p>
              <h2 className="mt-2 text-2xl font-black">Des boissons gourmandes avec une vraie logique bien-être</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Nos smoothies nutritionnels, boissons énergisantes, boissons santé, boissons enfants et boissons chaudes sont pensés pour allier plaisir,
                praticité et accompagnement. Le club t’accueille à Verdun pour découvrir un univers orienté énergie, nutrition, perte de poids,
                prise de masse et routine healthy au quotidien.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                <p className="font-bold text-white">Adresse</p>
                <p className="mt-1">{BRAND.address}</p>
              </div>
              <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-green-500 px-4 py-3 font-bold text-white">
                <MessageCircle size={18} /> Commander sur WhatsApp
              </a>
              <a href={BRAND.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-yellow-400 px-4 py-3 font-bold text-black">
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
              className="absolute bottom-0 left-0 right-0 mx-auto rounded-t-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_32%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.98))] p-6 md:static md:max-w-xl md:rounded-[32px]"
            >
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${selected.categoryAccent} px-3 py-1 text-sm font-bold text-black`}>
                {selected.categoryName}
              </div>
              <h3 className="text-3xl font-black">{selected.name}</h3>
              <p className="mt-2 text-white/65">{selected.flavors}</p>
              <p className="mt-3 font-bold text-yellow-400">
                Prix : {selected.options?.length ? euroFromCents(getSelectedBasePrice(selected) + getSelectedExtrasTotal()) : selected.categoryPrice}
              </p>

              {selected.options && selected.options.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 font-bold">Choix de format</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.options.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedOption(opt.label)}
                        className={`rounded-2xl border px-4 py-2 ${
                          selectedOption === opt.label ? 'border-yellow-400 bg-yellow-400 font-bold text-black' : 'border-white/10 bg-white/5 text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="mb-2 font-bold">Extras santé</p>
                <div className="flex flex-wrap gap-2">
                  {extraCatalog.map((extra) => (
                    <button
                      key={extra.name}
                      onClick={() => toggleExtra(extra.name)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        selectedExtras.includes(extra.name) ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300' : 'border-white/10 bg-white/5 text-white/80'
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 230 }}
              className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.10),_transparent_20%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(18,18,18,0.99))] p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-2xl font-black">Ton panier</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-white/60">
                  Fermer
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-white/60">
                  Ton panier est vide pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.key} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{item.name}</p>
                          <p className="text-sm text-white/60">{item.categoryName}</p>
                          {item.option && <p className="mt-1 text-sm text-yellow-300">{item.option}</p>}
                          {item.extras?.length > 0 && <p className="mt-1 text-sm text-emerald-300">+ {item.extras.join(', ')}</p>}
                          <p className="mt-1 text-sm text-white/60">{euroFromCents(item.unitPriceCents)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.key, -1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10">
                            <Minus size={14} />
                          </button>
                          <span className="min-w-5 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.key, 1)} className="grid h-8 w-8 place-items-center rounded-full border border-white/10">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-bold">Infos de retrait</p>
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ton prénom / nom"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-yellow-400/50"
                    />
                    <input
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      placeholder="Heure de retrait souhaitée"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-yellow-400/50"
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Total estimé</span>
                      <span className="text-lg font-black text-yellow-300">{euroFromCents(cartTotalCents)}</span>
                    </div>
                  </div>

                  <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-lg font-black text-white">
                    <MessageCircle size={18} /> Envoyer sur WhatsApp
                  </a>

                  <a href={BRAND.squareCheckoutBaseUrl} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-black text-black">
                    Payer avec Square
                  </a>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
        active ? 'border-yellow-400 bg-yellow-400 font-bold text-black' : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

export default App;