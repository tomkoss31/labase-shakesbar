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
}

export const REWARDS_CATALOG: RewardTier[] = [
  {
    id: 'extra',
    cost: 750,
    emoji: '✨',
    title: 'Un extra offert',
    desc: 'Un extra santé au choix (+2,50€) : créatine, protéines, collagène, électrolytes, fibres, probiotiques ou booster immunité.',
    short: 'Un extra santé au choix',
    perceivedValue: '2,50€',
  },
  {
    id: 'boisson',
    cost: 1500,
    emoji: '🥤',
    title: 'Boisson energy ou smoothie',
    desc: 'Offerte — valable pour l’achat d’une boisson équivalente, le jour même.',
    short: 'Boisson energy ou smoothie offerte',
    perceivedValue: "jusqu'à 8,90€",
  },
  {
    id: 'combo-gaufre',
    cost: 2200,
    emoji: '🧇',
    title: 'Boisson + gaufre healthy',
    desc: 'Le combo gourmand entièrement offert.',
    short: 'Le combo gourmand offert',
    perceivedValue: '15€',
  },
  {
    id: 'cadeau-mois',
    cost: 3800,
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

// Retourne le prochain palier non encore atteint (pour la jauge), ou null si tout débloqué
export function nextReward(xp: number): RewardTier | null {
  return REWARDS_CATALOG.find((r) => xp < r.cost) ?? null;
}
