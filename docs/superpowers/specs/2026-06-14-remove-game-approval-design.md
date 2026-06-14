# Remove Game Approval Gate Design

**Date:** 2026-06-14
**Status:** Approved

## Context

The approval gate was added on 2026-06-11 (see `2026-06-11-game-approval-design.md`) to prevent griefing on a public site. The decision is now to remove the gate so games appear on the leaderboard immediately after submission. The code must be preserved for easy re-enablement.

## What Changes

### 1. New SQL migration — auto-approve by default

Change the DB default for `approved` on all five game tables from `false` to `true`, and backfill any currently-pending rows:

```sql
-- Change default so new games are auto-approved
ALTER TABLE pong_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE beer_die_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE cornhole_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE spikeball_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE hearts_games ALTER COLUMN approved SET DEFAULT true;

-- Approve any currently pending games
UPDATE pong_games SET approved = true WHERE approved = false;
UPDATE beer_die_games SET approved = true WHERE approved = false;
UPDATE cornhole_games SET approved = true WHERE approved = false;
UPDATE spikeball_games SET approved = true WHERE approved = false;
UPDATE hearts_games SET approved = true WHERE approved = false;
```

This is the only change needed for the data layer. POST routes do not need to be touched.

### 2. Archive approval UI code

Save a self-contained snapshot of all approval-related frontend code to `docs/superpowers/plans/approval-system-archive.md` before removing it. This file is the re-implementation reference.

### 3. Clean up admin page (`app/g/[slug]/admin/page.tsx`)

Remove the ten pending-game queries (two per game type — one for pending, one for approved) — replace with single queries that fetch all games without the `approved` filter. Remove the pending props passed to `AdminPanel`.

### 4. Clean up AdminPanel (`components/admin/AdminPanel.tsx`)

Remove:
- `pendingPongGames`, `pendingBeerDieGames`, `pendingCornholeGames`, `pendingSpikeballGames`, `pendingHeartsGames` props
- `pendingGames` array construction
- `approveLoading` state
- `handleApprove` function
- The approve button in `GameRow`
- The "Pending Approval" section at the top of the rendered output
- The `isPending` prop on `GameRow` (all games are editable)

### 5. Remove log page approval banner (`app/g/[slug]/log/page.tsx`)

The banner added in the original approval design ("Games are reviewed before appearing on the leaderboard…") is no longer accurate. Remove it.

## What Does NOT Change

- API `PATCH /api/[game]/[id]` endpoints — kept intact (approve-by-ID still functional if the gate is re-enabled)
- All leaderboard GET queries that filter `.eq('approved', true)` — kept as-is (with default=true, all new games satisfy this filter)
- `supabase/migration-approval.sql` — kept in git history, not deleted

## Re-enabling Approval

To restore the gate:
1. Run a migration to set `DEFAULT false` on the five game tables
2. Restore the archived code from `docs/superpowers/plans/approval-system-archive.md`
3. Re-add the log page approval banner to `app/g/[slug]/log/page.tsx`
