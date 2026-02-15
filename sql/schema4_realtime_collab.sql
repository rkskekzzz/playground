-- Team builder collaborative draft state (one row per team)
CREATE TABLE IF NOT EXISTS team_builder_drafts (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID NOT NULL
);

-- Keep updated_at server-authoritative on updates
CREATE OR REPLACE FUNCTION set_team_builder_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_team_builder_drafts_updated_at ON team_builder_drafts;
CREATE TRIGGER trg_team_builder_drafts_updated_at
BEFORE UPDATE ON team_builder_drafts
FOR EACH ROW
EXECUTE FUNCTION set_team_builder_drafts_updated_at();

ALTER TABLE team_builder_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to team_builder_drafts"
ON team_builder_drafts
FOR ALL
USING (true)
WITH CHECK (true);
