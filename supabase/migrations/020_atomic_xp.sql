-- ════════════════════════════════════════════════════════════════════
-- SÉCURITÉ — Chantier 1.4 : opérations XP ATOMIQUES
-- Les crédits/débits XP étaient en "lire → calculer → réécrire" (2 requêtes)
-- → exploitables en concurrence (double-cadeau, double-parrainage, lost update).
-- Ces fonctions font le décrément/incrément EN UNE requête (verrou ligne
-- Postgres). Réservées au service_role (REVOKE aux rôles client) : un client
-- ne peut pas les appeler pour se créditer.
-- ════════════════════════════════════════════════════════════════════

-- Débit atomique (dépense d'un cadeau). Renvoie le nouveau solde, ou NULL si
-- XP insuffisants / user inconnu (aucune ligne mise à jour).
CREATE OR REPLACE FUNCTION public.spend_xp(p_user uuid, p_cost integer)
RETURNS integer AS $$
DECLARE new_xp integer;
BEGIN
  UPDATE public.profiles
     SET xp = xp - p_cost,
         level = CASE WHEN xp - p_cost >= 1500 THEN 'pro'
                      WHEN xp - p_cost >= 500  THEN 'regulier'
                      ELSE 'apprenti' END
   WHERE id = p_user AND xp >= p_cost
   RETURNING xp INTO new_xp;
  RETURN new_xp;
END;
$$ LANGUAGE plpgsql;

-- Crédit atomique. Renvoie le nouveau solde (NULL si user inconnu).
CREATE OR REPLACE FUNCTION public.add_xp(p_user uuid, p_amount integer)
RETURNS integer AS $$
DECLARE new_xp integer;
BEGIN
  UPDATE public.profiles
     SET xp = xp + p_amount,
         level = CASE WHEN xp + p_amount >= 1500 THEN 'pro'
                      WHEN xp + p_amount >= 500  THEN 'regulier'
                      ELSE 'apprenti' END
   WHERE id = p_user
   RETURNING xp INTO new_xp;
  RETURN new_xp;
END;
$$ LANGUAGE plpgsql;

-- Réservé au serveur (service_role). Un client (anon/authenticated) ne doit
-- PAS pouvoir appeler ces fonctions.
REVOKE ALL ON FUNCTION public.spend_xp(uuid, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_xp(uuid, integer)   FROM public, anon, authenticated;
