-- ════════════════════════════════════════════════════════════════════
-- Migration 016 — orders.combo_count
-- Stocke le nombre de combos (« Formule combo ») d'une commande, posé à la
-- création (espèces via create-pending, CB via create-payment-link). Permet de
-- créditer le bonus +25 XP / combo à l'encaissement (webhook CB + mark-paid
-- espèces), alors que ces flux ne voient pas le panier.
-- À jouer dans Supabase SQL Editor (idempotent).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS combo_count integer NOT NULL DEFAULT 0;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
