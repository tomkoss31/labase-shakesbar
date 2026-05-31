// Bottom Navigation v2 — 4 onglets fixés bas mobile
import React from 'react';
import type { Palette } from './palette';
import { IconHome, IconMenu, IconBolt, IconAccount, IconSparkle } from './icons';

export type NavTab = 'home' | 'menu' | 'combos' | 'club' | 'account';

interface BottomNavProps {
  palette: Palette;
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const TABS: Array<{ id: NavTab; label: string; Icon: typeof IconHome }> = [
  { id: 'home', label: 'Accueil', Icon: IconHome },
  { id: 'menu', label: 'Menu', Icon: IconMenu },
  { id: 'combos', label: 'Combos', Icon: IconBolt },
  { id: 'club', label: 'Le Club', Icon: IconSparkle },
  { id: 'account', label: 'Compte', Icon: IconAccount },
];

export function BottomNav({ palette, active, onChange }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: `linear-gradient(180deg, ${palette.bg}00, ${palette.bg} 30%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${palette.line}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4,
          padding: '8px 8px 12px',
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                padding: '6px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                color: isActive ? palette.primary : palette.textDim,
                transition: 'color .2s ease',
              }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon color={isActive ? palette.primary : palette.textDim} size={22} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
