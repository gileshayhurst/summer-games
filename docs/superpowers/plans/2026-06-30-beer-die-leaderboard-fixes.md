# Beer Die Leaderboard Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sinks/self-sinks columns to the Beer Die leaderboard and show a 🔥{streak} indicator next to any player's name when they have 3+ consecutive wins.

**Architecture:** Add `win_streak` to `BeerDieLeaderboardEntry` in `lib/types.ts`, compute it inside `computeBeerDieLeaderboard` in `lib/stats.ts`, then surface sinks columns and mutate the name field in `app/g/[slug]/beer-die/page.tsx`.

**Tech Stack:** TypeScript, Next.js App Router, Jest (tests in `__tests__/lib/stats.test.ts`)

---

### Task 1: Add `win_streak` to `BeerDieLeaderboardEntry` type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `win_streak` field to the type**

Open `lib/types.ts`. Find `BeerDieLeaderboardEntry` (currently at line 99). Add `win_streak: number` as the last field:

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
  win_streak: number
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add win_streak to BeerDieLeaderboardEntry type"
```

---

### Task 2: Write failing tests for win_streak computation

**Files:**
- Modify: `__tests__/lib/stats.test.ts`

The existing `computeBeerDieLeaderboard` tests (around line 92) use an outdated `BeerDieGame` type that had `winner1_id` etc. The current function signature is `(users, gamePlayers: BeerDieGamePlayer[], sinks)`. Add new tests below the existing `computeBeerDieLeaderboard` describe block.

- [ ] **Step 1: Add helper and streak tests**

Locate the closing `})` of the `computeBeerDieLeaderboard` describe block (around line 109 in `__tests__/lib/stats.test.ts`) and insert after it:

```ts
describe('computeBeerDieLeaderboard — win_streak', () => {
  const bdg = (id: string, at: string) => ({ id, points_differential: 5, played_at: at })

  const mkGP = (gameId: string, playerId: string, side: 'winner' | 'loser', at: string) => ({
    game_id: gameId,
    player_id: playerId,
    side,
    beer_die_games: bdg(gameId, at),
  })

  it('returns 0 win_streak for a player with no games', () => {
    const result = computeBeerDieLeaderboard(users, [], [])
    expect(result).toHaveLength(0)
  })

  it('counts consecutive wins at the end of game history', () => {
    // u1: loss (g1), win (g2), win (g3), win (g4) → streak 3
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
    expect(u1.win_streak).toBe(3)
  })

  it('returns 0 win_streak when most recent game was a loss', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
      mkGP('g2', 'u1', 'loser',  '2026-05-02T12:00:00Z'),
      mkGP('g2', 'u2', 'winner', '2026-05-02T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.win_streak).toBe(0)
  })

  it('counts a single win as a streak of 1', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.win_streak).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/lib/stats.test.ts --testNamePattern="win_streak" --no-coverage
```

Expected: FAIL — `win_streak` will be `undefined` since `computeBeerDieLeaderboard` doesn't compute it yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add __tests__/lib/stats.test.ts
git commit -m "test: add failing tests for win_streak in computeBeerDieLeaderboard"
```

---

### Task 3: Implement win_streak computation in stats.ts

**Files:**
- Modify: `lib/stats.ts`

- [ ] **Step 1: Add win_streak computation inside `computeBeerDieLeaderboard`**

In `lib/stats.ts`, replace the `computeBeerDieLeaderboard` function (lines 62–100) with:

```ts
export function computeBeerDieLeaderboard(
  users: User[],
  gamePlayers: BeerDieGamePlayer[],
  sinks: BeerDieSink[] = []
): BeerDieLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0, sinks: 0, self_sinks: 0 }]))

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.beer_die_games.points_differential }
    else { s.losses++; s.point_diff -= gp.beer_die_games.points_differential }
  }

  for (const sink of sinks) {
    const s = stats.get(sink.player_id)
    if (!s) continue
    if (sink.type === 'sink') s.sinks++
    else if (sink.type === 'self_sink') s.self_sinks++
  }

  // Compute win streaks: sort each player's games newest-first, count leading wins
  const gamesByPlayer = new Map<string, { side: string; played_at: string }[]>()
  for (const gp of gamePlayers) {
    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ side: gp.side, played_at: gp.beer_die_games.played_at })
  }
  const winStreaks = new Map<string, number>()
  for (const [playerId, games] of gamesByPlayer) {
    games.sort((a, b) => b.played_at.localeCompare(a.played_at))
    let streak = 0
    for (const g of games) {
      if (g.side === 'winner') streak++
      else break
    }
    winStreaks.set(playerId, streak)
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        point_differential: s.point_diff,
        sinks: s.sinks,
        self_sinks: s.self_sinks,
        win_streak: winStreaks.get(u.id) ?? 0,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}
```

- [ ] **Step 2: Run the win_streak tests to verify they pass**

```bash
npx jest __tests__/lib/stats.test.ts --testNamePattern="win_streak" --no-coverage
```

Expected: all 4 tests PASS.

- [ ] **Step 3: Run the full stats test suite to check for regressions**

```bash
npx jest __tests__/lib/stats.test.ts --no-coverage
```

Expected: all tests PASS. (Note: the old `computeBeerDieLeaderboard` tests at line 92–108 use the old `BeerDieGame` shape and may already be failing before this change — if so, they were pre-existing failures, not regressions from this task.)

- [ ] **Step 4: Commit**

```bash
git add lib/stats.ts
git commit -m "feat: compute win_streak in computeBeerDieLeaderboard"
```

---

### Task 4: Update the Beer Die page — sinks columns + streak name display

**Files:**
- Modify: `app/g/[slug]/beer-die/page.tsx`

- [ ] **Step 1: Add sinks/self-sinks columns and streak name mutation**

Open `app/g/[slug]/beer-die/page.tsx`. Replace the `columns` definition and the `<Leaderboard>` usage (lines 40–54) with:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
    { key: 'sinks', label: 'Sinks', sortDirection: 'desc' as const },
    { key: 'self_sinks', label: 'Self Sinks', sortDirection: 'asc' as const },
  ]

  const entries = leaderboard.map(e => ({
    ...e,
    name: e.win_streak >= 3 ? `${e.name} 🔥${e.win_streak}` : e.name,
  }))
```

Then update the `<Leaderboard>` call to use `entries` instead of `leaderboard`:

```tsx
      <Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Commit**

```bash
git add app/g/[slug]/beer-die/page.tsx
git commit -m "feat: add sinks columns and win streak indicator to beer die leaderboard"
```

---

### Task 5: Verify in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open the Beer Die leaderboard**

Navigate to a group's Beer Die page (e.g. `http://localhost:3000/g/<your-slug>/beer-die`).

Verify:
- `Sinks` and `Self Sinks` columns appear in the leaderboard table
- Both columns are sortable (appear in the sort dropdown)
- Any player with 3+ consecutive wins shows `🔥N` appended to their name
- Players with fewer than 3 consecutive wins show no fire indicator
- Sort by name, Win%, etc. still works

- [ ] **Step 3: Stop the dev server** (`Ctrl+C`)
