-- Migration: body_analyses table
-- Stores AI body analysis results (morphology + personalised programme) per user.

CREATE TABLE IF NOT EXISTS body_analyses (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analyse      jsonb NOT NULL DEFAULT '{}',
  programme    jsonb NOT NULL DEFAULT '{}',
  analysed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS body_analyses_user_id_idx      ON body_analyses(user_id);
CREATE INDEX IF NOT EXISTS body_analyses_analysed_at_idx  ON body_analyses(analysed_at DESC);

ALTER TABLE body_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own body analyses" ON body_analyses
  FOR ALL USING (auth.uid() = user_id);
