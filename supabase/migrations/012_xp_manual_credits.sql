-- ════════════════════════════════════════════════════════════════════
-- Migration 012 — Crédits XP manuels (migration carte fidélité papier)
--
-- Quand on bascule un client de la carte papier vers l'app, on doit
-- pouvoir lui créditer N XP correspondant à ses points papier sans
-- créer de fausse commande (ça polluerait CA + nombre de commandes).
--
-- Table dédiée pour avoir l'historique propre + une raison libre
-- (ex: "Carte papier 230 points · client depuis avril 2024").
--
-- À jouer dans Supabase SQL Editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.xp_manual_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  xp_added integer NOT NULL CHECK (xp_added > 0),
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'console_admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_manual_credits_user_idx
  ON public.xp_manual_credits (user_id);
CREATE INDEX IF NOT EXISTS xp_manual_credits_created_idx
  ON public.xp_manual_credits (created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- Migration 012b — Traçabilité code promo utilisé
--
-- On veut savoir DANS QUELLE COMMANDE un code promo a été consommé,
-- pour pouvoir reverser si la commande est annulée plus tard.
-- Nullable (anciens codes utilisés avant cette migration n'ont pas l'info).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.wheel_spins
  ADD COLUMN IF NOT EXISTS used_in_order_id uuid REFERENCES public.orders ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS wheel_spins_used_in_order_idx
  ON public.wheel_spins (used_in_order_id)
  WHERE used_in_order_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- Crédits depuis la console : insert ici + update profiles.xp.
-- Ne touche PAS total_orders ni total_spent_cents (c'est pas une vente).
-- Codes promo : used_at + used_in_order_id set par l'API credit-manual.
-- ════════════════════════════════════════════════════════════════════
