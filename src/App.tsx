import React, { useEffect, useMemo, useState } from 'react';
import { BRAND, categories, comboOffers, googleReviewUrl } from './data/menu';
import type { Category, ComboOffer, ComboSelectionConfig, Product } from './data/menu';
import {
  type SelectedProduct,
  getConfiguredBasePrice,
  getOptionSectionLabel,
  getDefaultOptionForComboProduct,
} from './data/product-helpers';
import { getPickupWindow, checkPickupTime } from './v2/openingHours';
import { HomeV2 } from './v2/HomeV2';
import { useCart, type CartItem } from './v2/cart/useCart';
import { ProductModalV2 } from './v2/ProductModalV2';
import { CartDrawerV2 } from './v2/CartDrawerV2';
import { ReviewPromptModal, shouldShowReviewPrompt } from './v2/ReviewPromptModal';
import { tryAcquirePrompt, releasePrompt } from './v2/promptLock';
import { VisitThanksModal } from './v2/VisitThanksModal';
import { ComboModalV2 } from './v2/ComboModalV2';
import { Toast } from './v2/Toast';
import { shareReferralLink } from './v2/referral';
import type { UsualOrder } from './v2/usualOrder';
import { PasswordRecoveryModal } from './v2/auth/PasswordRecoveryModal';
import { track } from './lib/analytics';
import { OrderTracking } from './v2/OrderTracking';
import { PendingCashModal } from './v2/PendingCashModal';
import { applyTheme, getBasePalette } from './v2/palette';
import { useActiveThemeId } from './v2/theme/useActiveTheme';
import { useUserRewards } from './v2/rewards/useUserRewards';
import { useAuth } from './v2/auth/useAuth';
import { getSupabase, getStoredSession } from './lib/supabase';

const PENDING_SQUARE_CHECKOUT_KEY = 'labase-pending-square-checkout';
// Prénom + heure de retrait mis de côté avant la redirection Square (la page
// est rechargée au retour) → affichés sur l'écran de confirmation.
const PENDING_SQUARE_INFO_KEY = 'labase-pending-square-info';
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

function App() {
  const { cart, setCart, cartCount, cartTotalCents, updateQuantity, clearCart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Modale auth + roue partagées entre HomeV2 et le panier (nudges)
  const [authOpen, setAuthOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedRewardCode, setSelectedRewardCode] = useState<string | null>(null);
  const [xpToSpend, setXpToSpend] = useState(0);
  const appAuth = useAuth();
  // Codes roue actifs : rechargés à la connexion / déconnexion et après chaque gain
  const { rewards: userRewards } = useUserRewards(
    appAuth.status === 'loading' ? undefined : appAuth.session?.user.id ?? null,
  );
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
  // Thème de base (clair par défaut dans cette version) + thème de saison par-dessus
  const basePalette = useMemo(() => getBasePalette(), []);
  const activePalette = useMemo(() => applyTheme(basePalette, activeThemeId), [basePalette, activeThemeId]);
  // Fond de page (visible quand on tire l'écran) + barre d'état du téléphone
  // aux couleurs du thème (sinon barre noire au-dessus d'une appli claire).
  useEffect(() => {
    document.documentElement.style.background = activePalette.bg;
    document.body.style.background = activePalette.bg;
    document.documentElement.style.colorScheme = activePalette.mode === 'light' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activePalette.bg);
  }, [activePalette]);
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
  const [thankYouInfo, setThankYouInfo] = useState({ name: '', pickup: '' });
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
        try {
          const info = JSON.parse(window.sessionStorage.getItem(PENDING_SQUARE_INFO_KEY) || 'null');
          if (info && typeof info === 'object') {
            setThankYouInfo({
              name: typeof info.name === 'string' ? info.name : '',
              pickup: typeof info.pickup === 'string' ? info.pickup : '',
            });
          }
        } catch {
          /* pas bloquant */
        }
        window.sessionStorage.removeItem(PENDING_SQUARE_INFO_KEY);
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

  // Retour dans l'app APRÈS un passage au comptoir (90 % du volume : ils ouvrent
  // l'app pour montrer leur QR) : quand le nombre de commandes a augmenté depuis
  // la dernière ouverture, on affiche « Merci pour ta visite ! +X XP » (XP gagnés,
  // jauge, roue, parrainage), puis la demande d'avis Google à sa fermeture.
  // Avis conforme Google : à leur rythme, sans récompense, sans filtrer la note.
  const [visitThanks, setVisitThanks] = useState<{ xpGained: number } | null>(null);

  function askReviewSoon() {
    if (!shouldShowReviewPrompt()) return;
    window.setTimeout(() => {
      // Une seule pop-up auto à la fois (cf. push d'activation).
      if (!shouldShowReviewPrompt() || !tryAcquirePrompt('review')) return;
      setShowReviewPrompt(true);
    }, 1600);
  }

  useEffect(() => {
    const orders = appAuth.profile?.total_orders;
    const xpNow = appAuth.profile?.xp;
    if (typeof orders !== 'number') return;
    const KEY = 'labase_last_seen_orders';
    const XP_KEY = 'labase_last_seen_xp';
    let lastSeen: number | null = null;
    let lastXp: number | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      lastSeen = raw == null ? null : parseInt(raw, 10);
      const rawXp = window.localStorage.getItem(XP_KEY);
      lastXp = rawXp == null ? null : parseInt(rawXp, 10);
    } catch {}
    const rememberXp = () => {
      if (typeof xpNow === 'number') {
        try { window.localStorage.setItem(XP_KEY, String(xpNow)); } catch {}
      }
    };
    // Première fois sur cet appareil → on pose juste la référence, pas de pop-up.
    if (lastSeen == null || Number.isNaN(lastSeen)) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
      rememberXp();
      return;
    }
    if (orders > lastSeen) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
      const gained =
        typeof xpNow === 'number' && lastXp != null && !Number.isNaN(lastXp) ? Math.max(0, xpNow - lastXp) : 0;
      // Pas en même temps que l'écran de confirmation du paiement en ligne.
      if (!showThankYou) {
        window.setTimeout(() => {
          if (tryAcquirePrompt('visit')) setVisitThanks({ xpGained: gained });
          else askReviewSoon();
        }, 900);
      }
    } else if (orders !== lastSeen) {
      try { window.localStorage.setItem(KEY, String(orders)); } catch {}
    }
    rememberXp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appAuth.profile?.total_orders, appAuth.profile?.xp, showThankYou]);

  function closeVisitThanks(next?: 'spin') {
    setVisitThanks(null);
    releasePrompt('visit');
    if (next === 'spin') setWheelOpen(true);
    else askReviewSoon();
  }

  const lastSpinAt = appAuth.profile?.last_spin_at;
  const canSpinWheel = !lastSpinAt || Date.now() - new Date(lastSpinAt).getTime() >= 7 * 24 * 60 * 60 * 1000;

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

  // Créneau de retrait autorisé selon les horaires (aujourd'hui ou prochain jour d'ouverture)
  const pickupWindow = getPickupWindow();
  const pickupError = checkPickupTime(pickupTime.trim(), pickupWindow);
  const hasRequiredPickupInfo =
    customerName.trim().length > 0 && pickupTime.trim().length > 0 && !pickupError;

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

  // « Ta commande habituelle » (accueil) : même produit, même format, mêmes extras
  function reorderUsual(u: UsualOrder) {
    const product =
      allProducts.find((p) => p.name === u.product.name && p.categoryId === u.product.categoryId) ??
      allProducts.find((p) => p.name === u.product.name);
    if (!product) return;
    const option =
      u.option && product.options?.some((o) => o.label === u.option) ? u.option : product.options?.[0]?.label ?? '';
    addPreparedProductToCart(product, option, product.name, u.extras);
    track('usual_order_reordered', { source: product.name.slice(0, 30) });
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
      window.alert(pickupError ?? 'Merci de renseigner ton prénom / nom et ton heure de retrait.');
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
    // Anti double appui : une seule commande espèces à la fois
    if (isCreatingPendingCash) return;
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
    if (pickupError) {
      window.alert(pickupError);
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
        window.alert(pickupError ?? 'Merci de renseigner ton prénom / nom et ton heure de retrait.');
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
      window.sessionStorage.setItem(
        PENDING_SQUARE_INFO_KEY,
        JSON.stringify({ name: customerName.trim(), pickup: pickupTime.trim() }),
      );
      // Mémorise le cadeau XP choisi : débité au retour (payment=success).
      // Sans cadeau, on efface un éventuel ancien choix (paiement abandonné
      // puis repayé sans cadeau → ne pas débiter l'ancien).
      if (claimedGift) {
        window.sessionStorage.setItem(PENDING_GIFT_KEY, claimedGift.id);
      } else {
        window.sessionStorage.removeItem(PENDING_GIFT_KEY);
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
    <div className="delivery-luxe" style={{ minHeight: '100vh', background: activePalette.bg, color: activePalette.text }}>

      {/* Composer une formule combo (style V2) */}
      <ComboModalV2
        palette={activePalette}
        combo={selectedCombo}
        onClose={() => setSelectedCombo(null)}
        onAdd={addComboToCart}
        primaryCandidates={selectedComboPrimaryCandidates}
        secondaryCandidates={selectedComboSecondaryCandidates}
        primaryName={selectedComboPrimaryName}
        secondaryName={selectedComboSecondaryName}
        onPrimaryChange={handleComboPrimaryProductChange}
        onSecondaryChange={handleComboSecondaryProductChange}
        primaryProduct={selectedComboPrimaryProduct}
        secondaryProduct={selectedComboSecondaryProduct}
        primaryOption={selectedComboPrimaryOption}
        secondaryOption={selectedComboSecondaryOption}
        onPrimaryOption={setSelectedComboPrimaryOption}
        onSecondaryOption={setSelectedComboSecondaryOption}
      />



      <Toast palette={activePalette} message={toastMessage} />

      {/* Interface principale */}
          <HomeV2
            palette={activePalette}
            cartCount={cartCount}
            onOpenCart={() => setDrawerOpen(true)}
            onOpenProduct={(v2p) => openProductFromCategory(v2p.category, v2p.raw)}
            onOpenCombo={(v2c) => openCombo(v2c.raw.id)}
            onAddProduct={(v2p) => openProductFromCategory(v2p.category, v2p.raw)}
            onReorderUsual={reorderUsual}
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
            isCreatingPendingCash={isCreatingPendingCash}
            pickupWindow={pickupWindow}
            pickupError={pickupError}
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
          {/* « Merci pour ta visite ! +X XP » après un passage au comptoir */}
          <VisitThanksModal
            palette={activePalette}
            open={!!visitThanks}
            onClose={() => closeVisitThanks()}
            firstName={appAuth.profile?.first_name}
            xp={appAuth.profile?.xp ?? 0}
            xpGained={visitThanks?.xpGained ?? 0}
            orders={appAuth.profile?.total_orders ?? 0}
            canSpin={canSpinWheel}
            onSpin={() => closeVisitThanks('spin')}
            referralCode={appAuth.profile?.referral_code}
            onShareReferral={() => {
              const code = appAuth.profile?.referral_code;
              if (code) void shareReferralLink(code);
            }}
          />
          {/* Live tracking post-paiement V2 (remplace le bandeau Thank You legacy) */}
          <OrderTracking
            palette={activePalette}
            open={showThankYou}
            customerName={thankYouInfo.name || customerName}
            pickupTime={thankYouInfo.pickup}
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
