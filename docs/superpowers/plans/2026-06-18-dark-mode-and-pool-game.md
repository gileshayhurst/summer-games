# Dark Mode + Pool Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic iOS dark mode (warm dark palette, system-triggered) and Pool as a new game with team support and balls-won-by differential.

**Architecture:** Dark mode uses CSS custom properties in `globals.css` with `@media (prefers-color-scheme: dark)` overrides — zero component changes needed. Pool mirrors the cornhole/spikeball pattern exactly: two Supabase tables, four API routes, a form component, admin edit, leaderboard page, and example page.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS v3, Supabase, Jest

---

## Task 1: Dark Mode

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `tailwind.config.ts` to use CSS variables**

Replace the entire file content:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        win: 'var(--color-win)',
        loss: 'var(--color-loss)',
        gold: 'var(--color-gold)',
        brand: 'var(--color-brand)',
        muted: 'var(--color-muted)',
        warm: 'var(--color-warm)',
        forest: 'var(--color-forest)',
      },
    },
  },
}

export default config
```

- [ ] **Step 2: Update `app/globals.css` with CSS variables and dark mode overrides**

Replace the entire file content:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #fffbf0;
  --color-card: #fff7ed;
  --color-win: #f97316;
  --color-loss: #ef4444;
  --color-gold: #eab308;
  --color-brand: #c2410c;
  --color-muted: #78716c;
  --color-warm: #f0e0b8;
  --color-forest: #1A4731;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1c1917;
    --color-card: #292524;
    --color-muted: #a8a29e;
    --color-warm: #44403c;
  }

  body {
    color: #fafaf9;
  }

  /* Flip stone text and bg classes that are hardcoded in components */
  .text-stone-900 { color: #fafaf9; }
  .text-stone-700 { color: #e7e5e4; }
  .text-stone-600 { color: #d6d3d1; }
  .bg-stone-100  { background-color: #3c3836; }
  .bg-stone-200  { background-color: #44403c; }
  .hover\:bg-stone-200:hover { background-color: #57534e; }
  .hover\:bg-amber-50:hover  { background-color: #312e2b; }
  .bg-amber-50   { background-color: #292524; }
  .bg-amber-100  { background-color: #3a2e1c; }
  .text-amber-700 { color: #fbbf24; }
  .bg-blue-100   { background-color: #1e2e3d; }
  .text-blue-700  { color: #60a5fa; }
  .bg-green-100  { background-color: #1a2e22; }
  .text-green-700 { color: #4ade80; }
  .bg-orange-100 { background-color: #3a1f0d; }
  .text-orange-700 { color: #fb923c; }
  .bg-pink-100   { background-color: #3a1a2a; }
  .text-pink-700  { color: #f472b6; }
}
```

- [ ] **Step 3: Update `app/layout.tsx` to support dark/light theme colors**

Replace the `themeColor` line in the viewport export. Full file:

```ts
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1A4731' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Summer Games',
  description: 'Track your friend group\'s game results',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

Note: `text-stone-900` is removed from body className — body text color is now set by the `body` rule in `globals.css` (dark: `#fafaf9`, light: inherited default).

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat: add automatic dark mode via CSS variables"
```

---

## Task 2: Pool Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add pool types to `lib/types.ts`**

Append to the end of `lib/types.ts` (after the `RecentGame` type):

```ts
export type PoolGame = {
  id: string
  balls_differential: number
  played_at: string
}

export type PoolGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  pool_games: PoolGame
}

export type PoolLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  balls_differential: number
}

export type RecentPoolGame = {
  type: 'pool'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  balls_differential: number
}
```

- [ ] **Step 2: Update the `RecentGame` union**

Find and replace the existing `RecentGame` type:

Old:
```ts
export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentCornholeGame | RecentSpikeballGame | RecentHeartsGame
```

New:
```ts
export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentCornholeGame | RecentSpikeballGame | RecentHeartsGame | RecentPoolGame
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Pool game types"
```

---

## Task 3: Pool Stats + Tests

**Files:**
- Modify: `lib/stats.ts`
- Modify: `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Add pool stats functions to `lib/stats.ts`**

First, update the import at the top of `lib/stats.ts`:

Old:
```ts
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, CornholeLeaderboardEntry,
  SpikeballGamePlayer, SpikeballLeaderboardEntry,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'
```

New:
```ts
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, CornholeLeaderboardEntry,
  SpikeballGamePlayer, SpikeballLeaderboardEntry,
  PoolGamePlayer, PoolLeaderboardEntry,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'
```

Then append these three functions to the end of `lib/stats.ts`:

```ts
export function computePoolLeaderboard(
  users: User[],
  gamePlayers: PoolGamePlayer[]
): PoolLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, balls_diff: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.balls_diff += gp.pool_games.balls_differential }
    else { s.losses++; s.balls_diff -= gp.pool_games.balls_differential }
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return { player_id: u.id, name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, balls_differential: s.balls_diff }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computePoolHeadToHead(player1Id: string, player2Id: string, gamePlayers: PoolGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computePoolPartnerRecord(player1Id: string, player2Id: string, gamePlayers: PoolGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}
```

- [ ] **Step 2: Write failing tests**

Add these tests to the end of `__tests__/lib/stats.test.ts`:

```ts
import {
  computePoolLeaderboard,
  computePoolHeadToHead,
  computePoolPartnerRecord,
} from '../../lib/stats'
import { PoolGamePlayer } from '../../lib/types'

const pg2 = (id: string, balls: number) => ({ id, balls_differential: balls, played_at: '2026-06-01T12:00:00Z' })

describe('computePoolLeaderboard', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant by 3
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pool_games: pg2('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm by 1
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pool_games: pg2('g2', 1) },
    // g3: Giles+Sherm beat Rob+Ant by 2
    { game_id: 'g3', player_id: 'u1', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'loser',  pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pool_games: pg2('g3', 2) },
  ]

  it('ranks by win rate descending', () => {
    const result = computePoolLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')
    expect(result[0].wins).toBe(2)
    expect(result[0].losses).toBe(1)
    expect(result[0].balls_differential).toBe(4) // +3+2-1
  })

  it('excludes players with 0 games', () => {
    expect(computePoolLeaderboard(users, [])).toHaveLength(0)
  })
})

describe('computePoolHeadToHead', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles beats Rob
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 3) },
    // g2: Rob beats Giles
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    // g3: Giles+Rob on same team — should NOT count as h2h
    { game_id: 'g3', player_id: 'u1', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'loser',  pool_games: pg2('g3', 2) },
  ]

  it('counts wins and losses between opponents', () => {
    const r = computePoolHeadToHead('u1', 'u3', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })

  it('ignores games where they were teammates', () => {
    const r = computePoolHeadToHead('u1', 'u3', gamePlayers.slice(4))
    expect(r.wins).toBe(0)
    expect(r.losses).toBe(0)
  })
})

describe('computePoolPartnerRecord', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pool_games: pg2('g1', 2) },
    // g2: Giles+Sherm lose
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pool_games: pg2('g2', 1) },
  ]

  it('counts wins and losses when partnered together', () => {
    const r = computePoolPartnerRecord('u1', 'u2', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })
})
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
npx jest __tests__/lib/stats.test.ts --testNamePattern="computePool" --no-coverage
```

Expected: all pool tests PASS. (The existing beer-die tests may fail — that's a pre-existing issue, ignore them.)

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/stats.ts __tests__/lib/stats.test.ts
git commit -m "feat: add Pool stats functions with tests"
```

---

## Task 4: Pool DB Migration

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_pool_tables.sql` (or run manually in Supabase dashboard)

This task requires creating tables in Supabase. If you have the Supabase CLI (`supabase`) installed and linked, use that. Otherwise, run the SQL directly in the Supabase dashboard SQL editor.

- [ ] **Step 1: Run this SQL in Supabase (dashboard → SQL editor)**

```sql
-- Pool games table
CREATE TABLE IF NOT EXISTS pool_games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  balls_differential integer NOT NULL CHECK (balls_differential >= 1),
  played_at timestamptz NOT NULL DEFAULT now(),
  approved boolean NOT NULL DEFAULT true
);

-- Pool game players join table
CREATE TABLE IF NOT EXISTS pool_game_players (
  game_id uuid NOT NULL REFERENCES pool_games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('winner', 'loser')),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, player_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS pool_game_players_group_id_idx ON pool_game_players(group_id);
CREATE INDEX IF NOT EXISTS pool_game_players_player_id_idx ON pool_game_players(player_id);
```

- [ ] **Step 2: Verify tables exist**

Run in Supabase SQL editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('pool_games', 'pool_game_players');
```

Expected: 2 rows returned.

- [ ] **Step 3: Commit a note about the migration (no file to commit if using dashboard)**

```bash
git commit --allow-empty -m "feat: pool DB tables created in Supabase (pool_games, pool_game_players)"
```

---

## Task 5: Pool API Routes

**Files:**
- Create: `app/api/pool/route.ts`
- Create: `app/api/pool/[id]/route.ts`
- Create: `app/api/pool/head-to-head/route.ts`
- Create: `app/api/pool/record-with/route.ts`

- [ ] **Step 1: Create `app/api/pool/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePoolLeaderboard } from '@/lib/stats'
import { PoolGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('pool_game_players').select('game_id, player_id, side, pool_games!inner ( id, balls_differential, played_at )').eq('group_id', group_id).eq('pool_games.approved', true),
  ])
  const leaderboard = computePoolLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PoolGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, balls_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof balls_differential !== 'number' || balls_differential < 1)
    return NextResponse.json({ error: 'balls_differential must be >= 1' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pool_games').insert({ balls_differential, group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playerError } = await supabase.from('pool_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/pool/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, balls_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof balls_differential !== 'number' || balls_differential < 1)
    return NextResponse.json({ error: 'balls_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { error: updateErr } = await supabase
    .from('pool_games').update({ balls_differential }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('pool_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: insertErr } = await supabase.from('pool_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('pool_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/pool/head-to-head/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePoolHeadToHead } from '@/lib/stats'
import { PoolGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pool_game_players')
    .select('game_id, player_id, side, pool_games!inner ( id, balls_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('pool_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePoolHeadToHead(player1, player2, (data ?? []) as unknown as PoolGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 4: Create `app/api/pool/record-with/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePoolPartnerRecord } from '@/lib/stats'
import { PoolGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pool_game_players')
    .select('game_id, player_id, side, pool_games!inner ( id, balls_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('pool_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePoolPartnerRecord(player1, player2, (data ?? []) as unknown as PoolGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/pool/
git commit -m "feat: add Pool API routes (CRUD, head-to-head, record-with)"
```

---

## Task 6: Pool Form + Edit Components

**Files:**
- Create: `components/log/PoolForm.tsx`
- Create: `components/admin/EditPoolGame.tsx`

- [ ] **Step 1: Create `components/log/PoolForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function PoolForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [balls, setBalls] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!balls || Number(balls) < 1) return setError('Balls differential must be at least 1')
    setLoading(true)
    const res = await fetch('/api/pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, balls_differential: Number(balls), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/pool` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-widest font-black block mb-2">Balls Won By</label>
        <input
          type="number" min="1" value={balls} onChange={e => setBalls(e.target.value)}
          className="bg-card border border-warm rounded px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win"
          placeholder="1"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm font-bold">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-white font-black px-6 py-2 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors uppercase tracking-wide">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `components/admin/EditPoolGame.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminPoolGame } from '@/app/admin/page'
import PlayerSelector from '@/components/log/PlayerSelector'

type Props = {
  game: AdminPoolGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditPoolGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [balls, setBalls] = useState(String(game.balls_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!balls || Number(balls) < 1) return setError('Balls must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/pool/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, balls_differential: Number(balls) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-warm rounded-xl space-y-3">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Balls Differential</label>
        <input
          type="number" min="1" value={balls} onChange={e => setBalls(e.target.value)}
          className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-white font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-wide hover:bg-orange-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-stone-100 text-stone-600 font-bold px-4 py-1.5 rounded-full text-sm hover:bg-stone-200">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

Note: `EditPoolGame` imports `AdminPoolGame` from `@/app/admin/page` — that type will be added in Task 10. TypeScript will error here until Task 10 is complete. Proceed anyway; the type check will be run at the end of Task 10.

- [ ] **Step 3: Commit**

```bash
git add components/log/PoolForm.tsx components/admin/EditPoolGame.tsx
git commit -m "feat: add PoolForm and EditPoolGame components"
```

---

## Task 7: Pool Leaderboard Page

**Files:**
- Create: `app/g/[slug]/pool/page.tsx`

- [ ] **Step 1: Create `app/g/[slug]/pool/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { PoolGamePlayer, User, RecentPoolGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePoolLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupPoolPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pool_game_players').select('game_id, player_id, side, pool_games ( id, balls_differential, played_at )').eq('group_id', group.id),
    supabase.from('pool_games').select('id, balls_differential, played_at, pool_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computePoolLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PoolGamePlayer[]
  )

  const recentGames: RecentPoolGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'pool' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.pool_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.pool_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    balls_differential: g.balls_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'balls_differential', label: 'Ball Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🎱 Pool</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="pool" />
          <PartnerRecord players={(users ?? []) as User[]} game="pool" />
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

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors (or only the pre-existing `EditPoolGame` → `AdminPoolGame` error from Task 6, which is resolved in Task 10).

- [ ] **Step 3: Commit**

```bash
git add app/g/[slug]/pool/
git commit -m "feat: add Pool leaderboard page"
```

---

## Task 8: Pool Example Page + Example Data

**Files:**
- Modify: `app/g/example/data.ts`
- Create: `app/g/example/pool/page.tsx`

- [ ] **Step 1: Add pool example data to `app/g/example/data.ts`**

Append to the end of `app/g/example/data.ts` (after `exampleHeartsRecent`):

```ts
export const examplePoolLeaderboard = [] as const

export const examplePoolRecent = [] as const
```

- [ ] **Step 2: Create `app/g/example/pool/page.tsx`**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import { examplePoolLeaderboard, examplePoolRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  { key: 'balls_differential', label: 'Ball Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
]

export default function ExamplePoolPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🎱 Pool</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={examplePoolLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew&apos;s game history.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={examplePoolRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/g/example/data.ts app/g/example/pool/
git commit -m "feat: add Pool example page"
```

---

## Task 9: Navigation Updates

**Files:**
- Modify: `components/BottomNav.tsx`
- Modify: `components/log/LogTabs.tsx`
- Modify: `components/GroupNav.tsx`
- Modify: `components/RecentGames.tsx`

- [ ] **Step 1: Add Pool to `ALL_GAMES` in `components/BottomNav.tsx`**

Find:
```ts
const ALL_GAMES = [
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'players', label: 'Players', icon: '👥' },
]
```

Replace with:
```ts
const ALL_GAMES = [
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'pool', label: 'Pool', icon: '🎱' },
  { slug: 'players', label: 'Players', icon: '👥' },
]
```

- [ ] **Step 2: Add Pool tab to `components/log/LogTabs.tsx`**

Find the import block and the `tabs` array:

```ts
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'
import GameIcon from '../icons/GameIcon'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball'

const tabs: { id: Tab; label: ReactNode }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: <><GameIcon type="cornhole" className="inline w-4 h-4 mr-1 align-middle" /> Cornhole</> },
  { id: 'spikeball', label: <><GameIcon type="spikeball" className="inline w-4 h-4 mr-1 align-middle" /> Spikeball</> },
]
```

Replace with:
```ts
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'
import PoolForm from './PoolForm'
import GameIcon from '../icons/GameIcon'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball' | 'pool'

const tabs: { id: Tab; label: ReactNode }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: <><GameIcon type="cornhole" className="inline w-4 h-4 mr-1 align-middle" /> Cornhole</> },
  { id: 'spikeball', label: <><GameIcon type="spikeball" className="inline w-4 h-4 mr-1 align-middle" /> Spikeball</> },
  { id: 'pool', label: '🎱 Pool' },
]
```

Also find the render section and add the pool case. Find:
```tsx
      {active === 'spikeball' && <SpikeballForm players={players} />}
```

Replace with:
```tsx
      {active === 'spikeball' && <SpikeballForm players={players} />}
      {active === 'pool' && <PoolForm players={players} />}
```

- [ ] **Step 3: Add Pool to `components/GroupNav.tsx` desktop nav**

Find:
```ts
  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/players`, label: 'Players' },
  ]
```

Replace with:
```ts
  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/pool`, label: 'Pool' },
    { href: `${base}/players`, label: 'Players' },
  ]
```

- [ ] **Step 4: Add pool case to `components/RecentGames.tsx`**

Find:
```ts
  if (g.type === 'spikeball') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  return {
```

Replace with:
```ts
  if (g.type === 'spikeball') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'pool') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.balls_differential} ball${g.balls_differential !== 1 ? 's' : ''}`,
  }
  return {
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/BottomNav.tsx components/log/LogTabs.tsx components/GroupNav.tsx components/RecentGames.tsx
git commit -m "feat: add Pool to navigation and recent games display"
```

---

## Task 10: Admin Pages

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/g/[slug]/admin/page.tsx`
- Modify: `components/admin/AdminPanel.tsx`

- [ ] **Step 1: Add `AdminPoolGame` type and pool fetch to `app/admin/page.tsx`**

Add this type definition after `AdminHeartsGame` and before `Suggestion`:

```ts
export type AdminPoolGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  balls_differential: number
  played_at: string
}
```

In the `getData` function, expand the `Promise.all` to include pool games. Replace the existing `Promise.all([...])` block:

```ts
    const [
      { data: pongGamesRaw },
      { data: pongPlayers },
      { data: beerDieGamesRaw },
      { data: beerDiePlayers },
      { data: cornholeGamesRaw },
      { data: cornholePlayers },
      { data: spikeballGamesRaw },
      { data: spikeballPlayers },
      { data: heartsGamesRaw },
      { data: heartsPlayers },
      { data: poolGamesRaw },
      { data: poolPlayers },
      { data: users },
      { data: suggestionsRaw },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at').order('played_at', { ascending: false }),
      supabase.from('pong_game_players').select('game_id, player_id, side'),
      supabase.from('beer_die_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('beer_die_game_players').select('game_id, player_id, side'),
      supabase.from('cornhole_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('cornhole_game_players').select('game_id, player_id, side'),
      supabase.from('spikeball_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('spikeball_game_players').select('game_id, player_id, side'),
      supabase.from('hearts_games').select('id, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_game_players').select('game_id, player_id, lost'),
      supabase.from('pool_games').select('id, balls_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('pool_game_players').select('game_id, player_id, side'),
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('suggestions').select('id, name, game_suggestion, feedback, email, created_at').order('created_at', { ascending: false }),
    ])
```

Add pool game assembly after `heartsGames`:

```ts
    const poolGames: AdminPoolGame[] = (poolGamesRaw ?? []).map((g: any) => {
      const gp = (poolPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, balls_differential: g.balls_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })
```

Update the return statement to include `poolGames`:

```ts
    return {
      pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames,
      players: (users ?? []) as User[],
      suggestions: (suggestionsRaw ?? []) as Suggestion[],
    }
  } catch {
    return { pongGames: [], beerDieGames: [], cornholeGames: [], spikeballGames: [], heartsGames: [], poolGames: [], players: [], suggestions: [] }
  }
```

Update the `AdminPage` component to pass `poolGames` and remove the stale `pending*` props:

```tsx
export default async function AdminPage() {
  const { pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames, players, suggestions } = await getData()
  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={pongGames}
        beerDieGames={beerDieGames}
        cornholeGames={cornholeGames}
        spikeballGames={spikeballGames}
        heartsGames={heartsGames}
        poolGames={poolGames}
        players={players}
        groupPin="1111"
      />
      {suggestions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-4">
            Suggestions & Feedback
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{suggestions.length}</span>
          </h2>
          <div className="space-y-3">
            {suggestions.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-warm px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-900">{s.name ?? 'Anonymous'}</span>
                  <span className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {s.email && <p className="text-xs text-muted">{s.email}</p>}
                {s.game_suggestion && <p className="text-sm text-stone-700"><span className="font-bold">Game:</span> {s.game_suggestion}</p>}
                {s.feedback && <p className="text-sm text-stone-700"><span className="font-bold">Feedback:</span> {s.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add pool fetch to `app/g/[slug]/admin/page.tsx`**

Expand the `Promise.all` and add pool fetch. The full updated file:

```tsx
export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { notFound } from 'next/navigation'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame } from '@/app/admin/page'
import { User } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: pongGamesRaw },
    { data: pongPlayers },
    { data: beerDieGamesRaw },
    { data: beerDiePlayers },
    { data: cornholeGamesRaw },
    { data: cornholePlayers },
    { data: spikeballGamesRaw },
    { data: spikeballPlayers },
    { data: heartsGamesRaw },
    { data: heartsPlayers },
    { data: poolGamesRaw },
    { data: poolPlayers },
    { data: users },
  ] = await Promise.all([
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('pong_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('beer_die_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('cornhole_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('spikeball_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
    supabase.from('pool_games').select('id, balls_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('pool_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
  ])

  const assemblePong = (raw: any[]): AdminPongGame[] =>
    raw.map((g: any) => {
      const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, cups_left: g.cups_left, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleBeerDie = (raw: any[]): AdminBeerDieGame[] =>
    raw.map((g: any) => {
      const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleCornhole = (raw: any[]): AdminCornholeGame[] =>
    raw.map((g: any) => {
      const gp = (cornholePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleSpikeball = (raw: any[]): AdminSpikeballGame[] =>
    raw.map((g: any) => {
      const gp = (spikeballPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleHearts = (raw: any[]): AdminHeartsGame[] =>
    raw.map((g: any) => ({
      id: g.id, played_at: g.played_at,
      game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

  const assemblePool = (raw: any[]): AdminPoolGame[] =>
    raw.map((g: any) => {
      const gp = (poolPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, balls_differential: g.balls_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        cornholeGames={assembleCornhole(cornholeGamesRaw ?? [])}
        spikeballGames={assembleSpikeball(spikeballGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        poolGames={assemblePool(poolGamesRaw ?? [])}
        players={(users ?? []) as User[]}
        groupPin={group.pin}
      />
    </div>
  )
}
```

- [ ] **Step 3: Update `components/admin/AdminPanel.tsx` to support pool**

Replace the entire file with:

```tsx
'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditCornholeGame from './EditCornholeGame'
import EditSpikeballGame from './EditSpikeballGame'
import EditHeartsGame from './EditHeartsGame'
import EditPoolGame from './EditPoolGame'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'cornhole'; played_at: string; data: AdminCornholeGame }
  | { kind: 'spikeball'; played_at: string; data: AdminSpikeballGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }
  | { kind: 'pool'; played_at: string; data: AdminPoolGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  cornholeGames: AdminCornholeGame[]
  spikeballGames: AdminSpikeballGame[]
  heartsGames: AdminHeartsGame[]
  poolGames: AdminPoolGame[]
  players: User[]
  groupPin: string
}

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames, players, groupPin,
}: Props) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === '1') setAuthed(true)
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === groupPin) {
      sessionStorage.setItem('admin_authed', '1')
      setAuthed(true)
    } else {
      setPinError(true)
      setPin('')
    }
  }

  const nameMap = new Map(players.map(p => [p.id, p.name]))
  const name = (id: string) => nameMap.get(id) ?? id

  const allGames: AllGame[] = [
    ...pongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...beerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...cornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
    ...spikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
    ...poolGames.map(g => ({ kind: 'pool' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const apiPath = (kind: string, id: string) => {
    if (kind === 'pong') return `/api/pong/${id}`
    if (kind === 'beer-die') return `/api/beer-die/${id}`
    if (kind === 'cornhole') return `/api/cornhole/${id}`
    if (kind === 'spikeball') return `/api/spikeball/${id}`
    if (kind === 'pool') return `/api/pool/${id}`
    return `/api/hearts/${id}`
  }

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    await fetch(apiPath(kind, id), { method: 'DELETE' })
    setDeleteLoading(false)
    window.location.reload()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const gameSummary = (g: AllGame) => {
    if (g.kind === 'pong') {
      const d = g.data as AdminPongGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} (${d.cups_left} cups)`
    }
    if (g.kind === 'beer-die') {
      const d = g.data as AdminBeerDieGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'cornhole') {
      const d = g.data as AdminCornholeGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'spikeball') {
      const d = g.data as AdminSpikeballGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'pool') {
      const d = g.data as AdminPoolGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.balls_differential} balls`
    }
    const d = g.data as AdminHeartsGame
    const loserName = name(d.game_players.find(p => p.lost)?.player_id ?? '')
    const others = d.game_players.filter(p => !p.lost).map(p => name(p.player_id)).join(', ')
    return `${others} — ${loserName} lost`
  }

  const badgeLabel = (kind: string) => {
    if (kind === 'pong') return 'PONG'
    if (kind === 'beer-die') return 'DIE'
    if (kind === 'cornhole') return 'CORN'
    if (kind === 'spikeball') return 'SPIKE'
    if (kind === 'pool') return 'POOL'
    return 'HEARTS'
  }

  const badgeColor = (kind: string) => {
    if (kind === 'pong') return 'bg-blue-100 text-blue-700'
    if (kind === 'beer-die') return 'bg-amber-100 text-amber-700'
    if (kind === 'cornhole') return 'bg-green-100 text-green-700'
    if (kind === 'spikeball') return 'bg-orange-100 text-orange-700'
    if (kind === 'pool') return 'bg-purple-100 text-purple-700'
    return 'bg-pink-100 text-pink-700'
  }

  if (!authed) {
    return (
      <form onSubmit={handlePinSubmit} className="max-w-xs space-y-4">
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-2">Enter PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false) }}
            className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
            placeholder="••••"
            autoFocus
          />
        </div>
        {pinError && <p className="text-loss text-sm">Incorrect PIN</p>}
        <button type="submit"
          className="bg-win text-white font-black px-6 py-2 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors">
          Unlock →
        </button>
      </form>
    )
  }

  const GameRow = ({ g }: { g: AllGame }) => {
    const id = g.data.id
    const isEditing = editingId === id
    const isConfirmingDelete = confirmDeleteId === id

    return (
      <div key={id} className="bg-card rounded-xl border border-warm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor(g.kind)}`}>
              {badgeLabel(g.kind)}
            </span>
            <span className="text-sm text-stone-900 truncate">{gameSummary(g)}</span>
            <span className="text-xs text-muted shrink-0">{formatDate(g.played_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isConfirmingDelete && (
              <>
                <button
                  onClick={() => setEditingId(isEditing ? null : id)}
                  className="text-xs text-muted hover:text-stone-900 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                >
                  {isEditing ? 'Close' : '✏️ Edit'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(id)}
                  className="text-xs text-muted hover:text-loss px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                >
                  🗑 Delete
                </button>
              </>
            )}
            {isConfirmingDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Sure?</span>
                <button
                  onClick={() => handleDelete(g.kind, id)}
                  disabled={deleteLoading}
                  className="text-xs font-bold bg-loss text-white px-2 py-1 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing && g.kind === 'pong' && (
          <EditPongGame game={g.data as AdminPongGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'beer-die' && (
          <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'cornhole' && (
          <EditCornholeGame game={g.data as AdminCornholeGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'spikeball' && (
          <EditSpikeballGame game={g.data as AdminSpikeballGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'hearts' && (
          <EditHeartsGame game={g.data as AdminHeartsGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'pool' && (
          <EditPoolGame game={g.data as AdminPoolGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {allGames.length === 0 && <p className="text-muted text-sm">No games logged yet.</p>}
      {allGames.map(g => <GameRow key={g.data.id} g={g} />)}
    </div>
  )
}
```

Note: `bg-purple-100 text-purple-700` is used for pool's badge. Add dark mode overrides for purple in `app/globals.css` (add to the dark media query block):

```css
  .bg-purple-100 { background-color: #2e1a3a; }
  .text-purple-700 { color: #c084fc; }
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/page.tsx app/g/[slug]/admin/page.tsx components/admin/AdminPanel.tsx app/globals.css
git commit -m "feat: add Pool support to admin panel"
```

---

## Task 11: Recent API Route

**Files:**
- Modify: `app/api/recent/route.ts`

- [ ] **Step 1: Update `app/api/recent/route.ts` to include pool games**

Replace the entire file:

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { RecentGame } from '@/lib/types'

export async function GET() {
  try {
    const supabase = createServerClient()

    const [
      { data: pongGames },
      { data: beerDieGames },
      { data: heartsGames },
      { data: poolGames },
    ] = await Promise.all([
      supabase
        .from('pong_games')
        .select(`id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('beer_die_games')
        .select(`id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('hearts_games')
        .select(`id, played_at, hearts_game_players ( lost, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('pool_games')
        .select(`id, balls_differential, played_at, pool_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
    ])

    const recent: RecentGame[] = [
      ...(pongGames ?? []).map((g: any) => ({
        type: 'pong' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.pong_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pong_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        cups_left: g.cups_left,
      })),
      ...(beerDieGames ?? []).map((g: any) => ({
        type: 'beer-die' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.beer_die_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.beer_die_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(heartsGames ?? []).map((g: any) => ({
        type: 'hearts' as const,
        id: g.id,
        played_at: g.played_at,
        players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
        loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
      })),
      ...(poolGames ?? []).map((g: any) => ({
        type: 'pool' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.pool_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pool_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        balls_differential: g.balls_differential,
      })),
    ]

    recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

    return NextResponse.json({ games: recent.slice(0, 20) })
  } catch (err) {
    console.error('Recent games error:', err)
    return NextResponse.json({ games: [] })
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Full build check**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 4: Run pool stats tests**

```bash
npx jest __tests__/lib/stats.test.ts --testNamePattern="computePool" --no-coverage
```

Expected: all 5 pool tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/recent/route.ts
git commit -m "feat: include Pool games in recent activity feed"
```
