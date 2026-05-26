-- ════════════════════════════════════════════════════════════════════
-- Migration 004 — Tracking des crons (anniversaire + relance)
-- ════════════════════════════════════════════════════════════════════

-- Année du dernier anniv célébré (évite de re-célébrer 2× la même année
-- si le cron tourne plusieurs fois ou en cas de bug)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_birthday_celebrated_year integer;

-- Date du dernier message de relance "tu nous manques" envoyé
-- (évite de spammer plus d'une fois tous les 7 jours)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_relance_at timestamptz;

-- Index pour accélérer les crons quotidiens (filtres typiques)
CREATE INDEX IF NOT EXISTS profiles_birthday_idx ON public.profiles (birthday);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
