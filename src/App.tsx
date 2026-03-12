import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Baby,
  Instagram,
  Star,
} from 'lucide-react';

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

const categories = [
  {
    id: 'smoothies',
    name: 'Smoothies nutritionnels',
    icon: Coffee,
    price: '8,90€',
    accent: 'from-yellow-400 to-amber-500',
    description: '24g de protéines végétales • 25 vitamines & minéraux • 250 calories',
    items: [
      { name: 'Choco Buenos', flavors: 'Saveur type Kinder Bueno', badge: 'Produit du mois' },
      { name: 'M&M', flavors: 'Saveur type M&M', badge: 'Produit du mois' },
      { name: 'Casse Noisette', flavors: 'Café latte • Noisette', badge: 'Best-seller' },
      { name: 'Cappuccino', flavors: 'Café latte • Chocolat intense' },
      { name: 'Pina Colada', flavors: 'Vanille • Ananas • Coco' },
      { name: 'Fraise Bonbon', flavors: 'Vanille • Fraise', badge: 'Gourmand' },
      { name: "Pim's", flavors: 'Chocolat • Framboise' },
      { name: 'Tarte à la pomme', flavors: 'Vanille • Pomme' },
      { name: 'Snickers', flavors: 'Chocolat • Cacahuètes', badge: 'Ultra gourmand' },
      { name: 'Full Oréo', flavors: 'Cookies cream • Oréo' },
      { name: 'Speculoos', flavors: 'Chocolat • Speculoos' },
      { name: 'Banana Split', flavors: 'Banane • Caramel • Cerise • Chocolat' },
      { name: 'Banana Noisette', flavors: 'Banane • Caramel • Noisette • Chocolat' },
      { name: 'Cookies', flavors: 'Cookies cream • Chocolat blanc' },
      { name: 'Tropical', flavors: 'Vanille • Fraise • Banane' },
    ],
  },
  {
    id: 'energy',
    name: 'Boissons énergisantes',
    icon: Zap,
    price: '6,90€ / 8,90€',
    accent: 'from-fuchsia-500 to-pink-600',
    description: '0 sucre • 20 calories • vitamines B & C • extraits végétaux',
    options: ['Start 6,90€', 'Boost 8,90€'],
    items: [
      { name: 'Cherry White Grappe', flavors: 'Citron • Framboise • Cerise • Raisin blanc', badge: 'Nouveau' },
      { name: 'Red Paradize', flavors: 'Citron • Pêche • Ananas', badge: 'Nouveau' },
      { name: 'Electric Blue', flavors: 'Citron • Framboise bleue • Myrtille • Raisin', badge: 'Iconique' },
      { name: 'Pomelon', flavors: 'Citron • Framboise • Melon • Pomme' },
      { name: 'Tonic Mandarine', flavors: 'Citron • Mandarine' },
      { name: 'Apple Kiss', flavors: 'Citron • Pomme verte' },
      { name: 'Pina Colada', flavors: 'Citron • Pina colada • Ananas' },
      { name: 'Soleil', flavors: 'Citron • Pêche • Mandarine • Ananas' },
      { name: 'Black Panther', flavors: 'Citron • Cerise • Framboise bleue', badge: 'Dark vibe' },
      { name: "L'Exotic", flavors: 'Citron • Pêche • Passion • Fruit du dragon • Ananas' },
      { name: "T'Coco", flavors: 'Citron • Pêche • Mandarine • Coco' },
      { name: 'Elf', flavors: 'Citron • Pêche • Framboise bleue • Pomme • Ananas' },
      { name: 'Perroquet', flavors: 'Citron • Fraise • Framboise bleue • Raisin • Pêche' },
      { name: 'La Vie en Rose', flavors: 'Citron • Framboise • Pomme • Fruit du dragon' },
      { name: 'Sortilège Noir', flavors: 'Citron • Framboise • Cerise • Fraise • Myrtille' },
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
      { name: 'Hydrat’Max', flavors: 'Orange • Mandarine', badge: 'Vitamine C' },
      { name: 'Casse Grippe', flavors: 'Baies sauvages • Framboise • Pomme', badge: 'Immunité' },
      { name: 'Limonade Rose', flavors: 'Fraise • Citron • Framboise', badge: 'Glow' },
      { name: 'Digest', flavors: 'Pomme • Fraise • Citron', badge: 'Fibres & probiotiques' },
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
      { name: 'Café chaud', flavors: 'Petit 3,90€ • Grand 5,90€' },
      { name: 'Chocolat chaud', flavors: 'Noisette • Speculoos • Caramel • Vanille • Cookie', badge: '25g protéines' },
      { name: 'Thé aloe vera chaud', flavors: 'Pêche • Framboise • Citron' },
      { name: 'Café gourmand glacé', flavors: 'Macchiato • Choco mocha • Latte noisettes • Vanille latte', badge: '5,90€' },
      { name: 'Café glacé', flavors: 'Macchiato', badge: '6,90€' },
    ],
  },
  {
    id: 'sport',
    name: 'Sportifs',
    icon: Dumbbell,
    price: '5,90€ à 8,90€',
    accent: 'from-violet-500 to-blue-600',
    description: 'Hydratation sport • récupération • créatine',
    items: [
      { name: 'Electro’Lyte', flavors: 'Boisson glucidique & électrolytes', badge: 'Performance' },
      { name: 'Post Workout', flavors: 'Boisson chocolat • 25g protéines • BCAA' },
    ],
  },
] as const;

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
] as const;

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
] as const;

const extras = ['Collagène', 'Booster immunité', 'Fibres à la pomme', 'Probiotiques', 'Électrolytes', 'Créatine', 'Protéines'] as const;

type Category = (typeof categories)[number];
type ProductItem = Category['items'][number];
type ItemWithCategory = ProductItem & {
  categoryId: string;
  categoryName: string;
  categoryPrice: string;
  categoryAccent: string;
  categoryOptions: string[];
};
type CartItem = {
  key: string;
  name: string;
  categoryName: string;
  quantity: number;
  option: string;
  extras: string[];
};
type SelectedProduct = ProductItem &
  Category & {
    categoryName: string;
    categoryId: string;
  };

function buildWhatsAppMessage(
  cart: Array<{
    quantity: number;
    categoryName: string;
    name: string;
    option?: string;
    extras?: string[];
  }>,
  name: string,
  pickupTime: string
) {
  const lines = [
    'Bonjour 👋',
    '',
    'Je souhaite commander :',
    '',
    ...cart.map(
      (item) =>
        `• ${item.quantity}x ${item.categoryName} - ${item.name}${item.option ? ` (${item.option})` : ''}${item.extras?.length ? ` + ${item.extras.join(', ')}` : ''}`
    ),
    '',
    `Nom : ${name || 'À compléter'}`,
    `Heure de retrait : ${pickupTime || 'À compléter'}`,
    '',
    'Merci 🙂',
    'La Base Shakes & Drinks',
  ];
  return encodeURIComponent(lines.join('\n'));
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



  const allItems = useMemo<ItemWithCategory[]>(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryId: category.id,
          categoryName: category.name,
          categoryPrice: category.price,
          categoryAccent: category.accent,
          categoryOptions: category.options ? [...category.options] : [],
        }))
      ),
    []
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
              category.name.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [query, activeCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product: { categoryId: string; categoryName: string; name: string }) {
    const key = `${product.categoryId}-${product.name}-${selectedOption}-${selectedExtras.join('|')}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        return prev.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...prev,
        {
          key,
          name: product.name,
          categoryName: product.categoryName,
          quantity: 1,
          option: selectedOption,
          extras: selectedExtras,
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
        .map((item) => (item.key === key ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function toggleExtra(extra: string) {
    setSelectedExtras((prev) => (prev.includes(extra) ? prev.filter((entry) => entry !== extra) : [...prev, extra]));
async function handleSquareCheckout() {
  try {
    if (cart.length === 0) {
      alert('Ton panier est vide.');
      return;
    }

    setIsCreatingPayment(true);

    const response = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error(data);
      alert("Impossible de créer le paiement Square pour le moment.");
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    alert("Une erreur est survenue lors de la création du paiement.");
  } finally {
    setIsCreatingPayment(false);
  }
}
  }

  const whatsappLink = `https://wa.me/${BRAND.whatsappNumber}?text=${buildWhatsAppMessage(cart, customerName, pickupTime)}`;

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
                    Smoothie bar healthy, club de nutrition et espace bien-être : découvre des boissons gourmandes,
                    des recettes fonctionnelles et un accompagnement orienté perte de poids, prise de masse, énergie au
                    quotidien et récupération.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <MapPin size={16} className="text-yellow-400" /> {BRAND.address}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                      <Clock3 size={16} className="text-yellow-400" /> {BRAND.pickup}
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
                    onClick={() => {
                      if (!linkedProduct) return;
                      const category = categories.find((entry) => entry.id === linkedProduct.categoryId);
                      if (!category) return;
                      setSelected({
                        ...linkedProduct,
                        ...category,
                        categoryName: category.name,
                        categoryId: category.id,
                      } as SelectedProduct);
                      setSelectedOption(category.options ? category.options[0] : '');
                      setSelectedExtras([]);
                    }}
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
                    {category.options && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {category.options.map((opt) => (
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
                      const rank = (item: { badge?: string }) => {
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
                        onClick={() => {
                          setSelected({
                            ...item,
                            ...category,
                            categoryName: category.name,
                            categoryId: category.id,
                          } as SelectedProduct);
                          setSelectedOption(category.options ? category.options[0] : '');
                          setSelectedExtras([]);
                        }}
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
                  Une sélection pensée pour mettre en avant les recettes qui représentent le mieux l’univers La Base :
                  gourmandise, énergie, fraîcheur et visuel fort.
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
                    onClick={() => {
                      if (!linkedProduct) return;
                      const category = categories.find((entry) => entry.id === linkedProduct.categoryId);
                      if (!category) return;
                      setSelected({
                        ...linkedProduct,
                        ...category,
                        categoryName: category.name,
                        categoryId: category.id,
                      } as SelectedProduct);
                      setSelectedOption(category.options ? category.options[0] : '');
                      setSelectedExtras([]);
                    }}
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
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-[28px] border border-yellow-400/20 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/15"
            >
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-yellow-300">
                <Star size={14} /> Avis Google
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">Partage ton expérience</h2>
              <p className="mt-2 text-sm text-white/70">
                Ton avis aide le club à grandir et permet à de nouvelles personnes de découvrir La Base Shakes & Drinks.
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
              <h2 className="mt-2 text-2xl font-black text-white">Retrouve l’univers du club sur Instagram</h2>
              <p className="mt-2 text-sm text-white/70">
                Nouveautés, saveurs du moment, visuels gourmands, ambiance du club et coulisses : tout l’univers La Base
                en un coup d’œil.
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
                Nos smoothies nutritionnels, boissons énergisantes, boissons santé et options sportives sont pensés pour
                allier plaisir, praticité et accompagnement. Le club t’accueille à Verdun pour découvrir un univers
                orienté énergie, nutrition, perte de poids, prise de masse et routine healthy au quotidien.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                <p className="font-bold text-white">Adresse</p>
                <p className="mt-1">{BRAND.address}</p>
              </div>
              <a
                href={`https://wa.me/${BRAND.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-green-500 px-4 py-3 font-bold text-white"
              >
                <MessageCircle size={18} /> Commander sur WhatsApp
              </a>
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
              className="absolute bottom-0 left-0 right-0 mx-auto rounded-t-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_32%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.98))] p-6 md:static md:max-w-xl md:rounded-[32px]"
            >
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${selected.accent} px-3 py-1 text-sm font-bold text-black`}>
                {selected.categoryName}
              </div>
              <h3 className="text-3xl font-black">{selected.name}</h3>
              <p className="mt-2 text-white/65">{selected.flavors}</p>
              <p className="mt-3 font-bold text-yellow-400">Prix : {selected.price}</p>

              {selected.options && (
                <div className="mt-6">
                  <p className="mb-2 font-bold">Choix de format</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedOption(opt)}
                        className={`rounded-2xl border px-4 py-2 ${
                          selectedOption === opt
                            ? 'border-yellow-400 bg-yellow-400 font-bold text-black'
                            : 'border-white/10 bg-white/5 text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="mb-2 font-bold">Extras santé</p>
                <div className="flex flex-wrap gap-2">
                  {extras.map((extra) => (
                    <button
                      key={extra}
                      onClick={() => toggleExtra(extra)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        selectedExtras.includes(extra)
                          ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/10 bg-white/5 text-white/80'
                      }`}
                    >
                      {extra}
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
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setDrawerOpen(false)}
            />
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
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.key, -1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-white/10"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-5 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, 1)}
                            className="grid h-8 w-8 place-items-center rounded-full border border-white/10"
                          >
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

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-lg font-black text-white"
                  >
                    <MessageCircle size={18} /> Envoyer sur WhatsApp
                  </a>

                  <button
  onClick={handleSquareCheckout}
  disabled={isCreatingPayment}
  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-black text-black disabled:opacity-60"
>
  {isCreatingPayment ? 'Création du paiement...' : 'Payer avec Square'}
</button>
                </div>
              )}
            </motion.aside>
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