// Modale produit V2 — palette Teal × Ambre, sticky CTA bas
import React from 'react';
import type { Palette } from './palette';
import { ProductImage } from './ProductImage';
import type { Product } from '../data/menu';

type SelectedProduct = Product & {
  categoryId: string;
  categoryName: string;
  categoryAccent: string;
  categoryPriceLabel: string;
};

interface ProductModalV2Props {
  palette: Palette;
  open: boolean;
  product: SelectedProduct | null;
  selectedOption: string;
  setSelectedOption: (label: string) => void;
  onClose: () => void;
  onAdd: () => void;
  getPrice: (p: SelectedProduct) => number; // en centimes
  optionSectionLabel: (p: SelectedProduct) => string;
}

function fmtEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

export function ProductModalV2({
  palette,
  open,
  product,
  selectedOption,
  setSelectedOption,
  onClose,
  onAdd,
  getPrice,
  optionSectionLabel,
}: ProductModalV2Props) {
  if (!open || !product) return null;

  const priceCents = getPrice(product);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, .82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '94vh',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: 'hidden',
          color: palette.text,
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header sticky avec close */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            padding: 12,
            background: `linear-gradient(180deg, ${palette.cardHi}, transparent)`,
            zIndex: 2,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0,0,0,.4)',
              border: `1px solid ${palette.line}`,
              color: palette.text,
              cursor: 'pointer',
              fontSize: 18,
              backdropFilter: 'blur(8px)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 20px',
            paddingBottom: 110,
          }}
        >
          {/* Image hero */}
          <div
            style={{
              marginTop: -40,
              height: 260,
              background: `radial-gradient(circle at 50% 50%, ${palette.primary}22, transparent 70%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              padding: 20,
            }}
          >
            <ProductImage src={product.image} alt={product.name} palette={palette} />
          </div>

          {/* Badge catégorie */}
          <div style={{ marginTop: 10 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: palette.bg,
                color: palette.primary,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                borderRadius: 999,
                border: `1px solid ${palette.line}`,
              }}
            >
              {product.categoryName}
            </span>
            {product.badge && (
              <span
                style={{
                  marginLeft: 6,
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: palette.accent,
                  color: palette.ctaText,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  borderRadius: 999,
                }}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Nom + description */}
          <h2
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 30,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              margin: '12px 0 8px',
            }}
          >
            {product.name}
          </h2>

          {product.description && (
            <p style={{ color: palette.textDim, fontSize: 14, lineHeight: 1.55, margin: '0 0 12px' }}>
              {product.description}
            </p>
          )}

          {product.flavors && (
            <div
              style={{
                background: palette.bg,
                border: `1px solid ${palette.line}`,
                borderRadius: 14,
                padding: 14,
                fontSize: 12.5,
                color: palette.textDim,
                lineHeight: 1.5,
              }}
            >
              {product.flavors}
            </div>
          )}

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: palette.primary,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {optionSectionLabel(product)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.options.map((opt) => {
                  const active = selectedOption === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedOption(opt.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: active ? palette.primary + '15' : palette.bg,
                        border: `2px solid ${active ? palette.primary : palette.line}`,
                        borderRadius: 14,
                        color: palette.text,
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      <span>{opt.label}</span>
                      <span
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 900,
                          fontSize: 14,
                          color: active ? palette.primary : palette.textDim,
                        }}
                      >
                        {fmtEuro(opt.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!product.options?.length && product.basePriceCents && (
            <div style={{ marginTop: 16, fontSize: 14, color: palette.textDim }}>
              Format unique
            </div>
          )}
        </div>

        {/* CTA sticky bas */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: `linear-gradient(180deg, transparent, ${palette.card} 25%)`,
            padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <button
            onClick={onAdd}
            disabled={product.options?.length ? !selectedOption : false}
            style={{
              width: '100%',
              padding: '16px',
              background: palette.cta,
              color: palette.ctaText,
              border: 0,
              borderRadius: 16,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              boxShadow: `0 12px 32px ${palette.cta}55`,
              opacity: product.options?.length && !selectedOption ? 0.4 : 1,
              transition: 'opacity .2s, transform .15s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>Ajouter au panier</span>
            <span>{fmtEuro(priceCents)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
