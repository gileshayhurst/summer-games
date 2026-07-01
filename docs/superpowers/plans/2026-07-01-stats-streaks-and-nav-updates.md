# Stats Streaks, "My Stats" Nav Rename, and Zero-Games Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every game a current/max win streak, rename and reposition the "Me" nav link to "My Stats", and sort the My Stats page so games with 0 games played sink to the bottom.

**Architecture:** A single shared `computeStreaks` helper in `lib/stats.ts` is wired into all 7 `compute*Leaderboard` functions, each of which gains `current_streak`/`max_streak` fields (defined per-game as win/loss, profitable-session, or non-losing). Two small presentation helpers (`formatStreak`, `sortCardsByPlayed`) go in `lib/dashboard.ts` alongside the existing dashboard helpers. The My Stats page and nav components are then updated to consume these.

**Tech Stack:** Next.js (App Router, server components), TypeScript, Jest for unit tests.

**Design doc:** `docs/superpowers/specs/2026-07-01-stats-streaks-and-nav-updates-design.md`

---

## Important context for whoever executes this plan

- **There is a stale git worktree** at `.claude/worktrees/amazing-lamarr-f85067/` from unrelated earlier work. It contains its own copy of `__tests__/lib/stats.test.ts` and `lib/stats.ts`. Jest's default test-path matching treats it as a second matching test suite, which produces confusing extra output. **Always pass `--testPathIgnorePatterns=worktrees` when running Jest in this plan.** Do not modify anything under `.claude/worktrees/`.
- **The main repo already has 3 pre-existing, unrelated failing tests** in `__tests__/lib/stats.test.ts` before any of this work starts:
  - `computePongLeaderboard › ranks by win rate descending` (expects `cup_differential` of 5, gets 4)
  - `computeBeerDieLeaderboard › computes point differential correctly` (calls `computeBeerDieLeaderboard` with a stale `BeerDieGame[]` shape instead of `BeerDieGamePlayer[]`, throws a `TypeError`)
  - `computeBeerDieHeadToHead › counts opponent matchups only` (same stale-shape issue)

  These are **out of scope** — do not attempt to fix them as part of this plan. Every task below gives you the exact expected pass/fail counts so you can tell a pre-existing failure from a regression you introduced. If a test fails that isn't in this pre-existing list, that's a real regression — stop and fix it before moving on.

---

### Task 1: Shared streak helper (`computeStreaks`)

**Files:**
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing tests**

Add this new describe block near the top of `__tests__/lib/stats.test.ts`, right after the imports (update the import line too):

```ts
import {
  computePongLeaderboard,
  computePongHeadToHead,
  computeBeerDieLeaderboard,
  computeBeerDieHeadToHead,
  computeHeartsLeaderboard,
  computePoolLeaderboard,
  computePoolHeadToHead,
  computePoolPartnerRecord,
  computePokerLeaderboard,
  computeStreaks,
} from '../../lib/stats'
```

```ts
describe('computeStreaks', () => {
  it('returns 0/0 for no games', () => {
    expect(computeStreaks([])).toEqual({ current: 0, max: 0 })
  })

  it('returns the full length when every game is a win', () => {
    expect(computeStreaks([true, true, true])).toEqual({ current: 3, max: 3 })
  })

  it('returns 0/0 when every game is a loss', () => {
    expect(computeStreaks([false, false])).toEqual({ current: 0, max: 0 })
  })

  it('current streak only counts the trailing run; max looks at the whole history', () => {
    // oldest → newest: W W W L W  →  current streak is 1 (just the last game),
    // max streak is 3 (the run at the start)
    expect(computeStreaks([true, true, true, false, true])).toEqual({ current: 1, max: 3 })
  })

  it('current streak equals max streak when the trailing run is the longest', () => {
    expect(computeStreaks([false, true, true])).toEqual({ current: 2, max: 2 })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t computeStreaks`
Expected: FAIL — `computeStreaks is not a function` (or similar), 5 failing tests.

- [ ] **Step 3: Implement `computeStreaks`**

Add this new exported function to `lib/stats.ts`, right after the `isVisible` helper near the top of the file:

```ts
export function computeStreaks(resultsOldestFirst: boolean[]): { current: number; max: number } {
  let running = 0
  let max = 0
  for (const isWin of resultsOldestFirst) {
    if (isWin) {
      running++
      max = Math.max(max, running)
    } else {
      running = 0
    }
  }
  return { current: running, max }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t computeStreaks`
Expected: PASS — 5 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add computeStreaks helper for current/max win streaks"
```

---

### Task 2: Wire streaks into Beer Die (rename `win_streak` → `current_streak`, add `max_streak`)

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`
- Modify: `app/g/[slug]/me/page.tsx:196`
- Modify: `app/g/[slug]/players/[name]/page.tsx:84`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Update the type**

In `lib/types.ts`, change `BeerDieLeaderboardEntry` (currently lines 99-109):

```ts
export type BeerDieLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
  sinks: number
  self_sinks: number
  current_streak: number
  max_streak: number
}
```

- [ ] **Step 2: Update the existing win_streak tests to expect the renamed/expanded fields (still red at this point)**

In `__tests__/lib/stats.test.ts`, in the `describe('computeBeerDieLeaderboard — win_streak', ...)` block (currently lines 111-164), rename the describe and update assertions:

```ts
describe('computeBeerDieLeaderboard — streaks', () => {
  const bdg = (id: string, at: string) => ({ id, points_differential: 5, played_at: at })

  const mkGP = (gameId: string, playerId: string, side: 'winner' | 'loser', at: string) => ({
    game_id: gameId,
    player_id: playerId,
    side,
    beer_die_games: bdg(gameId, at),
  })

  it('returns empty for a group with no games', () => {
    const result = computeBeerDieLeaderboard(users, [], [])
    expect(result).toHaveLength(0)
  })

  it('counts consecutive wins at the end of game history as current_streak', () => {
    // u1: loss (g1), win (g2), win (g3), win (g4) → current streak 3, max streak 3
    const gamePlayers = [
      mkGP('g1', 'u1', 'loser',  '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g2', 'u1', 'winner', '2026-05-02T12:00:00Z'),
      mkGP('g2', 'u2', 'loser',  '2026-05-02T12:00:00Z'),
      mkGP('g3', 'u1', 'winner', '2026-05-03T12:00:00Z'),
      mkGP('g3', 'u2', 'loser',  '2026-05-03T12:00:00Z'),
      mkGP('g4', 'u1', 'winner', '2026-05-04T12:00:00Z'),
      mkGP('g4', 'u2', 'loser',  '2026-05-04T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(3)
    expect(u1.max_streak).toBe(3)
  })

  it('returns 0 current_streak when most recent game was a loss, but keeps the historical max_streak', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
      mkGP('g2', 'u1', 'winner', '2026-05-02T12:00:00Z'),
      mkGP('g2', 'u2', 'loser',  '2026-05-02T12:00:00Z'),
      mkGP('g3', 'u1', 'loser',  '2026-05-03T12:00:00Z'),
      mkGP('g3', 'u2', 'winner', '2026-05-03T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(0)
    expect(u1.max_streak).toBe(2)
  })

  it('counts a single win as a streak of 1', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(1)
    expect(u1.max_streak).toBe(1)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t streaks`
Expected: FAIL (the field doesn't exist yet on the returned entries).

- [ ] **Step 4: Update `computeBeerDieLeaderboard` to use `computeStreaks`**

In `lib/stats.ts`, replace the entire `computeBeerDieLeaderboard` function (currently lines 62-118) with:

```ts
export function computeBeerDieLeaderboard(
  users: User[],
  gamePlayers: BeerDieGamePlayer[],
  sinks: BeerDieSink[] = []
): BeerDieLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0, sinks: 0, self_sinks: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.beer_die_games.points_differential }
    else { s.losses++; s.point_diff -= gp.beer_die_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.beer_die_games.played_at })
  }

  for (const sink of sinks) {
    const s = stats.get(sink.player_id)
    if (!s) continue
    if (sink.type === 'sink') s.sinks++
    else if (sink.type === 'self_sink') s.self_sinks++
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        point_differential: s.point_diff,
        sinks: s.sinks,
        self_sinks: s.self_sinks,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

- [ ] **Step 5: Fix the two UI call sites so the project still compiles**

In `app/g/[slug]/me/page.tsx:196`, change:

```tsx
<StatCard label="Streak" value={beerDieEntry.win_streak >= 3 ? `🔥${beerDieEntry.win_streak}` : String(beerDieEntry.win_streak)} />
```

to:

```tsx
<StatCard label="Streak" value={beerDieEntry.current_streak >= 3 ? `🔥${beerDieEntry.current_streak}` : String(beerDieEntry.current_streak)} />
```

In `app/g/[slug]/players/[name]/page.tsx:84`, change:

```tsx
<StatCard label="Streak" value={beerDie.win_streak >= 3 ? `🔥${beerDie.win_streak}` : String(beerDie.win_streak)} />
```

to:

```tsx
<StatCard label="Streak" value={beerDie.current_streak >= 3 ? `🔥${beerDie.current_streak}` : String(beerDie.current_streak)} />
```

(These are mechanical renames only — Max Streak StatCards for the My Stats page come in Task 8. This step just keeps the build green.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees`
Expected: `Tests: 3 failed, 23 passed, 26 total` (the 3 failures are the pre-existing ones listed at the top of this plan — everything else, including the new streak tests, passes).

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/stats.ts "app/g/[slug]/me/page.tsx" "app/g/[slug]/players/[name]/page.tsx" __tests__/lib/stats.test.ts
git commit -m "feat: rename Beer Die win_streak to current_streak, add max_streak"
```

---

### Task 3: Wire streaks into Pong

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing test**

In `__tests__/lib/stats.test.ts`, inside `describe('computePongLeaderboard', ...)`, add:

```ts
  it('computes current_streak and max_streak', () => {
    // u1 (Giles): g1 win, g2 loss, g3 win → current streak 1, max streak 1
    const result = computePongLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)
  })
```

(This reuses the `gamePlayers` fixture already defined at the top of that describe block: g1 win, g2 loss, g3 win for Giles, in that chronological order.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "current_streak and max_streak"`
Expected: FAIL — `current_streak` is `undefined`.

- [ ] **Step 3: Add the fields to the type**

In `lib/types.ts`, update `PongLeaderboardEntry` (currently lines 83-90):

```ts
export type PongLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  cup_differential: number
  current_streak: number
  max_streak: number
}
```

- [ ] **Step 4: Wire the helper into `computePongLeaderboard`**

Replace the whole function in `lib/stats.ts` (currently lines 13-41) with:

```ts
export function computePongLeaderboard(
  users: User[],
  gamePlayers: PongGamePlayer[]
): PongLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, cup_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.cup_diff += gp.pong_games.cups_left }
    else { s.losses++; s.cup_diff -= gp.pong_games.cups_left }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.pong_games.played_at })
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        cup_differential: s.cup_diff,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "current_streak and max_streak"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add current_streak and max_streak to Pong leaderboard"
```

---

### Task 4: Wire streaks into Cornhole, Spikeball, and Pool

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe('computePoolLeaderboard', ...)` block (Cornhole and Spikeball don't have existing describe blocks with fixtures — Pool's fixture is enough to prove the shared pattern works, matching how the previous task covered Pong):

```ts
  it('computes current_streak and max_streak', () => {
    // Giles (u1): g1 win, g2 loss, g3 win → current streak 1, max streak 1
    const result = computePoolLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "current_streak and max_streak"`
Expected: FAIL for the new Pool assertion (Pong's from Task 3 still passes).

- [ ] **Step 3: Add the fields to all three types**

In `lib/types.ts`, add `current_streak: number` and `max_streak: number` to `CornholeLeaderboardEntry` (currently lines 111-118), `SpikeballLeaderboardEntry` (currently lines 120-127), and `PoolLeaderboardEntry` (currently lines 199-206). Example for Cornhole:

```ts
export type CornholeLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
  current_streak: number
  max_streak: number
}
```

Apply the same two added fields to `SpikeballLeaderboardEntry` and `PoolLeaderboardEntry`.

- [ ] **Step 4: Wire the helper into all three leaderboard functions**

In `lib/stats.ts`, replace `computeCornholeLeaderboard`:

```ts
export function computeCornholeLeaderboard(
  users: User[],
  gamePlayers: CornholeGamePlayer[]
): CornholeLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.cornhole_games.points_differential }
    else { s.losses++; s.point_diff -= gp.cornhole_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.cornhole_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

Replace `computeSpikeballLeaderboard` the same way:

```ts
export function computeSpikeballLeaderboard(
  users: User[],
  gamePlayers: SpikeballGamePlayer[]
): SpikeballLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.spikeball_games.points_differential }
    else { s.losses++; s.point_diff -= gp.spikeball_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.spikeball_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

Replace `computePoolLeaderboard`:

```ts
export function computePoolLeaderboard(
  users: User[],
  gamePlayers: PoolGamePlayer[]
): PoolLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, balls_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.balls_diff += gp.pool_games.balls_differential }
    else { s.losses++; s.balls_diff -= gp.pool_games.balls_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.pool_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, balls_differential: s.balls_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "current_streak and max_streak"`
Expected: PASS — 2 tests match this filter (Pong's, from Task 3, and Pool's, added just now). Cornhole and Spikeball don't get their own dedicated test here since they share the exact same code path as Pool and Pong, already covered by `computeStreaks`'s own unit tests plus this structural test.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add current_streak and max_streak to Cornhole, Spikeball, Pool leaderboards"
```

---

### Task 5: Wire streaks into Poker (profitable-session streak)

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing test**

Add this inside `describe('computePokerLeaderboard', ...)`:

```ts
  it('computes current_streak and max_streak based on profitable sessions', () => {
    // Giles (u1): g1 +$40 (win), g2 -$30 (loss) → current streak 0, max streak 1
    const result = computePokerLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(0)
    expect(giles.max_streak).toBe(1)

    // Sherm (u2): g1 -$20 (loss), g2 +$60 (win) → current streak 1, max streak 1
    const sherm = result.find(e => e.name === 'Sherm')!
    expect(sherm.current_streak).toBe(1)
    expect(sherm.max_streak).toBe(1)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "profitable sessions"`
Expected: FAIL — `current_streak` is `undefined`.

- [ ] **Step 3: Add the fields to the type**

In `lib/types.ts`, update `PokerLeaderboardEntry` (currently lines 229-236):

```ts
export type PokerLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  total_profit_cents: number
  win_sessions: number
  win_rate: number
  current_streak: number
  max_streak: number
}
```

- [ ] **Step 4: Wire the helper into `computePokerLeaderboard`**

Replace the function in `lib/stats.ts` (currently lines 358-384):

```ts
export function computePokerLeaderboard(
  users: User[],
  gamePlayers: PokerGamePlayer[]
): PokerLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { games_played: 0, total_profit_cents: 0, win_sessions: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.games_played++
    s.total_profit_cents += gp.amount_cents
    if (gp.amount_cents > 0) s.win_sessions++

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.amount_cents > 0, played_at: gp.poker_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.games_played,
        total_profit_cents: s.total_profit_cents,
        win_sessions: s.win_sessions,
        win_rate: s.games_played > 0 ? s.win_sessions / s.games_played : 0,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => b.total_profit_cents - a.total_profit_cents)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "profitable sessions"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add current_streak and max_streak to Poker leaderboard"
```

---

### Task 6: Wire streaks into Hearts (non-losing streak)

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing test**

Add this inside `describe('computeHeartsLeaderboard', ...)`:

```ts
  it('computes current_streak and max_streak based on not losing', () => {
    // Giles (u1): g1 lost=true (loss), g2 lost=false (win) → current streak 1, max streak 1
    const result = computeHeartsLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)

    // Sherm (u2): g1 lost=false (win), g2 lost=true (loss), g3 lost=true (loss) → current streak 0, max streak 1
    const sherm = result.find(e => e.name === 'Sherm')!
    expect(sherm.current_streak).toBe(0)
    expect(sherm.max_streak).toBe(1)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "not losing"`
Expected: FAIL — `current_streak` is `undefined`.

- [ ] **Step 3: Add the fields to the type**

In `lib/types.ts`, update `HeartsLeaderboardEntry` (currently lines 129-135):

```ts
export type HeartsLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  losses: number
  loss_rate: number
  current_streak: number
  max_streak: number
}
```

- [ ] **Step 4: Wire the helper into `computeHeartsLeaderboard`**

Replace the function in `lib/stats.ts` (currently lines 139-165):

```ts
export function computeHeartsLeaderboard(
  users: User[],
  gamePlayers: HeartsGamePlayer[]
): HeartsLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { played: 0, losses: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.played++
    if (gp.lost) s.losses++

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: !gp.lost, played_at: gp.hearts_games.played_at })
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.played,
        losses: s.losses,
        loss_rate: s.played > 0 ? s.losses / s.played : 0,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => a.loss_rate - b.loss_rate || b.games_played - a.games_played)
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees -t "not losing"`
Expected: PASS.

- [ ] **Step 6: Run the full stats test file**

Run: `npx jest __tests__/lib/stats.test.ts --testPathIgnorePatterns=worktrees`
Expected: `Tests: 3 failed, 27 passed, 30 total` (the 3 pre-existing failures only — everything else, including all new streak tests across all 7 games, passes).

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add current_streak and max_streak to Hearts leaderboard"
```

---

### Task 7: Presentation helpers — `formatStreak` and `sortCardsByPlayed`

**Files:**
- Modify: `lib/dashboard.ts`
- Modify: `app/g/[slug]/players/[name]/page.tsx:84`
- Test: `__tests__/lib/dashboard.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/lib/dashboard.test.ts`:

```ts
import {
  getLeaderboardRank,
  mergeRecentActivity,
  formatSideResult,
  formatHeartsResult,
  formatPokerResult,
  formatStreak,
  sortCardsByPlayed,
  ActivityItem,
} from '../../lib/dashboard'
```

```ts
describe('formatStreak', () => {
  it('returns the plain number below 3', () => {
    expect(formatStreak(0)).toBe('0')
    expect(formatStreak(2)).toBe('2')
  })

  it('prefixes a fire emoji at 3 or above', () => {
    expect(formatStreak(3)).toBe('🔥3')
    expect(formatStreak(7)).toBe('🔥7')
  })
})

describe('sortCardsByPlayed', () => {
  it('moves cards with hasPlayed: false to the end, preserving relative order otherwise', () => {
    const cards = [
      { key: 'pong', hasPlayed: true },
      { key: 'beer-die', hasPlayed: false },
      { key: 'cornhole', hasPlayed: true },
      { key: 'spikeball', hasPlayed: false },
      { key: 'pool', hasPlayed: true },
    ]
    const result = sortCardsByPlayed(cards)
    expect(result.map(c => c.key)).toEqual(['pong', 'cornhole', 'pool', 'beer-die', 'spikeball'])
  })

  it('does not mutate the input array', () => {
    const cards = [{ key: 'a', hasPlayed: false }, { key: 'b', hasPlayed: true }]
    const original = [...cards]
    sortCardsByPlayed(cards)
    expect(cards).toEqual(original)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/lib/dashboard.test.ts --testPathIgnorePatterns=worktrees`
Expected: FAIL — `formatStreak is not a function`.

- [ ] **Step 3: Implement both helpers**

Add to the end of `lib/dashboard.ts`:

```ts
export function formatStreak(value: number): string {
  return value >= 3 ? `🔥${value}` : String(value)
}

export function sortCardsByPlayed<T extends { hasPlayed: boolean }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => Number(b.hasPlayed) - Number(a.hasPlayed))
}
```

- [ ] **Step 4: Use `formatStreak` for Beer Die on the public profile page**

In `app/g/[slug]/players/[name]/page.tsx`, add `formatStreak` to the import from `@/lib/dashboard` (there isn't one yet — add it):

```tsx
import { formatStreak } from '@/lib/dashboard'
```

Then change line 84 from:

```tsx
<StatCard label="Streak" value={beerDie.current_streak >= 3 ? `🔥${beerDie.current_streak}` : String(beerDie.current_streak)} />
```

to:

```tsx
<StatCard label="Streak" value={formatStreak(beerDie.current_streak)} />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest __tests__/lib/dashboard.test.ts --testPathIgnorePatterns=worktrees`
Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/dashboard.ts "app/g/[slug]/players/[name]/page.tsx" __tests__/lib/dashboard.test.ts
git commit -m "feat: add formatStreak and sortCardsByPlayed helpers"
```

---

### Task 8: My Stats page — Streak/Max Streak cards + zero-games sort

**Files:**
- Modify: `app/g/[slug]/me/page.tsx`

- [ ] **Step 1: Add the new imports**

At the top of `app/g/[slug]/me/page.tsx`, change:

```tsx
import { getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult, formatPokerResult, ActivityItem } from '@/lib/dashboard'
```

to:

```tsx
import { getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult, formatPokerResult, formatStreak, sortCardsByPlayed, ActivityItem } from '@/lib/dashboard'
```

- [ ] **Step 2: Replace the game card grid (currently lines 175-253) with an array-driven, sorted version**

Replace this whole block:

```tsx
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GameCard gameType="pong" name="Pong" rank={getLeaderboardRank(pongLB, playerId)}>
          {pongEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(pongEntry.wins)} />
              <StatCard label="Losses" value={String(pongEntry.losses)} />
              <StatCard label="Win%" value={`${(pongEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Cup Diff" value={pongEntry.cup_differential > 0 ? `+${pongEntry.cup_differential}` : String(pongEntry.cup_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="beer-die" name="Beer Die" rank={getLeaderboardRank(beerDieLB, playerId)}>
          {beerDieEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(beerDieEntry.wins)} />
              <StatCard label="Losses" value={String(beerDieEntry.losses)} />
              <StatCard label="Win%" value={`${(beerDieEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={beerDieEntry.point_differential > 0 ? `+${beerDieEntry.point_differential}` : String(beerDieEntry.point_differential)} />
              <StatCard label="Sinks" value={String(beerDieEntry.sinks)} />
              <StatCard label="Self Sinks" value={String(beerDieEntry.self_sinks)} />
              <StatCard label="Streak" value={beerDieEntry.current_streak >= 3 ? `🔥${beerDieEntry.current_streak}` : String(beerDieEntry.current_streak)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="cornhole" name="Cornhole" rank={getLeaderboardRank(cornholeLB, playerId)}>
          {cornholeEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(cornholeEntry.wins)} />
              <StatCard label="Losses" value={String(cornholeEntry.losses)} />
              <StatCard label="Win%" value={`${(cornholeEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={cornholeEntry.point_differential > 0 ? `+${cornholeEntry.point_differential}` : String(cornholeEntry.point_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="spikeball" name="Spikeball" rank={getLeaderboardRank(spikeballLB, playerId)}>
          {spikeballEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(spikeballEntry.wins)} />
              <StatCard label="Losses" value={String(spikeballEntry.losses)} />
              <StatCard label="Win%" value={`${(spikeballEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={spikeballEntry.point_differential > 0 ? `+${spikeballEntry.point_differential}` : String(spikeballEntry.point_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="pool" name="Pool" rank={getLeaderboardRank(poolLB, playerId)}>
          {poolEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(poolEntry.wins)} />
              <StatCard label="Losses" value={String(poolEntry.losses)} />
              <StatCard label="Win%" value={`${(poolEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Ball Diff" value={poolEntry.balls_differential > 0 ? `+${poolEntry.balls_differential}` : String(poolEntry.balls_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="poker" name="Poker" rank={getLeaderboardRank(pokerLB, playerId)}>
          {pokerEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Games" value={String(pokerEntry.games_played)} />
              <StatCard label="Win%" value={`${(pokerEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Profit" value={`${pokerEntry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(pokerEntry.total_profit_cents) / 100).toFixed(2)}`} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="hearts" name="Hearts" rank={getLeaderboardRank(heartsLB, playerId)}>
          {heartsEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Games" value={String(heartsEntry.games_played)} />
              <StatCard label="Losses" value={String(heartsEntry.losses)} />
              <StatCard label="Loss%" value={`${(heartsEntry.loss_rate * 100).toFixed(1)}%`} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>
      </div>
```

with:

```tsx
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortCardsByPlayed([
          {
            key: 'pong',
            hasPlayed: !!pongEntry,
            node: (
              <GameCard key="pong" gameType="pong" name="Pong" rank={getLeaderboardRank(pongLB, playerId)}>
                {pongEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Wins" value={String(pongEntry.wins)} />
                    <StatCard label="Losses" value={String(pongEntry.losses)} />
                    <StatCard label="Win%" value={`${(pongEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Cup Diff" value={pongEntry.cup_differential > 0 ? `+${pongEntry.cup_differential}` : String(pongEntry.cup_differential)} />
                    <StatCard label="Streak" value={formatStreak(pongEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(pongEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'beer-die',
            hasPlayed: !!beerDieEntry,
            node: (
              <GameCard key="beer-die" gameType="beer-die" name="Beer Die" rank={getLeaderboardRank(beerDieLB, playerId)}>
                {beerDieEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Wins" value={String(beerDieEntry.wins)} />
                    <StatCard label="Losses" value={String(beerDieEntry.losses)} />
                    <StatCard label="Win%" value={`${(beerDieEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Pt Diff" value={beerDieEntry.point_differential > 0 ? `+${beerDieEntry.point_differential}` : String(beerDieEntry.point_differential)} />
                    <StatCard label="Sinks" value={String(beerDieEntry.sinks)} />
                    <StatCard label="Self Sinks" value={String(beerDieEntry.self_sinks)} />
                    <StatCard label="Streak" value={formatStreak(beerDieEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(beerDieEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'cornhole',
            hasPlayed: !!cornholeEntry,
            node: (
              <GameCard key="cornhole" gameType="cornhole" name="Cornhole" rank={getLeaderboardRank(cornholeLB, playerId)}>
                {cornholeEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Wins" value={String(cornholeEntry.wins)} />
                    <StatCard label="Losses" value={String(cornholeEntry.losses)} />
                    <StatCard label="Win%" value={`${(cornholeEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Pt Diff" value={cornholeEntry.point_differential > 0 ? `+${cornholeEntry.point_differential}` : String(cornholeEntry.point_differential)} />
                    <StatCard label="Streak" value={formatStreak(cornholeEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(cornholeEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'spikeball',
            hasPlayed: !!spikeballEntry,
            node: (
              <GameCard key="spikeball" gameType="spikeball" name="Spikeball" rank={getLeaderboardRank(spikeballLB, playerId)}>
                {spikeballEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Wins" value={String(spikeballEntry.wins)} />
                    <StatCard label="Losses" value={String(spikeballEntry.losses)} />
                    <StatCard label="Win%" value={`${(spikeballEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Pt Diff" value={spikeballEntry.point_differential > 0 ? `+${spikeballEntry.point_differential}` : String(spikeballEntry.point_differential)} />
                    <StatCard label="Streak" value={formatStreak(spikeballEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(spikeballEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'pool',
            hasPlayed: !!poolEntry,
            node: (
              <GameCard key="pool" gameType="pool" name="Pool" rank={getLeaderboardRank(poolLB, playerId)}>
                {poolEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Wins" value={String(poolEntry.wins)} />
                    <StatCard label="Losses" value={String(poolEntry.losses)} />
                    <StatCard label="Win%" value={`${(poolEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Ball Diff" value={poolEntry.balls_differential > 0 ? `+${poolEntry.balls_differential}` : String(poolEntry.balls_differential)} />
                    <StatCard label="Streak" value={formatStreak(poolEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(poolEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'poker',
            hasPlayed: !!pokerEntry,
            node: (
              <GameCard key="poker" gameType="poker" name="Poker" rank={getLeaderboardRank(pokerLB, playerId)}>
                {pokerEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Games" value={String(pokerEntry.games_played)} />
                    <StatCard label="Win%" value={`${(pokerEntry.win_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Profit" value={`${pokerEntry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(pokerEntry.total_profit_cents) / 100).toFixed(2)}`} />
                    <StatCard label="Streak" value={formatStreak(pokerEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(pokerEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
          {
            key: 'hearts',
            hasPlayed: !!heartsEntry,
            node: (
              <GameCard key="hearts" gameType="hearts" name="Hearts" rank={getLeaderboardRank(heartsLB, playerId)}>
                {heartsEntry ? (
                  <div className="grid grid-cols-2 gap-2">
                    <StatCard label="Games" value={String(heartsEntry.games_played)} />
                    <StatCard label="Losses" value={String(heartsEntry.losses)} />
                    <StatCard label="Loss%" value={`${(heartsEntry.loss_rate * 100).toFixed(1)}%`} />
                    <StatCard label="Streak" value={formatStreak(heartsEntry.current_streak)} />
                    <StatCard label="Max Streak" value={formatStreak(heartsEntry.max_streak)} />
                  </div>
                ) : <p className="text-muted text-sm">No games yet</p>}
              </GameCard>
            ),
          },
        ]).map(c => c.node)}
      </div>
```

- [ ] **Step 3: Type-check the page**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, sign in, navigate to `/g/summer-games/me`. Confirm:
- Every game card shows a "Streak" and "Max Streak" stat.
- A game with 0 logged games for the signed-in player renders below all games with logged games.
- A streak/max-streak value of 3 or higher shows the 🔥 prefix.

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/me/page.tsx"
git commit -m "feat: add Streak/Max Streak stats and zero-games sort to My Stats page"
```

---

### Task 9: Desktop top bar — rename "Me" to "My Stats" and reposition

**Files:**
- Modify: `components/GroupNav.tsx`

- [ ] **Step 1: Remove "Me" from the evenly-spaced nav items list and add a standalone "My Stats" link**

In `components/GroupNav.tsx`, change the `navItems` array (currently lines 18-28) from:

```tsx
  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/pool`, label: 'Pool' },
    { href: `${base}/poker`, label: 'Poker' },
    { href: `${base}/players`, label: 'Players' },
    ...(isExample ? [] : [{ href: `${base}/me`, label: 'Me' }]),
  ]
```

to:

```tsx
  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/pool`, label: 'Pool' },
    { href: `${base}/poker`, label: 'Poker' },
    { href: `${base}/players`, label: 'Players' },
  ]
  const myStatsHref = `${base}/me`
  const isMyStatsActive = pathname === myStatsHref || pathname.startsWith(myStatsHref + '/')
```

- [ ] **Step 2: Render the "My Stats" link between the group name and the evenly-spaced nav items**

In the same file, find this line (currently line 42):

```tsx
        <Link href={base} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 text-brand font-black text-sm tracking-widest uppercase shrink-0">
          {groupName}
        </Link>
        <div className="hidden md:flex flex-1 items-center justify-evenly px-4 flex-wrap gap-y-1">
```

and insert the new link between them:

```tsx
        <Link href={base} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 text-brand font-black text-sm tracking-widest uppercase shrink-0">
          {groupName}
        </Link>
        {!isExample && (
          <Link
            href={myStatsHref}
            className={`hidden md:inline-block ml-4 text-xs font-black uppercase tracking-widest transition-colors shrink-0 ${
              isMyStatsActive ? 'text-win border-b-2 border-win pb-0.5' : 'text-muted hover:text-stone-900'
            }`}
          >
            My Stats
          </Link>
        )}
        <div className="hidden md:flex flex-1 items-center justify-evenly px-4 flex-wrap gap-y-1">
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev` (desktop viewport, e.g. 1280px wide). Confirm the top bar reads: logo → **Summer Games** → **My Stats** → Pong · Beer Die · Hearts · Cornhole · Spikeball · Pool · Poker · Players → ⚙️ → Log Game. Click "My Stats" and confirm it navigates to `/g/[slug]/me` and gets the active (`text-win`, underlined) style. Resize to mobile width and confirm the top bar is unchanged from before (no "My Stats" text visible there — game navigation still only lives in the bottom tab bar).

- [ ] **Step 5: Commit**

```bash
git add components/GroupNav.tsx
git commit -m "feat: rename Me to My Stats and move it next to the group name on desktop"
```

---

### Task 10: Mobile bottom bar — rename "Me" to "My Stats" and change default pins

**Files:**
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Rename the label**

In `components/BottomNav.tsx`, change the `ALL_GAMES` entry (currently line 15):

```ts
  { slug: 'me', label: 'Me', icon: '👤' },
```

to:

```ts
  { slug: 'me', label: 'My Stats', icon: '👤' },
```

- [ ] **Step 2: Change the default pins**

Change (currently line 18):

```ts
const DEFAULT_PINS = ['pong', 'beer-die', 'poker']
```

to:

```ts
const DEFAULT_PINS = ['me', 'pong', 'beer-die']
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, resize to a mobile viewport (e.g. 390px wide). Clear `localStorage` for the site (or use a private/incognito window) and load a group page. Confirm the bottom bar reads, left to right: **My Stats** | **Pong** | LOG+ | **Beer Die** | **More**. Open the "More" sheet and confirm the "My Stats" row can still be unpinned/pinned like any other game. Set a `localStorage` value under `sg-pinned-<slug>` manually beforehand (e.g. `["pong","beer-die","poker"]`) and reload — confirm the bar keeps that saved selection instead of resetting to the new default.

- [ ] **Step 5: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: default-pin My Stats on the mobile bottom bar"
```

---

### Task 11: Final full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx jest --testPathIgnorePatterns=worktrees`
Expected: exactly 3 failing tests (the pre-existing ones listed at the top of this plan), everything else passing. If any other test fails, that's a regression from this plan — find and fix it before continuing.

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new lint errors introduced by this work.

No commit for this task — it's a verification checkpoint. If everything above is green, the plan is complete.
