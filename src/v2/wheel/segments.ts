// Configuration des segments de la roue cadeau hebdomadaire.
// Weights = poids relatif pour le tirage (total normalisé à 100).

import type { Palette } from '../palette';

export type WheelRewardType =
  | 'discount_percent'
  | 'free_product'
  | 'retry'
  | 'xp_multiplier'
  | 'manual_pickup';

export interface WheelSegment {
  id: string;
  label: string;
  short: string; // version courte affichée sur la roue
  weight: number;
  rewardType: WheelRewardType;
  rewardValue?: string;
  color: (palette: Palette) => string;
  emoji: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: 'discount-5',
    label: '−5% sur ta prochaine commande',
    short: '−5%',
    weight: 30,
    rewardType: 'discount_percent',
    rewardValue: '5',
    color: (p) => p.primary,
    emoji: '💸',
  },
  {
    id: 'tente-encore',
    label: 'Tente encore la semaine prochaine',
    short: 'Tente encore',
    weight: 23,
    rewardType: 'retry',
    color: () => '#6b7280',
    emoji: '🔁',
  },
  {
    id: 'discount-10',
    label: '−10% sur ta prochaine commande',
    short: '−10%',
    weight: 17,
    rewardType: 'discount_percent',
    rewardValue: '10',
    color: (p) => p.glow1,
    emoji: '🔥',
  },
  {
    id: 'xp-x2',
    label: 'Boost XP ×2 pendant 24h',
    short: 'XP ×2',
    weight: 14,
    rewardType: 'xp_multiplier',
    rewardValue: '2',
    color: (p) => p.glow3,
    emoji: '🚀',
  },
  {
    id: 'gaufre-offerte',
    label: 'Gaufre healthy offerte (dès 8€) 🧇',
    short: 'Gaufre offerte',
    weight: 5,
    rewardType: 'free_product',
    rewardValue: 'Gaufre healthy (dès 8€)',
    color: () => '#f97316',
    emoji: '🧇',
  },
  {
    id: 'smoothie-offert',
    label: '2ème smoothie offert (1 acheté = 1 offert)',
    short: 'Smoothie 2e',
    weight: 5,
    rewardType: 'free_product',
    rewardValue: '2e smoothie offert',
    color: (p) => p.accent,
    emoji: '🥤',
  },
  {
    id: 'boost-drink',
    label: 'Boost : 2ème drink XL offert (1 acheté = 1 offert)',
    short: 'Boost 2e',
    weight: 3,
    rewardType: 'free_product',
    rewardValue: '2e drink XL offert',
    color: () => '#0ea5e9',
    emoji: '⚡',
  },
  {
    id: 'goodies',
    label: 'Cadeau surprise au comptoir 🎁',
    short: 'Surprise',
    weight: 3,
    rewardType: 'manual_pickup',
    rewardValue: 'goodies',
    color: () => '#fb7185',
    emoji: '🎁',
  },
];

export const WHEEL_COOLDOWN_DAYS = 7;
export const WHEEL_STORAGE_KEY = 'labase-wheel-last-spin';

/**
 * Tirage pondéré selon les weights. Retourne l'index du segment gagnant.
 */
export function pickWheelSegment(): number {
  const totalWeight = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  const target = Math.random() * totalWeight;
  let acc = 0;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    acc += WHEEL_SEGMENTS[i].weight;
    if (target <= acc) return i;
  }
  return WHEEL_SEGMENTS.length - 1;
}

/**
 * Génère un code promo unique (format LB-XXXX-XXXX).
 */
export function generateRewardCode(): string {
  const r = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, 'X');
  return `LB-${r()}-${r()}`;
}

/**
 * État local de cooldown (1 spin / semaine).
 */
export interface WheelCooldownState {
  canSpin: boolean;
  nextSpinDate: Date | null;
  daysRemaining: number;
}

export function getWheelCooldown(): WheelCooldownState {
  if (typeof window === 'undefined') {
    return { canSpin: true, nextSpinDate: null, daysRemaining: 0 };
  }
  try {
    const raw = window.localStorage.getItem(WHEEL_STORAGE_KEY);
    if (!raw) return { canSpin: true, nextSpinDate: null, daysRemaining: 0 };
    const lastTs = parseInt(raw, 10);
    if (!Number.isFinite(lastTs)) return { canSpin: true, nextSpinDate: null, daysRemaining: 0 };
    const nextDate = new Date(lastTs + WHEEL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const now = Date.now();
    if (nextDate.getTime() <= now) return { canSpin: true, nextSpinDate: null, daysRemaining: 0 };
    const daysRemaining = Math.ceil((nextDate.getTime() - now) / (24 * 60 * 60 * 1000));
    return { canSpin: false, nextSpinDate: nextDate, daysRemaining };
  } catch {
    return { canSpin: true, nextSpinDate: null, daysRemaining: 0 };
  }
}

export function markWheelSpun(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WHEEL_STORAGE_KEY, String(Date.now()));
}
