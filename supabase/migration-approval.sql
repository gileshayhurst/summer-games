-- Add approved column to game tables (default false = pending)
ALTER TABLE pong_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE beer_die_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE hearts_games ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Backfill: all existing games are already legitimate, mark them approved
UPDATE pong_games SET approved = true;
UPDATE beer_die_games SET approved = true;
UPDATE hearts_games SET approved = true;
