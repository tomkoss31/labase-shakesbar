// Types liés à l'auth et au profil utilisateur

export type VipTier = 'starter' | 'regulier' | 'vip' | 'elite' | 'legende';
export type MascotteLevel = 'apprenti' | 'regulier' | 'pro';

export interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  birthday: string | null;
  total_spent_cents: number;
  total_orders: number;
  vip_tier: VipTier;
  xp: number;
  level: MascotteLevel;
  last_spin_at: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

// XP nécessaire pour chaque palier
export const XP_THRESHOLDS = {
  apprenti: 0,
  regulier: 500,
  pro: 1500,
} as const;

// Avantages VIP par palier financier (€ cumulés)
export const VIP_TIERS = [
  { id: 'starter', label: 'Starter', minSpentCents: 0, discount: 0 },
  { id: 'regulier', label: 'Régulier', minSpentCents: 5000, discount: 5 },
  { id: 'vip', label: 'VIP', minSpentCents: 15000, discount: 10 },
  { id: 'elite', label: 'Élite', minSpentCents: 40000, discount: 15 },
  { id: 'legende', label: 'Légende', minSpentCents: 80000, discount: 15 },
] as const;

export function computeMascotteLevel(xp: number): MascotteLevel {
  if (xp >= XP_THRESHOLDS.pro) return 'pro';
  if (xp >= XP_THRESHOLDS.regulier) return 'regulier';
  return 'apprenti';
}

export function nextLevelThreshold(xp: number): { name: string; xp: number } {
  if (xp < XP_THRESHOLDS.regulier) return { name: 'Régulier', xp: XP_THRESHOLDS.regulier };
  if (xp < XP_THRESHOLDS.pro) return { name: 'Pro', xp: XP_THRESHOLDS.pro };
  return { name: 'Pro', xp: XP_THRESHOLDS.pro };
}
