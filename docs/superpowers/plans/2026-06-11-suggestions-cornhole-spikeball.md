# Suggestions Form + Cornhole/Spikeball Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-site game suggestion/feedback form (stored in Supabase, visible in admin) and two new game types — Cornhole and Spikeball — mirroring the existing Beer Die implementation exactly.

**Architecture:** All new API routes follow the existing `app/api/<game>/route.ts` pattern using the Supabase service-role client. Cornhole and Spikeball share identical logic to Beer Die (winners/losers/points_differential, no sinks). The suggestions table is global (no group_id). No test files exist in this project — use `npx tsc --noEmit` for type-checking after each task.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS

---

## File Map

**New files:**
- `app/api/suggestions/route.ts`
- `app/api/cornhole/route.ts`
- `app/api/cornhole/[id]/route.ts`
- `app/api/cornhole/head-to-head/route.ts`
- `app/api/cornhole/record-with/route.ts`
- `app/api/spikeball/route.ts`
- `app/api/spikeball/[id]/route.ts`
- `app/api/spikeball/head-to-head/route.ts`
- `app/api/spikeball/record-with/route.ts`
- `app/g/[slug]/cornhole/page.tsx`
- `app/g/[slug]/spikeball/page.tsx`
- `components/log/CornholeForm.tsx`
- `components/log/SpikeballForm.tsx`
- `components/admin/EditCornholeGame.tsx`
- `components/admin/EditSpikeballGame.tsx`
- `components/SuggestionForm.tsx`

**Modified files:**
- `lib/types.ts` — add Cornhole/Spikeball/Suggestion types, extend RecentGame union
- `lib/stats.ts` — add computeCornholeLeaderboard, computeSpikeballLeaderboard, H2H, PartnerRecord
- `components/RecentGames.tsx` — add cornhole/spikeball emoji + formatting
- `components/HeadToHead.tsx` — extend game prop type
- `components/PartnerRecord.tsx` — extend game prop type
- `components/log/LogTabs.tsx` — add Cornhole + Spikeball tabs
- `components/GroupNav.tsx` — add Cornhole + Spikeball nav items
- `components/admin/AdminPanel.tsx` — add cornhole/spikeball game types
- `app/admin/page.tsx` — add AdminCornhole/Spikeball types + suggestions section
- `app/g/[slug]/admin/page.tsx` — fetch + display cornhole/spikeball
- `app/g/[slug]/page.tsx` — add cornhole/spikeball to game grid + recent games feed
- `app/page.tsx` — replace mailto link with SuggestionForm

---

## Task 1: Create Supabase tables (manual step)

**This must be done before any other task.**

- [ ] **Step 1: Open Supabase SQL editor**

Go to your Supabase project → SQL Editor → New query. Run the following SQL:

```sql
-- Cornhole
create table cornhole_games (
  id uuid primary key default gen_random_uuid(),
  points_differential int not null,
  played_at timestamptz not null default now(),
  group_id uuid references groups(id) on delete cascade,
  approved boolean not null default false
);

create table cornhole_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references cornhole_games(id) on delete cascade,
  player_id uuid references users(id) on delete cascade,
  side text not null check (side in ('winner', 'loser')),
  group_id uuid references groups(id) on delete cascade
);

-- Spikeball
create table spikeball_games (
  id uuid primary key default gen_random_uuid(),
  points_differential int not null,
  played_at timestamptz not null default now(),
  group_id uuid references groups(id) on delete cascade,
  approved boolean not null default false
);

create table spikeball_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references spikeball_games(id) on delete cascade,
  player_id uuid references users(id) on delete cascade,
  side text not null check (side in ('winner', 'loser')),
  group_id uuid references groups(id) on delete cascade
);

-- Suggestions (global, no group_id)
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  name text,
  game_suggestion text,
  feedback text,
  email text,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 2: Verify tables exist**

In the Supabase Table Editor, confirm you can see: `cornhole_games`, `cornhole_game_players`, `spikeball_games`, `spikeball_game_players`, `suggestions`.

---

## Task 2: Extend types

**Files:** Modify `lib/types.ts`

- [ ] **Step 1: Replace the full contents of `lib/types.ts`**

```typescript
export type Group = {
  id: string
  slug: string
  name: string
  pin: string
  premium: boolean
  created_at: string
}

export type User = {
  id: string
  name: string
  created_at: string
}

export type PongGame = {
  id: string
  cups_left: number
  played_at: string
}

export type PongGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  pong_games: PongGame
}

export type BeerDieGame = {
  id: string
  points_differential: number
  played_at: string
}

export type BeerDieGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  beer_die_games: BeerDieGame
}

export type CornholeGame = {
  id: string
  points_differential: number
  played_at: string
}

export type CornholeGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  cornhole_games: CornholeGame
}

export type SpikeballGame = {
  id: string
  points_differential: number
  played_at: string
}

export type SpikeballGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  spikeball_games: SpikeballGame
}

export type HeartsGame = {
  id: string
  played_at: string
}

export type HeartsGamePlayer = {
  game_id: string
  player_id: string
  lost: boolean
  hearts_games: HeartsGame
}

export type PongLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  cup_differential: number
}

export type BeerDieSink = {
  id: string
  game_id: string
  player_id: string
  type: 'sink' | 'self_sink'
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
}

export type CornholeLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
}

export type SpikeballLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
}

export type HeartsLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  losses: number
  loss_rate: number
}

export type HeadToHeadResult = {
  wins: number
  losses: number
}

export type RecentPongGame = {
  type: 'pong'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  cups_left: number
}

export type RecentBeerDieGame = {
  type: 'beer-die'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentCornholeGame = {
  type: 'cornhole'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentSpikeballGame = {
  type: 'spikeball'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentHeartsGame = {
  type: 'hearts'
  id: string
  played_at: string
  players: string[]
  loser: string
}

export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentCornholeGame | RecentSpikeballGame | RecentHeartsGame
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to types.ts).

- [ ] **Step 3: Commit**

```
git add lib/types.ts
git commit -m "feat: add cornhole, spikeball, and suggestion types"
```

---

## Task 3: Extend stats

**Files:** Modify `lib/stats.ts`

- [ ] **Step 1: Append the following to the bottom of `lib/stats.ts`** (after the existing `computeBeerDiePartnerRecord` function)

```typescript
import {
  CornholeGamePlayer, CornholeLeaderboardEntry,
  SpikeballGamePlayer, SpikeballLeaderboardEntry,
} from './types'

export function computeCornholeLeaderboard(
  users: User[],
  gamePlayers: CornholeGamePlayer[]
): CornholeLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.cornhole_games.points_differential }
    else { s.losses++; s.point_diff -= gp.cornhole_games.points_differential }
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return { player_id: u.id, name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeCornholeHeadToHead(player1Id: string, player2Id: string, gamePlayers: CornholeGamePlayer[]): HeadToHeadResult {
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

export function computeCornholePartnerRecord(player1Id: string, player2Id: string, gamePlayers: CornholeGamePlayer[]): HeadToHeadResult {
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

export function computeSpikeballLeaderboard(
  users: User[],
  gamePlayers: SpikeballGamePlayer[]
): SpikeballLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.spikeball_games.points_differential }
    else { s.losses++; s.point_diff -= gp.spikeball_games.points_differential }
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return { player_id: u.id, name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeSpikeballHeadToHead(player1Id: string, player2Id: string, gamePlayers: SpikeballGamePlayer[]): HeadToHeadResult {
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

export function computeSpikeballPartnerRecord(player1Id: string, player2Id: string, gamePlayers: SpikeballGamePlayer[]): HeadToHeadResult {
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

**Important:** The import at the top of that block should be merged into the existing import at line 1 of `lib/stats.ts`. The final import line at the top of `lib/stats.ts` should read:

```typescript
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, CornholeLeaderboardEntry,
  SpikeballGamePlayer, SpikeballLeaderboardEntry,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```
git add lib/stats.ts
git commit -m "feat: add cornhole and spikeball stat functions"
```

---

## Task 4: Cornhole API routes

**Files:** Create 4 new files

- [ ] **Step 1: Create `app/api/cornhole/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeCornholeLeaderboard } from '@/lib/stats'
import { CornholeGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )').eq('group_id', group_id).eq('cornhole_games.approved', true),
  ])
  const leaderboard = computeCornholeLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as CornholeGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, points_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cornhole_games').insert({ points_differential, group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playerError } = await supabase.from('cornhole_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/cornhole/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, points_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { error: updateErr } = await supabase
    .from('cornhole_games').update({ points_differential }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('cornhole_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: insertErr } = await supabase.from('cornhole_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('cornhole_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('cornhole_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/cornhole/head-to-head/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeCornholeHeadToHead } from '@/lib/stats'
import { CornholeGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cornhole_game_players')
    .select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('cornhole_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeCornholeHeadToHead(player1, player2, (data ?? []) as unknown as CornholeGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 4: Create `app/api/cornhole/record-with/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeCornholePartnerRecord } from '@/lib/stats'
import { CornholeGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cornhole_game_players')
    .select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('cornhole_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeCornholePartnerRecord(player1, player2, (data ?? []) as unknown as CornholeGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 5: Type-check and commit**

```
npx tsc --noEmit
git add app/api/cornhole/
git commit -m "feat: add cornhole API routes"
```

---

## Task 5: Spikeball API routes

**Files:** Create 4 new files

- [ ] **Step 1: Create `app/api/spikeball/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeSpikeballLeaderboard } from '@/lib/stats'
import { SpikeballGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games!inner ( id, points_differential, played_at )').eq('group_id', group_id).eq('spikeball_games.approved', true),
  ])
  const leaderboard = computeSpikeballLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as SpikeballGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, points_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('spikeball_games').insert({ points_differential, group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playerError } = await supabase.from('spikeball_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/spikeball/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, points_differential, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { error: updateErr } = await supabase
    .from('spikeball_games').update({ points_differential }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('spikeball_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: insertErr } = await supabase.from('spikeball_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('spikeball_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('spikeball_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create `app/api/spikeball/head-to-head/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeSpikeballHeadToHead } from '@/lib/stats'
import { SpikeballGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('spikeball_game_players')
    .select('game_id, player_id, side, spikeball_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('spikeball_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeSpikeballHeadToHead(player1, player2, (data ?? []) as unknown as SpikeballGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 4: Create `app/api/spikeball/record-with/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeSpikeballPartnerRecord } from '@/lib/stats'
import { SpikeballGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('spikeball_game_players')
    .select('game_id, player_id, side, spikeball_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('spikeball_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeSpikeballPartnerRecord(player1, player2, (data ?? []) as unknown as SpikeballGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 5: Type-check and commit**

```
npx tsc --noEmit
git add app/api/spikeball/
git commit -m "feat: add spikeball API routes"
```

---

## Task 6: Log forms + LogTabs

**Files:** Create `components/log/CornholeForm.tsx`, `components/log/SpikeballForm.tsx`; modify `components/log/LogTabs.tsx`

- [ ] **Step 1: Create `components/log/CornholeForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function CornholeForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [points, setPoints] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points differential must be at least 1')
    setLoading(true)
    const res = await fetch('/api/cornhole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, points_differential: Number(points), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/cornhole` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-widest font-black block mb-2">Points Won By</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
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

- [ ] **Step 2: Create `components/log/SpikeballForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function SpikeballForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [points, setPoints] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points differential must be at least 1')
    setLoading(true)
    const res = await fetch('/api/spikeball', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, points_differential: Number(points), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/spikeball` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-widest font-black block mb-2">Points Won By</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
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

- [ ] **Step 3: Replace the full contents of `components/log/LogTabs.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball'

const tabs: { id: Tab; label: string }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: '🌽 Cornhole' },
  { id: 'spikeball', label: '🏐 Spikeball' },
]

export default function LogTabs({ players }: { players: User[] }) {
  const [active, setActive] = useState<Tab>('pong')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-5 py-2 rounded-full font-black text-sm transition-colors uppercase tracking-wide ${
              active === t.id ? 'bg-win text-white' : 'bg-card text-muted hover:text-stone-900 border border-warm'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'pong' && <PongForm players={players} />}
      {active === 'beer-die' && <BeerDieForm players={players} />}
      {active === 'hearts' && <HeartsForm players={players} />}
      {active === 'cornhole' && <CornholeForm players={players} />}
      {active === 'spikeball' && <SpikeballForm players={players} />}
    </div>
  )
}
```

- [ ] **Step 4: Type-check and commit**

```
npx tsc --noEmit
git add components/log/CornholeForm.tsx components/log/SpikeballForm.tsx components/log/LogTabs.tsx
git commit -m "feat: add cornhole and spikeball log forms"
```

---

## Task 7: Admin edit forms

**Files:** Create `components/admin/EditCornholeGame.tsx`, `components/admin/EditSpikeballGame.tsx`

- [ ] **Step 1: Create `components/admin/EditCornholeGame.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminCornholeGame } from '@/app/admin/page'
import PlayerSelector from '@/components/log/PlayerSelector'

type Props = {
  game: AdminCornholeGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditCornholeGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [points, setPoints] = useState(String(game.points_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/cornhole/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, points_differential: Number(points) }),
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
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Points Differential</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
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

- [ ] **Step 2: Create `components/admin/EditSpikeballGame.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminSpikeballGame } from '@/app/admin/page'
import PlayerSelector from '@/components/log/PlayerSelector'

type Props = {
  game: AdminSpikeballGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditSpikeballGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [points, setPoints] = useState(String(game.points_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/spikeball/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, points_differential: Number(points) }),
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
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Points Differential</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
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

- [ ] **Step 3: Commit** (type-check will fail until Task 8 adds the imported types)

```
git add components/admin/EditCornholeGame.tsx components/admin/EditSpikeballGame.tsx
git commit -m "feat: add cornhole and spikeball admin edit forms"
```

---

## Task 8: Update app/admin/page.tsx

**Files:** Modify `app/admin/page.tsx`

- [ ] **Step 1: Replace the full contents of `app/admin/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { User } from '@/lib/types'

export type AdminPongGame = {
  id: string
  cups_left: number
  played_at: string
  winner_ids: string[]
  loser_ids: string[]
}

export type AdminBeerDieGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminCornholeGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminSpikeballGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminHeartsGame = {
  id: string
  played_at: string
  game_players: { player_id: string; lost: boolean }[]
}

export type Suggestion = {
  id: string
  name: string | null
  game_suggestion: string | null
  feedback: string | null
  email: string | null
  created_at: string
}

async function getData() {
  try {
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
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('suggestions').select('id, name, game_suggestion, feedback, email, created_at').order('created_at', { ascending: false }),
    ])

    const pongGames: AdminPongGame[] = (pongGamesRaw ?? []).map((g: any) => {
      const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, cups_left: g.cups_left, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const beerDieGames: AdminBeerDieGame[] = (beerDieGamesRaw ?? []).map((g: any) => {
      const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const cornholeGames: AdminCornholeGame[] = (cornholeGamesRaw ?? []).map((g: any) => {
      const gp = (cornholePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const spikeballGames: AdminSpikeballGame[] = (spikeballGamesRaw ?? []).map((g: any) => {
      const gp = (spikeballPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const heartsGames: AdminHeartsGame[] = (heartsGamesRaw ?? []).map((g: any) => ({
      id: g.id, played_at: g.played_at,
      game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

    return {
      pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames,
      players: (users ?? []) as User[],
      suggestions: (suggestionsRaw ?? []) as Suggestion[],
    }
  } catch {
    return { pongGames: [], beerDieGames: [], cornholeGames: [], spikeballGames: [], heartsGames: [], players: [], suggestions: [] }
  }
}

export default async function AdminPage() {
  const { pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, players, suggestions } = await getData()
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
        pendingPongGames={[]}
        pendingBeerDieGames={[]}
        pendingCornholeGames={[]}
        pendingSpikeballGames={[]}
        pendingHeartsGames={[]}
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

- [ ] **Step 2: Commit** (type-check will fail until AdminPanel is updated in Task 9)

```
git add app/admin/page.tsx
git commit -m "feat: add cornhole, spikeball, suggestion types to global admin page"
```

---

## Task 9: Update AdminPanel

**Files:** Modify `components/admin/AdminPanel.tsx`

- [ ] **Step 1: Replace the full contents of `components/admin/AdminPanel.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditCornholeGame from './EditCornholeGame'
import EditSpikeballGame from './EditSpikeballGame'
import EditHeartsGame from './EditHeartsGame'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'cornhole'; played_at: string; data: AdminCornholeGame }
  | { kind: 'spikeball'; played_at: string; data: AdminSpikeballGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  cornholeGames: AdminCornholeGame[]
  spikeballGames: AdminSpikeballGame[]
  heartsGames: AdminHeartsGame[]
  pendingPongGames: AdminPongGame[]
  pendingBeerDieGames: AdminBeerDieGame[]
  pendingCornholeGames: AdminCornholeGame[]
  pendingSpikeballGames: AdminSpikeballGame[]
  pendingHeartsGames: AdminHeartsGame[]
  players: User[]
  groupPin: string
}

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames,
  pendingPongGames, pendingBeerDieGames, pendingCornholeGames, pendingSpikeballGames, pendingHeartsGames,
  players, groupPin,
}: Props) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [approveLoading, setApproveLoading] = useState<string | null>(null)

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
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const pendingGames: AllGame[] = [
    ...pendingPongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...pendingBeerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...pendingCornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
    ...pendingSpikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
    ...pendingHeartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const apiPath = (kind: string, id: string) => {
    if (kind === 'pong') return `/api/pong/${id}`
    if (kind === 'beer-die') return `/api/beer-die/${id}`
    if (kind === 'cornhole') return `/api/cornhole/${id}`
    if (kind === 'spikeball') return `/api/spikeball/${id}`
    return `/api/hearts/${id}`
  }

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    await fetch(apiPath(kind, id), { method: 'DELETE' })
    setDeleteLoading(false)
    window.location.reload()
  }

  const handleApprove = async (kind: string, id: string) => {
    setApproveLoading(id)
    await fetch(apiPath(kind, id), { method: 'PATCH' })
    setApproveLoading(null)
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
    return 'HEARTS'
  }

  const badgeColor = (kind: string) => {
    if (kind === 'pong') return 'bg-blue-100 text-blue-700'
    if (kind === 'beer-die') return 'bg-amber-100 text-amber-700'
    if (kind === 'cornhole') return 'bg-green-100 text-green-700'
    if (kind === 'spikeball') return 'bg-orange-100 text-orange-700'
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

  const GameRow = ({ g, isPending }: { g: AllGame; isPending: boolean }) => {
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
                {isPending ? (
                  <button
                    onClick={() => handleApprove(g.kind, id)}
                    disabled={approveLoading === id}
                    className="text-xs font-bold bg-win text-white px-2 py-1 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    {approveLoading === id ? '...' : '✓ Approve'}
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(isEditing ? null : id)}
                    className="text-xs text-muted hover:text-stone-900 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                  >
                    {isEditing ? 'Close' : '✏️ Edit'}
                  </button>
                )}
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

        {!isPending && isEditing && g.kind === 'pong' && (
          <EditPongGame game={g.data as AdminPongGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'beer-die' && (
          <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'cornhole' && (
          <EditCornholeGame game={g.data as AdminCornholeGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'spikeball' && (
          <EditSpikeballGame game={g.data as AdminSpikeballGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'hearts' && (
          <EditHeartsGame game={g.data as AdminHeartsGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pendingGames.length > 0 && (
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">
            Pending Approval
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pendingGames.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingGames.map(g => <GameRow key={g.data.id} g={g} isPending={true} />)}
          </div>
        </div>
      )}

      <div>
        {pendingGames.length > 0 && (
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">Approved Games</h2>
        )}
        <div className="space-y-2">
          {allGames.length === 0 && <p className="text-muted text-sm">No games logged yet.</p>}
          {allGames.map(g => <GameRow key={g.data.id} g={g} isPending={false} />)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```
npx tsc --noEmit
git add components/admin/AdminPanel.tsx
git commit -m "feat: extend AdminPanel for cornhole and spikeball"
```

---

## Task 10: Update group admin page

**Files:** Modify `app/g/[slug]/admin/page.tsx`

- [ ] **Step 1: Replace the full contents of `app/g/[slug]/admin/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { notFound } from 'next/navigation'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame } from '@/app/admin/page'
import { User } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: pongGamesRaw },
    { data: pendingPongRaw },
    { data: pongPlayers },
    { data: beerDieGamesRaw },
    { data: pendingBeerDieRaw },
    { data: beerDiePlayers },
    { data: cornholeGamesRaw },
    { data: pendingCornholeRaw },
    { data: cornholePlayers },
    { data: spikeballGamesRaw },
    { data: pendingSpikeballRaw },
    { data: spikeballPlayers },
    { data: heartsGamesRaw },
    { data: pendingHeartsRaw },
    { data: heartsPlayers },
    { data: users },
  ] = await Promise.all([
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('pong_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('beer_die_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('cornhole_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('spikeball_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
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
        pendingPongGames={assemblePong(pendingPongRaw ?? [])}
        pendingBeerDieGames={assembleBeerDie(pendingBeerDieRaw ?? [])}
        pendingCornholeGames={assembleCornhole(pendingCornholeRaw ?? [])}
        pendingSpikeballGames={assembleSpikeball(pendingSpikeballRaw ?? [])}
        pendingHeartsGames={assembleHearts(pendingHeartsRaw ?? [])}
        players={(users ?? []) as User[]}
        groupPin={group.pin}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```
npx tsc --noEmit
git add app/g/[slug]/admin/page.tsx
git commit -m "feat: extend group admin page for cornhole and spikeball"
```

---

## Task 11: New game pages + HeadToHead/PartnerRecord type updates

**Files:** Create `app/g/[slug]/cornhole/page.tsx`, `app/g/[slug]/spikeball/page.tsx`; modify `components/HeadToHead.tsx` and `components/PartnerRecord.tsx`

- [ ] **Step 1: Update the game prop type in `components/HeadToHead.tsx`**

Change line 9 from:
```typescript
  game: 'pong' | 'beer-die'
```
to:
```typescript
  game: 'pong' | 'beer-die' | 'cornhole' | 'spikeball'
```

- [ ] **Step 2: Update the game prop type in `components/PartnerRecord.tsx`**

Change line 9 from:
```typescript
  game: 'pong' | 'beer-die'
```
to:
```typescript
  game: 'pong' | 'beer-die' | 'cornhole' | 'spikeball'
```

- [ ] **Step 3: Create `app/g/[slug]/cornhole/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { CornholeGamePlayer, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeCornholeLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupCornholePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
  ])

  const leaderboard = computeCornholeLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as CornholeGamePlayer[]
  )

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
      <div className="max-w-xs space-y-4">
        <HeadToHead players={(users ?? []) as User[]} game="cornhole" />
        <PartnerRecord players={(users ?? []) as User[]} game="cornhole" />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/g/[slug]/spikeball/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { SpikeballGamePlayer, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeSpikeballLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupSpikeballPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', group.id),
  ])

  const leaderboard = computeSpikeballLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as SpikeballGamePlayer[]
  )

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
      <div className="max-w-xs space-y-4">
        <HeadToHead players={(users ?? []) as User[]} game="spikeball" />
        <PartnerRecord players={(users ?? []) as User[]} game="spikeball" />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Type-check and commit**

```
npx tsc --noEmit
git add components/HeadToHead.tsx components/PartnerRecord.tsx app/g/[slug]/cornhole/page.tsx app/g/[slug]/spikeball/page.tsx
git commit -m "feat: add cornhole and spikeball game pages"
```

---

## Task 12: Update GroupNav + RecentGames + group home page

**Files:** Modify `components/GroupNav.tsx`, `components/RecentGames.tsx`, `app/g/[slug]/page.tsx`

- [ ] **Step 1: Replace the full contents of `components/GroupNav.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  const pathname = usePathname()

  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/players`, label: 'Players' },
  ]

  return (
    <nav className="bg-card border-b border-warm px-4 py-3 flex items-center sticky top-0 z-10">
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
  )
}
```

- [ ] **Step 2: Replace the full contents of `components/RecentGames.tsx`**

```typescript
import { RecentGame } from '@/lib/types'

function formatGame(g: RecentGame): { title: string; detail: string } {
  if (g.type === 'pong') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `${g.cups_left} cup${g.cups_left !== 1 ? 's' : ''} left`,
  }
  if (g.type === 'beer-die') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'cornhole') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'spikeball') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  return {
    title: `Hearts — ${g.players.join(', ')}`,
    detail: `${g.loser} lost`,
  }
}

const gameEmoji: Record<string, string> = {
  pong: '🏓',
  'beer-die': '🎲',
  cornhole: '🌽',
  spikeball: '🏐',
  hearts: '♥',
}

export default function RecentGames({ games }: { games: RecentGame[] }) {
  if (games.length === 0)
    return <p className="text-muted text-sm">No games yet — go log one!</p>

  return (
    <div className="space-y-2">
      {games.map(g => {
        const { title, detail } = formatGame(g)
        const date = new Date(g.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <div key={`${g.type}-${g.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
            <span className="text-lg">{gameEmoji[g.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{title}</p>
              <p className="text-xs text-muted">{detail}</p>
            </div>
            <span className="text-xs text-muted shrink-0">{date}</span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Replace the full contents of `app/g/[slug]/page.tsx`**

```typescript
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

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

export default async function GroupHomePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const games = await getRecentGames(group.id)
  const base = `/g/${params.slug}`

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{group.name}</h1>
        <p className="text-muted mt-2 italic font-bold">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {[
          { href: `${base}/pong`, label: '🏓 Pong' },
          { href: `${base}/beer-die`, label: '🎲 Beer Die' },
          { href: `${base}/hearts`, label: '♥ Hearts' },
          { href: `${base}/cornhole`, label: '🌽 Cornhole' },
          { href: `${base}/spikeball`, label: '🏐 Spikeball' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="bg-card rounded-xl p-6 text-center font-black uppercase tracking-widest text-sm hover:bg-amber-50 transition-colors border border-warm">
            {label}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-xs font-black mb-4 tracking-widest uppercase text-muted">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Type-check and commit**

```
npx tsc --noEmit
git add components/GroupNav.tsx components/RecentGames.tsx app/g/[slug]/page.tsx
git commit -m "feat: add cornhole/spikeball to nav, home page, and recent games feed"
```

---

## Task 13: Suggestions feature

**Files:** Create `app/api/suggestions/route.ts`, `components/SuggestionForm.tsx`; modify `app/page.tsx`

- [ ] **Step 1: Create `app/api/suggestions/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { name, game_suggestion, feedback, email } = await req.json()

  const supabase = createServerClient()
  const { error } = await supabase.from('suggestions').insert({
    name: name || null,
    game_suggestion: game_suggestion || null,
    feedback: feedback || null,
    email: email || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 2: Create `components/SuggestionForm.tsx`**

```typescript
'use client'
import { useState } from 'react'

export default function SuggestionForm() {
  const [name, setName] = useState('')
  const [gameSuggestion, setGameSuggestion] = useState('')
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, game_suggestion: gameSuggestion, feedback, email }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
  }

  if (success) {
    return <p className="text-brand text-sm font-bold">Thanks for the feedback! ✓</p>
  }

  return (
    <form onSubmit={submit} className="space-y-3 text-left max-w-sm mx-auto">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1">Name</label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Optional"
            className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
          />
        </div>
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-1">Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional"
            className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Game Suggestion</label>
        <input
          type="text" value={gameSuggestion} onChange={e => setGameSuggestion(e.target.value)} placeholder="Optional"
          className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
        />
      </div>
      <div>
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Feedback</label>
        <textarea
          value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Optional" rows={3}
          className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win resize-none"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-white font-black px-5 py-2 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors text-sm uppercase tracking-wide">
        {loading ? 'Sending...' : 'Submit →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Replace the relevant section in `app/page.tsx`**

Find this block (lines 56-61):
```typescript
          <p className="mt-16 text-muted text-sm">
            <span id="want-anchor">Want</span> to suggest a game?{' '}
            <a href="mailto:summergamesapp@gmail.com?subject=Game suggestion" className="text-brand underline hover:text-orange-700">
              Let us know →
            </a>
          </p>
```

Replace it with:
```typescript
          <div className="mt-16">
            <p className="text-muted text-sm mb-4">
              <span id="want-anchor">Want</span> to suggest a game or give other feedback?
            </p>
            <SuggestionForm />
          </div>
```

Also add the import at the top of the file (after the existing imports):
```typescript
import SuggestionForm from '@/components/SuggestionForm'
```

- [ ] **Step 4: Type-check, build, and commit**

```
npx tsc --noEmit
git add app/api/suggestions/route.ts components/SuggestionForm.tsx app/page.tsx
git commit -m "feat: add in-site suggestion and feedback form"
```

---

## Final verification

- [ ] **Run a full build to confirm no TypeScript or Next.js errors**

```
npm run build
```

Expected: build completes with no errors. Next.js may emit warnings about dynamic routes — those are fine.

- [ ] **Commit if build needed any fixes**

```
git add -A
git commit -m "fix: resolve any build errors from cornhole/spikeball/suggestions features"
```
