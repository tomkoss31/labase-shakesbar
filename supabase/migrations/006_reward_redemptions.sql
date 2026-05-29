-- ════════════════════════════════════════════════════════════════════
-- Migration 006 — Journal des cadeaux offerts via XP
-- Permet à Tom de suivre le STOCK consommé en cadeaux (séparé du CA Square).
-- À jouer dans Supabase SQL Editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  reward_id text NOT NULL,        -- 'topping' | 'boisson' | 'combo-gaufre' | 'cadeau-mois'
  reward_label text NOT NULL,     -- libellé lisible
  xp_cost integer NOT NULL,       -- XP déduits
  source text NOT NULL DEFAULT 'comptoir', -- 'comptoir' | 'panier'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reward_redemptions_created_idx
  ON public.reward_redemptions (created_at DESC);
CREATE INDEX IF NOT EXISTS reward_redemptions_user_idx
  ON public.reward_redemptions (user_id);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- Chaque cadeau offert (au comptoir ou via le panier) crée une ligne ici.
-- La console admin affiche le récap (compteurs par type, jour / mois).
-- ════════════════════════════════════════════════════════════════════
