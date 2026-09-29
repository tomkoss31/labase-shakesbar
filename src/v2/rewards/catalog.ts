// Catalogue de récompenses XP — modèle Starbucks/McDo adapté à La Base.
// Paliers PAR TYPE (pas par produit) : "une boisson au choix", pas
// "boisson Snickers". Calé sur la carte tampon actuelle (≈10 visites = 1 boisson).
//
// ⚠️ SOURCE UNIQUE CÔTÉ FRONT. Importée par RewardsModal ET CartDrawerV2 :
//    ne PAS re-hardcoder les paliers ailleurs dans src/.
// ⚠️ Le serveur (api/orders.ts → REWARDS_LIST) garde sa propre copie (isolation
//    serverless / bundling Vercel). Les COÛTS + IDS doivent rester IDENTIQUES
//    entre ce fichier et api/orders.ts, sinon le débit d'XP échoue en silence.

export interface RewardTier {
  id: string;
  cost: number; // XP requis
  emoji: string;
  title: string;
  desc: string;
  short: string; // libellé compact (panier)
  perceivedValue: string; // valeur perçue affichée au client
  // Achats RÉELS minimum au bar pour réclamer ce cadeau (total_orders). Les XP
  // du défi 7 jours, de l'anniversaire, du parrainage ou du coaching (pont
  // « journal nutrition ») ne créent PAS de cadeau gratuit sans clientèle.
  // ⚠️ Garder synchro avec api/orders.ts, api/profile.ts, scanner.html, console.html.
  minOrders: number;
}

export const REWARDS_CATALOG: RewardTier[] = [
  {
    id: 'extra',
    cost: 750,
    minOrders: 0, // supplément sur une boisson achetée : l'achat est implicite
    emoji: '✨',
    title: 'Un extra offert',
    desc: 'Un extra santé au choix (+2,50€) : créatine, protéines, collagène, électrolytes, fibres, probiotiques ou booster immunité.',
    short: 'Un extra santé au choix',
    perceivedValue: '2,50€',
  },
  {
    id: 'boisson',
    cost: 1500,
    minOrders: 3,
    emoji: '🥤',
    title: 'Boisson energy ou smoothie',
    desc: 'Offerte — valable pour l’achat d’une boisson équivalente, le jour même.',
    short: 'Boisson energy ou smoothie offerte',
    perceivedValue: "jusqu'à 8,90€",
  },
  {
    id: 'combo-gaufre',
    cost: 2200,
    minOrders: 6,
    emoji: '🧇',
    title: 'Boisson + gaufre healthy',
    desc: 'Le combo gourmand entièrement offert.',
    short: 'Le combo gourmand offert',
    perceivedValue: '15€',
  },
  {
    id: 'cadeau-mois',
    cost: 3800,
    minOrders: 10,
    emoji: '🎁',
    title: 'Le cadeau du mois',
    desc: 'Une surprise premium réservée aux membres les plus fidèles.',
    short: 'La récompense premium',
    perceivedValue: 'surprise',
  },
];

// Règles de gain XP (affichées au client dans "Comment gagner")
export const XP_RULES: Array<{ emoji: string; label: string; value: string }> = [
  { emoji: '💸', label: 'Chaque euro dépensé', value: '+10 XP' },
  { emoji: '⚡', label: 'Combo (boisson + smoothie)', value: '+25 XP' },
  { emoji: '🔥', label: 'Mardi Double XP', value: '×2' },
  { emoji: '🎂', label: 'Ton anniversaire', value: '+500 XP' },
  { emoji: '🎰', label: 'Roue cadeau hebdomadaire', value: 'bonus' },
];

export const XP_PER_EURO = 10;
export const COMBO_BONUS_XP = 25;

// Retourne le prochain palier non encore atteint EN XP (pour la jauge), ou null si tout atteint
export function nextReward(xp: number): RewardTier | null {
  return REWARDS_CATALOG.find((r) => xp < r.cost) ?? null;
}

// Achats qu'il manque pour réclamer ce cadeau (0 = déjà débloqué côté achats)
export function ordersMissing(tier: RewardTier, orders: number): number {
  return Math.max(0, tier.minOrders - Math.max(0, orders));
}

// Cadeau réclamable = assez d'XP ET assez d'achats
export function isClaimable(tier: RewardTier, xp: number, orders: number): boolean {
  return xp >= tier.cost && ordersMissing(tier, orders) === 0;
}

// Plus beau cadeau réclamable maintenant, ou null
export function bestClaimable(xp: number, orders: number): RewardTier | null {
  return [...REWARDS_CATALOG].reverse().find((r) => isClaimable(r, xp, orders)) ?? null;
}

// Prochain objectif : premier cadeau pas encore réclamable, avec ce qui manque
// (XP et/ou achats). null = tout est réclamable.
export function nextGoal(
  xp: number,
  orders: number,
): { tier: RewardTier; xpMissing: number; ordersMissing: number } | null {
  const tier = REWARDS_CATALOG.find((r) => !isClaimable(r, xp, orders));
  return tier ? { tier, xpMissing: Math.max(0, tier.cost - xp), ordersMissing: ordersMissing(tier, orders) } : null;
}

// Phrase de progression prête à afficher (« Plus que 320 XP pour … » / « Encore 2 achats pour … »)
export function goalText(g: { tier: RewardTier; xpMissing: number; ordersMissing: number }): string {
  if (g.xpMissing > 0 && g.ordersMissing > 0)
    return `${g.xpMissing} XP et ${g.ordersMissing} achat${g.ordersMissing > 1 ? 's' : ''} pour`;
  if (g.xpMissing > 0) return `${g.xpMissing} XP pour`;
  return `${g.ordersMissing} achat${g.ordersMissing > 1 ? 's' : ''} au bar pour débloquer`;
}
