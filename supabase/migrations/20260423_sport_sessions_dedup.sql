-- Migration: add session_id to sport_sessions for client-side deduplication.
-- Allows the client to upsert (instead of insert) and avoid duplicate rows on retry.

ALTER TABLE sport_sessions ADD COLUMN IF NOT EXISTS session_id uuid;

-- Back-fill existing rows with unique UUIDs so the NOT NULL + UNIQUE constraint can be applied.
UPDATE sport_sessions SET session_id = gen_random_uuid() WHERE session_id IS NULL;

ALTER TABLE sport_sessions ALTER COLUMN session_id SET DEFAULT gen_random_uuid();
ALTER TABLE sport_sessions ALTER COLUMN session_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sport_sessions_session_id_key ON sport_sessions(session_id);
