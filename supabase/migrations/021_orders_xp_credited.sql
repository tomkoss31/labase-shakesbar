-- ════════════════════════════════════════════════════════════════════
-- SÉCURITÉ — Chantier 1.4 : idempotence du crédit XP (webhook Square)
-- payment.created + payment.updated peuvent arriver en parallèle pour la même
-- commande → double crédit XP. On ajoute un drapeau claimé ATOMIQUEMENT :
-- le crédit n'est appliqué que par l'appel qui bascule xp_credited false→true.
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS xp_credited boolean NOT NULL DEFAULT false;
