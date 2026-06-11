# Game Approval Design

**Date:** 2026-06-11
**Status:** Approved

## Problem

Summer Games is a public website — anyone with a group link can currently log games immediately to the leaderboard. This allows griefing (fake results polluting real stats). The "See an Example" link on the landing page makes this especially visible since it sends strangers directly to the summer-games group.

## Solution

Add an approval gate: logged games are held as pending until the group admin approves them. Only approved games appear on leaderboards and stats. Admins also get instructions on the log page so new groups know how to find the admin panel.

## Schema Changes

Add `approved boolean DEFAULT false NOT NULL` to three tables:
- `pong_games`
- `beer_die_games`
- `hearts_games`

**Migration must also backfill existing rows to `approved = true`** so current leaderboard data is unaffected.

```sql
ALTER TABLE pong_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE beer_die_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE hearts_games ADD COLUMN approved boolean NOT NULL DEFAULT false;

UPDATE pong_games SET approved = true;
UPDATE beer_die_games SET approved = true;
UPDATE hearts_games SET approved = true;
```

## API Changes

### GET routes — add approved filter

All read endpoints that return game data for leaderboards/stats must add `.eq('approved', true)`:
- `GET /api/pong` — leaderboard
- `GET /api/pong/head-to-head`
- `GET /api/pong/record-with`
- `GET /api/beer-die`
- `GET /api/beer-die/head-to-head`
- `GET /api/beer-die/record-with`
- `GET /api/hearts`
- `GET /api/recent` — recent games on group home

### POST routes — no change needed

`POST /api/pong`, `/api/beer-die`, `/api/hearts` — `approved` defaults to `false` at the DB level, no code change required.

### New PATCH endpoints — approve a game

Three new endpoints, one per game type:
- `PATCH /api/pong/[id]` — sets `approved = true` for the given game
- `PATCH /api/beer-die/[id]` — sets `approved = true`
- `PATCH /api/hearts/[id]` — sets `approved = true`

These sit alongside the existing PUT (edit) and DELETE endpoints in the same `[id]` route files.

## Admin Panel Changes

Add a **Pending** section at the top of `components/admin/AdminPanel.tsx`, above the existing approved game list.

- Pending games are fetched separately: same data shape as approved games, but filtered by `approved = false`
- Each pending game shows: game type badge, summary (players + result), date, and an **Approve** button
- Approving calls the relevant PATCH endpoint and reloads the page
- If there are no pending games, the Pending section is hidden entirely
- The section heading reads: "Pending Approval" with a count badge (e.g. "Pending Approval (2)")

The existing edit/delete buttons remain on approved games. Pending games only get Approve + Delete (no edit — approve first, then edit if needed).

The admin panel already requires PIN entry before rendering, so the approve action is already protected.

## Log Page Changes

Add an info banner to `app/g/[slug]/log/page.tsx` above the `<LogTabs>` component:

```
🔒 Games are reviewed before appearing on the leaderboard — this keeps
things fair on a public site. To approve submissions, go to
[your group link]/admin (PIN required).
```

The banner is styled subtly (slate background, small text) so it doesn't dominate the page but is clearly readable. The `/admin` path is shown as literal text (not a link) since the URL varies per group.

## What Does NOT Change

- The log form itself — anyone can still submit a game without any friction
- The PIN system — no new auth, admin approval uses the existing PIN gate
- Player management — adding players remains open (no approval needed)
- The create group flow — unchanged
