-- Migration: add entry_id to food_journal for client-side deduplication.
-- Allows the client to upsert (instead of insert) and avoid duplicate rows on retry.

ALTER TABLE food_journal ADD COLUMN IF NOT EXISTS entry_id uuid;

-- Back-fill existing rows with unique UUIDs so the NOT NULL + UNIQUE constraint can be applied.
UPDATE food_journal SET entry_id = gen_random_uuid() WHERE entry_id IS NULL;

ALTER TABLE food_journal ALTER COLUMN entry_id SET DEFAULT gen_random_uuid();
ALTER TABLE food_journal ALTER COLUMN entry_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS food_journal_entry_id_key ON food_journal(entry_id);
