-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);

-- 4. Clean up existing data to allow adding NOT NULL constraints
-- WARNING: This deletes all existing members and games!
TRUNCATE TABLE game_participants, games, members;

-- 5. Add team_id to members
ALTER TABLE members
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL;

-- 6. Add team_id to games
ALTER TABLE games
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL;

-- 7. Create RPC Function to create a team
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

-- 8. Create RPC Function to verify team credentials
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
