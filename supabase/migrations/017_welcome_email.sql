-- ════════════════════════════════════════════════════════════════════
-- Bienvenue : flag pour n'envoyer l'email + la push de bienvenue qu'UNE
-- seule fois par compte (idempotent, quel que soit le nombre de logins).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_sent_at timestamptz;
