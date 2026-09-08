# Delete Players + Beer Ball Design

**Date:** 2026-09-08

## Overview

Two independent features:

1. **Delete player** — group admins can remove a player from the playerbase, blocked when the player has any logged games or is claimed by a member.
2. **Beer Ball** — an eighth loggable game, using pong's stat shape (`cans_left`) on spikeball's team plumbing.

---

## Feature 1: Delete Player

### Authorization

`lib/api-auth.ts` already contains a table-generic authorizer: it reads `group_id`
off the target row (never from the request body) and calls `requireGroupAdmin`.
Only its name says "game".

Rename `authorizeGameMutation` → `authorizeRowMutation` and reuse it for the
players route. Mechanical rename across 8 existing game routes; no behaviour change.

### Route

New `app/api/players/[id]/route.ts`, `DELETE` only.

1. `authorizeRowMutation('users', params.id)` — 404 if no such player, 403 if the
   caller is not an admin/owner of that player's group.
2. Guard: one `Promise.all` of count queries —
   - `{pong,beer_die,cornhole,spikeball,hearts,pool,poker,beer_ball}_game_players`
     where `player_id = id`
   - `group_members` where `player_id = id`
3. Any game hit → `409 { error: "<Name> is in N games — delete those games first" }`
4. Any member hit → `409 { error: "<Name> is claimed by a member — unlink them first" }`
5. Otherwise delete the `users` row.

The member check exists because `group_members.player_id` is `ON DELETE SET NULL`:
without it, deleting a player silently unclaims a teammate's identity with no
warning anywhere in the UI.

### UI

New `components/admin/PlayersTab.tsx`, a fourth tab in `AdminPanel` alongside
Games / Members / Settings. `AdminPanel` already receives `players: User[]`, so no
new data fetching is required.

Each row uses the same inline-confirm pattern as the existing game rows:
🗑 Delete → "Sure? / Yes / Cancel". A 409 message renders under the row it belongs to.

### Accepted limitation

Delete is unavailable for any player who has played a game. The escape hatch is
the Games tab, which can already delete games. This is deliberate — cascading a
player delete through `*_game_players` would corrupt other players' history
(a 2v2 game left with a phantom opponent).

---

## Feature 2: Beer Ball

**Slug:** `beer-ball`. **Icon:** 🍺 (emoji, via `GameIcon`'s existing fallback).
**Badge:** `BALL`, `bg-yellow-100 text-yellow-700` (amber is taken by Beer Die).

### Data model

`supabase/migrations/20260908_beer_ball.sql`

**`beer_ball_games`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `group_id` | uuid | → `groups(id)` on delete cascade, not null |
| `cans_left` | int | `check (cans_left >= 0)` |
| `approved` | boolean | not null default true |
| `played_at` | timestamptz | default now() |

**`beer_ball_game_players`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `game_id` | uuid | → `beer_ball_games(id)` on delete cascade |
| `player_id` | uuid | → `users(id)` on delete cascade |
| `group_id` | uuid | → `groups(id)` on delete cascade, not null |
| `side` | text | `check (side in ('winner','loser'))` |

Both tables get `ENABLE ROW LEVEL SECURITY` with no policies — deny-all for the
anon key, matching `20260714_enable_rls.sql`. All access is via the service-role
client, same as every other game.

`cans_left >= 0` rather than `>= 1`: a shutout where the winners finished
everything is a legal result, mirroring pong's `cups_left`.

### Stat model

Beer Ball is pong's stat shape (a single count-remaining field) on spikeball's
plumbing (variable-size teams via a `game_players` join table).

`lib/stats.ts` gains three functions copied from their pong equivalents with the
field swapped to `cans_left` / `can_differential`:

- `computeBeerBallLeaderboard` — wins, losses, win_rate, `can_differential`
  (`+=` on win, `-=` on loss), plus the four streak fields via the existing
  `computeStreaksByPlayer`. Retains the `isVisible` filter and the
  `win_rate → wins` sort.
- `computeBeerBallHeadToHead`
- `computeBeerBallPartnerRecord`

### API routes

| Method | Path | Auth |
|---|---|---|
| GET | `/api/beer-ball` | `canReadGroup` — returns leaderboard + players |
| POST | `/api/beer-ball` | `getMemberForAPI` — ≥1 winner, ≥1 loser, `cans_left` number ≥ 0 |
| PUT | `/api/beer-ball/[id]` | `authorizeRowMutation` |
| DELETE | `/api/beer-ball/[id]` | `authorizeRowMutation` |
| PATCH | `/api/beer-ball/[id]` | `authorizeRowMutation` (approve) |
| GET | `/api/beer-ball/head-to-head` | `canReadGroup` |
| GET | `/api/beer-ball/record-with` | `canReadGroup` |

### Types (`lib/types.ts`)

`BeerBallGame`, `BeerBallGamePlayer`, `BeerBallLeaderboardEntry`,
`RecentBeerBallGame`, and `RecentBeerBallGame` added to the `RecentGame` union.

### Files

**New (7)**

- `app/api/beer-ball/route.ts`
- `app/api/beer-ball/[id]/route.ts`
- `app/api/beer-ball/head-to-head/route.ts`
- `app/api/beer-ball/record-with/route.ts`
- `components/log/BeerBallForm.tsx` — number input labelled "Cans Left"
- `components/admin/EditBeerBallGame.tsx`
- `app/g/[slug]/beer-ball/page.tsx`

**Edited (15)**

- `lib/types.ts`, `lib/stats.ts`, `lib/dashboard.ts`
- `components/BottomNav.tsx` (`ALL_GAMES`), `components/GroupNav.tsx`,
  `components/log/LogTabs.tsx`
- `components/RecentGames.tsx`, `components/HeadToHead.tsx`,
  `components/PartnerRecord.tsx`, `components/PlayerStats.tsx`
- `components/admin/AdminPanel.tsx` — union, `apiPath`, `gameSummary`,
  `badgeLabel`, `badgeColor`, edit row; plus the new Players tab
- `app/g/[slug]/page.tsx`, `app/g/[slug]/admin/page.tsx`, `app/admin/page.tsx`,
  `app/g/[slug]/me/page.tsx`, `app/g/[slug]/players/[name]/page.tsx`
- `app/page.tsx` — one marketing string

Admin game summary format: `Ada & Bo def. Cy & Dee (3 cans)`.

### Tests

`__tests__/lib/stats.test.ts` gains a `computeBeerBallLeaderboard` case covering
the differential sign on win vs. loss, the `isVisible` filter, and streaks.

---

## Out of Scope

- **`app/g/example/`** — the static landing-page demo. Cornhole and spikeball are
  not fully represented there either.
- **`app/api/recent/route.ts`** — the public cross-group feed carries only pong,
  beer die, hearts, pool and poker. Cornhole and spikeball were already left out;
  Beer Ball follows that precedent.
- **`opengraph-image.tsx`** — only pong, beer die and hearts have one.
- **`DEFAULT_PINS`** stays `['me', 'pong', 'beer-die']`. Beer Ball is pinnable from
  the "All Games" sheet.
- **A game registry refactor.** Adding a game touches ~20 files by copy-paste.
  Extracting a registry that declares each game once (slug, table, stat field,
  icon) would end that, but it is a refactor of seven working games in service of
  shipping one. Revisit when game #9 arrives.
- **Soft-delete / hidden players.** Blocking the delete covers the real use case
  (typos, duplicates, test entries) without a new column or an `isVisible` change.
