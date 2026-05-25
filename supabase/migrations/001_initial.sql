-- Enable UUID generation
create extension if not exists "pgcrypto";

-- users: all players
create table users (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- pong_games: one row per game, stores cups left for winning team
create table pong_games (
  id uuid primary key default gen_random_uuid(),
  cups_left int not null check (cups_left >= 0),
  played_at timestamptz default now()
);

-- pong_game_players: one row per player per game (supports variable team sizes)
create table pong_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references pong_games(id) on delete cascade,
  player_id uuid not null references users(id) on delete cascade,
  side text not null check (side in ('winner', 'loser'))
);

-- beer_die_games: strictly 2v2, stores points won by
create table beer_die_games (
  id uuid primary key default gen_random_uuid(),
  winner1_id uuid not null references users(id),
  winner2_id uuid not null references users(id),
  loser1_id uuid not null references users(id),
  loser2_id uuid not null references users(id),
  points_differential int not null check (points_differential >= 1),
  played_at timestamptz default now()
);

-- hearts_games: one row per game session
create table hearts_games (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz default now()
);

-- hearts_game_players: one row per player per hearts game, exactly one lost=true per game
create table hearts_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references hearts_games(id) on delete cascade,
  player_id uuid not null references users(id) on delete cascade,
  lost boolean not null default false
);
