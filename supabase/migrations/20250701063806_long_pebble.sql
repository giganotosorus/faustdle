/*
  # Add points system to leaderboard

  1. Schema Changes
    - Add `points` column to `leaderboard_entries` table
    - Points can be null for existing entries (will display as "N/A")

  2. Security
    - Maintain existing RLS policies
*/

-- Add points column to leaderboard_entries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard_entries' AND column_name = 'points'
  ) THEN
    ALTER TABLE leaderboard_entries ADD COLUMN points integer;
  END IF;
END $$;