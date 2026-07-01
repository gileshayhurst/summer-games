# Stats Streaks, "My Stats" Nav Rename, and Zero-Games Sort

**Date:** 2026-07-01

## Goal

Three related upgrades to the per-player stats experience (`/g/[slug]/me`, aka "My Dashboard" from [2026-07-01-my-dashboard-design.md](2026-07-01-my-dashboard-design.md)) and its navigation entry points:

1. Give every game (not just Beer Die) a **current streak** and a new **max streak** stat.
2. Rename the "Me" nav entry to **"My Stats"** and reposition it in the desktop top bar and the mobile bottom tab bar.
3. On the My Stats page, push any game the player has **0 games played** in to the bottom of the card grid.

## 1. Streak computation (data layer)

Add a shared helper in `lib/stats.ts`, e.g.:

```ts
function computeStreaks(gamesOldestFirst: boolean[]): { current: number; max: number }
```

Input is a per-player list of booleans (`true` = "win" for that game type), sorted **oldest → newest**. Walking once gives both:
- **current_streak** — the trailing run of `true` at the end of the list (0 if the most recent game was a loss/non-win, or if there are no games).
- **max_streak** — the longest run of consecutive `true` anywhere in the list.

This replaces (and generalizes) the existing ad-hoc streak loop in `computeBeerDieLeaderboard` (`lib/stats.ts:83-98`), which currently only computes a current streak by sorting newest-first and counting leading wins.

Each of the 7 `compute*Leaderboard` functions calls this helper and adds `current_streak` / `max_streak` to its returned entries. "Win" is defined per game type:

| Game | "Win" condition |
|---|---|
| Pong | `side === 'winner'` |
| Beer Die | `side === 'winner'` |
| Cornhole | `side === 'winner'` |
| Spikeball | `side === 'winner'` |
| Pool | `side === 'winner'` |
| Poker | `amount_cents > 0` (profitable session; a breakeven or losing session breaks the streak) |
| Hearts | `lost === false` |

### Type changes (`lib/types.ts`)

- `BeerDieLeaderboardEntry.win_streak` is renamed to `current_streak`, and a new `max_streak: number` field is added.
- `PongLeaderboardEntry`, `CornholeLeaderboardEntry`, `SpikeballLeaderboardEntry`, `PoolLeaderboardEntry`, `PokerLeaderboardEntry`, `HeartsLeaderboardEntry` each gain `current_streak: number` and `max_streak: number`.

### Callers to update

- `app/g/[slug]/me/page.tsx` — add Streak / Max Streak `StatCard`s to all 7 `GameCard`s (see §2).
- `app/g/[slug]/players/[name]/page.tsx` — only needs a mechanical rename of its existing `beerDie.win_streak` reference to `beerDie.current_streak` so it keeps compiling. This page is **not** getting Max Streak or streaks for the other 6 games — see "Out of scope."

## 2. My Stats page (`app/g/[slug]/me/page.tsx`)

- Every `GameCard` gets two additional `StatCard`s: **Streak** and **Max Streak**. Both use the existing fire-emoji treatment already used for Beer Die's streak: `value >= 3 ? \`🔥${value}\` : String(value)`.
- **Zero-games-to-bottom sort:** the 7 cards are currently emitted in a fixed hardcoded order (Pong, Beer Die, Cornhole, Spikeball, Pool, Poker, Hearts). Replace this with an array of `{ node, hasPlayed }` built in that same default order, where `hasPlayed` is whether the player has a leaderboard entry for that game (the same condition that already drives the existing "No games yet" fallback — no new query needed). Stable-sort by `hasPlayed` descending before rendering, so:
  - Games the player has played keep their existing relative order, all appearing first.
  - Games with 0 games played drop to the bottom, in their existing relative order.

## 3. Nav bar rename & reposition

### Desktop top bar (`components/GroupNav.tsx`)

- Rename the nav entry label from "Me" to **"My Stats"**.
- Currently "Me" is the last item inside the evenly-spaced (`justify-evenly`) desktop nav item list. Pull it out of that list and render it as a separate link positioned immediately after the group name link, so the left-to-right order becomes:

  `[home icon] → Summer Games → My Stats → Pong · Beer Die · Hearts · Cornhole · Spikeball · Pool · Poker · Players (evenly spaced) → ⚙️ → Log Game →`

- Keep the existing active/inactive styling (`text-win` + underline when on `/g/[slug]/me`, `text-muted` otherwise) and the existing `isExample` hide behavior (not shown for example groups).
- **Mobile is unchanged** — the top bar already renders no nav links on mobile (`hidden md:flex` on the nav-items wrapper); this feature does not add "My Stats" to the mobile top bar. It only ever appears on desktop's top bar.

### Mobile bottom tab bar (`components/BottomNav.tsx`)

- Rename the `ALL_GAMES` entry `{ slug: 'me', label: 'Me', icon: '👤' }` to `label: 'My Stats'`. This label is used both for a pinned tab and for its row in the "More" sheet.
- Change `DEFAULT_PINS` from `['pong', 'beer-die', 'poker']` (set in [2026-06-26-default-pinned-games-design.md](2026-06-26-default-pinned-games-design.md)) to `['me', 'pong', 'beer-die']`. Combined with the existing "master-list order" rendering (`ALL_GAMES.filter(...)`), and `me` sorting before `pong` in `ALL_GAMES`, this produces the bar:

  `My Stats | Pong | LOG+ | Beer Die | More`

- No other structural change: same 5-slot layout (pin, pin, center Log button, pin, More), same `MAX_PINS = 3`, same pin/unpin mechanism via the "More" sheet — users can freely unpin or swap "My Stats" like any other tab.
- Matches the existing `DEFAULT_PINS` behavior already documented: this is a **default only**, applied when a group has no saved pin selection in `localStorage` (`sg-pinned-<slug>`). Existing users who already have a saved pin set (e.g. the current `['pong', 'beer-die', 'poker']` default) are **not** force-migrated to include "My Stats" — they keep their own saved choices unless they manually pin it.

## Out of scope

- Streaks/Max Streak on the public profile page (`players/[name]/page.tsx`) — that page keeps showing only Beer Die's (renamed) current streak, unchanged otherwise. Revisit later if wanted.
- Any change to the pinning mechanism itself (still max 3 pins, still per-group `localStorage`).
- Cross-group streak aggregation — streaks remain per-group, consistent with the rest of the stats architecture.
- Migrating existing users' saved bottom-nav pin sets to include "My Stats".

## Testing

- Unit test the new `computeStreaks` helper directly: empty list → `{current: 0, max: 0}`; all wins; all losses; a mixed sequence where max streak occurs earlier than the trailing (current) streak; a mixed sequence where current streak is also the max.
- Unit test each `compute*Leaderboard` function's `current_streak`/`max_streak` output for at least one player with a known game history, per game type (including Poker's profit-based and Hearts' non-loss-based definitions).
- Manual: on the My Stats page, confirm a game with 0 logged games renders after all played games, and that Streak/Max Streak show the 🔥 prefix once a value reaches 3.
- Manual: confirm desktop top bar shows "My Stats" directly after the group name, ahead of Pong, with correct active-state styling on `/g/[slug]/me`.
- Manual: with `localStorage` cleared, confirm the mobile bottom bar renders My Stats | Pong | LOG+ | Beer Die | More; with a pre-existing saved pin set, confirm it's unaffected.
