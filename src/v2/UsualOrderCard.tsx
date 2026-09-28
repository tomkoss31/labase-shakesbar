// Carte « Ta commande habituelle » (accueil) : recommander en un geste le
// produit le plus commandé, avec son format et ses extras.
import React from 'react';
import type { Palette } from './palette';
import { ProductImage } from './ProductImage';
import type { UsualOrder } from './usualOrder';

const EXTRA_CENTS = 250; // synchrone avec api/create-payment-link.ts

function priceCents(u: UsualOrder): number {
  const raw = u.product.raw;
  const opt = raw.options?.find((o) => o.label === u.option);
  const base = opt?.priceCents ?? raw.basePriceCents ?? raw.options?.[0]?.priceCents ?? 0;
  return base + u.extras.length * EXTRA_CENTS;
}

export function UsualOrderCard({
  palette,
  usual,
  onReorder,
}: {
  palette: Palette;
  usual: UsualOrder;
  onReorder: (u: UsualOrder) => void;
}) {
  const format = usual.option ? usual.option.split('—')[0].trim() : '';
  const details = [format, ...usual.extras].filter(Boolean).join(' · ');
  const euros = (priceCents(usual) / 100).toFixed(2).replace('.', ',');

  return (
    <div
      style={{
        marginTop: 11,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderRadius: 16,
        background: palette.card,
        border: `1px solid ${palette.line}`,
      }}
    >
      <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: palette.photoBg }}>
        <ProductImage src={usual.product.image} alt={usual.product.name} palette={palette} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: palette.textDim, fontWeight: 600 }}>🔁 Ta commande habituelle</div>
        <div
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 16,
            color: palette.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {usual.product.name}
        </div>
        {details && (
          <div
            style={{
              fontSize: 11.5,
              color: palette.textDim,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {details}
          </div>
        )}
      </div>
      <button
        onClick={() => onReorder(usual)}
        aria-label={`Ajouter ${usual.product.name} au panier`}
        style={{
          flexShrink: 0,
          minHeight: 44,
          padding: '0 14px',
          borderRadius: 12,
          border: 'none',
          background: palette.cta,
          color: palette.ctaText,
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 900,
          fontSize: 14,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        + {euros}€
      </button>
    </div>
  );
}
