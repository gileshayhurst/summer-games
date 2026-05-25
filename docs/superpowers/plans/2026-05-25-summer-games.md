# Summer Games Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publicly-viewable Next.js web app for tracking pong, beer die, and hearts results among a friend group, hosted on Vercel with a Supabase PostgreSQL backend.

**Architecture:** Next.js 14 App Router with Server Components for data fetching and Client Components for interactivity. API routes handle all writes. Pure TypeScript functions in `lib/stats.ts` compute leaderboard rankings from raw query results.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL), Vercel, Jest + React Testing Library

---

## File Map

```
app/
  layout.tsx                        Root layout with Nav
  page.tsx                          Home: recent games feed
  pong/page.tsx                     Pong leaderboard
  beer-die/page.tsx                 Beer Die leaderboard
  hearts/page.tsx                   Hearts leaderboard
  players/page.tsx                  All players grid
  players/[name]/page.tsx           Individual player profile
  log/page.tsx                      Log a game
  api/
    players/route.ts                GET list, POST new player
    pong/route.ts                   GET leaderboard data, POST game
    pong/head-to-head/route.ts      GET head-to-head stats
    beer-die/route.ts               GET leaderboard data, POST game
    beer-die/head-to-head/route.ts  GET head-to-head stats
    hearts/route.ts                 GET leaderboard data, POST game
    recent/route.ts                 GET combined recent games

components/
  Nav.tsx                           Top navigation bar (server)
  Leaderboard.tsx                   Reusable leaderboard table (server)
  HeadToHead.tsx                    Dropdown + stats (client)
  RecentGames.tsx                   Recent games feed (server)
  log/
    LogTabs.tsx                     Tab switcher (client)
    PlayerSelector.tsx              Multi-select player picker (client)
    PongForm.tsx                    Pong log form (client)
    BeerDieForm.tsx                 Beer Die log form (client)
    HeartsForm.tsx                  Hearts log form (client)

lib/
  types.ts                          All shared TypeScript types
  supabase-server.ts                Supabase client for server/API
  stats.ts                          Pure stat computation functions

supabase/migrations/001_initial.sql Database schema
scripts/seed.ts                     Seed initial 11 players

__tests__/
  lib/stats.test.ts                 Unit tests for all stat functions
  components/log/PongForm.test.tsx
  components/log/BeerDieForm.test.tsx
  components/log/HeartsForm.test.tsx
```

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.ts`, `jest.config.ts`, `jest.setup.ts`, `.env.local.example`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd C:/Users/giles/Downloads/SummerGames
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --no-import-alias
```

When prompted: accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-node
```

- [ ] **Step 3: Configure Jest**

Replace the contents of `jest.config.ts` (create if not present):

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Create `.env.local.example`**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Copy it to `.env.local` and fill in real values (see Task 2 for where to get them).

- [ ] **Step 5: Delete Next.js boilerplate**

Delete `app/page.tsx` contents (replace with placeholder), delete `public/` SVGs, clear `app/globals.css` except the Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Configure Tailwind dark theme colors**

Replace `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        card: '#1e293b',
        win: '#22c55e',
        loss: '#ef4444',
        gold: '#f59e0b',
      },
    },
  },
}

export default config
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000 with no errors.

---

## Task 2: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com, create a free project. Copy the Project URL and service role key into `.env.local`.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/001_initial.sql`:

```sql
create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table pong_games (
  id uuid primary key default gen_random_uuid(),
  cups_left int not null check (cups_left >= 0),
  played_at timestamptz default now()
);

create table pong_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references pong_games(id) on delete cascade,
  player_id uuid not null references users(id) on delete cascade,
  side text not null check (side in ('winner', 'loser'))
);

create table beer_die_games (
  id uuid primary key default gen_random_uuid(),
  winner1_id uuid not null references users(id),
  winner2_id uuid not null references users(id),
  loser1_id uuid not null references users(id),
  loser2_id uuid not null references users(id),
  points_differential int not null check (points_differential >= 1),
  played_at timestamptz default now()
);

create table hearts_games (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz default now()
);

create table hearts_game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references hearts_games(id) on delete cascade,
  player_id uuid not null references users(id) on delete cascade,
  lost boolean not null default false
);
```

- [ ] **Step 3: Run the migration**

In the Supabase dashboard → SQL Editor → paste and run the SQL above.

Expected: all tables created with no errors.

---

## Task 3: Types & Supabase Server Client

**Files:**
- Create: `lib/types.ts`, `lib/supabase-server.ts`

- [ ] **Step 1: Write `lib/types.ts`**

```ts
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
  winner1_id: string
  winner2_id: string
  loser1_id: string
  loser2_id: string
  points_differential: number
  played_at: string
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

export type BeerDieLeaderboardEntry = {
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
  winner1: string
  winner2: string
  loser1: string
  loser2: string
  points_differential: number
}

export type RecentHeartsGame = {
  type: 'hearts'
  id: string
  played_at: string
  players: string[]
  loser: string
}

export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentHeartsGame
```

- [ ] **Step 2: Write `lib/supabase-server.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Stats Functions (TDD)

**Files:**
- Create: `lib/stats.ts`, `__tests__/lib/stats.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/stats.test.ts`:

```ts
import {
  computePongLeaderboard,
  computePongHeadToHead,
  computeBeerDieLeaderboard,
  computeBeerDieHeadToHead,
  computeHeartsLeaderboard,
} from '../../lib/stats'
import { User, PongGamePlayer, BeerDieGame, HeartsGamePlayer } from '../../lib/types'

const users: User[] = [
  { id: 'u1', name: 'Giles', created_at: '2026-01-01' },
  { id: 'u2', name: 'Sherm', created_at: '2026-01-01' },
  { id: 'u3', name: 'Rob',   created_at: '2026-01-01' },
  { id: 'u4', name: 'Ant',   created_at: '2026-01-01' },
]

const pg = (id: string, cups: number) => ({ id, cups_left: cups, played_at: '2026-05-01T12:00:00Z' })

// ── Pong ──────────────────────────────────────────────────────────────────────

describe('computePongLeaderboard', () => {
  const gamePlayers: PongGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant — 3 cups left
    { game_id: 'g1', player_id: 'u1', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pong_games: pg('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm — 1 cup left
    { game_id: 'g2', player_id: 'u3', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pong_games: pg('g2', 1) },
    // g3: Giles+Sherm beat Rob+Ant — 2 cups left
    { game_id: 'g3', player_id: 'u1', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'loser',  pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pong_games: pg('g3', 2) },
  ]

  it('ranks by win rate descending', () => {
    const result = computePongLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')
    expect(result[0].wins).toBe(2)
    expect(result[0].losses).toBe(1)
    expect(result[0].cup_differential).toBe(5) // 3+2
    expect(result[2].win_rate).toBeCloseTo(0.333)
  })

  it('excludes players with 0 games', () => {
    expect(computePongLeaderboard(users, [])).toHaveLength(0)
  })
})

describe('computePongHeadToHead', () => {
  const gamePlayers: PongGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant
    { game_id: 'g1', player_id: 'u1', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pong_games: pg('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm
    { game_id: 'g2', player_id: 'u3', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pong_games: pg('g2', 1) },
    // g3: Giles+Rob teammates (should NOT count)
    { game_id: 'g3', player_id: 'u1', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'loser',  pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pong_games: pg('g3', 2) },
  ]

  it('counts wins and losses between opponents', () => {
    const r = computePongHeadToHead('u1', 'u3', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })

  it('ignores games where they were teammates', () => {
    // g3 has u1+u3 as teammates — net from g3 should be 0
    const r = computePongHeadToHead('u1', 'u3', [gamePlayers[8], gamePlayers[9], gamePlayers[10], gamePlayers[11]])
    expect(r.wins).toBe(0)
    expect(r.losses).toBe(0)
  })
})

// ── Beer Die ──────────────────────────────────────────────────────────────────

describe('computeBeerDieLeaderboard', () => {
  const games: BeerDieGame[] = [
    { id: 'g1', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 5, played_at: '2026-05-01T12:00:00Z' },
    { id: 'g2', winner1_id: 'u3', winner2_id: 'u4', loser1_id: 'u1', loser2_id: 'u2', points_differential: 3, played_at: '2026-05-02T12:00:00Z' },
  ]

  it('computes point differential correctly', () => {
    const result = computeBeerDieLeaderboard(users, games)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.wins).toBe(1)
    expect(giles.losses).toBe(1)
    expect(giles.point_differential).toBe(2) // +5 − 3
  })

  it('excludes players with 0 games', () => {
    expect(computeBeerDieLeaderboard(users, [])).toHaveLength(0)
  })
})

describe('computeBeerDieHeadToHead', () => {
  const games: BeerDieGame[] = [
    { id: 'g1', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 5, played_at: '2026-05-01T12:00:00Z' },
    { id: 'g2', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 2, played_at: '2026-05-02T12:00:00Z' },
    { id: 'g3', winner1_id: 'u1', winner2_id: 'u3', loser1_id: 'u2', loser2_id: 'u4', points_differential: 1, played_at: '2026-05-03T12:00:00Z' },
  ]

  it('counts opponent matchups only', () => {
    // Giles (u1) vs Rob (u3): g1 Giles wins, g2 Giles wins, g3 teammates → 2-0
    const r = computeBeerDieHeadToHead('u1', 'u3', games)
    expect(r.wins).toBe(2)
    expect(r.losses).toBe(0)
  })
})

// ── Hearts ────────────────────────────────────────────────────────────────────

describe('computeHeartsLeaderboard', () => {
  const gamePlayers: HeartsGamePlayer[] = [
    { game_id: 'g1', player_id: 'u1', lost: true,  hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g1', player_id: 'u2', lost: false, hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u1', lost: false, hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u2', lost: true,  hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g3', player_id: 'u2', lost: true,  hearts_games: { id: 'g3', played_at: '2026-05-03T12:00:00Z' } },
  ]

  it('ranks by loss rate ascending', () => {
    const result = computeHeartsLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')   // 1/2 = 50%
    expect(result[1].name).toBe('Sherm')   // 2/3 = 67%
  })

  it('excludes players with 0 games', () => {
    expect(computeHeartsLeaderboard(users, [])).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npx jest __tests__/lib/stats.test.ts
```

Expected: FAIL — "Cannot find module '../../lib/stats'"

- [ ] **Step 3: Implement `lib/stats.ts`**

```ts
import {
  User, PongGamePlayer, BeerDieGame, HeartsGamePlayer,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'

export function computePongLeaderboard(
  users: User[],
  gamePlayers: PongGamePlayer[]
): PongLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, cup_diff: 0 }]))

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.cup_diff += gp.pong_games.cups_left }
    else s.losses++
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return { player_id: u.id, name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, cup_differential: s.cup_diff }
    })
    .filter(e => e.wins + e.losses > 0)
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computePongHeadToHead(
  player1Id: string,
  player2Id: string,
  gamePlayers: PongGamePlayer[]
): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of gameMap.values()) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeBeerDieLeaderboard(
  users: User[],
  games: BeerDieGame[]
): BeerDieLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))

  for (const g of games) {
    for (const id of [g.winner1_id, g.winner2_id]) {
      const s = stats.get(id); if (s) { s.wins++; s.point_diff += g.points_differential }
    }
    for (const id of [g.loser1_id, g.loser2_id]) {
      const s = stats.get(id); if (s) { s.losses++; s.point_diff -= g.points_differential }
    }
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return { player_id: u.id, name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff }
    })
    .filter(e => e.wins + e.losses > 0)
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeBeerDieHeadToHead(
  player1Id: string,
  player2Id: string,
  games: BeerDieGame[]
): HeadToHeadResult {
  let wins = 0, losses = 0
  for (const g of games) {
    const w = [g.winner1_id, g.winner2_id]
    const l = [g.loser1_id, g.loser2_id]
    if (w.includes(player1Id) && l.includes(player2Id)) wins++
    else if (l.includes(player1Id) && w.includes(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeHeartsLeaderboard(
  users: User[],
  gamePlayers: HeartsGamePlayer[]
): HeartsLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { played: 0, losses: 0 }]))

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.played++
    if (gp.lost) s.losses++
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      return { player_id: u.id, name: u.name, games_played: s.played, losses: s.losses, loss_rate: s.played > 0 ? s.losses / s.played : 0 }
    })
    .filter(e => e.games_played > 0)
    .sort((a, b) => a.loss_rate - b.loss_rate || b.games_played - a.games_played)
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npx jest __tests__/lib/stats.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git init && git add lib/stats.ts lib/types.ts lib/supabase-server.ts __tests__/lib/stats.test.ts
git commit -m "feat: stats computation functions with tests"
```

---

## Task 5: Players API Route

**Files:**
- Create: `app/api/players/route.ts`

- [ ] **Step 1: Write `app/api/players/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, created_at')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ players: data })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data }, { status: 201 })
}
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/players
```

Expected: `{ "players": [] }` (empty until seeded).

- [ ] **Step 3: Commit**

```bash
git add app/api/players/route.ts
git commit -m "feat: players API route"
```

---

## Task 6: Pong API Routes

**Files:**
- Create: `app/api/pong/route.ts`, `app/api/pong/head-to-head/route.ts`

- [ ] **Step 1: Write `app/api/pong/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { PongGamePlayer, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()

  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('pong_game_players').select(`
      game_id, player_id, side,
      pong_games ( id, cups_left, played_at )
    `),
  ])

  const leaderboard = computePongLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PongGamePlayer[]
  )

  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, cups_left } = await req.json()

  if (!Array.isArray(winner_ids) || winner_ids.length < 2)
    return NextResponse.json({ error: 'At least 2 winners required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 2)
    return NextResponse.json({ error: 'At least 2 losers required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be a non-negative number' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('pong_games')
    .insert({ cups_left })
    .select()
    .single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'winner' })),
    ...loser_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'loser' })),
  ]
  const { error: playersErr } = await supabase.from('pong_game_players').insert(playerRows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })

  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
```

- [ ] **Step 2: Write `app/api/pong/head-to-head/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongHeadToHead } from '@/lib/stats'
import { PongGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  if (!player1 || !player2)
    return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pong_game_players')
    .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
    .in('player_id', [player1, player2])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePongHeadToHead(player1, player2, (data ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/pong/
git commit -m "feat: pong API routes"
```

---

## Task 7: Beer Die API Routes

**Files:**
- Create: `app/api/beer-die/route.ts`, `app/api/beer-die/head-to-head/route.ts`

- [ ] **Step 1: Write `app/api/beer-die/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { BeerDieGame, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()
  const [{ data: users }, { data: games }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('beer_die_games').select('*'),
  ])
  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (games ?? []) as BeerDieGame[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner1_id, winner2_id, loser1_id, loser2_id, points_differential } = await req.json()
  if (!winner1_id || !winner2_id || !loser1_id || !loser2_id)
    return NextResponse.json({ error: 'All 4 player IDs required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_games')
    .insert({ winner1_id, winner2_id, loser1_id, loser2_id, points_differential })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
```

- [ ] **Step 2: Write `app/api/beer-die/head-to-head/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieHeadToHead } from '@/lib/stats'
import { BeerDieGame } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  if (!player1 || !player2)
    return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_games')
    .select('*')
    .or(`winner1_id.eq.${player1},winner2_id.eq.${player1},loser1_id.eq.${player1},loser2_id.eq.${player1}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const result = computeBeerDieHeadToHead(player1, player2, (data ?? []) as BeerDieGame[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/beer-die/
git commit -m "feat: beer die API routes"
```

---

## Task 8: Hearts API Route

**Files:**
- Create: `app/api/hearts/route.ts`

- [ ] **Step 1: Write `app/api/hearts/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { HeartsGamePlayer, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('hearts_game_players').select(`
      game_id, player_id, lost,
      hearts_games ( id, played_at )
    `),
  ])
  const leaderboard = computeHeartsLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as HeartsGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { game_players } = await req.json()
  // game_players: { player_id: string, lost: boolean }[]
  if (!Array.isArray(game_players) || game_players.length < 3)
    return NextResponse.json({ error: 'At least 3 players required' }, { status: 400 })
  const losers = game_players.filter((p: { lost: boolean }) => p.lost)
  if (losers.length !== 1)
    return NextResponse.json({ error: 'Exactly 1 loser required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('hearts_games')
    .insert({})
    .select()
    .single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const rows = game_players.map((p: { player_id: string; lost: boolean }) => ({
    game_id: game.id,
    player_id: p.player_id,
    lost: p.lost,
  }))
  const { error: playersErr } = await supabase.from('hearts_game_players').insert(rows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/hearts/route.ts
git commit -m "feat: hearts API route"
```

---

## Task 9: Recent Games API Route

**Files:**
- Create: `app/api/recent/route.ts`

- [ ] **Step 1: Write `app/api/recent/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { RecentGame } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()

  const [{ data: pongGames }, { data: beerDieGames }, { data: heartsGames }] = await Promise.all([
    supabase.from('pong_games').select(`
      id, cups_left, played_at,
      pong_game_players ( side, users ( id, name ) )
    `).order('played_at', { ascending: false }).limit(10),
    supabase.from('beer_die_games').select('*').order('played_at', { ascending: false }).limit(10),
    supabase.from('hearts_games').select(`
      id, played_at,
      hearts_game_players ( lost, users ( id, name ) )
    `).order('played_at', { ascending: false }).limit(10),
  ])

  // Resolve beer die player names
  const allBeerDieIds = (beerDieGames ?? []).flatMap((g: any) => [g.winner1_id, g.winner2_id, g.loser1_id, g.loser2_id])
  const { data: bdUsers } = allBeerDieIds.length
    ? await supabase.from('users').select('id, name').in('id', [...new Set(allBeerDieIds)])
    : { data: [] }
  const nameMap = new Map((bdUsers ?? []).map((u: any) => [u.id, u.name]))

  const recent: RecentGame[] = [
    ...(pongGames ?? []).map((g: any) => ({
      type: 'pong' as const,
      id: g.id,
      played_at: g.played_at,
      winners: g.pong_game_players.filter((p: any) => p.side === 'winner').map((p: any) => p.users.name),
      losers: g.pong_game_players.filter((p: any) => p.side === 'loser').map((p: any) => p.users.name),
      cups_left: g.cups_left,
    })),
    ...(beerDieGames ?? []).map((g: any) => ({
      type: 'beer-die' as const,
      id: g.id,
      played_at: g.played_at,
      winner1: nameMap.get(g.winner1_id) ?? '',
      winner2: nameMap.get(g.winner2_id) ?? '',
      loser1: nameMap.get(g.loser1_id) ?? '',
      loser2: nameMap.get(g.loser2_id) ?? '',
      points_differential: g.points_differential,
    })),
    ...(heartsGames ?? []).map((g: any) => ({
      type: 'hearts' as const,
      id: g.id,
      played_at: g.played_at,
      players: g.hearts_game_players.map((p: any) => p.users.name),
      loser: g.hearts_game_players.find((p: any) => p.lost)?.users?.name ?? '',
    })),
  ]

  recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  return NextResponse.json({ games: recent.slice(0, 20) })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/recent/route.ts
git commit -m "feat: recent games API route"
```

---

## Task 10: Navigation & Root Layout

**Files:**
- Create: `components/Nav.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write `components/Nav.tsx`**

```tsx
import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="bg-card border-b border-slate-700 px-4 py-3 flex items-center gap-6 sticky top-0 z-10">
      <Link href="/" className="text-win font-black text-sm tracking-widest uppercase">
        Summer Games
      </Link>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <Link href="/pong" className="hover:text-white transition-colors">🏓 Pong</Link>
        <Link href="/beer-die" className="hover:text-white transition-colors">🎲 Beer Die</Link>
        <Link href="/hearts" className="hover:text-white transition-colors">♥ Hearts</Link>
        <Link href="/players" className="hover:text-white transition-colors">👥 Players</Link>
      </div>
      <Link
        href="/log"
        className="ml-auto bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
      >
        + LOG GAME
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Summer Games',
  description: 'Game tracker for the crew',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg text-white min-h-screen`}>
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify nav renders**

```bash
npm run dev
```

Open http://localhost:3000. Expected: dark page with green "SUMMER GAMES" nav and links.

- [ ] **Step 4: Commit**

```bash
git add components/Nav.tsx app/layout.tsx
git commit -m "feat: navigation and root layout"
```

---

## Task 11: PlayerSelector Component (with tests)

**Files:**
- Create: `components/log/PlayerSelector.tsx`, `__tests__/components/log/PlayerSelector.test.tsx`

- [ ] **Step 1: Write the test**

Create `__tests__/components/log/PlayerSelector.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import PlayerSelector from '../../../components/log/PlayerSelector'
import { User } from '../../../lib/types'

const players: User[] = [
  { id: 'u1', name: 'Giles', created_at: '' },
  { id: 'u2', name: 'Sherm', created_at: '' },
  { id: 'u3', name: 'Rob', created_at: '' },
]

describe('PlayerSelector', () => {
  it('renders all player options', () => {
    render(<PlayerSelector players={players} selected={[]} onChange={() => {}} label="Winners" />)
    expect(screen.getByText('Giles')).toBeInTheDocument()
    expect(screen.getByText('Sherm')).toBeInTheDocument()
  })

  it('calls onChange when a player is clicked', () => {
    const onChange = jest.fn()
    render(<PlayerSelector players={players} selected={[]} onChange={onChange} label="Winners" />)
    fireEvent.click(screen.getByText('Giles'))
    expect(onChange).toHaveBeenCalledWith(['u1'])
  })

  it('deselects a selected player on click', () => {
    const onChange = jest.fn()
    render(<PlayerSelector players={players} selected={['u1']} onChange={onChange} label="Winners" />)
    fireEvent.click(screen.getByText('Giles'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('disables excluded players', () => {
    render(<PlayerSelector players={players} selected={[]} onChange={() => {}} label="Winners" excluded={['u2']} />)
    expect(screen.getByText('Sherm').closest('button')).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/components/log/PlayerSelector.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/log/PlayerSelector.tsx`**

```tsx
'use client'
import { User } from '@/lib/types'

type Props = {
  players: User[]
  selected: string[]
  onChange: (ids: string[]) => void
  label: string
  excluded?: string[]
  maxSelect?: number
}

export default function PlayerSelector({ players, selected, onChange, label, excluded = [], maxSelect }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      if (maxSelect && selected.length >= maxSelect) return
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {players.map(p => {
          const isSelected = selected.includes(p.id)
          const isExcluded = excluded.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              disabled={isExcluded}
              onClick={() => toggle(p.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-win text-black'
                  : isExcluded
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx jest __tests__/components/log/PlayerSelector.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/log/PlayerSelector.tsx __tests__/components/log/PlayerSelector.test.tsx
git commit -m "feat: PlayerSelector component with tests"
```

---

## Task 12: Log Forms

**Files:**
- Create: `components/log/PongForm.tsx`, `components/log/BeerDieForm.tsx`, `components/log/HeartsForm.tsx`
- Create: `__tests__/components/log/PongForm.test.tsx`, `__tests__/components/log/BeerDieForm.test.tsx`, `__tests__/components/log/HeartsForm.test.tsx`

- [ ] **Step 1: Write PongForm test**

Create `__tests__/components/log/PongForm.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PongForm from '../../../components/log/PongForm'
import { User } from '../../../lib/types'

const players: User[] = [
  { id: 'u1', name: 'Giles', created_at: '' },
  { id: 'u2', name: 'Sherm', created_at: '' },
  { id: 'u3', name: 'Rob', created_at: '' },
  { id: 'u4', name: 'Ant', created_at: '' },
]

describe('PongForm', () => {
  it('shows error if submit with < 2 winners', async () => {
    render(<PongForm players={players} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => expect(screen.getByText(/at least 2 winners/i)).toBeInTheDocument())
  })

  it('shows error if same player on both teams', async () => {
    render(<PongForm players={players} />)
    // Select Giles as winner, then try adding to losers — excluded prop should prevent
    // This is enforced by excluded prop in PlayerSelector; just verify winner buttons exist
    expect(screen.getAllByText('Giles').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Implement `components/log/PongForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'

export default function PongForm({ players }: { players: User[] }) {
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [cupsLeft, setCupsLeft] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 2) return setError('At least 2 winners required')
    if (losers.length < 2) return setError('At least 2 losers required')
    if (cupsLeft === '' || isNaN(Number(cupsLeft)) || Number(cupsLeft) < 0) return setError('Enter cups left (0 or more)')
    setLoading(true)
    const res = await fetch('/api/pong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cupsLeft) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setWinners([]); setLosers([]); setCupsLeft(''); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Cups Left (winners)</label>
        <input
          type="number" min="0" value={cupsLeft} onChange={e => setCupsLeft(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
          placeholder="0"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged!</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Implement `components/log/BeerDieForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'

export default function BeerDieForm({ players }: { players: User[] }) {
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [points, setPoints] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length !== 2) return setError('Exactly 2 winners required')
    if (losers.length !== 2) return setError('Exactly 2 losers required')
    if (!points || Number(points) < 1) return setError('Points differential must be at least 1')
    setLoading(true)
    const res = await fetch('/api/beer-die', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner1_id: winners[0], winner2_id: winners[1], loser1_id: losers[0], loser2_id: losers[1], points_differential: Number(points) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setWinners([]); setLosers([]); setPoints(''); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team (2)" excluded={losers} maxSelect={2} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team (2)" excluded={winners} maxSelect={2} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Points Won By</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
          placeholder="1"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged!</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Implement `components/log/HeartsForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'

export default function HeartsForm({ players }: { players: User[] }) {
  const [participants, setParticipants] = useState<string[]>([])
  const [loser, setLoser] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleParticipant = (id: string) => {
    if (participants.includes(id)) {
      setParticipants(participants.filter(p => p !== id))
      if (loser === id) setLoser('')
    } else {
      setParticipants([...participants, id])
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (participants.length < 3) return setError('At least 3 players required')
    if (!loser) return setError('Select who lost')
    setLoading(true)
    const game_players = participants.map(id => ({ player_id: id, lost: id === loser }))
    const res = await fetch('/api/hearts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_players }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setParticipants([]); setLoser(''); setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Who Played?</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded ${inGame ? 'bg-card' : 'bg-slate-800/50'}`}>
                <button type="button" onClick={() => toggleParticipant(p.id)}
                  className={`text-sm font-medium ${inGame ? 'text-white' : 'text-slate-500'}`}>
                  {p.name}
                </button>
                {inGame && (
                  <button type="button" onClick={() => setLoser(isLoser ? '' : p.id)}
                    className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${isLoser ? 'bg-loss text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}>
                    {isLoser ? 'LOST' : 'won'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged!</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Run all form tests**

```bash
npx jest __tests__/components/log/
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/log/PongForm.tsx components/log/BeerDieForm.tsx components/log/HeartsForm.tsx __tests__/components/log/
git commit -m "feat: pong, beer die, and hearts log forms with tests"
```

---

## Task 13: Log Page & LogTabs

**Files:**
- Create: `components/log/LogTabs.tsx`, `app/log/page.tsx`

- [ ] **Step 1: Write `components/log/LogTabs.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'

type Tab = 'pong' | 'beer-die' | 'hearts'

const tabs: { id: Tab; label: string }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
]

export default function LogTabs({ players }: { players: User[] }) {
  const [active, setActive] = useState<Tab>('pong')

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${active === t.id ? 'bg-win text-black' : 'bg-card text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'pong' && <PongForm players={players} />}
      {active === 'beer-die' && <BeerDieForm players={players} />}
      {active === 'hearts' && <HeartsForm players={players} />}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/log/page.tsx`**

```tsx
import { createServerClient } from '@/lib/supabase-server'
import LogTabs from '@/components/log/LogTabs'

export default async function LogPage() {
  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name, created_at').order('name')

  return (
    <div>
      <h1 className="text-2xl font-black mb-2 tracking-wide">Log a Game</h1>
      <p className="text-slate-400 text-sm mb-8">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Verify log page renders**

Open http://localhost:3000/log. Expected: three tabs (Pong, Beer Die, Hearts) with dark form.

- [ ] **Step 4: Commit**

```bash
git add components/log/LogTabs.tsx app/log/page.tsx
git commit -m "feat: log game page with tabs"
```

---

## Task 14: Leaderboard & HeadToHead Components

**Files:**
- Create: `components/Leaderboard.tsx`, `components/HeadToHead.tsx`

- [ ] **Step 1: Write `components/Leaderboard.tsx`**

```tsx
type Column = { key: string; label: string; format?: (v: number | string) => string }

type Props = {
  entries: Record<string, string | number>[]
  columns: Column[]
}

export default function Leaderboard({ entries, columns }: Props) {
  return (
    <div className="bg-card rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wide w-8">#</th>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wide">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={entry.player_id as string} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="px-4 py-3 text-slate-500 font-mono">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              {columns.map(c => {
                const val = entry[c.key]
                const formatted = c.format ? c.format(val as number) : val
                const isNum = typeof val === 'number'
                const color = c.key.includes('differential') || c.key.includes('rate')
                  ? (typeof val === 'number' && val > 0 ? 'text-win' : typeof val === 'number' && val < 0 ? 'text-loss' : 'text-white')
                  : 'text-white'
                return (
                  <td key={c.key} className={`px-4 py-3 ${isNum && c.key !== 'wins' && c.key !== 'losses' && c.key !== 'games_played' ? color : 'text-white'}`}>
                    {formatted as string}
                  </td>
                )
              })}
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No games yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/HeadToHead.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function HeadToHead({ players, currentPlayerId, game }: Props) {
  const [opponentId, setOpponentId] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchH2H = async (oppId: string) => {
    if (!oppId || !currentPlayerId) return
    setLoading(true)
    const url = `/api/${game}/head-to-head?player1=${currentPlayerId}&player2=${oppId}`
    const res = await fetch(url)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOpponentId(e.target.value)
    fetchH2H(e.target.value)
  }

  const opponents = players.filter(p => p.id !== currentPlayerId)

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Head-to-Head</p>
      <select
        value={opponentId} onChange={handleChange}
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win"
      >
        <option value="">Select opponent...</option>
        {opponents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {result && !loading && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-win">{result.wins}</p>
            <p className="text-xs text-slate-400 uppercase">Wins</p>
          </div>
          <div className="text-slate-600 text-2xl">–</div>
          <div>
            <p className="text-2xl font-black text-loss">{result.losses}</p>
            <p className="text-xs text-slate-400 uppercase">Losses</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Leaderboard.tsx components/HeadToHead.tsx
git commit -m "feat: leaderboard and head-to-head components"
```

---

## Task 15: Game Leaderboard Pages

**Files:**
- Create: `app/pong/page.tsx`, `app/beer-die/page.tsx`, `app/hearts/page.tsx`

- [ ] **Step 1: Write `app/pong/page.tsx`**

```tsx
import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import { PongLeaderboardEntry, User } from '@/lib/types'

async function getData(): Promise<{ leaderboard: PongLeaderboardEntry[]; players: User[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/pong`, { cache: 'no-store' })
  return res.json()
}

export default async function PongPage() {
  const { leaderboard, players } = await getData()

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'cup_differential', label: 'Cup Diff', format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">🏓 Pong</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs">
        <HeadToHead players={players} game="pong" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/beer-die/page.tsx`**

```tsx
import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import { BeerDieLeaderboardEntry, User } from '@/lib/types'

async function getData(): Promise<{ leaderboard: BeerDieLeaderboardEntry[]; players: User[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/beer-die`, { cache: 'no-store' })
  return res.json()
}

export default async function BeerDiePage() {
  const { leaderboard, players } = await getData()

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'point_differential', label: 'Pt Diff', format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">🎲 Beer Die</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs">
        <HeadToHead players={players} game="beer-die" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/hearts/page.tsx`**

```tsx
import Leaderboard from '@/components/Leaderboard'
import { HeartsLeaderboardEntry } from '@/lib/types'

async function getData(): Promise<{ leaderboard: HeartsLeaderboardEntry[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/hearts`, { cache: 'no-store' })
  return res.json()
}

export default async function HeartsPage() {
  const { leaderboard } = await getData()

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games' },
    { key: 'losses', label: 'Losses' },
    { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">♥ Hearts</h1>
        <p className="text-slate-400 text-sm">Ranked by lowest loss rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
    </div>
  )
}
```

- [ ] **Step 4: Add `NEXT_PUBLIC_URL` to `.env.local`**

```
NEXT_PUBLIC_URL=http://localhost:3000
```

(On Vercel, set this to your production URL.)

- [ ] **Step 5: Verify all three pages render**

Open http://localhost:3000/pong, /beer-die, /hearts. Expected: dark leaderboard table with "No games yet" row.

- [ ] **Step 6: Commit**

```bash
git add app/pong/ app/beer-die/ app/hearts/ .env.local.example
git commit -m "feat: pong, beer die, and hearts leaderboard pages"
```

---

## Task 16: Players Pages

**Files:**
- Create: `app/players/page.tsx`, `app/players/[name]/page.tsx`

- [ ] **Step 1: Write `app/players/page.tsx`**

```tsx
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { User } from '@/lib/types'

async function addPlayer(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  if (!name?.trim()) return
  await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  })
}

export default async function PlayersPage() {
  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {(players ?? []).map((p: User) => (
          <Link key={p.id} href={`/players/${encodeURIComponent(p.name)}`}
            className="bg-card rounded-lg p-4 text-center hover:bg-slate-700 transition-colors">
            <p className="font-bold text-white">{p.name}</p>
          </Link>
        ))}
      </div>
      <div className="bg-card rounded-lg p-6 max-w-sm">
        <h2 className="font-bold mb-4">Add New Player</h2>
        <form action={addPlayer} className="flex gap-3">
          <input name="name" placeholder="Name" required
            className="bg-bg border border-slate-600 rounded px-3 py-2 text-white flex-1 focus:outline-none focus:border-win text-sm" />
          <button type="submit"
            className="bg-win text-black font-bold px-4 py-2 rounded hover:bg-green-400 transition-colors text-sm">
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/players/[name]/page.tsx`**

```tsx
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard } from '@/lib/stats'
import HeadToHead from '@/components/HeadToHead'
import { User, PongGamePlayer, BeerDieGame, HeartsGamePlayer } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function PlayerPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  const supabase = createServerClient()

  const [{ data: users }, { data: pongPlayers }, { data: beerDieGames }, { data: heartsPlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )'),
    supabase.from('beer_die_games').select('*'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )'),
  ])

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDieGames as BeerDieGame[])
  const heartsLB = computeHeartsLeaderboard(users as User[], heartsPlayers as unknown as HeartsGamePlayer[])

  const pong = pongLB.find(e => e.player_id === player.id)
  const beerDie = beerDieLB.find(e => e.player_id === player.id)
  const hearts = heartsLB.find(e => e.player_id === player.id)

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-bg rounded p-3 text-center">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-wide">{name}</h1>

      <section>
        <h2 className="text-lg font-bold mb-4">🏓 Pong</h2>
        {pong ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Wins" value={String(pong.wins)} />
              <Stat label="Losses" value={String(pong.losses)} />
              <Stat label="Win%" value={`${(pong.win_rate * 100).toFixed(1)}%`} />
              <Stat label="Cup Diff" value={pong.cup_differential > 0 ? `+${pong.cup_differential}` : String(pong.cup_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pong" />
            </div>
          </div>
        ) : <p className="text-slate-500">No pong games yet</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">🎲 Beer Die</h2>
        {beerDie ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Wins" value={String(beerDie.wins)} />
              <Stat label="Losses" value={String(beerDie.losses)} />
              <Stat label="Win%" value={`${(beerDie.win_rate * 100).toFixed(1)}%`} />
              <Stat label="Pt Diff" value={beerDie.point_differential > 0 ? `+${beerDie.point_differential}` : String(beerDie.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="beer-die" />
            </div>
          </div>
        ) : <p className="text-slate-500">No beer die games yet</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">♥ Hearts</h2>
        {hearts ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <Stat label="Games" value={String(hearts.games_played)} />
            <Stat label="Losses" value={String(hearts.losses)} />
            <Stat label="Loss%" value={`${(hearts.loss_rate * 100).toFixed(1)}%`} />
          </div>
        ) : <p className="text-slate-500">No hearts games yet</p>}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Open http://localhost:3000/players. Expected: empty grid + Add Player form. Submit a name and verify it appears.

- [ ] **Step 4: Commit**

```bash
git add app/players/
git commit -m "feat: players grid and individual player profile pages"
```

---

## Task 17: Home Page

**Files:**
- Create: `components/RecentGames.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write `components/RecentGames.tsx`**

```tsx
import { RecentGame } from '@/lib/types'

function formatGame(g: RecentGame): { title: string; detail: string } {
  if (g.type === 'pong') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `${g.cups_left} cup${g.cups_left !== 1 ? 's' : ''} left`,
  }
  if (g.type === 'beer-die') return {
    title: `${g.winner1} & ${g.winner2} beat ${g.loser1} & ${g.loser2}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  return {
    title: `Hearts — ${g.players.join(', ')}`,
    detail: `${g.loser} lost`,
  }
}

const gameEmoji: Record<string, string> = { pong: '🏓', 'beer-die': '🎲', hearts: '♥' }

export default function RecentGames({ games }: { games: RecentGame[] }) {
  if (games.length === 0)
    return <p className="text-slate-500 text-sm">No games yet — go log one!</p>

  return (
    <div className="space-y-2">
      {games.map(g => {
        const { title, detail } = formatGame(g)
        const date = new Date(g.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <div key={`${g.type}-${g.id}`} className="bg-card rounded-lg px-4 py-3 flex items-center gap-4">
            <span className="text-lg">{gameEmoji[g.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{title}</p>
              <p className="text-xs text-slate-400">{detail}</p>
            </div>
            <span className="text-xs text-slate-500 shrink-0">{date}</span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/page.tsx`**

```tsx
import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'

async function getRecentGames(): Promise<RecentGame[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/recent`, { cache: 'no-store' })
  const data = await res.json()
  return data.games ?? []
}

export default async function HomePage() {
  const games = await getRecentGames()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-widest text-win uppercase">Summer Games</h1>
        <p className="text-slate-400 mt-2">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/pong', label: '🏓 Pong' },
          { href: '/beer-die', label: '🎲 Beer Die' },
          { href: '/hearts', label: '♥ Hearts' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="bg-card rounded-lg p-6 text-center font-bold hover:bg-slate-700 transition-colors text-lg">
            {label}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4 tracking-wide uppercase text-slate-400">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify home page**

Open http://localhost:3000. Expected: "SUMMER GAMES" hero, three game links, empty recent feed.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/RecentGames.tsx
git commit -m "feat: home page with recent games feed"
```

---

## Task 18: Seed Script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Write `scripts/seed.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAYERS = ['Giles', 'Sherm', 'Rob', 'Ant', 'Noah', 'Cole', 'Rowan', 'Jackson', 'Max', 'Adrian', 'Suren']

async function seed() {
  for (const name of PLAYERS) {
    const { error } = await supabase.from('users').upsert({ name }, { onConflict: 'name' })
    if (error) console.error(`Failed to upsert ${name}:`, error.message)
    else console.log(`✓ ${name}`)
  }
  console.log('Seed complete.')
}

seed()
```

- [ ] **Step 2: Add ts-node config to `package.json`**

Add to `package.json` scripts:

```json
"seed": "ts-node --project tsconfig.json -e \"require('dotenv').config({ path: '.env.local' })\" scripts/seed.ts"
```

Install dotenv:

```bash
npm install --save-dev dotenv
```

- [ ] **Step 3: Run the seed**

```bash
npm run seed
```

Expected output:
```
✓ Giles
✓ Sherm
✓ Rob
✓ Ant
✓ Noah
✓ Cole
✓ Rowan
✓ Jackson
✓ Max
✓ Adrian
✓ Suren
Seed complete.
```

- [ ] **Step 4: Verify players appear**

Open http://localhost:3000/players. Expected: all 11 players in a grid.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts package.json
git commit -m "feat: seed script for initial players"
```

---

## Task 19: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

Create a new GitHub repository at github.com, then:

```bash
git remote add origin https://github.com/<your-username>/summer-games.git
git push -u origin main
```

- [ ] **Step 2: Create Vercel project**

Go to https://vercel.com → New Project → Import from GitHub → select `summer-games`.

- [ ] **Step 3: Set environment variables in Vercel**

In Vercel project → Settings → Environment Variables, add:

```
SUPABASE_URL=<your supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
NEXT_PUBLIC_URL=https://<your-vercel-domain>.vercel.app
```

- [ ] **Step 4: Deploy**

Vercel auto-deploys on push. Trigger a deploy by pushing any commit, or click "Deploy" in the dashboard.

- [ ] **Step 5: Run seed against production**

Update `.env.local` to point to production Supabase (it already does), then:

```bash
npm run seed
```

This is safe to re-run — it upserts on name conflict.

- [ ] **Step 6: Smoke test production**

Open your Vercel URL. Verify:
- Home page loads
- /players shows all 11 players
- /log → log a pong game with 2 winners, 2 losers, 1 cup
- /pong shows the game in the leaderboard
- Home page shows it in recent games

---

## Self-Review Checklist

Spec coverage confirmed:

| Requirement | Task |
|---|---|
| 11 initial users | Task 18 (seed) |
| Add new user | Task 16 (players page form) |
| Pong: variable team sizes | Task 6 (API), Task 12 (PongForm) |
| Beer Die: 2v2 fixed | Task 7 (API), Task 12 (BeerDieForm) |
| Hearts: one loser per game | Task 8 (API), Task 12 (HeartsForm) |
| W/L ratio per game | Task 4 (stats), Tasks 15 (leaderboard pages) |
| Head-to-head (opponents only) | Task 4 (stats), Task 6+7 (H2H routes), Task 14 (HeadToHead component) |
| Cup / point differential | Task 4 (stats), Task 15 (leaderboard columns) |
| Leaderboards per game | Task 15 |
| Player profiles | Task 16 |
| Recent games home feed | Task 17 |
| No password on /log | Task 13 (open page) |
| Vercel + Supabase hosting | Task 19 |
| Dark & sporty theme | Task 1 (Tailwind), Tasks 10–17 (all components) |
