// Animation signature : gouttelette qui s'envole du bouton + vers le panier
// + petites gouttelettes en éclaboussure au point de départ
// Inspiré du design Claude (v2/app.jsx — FlyingDrop & Droplets)
import React, { useEffect, useRef, useState } from 'react';
import type { Palette } from './palette';

export interface FlyEvent {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}

interface FlyingDropProps {
  palette: Palette;
  fly: FlyEvent;
  onDone: () => void;
}

export function FlyingDrop({ palette, fly, onDone }: FlyingDropProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { from, to } = fly;
    el.animate(
      [
        {
          transform: `translate(${from.x}px, ${from.y}px) scale(1) rotate(0deg)`,
          opacity: 1,
        },
        {
          transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(from.y, to.y) - 80}px) scale(.65) rotate(180deg)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(${to.x}px, ${to.y}px) scale(.15) rotate(360deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 700,
        easing: 'cubic-bezier(.5,.0,.55,1)',
        fill: 'forwards',
      },
    );
    const t = window.setTimeout(onDone, 720);
    return () => window.clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        pointerEvents: 'none',
        zIndex: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${fly.color}, ${palette.primaryDeep})`,
        boxShadow: `0 0 24px ${fly.color}aa`,
      }}
    />
  );
}

interface DropletsProps {
  x: number;
  y: number;
  color: string;
}

export function Droplets({ x, y, color }: DropletsProps) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 700);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;

  const drops = [
    { a: -60, d: 50 },
    { a: -30, d: 55 },
    { a: 0, d: 45 },
    { a: 30, d: 55 },
    { a: 60, d: 50 },
    { a: -45, d: 35 },
    { a: 45, d: 35 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 99,
      }}
    >
      {drops.map((d, i) => {
        const dx = Math.sin((d.a * Math.PI) / 180) * d.d;
        const dy = -Math.cos((d.a * Math.PI) / 180) * d.d;
        const keyframeName = `dropFly-${i}-${Math.random().toString(36).slice(2, 7)}`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 6 + (i % 3) * 2,
              height: 6 + (i % 3) * 2,
              borderRadius: '50%',
              background: color,
              opacity: 0.9,
              animation: `${keyframeName} .65s cubic-bezier(.3,0,.55,1) forwards`,
            }}
          >
            <style>{`@keyframes ${keyframeName} { from { transform: translate(0,0) scale(1); opacity: 1; } to { transform: translate(${dx}px, ${dy}px) scale(.2); opacity: 0; } }`}</style>
          </div>
        );
      })}
    </div>
  );
}

// Hook utilitaire : gère un fly + droplets actifs
export function useFlyAnimation(palette: Palette) {
  const [fly, setFly] = useState<FlyEvent | null>(null);
  const [droplets, setDroplets] = useState<DropletsProps | null>(null);

  function trigger(from: HTMLElement, color: string = palette.primary) {
    const cartEl = document.querySelector('[data-v2-cart-icon]') as HTMLElement | null;
    if (!cartEl) return;
    const fromRect = from.getBoundingClientRect();
    const toRect = cartEl.getBoundingClientRect();
    const fromX = fromRect.left + fromRect.width / 2 - 20;
    const fromY = fromRect.top + fromRect.height / 2 - 20;
    const toX = toRect.left + toRect.width / 2 - 20;
    const toY = toRect.top + toRect.height / 2 - 20;
    setFly({ from: { x: fromX, y: fromY }, to: { x: toX, y: toY }, color });
    setDroplets({ x: fromX + 8, y: fromY + 8, color });
  }

  const overlay = (
    <>
      {fly && <FlyingDrop palette={palette} fly={fly} onDone={() => setFly(null)} />}
      {droplets && <Droplets {...droplets} />}
    </>
  );

  return { overlay, trigger };
}

// Helper : déterminer la couleur d'éclaboussure à partir d'une catégorie
export function colorForCategory(categoryId: string, palette: Palette): string {
  switch (categoryId) {
    case 'smoothies':
      return palette.accent; // ambre
    case 'drinks':
      return '#0ea5e9'; // cyan énergisant
    case 'hot':
      return '#a16207'; // brun café
    case 'health':
      return '#22c55e'; // vert santé
    case 'waffles':
      return '#f97316'; // orange gaufre
    case 'kids':
      return '#d946ef'; // fuchsia ludique
    case 'sports':
      return '#10b981'; // emerald sport
    default:
      return palette.primary; // teal par défaut (combos, etc.)
  }
}

// Couleur signature par produit (sinon fallback sur la catégorie)
// Inspirée du designer Claude : chaque produit a son halo iconique.
const PRODUCT_COLORS: Record<string, string> = {
  // Smoothies
  'Casse Noisette': '#92400e',
  Cappuccino: '#7c2d12',
  'Pina Colada': '#fbbf24',
  'Fraise bonbon': '#ec4899',
  "Pim's": '#be123c',
  'Tarte à la pomme': '#84cc16',
  Snickers: '#a16207',
  'Full Oréo': '#1f2937',
  Speculoos: '#b45309',
  'Banana Split': '#fde047',
  'Banana Noisette': '#ca8a04',
  Cookies: '#52525b',
  Tropical: '#f97316',
  // Drinks énergisants
  'Electric Blue': '#0ea5e9',
  Pomelon: '#84cc16',
  'Tonic Mandarine': '#f97316',
  'Apple Kiss': '#22c55e',
  Soleil: '#facc15',
  'Black Panther': '#1e3a8a',
  "L'Exotic": '#ec4899',
  "T'Coco": '#f59e0b',
  Elf: '#22d3ee',
  Perroquet: '#fb7185',
  'La vie en Rose': '#ec4899',
  'Sortilège noir': '#581c87',
  // Santé
  "Hydrat'Max": '#f97316',
  'Casse Grippe': '#dc2626',
  'Limonade Rose': '#ec4899',
  "Di'geste": '#22c55e',
  // Enfants
  'Bulle de Fée': '#fb7185',
  Spiderman: '#dc2626',
  Stitch: '#06b6d4',
  Licorne: '#a855f7',
  Hulk: '#84cc16',
  Tropicool: '#22c55e',
  // Hot
  'Café chaud': '#78350f',
  'Thé Aloé Vera chaud': '#65a30d',
  'Chocolat chaud protéiné': '#7c2d12',
  'Café gourmet glacé': '#a16207',
  'Café glacé simple': '#92400e',
  // Sportifs
  "Electro'Lyte": '#06b6d4',
  'Post Workout': '#7c2d12',
  // Gaufre
  'Gaufre healthy': '#f97316',
};

export function colorForProduct(name: string, categoryId: string, palette: Palette): string {
  return PRODUCT_COLORS[name] ?? colorForCategory(categoryId, palette);
}
