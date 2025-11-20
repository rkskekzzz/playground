
-- Create Members Table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  lol_id TEXT NOT NULL,
  main_position TEXT CHECK (main_position IN ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Games Table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  winning_team TEXT CHECK (winning_team IN ('BLUE', 'RED')) NOT NULL
);

-- Create Game Participants Table
CREATE TABLE game_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  team TEXT CHECK (team IN ('BLUE', 'RED')) NOT NULL,
  position TEXT CHECK (position IN ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')) NOT NULL
);

-- Enable Row Level Security (RLS) - Optional, but good practice.
-- For this internal tool, we might want to allow public access or simple auth.
-- For now, we will enable it but create a policy for public access if needed,
-- or just leave it disabled if the user prefers simple setup.
-- Let's leave it off by default for simplicity in this internal tool context,
-- or enable with public policies.

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous access for this demo/internal tool
CREATE POLICY "Allow public access to members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to game_participants" ON game_participants FOR ALL USING (true) WITH CHECK (true);
