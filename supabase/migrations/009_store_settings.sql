-- ════════════════════════════════════════════════════════════════════
-- Migration 009 — Réglages magasin (horaires pilotables depuis la console)
-- Une seule ligne (id=1). override_mode permet de forcer ouvert/fermé
-- (jours d'événement, fermeture exceptionnelle) sans toucher au code.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.store_settings (
  id int PRIMARY KEY DEFAULT 1,
  -- 'auto' = suit les horaires | 'force_open' | 'force_closed'
  override_mode text NOT NULL DEFAULT 'auto',
  -- horaires hebdo personnalisés (jsonb), null = horaires par défaut du code
  hours jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_single CHECK (id = 1),
  CONSTRAINT store_settings_override_check
    CHECK (override_mode IN ('auto', 'force_open', 'force_closed'))
);

-- Ligne unique de réglages
INSERT INTO public.store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Lecture publique (l'app cliente doit connaître le statut), écriture
-- réservée au service_role (API admin, qui bypass RLS).
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_settings_public_read ON public.store_settings;
CREATE POLICY store_settings_public_read
  ON public.store_settings
  FOR SELECT
  USING (true);

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
