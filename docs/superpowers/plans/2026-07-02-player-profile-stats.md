# Player Profile Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the "My Dashboard" and public player profile pages by extracting all stats rendering into a shared `PlayerStats` component, fixing the error on unclaimed players, and removing the now-redundant "View full public profile" link.

**Architecture:** A new `components/PlayerStats.tsx` server component receives all raw game-player arrays + a target `playerId`, computes leaderboard entries/ranks/activity internally, and renders the full stats view. Both `me/page.tsx` and `players/[name]/page.tsx` become thin data-fetching wrappers that pass data to `PlayerStats`. The me page keeps its own heading/LogOutButton above the component; the profile page keeps its own player-name heading.

**Tech Stack:** Next.js 14 App Router, React Server Components, TypeScript, Supabase (via `@supabase/ssr`), Tailwind CSS.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/PlayerStats.tsx` | All stats rendering: game cards, activity feed, leaderboard computation |
| Modify | `app/g/[slug]/me/page.tsx` | Data fetching + header only; delegates rendering to PlayerStats |
| Rewrite | `app/g/[slug]/players/[name]/page.tsx` | Data fetching + player-name heading; delegates rendering to PlayerStats |

---

## Task 1: Create `components/PlayerStats.tsx`

**Files:**
- Create: `components/PlayerStats.tsx`

- [ ] **Step 1: Create the file with all content**

Create `components/PlayerStats.tsx` with the following complete content. This moves all card components, helpers, and rendering logic out of `me/page.tsx`:

```tsx
import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import {
  getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult,
  formatPokerResult, formatStreak, sortCardsByPlayed, ActivityItem,
} from '@/lib/dashboard'
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

function NoGamesYet() {
  return <p className="text-muted text-sm">No games yet</p>
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function PongCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePongLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="pong" name="Pong" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Cup Diff" value={signed(entry.cup_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function BeerDieCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeBeerDieLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="beer-die" name="Beer Die" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Sinks" value={String(entry.sinks)} />
          <StatCard label="Self Sinks" value={String(entry.self_sinks)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function CornholeCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeCornholeLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="cornhole" name="Cornhole" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function SpikeballCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeSpikeballLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="spikeball" name="Spikeball" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function PoolCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePoolLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="pool" name="Pool" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Ball Diff" value={signed(entry.balls_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function PokerCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePokerLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="poker" name="Poker" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Profit" value={`${entry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(entry.total_profit_cents) / 100).toFixed(2)}`} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function HeartsCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeHeartsLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="hearts" name="Hearts" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Loss%" value={`${(entry.loss_rate * 100).toFixed(1)}%`} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

export default function PlayerStats({
  playerId,
  users,
  pongPlayers,
  beerDiePlayers,
  beerDieSinks,
  heartsPlayers,
  cornholePlayers,
  spikeballPlayers,
  poolPlayers,
  pokerPlayers,
}: {
  playerId: string
  users: User[]
  pongPlayers: PongGamePlayer[]
  beerDiePlayers: BeerDieGamePlayer[]
  beerDieSinks: BeerDieSink[]
  heartsPlayers: HeartsGamePlayer[]
  cornholePlayers: CornholeGamePlayer[]
  spikeballPlayers: SpikeballGamePlayer[]
  poolPlayers: PoolGamePlayer[]
  pokerPlayers: PokerGamePlayer[]
}) {
  const pongLB = computePongLeaderboard(users, pongPlayers)
  const beerDieLB = computeBeerDieLeaderboard(users, beerDiePlayers, beerDieSinks)
  const heartsLB = computeHeartsLeaderboard(users, heartsPlayers)
  const cornholeLB = computeCornholeLeaderboard(users, cornholePlayers)
  const spikeballLB = computeSpikeballLeaderboard(users, spikeballPlayers)
  const poolLB = computePoolLeaderboard(users, poolPlayers)
  const pokerLB = computePokerLeaderboard(users, pokerPlayers)

  const pongEntry = pongLB.find(e => e.player_id === playerId)
  const beerDieEntry = beerDieLB.find(e => e.player_id === playerId)
  const heartsEntry = heartsLB.find(e => e.player_id === playerId)
  const cornholeEntry = cornholeLB.find(e => e.player_id === playerId)
  const spikeballEntry = spikeballLB.find(e => e.player_id === playerId)
  const poolEntry = poolLB.find(e => e.player_id === playerId)
  const pokerEntry = pokerLB.find(e => e.player_id === playerId)

  const activity = mergeRecentActivity([
    ...pongPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pong',
      id: gp.game_id,
      played_at: gp.pong_games.played_at,
      result: formatSideResult(gp.side, `${gp.pong_games.cups_left} cup${gp.pong_games.cups_left !== 1 ? 's' : ''} left`),
    })),
    ...beerDiePlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'beer-die',
      id: gp.game_id,
      played_at: gp.beer_die_games.played_at,
      result: formatSideResult(gp.side, `${gp.beer_die_games.points_differential} pt${gp.beer_die_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...cornholePlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'cornhole',
      id: gp.game_id,
      played_at: gp.cornhole_games.played_at,
      result: formatSideResult(gp.side, `${gp.cornhole_games.points_differential} pt${gp.cornhole_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...spikeballPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'spikeball',
      id: gp.game_id,
      played_at: gp.spikeball_games.played_at,
      result: formatSideResult(gp.side, `${gp.spikeball_games.points_differential} pt${gp.spikeball_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...poolPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pool',
      id: gp.game_id,
      played_at: gp.pool_games.played_at,
      result: formatSideResult(gp.side, `${gp.pool_games.balls_differential} ball${gp.pool_games.balls_differential !== 1 ? 's' : ''}`),
    })),
    ...heartsPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'hearts',
      id: gp.game_id,
      played_at: gp.hearts_games.played_at,
      result: formatHeartsResult(gp.lost),
    })),
    ...pokerPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'poker',
      id: gp.game_id,
      played_at: gp.poker_games.played_at,
      result: formatPokerResult(gp.amount_cents),
    })),
  ])

  const gameCards = [
    { key: 'pong', hasPlayed: !!pongEntry, node: <PongCard entry={pongEntry} rank={getLeaderboardRank(pongLB, playerId)} /> },
    { key: 'beer-die', hasPlayed: !!beerDieEntry, node: <BeerDieCard entry={beerDieEntry} rank={getLeaderboardRank(beerDieLB, playerId)} /> },
    { key: 'cornhole', hasPlayed: !!cornholeEntry, node: <CornholeCard entry={cornholeEntry} rank={getLeaderboardRank(cornholeLB, playerId)} /> },
    { key: 'spikeball', hasPlayed: !!spikeballEntry, node: <SpikeballCard entry={spikeballEntry} rank={getLeaderboardRank(spikeballLB, playerId)} /> },
    { key: 'pool', hasPlayed: !!poolEntry, node: <PoolCard entry={poolEntry} rank={getLeaderboardRank(poolLB, playerId)} /> },
    { key: 'poker', hasPlayed: !!pokerEntry, node: <PokerCard entry={pokerEntry} rank={getLeaderboardRank(pokerLB, playerId)} /> },
    { key: 'hearts', hasPlayed: !!heartsEntry, node: <HeartsCard entry={heartsEntry} rank={getLeaderboardRank(heartsLB, playerId)} /> },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortCardsByPlayed(gameCards).map(c => c.node)}
      </div>

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
    </div>
  )
}
```

- [ ] **Step 2: Verify the file type-checks**

Run: `npm run build`

Expected: Build completes with no TypeScript errors related to `PlayerStats.tsx`. (Other pre-existing errors, if any, are not your concern.)

- [ ] **Step 3: Commit**

```bash
git add components/PlayerStats.tsx
git commit -m "feat: add PlayerStats shared component"
```

---

## Task 2: Update `app/g/[slug]/me/page.tsx`

**Files:**
- Modify: `app/g/[slug]/me/page.tsx`

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `app/g/[slug]/me/page.tsx` with:

```tsx
export const dynamic = 'force-dynamic'

import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import LogOutButton from '@/components/LogOutButton'
import PlayerStats from '@/components/PlayerStats'

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

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
          <p className="text-muted text-sm">Signed in as {playerName}</p>
        </div>
        <LogOutButton />
      </div>

      <PlayerStats
        playerId={playerId}
        users={u}
        pongPlayers={(pongPlayers ?? []) as unknown as PongGamePlayer[]}
        beerDiePlayers={(beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[]}
        beerDieSinks={(beerDieSinks ?? []) as BeerDieSink[]}
        heartsPlayers={(heartsPlayers ?? []) as unknown as HeartsGamePlayer[]}
        cornholePlayers={(cornholePlayers ?? []) as unknown as CornholeGamePlayer[]}
        spikeballPlayers={(spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[]}
        poolPlayers={(poolPlayers ?? []) as unknown as PoolGamePlayer[]}
        pokerPlayers={(pokerPlayers ?? []) as unknown as PokerGamePlayer[]}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the file type-checks**

Run: `npm run build`

Expected: Build completes with no TypeScript errors in `me/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/g/\[slug\]/me/page.tsx
git commit -m "refactor: use PlayerStats in My Dashboard, remove public profile link"
```

---

## Task 3: Rewrite `app/g/[slug]/players/[name]/page.tsx`

**Files:**
- Rewrite: `app/g/[slug]/players/[name]/page.tsx`

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `app/g/[slug]/players/[name]/page.tsx` with:

```tsx
export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import PlayerStats from '@/components/PlayerStats'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

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
  const player = u.find(p => p.name === name)
  if (!player) notFound()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight">{name}</h1>

      <PlayerStats
        playerId={player.id}
        users={u}
        pongPlayers={(pongPlayers ?? []) as unknown as PongGamePlayer[]}
        beerDiePlayers={(beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[]}
        beerDieSinks={(beerDieSinks ?? []) as BeerDieSink[]}
        heartsPlayers={(heartsPlayers ?? []) as unknown as HeartsGamePlayer[]}
        cornholePlayers={(cornholePlayers ?? []) as unknown as CornholeGamePlayer[]}
        spikeballPlayers={(spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[]}
        poolPlayers={(poolPlayers ?? []) as unknown as PoolGamePlayer[]}
        pokerPlayers={(pokerPlayers ?? []) as unknown as PokerGamePlayer[]}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the file type-checks**

Run: `npm run build`

Expected: Clean build. No TypeScript errors in `players/[name]/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/players/[name]/page.tsx"
git commit -m "feat: show full stats on player profile page"
```

---

## Task 4: Visual Verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Navigate to a group you have access to (e.g. `http://localhost:3000/g/<your-slug>/players`).

- [ ] **Step 2: Verify the Players list**

The players grid should look unchanged. Every player name should be a clickable link.

- [ ] **Step 3: Click a claimed player**

Click any player who has logged games. You should see:
- Their name as the page `<h1>`
- Game cards in a responsive grid, sorted by most-played games first
- Streaks shown in each card
- A Recent Activity section at the bottom
- No LogOutButton, no Join/Claim CTA, no "View full public profile" link

- [ ] **Step 4: Click an unclaimed player**

Click any player who has NOT been claimed by an auth user. You should see the same layout as above (possibly with "No games yet" cards if they have no games). No error page.

- [ ] **Step 5: Verify My Dashboard is unchanged**

Navigate to `/g/<slug>/me`. You should see:
- "My Dashboard" heading and "Signed in as [name]" subtitle
- LogOutButton still present
- Game cards and recent activity identical to before
- No "View full public profile" link
