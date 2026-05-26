// HomeV2 — squelette de la nouvelle home (Phase 1 : header + XP + bottom nav)
// Activable via ?v2 dans l'URL pour test parallèle, sans casser App.tsx
import React, { useState } from 'react';
import { PALETTE_E } from './palette';
import { Header } from './Header';
import { XpCard } from './XpCard';
import { BottomNav, type NavTab } from './BottomNav';

interface HomeV2Props {
  cartCount: number;
  onOpenCart: () => void;
}

export function HomeV2({ cartCount, onOpenCart }: HomeV2Props) {
  const palette = PALETTE_E;
  const [tab, setTab] = useState<NavTab>('home');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: palette.bg,
        color: palette.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        paddingBottom: '96px',
      }}
    >
      <Header palette={palette} cartCount={cartCount} onCart={onOpenCart} />

      <XpCard palette={palette} connected={false} />

      {/* Placeholder pour Phase 2 — hero carousel + chips + carousels produits */}
      <div style={{ padding: '0 16px' }}>
        <div
          style={{
            border: `1px dashed ${palette.line}`,
            borderRadius: 18,
            padding: 24,
            textAlign: 'center',
            background: palette.card,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 18,
              fontWeight: 800,
              color: palette.primary,
            }}
          >
            🚧 Phase 2 en cours
          </div>
          <p
            style={{
              marginTop: 8,
              color: palette.textDim,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Hero carousel + chips catégories sticky + carousels produits horizontaux Uber-style arrivent dans la prochaine session.
          </p>
          <p
            style={{
              marginTop: 12,
              color: palette.textDim,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            Onglet actif: <b style={{ color: palette.text }}>{tab}</b>
          </p>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            background: palette.cardHi,
            border: `1px solid ${palette.line}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: palette.accent,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Pour le moment
          </div>
          <div style={{ fontSize: 14, color: palette.text, lineHeight: 1.5 }}>
            Tu vois la palette E (Teal × Ambre) appliquée, le header, la carte XP avec la mascotte "Le Petit Shaker", et la bottom nav. Retire <code style={{ background: 'rgba(0,0,0,.4)', padding: '2px 6px', borderRadius: 4 }}>?v2</code> de l'URL pour revenir à l'app actuelle (intacte).
          </div>
        </div>
      </div>

      <BottomNav palette={palette} active={tab} onChange={setTab} />
    </div>
  );
}
