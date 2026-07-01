# Beer Die Leaderboard Fixes Design
Date: 2026-06-30

## Overview
Two changes to the Beer Die leaderboard: (1) restore missing sinks/self-sinks columns, (2) add a win streak indicator next to player names.

## Fix 1: Sinks & Self-Sinks Columns

**Problem:** `computeBeerDieLeaderboard` already computes `sinks` and `self_sinks` per player, but the `columns` array in `app/g/[slug]/beer-die/page.tsx` never includes them, so they never appear.

**Fix:** Add two columns to the columns array:
- `{ key: 'sinks', label: 'Sinks', sortDirection: 'desc' }` — sortable descending
- `{ key: 'self_sinks', label: 'Self Sinks', sortDirection: 'asc' }` — sortable ascending (lower is better)

No changes to `lib/stats.ts` required.

## Fix 2: Win Streak Indicator

**Behavior:** Players with 3+ consecutive wins have their streak count shown next to their name as `{name} 🔥{streak}` (e.g. `Giles 🔥5`). Players with fewer than 3 consecutive wins show no indicator.

**Stats computation (`lib/stats.ts`):**
- Inside `computeBeerDieLeaderboard`, after processing all game players, compute each player's current win streak
- Group `gamePlayers` by `player_id`, sort each group by `beer_die_games.played_at` descending, walk from most recent backward counting consecutive wins
- Add `win_streak: number` to the returned `BeerDieLeaderboardEntry`

**Display (`app/g/[slug]/beer-die/page.tsx`):**
- Before passing entries to `<Leaderboard>`, mutate `entry.name` to append ` 🔥${entry.win_streak}` when `win_streak >= 3`
- No changes to the `Leaderboard` component needed

## Files Changed
- `lib/stats.ts` — add win streak computation
- `app/g/[slug]/beer-die/page.tsx` — add sinks columns + streak name mutation
