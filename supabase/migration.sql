-- 1. Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  pin text NOT NULL DEFAULT '1111',
  premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed Giles's existing group
INSERT INTO groups (id, slug, name, pin)
VALUES ('00000000-0000-0000-0000-000000000001', 'summer-games', 'Summer Games', '1111')
ON CONFLICT (slug) DO NOTHING;

-- 3. users
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE users SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE users ALTER COLUMN group_id SET NOT NULL;

-- 4. pong_games
ALTER TABLE pong_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE pong_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE pong_games ALTER COLUMN group_id SET NOT NULL;

-- 5. pong_game_players
ALTER TABLE pong_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE pong_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE pong_game_players ALTER COLUMN group_id SET NOT NULL;

-- 6. beer_die_games
ALTER TABLE beer_die_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_games ALTER COLUMN group_id SET NOT NULL;

-- 7. beer_die_game_players
ALTER TABLE beer_die_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_game_players ALTER COLUMN group_id SET NOT NULL;

-- 8. beer_die_sinks
ALTER TABLE beer_die_sinks ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_sinks SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_sinks ALTER COLUMN group_id SET NOT NULL;

-- 9. hearts_games
ALTER TABLE hearts_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE hearts_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE hearts_games ALTER COLUMN group_id SET NOT NULL;

-- 10. hearts_game_players
ALTER TABLE hearts_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE hearts_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE hearts_game_players ALTER COLUMN group_id SET NOT NULL;
