-- ════════════════════════════════════════════════════════════════════
-- Migration 013 — Thème saisonnier programmable (store_settings.theme)
-- { id: 'coupe-monde', startsAt: ISO, endsAt: ISO } | null
-- Lu par l'app (get-settings) ; appliqué seulement si endsAt > now (l'app
-- gère l'expiration → pas de cron nécessaire).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS theme jsonb;

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
