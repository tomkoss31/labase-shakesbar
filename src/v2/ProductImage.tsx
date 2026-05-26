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

export function ProductImage({ src, alt, palette, size = 100, rounded = false }: ProductImageProps) {
  const [errored, setErrored] = useState(false);

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
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        filter: `drop-shadow(0 8px 22px ${palette.primary}44)`,
      }}
    />
  );
}
