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
import { useFlyAnimation, colorForCategory } from './FlyAnimation';
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
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('all');
  const { overlay: flyOverlay, trigger: triggerFly } = useFlyAnimation(palette);

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
      <Header palette={palette} cartCount={cartCount} onCart={onOpenCart} />
      <XpCard palette={palette} connected={false} />
      <HeroCarousel palette={palette} onSlideClick={handleSlideClick} />
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

      <BottomNav palette={palette} active={tab} onChange={setTab} />

      {/* Animation FlyingDrop signature ajout panier */}
      {flyOverlay}
    </div>
  );
}
