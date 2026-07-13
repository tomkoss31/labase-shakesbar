import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { BRAND, categories, comboOffers, googleReviewUrl } from './data/menu';
import type { Category, ComboOffer, ComboSelectionConfig, Product } from './data/menu';
import {
  type SelectedProduct,
  getConfiguredBasePrice,
  getOptionSectionLabel,
  getDefaultOptionForComboProduct,
} from './data/product-helpers';
import { HomeV2 } from './v2/HomeV2';
import { useCart, type CartItem } from './v2/cart/useCart';
import { ProductModalV2 } from './v2/ProductModalV2';
import { CartDrawerV2 } from './v2/CartDrawerV2';
import { ReviewPromptModal, shouldShowReviewPrompt } from './v2/ReviewPromptModal';
import { tryAcquirePrompt, releasePrompt } from './v2/promptLock';
import { PasswordRecoveryModal } from './v2/auth/PasswordRecoveryModal';
import { track } from './lib/analytics';
import { OrderTracking } from './v2/OrderTracking';
import { PendingCashModal } from './v2/PendingCashModal';
import { PALETTE_E, applyTheme } from './v2/palette';
import { useActiveThemeId } from './v2/theme/useActiveTheme';
import { useUserRewards } from './v2/rewards/useUserRewards';
import { useAuth } from './v2/auth/useAuth';
import { getSupabase, getStoredSession } from './lib/supabase';

const PENDING_SQUARE_CHECKOUT_KEY = 'labase-pending-square-checkout';
const PENDING_GIFT_KEY = 'labase-pending-gift';
const INSTALL_BANNER_DISMISS_KEY = 'labase-install-banner-dismissed';
// Flag : rouvrir le panier après une inscription lancée depuis le panier
const REOPEN_CART_KEY = 'labase-reopen-cart';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

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
  const { cart, setCart, cartCount, cartTotalCents, updateQuantity, clearCart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Modale auth + roue partagées entre HomeV2 et le panier (nudges)
  const [authOpen, setAuthOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedRewardCode, setSelectedRewardCode] = useState<string | null>(null);
  const { rewards: userRewards, refetch: refetchRewards } = useUserRewards();
  const [xpToSpend, setXpToSpend] = useState(0);
  const appAuth = useAuth();
  const userXp = appAuth.profile?.xp ?? 0;

  // Préremplit le prénom depuis le profil : plus besoin de le retaper à chaque
  // commande une fois qu'il a été renseigné (au 1er passage, cf. maybeSaveFirstName).
  // On ne remplit que si le champ est encore vide (ne pas écraser une saisie).
  useEffect(() => {
    const fn = appAuth.profile?.first_name;
    if (fn && customerName.trim().length === 0) setCustomerName(fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appAuth.profile?.first_name]);
  // Thème saisonnier actif (Coupe du Monde, Noël…) — accents seulement.
  const activeThemeId = useActiveThemeId();
  const activePalette = useMemo(() => applyTheme(PALETTE_E, activeThemeId), [activeThemeId]);
  const [claimedGift, setClaimedGift] = useState<{ id: string; title: string; emoji: string; cost: number } | null>(null);

  // Après une inscription lancée depuis le panier : on rouvre le panier
  // une fois connecté, pour que le client finalise sa commande.
  useEffect(() => {
    if (appAuth.status !== 'authenticated') return;
    try {
      if (sessionStorage.getItem(REOPEN_CART_KEY) === '1') {
        sessionStorage.removeItem(REOPEN_CART_KEY);
        if (cart.length > 0) setDrawerOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [appAuth.status, cart.length]);

  // Le client SÉLECTIONNE un extra à offrir avec ses XP (depuis le panier).
  // ⚠️ Aucun débit ici : c'est une simple sélection réversible. Les XP ne sont
  // débités qu'à la VALIDATION de la commande (voir redeemClaimedGift).
  function handleClaimGift(reward: { id: string; title: string; emoji: string; cost: number } | null) {
    if (!reward) {
      setClaimedGift(null);
      return;
    }
    if (!getStoredSession()?.access_token) {
      window.alert('Connecte-toi pour utiliser tes XP.');
      return;
    }
    if (userXp < reward.cost) {
      window.alert('Tu n\'as pas assez de XP pour ce cadeau.');
      return;
    }
    setClaimedGift(reward);
    setToastMessage(`🎁 ${reward.title} ajouté · débité à la validation`);
  }

  // Débite réellement les XP du cadeau sélectionné — appelé UNIQUEMENT à la
  // validation d'une commande (Square success / espèces / WhatsApp).
  async function redeemClaimedGift(rewardId: string): Promise<boolean> {
    const token = getStoredSession()?.access_token;
    if (!token) return false;
    try {
      const resp = await fetch('/api/orders?action=claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rewardId }),
      });
      if (resp.ok) {
        await appAuth.refreshProfile();
        return true;
      }
    } catch {
      // silencieux : on ne bloque pas la commande si le claim échoue
    }
    return false;
  }
  const [pendingCashCode, setPendingCashCode] = useState<string | null>(null);
  const [pendingCashTotal, setPendingCashTotal] = useState(0);
  const [isCreatingPendingCash, setIsCreatingPendingCash] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  // Édition d'un article du panier (D2) : clé de la ligne en cours d'édition + ses extras
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingExtras, setEditingExtras] = useState<string[]>([]);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<DeferredInstallPrompt | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIosInstallHint, setIsIosInstallHint] = useState(false);

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
        clearCart();
        window.sessionStorage.removeItem(PENDING_SQUARE_CHECKOUT_KEY);
        track('order_paid_square');
        // Débite le cadeau XP choisi (maintenant que la commande est validée)
        const pendingGift = window.sessionStorage.getItem(PENDING_GIFT_KEY);
        if (pendingGift) {
          window.sessionStorage.removeItem(PENDING_GIFT_KEY);
          void redeemClaimedGift(pendingGift);
          setClaimedGift(null);
        }
        // Avis Google : prompt déclenché 8s après le paiement réussi
        // (laisse au user le temps de voir le live tracking d'abord),
        // avec cooldown 30j pour ne pas re-demander trop souvent.
        if (shouldShowReviewPrompt()) {
          window.setTimeout(() => {
            // Une seule pop-up auto à la fois (cf. push d'activation).
            if (!shouldShowReviewPrompt() || !tryAcquirePrompt('review')) return;
            setShowReviewPrompt(true);
          }, 8000);
        }
      }

      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Avis in-app pour les clients COMPTOIR (90% du volume) : ils ouvrent l'app à
  // chaque visite pour montrer leur QR. Quand leur nombre de commandes augmente
  // depuis la dernière ouverture (= ils viennent de passer au comptoir), on
  // propose l'avis au retour dans l'app. Conforme Google : demande à leur rythme,
  // sans récompense, et sans filtrer par note (cf. ReviewPromptModal).
  useEffect(() => {
    const orders = appAuth.profile?.total_orders;
    if (typeof orders !== 'number') return;
    const KEY = 'labase_last_seen_orders';
    let lastSeen: number | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      lastSeen = raw == null ? null : parseInt(raw, 10);
    } catch {}
    // Première fois sur cet appareil → on pose juste la référence, pas de prompt.
    if (lastSeen == null || Number.isNaN(lastSeen)) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
      return;
    }
    if (orders > lastSeen) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
      // Pas en même temps que l'écran de remerciement du paiement en ligne.
      if (shouldShowReviewPrompt() && !showThankYou) {
        window.setTimeout(() => {
          // Une seule pop-up auto à la fois (cf. push d'activation).
          if (!shouldShowReviewPrompt() || !tryAcquirePrompt('review')) return;
          setShowReviewPrompt(true);
        }, 1600);
      }
    } else if (orders !== lastSeen) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
    }
  }, [appAuth.profile?.total_orders, showThankYou]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed =
      window.localStorage.getItem(INSTALL_BANNER_DISMISS_KEY) === '1';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) &&
      !/crios|fxios|edgios|chrome|android/.test(userAgent);

    if (!dismissed && !isStandalone && isIos && isSafari) {
      setIsIosInstallHint(true);
      setShowInstallBanner(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (dismissed) return;
      setDeferredInstallPrompt(event as DeferredInstallPrompt);
      setIsIosInstallHint(false);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setShowInstallBanner(false);
      setIsIosInstallHint(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (!deferredInstallPrompt) return;

    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setShowInstallBanner(false);
    }

    setDeferredInstallPrompt(null);
  }


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

  // D2 — clés des lignes panier éditables (celles qui correspondent à un produit du catalogue)
  const editableCartKeys = useMemo(() => {
    const names = new Set(allProducts.map((p) => p.name));
    return new Set(cart.filter((i) => names.has(i.name)).map((i) => i.key));
  }, [cart, allProducts]);

  const hasRequiredPickupInfo =
    customerName.trim().length > 0 && pickupTime.trim().length > 0;

  function addPreparedProductToCart(
    product: SelectedProduct,
    optionLabel = '',
    toastLabel = product.name,
    extras: string[] = [],
  ) {
    const basePriceCents = getConfiguredBasePrice(product, optionLabel);
    // Chaque extra coûte 250 (2,50€) — synchrone avec api/create-payment-link.ts
    const extrasTotal = extras.length * 250;
    const unitPriceCents = basePriceCents + extrasTotal;
    const extrasKey = extras.length > 0 ? extras.slice().sort().join('|') : '';
    const key = `${product.categoryId}-${product.name}-${optionLabel}-${extrasKey}`;

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
          extras: extras.length > 0 ? extras : undefined,
        },
      ];
    });

    setToastMessage(`${toastLabel} ajouté au panier`);
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

  function openProductFromCategory(category: Category, item: Product) {
    setEditingKey(null);
    setEditingExtras([]);
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

  function addToCart(product: SelectedProduct, extras: string[] = []) {
    if (editingKey) {
      // Mode édition (D2) : remplace la ligne existante au lieu d'ajouter
      replaceCartItem(editingKey, product, selectedOption, extras);
    } else {
      addPreparedProductToCart(product, selectedOption, product.name, extras);
    }
    setSelected(null);
    setSelectedOption('');
    setEditingKey(null);
    setEditingExtras([]);
  }

  // D2 — ouvre la modale produit pré-remplie pour éditer une ligne du panier
  function handleEditItem(item: CartItem) {
    const product = allProducts.find((entry) => entry.name === item.name);
    if (!product) return; // combos / quick-adds non ré"-configurables" : pas d'édition
    setSelectedCombo(null);
    setSelected(product);
    setSelectedOption(item.option || product.options?.[0]?.label || '');
    setEditingExtras(item.extras ?? []);
    setEditingKey(item.key);
  }

  // D2 — remplace une ligne par une nouvelle config en conservant la quantité
  function replaceCartItem(
    oldKey: string,
    product: SelectedProduct,
    optionLabel: string,
    extras: string[],
  ) {
    const basePriceCents = getConfiguredBasePrice(product, optionLabel);
    const unitPriceCents = basePriceCents + extras.length * 250;
    const extrasKey = extras.length > 0 ? extras.slice().sort().join('|') : '';
    const newKey = `${product.categoryId}-${product.name}-${optionLabel}-${extrasKey}`;
    setCart((prev) => {
      const oldLine = prev.find((i) => i.key === oldKey);
      const qty = oldLine?.quantity ?? 1;
      const without = prev.filter((i) => i.key !== oldKey);
      const existing = without.find((i) => i.key === newKey);
      if (existing) {
        // La nouvelle config rejoint une ligne identique déjà présente → on cumule
        return without.map((i) =>
          i.key === newKey ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [
        ...without,
        {
          key: newKey,
          name: product.name,
          categoryName: product.categoryName,
          quantity: qty,
          option: optionLabel,
          unitPriceCents,
          extras: extras.length > 0 ? extras : undefined,
        },
      ];
    });
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

  const whatsappLink = `https://wa.me/${BRAND.whatsappNumber}?text=${buildWhatsAppMessage(
    cart,
    customerName,
    pickupTime,
    cartTotalCents,
  )}`;

  // Capture le prénom au 1er passage : si l'utilisateur est connecté et n'a pas
  // encore de prénom au profil, on le sauve (best-effort, non bloquant) → le
  // « Salut … » et les prochaines commandes seront personnalisés. Ne touche jamais
  // le paiement (fire-and-forget).
  function maybeSaveFirstName() {
    const name = customerName.trim();
    if (!name || !appAuth.session || appAuth.profile?.first_name) return;
    try {
      void appAuth.updateProfile({ first_name: name.slice(0, 60) });
    } catch {}
  }

  function handleWhatsAppOrder() {
    if (!hasRequiredPickupInfo) {
      window.alert('Merci de renseigner ton prénom / nom et ton heure de retrait.');
      return;
    }
    maybeSaveFirstName();

    if (cart.length === 0) {
      window.alert('Ton panier est vide.');
      return;
    }

    track('order_whatsapp', { items_count: cart.length });
    // Commande WhatsApp envoyée → on débite le cadeau XP choisi
    if (claimedGift) {
      void redeemClaimedGift(claimedGift.id);
      setClaimedGift(null);
    }
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  }

  async function handlePayOnSite() {
    if (cart.length === 0) {
      window.alert('Ton panier est vide.');
      return;
    }
    // Espèces sur place : le prénom suffit (on encaisse au comptoir). L'heure de
    // retrait reste optionnelle — inutile de bloquer un paiement immédiat.
    if (customerName.trim().length === 0) {
      window.alert('Merci de renseigner ton prénom.');
      return;
    }
    maybeSaveFirstName();
    setIsCreatingPendingCash(true);
    try {
      // Lecture directe localStorage (bypass getSession hang iOS PWA)
      const userEmail: string | undefined =
        appAuth.email ?? getStoredSession()?.user.email ?? undefined;

      const response = await fetch('/api/orders?action=create-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, customerName, pickupTime, userEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        window.alert(data?.error || 'Erreur création commande');
        return;
      }
      setPendingCashCode(data.code);
      track('order_paid_cash', { total_cents: data.totalCents ?? 0, items_count: cart.length });
      setPendingCashTotal(data.totalCents);
      // Commande validée → on débite le cadeau XP choisi
      if (claimedGift) {
        void redeemClaimedGift(claimedGift.id);
        setClaimedGift(null);
      }
      clearCart(); // vide le panier puisque la commande est créée côté serveur
      setDrawerOpen(false);
    } catch (err: any) {
      window.alert('Erreur : ' + err.message);
    } finally {
      setIsCreatingPendingCash(false);
    }
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

      maybeSaveFirstName();
      setIsCreatingPayment(true);

      // Récupère email du user authentifié pour permettre au webhook Square
      // d'associer le paiement à un compte (XP, VIP, historique)
      // ⚠️ getStoredSession() lit localStorage directement (bypass le getSession
      // hang iOS PWA) qui faisait tourner Square sans jamais lancer le checkout.
      const userEmail: string | undefined =
        appAuth.email ?? getStoredSession()?.user.email ?? undefined;

      // Token du client authentifié : le serveur EXIGE ce JWT pour dépenser des
      // XP / utiliser un code (il en dérive l'identité au lieu du userEmail).
      const sessionToken = getStoredSession()?.access_token;
      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          cart,
          customerName,
          pickupTime,
          userEmail,
          rewardCode: selectedRewardCode,
          xpToSpend,
        }),
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
      // Mémorise le cadeau XP choisi : débité au retour (payment=success)
      if (claimedGift) {
        window.sessionStorage.setItem(PENDING_GIFT_KEY, claimedGift.id);
      }
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      window.alert('Erreur lors de la création du paiement Square.');
    } finally {
      setIsCreatingPayment(false);
    }
  }

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
              className="dlx-modal absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] overflow-y-auto rounded-t-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.09),_transparent_26%),linear-gradient(180deg,rgba(10,10,10,0.99),rgba(17,17,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:static md:max-w-2xl md:rounded-[34px]"
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

      {/* Interface principale */}
          <HomeV2
            palette={activePalette}
            cartCount={cartCount}
            onOpenCart={() => setDrawerOpen(true)}
            onOpenProduct={(v2p) => openProductFromCategory(v2p.category, v2p.raw)}
            onOpenCombo={(v2c) => openCombo(v2c.raw.id)}
            onAddProduct={(v2p) => openProductFromCategory(v2p.category, v2p.raw)}
            onLeaveReview={() => window.open(googleReviewUrl, '_blank', 'noopener')}
            authOpen={authOpen}
            setAuthOpen={setAuthOpen}
            wheelOpen={wheelOpen}
            setWheelOpen={setWheelOpen}
            canInstall={Boolean(deferredInstallPrompt)}
            onInstall={handleInstallApp}
            onReorder={(items) => {
              if (!items.length) return;
              // Fusionne avec le panier existant (somme les quantités si même article)
              setCart((prev) => {
                const map = new Map(prev.map((m) => [m.key, { ...m }]));
                for (const it of items) {
                  const ex = map.get(it.key);
                  if (ex) map.set(it.key, { ...ex, quantity: ex.quantity + it.quantity });
                  else map.set(it.key, { ...it });
                }
                return Array.from(map.values());
              });
              setDrawerOpen(true);
            }}
          />
          <ProductModalV2
            palette={activePalette}
            open={Boolean(selected)}
            product={selected}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            initialExtras={editingExtras}
            editing={Boolean(editingKey)}
            onClose={() => {
              setSelected(null);
              setEditingKey(null);
              setEditingExtras([]);
            }}
            onAdd={(extras) => selected && addToCart(selected, extras)}
            getPrice={(p) => getConfiguredBasePrice(p, selectedOption)}
            optionSectionLabel={(p) => getOptionSectionLabel(p)}
            onOpenCombo={(combo, presetProductName) => {
              setSelected(null);
              openCombo(combo.id, presetProductName ? { primaryName: presetProductName } : undefined);
            }}
          />
          <CartDrawerV2
            palette={activePalette}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            cart={cart}
            totalCents={cartTotalCents}
            customerName={customerName}
            setCustomerName={setCustomerName}
            pickupTime={pickupTime}
            setPickupTime={setPickupTime}
            onUpdateQty={updateQuantity}
            onEditItem={handleEditItem}
            editableKeys={editableCartKeys}
            onSquareCheckout={handleSquareCheckout}
            onWhatsAppOrder={handleWhatsAppOrder}
            isCreatingPayment={isCreatingPayment}
            hasRequiredPickupInfo={hasRequiredPickupInfo}
            onAddSuggestion={(v2p) => {
              setDrawerOpen(false);
              openProductFromCategory(v2p.category, v2p.raw);
            }}
            onPayOnSite={handlePayOnSite}
            rewards={userRewards}
            selectedRewardCode={selectedRewardCode}
            setSelectedRewardCode={setSelectedRewardCode}
            userXp={userXp}
            userOrders={appAuth.profile?.total_orders ?? 0}
            xpToSpend={xpToSpend}
            setXpToSpend={setXpToSpend}
            isAuthed={appAuth.status === 'authenticated'}
            claimedGift={claimedGift}
            onClaimGift={handleClaimGift}
            onConnect={() => {
              // Mémorise qu'on devra rouvrir le panier après l'inscription
              try { sessionStorage.setItem(REOPEN_CART_KEY, '1'); } catch {}
              setDrawerOpen(false);
              setAuthOpen(true);
            }}
            onSpinWheel={() => {
              setDrawerOpen(false);
              setWheelOpen(true);
            }}
          />
          <PendingCashModal
            palette={activePalette}
            open={Boolean(pendingCashCode)}
            code={pendingCashCode}
            totalCents={pendingCashTotal}
            customerName={customerName}
            onClose={() => setPendingCashCode(null)}
          />
          {/* Live tracking post-paiement V2 (remplace le bandeau Thank You legacy) */}
          <OrderTracking
            palette={activePalette}
            open={showThankYou}
            customerName={customerName || 'toi'}
            onClose={() => setShowThankYou(false)}
          />
          {/* Demande d'avis Google — 4 ou 5 étoiles → Google reviews,
              1-3 étoiles → mailto direct à hello@labase360.fr */}
          <ReviewPromptModal
            palette={activePalette}
            open={showReviewPrompt}
            onClose={() => {
              setShowReviewPrompt(false);
              releasePrompt('review');
            }}
            googleReviewUrl={googleReviewUrl}
            customerName={customerName}
          />
          {/* Modale "choisis ton nouveau mdp" — affichée auto quand le user
              clique sur le lien dans le mail de reset password */}
          <PasswordRecoveryModal
            palette={activePalette}
            open={appAuth.inPasswordRecovery}
            email={appAuth.email}
            onUpdatePassword={appAuth.updatePassword}
            onDismiss={appAuth.dismissPasswordRecovery}
          />
    </div>
  );
}

export default App;
