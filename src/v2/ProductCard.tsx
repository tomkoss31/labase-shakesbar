// ProductCard v2 — style Uber Eats, image en haut + nom/prix/bouton + en bas
import React from 'react';
import type { Palette } from './palette';
import type { V2Product, V2Combo } from './products-adapter';
import { ProductImage } from './ProductImage';
import { IconPlus, IconArrow } from './icons';
import { colorForProduct } from './FlyAnimation';

function fmtEuro(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')}€`;
}

function badgeColor(palette: Palette, badge?: string) {
  if (!badge) return null;
  const isBest = ['Best-seller', 'Iconique'].includes(badge);
  return {
    bg: isBest ? palette.accent : palette.emotion,
    fg: isBest ? palette.ctaText : '#1a0506',
    label: badge,
  };
}

interface ProductCardProps {
  palette: Palette;
  product: V2Product;
  onClick: () => void;
  onAdd: (event: React.MouseEvent<HTMLButtonElement>) => void;
  width?: number;
}

export function ProductCard({ palette, product, onClick, onAdd, width = 168 }: ProductCardProps) {
  const badge = badgeColor(palette, product.badge);
  const cardHeight = 234;
  const imageZone = cardHeight - 96;
  const productColor = colorForProduct(product.name, product.categoryId, palette);

  return (
    <div
      onClick={onClick}
      style={{
        width,
        flexShrink: 0,
        background: palette.card,
        borderRadius: 18,
        border: `1px solid ${palette.line}`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform .2s ease, border-color .2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = productColor + '88')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.line)}
    >
      <div
        style={{
          height: imageZone,
          position: 'relative',
          background: `radial-gradient(circle at 50% 60%, ${productColor}44, ${productColor}11 40%, transparent 70%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 12,
        }}
      >
        <ProductImage src={product.image} alt={product.name} palette={palette} />
        {badge && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '4px 8px',
              borderRadius: 999,
              background: badge.bg,
              color: badge.fg,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {badge.label}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: 14,
            color: palette.text,
            lineHeight: 1.15,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: palette.textDim,
            marginTop: 3,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {product.sub}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 16, color: palette.text }}>
            {fmtEuro(product.price)}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(e);
            }}
            aria-label={`Choisir ${product.name}`}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: palette.cta,
              color: palette.ctaText,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 6px 16px ${palette.cta}99, 0 0 0 2px ${productColor}33`,
              transition: 'transform .15s ease',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <IconPlus color={palette.ctaText} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ComboCardProps {
  palette: Palette;
  combo: V2Combo;
  onClick: () => void;
}

export function ComboCard({ palette, combo, onClick }: ComboCardProps) {
  // Couleur signature combo basée sur l'ID
  const COMBO_COLORS: Record<string, string> = {
    'combo-power': palette.accent,
    'combo-medium': palette.glow3,
    'combo-tea-time': '#65a30d',
    'combo-coffee-break': '#a16207',
    'combo-choco-cocoon': '#7c2d12',
    'combo-gourmet-break': '#a855f7',
  };
  const comboColor = COMBO_COLORS[combo.id] ?? palette.primary;

  return (
    <div
      onClick={onClick}
      style={{
        width: 280,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
        borderRadius: 18,
        border: `1px solid ${palette.line}`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: 140,
          position: 'relative',
          background: `radial-gradient(circle at 60% 60%, ${comboColor}55, ${comboColor}11 45%, transparent 75%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
        }}
      >
        <ProductImage src={combo.image} alt={combo.name} palette={palette} />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '4px 9px',
            borderRadius: 999,
            background: palette.accent,
            color: palette.ctaText,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.03em',
          }}
        >
          −{fmtEuro(combo.save)}
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 17, color: palette.text }}>
          {combo.name}
        </div>
        <div style={{ fontSize: 12, color: palette.textDim, marginTop: 3 }}>{combo.sub}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 19, color: palette.text }}>
              {fmtEuro(combo.price)}
            </div>
            <div style={{ fontSize: 12, color: palette.textDim, textDecoration: 'line-through' }}>
              {fmtEuro(combo.price + combo.save)}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              background: palette.cta,
              color: palette.ctaText,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Composer <IconArrow color={palette.ctaText} />
          </button>
        </div>
      </div>
    </div>
  );
}
