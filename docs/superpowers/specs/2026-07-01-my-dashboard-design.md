# My Dashboard

## Goal

Give signed-in players a single page to see all of their own stats for a group, across every game type, without hunting through individual leaderboards. Must work well on both desktop and mobile.

## Scope

Per-group only. The dashboard lives at `/g/[slug]/me` and shows the signed-in member's stats for that group — it does not aggregate across groups. This matches the existing architecture, where every game table, leaderboard, and profile page is already scoped by `group_id`, and there is currently no global (cross-group) nav or layout to hang an aggregate view off of.

## Route & access

- New file: `app/g/[slug]/me/page.tsx`, a server component inside the existing `/g/[slug]` layout (so auth, `GroupNav`, and `BottomNav` are already wired up).
- Calls `requireMembership(slug)` (same helper the group home page uses) to get the signed-in member and their `player_id`.
- If the member has no `player_id` claimed yet, render only the existing "You haven't claimed a player yet → Claim" prompt (same copy/style as on the group home page) and skip all stats content.

## Per-game content

For each of the 7 games (Pong, Beer Die, Hearts, Cornhole, Spikeball, Pool, Poker):

1. Run the existing `compute*Leaderboard` function from `lib/stats.ts` and find this player's entry.
2. Render a stat grid using the same `Stat` component pattern as `players/[name]/page.tsx`:
   - Pong: Wins, Losses, Win%, Cup Diff
   - Beer Die: Wins, Losses, Win%, Point Diff (plus existing sinks/win-streak data where already surfaced)
   - Hearts: Games, Losses, Loss%
   - Cornhole: Wins, Losses, Win%, Point Diff
   - Spikeball: Wins, Losses, Win%, Point Diff
   - Pool: Wins, Losses, Win%, Balls Diff
   - Poker: Games, Profit, Win%
3. Show the player's **leaderboard rank** for that game (e.g. "#2 of 8"), computed as the player's index in the sorted leaderboard array + 1, out of entries with `games_played > 0`.
4. If the player has no games logged for that game type, show "No games yet" instead of an empty grid (matches existing profile page behavior).

## Recent activity feed

Query each of the 7 `*_game_players` tables directly, filtered by `group_id` + this `player_id` (same join pattern already used in `players/[name]/page.tsx`), joined to the parent game row for `played_at` and the game-specific score field. Merge all 7 result sets, sort by `played_at` descending, and take the latest 10.

Each row renders as a single compact line: game icon, game name, date, and a short result string specific to that game (e.g. "Won · 3 cups left", "Lost · -12 pts", "+$14.50"). This is simpler than reconstructing full winner/loser name lists (which would require extra queries per game to find all participants) and works uniformly across both team games and solo-perspective games like Poker and Hearts.

This is a dedicated query for this page — it does not reuse the group home page's `getRecentGames`, because that function caps results at 10 per game type *before* merging across all players, which could under-report a specific player's activity if filtered after the fact.

## Layout

Desktop and mobile share the same structure, differing only in grid columns:

```
My Dashboard
Signed in as <PlayerName>

[Game card] [Game card] [Game card]   ← grid-cols-1 (mobile) / sm:grid-cols-2 / lg:grid-cols-3
[Game card] [Game card] [Game card]
[Game card]

Recent Activity
🏓 Pong · Jul 1 · Won, 3 cups left
♠ Poker · Jun 29 · +$14.50
...

View full public profile →
```

- Each game card: icon + name + rank badge in the header (e.g. "#2 of 8"), then the stat mini-grid underneath, in a bordered card (`bg-card`/`border-warm`, consistent with the rest of the app).
- Recent Activity is a single list below the card grid (not a two-column layout — there's only one list here, unlike the leaderboard pages which pair head-to-head + recent games side by side).
- A "View full public profile →" link at the bottom routes to `/g/[slug]/players/[name]` for anyone who wants head-to-head or partner-record detail, which stays out of scope for this page.

## Navigation

- Add a **"Me"** entry to `GroupNav`'s desktop nav item list.
- Add a **"Me"** entry to `BottomNav`'s `ALL_GAMES` list, so it's reachable from the mobile "More" sheet and pinnable like any other tab. Not a default pin.

## Edge cases

- Member without a claimed player: claim prompt only, no cards or feed.
- Claimed player with zero games logged anywhere: all game cards show "No games yet"; Recent Activity shows "No games yet — go log one!" (existing empty-state copy).
- Private groups: access control already handled by `requireMembership` at the layout level — no additional auth logic needed.

## Bundled fix: `players/[name]` profile page

The existing profile page at `app/g/[slug]/players/[name]/page.tsx` currently only covers Pong, Beer Die, and Hearts — it was never updated when Cornhole, Spikeball, Pool, and Poker were added. Since the new dashboard links out to this page for head-to-head detail, and the gap is a straightforward missing-coverage bug (not a design change), it will be updated in the same pass to include stat sections for all 7 games using the leaderboard functions that already exist in `lib/stats.ts`.

## Out of scope

- Cross-group aggregation.
- Highlights/badges (e.g. "best game", streak callouts) beyond what's already computed (Beer Die win streak).
- Head-to-head or partner-record widgets on the dashboard itself (available via the linked public profile page).
