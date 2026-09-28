// Image produit avec fallback gradient si pas d'image
import React, { useState } from 'react';
import type { Palette } from './palette';

interface ProductImageProps {
  src?: string;
  alt: string;
  palette: Palette;
  size?: number;
  rounded?: boolean;
}

// Reflet de chargement (une seule feuille de style pour toute l'app)
const SHIMMER_CSS =
  '@keyframes lbShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}' +
  '@media (prefers-reduced-motion: reduce){.lb-shimmer{animation:none!important}}';
function ensureShimmerCss() {
  if (typeof document === 'undefined' || document.getElementById('lb-shimmer-css')) return;
  const el = document.createElement('style');
  el.id = 'lb-shimmer-css';
  el.textContent = SHIMMER_CSS;
  document.head.appendChild(el);
}

export function ProductImage({ src, alt, palette, size = 100, rounded = false }: ProductImageProps) {
  const [errored, setErrored] = useState(false);
  // Tant que la photo charge : reflet discret, puis apparition en fondu
  // (avant : carré sombre vide pendant le chargement).
  const [loaded, setLoaded] = useState(false);
  ensureShimmerCss();
  // Les photos sont servies en WebP (~40 Ko au lieu de ~2 Mo). Si le WebP ne
  // se charge pas (très vieux téléphone), on retente une fois avec le PNG
  // d'origine, toujours présent à côté.
  const [pngFallback, setPngFallback] = useState(false);
  const displaySrc = pngFallback && src ? src.replace(/\.webp$/, '.png') : src;

  if (!src || errored) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, ${palette.primary}33, transparent 70%), ${palette.bgSoft}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: palette.textDim,
          fontSize: 10,
          fontWeight: 700,
          textAlign: 'center',
          padding: 8,
          borderRadius: rounded ? '50%' : 0,
        }}
      >
        {alt}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '12%',
            borderRadius: 16,
            overflow: 'hidden',
            background: `radial-gradient(circle at 50% 55%, ${palette.primary}22, transparent 70%)`,
          }}
        >
          <div
            className="lb-shimmer"
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(100deg, transparent 20%, ${palette.text}14 50%, transparent 80%)`,
              animation: 'lbShimmer 1.3s ease-in-out infinite',
            }}
          />
        </div>
      )}
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!pngFallback && src.endsWith('.webp')) setPngFallback(true);
          else setErrored(true);
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          filter: `drop-shadow(0 8px 22px ${palette.primary}44)`,
          opacity: loaded ? 1 : 0,
          transition: 'opacity .35s ease',
        }}
      />
    </div>
  );
}