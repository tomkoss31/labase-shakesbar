// HomeV2 — home complète Phase 2 avec hero + chips + carousels horizontaux
// Activable via ?v2. Click produit/combo → callback vers App.tsx pour
// réutiliser les modales et la logique panier/Square existantes.
import React, { useMemo, useState } from 'react';
import { PALETTE_E, type Palette } from './palette';
import { Header } from './Header';
import { XpCard } from './XpCard';
import { QuickActions } from './QuickActions';
import { ReorderCard } from './ReorderCard';
import { WellnessChallenge } from './wellness/WellnessChallenge';
import type { CartItem } from './cart/useCart';
import { ProductCard, ComboCard } from './ProductCard';
import { BottomNav, type NavTab } from './BottomNav';
import { SearchBar, CategoryChips, SectionHead, Carousel, InfoBlock, InstaCard } from './blocks';
import { WheelModal } from './wheel/WheelModal';
import type { HeaderTab } from './Header';
import { useAuth } from './auth/useAuth';
import { AuthModal } from './auth/AuthModal';
import { ProfileSheet } from './auth/ProfileSheet';
import { RewardsModal } from './rewards/RewardsModal';
import { MyCodeModal } from './auth/MyCodeModal';
import { OnboardingModal, hasSeenOnboarding } from './OnboardingModal';
import { InboxModal, useInbox } from './inbox/InboxModal';
import { usePushNotifications } from './notifications/usePushNotifications';
import { PushActivationModal } from './PushActivationModal';
import { tryAcquirePrompt, releasePrompt } from './promptLock';
import { computeMascotteLevel, nextLevelThreshold } from './auth/types';
import {
  V2_POPULAR,
  V2_NEW,
  V2_COMBOS,
  V2_SMOOTHIES,
  V2_DRINKS,
  V2_HOT,
  V2_HEALTH,
  V2_KIDS,
  V2_WAFFLES,
  type V2Product,
  type V2Combo,
} from './products-adapter';

interface HomeV2Props {
  palette?: Palette; // thème actif (saisonnier) injecté par App.tsx
  cartCount: number;
  onOpenCart: () => void;
  onOpenProduct: (product: V2Product) => void;
  onOpenCombo: (combo: V2Combo) => void;
  onAddProduct: (product: V2Product, fromButton: HTMLElement) => void;
  onLeaveReview?: () => void;
  // Contrôle externe (depuis App.tsx) pour ouvrir auth / roue depuis le panier
  authOpen?: boolean;
  setAuthOpen?: (open: boolean) => void;
  wheelOpen?: boolean;
  setWheelOpen?: (open: boolean) => void;
  onReorder?: (items: CartItem[]) => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

export function HomeV2({
  palette: paletteProp,
  cartCount,
  onOpenCart,
  onOpenProduct,
  onOpenCombo,
  onAddProduct,
  onLeaveReview,
  authOpen: authOpenProp,
  setAuthOpen: setAuthOpenProp,
  wheelOpen: wheelOpenProp,
  setWheelOpen: setWheelOpenProp,
  onReorder,
  canInstall,
  onInstall,
}: HomeV2Props) {
  const [installDismissed, setInstallDismissed] = useState(false);
  const palette = paletteProp ?? PALETTE_E;
  const [tab, setTab] = useState<NavTab>('home');
  const [headerTab, setHeaderTab] = useState<HeaderTab>('home');
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [authOpenLocal, setAuthOpenLocal] = useState(false);
  const authOpen = authOpenProp ?? authOpenLocal;
  const setAuthOpen = setAuthOpenProp ?? setAuthOpenLocal;
  const [profileOpen, setProfileOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [wheelOpenLocal, setWheelOpenLocal] = useState(false);
  const wheelOpen = wheelOpenProp ?? wheelOpenLocal;
  const setWheelOpen = setWheelOpenProp ?? setWheelOpenLocal;
  const [myCodeOpen, setMyCodeOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingInstall, setOnboardingInstall] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const auth = useAuth();
  const isAuthed = auth.status === 'authenticated';
  const inbox = useInbox(auth.session?.access_token ?? null);
  const push = usePushNotifications();
  const [pushModalOpen, setPushModalOpen] = useState(false);

  // Ouvre la boîte de réception si on arrive via une notification push (?inbox=1)
  React.useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get('inbox') === '1') {
        setInboxOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete('inbox');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  function openInbox() {
    // On rafraîchit à l'ouverture (sans tout marquer lu : le client coche
    // ses messages lui-même, ou utilise « Tout marquer comme lu »).
    setInboxOpen(true);
    inbox.refresh();
  }

  // Bouton « Commander » du hero → défile jusqu'au menu (recherche + carrousels).
  function scrollToMenu() {
    document
      .querySelector('[data-v2-section="menu"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Affiche l'onboarding au tout premier lancement.
  // Cas spécial : arrivée depuis la roue /jeu (?welcome=1) → on ouvre direct
  // sur la slide INSTALLATION (sinon le lead loupe l'étape "télécharge l'app").
  React.useEffect(() => {
    const welcome = new URLSearchParams(window.location.search).get('welcome') === '1';
    if (welcome) {
      setOnboardingInstall(true);
      setOnboardingOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (!hasSeenOnboarding()) {
      const t = window.setTimeout(() => setOnboardingOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, []);

  // Pop-up d'activation des notifications : s'affiche à CHAQUE session tant que
  // l'utilisateur n'a pas activé les push (règle : activation "obligatoire").
  // 1×/session (sessionStorage), jamais en même temps que l'onboarding, et
  // même sans compte (un abonnement anonyme reçoit les annonces « à tous »).
  React.useEffect(() => {
    if (push.loading || push.subscribed) return;
    if (onboardingOpen) return;
    try {
      if (sessionStorage.getItem('labase_push_prompt') === '1') return;
    } catch {}
    const t = window.setTimeout(() => {
      // Une seule pop-up auto à la fois : si l'avis Google occupe déjà l'écran,
      // on laisse tomber le push pour cette session (il revient chaque session).
      if (!tryAcquirePrompt('push')) return;
      setPushModalOpen(true);
      try {
        sessionStorage.setItem('labase_push_prompt', '1');
      } catch {}
    }, 1600);
    return () => window.clearTimeout(t);
  }, [push.loading, push.subscribed, onboardingOpen]);

  const xp = auth.profile?.xp ?? 0;
  const next = nextLevelThreshold(xp);
  const mascotteLevel = computeMascotteLevel(xp);

  // ─── Parrainage in-app : capture le ?ref=CODE dans l'URL ───────────
  // Cas d'un filleul qui ouvre le lien de parrainage puis s'inscrit via la
  // modale auth (et non la page /jeu). On mémorise le code, on l'enlève de
  // l'URL, puis on le « consomme » une fois le compte connecté.
  React.useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) {
        localStorage.setItem('labase_ref', ref.trim().toUpperCase().slice(0, 12));
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  // Une fois connecté, rattache le filleul à son parrain (one-shot).
  React.useEffect(() => {
    if (!isAuthed) return;
    const code = (() => {
      try { return localStorage.getItem('labase_ref'); } catch { return null; }
    })();
    const token = auth.session?.access_token;
    if (!code || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/profile?action=claim-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code }),
        });
        const data = await resp.json().catch(() => ({}));
        // Consommé dans tous les cas (lié, déjà parrainé, code inconnu…) →
        // on ne ré-essaie pas à chaque chargement.
        try { localStorage.removeItem('labase_ref'); } catch {}
        if (!cancelled && data?.linked) auth.refreshProfile();
      } catch {
        // réseau : on garde le code pour une prochaine fois
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthed, auth.session?.access_token]);

  // Admin : roue en illimité (test des cadeaux)
  const adminEmails = String(import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = auth.email ? adminEmails.includes(auth.email.toLowerCase()) : false;

  // Partage du lien de parrainage (natif si dispo, sinon copie)
  async function shareReferral() {
    if (!isAuthed) {
      setAuthOpen(true);
      return;
    }
    const code = auth.profile?.referral_code;
    if (!code) {
      setProfileOpen(true);
      return;
    }
    const link = `${window.location.origin}/jeu?ref=${code}`;
    const text = 'Je te parraine chez La Base 🥤 Tourne la roue, gagne un cadeau à récupérer en boutique 🎁 : ';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'La Base Shakes & Drinks', text, url: link });
        return;
      }
    } catch {
      /* annulé → fallback copie */
    }
    try {
      await navigator.clipboard.writeText(link);
      window.alert('Lien de parrainage copié ! Partage-le à tes amis 🤝');
    } catch {
      window.prompt('Copie ton lien de parrainage :', link);
    }
  }

  // Ouvre la roue (ou l'auth si pas connecté)
  function openWheel() {
    if (isAuthed) setWheelOpen(true);
    else setAuthOpen(true);
  }

  function handleBottomTab(t: NavTab) {
    setTab(t);
    if (t === 'home') {
      setActiveChip('all');
      setHeaderTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (t === 'menu') {
      setActiveChip('all');
      setHeaderTab('menu');
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-v2-section="menu"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (t === 'combos') {
      setActiveChip('combos');
      setHeaderTab('combos');
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-v2-section="combos"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (t === 'club') {
      window.location.href = '/club';
    } else if (t === 'account') {
      if (isAuthed) setProfileOpen(true);
      else setAuthOpen(true);
    }
  }

  function handleHeaderTab(t: HeaderTab) {
    setHeaderTab(t);
    if (t === 'combos') {
      setActiveChip('combos');
      // Scroll vers section combos
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-v2-section="combos"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (t === 'menu') {
      setActiveChip('all');
      window.requestAnimationFrame(() => {
        document
          .querySelector('[data-v2-section="menu"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (t === 'rewards') {
      if (isAuthed) setProfileOpen(true);
      else setAuthOpen(true);
    } else if (t === 'club') {
      window.location.href = '/club';
    } else {
      // home
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Filtrage par recherche (sur tous les produits)
  const filteredQuery = query.trim().toLowerCase();
  function matchesQuery(p: V2Product): boolean {
    if (!filteredQuery) return true;
    return (
      p.name.toLowerCase().includes(filteredQuery) ||
      p.sub.toLowerCase().includes(filteredQuery) ||
      p.categoryName.toLowerCase().includes(filteredQuery)
    );
  }

  function shouldShowSection(sectionId: string): boolean {
    if (activeChip === 'all') return true;
    return activeChip === sectionId;
  }

  const nouveautes = useMemo(() => V2_NEW.filter(matchesQuery), [filteredQuery]);
  const populaires = useMemo(() => V2_POPULAR.filter(matchesQuery), [filteredQuery]);
  const smoothies = useMemo(() => V2_SMOOTHIES.filter(matchesQuery), [filteredQuery]);
  const drinks = useMemo(() => V2_DRINKS.filter(matchesQuery), [filteredQuery]);
  const hot = useMemo(() => V2_HOT.filter(matchesQuery), [filteredQuery]);
  const health = useMemo(() => V2_HEALTH.filter(matchesQuery), [filteredQuery]);
  const kids = useMemo(() => V2_KIDS.filter(matchesQuery), [filteredQuery]);
  const waffles = useMemo(() => V2_WAFFLES.filter(matchesQuery), [filteredQuery]);

  function handleAddProduct(product: V2Product) {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      // Le « + » ouvre la modale d'options (taille / extras) : c'est là que
      // l'ajout au panier se fait vraiment. Pas d'animation « vole vers le
      // panier » ici — elle laissait croire à un ajout direct qui n'a pas lieu.
      onAddProduct(product, e.currentTarget);
    };
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 25,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        background: palette.bg,
        color: palette.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        paddingBottom: '96px',
      }}
    >
      <Header
        palette={palette}
        cartCount={cartCount}
        onCart={onOpenCart}
        onProfile={() => (isAuthed ? setProfileOpen(true) : setAuthOpen(true))}
        onNotifications={openInbox}
        notifBadge={inbox.unread}
        activeTab={headerTab}
        onTabChange={handleHeaderTab}
        isAuthed={isAuthed}
      />

      {/* Bannière installer l'app (Android/PC Chromium uniquement) */}
      {canInstall && onInstall && !installDismissed && (
        <div style={{ padding: '0 16px 10px', maxWidth: 1240, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${palette.primary}22, ${palette.accent}11)`,
              border: `1px solid ${palette.primary}55`,
            }}
          >
            <div style={{ fontSize: 24, lineHeight: 1 }}>📲</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 14, color: palette.text }}>
                Installe l'app La Base
              </div>
              <div style={{ fontSize: 11.5, color: palette.textDim, marginTop: 1 }}>
                Accès direct + notifs de tes cadeaux
              </div>
            </div>
            <button
              onClick={onInstall}
              style={{
                flex: 'none', padding: '9px 14px', border: 0, borderRadius: 10,
                background: palette.cta, color: palette.ctaText,
                fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 12.5, cursor: 'pointer',
              }}
            >
              Installer
            </button>
            <button
              onClick={() => setInstallDismissed(true)}
              aria-label="Fermer"
              style={{
                flex: 'none', width: 40, height: 40, borderRadius: '50%',
                background: 'transparent', border: `1px solid ${palette.line}`,
                color: palette.textDim, cursor: 'pointer', fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero FONCTIONNEL : Salut + XP → bouton Commander → Reprendre (col 1),
          actions rapides (col 2 en desktop). Sur mobile tout s'empile dans cet
          ordre = « agir d'abord ». Remplace l'ancienne bannière carousel promo
          (le Combo Power reste visible dans « Formules combo » plus bas). */}
      <div
        className="v2-hero-grid"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '4px 0 0',
        }}
      >
        <div className="v2-hero-main">
          <XpCard
            palette={palette}
            connected={isAuthed}
            firstName={auth.profile?.first_name ?? undefined}
            level={mascotteLevel === 'pro' ? 'Pro' : mascotteLevel === 'regulier' ? 'Régulier' : 'Apprenti'}
            xp={xp}
            xpNext={next.xp}
            nextLevel={next.name}
            onConnect={() => (isAuthed ? setProfileOpen(true) : setAuthOpen(true))}
            onOpenRewards={() => setRewardsOpen(true)}
          />
          <div style={{ padding: '2px 16px 12px' }}>
            <button
              onClick={scrollToMenu}
              style={{
                width: '100%',
                padding: '17px',
                borderRadius: 18,
                border: 'none',
                background: palette.cta,
                color: palette.ctaText,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: `0 14px 34px ${palette.cta}44`,
              }}
            >
              🥤 Commander
            </button>
            {/* Accès direct au QR fidélité : 90% des clients ouvrent l'app AU
                comptoir pour le montrer → 1 tap depuis l'accueil (avant : caché
                sous Récompenses → Mon code). Non connecté → ouvre l'auth. */}
            <button
              onClick={() => (isAuthed ? setMyCodeOpen(true) : setAuthOpen(true))}
              style={{
                width: '100%',
                marginTop: 11,
                padding: '15px',
                borderRadius: 16,
                border: `1.5px solid ${palette.primary}`,
                background: `${palette.primary}14`,
                color: palette.primary,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 800,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
              }}
            >
              📷 Mon QR fidélité
            </button>
            {/* Preuve sociale : note Google (ouvre les avis). Pas de récompense. */}
            {onLeaveReview && (
              <div
                onClick={onLeaveReview}
                role="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  marginTop: 11,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  color: palette.textDim,
                }}
              >
                <span style={{ color: '#fbbf24', letterSpacing: 1, fontSize: 13 }}>★★★★★</span>
                <span>
                  <b style={{ color: palette.text }}>4,9</b> sur Google · avis vérifiés
                </span>
              </div>
            )}
          </div>
          {onReorder && (
            <ReorderCard palette={palette} isAuthed={isAuthed} onReorder={onReorder} />
          )}
        </div>
        <div className="v2-hero-aside">
          <QuickActions
            palette={palette}
            onRewards={() => (isAuthed ? setRewardsOpen(true) : setAuthOpen(true))}
            onWheel={openWheel}
            onRefer={shareReferral}
            onClub={() => (window.location.href = '/club')}
          />
        </div>
      </div>

      <style>{`
        .v2-hero-grid {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 960px) {
          .v2-hero-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
            gap: 8px;
            align-items: start;
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          .v2-hero-aside {
            display: flex;
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>

      {/* Carte "Bilan offert" — ciblée clients chauds (≥ 3 commandes) */}
      {isAuthed && (auth.profile?.total_orders ?? 0) >= 3 && (
        <div style={{ padding: '4px 16px 8px', maxWidth: 1240, margin: '0 auto' }}>
          <a
            href="/club"
            style={{
              display: 'block',
              textDecoration: 'none',
              borderRadius: 18,
              padding: 18,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
              color: palette.ctaText,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 12px 30px ${palette.primary}44`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.85 }}>
              💪 Tu es un habitué·e
            </div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 21, lineHeight: 1.15, margin: '6px 0 6px' }}>
              Et si on passait au niveau supérieur ?
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.45, opacity: 0.95, marginBottom: 12 }}>
              Perte de poids, énergie, performance… Profite d'un <b>bilan bien-être offert</b> et d'un suivi perso.
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                background: 'rgba(0,0,0,.22)',
                borderRadius: 12,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              ✨ Réserver mon bilan offert →
            </div>
          </a>
        </div>
      )}

      {/* Défi bien-être 7 jours (C2) — auto-éducation + pont coaching */}
      <WellnessChallenge
        palette={palette}
        isAuthed={isAuthed}
        onConnect={() => setAuthOpen(true)}
      />

      <div data-v2-section="menu" />
      <SearchBar palette={palette} value={query} onChange={setQuery} />
      <CategoryChips palette={palette} active={activeChip} onChange={setActiveChip} />

      {/* Nouveautés — boissons signature fraîchement ajoutées */}
      {shouldShowSection('popular') && nouveautes.length > 0 && (
        <>
          <SectionHead palette={palette} icon="✨" title="Nouveautés" sub={`${nouveautes.length} à découvrir`} />
          <Carousel>
            {nouveautes.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Populaires */}
      {shouldShowSection('popular') && populaires.length > 0 && (
        <>
          <SectionHead palette={palette} icon="🔥" title="Populaires au club" sub={`${populaires.length} recettes`} />
          <Carousel>
            {populaires.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Combos */}
      {shouldShowSection('combos') && V2_COMBOS.length > 0 && (
        <>
          <div data-v2-section="combos" />
          <SectionHead palette={palette} icon="⚡" title="Formules combo" sub="Économise jusqu'à 1,90€" />
          <Carousel>
            {V2_COMBOS.map((c) => (
              <ComboCard key={c.id} palette={palette} combo={c} onClick={() => onOpenCombo(c)} />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Smoothies */}
      {shouldShowSection('smoothies') && smoothies.length > 0 && (
        <>
          <SectionHead palette={palette} icon="🥤" title="Smoothies nutritionnels" sub={`${smoothies.length} recettes · 24g protéines`} />
          <Carousel>
            {smoothies.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Drinks énergisants */}
      {shouldShowSection('drinks') && drinks.length > 0 && (
        <>
          <SectionHead palette={palette} icon="⚡" title="Boissons énergisantes" sub={`${drinks.length} recettes · 0 sucre`} />
          <Carousel>
            {drinks.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Boissons enfants — sans énergisant */}
      {shouldShowSection('kids') && kids.length > 0 && (
        <>
          <SectionHead palette={palette} icon="🧒" title="Boissons enfants" sub={`${kids.length} recettes · sans énergisant`} />
          <Carousel>
            {kids.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Hot */}
      {shouldShowSection('hot') && hot.length > 0 && (
        <>
          <SectionHead palette={palette} icon="☕" title="Pauses chaudes" sub={`${hot.length} produits`} />
          <Carousel>
            {hot.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Santé */}
      {shouldShowSection('health') && health.length > 0 && (
        <>
          <SectionHead palette={palette} icon="💧" title="Boissons santé" sub={`${health.length} recettes`} />
          <Carousel>
            {health.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* Gaufre */}
      {shouldShowSection('waffles') && waffles.length > 0 && (
        <>
          <SectionHead palette={palette} icon="🧇" title="Gaufre healthy" sub="5 toppings au choix" />
          <Carousel>
            {waffles.map((p) => (
              <ProductCard
                key={p.id}
                palette={palette}
                product={p}
                onClick={() => onOpenProduct(p)}
                onAdd={handleAddProduct(p)}
              />
            ))}
          </Carousel>
          <div style={{ height: 22 }} />
        </>
      )}

      {/* La Base = bien plus qu'un bar : club bien-être + opportunité revenus */}
      <div style={{ padding: '8px 16px 0' }}>
        <div
          style={{
            borderRadius: 22,
            overflow: 'hidden',
            border: `1px solid ${palette.line}`,
            background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${palette.primary}22, transparent 70%)`,
            }}
          />
          <div style={{ padding: 20, position: 'relative' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.15em',
                color: palette.primary,
                textTransform: 'uppercase',
              }}
            >
              ✨ La Base, c'est aussi un club
            </div>
            <div
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 22,
                lineHeight: 1.15,
                margin: '6px 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Ton accompagnement bien-être
            </div>
            <div style={{ fontSize: 13.5, color: palette.textDim, lineHeight: 1.5, marginBottom: 16 }}>
              Perte de poids, énergie, performance sportive : on t'accompagne avec un
              <b style={{ color: palette.text }}> bilan offert</b> et un suivi personnalisé.
            </div>
            <a
              href="/club"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '14px',
                background: palette.cta,
                color: palette.ctaText,
                borderRadius: 14,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                fontSize: 14,
                boxShadow: `0 10px 28px ${palette.cta}55`,
              }}
            >
              ✨ Découvrir l'accompagnement
            </a>
            <a
              href="https://www.labase360.fr/rejoindre?ref=656dcf35-4859-4a70-9d20-990104813423"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none',
                marginTop: 10,
                fontSize: 12,
                color: palette.primary,
                fontWeight: 700,
              }}
            >
              🚀 Et si tu en faisais ton activité ? →
            </a>
          </div>
        </div>
      </div>

      <InfoBlock palette={palette} />
      <InstaCard palette={palette} />

      <BottomNav palette={palette} active={tab} onChange={handleBottomTab} />

      {/* Roue cadeau (ouverte depuis les actions rapides) */}
      <WheelModal palette={palette} open={wheelOpen} onClose={() => setWheelOpen(false)} isAdmin={isAdmin} />

      {/* Modale auth — email + mot de passe */}
      <AuthModal
        palette={palette}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSendMagicLink={auth.sendMagicLink}
        onVerifyOtp={auth.verifyOtp}
        onSignInWithPassword={auth.signInWithPassword}
        onSignUpWithPassword={auth.signUpWithPassword}
        onResetPassword={auth.resetPassword}
      />

      {/* Bottom sheet profil (visible uniquement si connecté) */}
      <ProfileSheet
        palette={palette}
        open={profileOpen && isAuthed}
        onClose={() => setProfileOpen(false)}
        profile={auth.profile}
        email={auth.email}
        userId={auth.session?.user?.id ?? null}
        onUpdateProfile={auth.updateProfile}
        onSignOut={auth.signOut}
        onShowOnboarding={() => {
          setProfileOpen(false);
          setOnboardingOpen(true);
        }}
      />

      {/* Écran "Mes récompenses" — catalogue de cadeaux XP */}
      <RewardsModal
        palette={palette}
        open={rewardsOpen && isAuthed}
        onClose={() => setRewardsOpen(false)}
        xp={xp}
        firstName={auth.profile?.first_name ?? undefined}
        onShowMyCode={() => {
          setRewardsOpen(false);
          setMyCodeOpen(true);
        }}
        onShareReferral={shareReferral}
      />

      {/* QR à montrer au comptoir (accessible depuis les récompenses) */}
      {auth.session?.user?.id && (
        <MyCodeModal
          palette={palette}
          open={myCodeOpen}
          onClose={() => setMyCodeOpen(false)}
          userId={auth.session.user.id}
          profile={auth.profile}
        />
      )}

      {/* Onboarding / tutoriel (auto au 1er lancement + rejouable via profil) */}
      <OnboardingModal
        palette={palette}
        open={onboardingOpen}
        startAtInstall={onboardingInstall}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* Boîte de réception (messages / annonces) */}
      <InboxModal
        palette={palette}
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        items={inbox.items}
        unread={inbox.unread}
        onMarkRead={inbox.markRead}
        onMarkAllRead={inbox.markAllRead}
      />

      {/* Pop-up d'activation des notifications (à chaque session tant que non activé) */}
      <PushActivationModal
        palette={palette}
        open={pushModalOpen}
        onClose={() => {
          setPushModalOpen(false);
          releasePrompt('push');
        }}
        permission={push.permission}
        supported={push.supported}
        loading={push.loading}
        onEnable={push.enable}
        canInstall={canInstall}
        onInstall={onInstall}
      />
    </div>
  );
}
