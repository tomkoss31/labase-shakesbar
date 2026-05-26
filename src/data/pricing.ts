// Compat layer : ré-exporte depuis pricing-catalog.ts qui est le module
// SOURCE DE VÉRITÉ pour les prix (pur, sans imports React/lucide).
//
// Ce fichier existait avant et dérivait depuis menu.ts. Le problème : menu.ts
// importe lucide-react, ce qui plante les serverless functions Vercel
// (FUNCTION_INVOCATION_FAILED). On a donc extrait les arrays de prix dans
// pricing-catalog.ts (pur) et on ré-exporte ici pour préserver la compat.

export {
  productPrices,
  optionPrices,
  comboPrices,
  normalizedProductPrices,
  normalizedOptionPrices,
  normalizedComboPrices,
  normalizeCatalogKey,
} from './pricing-catalog';
