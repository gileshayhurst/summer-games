# Streaks Everywhere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show win streaks on every game leaderboard page and surface the top 3 hottest players on each home page game card.

**Architecture:** Export a `topStreaks` pure helper from `lib/stats.ts` (testable in isolation). Apply the `🔥N Name` decoration at the page level for each leaderboard page. Extend the `GameLeader` type in the home page to carry `hotStreaks`, populate it from the already-fetched leaderboard data, and render it in the card's top-right corner.

**Tech Stack:** Next.js 14 App Router, TypeScript, Jest for tests. No DB schema changes — `current_streak` is already computed by all leaderboard functions in `lib/stats.ts`.

---

## File map

| File | Change |
|------|--------|
| `lib/stats.ts` | Add exported `topStreaks` function |
| `__tests__/lib/stats.test.ts` | Add `topStreaks` tests |
| `app/g/[slug]/pong/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/beer-die/page.tsx` | Update streak format (number before name) |
| `app/g/[slug]/hearts/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/cornhole/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/spikeball/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/pool/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/poker/page.tsx` | Add streak decoration to entries |
| `app/g/[slug]/page.tsx` | Extend type + getGameLeaders + card JSX |

Example pages (`app/g/example/`) are intentionally skipped — their static data has no `current_streak` field so any mapping would be a no-op.

---

### Task 1: Add `topStreaks` to `lib/stats.ts` (TDD)

**Files:**
- Modify: `lib/stats.ts`
- Test: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write failing tests**

Add this block at the end of `__tests__/lib/stats.test.ts`:

```ts
import {
  // existing imports…
  topStreaks,
} from '../../lib/stats'

describe('topStreaks', () => {
  const byWins = (e: any) => e.wins

  it('returns empty array when no player has current_streak >= 3', () => {
    const entries = [
      { name: 'Alice', current_streak: 2, wins: 10 },
      { name: 'Bob',   current_streak: 0, wins: 5 },
    ]
    expect(topStreaks(entries, byWins)).toEqual([])
  })

  it('returns qualifying players sorted by streak descending', () => {
    const entries = [
      { name: 'Alice', current_streak: 5, wins: 8 },
      { name: 'Bob',   current_streak: 3, wins: 4 },
      { name: 'Carol', current_streak: 2, wins: 6 },
    ]
    expect(topStreaks(entries, byWins)).toEqual([
      { name: 'Alice', streak: 5 },
      { name: 'Bob',   streak: 3 },
    ])
  })

  it('caps results at 3', () => {
    const entries = [
      { name: 'A', current_streak: 5, wins: 10 },
      { name: 'B', current_streak: 4, wins: 8 },
      { name: 'C', current_streak: 4, wins: 7 },
      { name: 'D', current_streak: 3, wins: 6 },
    ]
    const result = topStreaks(entries, byWins)
    expect(result).toHaveLength(3)
    expect(result.map(e => e.name)).toEqual(['A', 'B', 'C'])
  })

  it('breaks ties by the winsOf accessor descending', () => {
    const entries = [
      { name: 'Alice', current_streak: 3, wins: 10 },
      { name: 'Bob',   current_streak: 3, wins: 15 },
      { name: 'Carol', current_streak: 3, wins: 5 },
      { name: 'Dave',  current_streak: 3, wins: 12 },
    ]
    const result = topStreaks(entries, byWins)
    expect(result.map(e => e.name)).toEqual(['Bob', 'Dave', 'Alice'])
  })

  it('works with a custom winsOf accessor (e.g. win_sessions for poker)', () => {
    const entries = [
      { name: 'Alice', current_streak: 3, win_sessions: 7 },
      { name: 'Bob',   current_streak: 3, win_sessions: 9 },
    ]
    expect(topStreaks(entries, e => e.win_sessions)).toEqual([
      { name: 'Bob',   streak: 3 },
      { name: 'Alice', streak: 3 },
    ])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/lib/stats.test.ts -t "topStreaks" --no-coverage
```

Expected: several failures with `topStreaks is not a function` or similar.

- [ ] **Step 3: Implement `topStreaks` in `lib/stats.ts`**

Add this function at the end of `lib/stats.ts` (after `computePokerLeaderboard`):

```ts
export function topStreaks(
  entries: { name: string; current_streak: number }[],
  winsOf: (e: any) => number
): { name: string; streak: number }[] {
  return entries
    .filter(e => e.current_streak >= 3)
    .sort((a, b) => b.current_streak - a.current_streak || winsOf(b) - winsOf(a))
    .slice(0, 3)
    .map(e => ({ name: e.name, streak: e.current_streak }))
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/lib/stats.test.ts --no-coverage
```

Expected: all tests pass including the new `topStreaks` suite.

- [ ] **Step 5: Commit**

```bash
git add lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add topStreaks helper to stats.ts"
```

---

### Task 2: Apply `🔥N Name` decoration to all individual game leaderboard pages

**Files:**
- Modify: `app/g/[slug]/pong/page.tsx`
- Modify: `app/g/[slug]/beer-die/page.tsx`
- Modify: `app/g/[slug]/hearts/page.tsx`
- Modify: `app/g/[slug]/cornhole/page.tsx`
- Modify: `app/g/[slug]/spikeball/page.tsx`
- Modify: `app/g/[slug]/pool/page.tsx`
- Modify: `app/g/[slug]/poker/page.tsx`

**Pattern:** For pong / cornhole / spikeball / pool / poker / hearts, add an `entries` mapping step between the leaderboard computation and the `<Leaderboard>` call. For beer-die, update the existing mapping to flip number and name.

- [ ] **Step 1: Update `app/g/[slug]/pong/page.tsx`**

After the line `const leaderboard = computePongLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call from:

```tsx
<Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

to:

```tsx
<Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/[slug]/beer-die/page.tsx`**

The existing mapping already exists — find this line:

```ts
name: e.current_streak >= 3 ? `${e.name} 🔥${e.current_streak}` : e.name,
```

Change it to:

```ts
name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
```

(Number and fire emoji move before the name.)

- [ ] **Step 3: Update `app/g/[slug]/hearts/page.tsx`**

After `const leaderboard = computeHeartsLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call from:

```tsx
<Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="loss_rate" />
```

to:

```tsx
<Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="loss_rate" />
```

- [ ] **Step 4: Update `app/g/[slug]/cornhole/page.tsx`**

After `const leaderboard = computeCornholeLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call to use `entries` instead of `leaderboard`.

- [ ] **Step 5: Update `app/g/[slug]/spikeball/page.tsx`**

After `const leaderboard = computeSpikeballLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call to use `entries` instead of `leaderboard`.

- [ ] **Step 6: Update `app/g/[slug]/pool/page.tsx`**

After `const leaderboard = computePoolLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call to use `entries` instead of `leaderboard`.

- [ ] **Step 7: Update `app/g/[slug]/poker/page.tsx`**

After `const leaderboard = computePokerLeaderboard(...)`, add:

```ts
  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))
```

Change the `<Leaderboard>` call from:

```tsx
<Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="total_profit_cents" />
```

to:

```tsx
<Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="total_profit_cents" />
```

- [ ] **Step 8: Run lint to catch any type errors**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/g/\[slug\]/pong/page.tsx app/g/\[slug\]/beer-die/page.tsx app/g/\[slug\]/hearts/page.tsx app/g/\[slug\]/cornhole/page.tsx app/g/\[slug\]/spikeball/page.tsx app/g/\[slug\]/pool/page.tsx app/g/\[slug\]/poker/page.tsx
git commit -m "feat: show 🔥N Name streak decoration on all game leaderboards"
```

---

### Task 3: Update the home page — type, data, and card JSX

**Files:**
- Modify: `app/g/[slug]/page.tsx`

This task has three sub-steps: extend the `GameLeader` type, update `getGameLeaders` to compute hot streaks, and update the card JSX to render them.

- [ ] **Step 1: Add `topStreaks` to the import line**

Find the existing import at the top of `app/g/[slug]/page.tsx`:

```ts
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard } from '@/lib/stats'
```

Add `topStreaks` to it:

```ts
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard, topStreaks } from '@/lib/stats'
```

- [ ] **Step 2: Extend the `GameLeader` type**

Find:

```ts
type GameLeader = { name: string; wins: number; losses: number; winRatePct: number; statLine?: string } | null
```

Replace with:

```ts
type GameLeader = {
  name: string
  wins: number
  losses: number
  winRatePct: number
  statLine?: string
  hotStreaks: { name: string; streak: number }[]
} | null
```

- [ ] **Step 3: Replace the `getGameLeaders` function body**

The function currently takes `[0]` of each leaderboard. Replace the entire body (from `const pongTop = ...` through the `return { ... }`) with the following, which computes full leaderboards first so both the top player and the hot streaks can be derived from the same data:

```ts
    const u = (users ?? []) as User[]

    const pongLB       = computePongLeaderboard(u, (pongPlayers ?? []) as unknown as PongGamePlayer[])
    const beerDieLB    = computeBeerDieLeaderboard(u, (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[], (beerDieSinks ?? []) as BeerDieSink[])
    const heartsLB     = computeHeartsLeaderboard(u, (heartsPlayers ?? []) as unknown as HeartsGamePlayer[])
    const cornholeLB   = computeCornholeLeaderboard(u, (cornholePlayers ?? []) as unknown as CornholeGamePlayer[])
    const spikeballLB  = computeSpikeballLeaderboard(u, (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[])
    const poolLB       = computePoolLeaderboard(u, (poolPlayers ?? []) as unknown as PoolGamePlayer[])
    const pokerLB      = computePokerLeaderboard(u, (pokerPlayers ?? []) as unknown as PokerGamePlayer[])

    const byWins              = (e: any) => e.wins
    const byWinSessions       = (e: any) => e.win_sessions
    const byGamesMinusLosses  = (e: any) => e.games_played - e.losses

    const toLeader = (entry: any, hs: { name: string; streak: number }[], isHearts = false): GameLeader => {
      if (!entry) return null
      if (isHearts) {
        const wins = entry.games_played - entry.losses
        return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100), hotStreaks: hs }
      }
      return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100), hotStreaks: hs }
    }

    const pokerTop = pokerLB[0]

    return {
      pong:       toLeader(pongLB[0],      topStreaks(pongLB,      byWins)),
      'beer-die': toLeader(beerDieLB[0],   topStreaks(beerDieLB,   byWins)),
      hearts:     toLeader(heartsLB[0],    topStreaks(heartsLB,    byGamesMinusLosses), true),
      cornhole:   toLeader(cornholeLB[0],  topStreaks(cornholeLB,  byWins)),
      spikeball:  toLeader(spikeballLB[0], topStreaks(spikeballLB, byWins)),
      pool:       toLeader(poolLB[0],      topStreaks(poolLB,      byWins)),
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
        }
      })(),
    }
```

- [ ] **Step 4: Update the card JSX**

Find the existing card icon line inside `GAME_CARDS.map(...)`:

```tsx
              <div className="text-xl mb-1">{icon}</div>
```

Replace it with a flex row that puts the icon on the left and hot streaks on the right:

```tsx
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xl">{icon}</div>
                {leader && leader.hotStreaks.length > 0 && (
                  <div className="flex flex-col items-end gap-0.5">
                    {leader.hotStreaks.map(({ name: n, streak }) => (
                      <div key={n} className="text-[10px] font-bold text-amber-600 leading-tight whitespace-nowrap">
                        🔥{streak} {n}
                      </div>
                    ))}
                  </div>
                )}
              </div>
```

(The inner variable is named `n` to avoid shadowing the `name` game-card field from the outer `.map()`.)

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 6: Run tests**

```bash
npm test --no-coverage
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/g/\[slug\]/page.tsx
git commit -m "feat: show top 3 hot streaks on home page game cards"
```

---

### Task 4: Commit the spec file

- [ ] **Step 1: Commit the spec**

```bash
git add docs/superpowers/specs/2026-07-02-streaks-everywhere-design.md
git commit -m "docs: add streaks everywhere design spec"
```
