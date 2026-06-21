# Leaderboard Sort — Design Spec

**Date:** 2026-06-21

## Overview

Add a per-game sort dropdown to each leaderboard page, allowing users to re-order the leaderboard by any stat column. Sorting is client-side (no additional network requests), using data already fetched by the server component.

## Data Model

The existing `Column` type in `components/Leaderboard.tsx` gains one optional field:

```typescript
type Column = {
  key: string
  label: string
  format?: (v: number | string) => string
  colorize?: boolean
  sortDirection?: 'asc' | 'desc'   // marks column as sortable; defines natural "best first" direction
}
```

Columns without `sortDirection` are display-only and do not appear in the dropdown. "Player (A–Z)" alphabetical sort is always included as a fixed option regardless of column config.

## Sort Directions Per Game

Each game's page defines `sortDirection` on the relevant columns:

| Game | Column | Direction | Rationale |
|---|---|---|---|
| Pong | wins | desc | most wins first |
| Pong | losses | asc | fewest losses first |
| Pong | win_rate | desc | highest first (default) |
| Pong | cup_differential | desc | highest first |
| Beer Die | wins | desc | most wins first |
| Beer Die | losses | asc | fewest losses first |
| Beer Die | win_rate | desc | highest first (default) |
| Beer Die | point_differential | desc | highest first |
| Poker | games_played | desc | most sessions first |
| Poker | total_profit_cents | desc | highest profit first (default) |
| Poker | win_sessions | desc | most wins first |
| Poker | win_rate | desc | highest first |
| Hearts | games_played | desc | most games first |
| Hearts | losses | asc | fewest losses first |
| Hearts | loss_rate | asc | lowest rate first (default) |
| Pool | wins | desc | most wins first |
| Pool | losses | asc | fewest losses first |
| Pool | win_rate | desc | highest first (default) |
| Pool | balls_differential | desc | highest first |
| Cornhole | wins | desc | most wins first |
| Cornhole | losses | asc | fewest losses first |
| Cornhole | win_rate | desc | highest first (default) |
| Cornhole | point_differential | desc | highest first |
| Spikeball | wins | desc | most wins first |
| Spikeball | losses | asc | fewest losses first |
| Spikeball | win_rate | desc | highest first (default) |
| Spikeball | point_differential | desc | highest first |

## Component Changes

### `components/Leaderboard.tsx`

- Add `'use client'` directive.
- Add `defaultSortKey: string` to `Props` — the column key matching the compute function's default sort order, shown as the initially selected dropdown option.
- Add `sortKey` state initialised to `defaultSortKey`.
- Sort entries via `useMemo` before rendering: for the active `sortKey`, look up its `sortDirection` from `columns`; for the `'name'` key use `'asc'`. Apply stable secondary sort by `name` to break ties.
- Render a right-aligned dropdown above the table. Options: `{ value: 'name', label: 'Player (A–Z)' }` plus one entry per column with `sortDirection` set, using `column.label` as the option label.
- Dropdown styled to match existing card/border aesthetic (small, uppercase label, `border-warm` border).

### Game Pages (all 7)

Each game page (`pong`, `beer-die`, `poker`, `hearts`, `pool`, `cornhole`, `spikeball`) and their corresponding example pages (`app/g/example/...`):

- Add `sortDirection` to the appropriate columns per the table above.
- Add `defaultSortKey` prop to `<Leaderboard>` call, matching the column the compute function naturally sorts by.

## What Does Not Change

- `computeXxxLeaderboard` functions — untouched; they continue to filter out players with 0 games and return data in default sort order.
- `HeadToHead`, `PartnerRecord`, `RecentGames` — untouched.
- The subtitle text on each page (e.g. "Ranked by win rate") — documents the default sort and stays as written.
- No new API routes, no new database queries.

## Edge Cases

- **Players with 0 games**: Already excluded by compute functions before data reaches `Leaderboard`. No change needed.
- **Ties**: Broken by secondary sort on `name` ascending, ensuring stable ordering.
- **Example pages**: Mirror the real game pages' column definitions, so sorting works automatically.
