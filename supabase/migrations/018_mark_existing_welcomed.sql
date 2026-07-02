-- ════════════════════════════════════════════════════════════════════
-- L'email + push de bienvenue est réservé aux NOUVELLES inscriptions.
-- On marque tous les comptes DÉJÀ existants comme « déjà accueillis »
-- pour qu'ils ne reçoivent pas la bienvenue à leur prochain login.
-- (Réversible : UPDATE ... SET welcome_sent = false si on veut un envoi groupé.)
-- ════════════════════════════════════════════════════════════════════

UPDATE public.profiles SET welcome_sent = true WHERE welcome_sent = false;
