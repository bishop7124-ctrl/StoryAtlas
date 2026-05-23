-- ============================================================
-- Migration: user_profiles + app_config
-- Date:      2026-05-23
-- Purpose:
--   • user_profiles  — per-user storage tracking and founder status
--   • app_config     — platform-wide config (e.g. founder slot limits)
-- ============================================================

-- ----------------------------------------------------------
-- 1.  user_profiles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Storage tracking
  storage_used_bytes     BIGINT      NOT NULL DEFAULT 0,
  storage_add_on_bytes   BIGINT      NOT NULL DEFAULT 0, -- future purchasable add-ons
  -- Founder status
  is_founder             BOOLEAN     NOT NULL DEFAULT false,
  founder_badge_visible  BOOLEAN     NOT NULL DEFAULT true,
  -- Timestamps
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: users can read their own profile row; only the service role can write.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE policies for authenticated users — writes go through
-- server-side API routes using the service role key.

-- ----------------------------------------------------------
-- 2.  app_config
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Publicly readable (no sensitive data stored here).
DROP POLICY IF EXISTS "Public read app config" ON public.app_config;
CREATE POLICY "Public read app config"
  ON public.app_config
  FOR SELECT
  USING (true);

-- Seed founder slot configuration.
-- total   = maximum founder memberships ever sold
-- reserved = slots held back (e.g. for team/advisors); not counted as sold
INSERT INTO public.app_config (key, value)
VALUES ('founder_slots', '{"total": 100, "reserved": 0}')
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------
-- 3.  Helper RPC: get_founder_slot_info
--     Returns {"total": N, "taken": N, "remaining": N}
--     Callable by anon users (no auth needed for slot display).
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_founder_slot_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config  jsonb;
  total   int;
  reserved int;
  taken   int;
  remaining int;
BEGIN
  SELECT value INTO config FROM public.app_config WHERE key = 'founder_slots';
  total    := COALESCE((config->>'total')::int,    100);
  reserved := COALESCE((config->>'reserved')::int,   0);

  SELECT COUNT(*) INTO taken
  FROM public.user_profiles
  WHERE is_founder = true;

  remaining := GREATEST(0, total - reserved - taken);

  RETURN jsonb_build_object(
    'total',     total,
    'reserved',  reserved,
    'taken',     taken,
    'remaining', remaining
  );
END;
$$;

-- Grant anon + authenticated roles the right to call this RPC.
GRANT EXECUTE ON FUNCTION public.get_founder_slot_info() TO anon, authenticated;
