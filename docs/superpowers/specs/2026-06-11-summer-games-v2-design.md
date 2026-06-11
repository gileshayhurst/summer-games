# Summer Games v2 — Design Spec

**Date:** 2026-06-11

## Overview

Four additions to the existing Summer Games tracker:

1. **Suggest a Game / Feedback Form** — replace the landing page mailto link with an in-site form stored in Supabase, viewable in the global admin page.
2. **Cornhole & Spikeball** — two new game types mirroring beer die exactly (no sinks mechanic).
3. **Recent Games Panel on Game Pages** — show the last 5 game-specific results to the right of the head-to-head widgets on each game page.
4. **Home Button with Confirmation Modal** — a house button on the far left of the group nav that navigates to `/` after a confirmation step.

---

## Feature 1: Suggest a Game / Feedback Form

### What changes

- **Landing page (`app/page.tsx`)**: Replace the `<a href="mailto:...">` link with an inline form. The surrounding text changes to: *"Want to suggest a game or give other feedback?"*
- **New API route (`app/api/suggestions/route.ts`)**: `POST` handler writes to a new `suggestions` Supabase table. Returns `{ success: true }` or `{ error }`.
- **New Supabase table (`suggestions`)**: global (no `group_id`).
- **Global admin page (`app/admin/page.tsx`)**: New "Suggestions" section at the bottom lists all submissions newest-first.

### Form fields (all optional)

| Field | Input type |
|-------|-----------|
| Name | text |
| Game suggestion | text |
| Feedback / message | textarea |
| Email | email |

### Supabase table: `suggestions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | nullable |
| game_suggestion | text | nullable |
| feedback | text | nullable |
| email | text | nullable |
| created_at | timestamptz | default now() |

### Admin view

The global admin page (`/admin`) gets a "Suggestions" section showing all rows from the `suggestions` table, ordered by `created_at DESC`. Each row displays: date, name (or "Anonymous"), email (if present), game suggestion (if present), feedback (if present).

---

## Feature 2: Cornhole & Spikeball

### Schema

Two pairs of tables, both mirroring `beer_die_games` / `beer_die_game_players`:

#### `cornhole_games`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| points_differential | int | How many points the winning team won by (≥ 1) |
| played_at | timestamptz | |
| group_id | uuid FK → groups | |
| approved | boolean | default false |

#### `cornhole_game_players`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_id | uuid FK → cornhole_games | |
| player_id | uuid FK → users | |
| side | text | `'winner'` or `'loser'` |
| group_id | uuid FK → groups | |

Same schema repeated for `spikeball_games` and `spikeball_game_players`.

### API routes

Mirror the beer die routes exactly:

- `app/api/cornhole/route.ts` — `GET` (list approved games) + `POST` (log new game)
- `app/api/cornhole/[id]/route.ts` — `PATCH` (approve) + `DELETE`
- `app/api/cornhole/head-to-head/route.ts` — head-to-head stats
- `app/api/cornhole/record-with/route.ts` — partner record stats
- Same four routes for spikeball

### Pages

- `app/g/[slug]/cornhole/page.tsx` — same structure as beer die page (leaderboard + H2H + partner record + recent games panel)
- `app/g/[slug]/spikeball/page.tsx` — same

### Log forms

- `components/log/CornholeForm.tsx` — copy of `BeerDieForm` with sinks section removed. Fields: Winning Team, Losing Team, Points Won By.
- `components/log/SpikeballForm.tsx` — identical to CornholeForm.
- `LogTabs` gains two new tabs: `🌽 Cornhole` and `🏐 Spikeball`.

### Stats

- `lib/stats.ts` gets `computeCornholeLeaderboard` and `computeSpikeballLeaderboard` — copies of `computeBeerDieLeaderboard` without sinks logic.
- Leaderboard columns: Player, W, L, Win%, Pt Diff (same as beer die).

### Navigation & home page

- `GroupNav` gains `Cornhole` and `Spikeball` nav items.
- Group home page grid expands from 3 to 5 game tiles.
- Admin panel gains Cornhole and Spikeball sections (approved games + pending approval), mirroring beer die.
- `RecentGame` union type in `lib/types.ts` gains `RecentCornholeGame` and `RecentSpikeballGame`.
- Group home page recent games feed includes cornhole and spikeball games.

### Types

```ts
export type RecentCornholeGame = {
  type: 'cornhole'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentSpikeballGame = {
  type: 'spikeball'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}
```

---

## Feature 3: Recent Games Panel on Game Pages

### Layout change

**Pong, Beer Die, Cornhole, Spikeball** — these pages have H2H + Partner Record widgets. They change from:

```
[Leaderboard]
[max-w-xs: H2H + Partner Record]   [blank space]
```

to:

```
[Leaderboard]
[grid grid-cols-2 gap-8]
  [H2H + Partner Record]    [Recent Games (last 5)]
```

The existing `<div className="max-w-xs space-y-4">` becomes the left column of a two-column grid. The right column is a new "Recent Games" section with a `RECENT GAMES` label and the last 5 approved games for that specific game type, rendered with the existing `RecentGames` component.

**Hearts** — has no H2H or Partner Record widgets (individual game). Recent games for hearts are placed below the leaderboard as a standalone section, no two-column layout.

### RecentGames component updates

`components/RecentGames.tsx` has a hardcoded `gameEmoji` map and `formatGame` function. Both need entries for `cornhole` (🌽) and `spikeball` (🏐), formatting the same as beer die (winners beat losers, won by N pts).

### Data fetching

Each game page fetches its recent 5 approved games server-side in the same `Promise.all` as the rest of the page data — no additional network round-trip. Hearts page shows only hearts games; pong only pong; etc.

---

## Feature 4: Home Button with Confirmation Modal

### Placement

A home button is added as the leftmost element in `GroupNav`, before the group name. It uses a house icon (🏠 emoji or SVG). Styled as a small muted icon button.

### Behaviour

1. User clicks the home button.
2. A modal overlay appears with:
   - Text: *"This will take you back to the 'create a group screen'."*
   - **Confirm** button → navigates to `/`
   - **Cancel** button → closes the modal
3. Modal is implemented with `useState` inside `GroupNav` (already a `'use client'` component).
4. Clicking outside the modal or pressing Escape closes it.

### Modal styling

Consistent with the existing card/warm palette: white overlay backdrop, card-background modal box, warm border, same button styles as elsewhere in the app.

---

## Open questions resolved

- Suggestions are global (no `group_id`) and visible only in the global `/admin` page.
- All form fields on the suggestions form are optional.
- Recent games panel shows last 5, game-specific only.
- Cornhole and spikeball have no sinks mechanic.
- Home button confirmation text: *"This will take you back to the 'create a group screen'."*
