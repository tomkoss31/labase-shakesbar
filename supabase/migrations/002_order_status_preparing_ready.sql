-- ════════════════════════════════════════════════════════════════════
-- Migration 002 — Étendre orders.status avec preparing + ready
-- À jouer dans Supabase SQL Editor une fois (idempotent).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'preparing', 'ready', 'cancelled', 'refunded'));

-- Réactiver Realtime sur orders pour permettre au client de subscribe
-- aux changements de status en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- Le user voit son écran live tracking se mettre à jour en temps réel
-- quand le comptoir clique "En préparation" puis "Prêt à retirer" dans
-- /comptoir.html
-- ════════════════════════════════════════════════════════════════════
