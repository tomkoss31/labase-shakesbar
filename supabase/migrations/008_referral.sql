-- ════════════════════════════════════════════════════════════════════
-- Migration 008 — Parrainage (referral)
-- Chaque membre a un code unique. Un filleul qui s'inscrit via le lien
-- /jeu?ref=CODE est rattaché à son parrain. À la 1ère commande payée du
-- filleul, le parrain est récompensé (+500 XP, géré côté API).
-- ════════════════════════════════════════════════════════════════════

-- Code de parrainage déterministe (6 1ers caractères hex de l'uuid),
-- l'id étant déjà aléatoire et unique → collision négligeable.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_rewarded boolean NOT NULL DEFAULT false;

-- Backfill des codes pour les profils existants
UPDATE public.profiles
SET referral_code = upper(substr(replace(id::text, '-', ''), 1, 6))
WHERE referral_code IS NULL;

-- Unicité du code (insensible à la casse via stockage en majuscules)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON public.profiles (referral_code);

-- Index sur le parrain pour compter rapidement les filleuls
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
  ON public.profiles (referred_by);

-- Auto-génération du code à la création d'un nouveau profil
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(replace(NEW.id::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_referral_code ON public.profiles;
CREATE TRIGGER trg_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
