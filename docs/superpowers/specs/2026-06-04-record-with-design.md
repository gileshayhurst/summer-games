# Record With Teammate — Design Spec
**Date:** 2026-06-04

## Summary

Add a "Record With" section below the existing "Head-to-Head Against" widget on the Pong and Beer Die leaderboard pages. It shows two players' combined win/loss record when they played on the same team. Hearts is excluded — it is an individual game with no teams.

---

## Data Logic

Head-to-head **against** counts games where two players were on opposite sides.  
Record **with** counts games where two players were on the *same* side.

### Pong
Walk all `pong_game_players` rows for the two players. Build a per-game map of `winners: Set<id>` and `losers: Set<id>`. A game counts as a win if both players appear in `winners`; a loss if both appear in `losers`. Games where they were on opposite sides (head-to-head games) are ignored.

### Beer Die
Walk all `beer_die_games` rows involving either player. A game counts as a win if both IDs appear in `[winner1_id, winner2_id]`; a loss if both appear in `[loser1_id, loser2_id]`.

Both functions return the existing `HeadToHeadResult` type `{ wins: number; losses: number }` — no new types required.

---

## Files Changed

### `lib/stats.ts`
Add two new exported functions:

```ts
computePongPartnerRecord(player1Id, player2Id, gamePlayers): HeadToHeadResult
computeBeerDiePartnerRecord(player1Id, player2Id, games): HeadToHeadResult
```

### `app/api/pong/record-with/route.ts` (new)
GET handler. Params: `player1`, `player2`. Fetches `pong_game_players` for either player, calls `computePongPartnerRecord`, returns `{ result }`.

### `app/api/beer-die/record-with/route.ts` (new)
GET handler. Params: `player1`, `player2`. Fetches `beer_die_games` involving either player (same `.or()` query as the existing H2H route), calls `computeBeerDiePartnerRecord`, returns `{ result }`.

### `components/PartnerRecord.tsx` (new)
Client component. Props identical to `HeadToHead`: `{ players, currentPlayerId?, game }`.  
- Title label: **"Record With"**  
- Teammate dropdown placeholder: **"Select teammate..."**  
- Hits `/api/{game}/record-with`  
- Result display identical to `HeadToHead` (wins in green, losses in red)

### `app/pong/page.tsx`
Import `PartnerRecord` and render it directly below the existing `<HeadToHead>` block, passing the same `players` prop.

### `app/beer-die/page.tsx`
Same as above.

---

## Behaviour Details

- Both dropdowns follow the same logic as `HeadToHead`: if `currentPlayerId` is set, only the teammate dropdown shows; if not, both dropdowns show (leaderboard page mode).
- Selecting the same player in both slots is a no-op (returns null result), matching existing behaviour.
- No new Supabase tables required.
- No changes to existing API routes, types, or the `HeadToHead` component.

---

## Out of Scope

- Hearts (individual game — no teams)
- Player profile pages (not in scope for this iteration)
- "Top partner" aggregated stats
