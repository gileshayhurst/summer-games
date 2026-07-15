# Hearts Win Rate & Browse Return Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the Hearts leaderboard from loss% to win%, and show a "← Browse" button in the group nav when the user arrived from the Discover page.

**Architecture:** Hearts stats change is a pure data-layer swap (stats fn → type → UI); no DB changes needed since wins derive from `played - losses`. The browse return button uses session storage set on the discover page and read by GroupNav on mount — no URL pollution, persists across within-group navigation.

**Tech Stack:** Next.js 14 App Router, TypeScript, Jest, React, session storage API

---

## File Map

**Feature 1 — Hearts Win Rate:**
- Modify: `lib/types.ts` — replace `losses`/`loss_rate` with `wins`/`win_rate` in `HeartsLeaderboardEntry`
- Modify: `lib/stats.ts` — recompute and return `wins`/`win_rate`, sort descending
- Modify: `__tests__/lib/stats.test.ts` — update Hearts assertions
- Modify: `app/g/[slug]/hearts/page.tsx` — new columns and subtitle
- Modify: `app/g/example/hearts/page.tsx` — new columns
- Modify: `app/g/example/data.ts` — replace `losses`/`loss_rate` with `wins`/`win_rate`
- Modify: `components/PlayerStats.tsx` — swap HeartsCard stat tiles

**Feature 2 — Browse Return Button:**
- Create: `components/DiscoverList.tsx` — client component that sets session storage on click
- Modify: `app/discover/page.tsx` — render `<DiscoverList>` instead of inline links
- Modify: `components/GroupNav.tsx` — read session storage on mount, show "← Browse" button

---

## Task 1: Update Hearts test assertions

**Files:**
- Modify: `__tests__/lib/stats.test.ts`

The existing Hearts tests check for `loss_rate` and sort ascending. We update them to check `win_rate` and sort descending before touching the implementation — this makes the tests fail, giving us a red state to work from.

- [ ] **Step 1: Replace the Hearts test block**

In `__tests__/lib/stats.test.ts`, find the `describe('computeHeartsLeaderboard', ...)` block (lines ~222–253) and replace it entirely with:

```ts
describe('computeHeartsLeaderboard', () => {
  const gamePlayers: HeartsGamePlayer[] = [
    { game_id: 'g1', player_id: 'u1', lost: true,  hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g1', player_id: 'u2', lost: false, hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u1', lost: false, hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u2', lost: true,  hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g3', player_id: 'u2', lost: true,  hearts_games: { id: 'g3', played_at: '2026-05-03T12:00:00Z' } },
  ]

  it('ranks by win rate descending', () => {
    const result = computeHeartsLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')   // 1 win / 2 games = 50% win rate
    expect(result[1].name).toBe('Sherm')   // 1 win / 3 games = 33% win rate
  })

  it('computes wins and win_rate correctly', () => {
    const result = computeHeartsLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.wins).toBe(1)
    expect(giles.win_rate).toBeCloseTo(0.5)
    const sherm = result.find(e => e.name === 'Sherm')!
    expect(sherm.wins).toBe(1)
    expect(sherm.win_rate).toBeCloseTo(1 / 3)
  })

  it('excludes players with 0 games', () => {
    expect(computeHeartsLeaderboard(users, [])).toHaveLength(0)
  })

  it('computes current_streak and max_streak based on not losing', () => {
    // Giles (u1): g1 lost=true (loss), g2 lost=false (win) → current 1, max 1
    const result = computeHeartsLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)

    // Sherm (u2): g1 lost=false (win), g2 lost=true (loss), g3 lost=true (loss) → current 0, max 1
    const sherm = result.find(e => e.name === 'Sherm')!
    expect(sherm.current_streak).toBe(0)
    expect(sherm.max_streak).toBe(1)
  })
})
```

- [ ] **Step 2: Run the Hearts tests to confirm they fail**

```
npx jest __tests__/lib/stats.test.ts -t "computeHeartsLeaderboard" --no-coverage
```

Expected: FAIL — `Property 'wins' does not exist` or assertion errors.

---

## Task 2: Update type and stats function

**Files:**
- Modify: `lib/types.ts` — lines ~136–144
- Modify: `lib/stats.ts` — lines ~176–212

- [ ] **Step 1: Update `HeartsLeaderboardEntry` in `lib/types.ts`**

Replace:
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

With:
```ts
export type HeartsLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  wins: number
  win_rate: number
  current_streak: number
  max_streak: number
}
```

- [ ] **Step 2: Update `computeHeartsLeaderboard` in `lib/stats.ts`**

Find the `return users` block inside `computeHeartsLeaderboard` (the `.map(u => { const s = stats.get(u.id)!` section through `.sort(...)`). Replace only that return statement:

```ts
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const wins = s.played - s.losses
      const { current, max } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0 }
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.played,
        wins,
        win_rate: s.played > 0 ? wins / s.played : 0,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.games_played - a.games_played)
```

- [ ] **Step 3: Run the Hearts tests to confirm they pass**

```
npx jest __tests__/lib/stats.test.ts -t "computeHeartsLeaderboard" --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 4: Run the full test suite to confirm no regressions**

```
npm test -- --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add lib/types.ts lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: switch Hearts leaderboard from loss rate to win rate"
```

---

## Task 3: Update Hearts UI pages and example data

**Files:**
- Modify: `app/g/[slug]/hearts/page.tsx`
- Modify: `app/g/example/hearts/page.tsx`
- Modify: `app/g/example/data.ts`

- [ ] **Step 1: Update `app/g/[slug]/hearts/page.tsx`**

Replace the `columns` array and subtitle:

```ts
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
    { key: 'wins', label: 'Wins', sortDirection: 'desc' as const },
    { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
  ]
```

And change the subtitle `<p>` tag from:
```tsx
        <p className="text-muted text-sm">Ranked by lowest loss rate</p>
```
To:
```tsx
        <p className="text-muted text-sm">Ranked by highest win rate</p>
```

And change `defaultSortKey` in the `<Leaderboard>` call from `"loss_rate"` to `"win_rate"`.

- [ ] **Step 2: Update `app/g/example/hearts/page.tsx`**

Replace the `columns` array:

```ts
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
  { key: 'wins', label: 'Wins', sortDirection: 'desc' as const },
  { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
]
```

Change the subtitle from `"Ranked by lowest loss rate"` to `"Ranked by highest win rate"`.

Change `defaultSortKey` from `"loss_rate"` to `"win_rate"`.

- [ ] **Step 3: Update `exampleHeartsLeaderboard` in `app/g/example/data.ts`**

Replace the entire `exampleHeartsLeaderboard` array. Wins derive from `games_played - losses`; win_rate from `wins / games_played`:

```ts
export const exampleHeartsLeaderboard = [
  { name: 'Adrian',  games_played: 1,  wins: 1, win_rate: 1.0 },
  { name: 'Giles',   games_played: 11, wins: 11, win_rate: 1.0 },
  { name: 'Noah',    games_played: 3,  wins: 3, win_rate: 1.0 },
  { name: 'Ant',     games_played: 7,  wins: 6, win_rate: 0.8571428571428571 },
  { name: 'Rowan',   games_played: 4,  wins: 3, win_rate: 0.75 },
  { name: 'Cole',    games_played: 8,  wins: 5, win_rate: 0.625 },
  { name: 'Jackson', games_played: 7,  wins: 4, win_rate: 0.5714285714285714 },
  { name: 'Allie',   games_played: 2,  wins: 1, win_rate: 0.5 },
  { name: 'Rob',     games_played: 4,  wins: 2, win_rate: 0.5 },
] as const
```

- [ ] **Step 4: Commit**

```
git add app/g/\[slug\]/hearts/page.tsx app/g/example/hearts/page.tsx app/g/example/data.ts
git commit -m "feat: update Hearts UI columns and example data to show win rate"
```

---

## Task 4: Update PlayerStats HeartsCard

**Files:**
- Modify: `components/PlayerStats.tsx`

- [ ] **Step 1: Update `HeartsCard` in `components/PlayerStats.tsx`**

Find the `HeartsCard` function (around line 184). Replace the two stat tiles for losses:

```tsx
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Loss%" value={`${(entry.loss_rate * 100).toFixed(1)}%`} />
```

With:

```tsx
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
```

- [ ] **Step 2: Run the full test suite**

```
npm test -- --no-coverage
```

Expected: all tests pass.

- [ ] **Step 3: Run type check**

```
npm run build 2>&1 | head -40
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```
git add components/PlayerStats.tsx
git commit -m "feat: update HeartsCard in PlayerStats to show wins and win rate"
```

---

## Task 5: Create DiscoverList client component

**Files:**
- Create: `components/DiscoverList.tsx`
- Modify: `app/discover/page.tsx`

- [ ] **Step 1: Create `components/DiscoverList.tsx`**

```tsx
'use client'

import Link from 'next/link'

type Group = {
  id: string
  name: string
  slug: string
  memberCount: number
}

export default function DiscoverList({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-3">
      {groups.map(g => (
        <Link
          key={g.id}
          href={`/g/${g.slug}`}
          onClick={() => sessionStorage.setItem('fromDiscover', '1')}
          className="block bg-card border border-warm rounded-xl p-4 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-stone-900">{g.name}</span>
            <span className="text-xs text-muted">{g.memberCount} player{g.memberCount !== 1 ? 's' : ''}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update `app/discover/page.tsx` to use `DiscoverList`**

Add the import at the top:
```tsx
import DiscoverList from '@/components/DiscoverList'
```

Replace the conditional render block:
```tsx
        {groups.length === 0 ? (
          <p className="text-muted text-sm">No public groups yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(g => (
              <Link
                key={g.id}
                href={`/g/${g.slug}`}
                className="block bg-card border border-warm rounded-xl p-4 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">{g.name}</span>
                  <span className="text-xs text-muted">{g.memberCount} player{g.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
```

With:
```tsx
        {groups.length === 0 ? (
          <p className="text-muted text-sm">No public groups yet.</p>
        ) : (
          <DiscoverList groups={groups} />
        )}
```

- [ ] **Step 3: Commit**

```
git add components/DiscoverList.tsx app/discover/page.tsx
git commit -m "feat: extract DiscoverList client component with session storage flag"
```

---

## Task 6: Add browse return button to GroupNav

**Files:**
- Modify: `components/GroupNav.tsx`

- [ ] **Step 1: Add `useRouter` import and browse button state to `GroupNav.tsx`**

The file already imports `useState`, `useEffect`, `Link`, `usePathname` from their respective packages. Add `useRouter` to the next/navigation import:

```ts
import { usePathname, useRouter } from 'next/navigation'
```

- [ ] **Step 2: Add state and effect inside the `GroupNav` function**

Add these two lines right after the existing `const [showHomeModal, setShowHomeModal] = useState(false)` line:

```ts
  const router = useRouter()
  const [showBrowseButton, setShowBrowseButton] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('fromDiscover')) setShowBrowseButton(true)
  }, [])
```

- [ ] **Step 3: Render the "← Browse" button in the nav**

In the `<nav>` JSX, find the home icon `<button>` (the one with `onClick={() => setShowHomeModal(true)}`). Add the browse button immediately after that button's closing tag:

```tsx
        {showBrowseButton && (
          <button
            onClick={() => {
              sessionStorage.removeItem('fromDiscover')
              router.push('/discover')
            }}
            className="text-muted text-xs hover:text-stone-900 transition-colors shrink-0 mr-3 font-semibold"
          >
            ← Browse
          </button>
        )}
```

- [ ] **Step 4: Run type check and full test suite**

```
npm run build 2>&1 | head -40
npm test -- --no-coverage
```

Expected: build succeeds, all tests pass.

- [ ] **Step 5: Commit**

```
git add components/GroupNav.tsx
git commit -m "feat: show browse return button in GroupNav when navigated from Discover"
```

---

## Self-Review Checklist

- [x] Hearts type updated (`wins`, `win_rate`) — Task 2
- [x] Hearts stats fn computes and returns `wins`/`win_rate`, sorts descending — Task 2
- [x] Tests updated and passing — Tasks 1 & 2
- [x] Hearts page columns updated (`Wins`, `Win%`, descending) — Task 3
- [x] Hearts subtitle updated ("highest win rate") — Task 3
- [x] Example page columns updated — Task 3
- [x] Example data updated with correct `wins`/`win_rate` values — Task 3
- [x] PlayerStats `HeartsCard` shows Wins/Win% — Task 4
- [x] DiscoverList sets session storage on click — Task 5
- [x] Discover page uses DiscoverList — Task 5
- [x] GroupNav reads session storage on mount — Task 6
- [x] "← Browse" button navigates to /discover and clears flag — Task 6
