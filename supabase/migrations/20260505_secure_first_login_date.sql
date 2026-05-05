-- ============================================================
-- SECURITY PATCH: Write-once first_login_date column
-- Closes CRITICAL: users could set data.firstLoginDate='2099-01-01'
-- via Supabase client to obtain permanent trial access.
--
-- Fix: add first_login_date date column that is:
--   1. Set on first profile INSERT to CURRENT_DATE (server time, not client)
--   2. Immutable after being set — any UPDATE that tries to change it
--      is silently reverted by the BEFORE trigger
--   3. Backfilled for existing users from created_at::date (not from
--      data->>'firstLoginDate' which is user-writable)
--
-- _user-auth.js updated to read first_login_date instead of
-- data->>'firstLoginDate' for server-side premium checks.
-- supabase-client.js updated to strip firstLoginDate from upsert
-- data and to surface server value on load.
-- ============================================================

-- 1. Add column (idempotent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_login_date date;

-- 2. Backfill existing rows from created_at (server-controlled timestamp,
--    not user-writable). Using created_at is safer than data->>'firstLoginDate'
--    which could have been tampered before this migration ran.
UPDATE public.profiles
SET first_login_date = created_at::date
WHERE first_login_date IS NULL;

-- 3. Write-once trigger: sets first_login_date = CURRENT_DATE on INSERT
--    (ignores any client-supplied value), and on UPDATE prevents modification
--    once the column has been set.
CREATE OR REPLACE FUNCTION public.protect_first_login_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Always use server date on new profile creation, ignore client value
    NEW.first_login_date := CURRENT_DATE;
    RETURN NEW;
  END IF;

  -- UPDATE: once set, silently revert any attempt to change it
  IF OLD.first_login_date IS NOT NULL THEN
    NEW.first_login_date := OLD.first_login_date;
    RETURN NEW;
  END IF;

  -- UPDATE: column was NULL (pre-migration row), allow setting it once
  -- but only to a date <= today (prevent future-date attacks)
  IF NEW.first_login_date IS NOT NULL THEN
    IF NEW.first_login_date > CURRENT_DATE THEN
      NEW.first_login_date := CURRENT_DATE;
    END IF;
  ELSE
    NEW.first_login_date := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_protect_first_login ON public.profiles;
CREATE TRIGGER on_profile_protect_first_login
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_first_login_date();

-- 4. Index for server-side trial calculations
CREATE INDEX IF NOT EXISTS idx_profiles_first_login_date
  ON public.profiles (first_login_date);
