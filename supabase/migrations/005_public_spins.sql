-- ════════════════════════════════════════════════════════════════════
-- Migration 005 — Roue concours publique (accessible sans login)
-- ════════════════════════════════════════════════════════════════════
-- Permet à La Base de partager un lien /jeu.html sur les réseaux sociaux
-- pour faire tourner la roue et collecter des emails de prospects.
-- Une seule participation par email + protection IP.

CREATE TABLE IF NOT EXISTS public.public_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  ip_hash text,            -- SHA-256 de l'IP (anonymisation RGPD)
  reward_code text UNIQUE,
  reward_label text NOT NULL,
  reward_type text NOT NULL
    CHECK (reward_type IN ('discount_percent', 'free_product', 'retry', 'manual_pickup')),
  reward_value text,
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  spun_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'public_wheel'  -- pour analytics ('public_wheel', 'instagram', etc.)
);

CREATE UNIQUE INDEX IF NOT EXISTS public_spins_email_idx
  ON public.public_spins (lower(email));

CREATE INDEX IF NOT EXISTS public_spins_ip_idx
  ON public.public_spins (ip_hash);

CREATE INDEX IF NOT EXISTS public_spins_spun_at_idx
  ON public.public_spins (spun_at DESC);

-- RLS : pas de lecture publique (seul le service role peut)
ALTER TABLE public.public_spins ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
