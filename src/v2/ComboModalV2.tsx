// Fenêtre « Composer ma formule combo » (style V2, sans Tailwind ni framer-motion).
// Remplace l'ancienne version : 21 + 16 boutons empilés et bouton « Ajouter »
// tout en bas après ~2 500 px de défilement. Ici : vignettes photo dans une
// rangée à faire glisser, formats en pastilles, bouton d'ajout toujours visible.
import React from 'react';
import type { Palette } from './palette';
import type { ComboOffer, ComboSelectionConfig } from '../data/menu';
import type { SelectedProduct } from '../data/product-helpers';
import { ProductImage } from './ProductImage';
import { useModalA11y } from './useModalA11y';

interface StepProps {
  palette: Palette;
  config: ComboSelectionConfig;
  candidates: SelectedProduct[];
  selectedName: string;
  onSelect: (name: string) => void;
  product: SelectedProduct | undefined;
  option: string;
  onOption: (label: string) => void;
}

function euro(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

function Step({ palette, config, candidates, selectedName, onSelect, product, option, onOption }: StepProps) {
  const chooseProduct = candidates.length > 1 && !config.fixedProductName;
  const chooseOption = !!product?.options?.length && !config.fixedOptionLabel;
  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 17, color: palette.text }}>
          {config.label}
        </div>
        {selectedName && (
          <div style={{ fontSize: 12, color: palette.primary, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ {selectedName}</div>
        )}
      </div>

      {chooseProduct ? (
        <div
          className="no-scrollbar"
          role="radiogroup"
          aria-label={config.label}
          style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -20px', padding: '2px 20px 6px', scrollbarWidth: 'none' }}
        >
          {candidates.map((p) => {
            const active = p.name === selectedName;
            return (
              <button
                key={p.name}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(p.name)}
                style={{
                  flexShrink: 0,
                  width: 98,
                  padding: 6,
                  borderRadius: 16,
                  border: `2px solid ${active ? palette.accent : palette.line}`,
                  background: active ? `${palette.accent}1c` : palette.bgSoft,
                  color: palette.text,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                }}
              >
                <div style={{ height: 74, borderRadius: 11, overflow: 'hidden', background: palette.photoBg }}>
                  <ProductImage src={p.image} alt={p.name} palette={palette} />
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    minHeight: 29,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        product && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderRadius: 14,
              border: `1px solid ${palette.line}`,
              background: palette.bgSoft,
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: palette.photoBg, flexShrink: 0 }}>
              <ProductImage src={product.image} alt={product.name} palette={palette} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{product.name}</span>
          </div>
        )
      )}

      {chooseOption && product?.options && (
        <div role="radiogroup" aria-label="Format" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {product.options.map((opt) => {
            const active = opt.label === option;
            return (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onOption(opt.label)}
                style={{
                  minHeight: 40,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: `1.5px solid ${active ? palette.accent : palette.line}`,
                  background: active ? palette.accent : 'transparent',
                  color: active ? palette.ctaText : palette.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {config.fixedOptionLabel && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: palette.textDim }}>Format : {config.fixedOptionLabel}</div>
      )}
    </section>
  );
}

export interface ComboModalV2Props {
  palette: Palette;
  combo: ComboOffer | null;
  onClose: () => void;
  onAdd: () => void;
  primaryCandidates: SelectedProduct[];
  secondaryCandidates: SelectedProduct[];
  primaryName: string;
  secondaryName: string;
  onPrimaryChange: (name: string) => void;
  onSecondaryChange: (name: string) => void;
  primaryProduct: SelectedProduct | undefined;
  secondaryProduct: SelectedProduct | undefined;
  primaryOption: string;
  secondaryOption: string;
  onPrimaryOption: (label: string) => void;
  onSecondaryOption: (label: string) => void;
}

export function ComboModalV2(props: ComboModalV2Props) {
  const { palette, combo, onClose, onAdd } = props;
  const dialogRef = useModalA11y<HTMLDivElement>(!!combo, onClose);
  if (!combo) return null;
  const ready = !!props.primaryName && !!props.secondaryName;
  const saving = combo.normalPriceCents - combo.priceCents;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Composer ${combo.name}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '94dvh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '28px 28px 0 0',
          background: `linear-gradient(180deg, ${palette.cardHi}, ${palette.card})`,
          border: `1px solid ${palette.line}`,
          color: palette.text,
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          <div
            style={{
              position: 'relative',
              margin: '0 -20px',
              height: 'min(56vw, 250px)',
              background: `radial-gradient(circle at 50% 50%, ${palette.primary}33, transparent 70%), ${palette.photoBg}`,
            }}
          >
            <ProductImage src={combo.image} alt={combo.name} palette={palette} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: `1px solid ${palette.line}`,
                background: 'rgba(0,0,0,.45)',
                color: palette.text,
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 999,
              background: palette.accent,
              color: palette.ctaText,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            Formule combo · −{euro(saving)}
          </div>
          <h2
            style={{
              margin: '8px 0 4px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: '-.02em',
            }}
          >
            {combo.name}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: palette.textDim, lineHeight: 1.45 }}>{combo.description}</p>

          <Step
            palette={palette}
            config={combo.primary}
            candidates={props.primaryCandidates}
            selectedName={props.primaryName}
            onSelect={props.onPrimaryChange}
            product={props.primaryProduct}
            option={props.primaryOption}
            onOption={props.onPrimaryOption}
          />
          <Step
            palette={palette}
            config={combo.secondary}
            candidates={props.secondaryCandidates}
            selectedName={props.secondaryName}
            onSelect={props.onSecondaryChange}
            product={props.secondaryProduct}
            option={props.secondaryOption}
            onOption={props.onSecondaryOption}
          />
        </div>

        {/* Bouton d'ajout toujours visible */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${palette.line}`,
            background: palette.card,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: palette.textDim,
              marginBottom: 8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ready ? `${props.primaryName} + ${props.secondaryName}` : 'Choisis tes deux produits'}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={!ready}
            style={{
              width: '100%',
              minHeight: 54,
              borderRadius: 16,
              border: 'none',
              background: palette.cta,
              color: palette.ctaText,
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 900,
              fontSize: 17,
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
            }}
          >
            <span>Ajouter la formule</span>
            <span>{euro(combo.priceCents)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
