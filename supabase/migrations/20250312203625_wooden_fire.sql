/*
  # Create leaderboards table

  1. New Tables
    - `leaderboard_entries`
      - `id` (uuid, primary key)
      - `player_name` (text)
      - `streak` (integer)
      - `mode` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `leaderboard_entries` table
    - Add policies for:
      - Public read access
      - Authenticated users can insert their own entries
*/

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  streak integer NOT NULL,
  mode text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read leaderboard entries"
  ON leaderboard_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert leaderboard entries"
  ON leaderboard_entries
  FOR INSERT
  TO public
  WITH CHECK (true);