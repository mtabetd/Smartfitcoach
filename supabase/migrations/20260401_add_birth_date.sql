-- Add birth_date and email_optin columns to profiles table
-- birth_date: used by Edge Function cron to send birthday emails
-- email_optin: RGPD-compliant opt-in for marketing emails (default true)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_optin BOOLEAN DEFAULT true;

-- Index for efficient daily birthday lookup (month + day extraction)
CREATE INDEX IF NOT EXISTS idx_profiles_birth_month_day
  ON profiles (EXTRACT(MONTH FROM birth_date), EXTRACT(DAY FROM birth_date))
  WHERE birth_date IS NOT NULL AND email_optin = true;

-- Index for inactivity check (updated_at)
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at
  ON profiles (updated_at)
  WHERE email_optin = true;
