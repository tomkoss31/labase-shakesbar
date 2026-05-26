-- ════════════════════════════════════════════════════════════════════
-- Migration 003 — Ajouter le statut 'pending_cash' pour les commandes
-- à régler en espèces sur place
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'pending_cash',  -- en attente d'encaissement espèces au comptoir
    'paid',
    'preparing',
    'ready',
    'cancelled',
    'refunded'
  ));

-- Ajouter un champ payment_method pour distinguer Square / cash / WhatsApp
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Réactiver Realtime sur orders (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
