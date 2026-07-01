# My Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give signed-in players a page at `/g/[slug]/me` showing all of their own stats across all 7 games in a group, plus their leaderboard rank per game and a recent activity feed — responsive on both desktop and mobile.

**Architecture:** A new server-component page reuses the existing `compute*Leaderboard` functions in `lib/stats.ts` (already used by the leaderboard pages) to get this player's stats and rank per game, and a new `lib/dashboard.ts` module for small pure helpers (rank lookup, activity merging, result formatting) that are unit tested the same way `lib/stats.ts` already is. A `StatCard` component is extracted from the existing player profile page so both pages share the same stat-tile markup. The profile page (`players/[name]/page.tsx`) is also extended to cover all 7 games, since it currently only covers 3 and the dashboard links out to it.

**Tech Stack:** Next.js App Router (server components), Supabase, Tailwind, Jest (logic-only tests — this codebase has no component-rendering tests, so page/component work is verified manually via the dev server, not automated tests).

---

## Important context before starting

- There is a **stray git worktree** at `.claude/worktrees/amazing-lamarr-f85067` (branch `claude/amazing-lamarr-f85067`) with unrelated uncommitted changes from a previous session. Do not touch or delete it — it's out of scope for this plan.
- `__tests__/lib/stats.test.ts` and `__tests__/lib/auth.test.ts` currently have **pre-existing failing tests unrelated to this feature** (a stale test fixture mismatch). Do not attempt to fix them as part of this plan. To avoid confusing output, always run the **new** test file by its exact path (e.g. `npx jest __tests__/lib/dashboard.test.ts`), never a bare `npx jest` or `npm test` across the whole repo.
- Code style in this repo: no semicolons, single quotes, 2-space indent. Match it.

## Files touched

- Create: `lib/dashboard.ts` — pure helper functions (rank lookup, activity merge, result formatting)
- Create: `__tests__/lib/dashboard.test.ts` — tests for the above
- Create: `components/StatCard.tsx` — extracted stat-tile component
- Modify: `app/g/[slug]/players/[name]/page.tsx` — use `StatCard`, add Cornhole/Spikeball/Pool/Poker sections
- Create: `app/g/[slug]/me/page.tsx` — the new dashboard page
- Modify: `components/GroupNav.tsx` — add "Me" desktop nav link
- Modify: `components/BottomNav.tsx` — add "Me" to the mobile "More" sheet

---

### Task 1: Dashboard helper functions

**Files:**
- Create: `lib/dashboard.ts`
- Test: `__tests__/lib/dashboard.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/dashboard.test.ts`:

```ts
import {
  getLeaderboardRank,
  mergeRecentActivity,
  formatSideResult,
  formatHeartsResult,
  formatPokerResult,
  ActivityItem,
} from '../../lib/dashboard'

describe('getLeaderboardRank', () => {
  const leaderboard = [
    { player_id: 'u1' },
    { player_id: 'u2' },
    { player_id: 'u3' },
  ]

  it('returns 1-based rank and total for a player on the board', () => {
    expect(getLeaderboardRank(leaderboard, 'u2')).toEqual({ rank: 2, total: 3 })
  })

  it('returns null when the player has no entry', () => {
    expect(getLeaderboardRank(leaderboard, 'u9')).toBeNull()
  })
})

describe('mergeRecentActivity', () => {
  const item = (id: string, played_at: string): ActivityItem => ({
    type: 'pong',
    id,
    played_at,
    result: 'Won, 3 cups left',
  })

  it('sorts merged items by played_at descending', () => {
    const items = [item('a', '2026-05-01'), item('b', '2026-06-01'), item('c', '2026-05-15')]
    const result = mergeRecentActivity(items)
    expect(result.map(i => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('limits to the given count', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      item(`g${i}`, `2026-01-${String(i + 1).padStart(2, '0')}`)
    )
    expect(mergeRecentActivity(items, 10)).toHaveLength(10)
  })
})

describe('formatSideResult', () => {
  it('prefixes Won for winners', () => {
    expect(formatSideResult('winner', ', 3 cups left')).toBe('Won, 3 cups left')
  })

  it('prefixes Lost for losers', () => {
    expect(formatSideResult('loser', 'by 5 pts')).toBe('Lost by 5 pts')
  })
})

describe('formatHeartsResult', () => {
  it('returns Lost when the player lost', () => {
    expect(formatHeartsResult(true)).toBe('Lost')
  })

  it('returns Played when the player did not lose', () => {
    expect(formatHeartsResult(false)).toBe('Played')
  })
})

describe('formatPokerResult', () => {
  it('formats a positive profit with a plus sign', () => {
    expect(formatPokerResult(1450)).toBe('+$14.50')
  })

  it('formats a loss with a minus sign', () => {
    expect(formatPokerResult(-320)).toBe('-$3.20')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/lib/dashboard.test.ts`
Expected: FAIL with "Cannot find module '../../lib/dashboard'"

- [ ] **Step 3: Implement the helpers**

Create `lib/dashboard.ts`:

```ts
export type ActivityItem = {
  type: 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball' | 'pool' | 'poker'
  id: string
  played_at: string
  result: string
}

export function getLeaderboardRank(
  leaderboard: { player_id: string }[],
  playerId: string
): { rank: number; total: number } | null {
  const index = leaderboard.findIndex(e => e.player_id === playerId)
  if (index === -1) return null
  return { rank: index + 1, total: leaderboard.length }
}

export function mergeRecentActivity(items: ActivityItem[], limit = 10): ActivityItem[] {
  return [...items]
    .sort((a, b) => b.played_at.localeCompare(a.played_at))
    .slice(0, limit)
}

export function formatSideResult(side: 'winner' | 'loser', trailing: string): string {
  return `${side === 'winner' ? 'Won' : 'Lost'} ${trailing}`
}

export function formatHeartsResult(lost: boolean): string {
  return lost ? 'Lost' : 'Played'
}

export function formatPokerResult(amountCents: number): string {
  const dollars = (Math.abs(amountCents) / 100).toFixed(2)
  return amountCents >= 0 ? `+$${dollars}` : `-$${dollars}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/lib/dashboard.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/dashboard.ts __tests__/lib/dashboard.test.ts
git commit -m "feat: add dashboard stat helper functions"
```

---

### Task 2: Extract shared StatCard component

**Files:**
- Create: `components/StatCard.tsx`
- Modify: `app/g/[slug]/players/[name]/page.tsx`

- [ ] **Step 1: Create the component**

Create `components/StatCard.tsx`:

```tsx
export default function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-3 text-center border border-warm">
      <p className="text-lg font-black text-stone-900">{value}</p>
      <p className="text-xs text-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
```

- [ ] **Step 2: Use it in the profile page**

Modify `app/g/[slug]/players/[name]/page.tsx` — remove the local `Stat` component and import the shared one instead.

Replace:

```tsx
import { User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink } from '@/lib/types'
import { notFound } from 'next/navigation'
```

with:

```tsx
import { User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink } from '@/lib/types'
import { notFound } from 'next/navigation'
import StatCard from '@/components/StatCard'
```

Replace:

```tsx
  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-card rounded-xl p-3 text-center border border-warm">
      <p className="text-lg font-black text-stone-900">{value}</p>
      <p className="text-xs text-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )

  return (
```

with:

```tsx
  return (
```

Then replace every `<Stat ` with `<StatCard ` in the same file (there are 11 usages: 4 in the Pong section, 4 in the Beer Die section, 3 in the Hearts section).

- [ ] **Step 3: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `players/[name]/page.tsx` or `StatCard`

- [ ] **Step 4: Commit**

```bash
git add components/StatCard.tsx "app/g/[slug]/players/[name]/page.tsx"
git commit -m "refactor: extract shared StatCard component"
```

---

### Task 3: Extend the profile page to cover all 7 games

**Files:**
- Modify: `app/g/[slug]/players/[name]/page.tsx`

This is the bundled fix from the spec: the page currently only shows Pong, Beer Die, and Hearts. Add Cornhole, Spikeball, Pool, and Poker.

- [ ] **Step 1: Replace the full file with the extended version**

Replace the entire contents of `app/g/[slug]/players/[name]/page.tsx` with:

```tsx
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import HeadToHead from '@/components/HeadToHead'
import StatCard from '@/components/StatCard'
import {
  User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: users }, { data: pongPlayers }, { data: beerDiePlayers }, { data: sinks }, { data: heartsPlayers },
    { data: cornholePlayers }, { data: spikeballPlayers }, { data: poolPlayers }, { data: pokerPlayers },
  ] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('pool_game_players').select('game_id, player_id, side, pool_games ( id, balls_differential, played_at )').eq('group_id', group.id),
    supabase.from('poker_game_players').select('game_id, player_id, amount_cents, poker_games ( id, played_at )').eq('group_id', group.id),
  ])

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDiePlayers as unknown as BeerDieGamePlayer[], (sinks ?? []) as BeerDieSink[])
  const heartsLB = computeHeartsLeaderboard(users as User[], heartsPlayers as unknown as HeartsGamePlayer[])
  const cornholeLB = computeCornholeLeaderboard(users as User[], cornholePlayers as unknown as CornholeGamePlayer[])
  const spikeballLB = computeSpikeballLeaderboard(users as User[], spikeballPlayers as unknown as SpikeballGamePlayer[])
  const poolLB = computePoolLeaderboard(users as User[], poolPlayers as unknown as PoolGamePlayer[])
  const pokerLB = computePokerLeaderboard(users as User[], pokerPlayers as unknown as PokerGamePlayer[])

  const pong = pongLB.find(e => e.player_id === player.id)
  const beerDie = beerDieLB.find(e => e.player_id === player.id)
  const hearts = heartsLB.find(e => e.player_id === player.id)
  const cornhole = cornholeLB.find(e => e.player_id === player.id)
  const spikeball = spikeballLB.find(e => e.player_id === player.id)
  const pool = poolLB.find(e => e.player_id === player.id)
  const poker = pokerLB.find(e => e.player_id === player.id)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight">{name}</h1>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🏓 Pong</h2>
        {pong ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(pong.wins)} />
              <StatCard label="Losses" value={String(pong.losses)} />
              <StatCard label="Win%" value={`${(pong.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Cup Diff" value={pong.cup_differential > 0 ? `+${pong.cup_differential}` : String(pong.cup_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pong" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No pong games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🎲 Beer Die</h2>
        {beerDie ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(beerDie.wins)} />
              <StatCard label="Losses" value={String(beerDie.losses)} />
              <StatCard label="Win%" value={`${(beerDie.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={beerDie.point_differential > 0 ? `+${beerDie.point_differential}` : String(beerDie.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="beer-die" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No beer die games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🌽 Cornhole</h2>
        {cornhole ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(cornhole.wins)} />
              <StatCard label="Losses" value={String(cornhole.losses)} />
              <StatCard label="Win%" value={`${(cornhole.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={cornhole.point_differential > 0 ? `+${cornhole.point_differential}` : String(cornhole.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="cornhole" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No cornhole games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🏐 Spikeball</h2>
        {spikeball ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(spikeball.wins)} />
              <StatCard label="Losses" value={String(spikeball.losses)} />
              <StatCard label="Win%" value={`${(spikeball.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={spikeball.point_differential > 0 ? `+${spikeball.point_differential}` : String(spikeball.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="spikeball" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No spikeball games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🎱 Pool</h2>
        {pool ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(pool.wins)} />
              <StatCard label="Losses" value={String(pool.losses)} />
              <StatCard label="Win%" value={`${(pool.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Ball Diff" value={pool.balls_differential > 0 ? `+${pool.balls_differential}` : String(pool.balls_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pool" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No pool games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">♠ Poker</h2>
        {poker ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <StatCard label="Games" value={String(poker.games_played)} />
            <StatCard label="Win%" value={`${(poker.win_rate * 100).toFixed(1)}%`} />
            <StatCard label="Profit" value={`${poker.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(poker.total_profit_cents) / 100).toFixed(2)}`} />
          </div>
        ) : <p className="text-muted text-sm">No poker games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">♥ Hearts</h2>
        {hearts ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <StatCard label="Games" value={String(hearts.games_played)} />
            <StatCard label="Losses" value={String(hearts.losses)} />
            <StatCard label="Loss%" value={`${(hearts.loss_rate * 100).toFixed(1)}%`} />
          </div>
        ) : <p className="text-muted text-sm">No hearts games yet</p>}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `players/[name]/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/players/[name]/page.tsx"
git commit -m "fix: cover all 7 games on the player profile page"
```

---

### Task 4: Create the dashboard page — data, guards, and per-game stat grid

**Files:**
- Create: `app/g/[slug]/me/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/g/[slug]/me/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import { getLeaderboardRank } from '@/lib/dashboard'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import StatCard from '@/components/StatCard'
import GameIcon from '@/components/icons/GameIcon'

function GameCard({
  gameType, name, rank, children,
}: {
  gameType: string
  name: string
  rank: { rank: number; total: number } | null
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-warm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameIcon type={gameType} className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest text-stone-900">{name}</span>
        </div>
        {rank && <span className="text-[10px] font-black text-muted">#{rank.rank} of {rank.total}</span>}
      </div>
      {children}
    </div>
  )
}

export default async function MyDashboardPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireMembership(params.slug)

  if (!member) {
    return (
      <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-stone-900">Sign in and join to see your dashboard.</p>
        <a
          href={`/join/${group.join_code}`}
          className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
        >
          Join →
        </a>
      </div>
    )
  }

  if (!member.player_id) {
    return (
      <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-stone-900">You haven&apos;t claimed a player yet.</p>
        <a
          href={`/g/${params.slug}/claim`}
          className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
        >
          Claim →
        </a>
      </div>
    )
  }

  const supabase = createServerClient()
  const [
    { data: users },
    { data: pongPlayers },
    { data: beerDiePlayers },
    { data: beerDieSinks },
    { data: heartsPlayers },
    { data: cornholePlayers },
    { data: spikeballPlayers },
    { data: poolPlayers },
    { data: pokerPlayers },
  ] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('pool_game_players').select('game_id, player_id, side, pool_games ( id, balls_differential, played_at )').eq('group_id', group.id),
    supabase.from('poker_game_players').select('game_id, player_id, amount_cents, poker_games ( id, played_at )').eq('group_id', group.id),
  ])

  const u = (users ?? []) as User[]
  const playerId = member.player_id
  const playerName = u.find(x => x.id === playerId)?.name ?? 'You'

  const pong = (pongPlayers ?? []) as unknown as PongGamePlayer[]
  const beerDie = (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[]
  const sinks = (beerDieSinks ?? []) as BeerDieSink[]
  const hearts = (heartsPlayers ?? []) as unknown as HeartsGamePlayer[]
  const cornhole = (cornholePlayers ?? []) as unknown as CornholeGamePlayer[]
  const spikeball = (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[]
  const pool = (poolPlayers ?? []) as unknown as PoolGamePlayer[]
  const poker = (pokerPlayers ?? []) as unknown as PokerGamePlayer[]

  const pongLB = computePongLeaderboard(u, pong)
  const beerDieLB = computeBeerDieLeaderboard(u, beerDie, sinks)
  const heartsLB = computeHeartsLeaderboard(u, hearts)
  const cornholeLB = computeCornholeLeaderboard(u, cornhole)
  const spikeballLB = computeSpikeballLeaderboard(u, spikeball)
  const poolLB = computePoolLeaderboard(u, pool)
  const pokerLB = computePokerLeaderboard(u, poker)

  const pongEntry = pongLB.find(e => e.player_id === playerId)
  const beerDieEntry = beerDieLB.find(e => e.player_id === playerId)
  const heartsEntry = heartsLB.find(e => e.player_id === playerId)
  const cornholeEntry = cornholeLB.find(e => e.player_id === playerId)
  const spikeballEntry = spikeballLB.find(e => e.player_id === playerId)
  const poolEntry = poolLB.find(e => e.player_id === playerId)
  const pokerEntry = pokerLB.find(e => e.player_id === playerId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
        <p className="text-muted text-sm">Signed in as {playerName}</p>
      </div>

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

      <Link
        href={`/g/${params.slug}/players/${encodeURIComponent(playerName)}`}
        className="inline-block text-sm font-bold text-win hover:text-orange-400"
      >
        View full public profile →
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `app/g/[slug]/me/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/me/page.tsx"
git commit -m "feat: add My Dashboard page with per-game stats and rank"
```

---

### Task 5: Add the recent activity feed

**Files:**
- Modify: `app/g/[slug]/me/page.tsx`

- [ ] **Step 1: Import the remaining helpers**

In `app/g/[slug]/me/page.tsx`, replace:

```tsx
import { getLeaderboardRank } from '@/lib/dashboard'
```

with:

```tsx
import { getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult, formatPokerResult, ActivityItem } from '@/lib/dashboard'
```

- [ ] **Step 2: Build the activity list**

Insert this block right after the `pokerEntry`/`heartsEntry` declarations (after the line `const heartsEntry = heartsLB.find(e => e.player_id === playerId)` — insert before the `return (`):

```tsx
  const activity = mergeRecentActivity([
    ...pong.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pong',
      id: gp.game_id,
      played_at: gp.pong_games.played_at,
      result: formatSideResult(gp.side, `, ${gp.pong_games.cups_left} cup${gp.pong_games.cups_left !== 1 ? 's' : ''} left`),
    })),
    ...beerDie.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'beer-die',
      id: gp.game_id,
      played_at: gp.beer_die_games.played_at,
      result: formatSideResult(gp.side, `by ${gp.beer_die_games.points_differential} pt${gp.beer_die_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...cornhole.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'cornhole',
      id: gp.game_id,
      played_at: gp.cornhole_games.played_at,
      result: formatSideResult(gp.side, `by ${gp.cornhole_games.points_differential} pt${gp.cornhole_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...spikeball.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'spikeball',
      id: gp.game_id,
      played_at: gp.spikeball_games.played_at,
      result: formatSideResult(gp.side, `by ${gp.spikeball_games.points_differential} pt${gp.spikeball_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...pool.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pool',
      id: gp.game_id,
      played_at: gp.pool_games.played_at,
      result: formatSideResult(gp.side, `by ${gp.pool_games.balls_differential} ball${gp.pool_games.balls_differential !== 1 ? 's' : ''}`),
    })),
    ...hearts.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'hearts',
      id: gp.game_id,
      played_at: gp.hearts_games.played_at,
      result: formatHeartsResult(gp.lost),
    })),
    ...poker.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'poker',
      id: gp.game_id,
      played_at: gp.poker_games.played_at,
      result: formatPokerResult(gp.amount_cents),
    })),
  ])
```

- [ ] **Step 3: Render the feed**

Replace:

```tsx
      <Link
        href={`/g/${params.slug}/players/${encodeURIComponent(playerName)}`}
        className="inline-block text-sm font-bold text-win hover:text-orange-400"
      >
        View full public profile →
      </Link>
    </div>
  )
}
```

with:

```tsx
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-muted text-sm">No games yet — go log one!</p>
        ) : (
          <div className="space-y-2">
            {activity.map(a => (
              <div key={`${a.type}-${a.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
                <GameIcon type={a.type} className="w-6 h-6 shrink-0" />
                <p className="flex-1 text-sm font-bold text-stone-900">{a.result}</p>
                <span className="text-xs text-muted shrink-0">
                  {new Date(a.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/g/${params.slug}/players/${encodeURIComponent(playerName)}`}
        className="inline-block text-sm font-bold text-win hover:text-orange-400"
      >
        View full public profile →
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `app/g/[slug]/me/page.tsx`

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/me/page.tsx"
git commit -m "feat: add recent activity feed to My Dashboard"
```

---

### Task 6: Nav integration

**Files:**
- Modify: `components/GroupNav.tsx`
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Add "Me" to the desktop nav**

In `components/GroupNav.tsx`, replace:

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
```

with:

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

`isExample` is already a prop on this component — the `/me` route doesn't exist for the static `example` demo group, so it must be excluded there (same reason the admin/log links are already hidden for `isExample`).

- [ ] **Step 2: Add "Me" to the mobile "More" sheet**

In `components/BottomNav.tsx`, replace:

```tsx
const ALL_GAMES = [
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'pool', label: 'Pool', icon: '🎱' },
  { slug: 'poker', label: 'Poker', icon: '♠' },
  { slug: 'players', label: 'Players', icon: '👥' },
]
```

with:

```tsx
const ALL_GAMES = [
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'pool', label: 'Pool', icon: '🎱' },
  { slug: 'poker', label: 'Poker', icon: '♠' },
  { slug: 'players', label: 'Players', icon: '👥' },
  { slug: 'me', label: 'Me', icon: '👤' },
]
```

Then replace:

```tsx
  const isFull = pinned.length >= MAX_PINS
  const pinnedGames = ALL_GAMES.filter(g => pinned.includes(g.slug))
```

with:

```tsx
  const isFull = pinned.length >= MAX_PINS
  const pinnedGames = ALL_GAMES.filter(g => pinned.includes(g.slug) && (!isExample || g.slug !== 'me'))
```

Then replace:

```tsx
            {ALL_GAMES.map(game => {
```

with:

```tsx
            {ALL_GAMES.filter(g => !isExample || g.slug !== 'me').map(game => {
```

This keeps "Me" out of the `example` demo group's bottom nav and "More" sheet entirely (both where it's listed and where it could be pinned), for the same reason as the desktop nav in Step 1.

- [ ] **Step 3: Verify it builds**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `GroupNav.tsx` or `BottomNav.tsx`

- [ ] **Step 4: Commit**

```bash
git add components/GroupNav.tsx components/BottomNav.tsx
git commit -m "feat: add Me link to group navigation"
```

---

### Task 7: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use the preview tool to start the `dev` server (create `.claude/launch.json` with a `next dev` configuration if one doesn't already exist), then confirm it's running without errors in the server logs.

- [ ] **Step 2: Verify the claim-prompt state**

Navigate to `/g/<a-real-slug>/me` signed in as a member who has **not** claimed a player. Confirm only the "You haven't claimed a player yet → Claim" prompt renders, no game cards or activity feed.

- [ ] **Step 3: Verify the populated state**

Sign in as a member who **has** claimed a player with game history. Confirm:
- Each of the 7 game cards shows the right stat labels for that game type (Pong/Cup Diff, Poker/Profit, Hearts/Loss%, etc.)
- Games with no history for this player show "No games yet"
- The rank badge (`#N of M`) appears on cards where the player has games, and is absent where they don't
- The Recent Activity list shows entries across multiple game types sorted newest-first, capped at 10
- The "View full public profile →" link navigates to `/g/<slug>/players/<name>` and that page now shows all 7 games

- [ ] **Step 4: Verify responsiveness**

Using the preview tool's resize capability, check both `mobile` (375×812) and `desktop` (1280×800) presets on `/g/<slug>/me`:
- Mobile: game cards stack in a single column, nothing overflows horizontally
- Desktop: game cards lay out in multiple columns (2–3 per row)

- [ ] **Step 5: Verify navigation**

- Desktop viewport: confirm "Me" appears in the top `GroupNav` and links to `/g/<slug>/me`
- Mobile viewport: open the bottom nav's "More" sheet, confirm "Me" is listed and can be pinned/unpinned like any other tab
- Visit `/g/example` (the demo group) and confirm **no** "Me" link appears anywhere (desktop nav or mobile "More" sheet), since that route doesn't exist for the example group

- [ ] **Step 6: Run the full check**

```bash
npx jest __tests__/lib/dashboard.test.ts
npx tsc --noEmit
```

Expected: dashboard tests pass, no new type errors.

No commit for this task — it's verification only. If any step surfaces a bug, fix it in the relevant task's files and amend that task's commit before moving on.
