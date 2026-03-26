import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingCart,
  MessageCircle,
  MapPin,
  Clock3,
  Search,
  Plus,
  Minus,
  ChevronRight,
  Instagram,
  Star,
  CheckCircle2,
  X,
  Flame,
} from 'lucide-react';
import {
  BRAND,
  accompagnementCards,
  categories,
  comboOffers,
  featuredSelections,
  googleReviewUrl,
  instagramUrl,
  productStories,
  socialProofStats,
  testimonials,
} from './data/menu';
import type { Category, ComboOffer, ComboSelectionConfig, Product } from './data/menu';

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

const PENDING_SQUARE_CHECKOUT_KEY = 'labase-pending-square-checkout';
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
      className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-[#dfb86f]/40 bg-[linear-gradient(135deg,#f0d7a7,#dfb86f,#c99745)] font-black text-[#1d160d] shadow-[0_14px_28px_rgba(227,188,114,0.18)]'
          : 'border-[#e3d6b7]/10 bg-[rgba(255,250,240,0.05)] text-white/75 hover:border-[#e3d6b7]/20 hover:bg-[rgba(255,250,240,0.08)]'
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
      const hasPendingSquareCheckout =
        window.sessionStorage.getItem(PENDING_SQUARE_CHECKOUT_KEY) === '1';

      if (hasPendingSquareCheckout) {
        setShowThankYou(true);
        setCart([]);
        window.sessionStorage.removeItem(PENDING_SQUARE_CHECKOUT_KEY);
      }

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
  const hasComboUpgradeOpportunity = Boolean(
    (firstSmoothieInCart && !firstDrinkInCart) ||
      (!firstSmoothieInCart && firstDrinkInCart) ||
      (firstHotInCart && !firstWaffleInCart) ||
      (!firstHotInCart && firstWaffleInCart),
  );

  function getConfiguredBasePrice(product: Product, optionLabel = '') {
    if (optionLabel && product.options?.length) {
      const option = product.options.find((opt) => opt.label === optionLabel);
      if (option) return option.priceCents;
    }
    return product.basePriceCents ?? product.options?.[0]?.priceCents ?? 0;
  }

  function getSelectedBasePrice(product: SelectedProduct) {
    return getConfiguredBasePrice(product, selectedOption);
  }

  function getDefaultOptionLabel(product: Product, preferredOptionLabel?: string) {
    if (!product.options?.length) return '';

    if (preferredOptionLabel) {
      const preferred = product.options.find(
        (option) => option.label === preferredOptionLabel,
      );
      if (preferred) return preferred.label;
    }

    return product.options[0]?.label ?? '';
  }

  function addPreparedProductToCart(
    product: SelectedProduct,
    optionLabel = '',
    toastLabel = product.name,
  ) {
    const unitPriceCents = getConfiguredBasePrice(product, optionLabel);
    const key = `${product.categoryId}-${product.name}-${optionLabel}`;

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
          option: optionLabel,
          unitPriceCents,
        },
      ];
    });

    setToastMessage(`${toastLabel} ajouté au panier`);
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
    addPreparedProductToCart(product, selectedOption);
    setSelected(null);
    setSelectedOption('');
  }

  function addSuggestedProduct(productName: string, preferredOptionLabel?: string) {
    const product = allProducts.find((entry) => entry.name === productName);
    if (!product) return;

    const resolvedOption = getDefaultOptionLabel(product, preferredOptionLabel);
    addPreparedProductToCart(product, resolvedOption, product.name);
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

  const drawerQuickAdds = useMemo(() => {
    if (cart.length === 0) return [];

    const cartNames = new Set(cart.map((item) => item.name));
    const suggestions: Array<{
      title: string;
      text: string;
      productName: string;
      optionLabel?: string;
      badge: string;
    }> = [];

    if (!firstWaffleInCart && !firstHotInCart) {
      suggestions.push({
        title: 'Ajoute une pause gourmande',
        text: 'La gaufre healthy complète très bien une commande drink sans l’alourdir.',
        productName: 'Gaufre healthy',
        optionLabel: 'Caramel beurre salé — 6,90€',
        badge: 'Ajout facile',
      });
    }

    if (!firstHotInCart && cartTotalCents >= 890) {
      suggestions.push({
        title: 'Ajoute une pause premium',
        text: 'Le café gourmet ajoute une vraie touche plaisir, idéale pour compléter la commande.',
        productName: 'Café gourmet',
        optionLabel: 'Macchiato — 8,90€',
        badge: 'Pause premium',
      });
    }

    if (!firstDrinkInCart && !firstSmoothieInCart && !cartNames.has('Electro’Lyte')) {
      suggestions.push({
        title: 'Ajoute une boisson performance',
        text: 'Electro’Lyte complète très bien une pause chaude ou gourmande avec une vraie logique énergie.',
        productName: 'Electro’Lyte',
        optionLabel: 'Large 950ml — 8,90€',
        badge: 'Boost énergie',
      });
    }

    return suggestions.slice(0, hasComboUpgradeOpportunity ? 1 : 2);
  }, [
    cart,
    cartTotalCents,
    hasComboUpgradeOpportunity,
    firstDrinkInCart,
    firstHotInCart,
    firstSmoothieInCart,
    firstWaffleInCart,
  ]);

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

      window.sessionStorage.setItem(PENDING_SQUARE_CHECKOUT_KEY, '1');
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
    <div className="delivery-luxe min-h-screen bg-[#050505] text-white">
      <div className="delivery-luxe__glow pointer-events-none fixed inset-0" />
      <div className="delivery-luxe__grid pointer-events-none fixed inset-0" />

      <header className="dlx-header sticky top-0 z-30 border-b border-white/10 bg-black/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="dlx-brand">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40">
              Verdun • shakes & drinks
            </p>
            <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-end md:gap-3">
              <p className="dlx-brand-wordmark text-3xl font-black leading-none tracking-tight">
                La Base
              </p>
              <p className="text-sm text-white/58">
                shakes, drinks & accompagnement
              </p>
            </div>
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
            className="dlx-cart-button relative rounded-2xl border border-yellow-300/40 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-5 py-3 font-black text-black shadow-[0_10px_40px_rgba(250,204,21,0.25)] transition hover:scale-[1.02]"
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

      <main className="dlx-main mx-auto max-w-7xl px-4 pb-32">
        {showThankYou && (
          <section className="pt-6">
            <div className="dlx-panel rounded-[32px] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/15 via-emerald-400/8 to-transparent p-6 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
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
          <div className="dlx-hero-shell overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-yellow-400/8 via-white/[0.02] to-fuchsia-500/8 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="dlx-hero-inner rounded-[33px] bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.13),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_24%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(17,17,17,0.95))] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="dlx-chip-green mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                    Healthy drinks, pauses gourmandes & good vibes
                  </div>

                  <h1 className="dlx-display text-3xl font-black leading-none tracking-tight md:text-5xl">
                    Le shake bar healthy de Verdun
                    <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                      qui fait du bien autant qu’il régale
                    </span>{' '}
                    dans une ambiance simple et chaleureuse.
                  </h1>

                  <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
                    À La Base, on vient pour boire bon, boire beau et repartir bien.
                    Shakes gourmands, healthy drinks, pauses chaudes et petites envies
                    sucrées se retrouvent dans un même esprit: plaisir, énergie et
                    accompagnement autour du bien-être, de la remise en forme, de la
                    perte de poids et de la nutrition sportive.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Healthy drinks', 'Shakes gourmands', 'Pauses chaudes', 'Accompagnement'].map((item) => (
                      <span
                        key={item}
                        className="dlx-chip rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85"
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
                      className="dlx-primary-btn inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-bold text-black shadow-[0_10px_30px_rgba(250,204,21,0.22)]"
                    >
                      <MapPin size={16} /> Je m’y rends
                    </a>

                    <a
                      href={googleReviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dlx-secondary-btn inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 font-semibold text-white transition hover:bg-white/[0.09]"
                    >
                      <Star size={16} /> Laisser un avis
                    </a>

                    <a
                      href={BRAND.discoveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dlx-accent-btn inline-flex items-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/15"
                    >
                      <ChevronRight size={16} /> Découvrir l’accompagnement
                    </a>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                        Signature du moment
                      </p>
                      <p className="mt-2 text-lg font-black text-white">Choco Buenos</p>
                      <p className="mt-1 text-sm text-white/62">
                        La recette qu’on recommande souvent pour découvrir La Base.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                        Retrait express
                      </p>
                      <p className="mt-2 text-lg font-black text-white">5 à 10 min</p>
                      <p className="mt-1 text-sm text-white/62">
                        Tu commandes, on prépare, tu passes récupérer au club.
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                        Bien plus qu’un menu
                      </p>
                      <p className="mt-2 text-lg font-black text-white">Bien-être & énergie</p>
                      <p className="mt-1 text-sm text-white/62">
                        Des produits pensés pour le plaisir, avec un accompagnement si tu veux aller plus loin.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="hidden w-full max-w-sm gap-4 lg:flex lg:flex-col">
                  <div className="dlx-panel rounded-[28px] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-[#f6dfb5]">
                      Commande simple
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Ton rituel en 3 étapes
                    </h2>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                          1. Choisis
                        </p>
                        <p className="mt-1 text-sm text-white/80">
                          Choisis ce qui te fait envie parmi les shakes, drinks, pauses chaudes et formules.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                          2. Personnalise
                        </p>
                        <p className="mt-1 text-sm text-white/80">
                          Choisis le format, la recette ou le topping tranquillement, sans te perdre.
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                          3. Retire
                        </p>
                        <p className="mt-1 text-sm text-white/80">
                          Tu commandes sur WhatsApp ou Square et ton retrait au club est prêt rapidement.
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-white/58">
                      Clair, rapide et naturel, pour commander sans détour.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCombo(bestCombo.id)}
                    className="dlx-panel-soft group overflow-hidden rounded-[28px] p-5 text-left transition hover:-translate-y-1"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-[#f6dfb5]">
                      La formule signature du moment
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">{bestCombo.name}</p>
                    <p className="mt-2 text-sm text-white/70">{bestCombo.subtitle}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black text-white">
                          {euroFromCents(bestCombo.priceCents)}
                        </p>
                        <p className="text-xs font-semibold text-[#f6dfb5]">
                          Économie {euroFromCents(bestCombo.normalPriceCents - bestCombo.priceCents)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">
                        Composer <ChevronRight size={16} />
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-9 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="dlx-panel rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.10),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-yellow-300">
                  Signatures du moment
                </p>
                <h2 className="mt-1 text-2xl font-black md:text-3xl">
                  Les recettes qui donnent envie d’ouvrir la fiche
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Deux recettes qui donnent le ton dès l’arrivée: visuelles, gourmandes et très faciles à aimer.
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
              {productStories.map((item) => {
                const product = allProducts.find((p) => p.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openProduct(item.name)}
                    className="dlx-feature-card group relative overflow-hidden rounded-[28px] border border-white/10 text-left shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-yellow-400/30"
                  >
                    <div className="relative h-[300px] md:h-[340px]">
                      <ProductCardBackground image={product?.image} name={item.name} />
                      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
                        {product ? `Dès ${getStartingPriceLabel(product)}` : item.subtitle}
                      </div>
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
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 backdrop-blur">
                          Découvrir la recette <ChevronRight size={15} />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dlx-panel rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Découvrir l’accompagnement
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Bien plus qu’une simple commande
            </h2>
            <p className="mt-2 text-sm text-white/65">
              La Base peut aussi t’aider à avancer avec un accompagnement concret, simple à comprendre et motivant.
            </p>

            <div className="mt-4 space-y-3">
              {accompagnementCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="dlx-info-card rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
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
                className="dlx-primary-btn inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-4 py-3 font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
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
                Les combos healthy & gourmands du club
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-white/65">
                Des formules simples à composer pour associer un drink, une pause gourmande ou un duo plus complet en quelques clics.
              </p>
            </div>
          </div>

          <div className="dlx-hero-shell mb-5 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(236,72,153,0.08),rgba(250,204,21,0.10))] p-[1px] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="dlx-panel-soft grid gap-5 rounded-[29px] bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.96))] p-5 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">
                  <Flame size={14} /> Combo signature
                </p>
                <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">
                  {bestCombo.name}
                </h3>
                <p className="mt-2 text-white/70">
                  {bestCombo.subtitle} — une formule facile à choisir, gourmande et bien pensée.
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
                className="dlx-combo-card group relative overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_14px_40px_rgba(0,0,0,0.30)] transition hover:-translate-y-1 hover:border-yellow-400/25"
              >
                <div className="relative h-[240px] md:h-[270px]">
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

        <section className="mb-7">
          <div className="dlx-panel rounded-[30px] p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#f6dfb5]">
                  Le menu
                </p>
                <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                  Choisis ce qui te fait envie
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/68">
                  Shakes, drinks, pauses chaudes, gaufres et formules: tout le menu du club est ici, simple à parcourir et facile à commander.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/70">
                <span className="dlx-chip rounded-full px-3 py-2">Retrait rapide</span>
                <span className="dlx-chip rounded-full px-3 py-2">Formules signature</span>
                <span className="dlx-chip rounded-full px-3 py-2">Pause healthy</span>
              </div>
            </div>

            <div className="dlx-search relative">
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

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
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
                        className="dlx-product-card group relative overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_14px_40px_rgba(0,0,0,0.30)] transition hover:border-yellow-400/25 hover:shadow-[0_18px_50px_rgba(0,0,0,0.36)]"
                      >
                        <div className="relative h-[400px] md:h-[460px]">
                          <ProductCardBackground image={item.image} name={item.name} />
                          <div className="absolute inset-x-0 top-0 p-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur">
                              {category.name}
                            </div>
                          </div>

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
                            <p className="mt-3 text-base leading-relaxed text-white/76">
                              {item.description}
                            </p>
                            <p className="mt-2 text-sm text-white/58">{item.flavors}</p>

                            <div className="mt-6 flex items-center justify-between gap-3">
                              <div>
                                {getStartingPriceLabel(item) && (
                                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                                    À partir de
                                  </p>
                                )}
                                <p className="mt-1 text-2xl font-black text-white">
                                  {getStartingPriceLabel(item)}
                                </p>
                              </div>
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                                Personnaliser <ChevronRight size={18} />
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
          <div className="dlx-panel rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.08),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Incontournables
                </p>
                <h2 className="text-2xl font-black md:text-3xl">
                  Les produits qu’on repère en premier
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Une sélection de recettes qui représentent bien le club: visuelles, gourmandes et efficaces dès la première commande.
                </p>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70 md:inline-flex">
                Déjà testé & approuvé au club
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {featuredSelections.map((item) => {
                const product = allProducts.find((p) => p.name === item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => openProduct(item.name)}
                    className="dlx-feature-card group relative overflow-hidden rounded-[24px] border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-yellow-400/25"
                  >
                    <div className="relative h-[220px] md:h-[250px]">
                      <ProductCardBackground image={product?.image} name={item.name} />
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-cyan-400" />
                      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
                        {product ? getStartingPriceLabel(product) : item.subtitle}
                      </div>
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
              className="dlx-link-card block rounded-[30px] border border-yellow-400/20 bg-gradient-to-br from-yellow-400/12 via-yellow-300/8 to-transparent p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-1"
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
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-200">
                Voir les avis <ChevronRight size={15} />
              </span>
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="dlx-link-card block rounded-[30px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/12 via-pink-500/8 to-transparent p-5 shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-1"
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
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-200">
                Voir Instagram <ChevronRight size={15} />
              </span>
            </a>
          </div>
        </section>

        <section className="mb-8 grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="dlx-panel rounded-[30px] border border-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#f6dfb5]">
              Pourquoi on revient
            </p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">
              Une adresse qui vit bien au-delà du visuel
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              La Base fonctionne parce que l’expérience reste simple, chaleureuse et régulière:
              de bons produits, une vraie ambiance club et une commande facile à refaire.
            </p>

            <div className="mt-5 grid gap-3">
              {socialProofStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/62">{stat.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="dlx-panel rounded-[30px] border border-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Ce qu’on retient du club
                </p>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Des retours qui parlent de goût, d’ambiance et de régularité
                </h2>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70 md:inline-flex">
                Avis & ressenti
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center gap-1 text-yellow-300">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{testimonial.title}</p>
                  <p className="mt-2 text-sm text-white/68">{testimonial.text}</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                    {testimonial.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="dlx-footer rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                La Base Shakes & Drinks
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Des produits gourmands pensés autour du bien-être
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Smoothies nutritionnels, boissons énergisantes, healthy drinks,
                pauses chaudes, gaufre et formules: tout est pensé pour allier plaisir,
                énergie et commande facile. Et si tu veux aller plus loin, le club
                propose aussi un accompagnement autour du bien-être, de la perte de poids,
                de l’énergie et de la nutrition sportive.
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

      {cartCount > 0 && !drawerOpen && (
        <div className="dlx-mobile-cart fixed bottom-4 left-4 right-4 z-30 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-left text-white"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                Ton panier
              </p>
              <p className="mt-1 text-lg font-black">
                {cartCount} article{cartCount > 1 ? 's' : ''} • {euroFromCents(cartTotalCents)}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
              Ouvrir <ChevronRight size={16} />
            </span>
          </button>
        </div>
      )}

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
              className="dlx-modal absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_26%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(17,17,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:static md:max-w-xl md:rounded-[34px]"
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

                <div className="dlx-chip-gold mt-4 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
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
                className="dlx-primary-btn mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_14px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01]"
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
              className="dlx-modal absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.08),_transparent_26%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(17,17,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:static md:max-w-2xl md:rounded-[34px]"
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
                <span className="dlx-chip-gold rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300">
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
                className="dlx-primary-btn mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_14px_35px_rgba(250,204,21,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
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
              className="dlx-drawer fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-[linear-gradient(180deg,#ffffff,#f8f8f8)] text-black shadow-[0_0_80px_rgba(0,0,0,0.35)]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/90 px-5 py-4 backdrop-blur">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">
                    Finalise ta commande
                  </p>
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
                    <div className="dlx-drawer-hero rounded-[30px] border border-black/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-900/55">
                            Retrait express
                          </p>
                          <p className="mt-2 text-lg font-black text-black">
                            Prête en 5 à 10 min au club
                          </p>
                          <p className="mt-1 text-sm text-black/65">
                            Commande simple, retrait rapide, WhatsApp ou Square selon ce que tu préfères.
                          </p>
                        </div>
                        <div className="rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1 text-xs font-bold text-emerald-900/70">
                          Verdun
                        </div>
                      </div>
                    </div>

                    {cart.map((item) => (
                      <div
                        key={item.key}
                        className="dlx-drawer-card rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
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
                      <div className="dlx-drawer-highlight rounded-3xl border border-black/10 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
                          <Flame size={14} /> Passe en formule combo
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute une boisson et passe sur une formule plus complète.
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
                      <div className="dlx-drawer-highlight rounded-3xl border border-black/10 bg-gradient-to-r from-fuchsia-50 to-yellow-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-700">
                          <Flame size={14} /> Complète avec un smoothie
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute un smoothie et profite d’une formule plus gourmande et plus avantageuse.
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
                      <div className="dlx-drawer-highlight rounded-3xl border border-black/10 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
                          <Flame size={14} /> Passe en formule chaude
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute une gaufre pour transformer ta pause chaude en formule complète.
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
                      <div className="dlx-drawer-highlight rounded-3xl border border-black/10 bg-gradient-to-r from-amber-50 to-rose-50 p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                          <Flame size={14} /> Ajoute une boisson chaude en formule
                        </p>
                        <p className="mt-2 text-sm text-black/70">
                          Ajoute une boisson chaude et transforme ta pause gourmande en vraie formule.
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

                    {drawerQuickAdds.length > 0 && (
                      <div className="dlx-drawer-card rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-black/45">
                          <Flame size={14} /> Complète en 1 clic
                        </p>
                        <p className="mt-2 text-sm text-black/65">
                          Des idées simples pour compléter ta commande sans te compliquer.
                        </p>
                        <div className="mt-3 space-y-3">
                          {drawerQuickAdds.map((suggestion) => {
                            const suggestionProduct = allProducts.find(
                              (product) => product.name === suggestion.productName,
                            );

                            return (
                              <button
                                key={`${suggestion.productName}-${suggestion.optionLabel ?? ''}`}
                                type="button"
                                onClick={() =>
                                  addSuggestedProduct(
                                    suggestion.productName,
                                    suggestion.optionLabel,
                                  )
                                }
                                className="dlx-drawer-upsell flex w-full items-center justify-between gap-3 rounded-[24px] border border-black/10 bg-white px-4 py-4 text-left transition hover:bg-black/[0.03]"
                              >
                                <div>
                                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                    {suggestion.badge}
                                  </p>
                                  <p className="mt-1 font-black text-black">
                                    {suggestion.title}
                                  </p>
                                  <p className="mt-1 text-sm text-black/60">
                                    {suggestion.text}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-black/55">
                                    {suggestion.productName}
                                  </p>
                                  <p className="mt-1 text-lg font-black text-black">
                                    {suggestionProduct
                                      ? euroFromCents(
                                          getConfiguredBasePrice(
                                            suggestionProduct,
                                            suggestion.optionLabel,
                                          ),
                                        )
                                      : ''}
                                  </p>
                                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                                    Ajouter <Plus size={12} />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="dlx-drawer-card space-y-3 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-black">Infos de retrait</p>
                          <p className="mt-1 text-sm text-black/55">
                            On prépare ta commande pour l’heure que tu indiques.
                          </p>
                        </div>
                        <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/60">
                          Retrait club
                        </span>
                      </div>
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

                    <div className="dlx-drawer-summary rounded-[30px] border border-black/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40">
                            Total estimé
                          </p>
                          <p className="mt-1 text-3xl font-black text-black">
                            {euroFromCents(cartTotalCents)}
                          </p>
                        </div>
                        <div className="text-right text-sm text-black/55">
                          <p>Retrait sur place</p>
                          <p>Paiement rapide</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <button
                          onClick={handleSquareCheckout}
                          disabled={!hasRequiredPickupInfo || isCreatingPayment}
                          className="dlx-primary-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 py-4 text-lg font-black text-black shadow-[0_12px_35px_rgba(250,204,21,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCreatingPayment
                            ? 'Création du paiement...'
                            : 'Payer et réserver mon retrait'}
                        </button>

                        <button
                          onClick={handleWhatsAppOrder}
                          disabled={!hasRequiredPickupInfo}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#235847] to-[#143a2d] py-4 text-lg font-black text-white shadow-[0_12px_30px_rgba(20,58,45,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MessageCircle size={18} /> Commander sur WhatsApp
                        </button>
                      </div>

                      <p className="mt-3 text-center text-sm text-black/55">
                        Square pour payer tout de suite, WhatsApp si tu préfères valider avec nous.
                      </p>
                    </div>
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
            className="dlx-toast fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 overflow-hidden rounded-[22px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(0,0,0,0.86))] px-4 py-3 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur md:bottom-5"
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
