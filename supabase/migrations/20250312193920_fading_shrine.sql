/*
  # Daily player tracking system

  1. New Tables
    - `daily_players`
      - `date` (date, primary key) - The date of the daily challenge
      - `player_count` (integer) - Number of players who completed the challenge
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Functions
    - `increment_daily_players` - Increments player count for a given date
      - Parameters: challenge_date (date)
      - Security: SECURITY DEFINER to allow anonymous access
*/

-- Create daily players table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_players (
  date date PRIMARY KEY,
  player_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE daily_players ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read daily player counts" ON daily_players;

-- Create policy for public read access
CREATE POLICY "Anyone can read daily player counts"
  ON daily_players
  FOR SELECT
  TO public
  USING (true);

-- Create function to update player count
CREATE OR REPLACE FUNCTION increment_daily_players(challenge_date date)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_players (date, player_count)
  VALUES (challenge_date, 1)
  ON CONFLICT (date)
  DO UPDATE SET 
    player_count = daily_players.player_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;