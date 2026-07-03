# Loss Streaks Design

**Date:** 2026-07-03
**Status:** Approved

## Overview

Add loss streaks as a full mirror of win streaks across every game. Loss streaks track consecutive losses, use 😂 instead of 🔥, and appear everywhere win streaks appear: player profile stat cards, game leaderboard name decorations, and home page tile badges.

## Stats Layer (`lib/stats.ts`)

### `computeStreaks`

Extend the existing single-pass function to track both streaks simultaneously:

```ts
export function computeStreaks(resultsOldestFirst: boolean[]): {
  current: number; max: number; currentLoss: number; maxLoss: number
}
```

One loop, two running counters (`running` for wins, `runningLoss` for losses). When `isWin` is true: increment `running`, reset `runningLoss`. When false: increment `runningLoss`, reset `running`. Track `max` and `maxLoss` at each step.

### `computeStreaksByPlayer`

Return type extends to `Map<string, { current: number; max: number; currentLoss: number; maxLoss: number }>`. No logic change — just passes the extended `computeStreaks` result through.

### Per-game leaderboard compute functions (all 7)

Each function destructures `currentLoss` and `maxLoss` alongside `current` and `max`, and includes them in returned entries as `current_loss_streak` and `max_loss_streak`.

Hearts and Poker compute streaks inline (not via `computeStreaksByPlayer`) — both already call `computeStreaks` directly, so they get the new fields for free once `computeStreaks` is extended.

### `topLossStreaks`

New function mirroring `topStreaks`:

```ts
export function topLossStreaks<E extends { name: string; current_loss_streak: number }>(
  entries: E[],
  lossesOf: (e: E) => number
): { name: string; streak: number }[]
```

Filters for `current_loss_streak >= 3`, sorts descending by streak then by losses, slices top 3.

## Types (`lib/types.ts`)

All seven `*LeaderboardEntry` types (`PongLeaderboardEntry`, `BeerDieLeaderboardEntry`, `CornholeLeaderboardEntry`, `SpikeballLeaderboardEntry`, `HeartsLeaderboardEntry`, `PoolLeaderboardEntry`, `PokerLeaderboardEntry`) gain:

```ts
current_loss_streak: number
max_loss_streak: number
```

`HeartsLeaderboardEntry` also gains `losses: number` — it was already computed internally in `computeHeartsLeaderboard` but never included in the returned entry, causing silent `NaN` on the home page leader card. This is fixed as part of this work.

## Dashboard Utils (`lib/dashboard.ts`)

New exported function:

```ts
export function formatLossStreak(value: number): string {
  return value >= 3 ? `😂${value}` : String(value)
}
```

Threshold matches `formatStreak` (≥ 3).

## Player Stats (`components/PlayerStats.tsx`)

Each game card's `StatGrid` gets two new `StatCard`s after the existing Streak / Max Streak cards:

- `Loss Streak` → `formatLossStreak(entry.current_loss_streak)`
- `Max Loss Streak` → `formatLossStreak(entry.max_loss_streak)`

Import `formatLossStreak` alongside `formatStreak`.

## Home Page Tiles (`app/g/[slug]/page.tsx`)

`GameLeader` type gains:

```ts
coldStreaks: { name: string; streak: number }[]
```

`toLeader` is updated to accept and pass through `coldStreaks`. Each game calls `topLossStreaks` and passes the result to `toLeader`, using the same loss-count accessor used for `topStreaks`:

- All 7 games: `byLosses = (e) => e.losses` (Hearts will now include `losses` in its entry — see Types section)

In the tile JSX, cold streak badges render immediately after the hot streak badges in the same top-right flex column, using `😂{streak} {name}` with the same `text-[10px] font-bold leading-tight whitespace-nowrap` styling. Color: `text-blue-500` (to contrast with `text-amber-600` for hot streaks).

## Game Leaderboard Pages (all 7)

The name-decoration pattern (`name: entry.current_streak >= 3 ? \`🔥...\` : entry.name`) extends to also handle loss streaks. Since a player cannot simultaneously hold a win streak and a loss streak, the two conditions are mutually exclusive:

```ts
name: entry.current_streak >= 3
  ? `🔥${entry.current_streak} ${entry.name}`
  : entry.current_loss_streak >= 3
    ? `😂${entry.current_loss_streak} ${entry.name}`
    : entry.name
```

Applied in all 7 game pages: pong, beer-die, cornhole, spikeball, pool, poker, hearts.

## Tests (`__tests__/lib/stats.test.ts`)

Extend existing `computeStreaks` tests to assert `currentLoss` and `maxLoss`. Add cases for:
- Pure loss streaks
- Interleaved win/loss runs
- All wins (maxLoss = 0)
- All losses (max = 0)
