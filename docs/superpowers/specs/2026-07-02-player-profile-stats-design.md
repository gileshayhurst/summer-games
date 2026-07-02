# Player Profile Stats Page

**Date:** 2026-07-02  
**Status:** Approved

## Problem

Clicking a player's name on the Players page (`/g/[slug]/players`) takes you to `/g/[slug]/players/[name]`, but that page is sparse (minimal stats, no recent activity, no streaks on most games) and errors on unclaimed players due to the `HeadToHead` component. The "My Dashboard" page (`/g/[slug]/me`) is far richer and should be the model for what a player profile shows.

## Goal

Make the public player profile page show the same rich stats view as "My Dashboard" — same game cards, same streaks, same recent activity feed — but for any named player. Remove the error for unclaimed players.

## Approach

Extract all rendering logic from `me/page.tsx` into a shared `PlayerStats` server component. Both the me page and the player profile page become thin wrappers that fetch data and pass it in.

## Files Changed

### New: `components/PlayerStats.tsx`

A server component (React, no `'use client'`) that owns all stats rendering.

**Props:**
- `playerName: string` — displayed as the page heading (overridden by the me page which renders its own "My Dashboard" heading above the component)
- `playerId: string`
- `users: User[]`
- `pongPlayers: PongGamePlayer[]`
- `beerDiePlayers: BeerDieGamePlayer[]`
- `beerDieSinks: BeerDieSink[]`
- `heartsPlayers: HeartsGamePlayer[]`
- `cornholePlayers: CornholeGamePlayer[]`
- `spikeballPlayers: SpikeballGamePlayer[]`
- `poolPlayers: PoolGamePlayer[]`
- `pokerPlayers: PokerGamePlayer[]`

**Internal logic (moved from `me/page.tsx`):**
- Computes all 7 leaderboards via the `lib/stats` functions
- Finds the target player's entry in each leaderboard
- Calls `getLeaderboardRank` for each game
- Builds recent activity via `mergeRecentActivity` filtered to `playerId`
- Sorts game cards via `sortCardsByPlayed`

**Renders:**
- Responsive card grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) of the 7 game cards, sorted by most-played first
- Each card shows the same stats and streaks as the me page (PongCard, BeerDieCard, CornholeCard, SpikeballCard, PoolCard, PokerCard, HeartsCard — all moved here)
- Recent Activity feed at the bottom

**Does not render:**
- Page heading (each wrapper page renders its own)
- LogOutButton
- Join / Claim CTAs
- "View full public profile" link

### Modified: `app/g/[slug]/me/page.tsx`

- Keeps all 9 Supabase queries unchanged
- Drops inline card components (PongCard, BeerDieCard, etc.) — they move to `PlayerStats`
- Drops `sortCardsByPlayed` call and recent activity rendering — they move to `PlayerStats`
- Removes the "View full public profile →" link (redundant: both pages now show identical content)
- Renders: "My Dashboard" heading + "Signed in as [name]" subtitle + LogOutButton, then `<PlayerStats ... />`
- Early returns for unauthenticated / no-player-claimed cases remain unchanged

### Rewritten: `app/g/[slug]/players/[name]/page.tsx`

- Runs the same 9 Supabase queries as the me page (all group-scoped game player data)
- Looks up the target player by decoded name from `users`; calls `notFound()` if not found
- Renders: player's name as a `<h1>` heading, then `<PlayerStats ... />`
- No HeadToHead component (dropped)
- No auth gate beyond the group layout's existing `requireMembership` check
- Unclaimed players are found in `users` and their stats compute normally

## Behaviour Differences: Me Page vs Profile Page

| | Me page (`/me`) | Profile page (`/players/[name]`) |
|---|---|---|
| Heading | "My Dashboard" + "Signed in as X" | Player's name |
| LogOutButton | Yes | No |
| Join / Claim CTAs | Yes (if applicable) | No |
| "View full public profile" link | **Removed** | N/A |
| Stats content | Via `PlayerStats` | Via `PlayerStats` (identical) |
| Recent activity | Via `PlayerStats` | Via `PlayerStats` (identical) |

## Error Fix

The current `players/[name]/page.tsx` errors on unclaimed players due to the `HeadToHead` component. This is fixed implicitly: `PlayerStats` does not use `HeadToHead`, and unclaimed players exist in the `users` table so stats compute normally with whatever games they've played.

## Out of Scope

- Navigation link to player profiles (user navigates manually via the Players page)
- Example group (`/g/example`) — static demo, not changed
