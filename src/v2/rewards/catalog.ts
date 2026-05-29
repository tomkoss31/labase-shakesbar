// Catalogue de récompenses XP — modèle Starbucks/McDo adapté à La Base.
// Paliers PAR TYPE (pas par produit) : "une boisson au choix", pas
// "boisson Snickers". Calé sur la carte tampon actuelle (≈10 visites = 1 boisson).

export interface RewardTier {
  id: string;
  cost: number; // XP requis
  emoji: string;
  title: string;
  desc: string;
  perceivedValue: string; // valeur perçue affichée au client
}

export const REWARDS_CATALOG: RewardTier[] = [
  {
    id: 'topping',
    cost: 250,
    emoji: '✨',
    title: 'Topping offert',
    desc: 'Protéine, créatine ou beurre de cacahuète au choix sur ta boisson',
    perceivedValue: 'offert',
  },
  {
    id: 'boisson',
    cost: 800,
    emoji: '🥤',
    title: 'Une boisson au choix',
    desc: 'Smoothie ou shake, petite ou grande — la boisson que tu veux',
    perceivedValue: "jusqu'à 8,90€",
  },
  {
    id: 'combo-gaufre',
    cost: 1500,
    emoji: '🧇',
    title: 'Boisson + gaufre healthy',
    desc: 'Le combo gourmand entièrement offert',
    perceivedValue: '15€',
  },
  {
    id: 'cadeau-mois',
    cost: 2500,
    emoji: '🎁',
    title: 'Le cadeau du mois',
    desc: 'Une surprise premium réservée aux membres les plus fidèles',
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
