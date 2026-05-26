// Header v2 — logo + 3 icônes circulaires (notif / profil / panier)
import React from 'react';
import type { Palette } from './palette';
import { IconBell, IconUser, IconCart } from './icons';

interface LaBaseLogoProps { palette: Palette; size?: 'sm' | 'md' | 'lg' }

export function LaBaseLogo({ palette, size = 'md' }: LaBaseLogoProps) {
  const fs = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: fs * 1.5,
          height: fs * 1.5,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${palette.glow1}, ${palette.glow2}, ${palette.accent})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontFamily: 'Outfit, sans-serif',
          color: palette.bg,
          fontSize: fs * 0.85,
          boxShadow: `0 0 20px ${palette.primary}55`,
        }}
      >
        B
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: fs, color: palette.text, letterSpacing: '-.02em' }}>LA BASE</div>
        <div style={{ fontSize: fs * 0.42, color: palette.textDim, letterSpacing: '.2em', fontWeight: 600, marginTop: 2 }}>SHAKES&nbsp;·&nbsp;VERDUN</div>
      </div>
    </div>
  );
}

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
}

export function Header({ palette, cartCount, onCart, onProfile, onNotifications }: HeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '14px 16px 10px',
        background: `linear-gradient(180deg, ${palette.bg} 70%, ${palette.bg}00)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <LaBaseLogo palette={palette} />
      <div style={{ display: 'flex', gap: 6 }}>
        <IconBtn palette={palette} onClick={onNotifications} ariaLabel="Notifications">
          <IconBell color={palette.text} />
        </IconBtn>
        <IconBtn palette={palette} onClick={onProfile} ariaLabel="Compte">
          <IconUser color={palette.text} />
        </IconBtn>
        <IconBtn palette={palette} onClick={onCart} badge={cartCount} ariaLabel="Panier" dataAttr="data-v2-cart-icon">
          <IconCart color={palette.text} />
        </IconBtn>
      </div>
    </div>
  );
}
