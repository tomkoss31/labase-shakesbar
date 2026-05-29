// HomeV2 — home complète Phase 2 avec hero + chips + carousels horizontaux
// Activable via ?v2. Click produit/combo → callback vers App.tsx pour
// réutiliser les modales et la logique panier/Square existantes.
import React, { useMemo, useState } from 'react';
import { PALETTE_E } from './palette';
import { Header } from './Header';
import { XpCard } from './XpCard';
import { HeroCarousel } from './HeroCarousel';
import { ProductCard, ComboCard } from './ProductCard';
import { BottomNav, type NavTab } from './BottomNav';
import { SearchBar, CategoryChips, SectionHead, Carousel, InfoBlock, InstaCard } from './blocks';
import { SideAddressCard } from './SideAddressCard';
import type { HeaderTab } from './Header';
import { useFlyAnimation, colorForCategory } from './FlyAnimation';
import { useAuth } from './auth/useAuth';
import { AuthModal } from './auth/AuthModal';
import { ProfileSheet } from './auth/ProfileSheet';
import { RewardsModal } from './rewards/RewardsModal';
import { MyCodeModal } from './auth/MyCodeModal';
import { OnboardingModal, hasSeenOnboarding } from './OnboardingModal';
import { computeMascotteLevel, nextLevelThreshold } from './auth/types';
import {
  V2_POPULAR,
  V2_COMBOS,
  V2_SMOOTHIES,
  V2_DRINKS,
  V2_HOT,
  V2_HEALTH,
  V2_WAFFLES,
  type V2Product,
  type V2Combo,
  type V2HeroSlide,
} from './products-adapter';

interface HomeV2Props {
  cartCount: number;
  onOpenCart: () => void;
  onOpenProduct: (product: V2Product) => void;
  onOpenCombo: (combo: V2Combo) => void;
  onAddProduct: (product: V2Product, fromButton: HTMLElement) => void;
  onLeaveReview?: () => void;
}

export function HomeV2({
  cartCount,
  onOpenCart,
  onOpenProduct,
  onOpenCombo,
  onAddProduct,
  onLeaveReview,
}: HomeV2Props) {
  const palette = PALETTE_E;
  const [tab, setTab] = useState<NavTab>('home');
  const [headerTab, setHeaderTab] = useState<HeaderTab>('home');
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [myCodeOpen, setMyCodeOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Affiche l'onboarding au tout premier lancement
  React.useEffect(() => {
    if (!hasSeenOnboarding()) {
      const t = window.setTimeout(() => setOnboardingOpen(true), 700);
      return () => window.clearTimeout(t);
    }
  }, []);
  const { overlay: flyOverlay, trigger: triggerFly } = useFlyAnimation(palette);
  const auth = useAuth();
  const isAuthed = auth.status === 'authenticated';
  const xp = auth.profile?.xp ?? 0;
  const next = nextLevelThreshold(xp);
  const mascotteLevel = computeMascotteLevel(xp);

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

  const populaires = useMemo(() => V2_POPULAR.filter(matchesQuery), [filteredQuery]);
  const smoothies = useMemo(() => V2_SMOOTHIES.filter(matchesQuery), [filteredQuery]);
  const drinks = useMemo(() => V2_DRINKS.filter(matchesQuery), [filteredQuery]);
  const hot = useMemo(() => V2_HOT.filter(matchesQuery), [filteredQuery]);
  const health = useMemo(() => V2_HEALTH.filter(matchesQuery), [filteredQuery]);
  const waffles = useMemo(() => V2_WAFFLES.filter(matchesQuery), [filteredQuery]);

  function handleSlideClick(slide: V2HeroSlide) {
    if (slide.combo) {
      onOpenCombo(slide.combo);
    } else if (slide.product) {
      onOpenProduct(slide.product);
    } else if (slide.type === 'review' && onLeaveReview) {
      onLeaveReview();
    }
  }

  function handleAddProduct(product: V2Product) {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      // Anim signature : gouttelette + éclaboussures depuis le bouton vers le panier
      triggerFly(btn, colorForCategory(product.categoryId, palette));
      // Léger délai pour laisser apparaître l'animation avant la modale
      window.setTimeout(() => {
        onAddProduct(product, btn);
      }, 320);
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
        activeTab={headerTab}
        onTabChange={handleHeaderTab}
        isAuthed={isAuthed}
      />

      {/* Hero grid : carousel à gauche (col 1), XP + adresse à droite (col 2) en desktop */}
      <div
        className="v2-hero-grid"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '4px 0 0',
        }}
      >
        <div className="v2-hero-main">
          <HeroCarousel palette={palette} onSlideClick={handleSlideClick} />
        </div>
        <div className="v2-hero-aside">
          <XpCard
            palette={palette}
            connected={isAuthed}
            firstName={auth.profile?.first_name ?? undefined}
            level={mascotteLevel === 'pro' ? 'Pro' : mascotteLevel === 'regulier' ? 'Régulier' : 'Apprenti'}
            xp={xp}
            xpNext={next.xp}
            onConnect={() => (isAuthed ? setProfileOpen(true) : setAuthOpen(true))}
            onOpenRewards={() => setRewardsOpen(true)}
          />
          <div style={{ padding: '0 16px 16px' }}>
            <SideAddressCard palette={palette} />
          </div>
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
      <div data-v2-section="menu" />
      <SearchBar palette={palette} value={query} onChange={setQuery} />
      <CategoryChips palette={palette} active={activeChip} onChange={setActiveChip} />

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

      <InfoBlock palette={palette} />
      <InstaCard palette={palette} />

      <BottomNav palette={palette} active={tab} onChange={handleBottomTab} />

      {/* Animation FlyingDrop signature ajout panier */}
      {flyOverlay}

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
        onClose={() => setOnboardingOpen(false)}
      />
    </div>
  );
}
