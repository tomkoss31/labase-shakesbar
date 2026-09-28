// Couleur dominante d'une photo produit (ex. vert du Phénix, jaune du Bali),
// calculée dans le navigateur sur une miniature 24×24. Les photos ont un fond
// noir : on ignore les pixels sombres, gris ou blancs pour garder la teinte de
// la boisson. Résultat mis en cache par image.
import { useEffect, useState } from 'react';

const cache = new Map<string, string | null>();

function dominantColor(img: HTMLImageElement): string | null {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let r = 0, g = 0, b = 0, weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i], pg = data[i + 1], pb = data[i + 2], a = data[i + 3];
    if (a < 200) continue;
    const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
    const light = (max + min) / 2;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (light < 45 || light > 235 || sat < 0.25) continue; // fond noir, reflets, gris
    const w = sat * sat; // les pixels bien colorés comptent plus
    r += pr * w; g += pg * w; b += pb * w; weight += w;
  }
  if (weight < 1) return null;
  const hex = (v: number) => Math.round(v / weight).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function useImageColor(src?: string): string | null {
  const [color, setColor] = useState<string | null>(() => (src ? cache.get(src) ?? null : null));
  useEffect(() => {
    if (!src) return;
    if (cache.has(src)) {
      setColor(cache.get(src) ?? null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      let c: string | null = null;
      try {
        c = dominantColor(img);
      } catch {
        c = null; // image d'un autre domaine (canvas protégé) : on garde la couleur par défaut
      }
      cache.set(src, c);
      if (!cancelled) setColor(c);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return color;
}
