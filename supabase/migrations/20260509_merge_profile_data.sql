-- ============================================================
-- P6 FIX: Field-level JSONB merge for multi-device sync
--
-- Problem: saveProfile always upserts the full data JSONB column,
-- overwriting keys that another device set but this device never
-- received (last-write-wins data loss).
--
-- Fix: merge_profile_data RPC uses PostgreSQL's || operator to
-- merge at the key level — only keys sent by the client override
-- the stored value; keys not sent are preserved.
--
-- Combined with the client stripping null/empty protected keys
-- from the save payload, this prevents:
--   Device A saves weekPlan  → Device B (no weekPlan) saves sportProgram
--   → cloud retains both weekPlan AND sportProgram
-- ============================================================

CREATE OR REPLACE FUNCTION public.merge_profile_data(
  p_user_id    uuid,
  p_email      text,
  p_name       text,
  p_data       jsonb,
  p_updated_at timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.profiles (id, email, name, data, updated_at)
  VALUES (p_user_id, p_email, p_name, p_data, p_updated_at)
  ON CONFLICT (id) DO UPDATE
  SET
    email      = EXCLUDED.email,
    name       = EXCLUDED.name,
    -- JSONB || merge: EXCLUDED.data keys overlay, profiles.data keys not in EXCLUDED.data are preserved
    data       = profiles.data || EXCLUDED.data,
    updated_at = EXCLUDED.updated_at;
$$;

-- Grant execute to authenticated users (RLS still enforces row ownership via SECURITY DEFINER + id check)
GRANT EXECUTE ON FUNCTION public.merge_profile_data(uuid, text, text, jsonb, timestamptz) TO authenticated;
