# Example Group Design

**Date:** 2026-06-14
**Status:** Approved

## Problem

The "See an Example" link on the landing page points to `/g/summer-games` — the owner's real group. Random visitors can log fake games there, polluting real leaderboard data. Making summer-games read-only conditionally is impossible without a login system.

## Solution

Create a static `/g/example` route that shows a hardcoded snapshot of the current summer-games data. It looks identical to a real group page but has no Log or Admin access and never changes. The real summer-games group is completely untouched.

In Next.js App Router, a directory at `app/g/example/` takes precedence over the dynamic `app/g/[slug]/` route, so no routing changes are needed.

## Files to Create

### `app/g/example/data.ts`

A single file containing all hardcoded snapshot data:

```ts
export const EXAMPLE_GROUP_NAME = 'Summer Games'

export const examplePlayers = [/* name strings */]

export const examplePongLeaderboard = [/* {name, wins, losses, win_rate, cup_differential} */]
export const examplePongRecent = [/* RecentPongGame[] */]

export const exampleBeerDieLeaderboard = [/* ... */]
export const exampleBeerDieRecent = [/* ... */]

// ... same pattern for cornhole, spikeball, hearts
export const exampleRecentAll = [/* RecentGame[] — mixed, for home page */]
```

Data is populated during implementation by starting the dev server and fetching from the local API (`/api/pong?group_id=...`, `/api/recent?group_id=...`, etc.) then copying the JSON response into this file.

### `app/g/example/layout.tsx`

Server component layout. Mirrors `app/g/[slug]/layout.tsx` but:
- Passes `isExample={true}` to `GroupNav` and `BottomNav`
- No `GroupProvider` needed (no real group context)
- Group name comes from `EXAMPLE_GROUP_NAME` constant

### `app/g/example/page.tsx`

Home page. Same structure as `app/g/[slug]/page.tsx`:
- Game leader cards (5 game types) — reads top entry from each hardcoded leaderboard
- Recent games list — reads from `exampleRecentAll`
- No DB calls

### `app/g/example/players/page.tsx`

Simple list of hardcoded player names from `examplePlayers`. Same layout as the real players page but no add-player form or any mutation.

### `app/g/example/pong/page.tsx`, `beer-die/page.tsx`, `cornhole/page.tsx`, `spikeball/page.tsx`, `hearts/page.tsx`

Game leaderboard pages. Each:
- Renders `<Leaderboard>` with hardcoded entries and the same column config as the real page
- Renders `<RecentGames>` with hardcoded recent games
- Replaces `<HeadToHead>` and `<PartnerRecord>` with a CTA nudge:
  > "Want head-to-head stats and partner records for your crew? [Create your own group →]"
  Styled as a subtle card linking to `/create`

No `app/g/example/log/` or `app/g/example/admin/` pages — returns 404 if navigated to directly.

## Component Changes

### `components/GroupNav.tsx`

Add optional `isExample?: boolean` prop. When true:
- Hide the ⚙️ admin link
- Hide the "LOG GAME →" button (desktop)
- Keep all game nav links and the home button

### `components/BottomNav.tsx`

Add optional `isExample?: boolean` prop. When true:
- Replace the LOG+ center button with an empty spacer (same width, no link)
- Keep all game tabs and the More sheet

## Landing Page Change

`app/page.tsx`: change the "See an Example" link from `/g/summer-games` to `/g/example`.

## What Does NOT Change

- `app/g/[slug]/` — untouched, summer-games group fully functional
- `GroupNav` and `BottomNav` default behavior — `isExample` defaults to `false`, no change for real groups
- All API routes — the example makes zero API calls

## Data Freshness

The example data is a one-time snapshot. It will drift from the real summer-games data over time, which is intentional — the example is a stable demo, not a live mirror.
