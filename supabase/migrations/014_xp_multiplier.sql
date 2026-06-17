-- ════════════════════════════════════════════════════════════════════
-- Migration 014 — Boost XP ×2 (roue) : fenêtre de multiplicateur 24h
-- Quand le client gagne « Boost XP ×2 pendant 24h » à la roue, on stocke
-- ici la date de fin. Tant que xp_multiplier_until > now, les XP gagnés
-- (online + comptoir) sont doublés sur la part « par euro ».
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_multiplier_until timestamptz;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
