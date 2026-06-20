-- ════════════════════════════════════════════════════════════════════
-- Migration 015 — Boîte de réception PAR UTILISATEUR
-- Les broadcasts (table 007) sont une boîte commune (annonces « à tous »).
-- Mais les messages PERSONNELS (relance « tu nous manques », anniversaire,
-- push ciblées par segment) doivent atterrir chez le bon client ET être
-- consultables/marquables individuellement. Cette table porte un user_id
-- + un read_at (état lu synchronisé serveur, multi-appareils).
-- À jouer dans Supabase SQL Editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  emoji text,
  kind text NOT NULL DEFAULT 'message', -- 'relance' | 'birthday' | 'targeted' | 'message'
  read_at timestamptz,                  -- NULL = non lu
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_idx
  ON public.user_notifications (user_id, created_at DESC);

-- RLS : chaque client lit / met à jour (marque lu) UNIQUEMENT ses messages.
-- Les insertions se font côté serveur via la service_role (cron / API push),
-- qui contourne RLS — aucune policy d'insert côté client n'est nécessaire.
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.user_notifications;
CREATE POLICY "Users read own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.user_notifications;
CREATE POLICY "Users update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- Relances, anniversaires et push ciblées créent désormais une ligne ici →
-- le client les retrouve dans « Mes messages » et peut les marquer lues.
-- ════════════════════════════════════════════════════════════════════
