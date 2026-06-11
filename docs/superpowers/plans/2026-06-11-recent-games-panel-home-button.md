# Recent Games Panel + Home Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-game recent results panel to each game page, and a home button with confirmation modal to the group nav.

**Architecture:** Feature 3 updates five server-component game pages — each fetches its own last-5 approved games in the existing `Promise.all` and passes them to the existing `RecentGames` component in a new two-column layout (left: H2H + PartnerRecord, right: recent results). Hearts is special — no H2H widgets, so recent games go below the leaderboard as a standalone section. Feature 4 adds a `useState`-driven modal to `GroupNav` (already `'use client'`), with click-outside and Escape-key dismissal.

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS

---

## File Map

**Modified files:**
- `app/g/[slug]/pong/page.tsx` — add recent pong games query + two-column layout
- `app/g/[slug]/beer-die/page.tsx` — add recent beer die games query + two-column layout
- `app/g/[slug]/cornhole/page.tsx` — add recent cornhole games query + two-column layout
- `app/g/[slug]/spikeball/page.tsx` — add recent spikeball games query + two-column layout
- `app/g/[slug]/hearts/page.tsx` — add recent hearts games query + standalone section below leaderboard
- `components/GroupNav.tsx` — add home button + modal

---

## Task 1: Recent games panel on pong, beer-die, cornhole, spikeball pages

**Files:** Modify `app/g/[slug]/pong/page.tsx`, `app/g/[slug]/beer-die/page.tsx`, `app/g/[slug]/cornhole/page.tsx`, `app/g/[slug]/spikeball/page.tsx`

- [ ] **Step 1: Replace the full contents of `app/g/[slug]/pong/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { PongGamePlayer, User, RecentPongGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupPongPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('pong_games').select('id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computePongLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as PongGamePlayer[])

  const recentGames: RecentPongGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'pong' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.pong_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.pong_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    cups_left: g.cups_left,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏓 Pong</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="pong" />
          <PartnerRecord players={(users ?? []) as User[]} game="pong" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace the full contents of `app/g/[slug]/beer-die/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { BeerDieGamePlayer, BeerDieSink, User, RecentBeerDieGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupBeerDiePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
  )

  const recentGames: RecentBeerDieGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'beer-die' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🎲 Beer Die</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="beer-die" />
          <PartnerRecord players={(users ?? []) as User[]} game="beer-die" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace the full contents of `app/g/[slug]/cornhole/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { CornholeGamePlayer, User, RecentCornholeGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeCornholeLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupCornholePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at, cornhole_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeCornholeLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as CornholeGamePlayer[]
  )

  const recentGames: RecentCornholeGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'cornhole' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🌽 Cornhole</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="cornhole" />
          <PartnerRecord players={(users ?? []) as User[]} game="cornhole" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace the full contents of `app/g/[slug]/spikeball/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { SpikeballGamePlayer, User, RecentSpikeballGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeSpikeballLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupSpikeballPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('spikeball_games').select('id, points_differential, played_at, spikeball_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeSpikeballLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as SpikeballGamePlayer[]
  )

  const recentGames: RecentSpikeballGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'spikeball' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏐 Spikeball</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="spikeball" />
          <PartnerRecord players={(users ?? []) as User[]} game="spikeball" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Type-check and commit**

```
npx tsc --noEmit
git add "app/g/[slug]/pong/page.tsx" "app/g/[slug]/beer-die/page.tsx" "app/g/[slug]/cornhole/page.tsx" "app/g/[slug]/spikeball/page.tsx"
git commit -m "feat: add recent games panel to pong, beer-die, cornhole, spikeball pages"
```

Expected: no new TypeScript errors (pre-existing errors in `__tests__/lib/stats.test.ts` are OK).

---

## Task 2: Recent games section on hearts page

**Files:** Modify `app/g/[slug]/hearts/page.tsx`

Hearts has no H2H or PartnerRecord widgets, so recent games go below the leaderboard as a standalone section (no two-column layout).

- [ ] **Step 1: Replace the full contents of `app/g/[slug]/hearts/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import { HeartsGamePlayer, User, RecentHeartsGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupHeartsPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at, hearts_game_players ( lost, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])

  const recentGames: RecentHeartsGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'hearts' as const,
    id: g.id,
    played_at: g.played_at,
    players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
    loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games' },
    { key: 'losses', label: 'Losses' },
    { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">♥ Hearts</h1>
        <p className="text-muted text-sm">Ranked by lowest loss rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
        <RecentGames games={recentGames} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```
npx tsc --noEmit
git add "app/g/[slug]/hearts/page.tsx"
git commit -m "feat: add recent games section to hearts page"
```

---

## Task 3: Home button with confirmation modal in GroupNav

**Files:** Modify `components/GroupNav.tsx`

- [ ] **Step 1: Replace the full contents of `components/GroupNav.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  const pathname = usePathname()
  const [showHomeModal, setShowHomeModal] = useState(false)

  useEffect(() => {
    if (!showHomeModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowHomeModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHomeModal])

  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/players`, label: 'Players' },
  ]

  return (
    <>
      <nav className="bg-card border-b border-warm px-4 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => setShowHomeModal(true)}
          className="text-muted hover:text-stone-900 transition-colors mr-3 text-base shrink-0"
          aria-label="Go to home screen"
        >
          🏠
        </button>
        <Link href={base} className="text-brand font-black text-sm tracking-widest uppercase shrink-0">
          {groupName}
        </Link>
        <div className="flex-1 flex items-center justify-evenly px-4 flex-wrap gap-y-1">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'text-win border-b-2 border-win pb-0.5'
                    : 'text-muted hover:text-stone-900'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <Link
          href={`${base}/log`}
          className="shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
        >
          LOG GAME →
        </Link>
      </nav>

      {showHomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowHomeModal(false)}
        >
          <div
            className="bg-card border border-warm rounded-2xl p-6 max-w-sm mx-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-stone-900 font-bold mb-6">
              This will take you back to the &ldquo;create a group screen&rdquo;.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHomeModal(false)}
                className="bg-stone-100 text-stone-600 font-bold px-4 py-2 rounded-full text-sm hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <Link
                href="/"
                className="bg-win text-white font-black px-4 py-2 rounded-full text-sm hover:bg-orange-400 transition-colors uppercase tracking-wide"
              >
                Confirm
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```
npx tsc --noEmit
git add components/GroupNav.tsx
git commit -m "feat: add home button with confirmation modal to group nav"
```

---

## Final verification

- [ ] **Run a full build to confirm no TypeScript or Next.js errors**

```
npm run build
```

Expected: build completes with no errors.
