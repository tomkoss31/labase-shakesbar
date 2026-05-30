// Header v2 — logo + nav tabs desktop + icônes circulaires (notif/profil/panier)
import React from 'react';
import type { Palette } from './palette';
import { IconBell, IconUser, IconCart } from './icons';

interface LaBaseLogoProps {
  palette: Palette;
  size?: 'sm' | 'md' | 'lg';
}

export function LaBaseLogo({ palette, size = 'md' }: LaBaseLogoProps) {
  const fs = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img
        src="/icon-192.png"
        alt="La Base"
        style={{
          width: fs * 1.7,
          height: fs * 1.7,
          borderRadius: 10,
          boxShadow: `0 0 24px ${palette.primary}44`,
          flexShrink: 0,
          objectFit: 'cover',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: fs,
            color: palette.text,
            letterSpacing: '-.02em',
          }}
        >
          LA BASE
        </div>
        <div
          style={{
            fontSize: fs * 0.42,
            color: palette.textDim,
            letterSpacing: '.22em',
            fontWeight: 600,
            marginTop: 3,
          }}
        >
          SHAKES&nbsp;·&nbsp;VERDUN
        </div>
      </div>
    </div>
  );
}

export type HeaderTab = 'home' | 'menu' | 'combos' | 'rewards' | 'club';

interface IconBtnProps {
  palette: Palette;
  children: React.ReactNode;
  badge?: number;
  onClick?: () => void;
  ariaLabel?: string;
  dataAttr?: string;
}

export function IconBtn({ palette, children, badge, onClick, ariaLabel, dataAttr }: IconBtnProps) {
  const extra: Record<string, boolean> = {};
  if (dataAttr) extra[dataAttr] = true;
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      {...extra}
      style={{
        width: 38,
        height: 38,
        borderRadius: 12,
        background: palette.card,
        border: `1px solid ${palette.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 9,
            background: palette.accent,
            color: palette.ctaText,
            fontSize: 11,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 0 2px ${palette.bg}`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {badge}
        </div>
      )}
    </button>
  );
}

interface HeaderProps {
  palette: Palette;
  cartCount: number;
  onCart: () => void;
  onProfile?: () => void;
  onNotifications?: () => void;
  notifBadge?: number;
  activeTab?: HeaderTab;
  onTabChange?: (tab: HeaderTab) => void;
  isAuthed?: boolean;
}

const TABS: Array<{ id: HeaderTab; label: string }> = [
  { id: 'home', label: 'Accueil' },
  { id: 'menu', label: 'Menu' },
  { id: 'combos', label: 'Combos' },
  { id: 'rewards', label: 'Récompenses' },
  { id: 'club', label: '✨ Le Club' },
];

export function Header({
  palette,
  cartCount,
  onCart,
  onProfile,
  onNotifications,
  notifBadge = 0,
  activeTab = 'home',
  onTabChange,
  isAuthed = false,
}: HeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '14px 16px 12px',
        background: `linear-gradient(180deg, ${palette.bg} 70%, ${palette.bg}00)`,
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <LaBaseLogo palette={palette} />

        {/* Tabs desktop only */}
        <nav className="v2-header-tabs">
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: '8px 14px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: active ? 800 : 600,
                  fontSize: 14,
                  letterSpacing: '-.01em',
                  color: active ? palette.text : palette.textDim,
                  position: 'relative',
                  transition: 'color .2s',
                }}
              >
                {tab.label}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 22,
                      height: 3,
                      borderRadius: 999,
                      background: palette.primary,
                      boxShadow: `0 0 12px ${palette.primary}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <IconBtn palette={palette} onClick={onNotifications} badge={notifBadge} ariaLabel="Notifications">
            <IconBell color={palette.text} />
          </IconBtn>
          <IconBtn palette={palette} onClick={onCart} badge={cartCount} ariaLabel="Panier" dataAttr="data-v2-cart-icon">
            <IconCart color={palette.text} />
          </IconBtn>
          {/* CTA Mon compte */}
          <button
            onClick={onProfile}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              background: palette.cta,
              color: palette.ctaText,
              border: 0,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: `0 6px 20px ${palette.cta}55`,
              flexShrink: 0,
            }}
            aria-label={isAuthed ? 'Mon compte' : 'Connecter'}
          >
            <IconUser color={palette.ctaText} size={16} />
            <span className="v2-header-cta-label">
              {isAuthed ? 'Mon compte' : 'Connecter'}
            </span>
          </button>
        </div>
      </div>

      <style>{`
        .v2-header-tabs {
          display: none;
          gap: 4px;
          align-items: center;
          margin-left: 16px;
        }
        .v2-header-cta-label {
          display: none;
        }
        @media (min-width: 768px) {
          .v2-header-tabs { display: flex; }
          .v2-header-cta-label { display: inline; }
        }
      `}</style>
    </div>
  );
}
