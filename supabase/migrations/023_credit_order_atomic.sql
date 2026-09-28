-- ════════════════════════════════════════════════════════════════════
-- FIABILITÉ — Lot 3 (audit 28/09/2026)
-- Crédit ATOMIQUE d'un passage au comptoir (scan QR → credit-manual) :
-- XP + total dépensé + nombre de commandes incrémentés EN UNE requête.
-- Avant : « lire le profil → calculer → réécrire » ; si le client échangeait
-- un cadeau dans l'app (spend_xp) pendant le scan, le scan réécrivait l'ancien
-- solde et le cadeau devenait gratuit.
-- Réservée au serveur (service_role).
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.credit_order(p_user uuid, p_xp integer, p_amount_cents integer)
RETURNS TABLE(new_xp integer, new_total_spent integer, new_total_orders integer) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.profiles p
     SET xp                = p.xp + p_xp,
         total_spent_cents = p.total_spent_cents + p_amount_cents,
         total_orders      = p.total_orders + 1,
         level = CASE WHEN p.xp + p_xp >= 1500 THEN 'pro'
                      WHEN p.xp + p_xp >= 500  THEN 'regulier'
                      ELSE 'apprenti' END
   WHERE p.id = p_user
   RETURNING p.xp, p.total_spent_cents, p.total_orders;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.credit_order(uuid, integer, integer) FROM public, anon, authenticated;
