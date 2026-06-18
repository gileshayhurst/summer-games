# Poker Game Design

**Date:** 2026-06-18

## Overview

Add Poker as a new game option. Any number of players per session. Each player's result is entered as a dollar amount won (+) or lost (−). The leaderboard ranks players by total all-time profit.

---

## Data Model

**`poker_games` table**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `group_id` | uuid | foreign key → groups |
| `played_at` | timestamptz | default now() |
| `approved` | boolean | default true |

**`poker_game_players` table**
| Column | Type | Notes |
|---|---|---|
| `game_id` | uuid | foreign key → poker_games |
| `player_id` | uuid | foreign key → users |
| `group_id` | uuid | foreign key → groups |
| `amount_cents` | integer | positive = won, negative = lost (e.g. +$40 → 4000) |
| PRIMARY KEY | (game_id, player_id) | |

No DB constraint forcing amounts to sum to zero. The log form validates this in the UI and shows a warning if they don't balance.

Indexes on `(group_id)` and `(player_id)` for common queries.

---

## Types (`lib/types.ts`)

```ts
type PokerGame = {
  id: string
  played_at: string
}

type PokerGamePlayer = {
  game_id: string
  player_id: string
  amount_cents: number
  poker_games: PokerGame
}

type PokerLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  total_profit_cents: number
  win_sessions: number
  win_rate: number
}

type RecentPokerGame = {
  type: 'poker'
  id: string
  played_at: string
  results: { name: string; amount_cents: number }[]
}
```

`RecentGame` union updated to include `RecentPokerGame`.

---

## Stats (`lib/stats.ts`)

**`computePokerLeaderboard(users, gamePlayers)`**
- Aggregates `total_profit_cents`, `games_played`, `win_sessions` (sessions where `amount_cents > 0`) per player
- `win_rate = win_sessions / games_played`
- Filters out players with 0 games and applies `isVisible()`
- Sorted by `total_profit_cents` descending

No head-to-head or partner record functions — these don't apply to poker.

---

## API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/poker?group_id=` | Leaderboard + players list |
| POST | `/api/poker` | Log a game |
| PUT | `/api/poker/[id]` | Edit a game |
| DELETE | `/api/poker/[id]` | Delete a game |

POST body: `{ player_amounts: { player_id: string; amount_cents: number }[], group_id: string }`

---

## Log Form (`components/log/PokerForm.tsx`)

- Multi-player selector: pick which players participated in the session
- For each selected player, a dollar amount input appears (can be positive or negative)
- Running total shown — displays a warning (not a block) if amounts don't sum to $0
- On submit: POST to `/api/poker`, redirect to `/g/${groupSlug}/poker`

---

## Admin

**`AdminPokerGame` type** (exported from `app/admin/page.tsx`):
```ts
type AdminPokerGame = {
  id: string
  played_at: string
  player_amounts: { player_id: string; amount_cents: number }[]
}
```

**`EditPokerGame`** (`components/admin/EditPokerGame.tsx`): shows each player's amount as an editable dollar input. PUT to `/api/poker/[id]`.

**`AdminPanel`** updated: imports `EditPokerGame` + `AdminPokerGame`, adds `'poker'` to `AllGame` union, badge label `'POKER'`, badge color `'bg-teal-100 text-teal-700'`.

Both `app/admin/page.tsx` and `app/g/[slug]/admin/page.tsx` fetch poker games and pass them to `AdminPanel`.

---

## Pages

- `app/g/[slug]/poker/page.tsx` — leaderboard page
- `app/g/example/poker/page.tsx` — static example page (empty leaderboard, CTA card)

---

## Leaderboard Columns

| Key | Label | Format |
|---|---|---|
| `name` | Player | — |
| `games_played` | Games | — |
| `total_profit_cents` | Total Profit | `+$40.00` / `-$15.00` |
| `win_sessions` | Wins | — |
| `win_rate` | Win% | `62.5%` |

Sorted by `total_profit_cents` descending.

---

## Icon

`components/icons/PokerIcon.tsx` — SVG spade symbol (♠), black fill with radial highlight for depth. Registered in `GameIcon` for `type === 'poker'`.

---

## Navigation

- `components/BottomNav.tsx` — add `{ slug: 'poker', label: 'Poker', icon: '♠' }` to `ALL_GAMES`
- `components/log/LogTabs.tsx` — add `'poker'` to Tab type, import `PokerForm`, render it
- `components/GroupNav.tsx` — add `{ href: \`${base}/poker\`, label: 'Poker' }` before players
- `components/RecentGames.tsx` — add `'poker'` case: display each player's result inline, e.g. `"Jake +$40, Giles -$15, Noah -$25"`

---

## Home Page Card

Both `app/g/[slug]/page.tsx` and `app/g/example/page.tsx`:
- Add `{ key: 'poker', slug: 'poker', icon: '♠', name: 'Poker' }` to `GAME_CARDS`
- `getGameLeaders` fetches `poker_game_players` and computes poker leader (player with highest `total_profit_cents`)
- Home card stat line shows total profit instead of W/L: e.g. `"Jake · +$215 · 8 games"`

---

## Recent API Route

`app/api/recent/route.ts` — add `poker_games` query, map to `RecentPokerGame` entries in combined feed.

---

## Example Data (`app/g/example/data.ts`)

```ts
export const examplePokerLeaderboard = [] as const
export const examplePokerRecent = [] as const
```

---

## Out of Scope

- Tracking individual hands within a session (only session-level profit/loss)
- Buy-in amounts or stack sizes
- Game variant (Texas Hold'em, Omaha, etc.)
- Head-to-head or partner record stats
