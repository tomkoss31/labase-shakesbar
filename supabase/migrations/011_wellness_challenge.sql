-- ════════════════════════════════════════════════════════════════════
-- Migration 011 — Défi bien-être 7 jours (C2 — pont vers le coaching)
-- Parcours indulgent : 1 validation par jour calendaire, pas de pénalité si
-- on saute un jour. À la 7e validation → bonus XP + déblocage "Bilan offert".
-- 1 ligne par utilisateur (1 parcours à la fois).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wellness_challenge (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_on date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Paris')::date,
  count int NOT NULL DEFAULT 0,        -- nb de missions validées (0..7)
  last_checkin date,                   -- dernière validation (1 par jour calendaire)
  completed_at timestamptz,            -- date de complétion (7/7)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compteur communautaire : participants par date de démarrage
CREATE INDEX IF NOT EXISTS wellness_started_idx
  ON public.wellness_challenge (started_on);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
