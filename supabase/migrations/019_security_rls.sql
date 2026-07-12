-- ════════════════════════════════════════════════════════════════════
-- SÉCURITÉ — Chantier 1 (audit 11/07/2026)
-- 1) Verrou colonnes profil : un CLIENT ne peut modifier que first_name /
--    birthday. Toute tentative de changer XP / VIP / total_spent / parrainage /
--    boost… est REJETÉE. Sinon : auto-crédit XP illimité (les XP = cadeaux).
--    Le SERVEUR (clé service_role → auth.uid() NULL) garde tous les droits.
-- 2) Activer la RLS sur 5 tables laissées ouvertes (CRUD anonyme possible) :
--    deny-all côté client ; tout l'accès légitime passe par le service_role.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1) Verrou des colonnes sensibles de profiles ───────────────────
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
    THEN
      RAISE EXCEPTION 'Modification de colonnes protégées non autorisée';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profile_columns_trg ON public.profiles;
CREATE TRIGGER protect_profile_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- ─── 2) RLS sur les tables oubliées (deny-all client) ───────────────
-- Enabler la RLS sans policy = tout refusé pour anon/authenticated ; le
-- service_role (serveur) bypass la RLS. Vérifié : aucune lecture directe de
-- ces tables côté app (tout passe par les endpoints api/).
ALTER TABLE public.broadcasts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_manual_credits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_claims   ENABLE ROW LEVEL SECURITY;
