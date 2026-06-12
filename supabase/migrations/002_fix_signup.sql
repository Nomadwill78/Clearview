-- Repair script for "Database error saving new user" on signup.
-- Safe to run multiple times: re-creates anything missing from 001 and
-- fixes the new-user trigger. Run this in the Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables (no-ops if they already exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_location TEXT,
  birth_lat NUMERIC(10, 7),
  birth_lng NUMERIC(10, 7),
  sun_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  avatar_url TEXT,
  notification_daily BOOLEAN DEFAULT TRUE,
  notification_moon BOOLEAN DEFAULT TRUE,
  notification_hour INTEGER DEFAULT 8 CHECK (notification_hour >= 0 AND notification_hour <= 23),
  stripe_customer_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starseed', 'cosmic')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('horoscope', 'birth_chart', 'compatibility', 'numerology', 'tarot', 'advisor')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- One subscription row per user. Signup and the Stripe webhook both rely
-- on this for their ON CONFLICT / upsert logic.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);

-- Row Level Security + policies (drop-and-recreate so re-runs never error)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own readings" ON public.saved_readings;
CREATE POLICY "Users can manage own readings" ON public.saved_readings FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_log;
CREATE POLICY "Users can view own notifications" ON public.notification_log FOR SELECT USING (auth.uid() = user_id);

-- New-user trigger: pinned search_path so it cannot fail from the auth
-- service's execution environment, and ON CONFLICT targets the unique
-- constraint added above.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER handle_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
