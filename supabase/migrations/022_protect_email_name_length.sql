-- ════════════════════════════════════════════════════════════════════
-- SÉCURITÉ — Lot 1 (audit 28/09/2026)
-- 1) L'email du profil devient une colonne protégée : un client ne peut plus
--    le modifier lui-même (sinon il pouvait prendre l'email d'un admin et
--    recevoir les push « nouvelle commande », ou créer des collisions qui
--    rendent anonymes les paiements en ligne d'un autre client).
--    L'app ne modifie jamais l'email côté client (seulement first_name /
--    birthday) ; le serveur (service_role, auth.uid() NULL) garde tous les droits.
-- 2) Prénom limité à 60 caractères (l'app coupe déjà à 60).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger AS $$
BEGIN
  -- auth.uid() NON NULL = requête d'un CLIENT (JWT). Le serveur (service_role)
  -- a auth.uid() NULL → il n'est pas bridé et peut tout mettre à jour.
  IF auth.uid() IS NOT NULL THEN
    IF NEW.xp                          IS DISTINCT FROM OLD.xp
      OR NEW.vip_tier                  IS DISTINCT FROM OLD.vip_tier
      OR NEW.level                     IS DISTINCT FROM OLD.level
      OR NEW.total_spent_cents         IS DISTINCT FROM OLD.total_spent_cents
      OR NEW.total_orders              IS DISTINCT FROM OLD.total_orders
      OR NEW.referred_by               IS DISTINCT FROM OLD.referred_by
      OR NEW.referral_rewarded         IS DISTINCT FROM OLD.referral_rewarded
      OR NEW.referral_code             IS DISTINCT FROM OLD.referral_code
      OR NEW.xp_multiplier_until       IS DISTINCT FROM OLD.xp_multiplier_until
      OR NEW.last_spin_at              IS DISTINCT FROM OLD.last_spin_at
      OR NEW.welcome_sent              IS DISTINCT FROM OLD.welcome_sent
      OR NEW.welcome_sent_at           IS DISTINCT FROM OLD.welcome_sent_at
      OR NEW.last_birthday_celebrated_year IS DISTINCT FROM OLD.last_birthday_celebrated_year
      OR NEW.last_relance_at           IS DISTINCT FROM OLD.last_relance_at
      OR NEW.email                     IS DISTINCT FROM OLD.email
    THEN
      RAISE EXCEPTION 'Modification de colonnes protégées non autorisée';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_first_name_len;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_first_name_len CHECK (first_name IS NULL OR char_length(first_name) <= 60);
