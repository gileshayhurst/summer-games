# Summer Games Tracker — Design Spec

**Date:** 2026-05-25

## Overview

A publicly-viewable website for tracking game results among a friend group. One person (Giles) enters all results; everyone can view stats and leaderboards from any device via the internet.

---

## Architecture

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14 (App Router) | Handles both frontend pages and API routes |
| Database | Supabase (PostgreSQL) | Free tier, relational queries for stats |
| Styling | Tailwind CSS | Dark sporty theme |
| Hosting | Vercel | Free tier, auto-deploys from GitHub |

The log game page is open to anyone (no password protection).

---

## Visual Style

Dark & sporty:
- Background: `#0f172a` (slate-900)
- Card background: `#1e293b` (slate-800)
- Win accent: `#22c55e` (green-500)
- Loss accent: `#ef4444` (red-500)
- Gold rank: `#f59e0b` (amber-500)
- Font: system sans-serif

---

## Players

Initial users seeded on first deploy:
`Giles, Sherm, Rob, Ant, Noah, Cole, Rowan, Jackson, Max, Adrian, Suren`

A "Add New Player" form is available on the Players page to add users at any time.

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text UNIQUE | |
| created_at | timestamptz | |

### `pong_games`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| cups_left | int | Cups the winning team had remaining |
| played_at | timestamptz | |

### `pong_game_players`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_id | uuid FK → pong_games | |
| player_id | uuid FK → users | |
| side | text | `'winner'` or `'loser'` |

Supports variable team sizes (2v2, 3v3, etc.).

### `beer_die_games`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| winner1_id | uuid FK → users | |
| winner2_id | uuid FK → users | |
| loser1_id | uuid FK → users | |
| loser2_id | uuid FK → users | |
| points_differential | int | How many points the winning team won by |
| played_at | timestamptz | |

Strictly 2v2.

### `hearts_games`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| played_at | timestamptz | |

### `hearts_game_players`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_id | uuid FK → hearts_games | |
| player_id | uuid FK → users | |
| lost | boolean | Exactly one player per game has `lost = true` |

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Home: recent games feed (game type, team/players, result, date), links to each leaderboard |
| `/pong` | Public | Pong leaderboard + stats |
| `/beer-die` | Public | Beer Die leaderboard + stats |
| `/hearts` | Public | Hearts leaderboard + stats |
| `/players` | Public | Grid of all players; click for individual profile |
| `/players/[name]` | Public | Full stat profile across all three games |
| `/log` | Public | Log a game result (tab per game type) |

---

## Log Game Forms

### Pong
1. Select winning team — multi-select from player list (at least 2)
2. Select losing team — multi-select from remaining players (at least 2, no overlap with winners)
3. Enter cups left (integer ≥ 0)
4. Submit

### Beer Die
1. Select winning team — exactly 2 players
2. Select losing team — exactly 2 players (no overlap)
3. Enter points won by (integer ≥ 1)
4. Submit

### Hearts
1. Select all players who participated (multi-select, minimum 3)
2. Click one player to mark as the loser (radio-style — only one can be selected)
3. Submit

---

## Stats & Leaderboard Logic

### Pong & Beer Die (shared pattern)

**Leaderboard** (ranked by win rate, descending; players with 0 games excluded):
- Player name
- Wins / Losses
- Win rate (wins ÷ total games)
- Cup / Point differential

**Cup differential (Pong):**
Sum of `cups_left` across all games the player's team won. Losing teams always finish with 0 cups, so losses contribute 0. Higher is better.

**Point differential (Beer Die):**
`+points_differential` for each win, `−points_differential` for each loss. Running total across all games.

**Head-to-head:**
Dropdown to select any other player. Shows W/L record in games where the two players were on **opposite teams only** (teammates excluded). Available on both the game leaderboard page and individual player profiles.

### Hearts

**Leaderboard** (ranked by lowest loss rate, descending; players with 0 games excluded):
- Player name
- Games played
- Losses
- Loss rate (losses ÷ games played)

No head-to-head for Hearts (individual game).

---

## Navigation

Top nav on every page:
`SUMMER GAMES | 🏓 Pong | 🎲 Beer Die | ♥ Hearts | 👥 Players | [+ LOG GAME]`

`+ LOG GAME` button links to `/log`, styled as a green action button.

---

## Individual Player Profile (`/players/[name]`)

Shows stats across all three games for that player:
- Pong: W/L, win rate, cup differential, recent games
- Beer Die: W/L, win rate, point differential, recent games
- Hearts: games played, losses, loss rate, recent games
- Head-to-head dropdowns for Pong and Beer Die

---

## Seed Data

On first deploy, run a seed script that inserts the 11 initial players into the `users` table if they don't already exist. Subsequent deploys are safe to re-run (upsert on name).
