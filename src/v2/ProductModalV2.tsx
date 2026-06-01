// Modale produit V2 — palette Teal × Ambre
// Sections : image hero, options, EXTRAS (+2,50€), UPSELL combo, CTA sticky bas
import React, { useEffect, useMemo, useState } from 'react';
import type { Palette } from './palette';
import { ProductImage } from './ProductImage';
import type { Product, ProductExtra, ComboOffer } from '../data/menu';
import { EXTRAS, CATEGORIES_WITH_EXTRAS, comboOffers } from '../data/menu';
import { colorForProduct } from './FlyAnimation';

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
  onAdd: (selectedExtras: string[]) => void;
  initialExtras?: string[];
  editing?: boolean;
  getPrice: (p: SelectedProduct) => number;
  optionSectionLabel: (p: SelectedProduct) => string;
  onOpenCombo?: (combo: ComboOffer, presetProductName?: string) => void;
}

function fmtEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

// Détermine quels combos suggérer comme upsell selon la catégorie du produit
function getRelevantCombos(categoryId: string): ComboOffer[] {
  if (categoryId === 'smoothies') {
    return comboOffers.filter((c) => c.id === 'combo-medium' || c.id === 'combo-power');
  }
  if (categoryId === 'drinks') {
    return comboOffers.filter((c) => c.id === 'combo-medium' || c.id === 'combo-power');
  }
  if (categoryId === 'hot') {
    return comboOffers.filter((c) =>
      ['combo-tea-time', 'combo-coffee-break', 'combo-choco-cocoon', 'combo-gourmet-break'].includes(c.id),
    );
  }
  return [];
}

export function ProductModalV2({
  palette,
  open,
  product,
  selectedOption,
  setSelectedOption,
  onClose,
  onAdd,
  initialExtras,
  editing,
  getPrice,
  optionSectionLabel,
  onOpenCombo,
}: ProductModalV2Props) {
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Reset extras quand on change de produit (ou pré-remplit en mode édition)
  useEffect(() => {
    setSelectedExtras(initialExtras ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.name]);

  if (!open || !product) return null;

  const basePriceCents = getPrice(product);
  const acceptsExtras = CATEGORIES_WITH_EXTRAS.includes(product.categoryId);
  const extrasTotal = selectedExtras.reduce((sum, label) => {
    const e = EXTRAS.find((x) => x.label === label);
    return sum + (e?.priceCents ?? 0);
  }, 0);
  const totalCents = basePriceCents + extrasTotal;

  const relevantCombos = getRelevantCombos(product.categoryId);
  const productColor = colorForProduct(product.name, product.categoryId, palette);

  function toggleExtra(label: string) {
    setSelectedExtras((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  }

  function handleAdd() {
    onAdd(selectedExtras);
  }

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
        {/* Close header */}
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

        {/* Scroll content */}
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
              height: 240,
              background: `radial-gradient(circle at 50% 50%, ${productColor}44, ${productColor}11 45%, transparent 75%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              padding: 20,
            }}
          >
            <ProductImage src={product.image} alt={product.name} palette={palette} />
          </div>

          {/* Badges */}
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
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

          {/* EXTRAS santé +2,50€ */}
          {acceptsExtras && (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: palette.accent,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  💪 Boost ta commande
                </div>
                <div style={{ fontSize: 11, color: palette.textDim }}>+2,50€ chacun</div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 6,
                }}
              >
                {EXTRAS.map((extra) => {
                  const active = selectedExtras.includes(extra.label);
                  return (
                    <button
                      key={extra.id}
                      onClick={() => toggleExtra(extra.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 12px',
                        background: active ? palette.accent + '20' : palette.bg,
                        border: `1.5px solid ${active ? palette.accent : palette.line}`,
                        borderRadius: 12,
                        color: palette.text,
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: `1.5px solid ${active ? palette.accent : palette.line}`,
                          background: active ? palette.accent : 'transparent',
                          color: palette.ctaText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {active ? '✓' : ''}
                      </span>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {extra.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* UPSELL combo */}
          {relevantCombos.length > 0 && onOpenCombo && (
            <div style={{ marginTop: 24 }}>
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
                ⚡ Passe en combo & économise
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {relevantCombos.map((combo) => (
                  <button
                    key={combo.id}
                    onClick={() => onOpenCombo(combo, product.name)}
                    style={{
                      background: `linear-gradient(135deg, ${palette.card}, ${palette.cardHi})`,
                      border: `1px solid ${palette.primary}55`,
                      borderRadius: 14,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      color: palette.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        {combo.name}
                      </div>
                      <div style={{ fontSize: 11, color: palette.textDim, marginTop: 2 }}>
                        {combo.subtitle}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 900,
                          fontSize: 14,
                          color: palette.text,
                        }}
                      >
                        {fmtEuro(combo.priceCents)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: palette.accent,
                          marginTop: 2,
                        }}
                      >
                        −{fmtEuro(combo.normalPriceCents - combo.priceCents)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!product.options?.length && product.basePriceCents && (
            <div style={{ marginTop: 16, fontSize: 13, color: palette.textDim }}>
              Format unique • {fmtEuro(product.basePriceCents)}
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
          {selectedExtras.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: palette.textDim,
                marginBottom: 8,
                textAlign: 'right',
              }}
            >
              Base {fmtEuro(basePriceCents)} + {selectedExtras.length} extra
              {selectedExtras.length > 1 ? 's' : ''} {fmtEuro(extrasTotal)}
            </div>
          )}
          <button
            onClick={handleAdd}
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
            <span>{editing ? 'Mettre à jour' : 'Ajouter au panier'}</span>
            <span>{fmtEuro(totalCents)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
