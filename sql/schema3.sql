-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create 'test' team if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM teams WHERE name = 'test') THEN
    INSERT INTO teams (name, password_hash)
    VALUES ('test', crypt('test', gen_salt('bf')));
  END IF;
END $$;

-- 4. Migrate Members
-- Add column (nullable first)
ALTER TABLE members ADD COLUMN IF NOT EXISTS team_id UUID;

-- Assign to 'test' team
UPDATE members
SET team_id = (SELECT id FROM teams WHERE name = 'test')
WHERE team_id IS NULL;

-- Add constraints (Foreign Key and Not Null)
-- We drop the constraint first if it exists to avoid errors on re-run
ALTER TABLE members DROP CONSTRAINT IF EXISTS fk_members_teams;
ALTER TABLE members
  ALTER COLUMN team_id SET NOT NULL,
  ADD CONSTRAINT fk_members_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- 5. Migrate Games
ALTER TABLE games ADD COLUMN IF NOT EXISTS team_id UUID;

UPDATE games
SET team_id = (SELECT id FROM teams WHERE name = 'test')
WHERE team_id IS NULL;

ALTER TABLE games DROP CONSTRAINT IF EXISTS fk_games_teams;
ALTER TABLE games
  ALTER COLUMN team_id SET NOT NULL,
  ADD CONSTRAINT fk_games_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- 6. Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- 7. RPC Functions
CREATE OR REPLACE FUNCTION create_team(team_name TEXT, team_password TEXT)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO teams (name, password_hash)
  VALUES (team_name, crypt(team_password, gen_salt('bf')))
  RETURNING id INTO new_team_id;

  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_team_credentials(team_name TEXT, team_password TEXT)
RETURNS UUID AS $$
DECLARE
  found_team_id UUID;
  stored_hash TEXT;
BEGIN
  SELECT id, password_hash INTO found_team_id, stored_hash
  FROM teams
  WHERE name = team_name;

  IF found_team_id IS NOT NULL AND stored_hash = crypt(team_password, stored_hash) THEN
    RETURN found_team_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
