# Record With Teammate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Record With" widget below the existing "Head-to-Head Against" section on the Pong and Beer Die leaderboard pages, showing two players' combined win/loss record when on the same team.

**Architecture:** Mirror the existing head-to-head pattern exactly — new stat functions in `lib/stats.ts`, new API routes under `/api/{game}/record-with`, and a new `PartnerRecord` client component that queries those routes. No new Supabase tables or types needed.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase JS client, Tailwind CSS

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `lib/stats.ts` | Add `computePongPartnerRecord` and `computeBeerDiePartnerRecord` |
| Create | `app/api/pong/record-with/route.ts` | GET endpoint for pong partner record |
| Create | `app/api/beer-die/record-with/route.ts` | GET endpoint for beer die partner record |
| Create | `components/PartnerRecord.tsx` | Client component — dropdowns + result display |
| Modify | `app/pong/page.tsx` | Import and render `<PartnerRecord>` below `<HeadToHead>` |
| Modify | `app/beer-die/page.tsx` | Import and render `<PartnerRecord>` below `<HeadToHead>` |

---

## Task 1: Add partner-record stat functions to `lib/stats.ts`

**Files:**
- Modify: `lib/stats.ts`

The existing file already imports `PongGamePlayer`, `BeerDieGame`, and `HeadToHeadResult` — no import changes needed.

- [ ] **Step 1: Open `lib/stats.ts` and append the two new functions at the bottom of the file (after `computeHeartsLeaderboard`).**

Add exactly this code at the end of the file:

```ts
export function computePongPartnerRecord(
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
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeBeerDiePartnerRecord(
  player1Id: string,
  player2Id: string,
  games: BeerDieGame[]
): HeadToHeadResult {
  let wins = 0, losses = 0
  for (const g of games) {
    const w = [g.winner1_id, g.winner2_id]
    const l = [g.loser1_id, g.loser2_id]
    if (w.includes(player1Id) && w.includes(player2Id)) wins++
    else if (l.includes(player1Id) && l.includes(player2Id)) losses++
  }
  return { wins, losses }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/stats.ts
git commit -m "feat: add computePongPartnerRecord and computeBeerDiePartnerRecord stat functions"
```

---

## Task 2: Create pong record-with API route

**Files:**
- Create: `app/api/pong/record-with/route.ts`

- [ ] **Step 1: Create the file `app/api/pong/record-with/route.ts` with this exact content:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongPartnerRecord } from '@/lib/stats'
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

  const result = computePongPartnerRecord(player1, player2, (data ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/pong/record-with/route.ts
git commit -m "feat: add pong record-with API route"
```

---

## Task 3: Create beer-die record-with API route

**Files:**
- Create: `app/api/beer-die/record-with/route.ts`

- [ ] **Step 1: Create the file `app/api/beer-die/record-with/route.ts` with this exact content:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDiePartnerRecord } from '@/lib/stats'
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
    .select('id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential, played_at')
    .or(`winner1_id.eq.${player1},winner2_id.eq.${player1},loser1_id.eq.${player1},loser2_id.eq.${player1}`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeBeerDiePartnerRecord(player1, player2, (data ?? []) as BeerDieGame[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/beer-die/record-with/route.ts
git commit -m "feat: add beer-die record-with API route"
```

---

## Task 4: Create the PartnerRecord component

**Files:**
- Create: `components/PartnerRecord.tsx`

This component is structurally identical to `components/HeadToHead.tsx`. The differences are:
- Title: **"Record With"** (not "Head-to-Head")
- Teammate dropdown placeholder: **"Select teammate..."** (not "Select opponent...")
- API endpoint: `/api/{game}/record-with` (not `/api/{game}/head-to-head`)
- Result label: **"Wins together / Losses together"** when no `currentPlayerId`; **"Wins / Losses"** when `currentPlayerId` is set

- [ ] **Step 1: Create the file `components/PartnerRecord.tsx` with this exact content:**

```tsx
'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function PartnerRecord({ players, currentPlayerId, game }: Props) {
  const [player1Id, setPlayer1Id] = useState(currentPlayerId ?? '')
  const [player2Id, setPlayer2Id] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRecord = async (p1: string, p2: string) => {
    if (!p1 || !p2 || p1 === p2) { setResult(null); return }
    setLoading(true)
    const res = await fetch(`/api/${game}/record-with?player1=${p1}&player2=${p2}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handlePlayer1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer1Id(e.target.value)
    setResult(null)
    fetchRecord(e.target.value, player2Id)
  }

  const handlePlayer2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer2Id(e.target.value)
    setResult(null)
    fetchRecord(player1Id, e.target.value)
  }

  const player1Name = players.find(p => p.id === player1Id)?.name ?? ''

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Record With</p>

      {!currentPlayerId && (
        <select
          value={player1Id}
          onChange={handlePlayer1Change}
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-2 focus:outline-none focus:border-win"
        >
          <option value="">Select player...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <select
        value={player2Id}
        onChange={handlePlayer2Change}
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win"
      >
        <option value="">{currentPlayerId ? 'Select teammate...' : 'with teammate...'}</option>
        {players
          .filter(p => p.id !== player1Id)
          .map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </select>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {result && !loading && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-win">{result.wins}</p>
            <p className="text-xs text-slate-400 uppercase">{currentPlayerId ? 'Wins' : `${player1Name} Wins`}</p>
          </div>
          <div className="text-slate-600 text-2xl self-center">–</div>
          <div>
            <p className="text-2xl font-black text-loss">{result.losses}</p>
            <p className="text-xs text-slate-400 uppercase">{currentPlayerId ? 'Losses' : `${player1Name} Losses`}</p>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PartnerRecord.tsx
git commit -m "feat: add PartnerRecord client component"
```

---

## Task 5: Wire PartnerRecord into the Pong leaderboard page

**Files:**
- Modify: `app/pong/page.tsx`

The current file renders `<HeadToHead players={players} game="pong" />` inside a `<div className="max-w-xs">`. Add `<PartnerRecord>` directly below it inside the same wrapper div.

- [ ] **Step 1: Read the current `app/pong/page.tsx` to get the exact content before editing.**

- [ ] **Step 2: Add the `PartnerRecord` import at the top of the file, alongside the existing `HeadToHead` import:**

Find this line:
```ts
import HeadToHead from '@/components/HeadToHead'
```
Replace with:
```ts
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
```

- [ ] **Step 3: Add `<PartnerRecord>` directly below `<HeadToHead>` in the JSX.**

Find this block:
```tsx
      <div className="max-w-xs">
        <HeadToHead players={players} game="pong" />
      </div>
```
Replace with:
```tsx
      <div className="max-w-xs space-y-4">
        <HeadToHead players={players} game="pong" />
        <PartnerRecord players={players} game="pong" />
      </div>
```

- [ ] **Step 4: Commit**

```bash
git add app/pong/page.tsx
git commit -m "feat: add PartnerRecord widget to pong leaderboard page"
```

---

## Task 6: Wire PartnerRecord into the Beer Die leaderboard page

**Files:**
- Modify: `app/beer-die/page.tsx`

The current file renders `<HeadToHead players={players} game="beer-die" />` inside a `<div className="max-w-xs">`. Add `<PartnerRecord>` directly below it.

- [ ] **Step 1: Read the current `app/beer-die/page.tsx` to get the exact content before editing.**

- [ ] **Step 2: Add the `PartnerRecord` import at the top of the file, alongside the existing `HeadToHead` import:**

Find this line:
```ts
import HeadToHead from '@/components/HeadToHead'
```
Replace with:
```ts
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
```

- [ ] **Step 3: Add `<PartnerRecord>` directly below `<HeadToHead>` in the JSX.**

Find this block:
```tsx
      <div className="max-w-xs">
        <HeadToHead players={players} game="beer-die" />
      </div>
```
Replace with:
```tsx
      <div className="max-w-xs space-y-4">
        <HeadToHead players={players} game="beer-die" />
        <PartnerRecord players={players} game="beer-die" />
      </div>
```

- [ ] **Step 4: Final push to trigger Vercel deploy**

```bash
git add app/beer-die/page.tsx
git commit -m "feat: add PartnerRecord widget to beer-die leaderboard page"
git push origin master
```

Expected: Vercel auto-deploys. After ~1-2 minutes the live site shows "Record With" below "Head-to-Head" on both the Pong and Beer Die pages.
