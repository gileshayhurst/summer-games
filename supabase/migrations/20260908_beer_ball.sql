-- Beer Ball: pong's stat shape (a single count-remaining field) on spikeball's
-- team plumbing (variable-size teams via a game_players join table).

create table if not exists beer_ball_games (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  cans_left int not null check (cans_left >= 0),
  approved boolean not null default true,
  played_at timestamptz default now()
);

create table if not exists beer_ball_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references beer_ball_games(id) on delete cascade,
  player_id uuid not null references users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  side text not null check (side in ('winner', 'loser'))
);

create index if not exists beer_ball_games_group_idx on beer_ball_games (group_id);
create index if not exists beer_ball_game_players_group_idx on beer_ball_game_players (group_id);
create index if not exists beer_ball_game_players_player_idx on beer_ball_game_players (player_id);

-- Deny-all for the anon key, matching 20260714_enable_rls.sql. All access is via
-- the service-role client, which bypasses RLS.
alter table beer_ball_games        enable row level security;
alter table beer_ball_game_players enable row level security;
