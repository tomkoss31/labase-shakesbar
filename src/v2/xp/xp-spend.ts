// Règles de conversion XP → € pour le checkout
// 100 XP = 1€ de réduction
// Plafond : 30% du total de la commande payable en XP

export const XP_PER_EURO = 100;
export const XP_SPEND_STEP = 100; // on dépense par tranches de 100 XP
export const XP_MAX_PCT_OF_TOTAL = 30;

/**
 * Calcule le nombre max d'XP utilisables sur une commande.
 * Limité par : ce que le user a en stock, le plafond 30%, et l'arrondi step.
 */
export function maxSpendableXp(userXp: number, cartTotalCents: number): number {
  const cap = Math.floor((cartTotalCents * XP_MAX_PCT_OF_TOTAL) / 100); // cents
  const capInXp = cap * (XP_PER_EURO / 100); // capInCents → XP : 1 cent = 1 XP
  const usable = Math.min(userXp, capInXp);
  return Math.floor(usable / XP_SPEND_STEP) * XP_SPEND_STEP;
}

/**
 * Convertit un nombre d'XP en cents de réduction.
 */
export function xpToCents(xp: number): number {
  return Math.round((xp / XP_PER_EURO) * 100);
}
