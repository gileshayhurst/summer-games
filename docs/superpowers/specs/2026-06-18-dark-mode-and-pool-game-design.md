# Dark Mode + Pool Game Design

**Date:** 2026-06-18

## Overview

Two independent features:
1. Automatic dark mode that mirrors the iOS/system `prefers-color-scheme` setting, using a Warm Dark gray palette.
2. Pool as a new game option — team-based, win/loss with a "balls won by" differential, matching the cornhole/spikeball data shape.

---

## Feature 1: Dark Mode

### Approach

CSS custom properties in `globals.css`, referenced by Tailwind. No component files need to change — all Tailwind utility classes (`bg-bg`, `bg-card`, `text-muted`, `border-warm`) resolve through CSS variables automatically.

### Color Tokens

| Token | Light | Dark (Warm Dark) |
|---|---|---|
| `bg` | `#fffbf0` | `#1c1917` |
| `card` | `#fff7ed` | `#292524` |
| `warm` | `#f0e0b8` | `#44403c` |
| `muted` | `#78716c` | `#a8a29e` |

Tokens that remain unchanged in dark mode: `win` (#f97316), `loss` (#ef4444), `gold` (#eab308), `brand` (#c2410c), `forest` (#1A4731).

Body text color (`text-stone-900` in light) must switch to a light tone in dark mode. This is handled via a `@media (prefers-color-scheme: dark)` rule on `body` in `globals.css` rather than in the Tailwind config, since `stone-900` is not a custom token.

### Files Changed

- `tailwind.config.ts` — change each custom hex value to `var(--color-<token>)`
- `app/globals.css` — define CSS variables under `:root` (light values) and override the four dark tokens plus body text under `@media (prefers-color-scheme: dark)`
- `app/layout.tsx` — update `themeColor` from a single string to a light/dark array (Next.js Metadata supports `[{ media: '(prefers-color-scheme: light)', color: '...' }, { media: '(prefers-color-scheme: dark)', color: '...' }]`). Dark theme color: `#1c1917`.

### What Does Not Change

- All component files remain untouched.
- `statusBarStyle: 'black-translucent'` stays as-is.
- Light mode appearance is identical to today.

---

## Feature 2: Pool Game

### Data Model

**`pool_games` table**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `group_id` | uuid | foreign key → groups |
| `balls_differential` | integer | ≥ 1 |
| `played_at` | timestamptz | default now() |

**`pool_game_players` table**
| Column | Type | Notes |
|---|---|---|
| `game_id` | uuid | foreign key → pool_games |
| `player_id` | uuid | foreign key → users |
| `side` | text | 'winner' or 'loser' |

Auto-approve trigger applied on insert (matching the pattern from the existing `ff530af` migration).

### API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/pool` | Log a game |
| GET | `/api/pool` | Fetch games for a group (query param: `group_id`) |
| DELETE | `/api/pool/[id]` | Delete a game |
| GET | `/api/pool/head-to-head` | Head-to-head stats between two players |
| GET | `/api/pool/record-with` | Wins/losses when paired with a teammate |

### Components

- `components/log/PoolForm.tsx` — winner team selector, loser team selector, "Balls Won By" number input (≥ 1). Mirrors `CornholeForm.tsx` exactly, with field name `balls_differential`.
- `components/admin/EditPoolGame.tsx` — inline edit for admin panel. Mirrors `EditCornholeGame.tsx`.

### Pages

- `app/g/[slug]/pool/page.tsx` — leaderboard page. Mirrors the cornhole page.
- `app/g/[slug]/pool/opengraph-image.tsx` — OG image.
- `app/g/example/pool/page.tsx` — static example page using hardcoded data.

### Navigation

Pool added to `ALL_GAMES` in `components/BottomNav.tsx` and the `tabs` array in `components/log/LogTabs.tsx`:

```ts
{ slug: 'pool', label: 'Pool', icon: '🎱' }
```

`GameIcon.tsx` handles `🎱` via the existing emoji fallback — no custom SVG icon needed.

Default pinned tabs (`DEFAULT_PINS`) remain `['pong', 'beer-die', 'hearts']`. Pool is available in the "More" sheet for users to pin.

### Types (`lib/types.ts`)

```ts
type PoolGame = {
  id: string
  balls_differential: number
  played_at: string
}

type PoolGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  pool_games: PoolGame
}

type PoolLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  ball_differential: number
}

type RecentPoolGame = {
  type: 'pool'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  balls_differential: number
}
```

`RecentGame` union in `lib/types.ts` updated to include `RecentPoolGame`.

### Stats

`lib/stats.ts` gets a `getPoolLeaderboard` function following the same pattern as `getCornholeLeaderboard` — aggregate wins, losses, win rate, and ball differential from the DB.

---

## Out of Scope

- Soccer and golf (decided against during design).
- Manual dark mode toggle (system preference is sufficient).
- Custom pool icon SVG (emoji is adequate).
- Changing `DEFAULT_PINS` to include pool.
