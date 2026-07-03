# Loss Streaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loss streaks as a full mirror of win streaks — tracking consecutive losses, displayed with 😂, appearing in every place win streaks appear.

**Architecture:** Extend `computeStreaks` to return 4 values in one pass (`current`, `max`, `currentLoss`, `maxLoss`). Push the new fields through all 7 leaderboard types and compute functions. Add `topLossStreaks` parallel to `topStreaks`. Wire the new fields into PlayerStats stat cards, home page tile badges, and game leaderboard name decorations.

**Tech Stack:** TypeScript, Next.js 14 App Router, Jest

---

### Task 1: Extend `computeStreaks` to track loss streaks

**Files:**
- Modify: `__tests__/lib/stats.test.ts`
- Modify: `lib/stats.ts:13-25`

- [ ] **Step 1: Update the five existing `computeStreaks` test expectations to include `currentLoss`/`maxLoss`, and add two new loss-specific cases**

In `__tests__/lib/stats.test.ts`, replace the entire `describe('computeStreaks', ...)` block (lines 16–38) with:

```ts
describe('computeStreaks', () => {
  it('returns 0/0/0/0 for no games', () => {
    expect(computeStreaks([])).toEqual({ current: 0, max: 0, currentLoss: 0, maxLoss: 0 })
  })

  it('returns the full length when every game is a win', () => {
    expect(computeStreaks([true, true, true])).toEqual({ current: 3, max: 3, currentLoss: 0, maxLoss: 0 })
  })

  it('returns current/max 0 when every game is a loss', () => {
    expect(computeStreaks([false, false])).toEqual({ current: 0, max: 0, currentLoss: 2, maxLoss: 2 })
  })

  it('current streak only counts the trailing run; max looks at the whole history', () => {
    // W W W L W → current win 1, max win 3, current loss 0, max loss 1
    expect(computeStreaks([true, true, true, false, true])).toEqual({ current: 1, max: 3, currentLoss: 0, maxLoss: 1 })
  })

  it('current streak equals max streak when the trailing run is the longest', () => {
    // L W W → current win 2, max win 2, current loss 0, max loss 1
    expect(computeStreaks([false, true, true])).toEqual({ current: 2, max: 2, currentLoss: 0, maxLoss: 1 })
  })

  it('tracks the current loss streak at the end of the sequence', () => {
    // W W L L → current win 0, max win 2, current loss 2, max loss 2
    expect(computeStreaks([true, true, false, false])).toEqual({ current: 0, max: 2, currentLoss: 2, maxLoss: 2 })
  })

  it('keeps historical max loss streak when the current run is a win', () => {
    // L L L W → current win 1, max win 1, current loss 0, max loss 3
    expect(computeStreaks([false, false, false, true])).toEqual({ current: 1, max: 1, currentLoss: 0, maxLoss: 3 })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```
npx jest __tests__/lib/stats.test.ts --testNamePattern="computeStreaks"
```

Expected: 7 failures — the existing 5 tests now expect 4-field objects but the implementation returns 2-field objects.

- [ ] **Step 3: Update `computeStreaks` in `lib/stats.ts` to return 4 values**

Replace lines 13–25 of `lib/stats.ts`:

```ts
export function computeStreaks(resultsOldestFirst: boolean[]): { current: number; max: number; currentLoss: number; maxLoss: number } {
  let running = 0
  let max = 0
  let runningLoss = 0
  let maxLoss = 0
  for (const isWin of resultsOldestFirst) {
    if (isWin) {
      running++
      max = Math.max(max, running)
      runningLoss = 0
    } else {
      runningLoss++
      maxLoss = Math.max(maxLoss, runningLoss)
      running = 0
    }
  }
  return { current: running, max, currentLoss: runningLoss, maxLoss }
}
```

- [ ] **Step 4: Run the tests to verify they all pass**

```
npx jest __tests__/lib/stats.test.ts --testNamePattern="computeStreaks"
```

Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add __tests__/lib/stats.test.ts lib/stats.ts
git commit -m "feat: extend computeStreaks to track loss streaks in one pass"
```

---

### Task 2: Update all leaderboard types and compute functions

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/stats.ts`

These two files must be updated in the same step — adding the new fields to types without updating the compute functions (or vice versa) causes TypeScript errors.

- [ ] **Step 1: Add `current_loss_streak` and `max_loss_streak` to all 7 leaderboard entry types in `lib/types.ts`, and add `losses` to `HeartsLeaderboardEntry`**

Replace the 7 leaderboard entry types in `lib/types.ts` with:

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
  current_loss_streak: number
  max_loss_streak: number
}

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
  current_loss_streak: number
  max_loss_streak: number
}

export type CornholeLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
  current_streak: number
  max_streak: number
  current_loss_streak: number
  max_loss_streak: number
}

export type SpikeballLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
  current_streak: number
  max_streak: number
  current_loss_streak: number
  max_loss_streak: number
}

export type HeartsLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  wins: number
  losses: number
  win_rate: number
  current_streak: number
  max_streak: number
  current_loss_streak: number
  max_loss_streak: number
}

export type PoolLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  balls_differential: number
  current_streak: number
  max_streak: number
  current_loss_streak: number
  max_loss_streak: number
}

export type PokerLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  total_profit_cents: number
  win_sessions: number
  win_rate: number
  current_streak: number
  max_streak: number
  current_loss_streak: number
  max_loss_streak: number
}
```

- [ ] **Step 2: Update `computeStreaksByPlayer` return type in `lib/stats.ts`**

Replace lines 27–46 of `lib/stats.ts`:

```ts
function computeStreaksByPlayer<GP>(
  gamePlayers: GP[],
  playerId: (gp: GP) => string,
  isWin: (gp: GP) => boolean,
  playedAt: (gp: GP) => string
): Map<string, { current: number; max: number; currentLoss: number; maxLoss: number }> {
  const gamesByPlayer = new Map<string, GP[]>()
  for (const gp of gamePlayers) {
    const pid = playerId(gp)
    if (!gamesByPlayer.has(pid)) gamesByPlayer.set(pid, [])
    gamesByPlayer.get(pid)!.push(gp)
  }

  const streaksByPlayer = new Map<string, { current: number; max: number; currentLoss: number; maxLoss: number }>()
  for (const [pid, games] of gamesByPlayer) {
    const sorted = [...games].sort((a, b) => playedAt(a).localeCompare(playedAt(b)))
    streaksByPlayer.set(pid, computeStreaks(sorted.map(isWin)))
  }
  return streaksByPlayer
}
```

- [ ] **Step 3: Update `computePongLeaderboard` to include `current_loss_streak`/`max_loss_streak`**

In the `.map(u => { ... })` inside `computePongLeaderboard`, change the destructuring and return value:

```ts
const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
return {
  player_id: u.id,
  name: u.name,
  wins: s.wins,
  losses: s.losses,
  win_rate: total > 0 ? s.wins / total : 0,
  cup_differential: s.cup_diff,
  current_streak: current,
  max_streak: max,
  current_loss_streak: currentLoss,
  max_loss_streak: maxLoss,
}
```

- [ ] **Step 4: Update `computeBeerDieLeaderboard` the same way**

In the `.map(u => { ... })` inside `computeBeerDieLeaderboard`:

```ts
const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
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
  current_loss_streak: currentLoss,
  max_loss_streak: maxLoss,
}
```

- [ ] **Step 5: Update `computeHeartsLeaderboard` — add `losses` to the return and destructure loss streak**

In the `.map(u => { ... })` inside `computeHeartsLeaderboard`, change the `computeStreaks` call and return:

```ts
const { current, max, currentLoss, maxLoss } = computeStreaks(
  (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at)).map(g => g.isWin)
)
return {
  player_id: u.id,
  name: u.name,
  games_played: s.played,
  wins,
  losses: s.losses,
  win_rate: s.played > 0 ? wins / s.played : 0,
  current_streak: current,
  max_streak: max,
  current_loss_streak: currentLoss,
  max_loss_streak: maxLoss,
}
```

- [ ] **Step 6: Update `computeCornholeLeaderboard` the same way as pong**

In the `.map(u => { ... })` inside `computeCornholeLeaderboard`:

```ts
const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
return {
  player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
  win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
  current_streak: current, max_streak: max,
  current_loss_streak: currentLoss, max_loss_streak: maxLoss,
}
```

- [ ] **Step 7: Update `computeSpikeballLeaderboard` the same way**

In the `.map(u => { ... })` inside `computeSpikeballLeaderboard`:

```ts
const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
return {
  player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
  win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
  current_streak: current, max_streak: max,
  current_loss_streak: currentLoss, max_loss_streak: maxLoss,
}
```

- [ ] **Step 8: Update `computePoolLeaderboard` the same way**

In the `.map(u => { ... })` inside `computePoolLeaderboard`:

```ts
const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
return {
  player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
  win_rate: total > 0 ? s.wins / total : 0, balls_differential: s.balls_diff,
  current_streak: current, max_streak: max,
  current_loss_streak: currentLoss, max_loss_streak: maxLoss,
}
```

- [ ] **Step 9: Update `computePokerLeaderboard` — change the `computeStreaks` call and return**

In the `.map(u => { ... })` inside `computePokerLeaderboard`, change:

```ts
const { current, max, currentLoss, maxLoss } = computeStreaks(games.map(g => g.isWin))
return {
  player_id: u.id,
  name: u.name,
  games_played: s.games_played,
  total_profit_cents: s.total_profit_cents,
  win_sessions: s.win_sessions,
  win_rate: s.games_played > 0 ? s.win_sessions / s.games_played : 0,
  current_streak: current,
  max_streak: max,
  current_loss_streak: currentLoss,
  max_loss_streak: maxLoss,
}
```

- [ ] **Step 10: Add loss streak assertions to the existing `computePongLeaderboard` and `computeHeartsLeaderboard` tests in `__tests__/lib/stats.test.ts`**

After the existing `'computes current_streak and max_streak'` test in `describe('computePongLeaderboard', ...)`, add:

```ts
it('computes current_loss_streak and max_loss_streak', () => {
  // The shared gamePlayers fixture uses the same played_at for all games, making sort order
  // non-deterministic. Use a fresh fixture with distinct timestamps so results are stable.
  const mkPongGP = (gameId: string, playerId: string, side: 'winner' | 'loser', at: string) => ({
    game_id: gameId, player_id: playerId, side,
    pong_games: { id: gameId, cups_left: 2, played_at: at },
  })
  // u1: win (oldest), loss, win (newest) → current_loss_streak 0, max_loss_streak 1
  // u2: loss (oldest), win, loss (newest) → current_loss_streak 1, max_loss_streak 1
  const gps = [
    mkPongGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
    mkPongGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
    mkPongGP('g2', 'u1', 'loser',  '2026-05-02T12:00:00Z'),
    mkPongGP('g2', 'u2', 'winner', '2026-05-02T12:00:00Z'),
    mkPongGP('g3', 'u1', 'winner', '2026-05-03T12:00:00Z'),
    mkPongGP('g3', 'u2', 'loser',  '2026-05-03T12:00:00Z'),
  ]
  const result = computePongLeaderboard(users, gps)
  const u1 = result.find(e => e.player_id === 'u1')!
  expect(u1.current_loss_streak).toBe(0)
  expect(u1.max_loss_streak).toBe(1)
  const u2 = result.find(e => e.player_id === 'u2')!
  expect(u2.current_loss_streak).toBe(1)
  expect(u2.max_loss_streak).toBe(1)
})
```

After the existing `'computes current_streak and max_streak based on not losing'` test in `describe('computeHeartsLeaderboard', ...)`, add:

```ts
it('computes losses, current_loss_streak, and max_loss_streak', () => {
  const result = computeHeartsLeaderboard(users, gamePlayers)
  // Giles (u1): g1 lost=true, g2 lost=false → losses 1, current_loss_streak 0, max_loss_streak 1
  const giles = result.find(e => e.name === 'Giles')!
  expect(giles.losses).toBe(1)
  expect(giles.current_loss_streak).toBe(0)
  expect(giles.max_loss_streak).toBe(1)
  // Sherm (u2): g1 lost=false, g2 lost=true, g3 lost=true → losses 2, current_loss_streak 2, max_loss_streak 2
  const sherm = result.find(e => e.name === 'Sherm')!
  expect(sherm.losses).toBe(2)
  expect(sherm.current_loss_streak).toBe(2)
  expect(sherm.max_loss_streak).toBe(2)
})
```

- [ ] **Step 11: Run all stats tests to verify everything passes**

```
npx jest __tests__/lib/stats.test.ts
```

Expected: all previously-passing tests still pass, plus the 4 new assertions.

- [ ] **Step 12: Commit**

```bash
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add current_loss_streak and max_loss_streak to all leaderboard types and compute functions"
```

---

### Task 3: Add `topLossStreaks`

**Files:**
- Modify: `__tests__/lib/stats.test.ts`
- Modify: `lib/stats.ts`

- [ ] **Step 1: Add `topLossStreaks` to the import in `__tests__/lib/stats.test.ts`**

Change line 1–13 to add `topLossStreaks` to the import:

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
  topStreaks,
  topLossStreaks,
} from '../../lib/stats'
```

- [ ] **Step 2: Add `topLossStreaks` tests after the existing `topStreaks` describe block**

Append to `__tests__/lib/stats.test.ts`:

```ts
describe('topLossStreaks', () => {
  const byLosses = (e: any) => e.losses

  it('returns empty array when no player has current_loss_streak >= 3', () => {
    const entries = [
      { name: 'Alice', current_loss_streak: 2, losses: 10 },
      { name: 'Bob',   current_loss_streak: 0, losses: 5 },
    ]
    expect(topLossStreaks(entries, byLosses)).toEqual([])
  })

  it('returns qualifying players sorted by streak descending', () => {
    const entries = [
      { name: 'Alice', current_loss_streak: 5, losses: 8 },
      { name: 'Bob',   current_loss_streak: 3, losses: 4 },
      { name: 'Carol', current_loss_streak: 2, losses: 6 },
    ]
    expect(topLossStreaks(entries, byLosses)).toEqual([
      { name: 'Alice', streak: 5 },
      { name: 'Bob',   streak: 3 },
    ])
  })

  it('caps results at 3', () => {
    const entries = [
      { name: 'A', current_loss_streak: 5, losses: 10 },
      { name: 'B', current_loss_streak: 4, losses: 8 },
      { name: 'C', current_loss_streak: 4, losses: 7 },
      { name: 'D', current_loss_streak: 3, losses: 6 },
    ]
    const result = topLossStreaks(entries, byLosses)
    expect(result).toHaveLength(3)
    expect(result.map(e => e.name)).toEqual(['A', 'B', 'C'])
  })

  it('breaks ties by the lossesOf accessor descending', () => {
    const entries = [
      { name: 'Alice', current_loss_streak: 3, losses: 10 },
      { name: 'Bob',   current_loss_streak: 3, losses: 15 },
      { name: 'Carol', current_loss_streak: 3, losses: 5 },
      { name: 'Dave',  current_loss_streak: 3, losses: 12 },
    ]
    const result = topLossStreaks(entries, byLosses)
    expect(result.map(e => e.name)).toEqual(['Bob', 'Dave', 'Alice'])
  })

  it('works with a custom lossesOf accessor (e.g. losing sessions for poker)', () => {
    const entries = [
      { name: 'Alice', current_loss_streak: 3, losing_sessions: 7 },
      { name: 'Bob',   current_loss_streak: 3, losing_sessions: 9 },
    ]
    expect(topLossStreaks(entries, e => e.losing_sessions)).toEqual([
      { name: 'Bob',   streak: 3 },
      { name: 'Alice', streak: 3 },
    ])
  })
})
```

- [ ] **Step 3: Run tests to verify `topLossStreaks` tests fail (function not yet exported)**

```
npx jest __tests__/lib/stats.test.ts --testNamePattern="topLossStreaks"
```

Expected: compile/import error since `topLossStreaks` is not yet defined.

- [ ] **Step 4: Add `topLossStreaks` to `lib/stats.ts` immediately after the `topStreaks` function**

```ts
export function topLossStreaks<E extends { name: string; current_loss_streak: number }>(
  entries: E[],
  lossesOf: (e: E) => number
): { name: string; streak: number }[] {
  return entries
    .filter(e => e.current_loss_streak >= 3)
    .sort((a, b) => b.current_loss_streak - a.current_loss_streak || lossesOf(b) - lossesOf(a))
    .slice(0, 3)
    .map(e => ({ name: e.name, streak: e.current_loss_streak }))
}
```

- [ ] **Step 5: Run all stats tests**

```
npx jest __tests__/lib/stats.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add __tests__/lib/stats.test.ts lib/stats.ts
git commit -m "feat: add topLossStreaks function"
```

---

### Task 4: Add `formatLossStreak` to dashboard utils

**Files:**
- Modify: `lib/dashboard.ts`

- [ ] **Step 1: Add `formatLossStreak` to `lib/dashboard.ts` immediately after `formatStreak`**

```ts
export function formatLossStreak(value: number): string {
  return value >= 3 ? `😂${value}` : String(value)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dashboard.ts
git commit -m "feat: add formatLossStreak helper"
```

---

### Task 5: Add loss streak stat cards to PlayerStats

**Files:**
- Modify: `components/PlayerStats.tsx`

- [ ] **Step 1: Import `formatLossStreak` alongside `formatStreak` in `components/PlayerStats.tsx`**

Change the import from `@/lib/dashboard` to include `formatLossStreak`:

```ts
import {
  getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult,
  formatPokerResult, formatStreak, formatLossStreak, sortCardsByPlayed, ActivityItem,
} from '@/lib/dashboard'
```

- [ ] **Step 2: Add `Loss Streak` and `Max Loss Streak` StatCards to `PongCard`**

In the `StatGrid` inside `PongCard`, add after the existing `Max Streak` card:

```tsx
<StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
<StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
```

The full updated `StatGrid` for `PongCard`:

```tsx
<StatGrid>
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Losses" value={String(entry.losses)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Cup Diff" value={signed(entry.cup_differential)} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 3: Do the same for `BeerDieCard`**

```tsx
<StatGrid>
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Losses" value={String(entry.losses)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
  <StatCard label="Sinks" value={String(entry.sinks)} />
  <StatCard label="Self Sinks" value={String(entry.self_sinks)} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 4: Do the same for `CornholeCard`**

```tsx
<StatGrid>
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Losses" value={String(entry.losses)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 5: Do the same for `SpikeballCard`**

```tsx
<StatGrid>
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Losses" value={String(entry.losses)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 6: Do the same for `PoolCard`**

```tsx
<StatGrid>
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Losses" value={String(entry.losses)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Ball Diff" value={signed(entry.balls_differential)} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 7: Do the same for `PokerCard`**

```tsx
<StatGrid>
  <StatCard label="Games" value={String(entry.games_played)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Profit" value={`${entry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(entry.total_profit_cents) / 100).toFixed(2)}`} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 8: Do the same for `HeartsCard`**

```tsx
<StatGrid>
  <StatCard label="Games" value={String(entry.games_played)} />
  <StatCard label="Wins" value={String(entry.wins)} />
  <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
  <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
  <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
  <StatCard label="Loss Streak" value={formatLossStreak(entry.current_loss_streak)} />
  <StatCard label="Max Loss Streak" value={formatLossStreak(entry.max_loss_streak)} />
</StatGrid>
```

- [ ] **Step 9: Commit**

```bash
git add components/PlayerStats.tsx
git commit -m "feat: add Loss Streak and Max Loss Streak stat cards to player profile"
```

---

### Task 6: Add cold streaks to home page tiles

**Files:**
- Modify: `app/g/[slug]/page.tsx`

- [ ] **Step 1: Add `topLossStreaks` to the import from `@/lib/stats`**

Change the import at the top of `app/g/[slug]/page.tsx`:

```ts
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard, topStreaks, topLossStreaks } from '@/lib/stats'
```

- [ ] **Step 2: Add `coldStreaks` to the `GameLeader` type**

Replace the `GameLeader` type definition:

```ts
type GameLeader = {
  name: string
  wins: number
  losses: number
  winRatePct: number
  statLine?: string
  hotStreaks: { name: string; streak: number }[]
  coldStreaks: { name: string; streak: number }[]
} | null
```

- [ ] **Step 3: Update the `toLeader` helper to accept and pass through `coldStreaks`**

Replace the `toLeader` function:

```ts
const toLeader = (entry: any, hs: { name: string; streak: number }[], cs: { name: string; streak: number }[], isHearts = false): GameLeader => {
  if (!entry) return null
  if (isHearts) {
    const wins = entry.games_played - entry.losses
    return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100), hotStreaks: hs, coldStreaks: cs }
  }
  return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100), hotStreaks: hs, coldStreaks: cs }
}
```

- [ ] **Step 4: Add loss accessors and update all `toLeader` calls in `getGameLeaders`**

Add these two accessors alongside the existing ones (after `byGamesMinusLosses`):

```ts
const byLosses        = (e: { losses: number }) => e.losses
const pokerByLosses   = (e: { games_played: number; win_sessions: number }) => e.games_played - e.win_sessions
```

Then replace the `return { ... }` block inside `getGameLeaders`:

```ts
return {
  pong:       toLeader(pongLB[0],      topStreaks(pongLB,      byWins),            topLossStreaks(pongLB,      byLosses)),
  'beer-die': toLeader(beerDieLB[0],   topStreaks(beerDieLB,   byWins),            topLossStreaks(beerDieLB,   byLosses)),
  hearts:     toLeader(heartsLB[0],    topStreaks(heartsLB,    byGamesMinusLosses), topLossStreaks(heartsLB,    byLosses), true),
  cornhole:   toLeader(cornholeLB[0],  topStreaks(cornholeLB,  byWins),            topLossStreaks(cornholeLB,  byLosses)),
  spikeball:  toLeader(spikeballLB[0], topStreaks(spikeballLB, byWins),            topLossStreaks(spikeballLB, byLosses)),
  pool:       toLeader(poolLB[0],      topStreaks(poolLB,      byWins),            topLossStreaks(poolLB,      byLosses)),
  poker: (() => {
    if (!pokerTop) return null
    const abs = Math.abs(pokerTop.total_profit_cents)
    const dollars = (abs / 100).toFixed(2)
    const sign = pokerTop.total_profit_cents >= 0 ? '+' : '-'
    return {
      name: pokerTop.name,
      wins: pokerTop.win_sessions,
      losses: pokerTop.games_played - pokerTop.win_sessions,
      winRatePct: Math.round(pokerTop.win_rate * 100),
      statLine: `${sign}$${dollars} · ${pokerTop.games_played} games`,
      hotStreaks: topStreaks(pokerLB, byWinSessions),
      coldStreaks: topLossStreaks(pokerLB, pokerByLosses),
    }
  })(),
}
```

- [ ] **Step 5: Update the tile JSX to render cold streak badges in the same column as hot streaks**

Find the `{leader && leader.hotStreaks.length > 0 && ( ... )}` block in the tile JSX and replace it:

```tsx
{leader && (leader.hotStreaks.length > 0 || leader.coldStreaks.length > 0) && (
  <div className="flex flex-col items-end gap-0.5">
    {leader.hotStreaks.map(({ name: n, streak }) => (
      <div key={`hot-${n}-${streak}`} className="text-[10px] font-bold text-amber-600 leading-tight whitespace-nowrap">
        🔥{streak} {n}
      </div>
    ))}
    {leader.coldStreaks.map(({ name: n, streak }) => (
      <div key={`cold-${n}-${streak}`} className="text-[10px] font-bold text-blue-500 leading-tight whitespace-nowrap">
        😂{streak} {n}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add app/g/\[slug\]/page.tsx
git commit -m "feat: add cold streak badges to home page game tiles"
```

---

### Task 7: Add loss streak name decoration to all 7 game leaderboard pages

**Files:**
- Modify: `app/g/[slug]/pong/page.tsx`
- Modify: `app/g/[slug]/beer-die/page.tsx`
- Modify: `app/g/[slug]/cornhole/page.tsx`
- Modify: `app/g/[slug]/spikeball/page.tsx`
- Modify: `app/g/[slug]/pool/page.tsx`
- Modify: `app/g/[slug]/poker/page.tsx`
- Modify: `app/g/[slug]/hearts/page.tsx`

Each page has this pattern for building the leaderboard entries:
```ts
name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
```

Replace it with the 3-way ternary in all 7 pages. A player can't simultaneously hold a win streak and a loss streak, so the conditions are mutually exclusive.

- [ ] **Step 1: Update `app/g/[slug]/pong/page.tsx`**

```ts
const entries = leaderboard.map(e => ({
  ...e,
  name: e.current_streak >= 3
    ? `🔥${e.current_streak} ${e.name}`
    : e.current_loss_streak >= 3
      ? `😂${e.current_loss_streak} ${e.name}`
      : e.name,
}))
```

- [ ] **Step 2: Update `app/g/[slug]/beer-die/page.tsx`** — same change as pong.

- [ ] **Step 3: Update `app/g/[slug]/cornhole/page.tsx`** — same change as pong.

- [ ] **Step 4: Update `app/g/[slug]/spikeball/page.tsx`** — same change as pong.

- [ ] **Step 5: Update `app/g/[slug]/pool/page.tsx`** — same change as pong.

- [ ] **Step 6: Update `app/g/[slug]/poker/page.tsx`** — same change as pong.

- [ ] **Step 7: Update `app/g/[slug]/hearts/page.tsx`** — same change as pong.

- [ ] **Step 8: Run the full test suite to confirm nothing is broken**

```
npm test
```

Expected: all tests that were passing before still pass.

- [ ] **Step 9: Commit**

```bash
git add app/g/\[slug\]/pong/page.tsx app/g/\[slug\]/beer-die/page.tsx app/g/\[slug\]/cornhole/page.tsx app/g/\[slug\]/spikeball/page.tsx app/g/\[slug\]/pool/page.tsx app/g/\[slug\]/poker/page.tsx app/g/\[slug\]/hearts/page.tsx
git commit -m "feat: decorate leaderboard player names with 😂 on active loss streaks >= 3"
```
