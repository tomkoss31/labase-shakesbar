-- ════════════════════════════════════════════════════════════════════
-- Migration 010 — Défis hebdomadaires (challenges)
-- Suivi des défis RÉCLAMÉS pour éviter le double crédit. Les défis eux-mêmes
-- sont définis dans le code (api/orders.ts). 1 réclamation max par (user,
-- défi, semaine) grâce à la contrainte unique.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.challenge_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id text NOT NULL,
  week_start date NOT NULL,            -- lundi de la semaine concernée
  xp_awarded int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_claims_unique UNIQUE (user_id, challenge_id, week_start)
);

CREATE INDEX IF NOT EXISTS challenge_claims_user_idx
  ON public.challenge_claims (user_id, week_start);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
