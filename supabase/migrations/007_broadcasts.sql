-- ════════════════════════════════════════════════════════════════════
-- Migration 007 — Boîte de réception (messages / annonces)
-- Chaque push envoyée est aussi archivée ici → le client peut la revoir
-- dans l'onglet "Messages" de l'app. À jouer dans Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  emoji text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broadcasts_created_idx
  ON public.broadcasts (created_at DESC);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- Les broadcasts sont publics en lecture (messages marketing, non sensibles).
-- ════════════════════════════════════════════════════════════════════
