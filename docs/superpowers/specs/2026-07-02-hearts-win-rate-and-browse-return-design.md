# Hearts Win Rate & Browse Return Button Design

**Date:** 2026-07-02

## Overview

Two independent UI improvements:
1. Switch the Hearts leaderboard from loss percentage to win percentage, consistent with all other game leaderboards.
2. Add a "← Browse" return button in the group nav when a user arrived from the Discover page.

---

## Feature 1: Hearts Win Rate

### Goal

Hearts currently ranks players by lowest loss rate. All other game leaderboards rank by highest win rate. This change makes Hearts consistent.

### Stats layer (`lib/stats.ts`)

`computeHeartsLeaderboard` currently tracks `{ played, losses }` per player and returns `loss_rate`. Change it to compute:
- `wins = s.played - s.losses`
- `win_rate = s.played > 0 ? wins / s.played : 0`

Return `wins` and `win_rate` instead of `losses` and `loss_rate`. Sort descending by `win_rate` (highest first), falling back to `games_played` descending.

### Type (`lib/types.ts`)

Replace `HeartsLeaderboardEntry` fields:
- Remove: `losses`, `loss_rate`
- Add: `wins`, `win_rate`

### Hearts leaderboard page (`app/g/[slug]/hearts/page.tsx`)

- Columns: `Player`, `Games` (desc), `Wins` (desc), `Win%` (percent format, desc)
- `defaultSortKey`: `win_rate`
- Subtitle: `"Ranked by highest win rate"`

### Example hearts page (`app/g/example/hearts/page.tsx`)

Same column changes as above.

### Example data (`app/g/example/data.ts`)

Replace each entry's `losses`/`loss_rate` fields with `wins`/`win_rate`. Derive from existing values: `wins = games_played - losses`, `win_rate = wins / games_played`.

### Player stats component (`components/PlayerStats.tsx`)

`HeartsCard` currently shows: Games, Losses, Loss%, Streak, Max Streak.
Change to: Games, Wins, Win%, Streak, Max Streak.

### Tests (`__tests__/lib/stats.test.ts`)

Update `computeHeartsLeaderboard` assertions to use `wins` and `win_rate` instead of `losses` and `loss_rate`. Verify sort order is descending by win rate.

---

## Feature 2: Browse Return Button

### Goal

When a user navigates to a group from the `/discover` page, show a "← Browse" button in `GroupNav` so they can return without hunting for a home button. The button should persist as they navigate between game tabs within the group.

### Discover page (`app/discover/page.tsx`)

Extract the group card list into a `'use client'` component `DiscoverList`. Each card's `onClick` calls `sessionStorage.setItem('fromDiscover', '1')` before the link navigates. The rest of the page (heading, layout) stays as a server component.

### GroupNav (`components/GroupNav.tsx`)

Add a `useEffect` that runs on mount and reads `sessionStorage.getItem('fromDiscover')`. If set, store it in a local `showBrowseButton` state variable.

Render a "← Browse" button/link in the nav top-left area (to the left of or below the home icon) when `showBrowseButton` is true. On click:
1. `sessionStorage.removeItem('fromDiscover')`
2. `router.push('/discover')` (using `useRouter` from `next/navigation`)

The button uses the same muted text style as other secondary nav elements so it doesn't compete visually with the group name.

### Placement

On mobile, the "← Browse" button sits in the nav bar to the left of the group name (replacing or alongside the home icon area). On desktop, it appears at the far left of the nav bar before the group name. Exact placement defers to what fits without crowding the existing nav items.

---

## Out of Scope

- No changes to how Hearts games are recorded (the `lost` field in the DB remains the source of truth).
- No changes to other game leaderboards.
- No changes to the group nav for users who arrived directly (no session storage flag = no button).
