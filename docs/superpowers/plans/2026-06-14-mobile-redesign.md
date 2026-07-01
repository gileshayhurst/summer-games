# Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overflowing GroupNav with a mobile bottom tab bar and transform the home page game grid into leader cards showing the #1 player per game.

**Architecture:** A new `BottomNav` client component handles the 5-slot bottom bar (2 pinned + LOG + 1 pinned + More) with localStorage persistence. GroupNav's game links and LOG GAME button are hidden on mobile. The group home page adds parallel Supabase queries to compute one leaderboard entry per game and renders compact leader cards instead of plain nav links. Desktop is unchanged.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, Supabase, localStorage

---

## File Map

| Action | File | Notes |
|---|---|---|
| Modify | `components/GroupNav.tsx` | Hide game links div and LOG GAME on mobile |
| Create | `components/BottomNav.tsx` | Bottom bar + More sheet + localStorage pin state |
| Modify | `app/g/[slug]/layout.tsx` | Add `<BottomNav>` + bottom padding on main |
| Modify | `app/g/[slug]/page.tsx` | Fetch top player per game; render leader cards |

---

### Task 1: Slim GroupNav for mobile

**Files:**
- Modify: `components/GroupNav.tsx`

Hide the game links container and LOG GAME button on mobile. Keep 🏠, group name, and ⚙️ always visible.

- [ ] **Step 1: Apply mobile-hidden classes to GroupNav**

Replace `components/GroupNav.tsx` entirely:

```tsx
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
        <div className="hidden md:flex flex-1 items-center justify-evenly px-4 flex-wrap gap-y-1">
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
        <div className="flex-1 md:hidden" />
        <Link
          href={`${base}/admin`}
          className="text-muted hover:text-stone-900 transition-colors mr-2 text-base shrink-0"
          aria-label="Admin settings"
        >
          ⚙️
        </Link>
        <Link
          href={`${base}/log`}
          className="hidden md:inline-flex shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
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
              This will take you back to the &apos;create a group screen&apos;.
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

Key changes from original:
- Line 40: `flex-1 flex items-center ...` → `hidden md:flex flex-1 items-center ...`
- New spacer div: `<div className="flex-1 md:hidden" />` between group name and ⚙️ (so ⚙️ stays right-aligned on mobile)
- LOG GAME link: added `hidden md:inline-flex` to its className

- [ ] **Step 2: Verify mobile layout visually**

Start the dev server (`npm run dev`), open a group page on a narrow viewport (≤ 375px). Confirm the nav shows only 🏠, group name (left-aligned), ⚙️ (right). No game links, no LOG GAME button.

On desktop (≥ 768px) confirm full nav still shows with all game links and LOG GAME.

- [ ] **Step 3: Commit**

```bash
git add components/GroupNav.tsx
git commit -m "feat: hide game links and LOG GAME from mobile nav"
```

---

### Task 2: Create BottomNav component

**Files:**
- Create: `components/BottomNav.tsx`

A `'use client'` component that renders:
- A fixed bottom bar (mobile only, `md:hidden`) with 5 slots: [game] [game] [LOG+] [game] [More]
- A bottom sheet (slides up from above the bar) listing all games with PINNED / +PIN toggles
- Pin state persisted to `localStorage` under key `sg-pinned-${slug}`
- Default pins: `["pong", "beer-die", "hearts"]` (first visit or no stored value)
- Max 3 pinned games; bar order follows master list order (not pin order)

- [ ] **Step 1: Create `components/BottomNav.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ALL_GAMES = [
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'players', label: 'Players', icon: '👥' },
]

const DEFAULT_PINS = ['pong', 'beer-die', 'hearts']
const MAX_PINS = 3

export default function BottomNav({ slug }: { slug: string }) {
  const base = `/g/${slug}`
  const pathname = usePathname()
  const storageKey = `sg-pinned-${slug}`

  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINS)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setPinned(JSON.parse(stored))
    } catch {}
  }, [storageKey])

  const savePinned = (next: string[]) => {
    setPinned(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  const togglePin = (gameSlug: string) => {
    if (pinned.includes(gameSlug)) {
      savePinned(pinned.filter(p => p !== gameSlug))
    } else if (pinned.length < MAX_PINS) {
      // Maintain master-list order
      const next = ALL_GAMES.map(g => g.slug).filter(s => pinned.includes(s) || s === gameSlug)
      savePinned(next)
    }
  }

  const isFull = pinned.length >= MAX_PINS
  const pinnedGames = ALL_GAMES.filter(g => pinned.includes(g.slug))

  const tabClass = (gameSlug: string) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
      pathname.startsWith(`${base}/${gameSlug}`) ? 'text-win' : 'text-muted'
    }`

  return (
    <>
      {/* Bottom bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-warm z-10 flex items-center h-14">
        {pinnedGames[0] ? (
          <Link href={`${base}/${pinnedGames[0].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[0].slug)}>
            <span className="text-base leading-none">{pinnedGames[0].icon}</span>
            <span>{pinnedGames[0].label}</span>
          </Link>
        ) : <div className="flex-1" />}

        {pinnedGames[1] ? (
          <Link href={`${base}/${pinnedGames[1].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[1].slug)}>
            <span className="text-base leading-none">{pinnedGames[1].icon}</span>
            <span>{pinnedGames[1].label}</span>
          </Link>
        ) : <div className="flex-1" />}

        <Link
          href={`${base}/log`}
          onClick={() => setShowMore(false)}
          className="flex-1 flex items-center justify-center"
        >
          <span className="bg-win text-white text-[9px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase">LOG+</span>
        </Link>

        {pinnedGames[2] ? (
          <Link href={`${base}/${pinnedGames[2].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[2].slug)}>
            <span className="text-base leading-none">{pinnedGames[2].icon}</span>
            <span>{pinnedGames[2].label}</span>
          </Link>
        ) : <div className="flex-1" />}

        <button
          onClick={() => setShowMore(s => !s)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
            showMore ? 'text-win' : 'text-muted'
          }`}
        >
          <span className="text-base leading-none">···</span>
          <span>More</span>
        </button>
      </nav>

      {/* More sheet backdrop */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/30"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet */}
      {showMore && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-card rounded-t-2xl border-t border-warm shadow-xl">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-warm rounded-full" />
          </div>
          <div className="px-4 pb-6">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">All Games</p>
            {isFull && (
              <p className="text-[11px] text-win font-bold mb-2">Bar full — unpin one to add another</p>
            )}
            {ALL_GAMES.map(game => {
              const isPinned = pinned.includes(game.slug)
              const canPin = !isPinned && !isFull
              return (
                <div key={game.slug} className="flex items-center justify-between py-2.5 border-b border-warm last:border-0">
                  <Link
                    href={`${base}/${game.slug}`}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-2 font-black text-sm text-stone-900"
                  >
                    <span>{game.icon}</span>
                    <span>{game.label}</span>
                  </Link>
                  <button
                    onClick={() => togglePin(game.slug)}
                    disabled={!isPinned && !canPin}
                    className={`text-[10px] font-black px-3 py-1 rounded-full transition-colors ${
                      isPinned
                        ? 'text-white'
                        : canPin
                        ? 'bg-stone-100 text-muted'
                        : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    }`}
                    style={isPinned ? { backgroundColor: '#1A4731' } : undefined}
                  >
                    {isPinned ? 'PINNED' : '+ PIN'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify the component builds without TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: add BottomNav component with pin customisation"
```

---

### Task 3: Wire BottomNav into group layout

**Files:**
- Modify: `app/g/[slug]/layout.tsx`

Add `<BottomNav>` beneath `<GroupNav>` and add bottom padding on `<main>` so content doesn't hide behind the fixed bottom bar on mobile.

- [ ] **Step 1: Update `app/g/[slug]/layout.tsx`**

Replace the file entirely:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getGroupBySlug } from '@/lib/supabase-server'
import GroupProvider from '@/components/GroupProvider'
import GroupNav from '@/components/GroupNav'
import BottomNav from '@/components/BottomNav'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  return { manifest: `/g/${params.slug}/manifest.webmanifest` }
}

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  return (
    <GroupProvider group={{ id: group.id, slug: group.slug, name: group.name }}>
      <GroupNav slug={group.slug} groupName={group.name} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      <BottomNav slug={group.slug} />
    </GroupProvider>
  )
}
```

Key change: `pb-24 md:pb-8` on `<main>` so the bottom bar (h-14 ≈ 56px) doesn't overlap content on mobile.

- [ ] **Step 2: Verify bottom bar appears on mobile, not on desktop**

On a mobile viewport: confirm the bottom bar is fixed at the bottom. Scroll down a long page to confirm content padding prevents the bar from overlapping the last item.

On desktop (≥ 768px): confirm no bottom bar is visible and `pb-24` is overridden to `pb-8`.

- [ ] **Step 3: Test pin customisation flow**

On mobile, tap "···  More" — sheet slides up with all 6 games listed. Three are marked PINNED (Pong, Beer Die, Hearts). Tap PINNED on Pong to unpin it — bar updates, sheet updates, "+ PIN" appears for Pong. Tap "+ PIN" on Cornhole — Cornhole appears in bar. Tap outside sheet — sheet closes. Refresh the page — pins are restored from localStorage.

- [ ] **Step 4: Commit**

```bash
git add app/g/\[slug\]/layout.tsx
git commit -m "feat: add BottomNav to group layout"
```

---

### Task 4: Leader cards on group home page

**Files:**
- Modify: `app/g/[slug]/page.tsx`

Add parallel Supabase queries to get the top-ranked player for each game, then render compact leader cards instead of plain navigation links.

- [ ] **Step 1: Write the updated `app/g/[slug]/page.tsx`**

Replace the file entirely:

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame, User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer, CornholeGamePlayer, SpikeballGamePlayer } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

type GameLeader = { name: string; wins: number; losses: number; winRatePct: number } | null

async function getRecentGames(groupId: string): Promise<RecentGame[]> {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGames },
      { data: beerDieGames },
      { data: cornholeGames },
      { data: spikeballGames },
      { data: heartsGames },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('cornhole_games').select('id, points_differential, played_at, cornhole_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('spikeball_games').select('id, points_differential, played_at, spikeball_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('hearts_games').select('id, played_at, hearts_game_players ( lost, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
    ])

    const recent: RecentGame[] = [
      ...(pongGames ?? []).map((g: any) => ({
        type: 'pong' as const, id: g.id, played_at: g.played_at,
        winners: (g.pong_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pong_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        cups_left: g.cups_left,
      })),
      ...(beerDieGames ?? []).map((g: any) => ({
        type: 'beer-die' as const, id: g.id, played_at: g.played_at,
        winners: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(cornholeGames ?? []).map((g: any) => ({
        type: 'cornhole' as const, id: g.id, played_at: g.played_at,
        winners: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(spikeballGames ?? []).map((g: any) => ({
        type: 'spikeball' as const, id: g.id, played_at: g.played_at,
        winners: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(heartsGames ?? []).map((g: any) => ({
        type: 'hearts' as const, id: g.id, played_at: g.played_at,
        players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
        loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
      })),
    ]
    recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    return recent.slice(0, 20)
  } catch { return [] }
}

async function getGameLeaders(groupId: string): Promise<Record<string, GameLeader>> {
  try {
    const supabase = createServerClient()
    const [
      { data: users },
      { data: pongPlayers },
      { data: beerDiePlayers },
      { data: beerDieSinks },
      { data: heartsPlayers },
      { data: cornholePlayers },
      { data: spikeballPlayers },
    ] = await Promise.all([
      supabase.from('users').select('id, name, created_at').eq('group_id', groupId).order('name'),
      supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', groupId),
      supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', groupId),
      supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', groupId),
      supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', groupId),
      supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', groupId),
      supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', groupId),
    ])

    const u = (users ?? []) as User[]

    const pongTop = computePongLeaderboard(u, (pongPlayers ?? []) as unknown as PongGamePlayer[])[0]
    const beerDieTop = computeBeerDieLeaderboard(u, (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[], (beerDieSinks ?? []) as BeerDieSink[])[0]
    const heartsTop = computeHeartsLeaderboard(u, (heartsPlayers ?? []) as unknown as HeartsGamePlayer[])[0]
    const cornholeTop = computeCornholeLeaderboard(u, (cornholePlayers ?? []) as unknown as CornholeGamePlayer[])[0]
    const spikeballTop = computeSpikeballLeaderboard(u, (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[])[0]

    const toLeader = (entry: any, isHearts = false): GameLeader => {
      if (!entry) return null
      if (isHearts) {
        const wins = entry.games_played - entry.losses
        return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100) }
      }
      return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100) }
    }

    return {
      pong: toLeader(pongTop),
      'beer-die': toLeader(beerDieTop),
      hearts: toLeader(heartsTop, true),
      cornhole: toLeader(cornholeTop),
      spikeball: toLeader(spikeballTop),
    }
  } catch { return {} }
}

const GAME_CARDS = [
  { key: 'pong', slug: 'pong', icon: '🏓', name: 'Pong' },
  { key: 'beer-die', slug: 'beer-die', icon: '🎲', name: 'Beer Die' },
  { key: 'hearts', slug: 'hearts', icon: '♥', name: 'Hearts' },
  { key: 'cornhole', slug: 'cornhole', icon: '🌽', name: 'Cornhole' },
  { key: 'spikeball', slug: 'spikeball', icon: '🏐', name: 'Spikeball' },
]

export default async function GroupHomePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const [games, leaders] = await Promise.all([
    getRecentGames(group.id),
    getGameLeaders(group.id),
  ])

  const base = `/g/${params.slug}`

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{group.name}</h1>
        <p className="text-muted mt-2 italic font-bold">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {GAME_CARDS.map(({ key, slug, icon, name }) => {
          const leader = leaders[key] ?? null
          return (
            <Link
              key={key}
              href={`${base}/${slug}`}
              className="bg-card rounded-xl p-4 border border-warm hover:bg-amber-50 transition-colors"
            >
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-2">{name}</div>
              <div className="text-sm font-black text-stone-900 truncate">{leader?.name ?? '—'}</div>
              <div className={`text-[10px] font-bold ${leader ? 'text-muted' : 'text-stone-300'}`}>
                {leader ? `${leader.wins}W · ${leader.losses}L · ${leader.winRatePct}%` : 'No games yet'}
              </div>
            </Link>
          )
        })}
      </div>
      <div>
        <h2 className="text-xs font-black mb-4 tracking-widest uppercase text-muted">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Verify leader cards render correctly**

Open a group page that has game data. Each card should show:
- Game icon + game name
- Top-ranked player's name in bold
- `{wins}W · {losses}L · {win_rate%}` record

Open a group with no data for a specific game (e.g. no spikeball games). That card shows `—` for name and `No games yet` in light grey.

Check mobile (≤ 375px): grid is 2 columns. Check desktop (≥ 640px): grid is 5 columns.

Hearts card: confirm the record is in `W · L · %` format (not "fewest losses"). Verify the math: a player with 4 games played and 1 loss shows `3W · 1L · 75%`.

- [ ] **Step 4: Commit**

```bash
git add app/g/\[slug\]/page.tsx
git commit -m "feat: leader cards on group home page"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task that covers it |
|---|---|
| Slim top bar: 🏠 / name / ⚙️ on mobile | Task 1 |
| Game nav links hidden on mobile | Task 1 (`hidden md:flex`) |
| LOG GAME removed from top bar on mobile | Task 1 (`hidden md:inline-flex`) |
| Fixed bottom bar with 5 slots | Task 2 |
| LOG GAME always centre slot | Task 2 |
| 3 pinned game slots | Task 2 |
| Active tab orange | Task 2 (`text-win` when `pathname.startsWith`) |
| localStorage persistence `sg-pinned-${slug}` | Task 2 |
| Default `["pong","beer-die","hearts"]` | Task 2 (`DEFAULT_PINS`) |
| Max 3 pins | Task 2 (`MAX_PINS = 3`) |
| More sheet with all games | Task 2 |
| PINNED badge (green) / +PIN badge (grey) | Task 2 |
| Bar full hint message | Task 2 |
| Bar order follows master list | Task 2 (`ALL_GAMES.map().filter()`) |
| Tapping outside sheet closes it | Task 2 (backdrop div with `onClick`) |
| Desktop unchanged | Task 1 + 2 (all mobile elements use `md:hidden`) |
| BottomNav added to layout | Task 3 |
| Bottom padding on main to avoid overlap | Task 3 (`pb-24 md:pb-8`) |
| Leader cards on home page | Task 4 |
| 2-col mobile / 5-col desktop grid | Task 4 (`grid-cols-2 sm:grid-cols-5`) |
| Leader name + W·L·% record | Task 4 |
| No games yet fallback | Task 4 |
| Hearts derived wins = games_played − losses | Task 4 (`toLeader` with `isHearts=true`) |
| Hearts win_rate = `Math.round((1 − loss_rate) * 100)` | Task 4 |

All spec requirements are covered. No gaps found.

### Placeholder scan

No TBDs, TODOs, or incomplete sections. All code is complete and executable.

### Type consistency

- `GameLeader` type defined once in `page.tsx` and used consistently in `getGameLeaders` return and card render
- Compute functions called with correct cast signatures matching their signatures in `lib/stats.ts`
- `toLeader(heartsTop, true)` uses `entry.games_played` and `entry.loss_rate` — both present on `HeartsLeaderboardEntry`
- `toLeader(pongTop)` uses `entry.wins`, `entry.losses`, `entry.win_rate` — all present on `PongLeaderboardEntry`
- Same holds for BeerDie, Cornhole, Spikeball entries
