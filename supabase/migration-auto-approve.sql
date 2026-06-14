-- Change default so new games are auto-approved on insert
ALTER TABLE pong_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE beer_die_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE cornhole_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE spikeball_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE hearts_games ALTER COLUMN approved SET DEFAULT true;

-- Backfill any currently-pending games
UPDATE pong_games SET approved = true WHERE approved = false;
UPDATE beer_die_games SET approved = true WHERE approved = false;
UPDATE cornhole_games SET approved = true WHERE approved = false;
UPDATE spikeball_games SET approved = true WHERE approved = false;
UPDATE hearts_games SET approved = true WHERE approved = false;
