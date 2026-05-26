-- ════════════════════════════════════════════════════════════════════
-- La Base Shakes & Drinks — Schéma initial
-- À exécuter dans Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ════════════════════════════════════════════════════════════════════

-- ─── PROFILES ───────────────────────────────────────────────────────
-- Stocke les infos publiques de chaque utilisateur authentifié
-- Lié à auth.users (table interne Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  first_name text,
  birthday date,
  total_spent_cents integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  vip_tier text NOT NULL DEFAULT 'starter'
    CHECK (vip_tier IN ('starter', 'regulier', 'vip', 'elite', 'legende')),
  xp integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'apprenti'
    CHECK (level IN ('apprenti', 'regulier', 'pro')),
  last_spin_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_vip_tier_idx ON public.profiles (vip_tier);
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── ORDERS ─────────────────────────────────────────────────────────
-- Une ligne par commande. Source de vérité pour XP/VIP/historique.
-- Remplie par le webhook Square côté serveur (à venir Phase 5b).
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE SET NULL,
  square_order_id text UNIQUE,
  square_payment_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  total_cents integer NOT NULL DEFAULT 0,
  customer_name text,
  pickup_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);

-- ─── ORDER ITEMS ────────────────────────────────────────────────────
-- Détail des articles de chaque commande
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  product_name text NOT NULL,
  option_label text,
  category_name text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);

-- ─── PUSH SUBSCRIPTIONS ─────────────────────────────────────────────
-- Abonnements push web (VAPID). Anonymes ou liés à un user_id.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

-- ─── WHEEL SPINS ────────────────────────────────────────────────────
-- Historique des tours de roue avec récompense gagnée
CREATE TABLE IF NOT EXISTS public.wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  reward_code text NOT NULL UNIQUE,
  reward_label text NOT NULL,
  reward_type text NOT NULL
    CHECK (reward_type IN ('discount_percent', 'free_product', 'xp_multiplier', 'retry', 'manual_pickup')),
  reward_value text,
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  spun_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wheel_spins_user_idx ON public.wheel_spins (user_id, spun_at DESC);
CREATE INDEX IF NOT EXISTS wheel_spins_unused_idx ON public.wheel_spins (user_id) WHERE used_at IS NULL;

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne peut voir/modifier QUE ses propres données.
-- ════════════════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders (lecture seule pour l'utilisateur ; écriture via service_role/webhook)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Push subscriptions (chacun gère les siennes)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users read own subscriptions" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users insert own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users insert own subscriptions" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users delete own subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users delete own subscriptions" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Wheel spins
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own spins" ON public.wheel_spins;
CREATE POLICY "Users read own spins" ON public.wheel_spins
  FOR SELECT USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- TRIGGER : créer un profil automatiquement à l'inscription
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════
-- Done ✅
-- ════════════════════════════════════════════════════════════════════
