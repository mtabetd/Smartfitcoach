-- Migration: plate_scan_history table
-- Stores every AI plate-scan result that the user adds to their day.
-- (Distinct from the barcode scan_history table which tracks OpenFoodFacts lookups.)

CREATE TABLE IF NOT EXISTS plate_scan_history (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text         NOT NULL DEFAULT '',
  kcal          integer      NOT NULL DEFAULT 0,
  protein       numeric(6,1) NOT NULL DEFAULT 0,
  carbs         numeric(6,1) NOT NULL DEFAULT 0,
  fat           numeric(6,1) NOT NULL DEFAULT 0,
  portion       text,
  meal_slot     text,
  meal_date     date         NOT NULL DEFAULT CURRENT_DATE,
  added_to_plan boolean      NOT NULL DEFAULT false,
  scanned_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plate_scan_history_user_id_idx  ON plate_scan_history(user_id);
CREATE INDEX IF NOT EXISTS plate_scan_history_meal_date_idx ON plate_scan_history(meal_date DESC);

ALTER TABLE plate_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plate scan history" ON plate_scan_history
  FOR ALL USING (auth.uid() = user_id);
