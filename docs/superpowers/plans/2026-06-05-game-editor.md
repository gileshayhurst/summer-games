# Game Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-gated `/admin` page where any logged game (Pong, Beer Die, Hearts) can be edited or deleted.

**Architecture:** Three new dynamic API routes (PUT+DELETE per game type) + one server-component admin page + one client-component AdminPanel + three inline edit-form components. Password "1111" is checked client-side; session stored in `sessionStorage`. After any mutation, the page reloads via `window.location.reload()`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase JS client, Tailwind CSS, existing `PlayerSelector` component

---

## File Map

| Action | File |
|--------|------|
| Create | `app/api/pong/[id]/route.ts` |
| Create | `app/api/beer-die/[id]/route.ts` |
| Create | `app/api/hearts/[id]/route.ts` |
| Create | `app/admin/page.tsx` |
| Create | `components/admin/AdminPanel.tsx` |
| Create | `components/admin/EditPongGame.tsx` |
| Create | `components/admin/EditBeerDieGame.tsx` |
| Create | `components/admin/EditHeartsGame.tsx` |

---

## Task 1: Pong PUT + DELETE API route

**Files:**
- Create: `app/api/pong/[id]/route.ts`

- [ ] **Step 1: Create `app/api/pong/[id]/route.ts` with this exact content:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, cups_left } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be >= 0' }, { status: 400 })

  const supabase = createServerClient()

  const { error: updateErr } = await supabase
    .from('pong_games')
    .update({ cups_left })
    .eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('pong_game_players')
    .delete()
    .eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner' })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser' })),
  ]
  const { error: insertErr } = await supabase.from('pong_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('pong_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/pong/[id]/route.ts
git commit -m "feat: add PUT and DELETE handlers for pong games"
```

---

## Task 2: Beer Die PUT + DELETE API route

**Files:**
- Create: `app/api/beer-die/[id]/route.ts`

- [ ] **Step 1: Create `app/api/beer-die/[id]/route.ts` with this exact content:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner1_id, winner2_id, loser1_id, loser2_id, points_differential } = await req.json()
  if (!winner1_id || !winner2_id || !loser1_id || !loser2_id)
    return NextResponse.json({ error: 'All 4 player IDs required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from('beer_die_games')
    .update({ winner1_id, winner2_id, loser1_id, loser2_id, points_differential })
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('beer_die_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/beer-die/[id]/route.ts"
git commit -m "feat: add PUT and DELETE handlers for beer die games"
```

---

## Task 3: Hearts PUT + DELETE API route

**Files:**
- Create: `app/api/hearts/[id]/route.ts`

- [ ] **Step 1: Create `app/api/hearts/[id]/route.ts` with this exact content:**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { game_players } = await req.json()
  if (!Array.isArray(game_players) || game_players.length < 3)
    return NextResponse.json({ error: 'At least 3 players required' }, { status: 400 })
  const losers = game_players.filter((p: { lost: boolean }) => p.lost)
  if (losers.length !== 1)
    return NextResponse.json({ error: 'Exactly 1 loser required' }, { status: 400 })

  const supabase = createServerClient()

  const { error: deleteErr } = await supabase
    .from('hearts_game_players')
    .delete()
    .eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const rows = game_players.map((p: { player_id: string; lost: boolean }) => ({
    game_id: params.id,
    player_id: p.player_id,
    lost: p.lost,
  }))
  const { error: insertErr } = await supabase.from('hearts_game_players').insert(rows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('hearts_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/api/hearts/[id]/route.ts"
git commit -m "feat: add PUT and DELETE handlers for hearts games"
```

---

## Task 4: Admin page server component

**Files:**
- Create: `app/admin/page.tsx`

This is a server component that fetches all games and users and passes them to `<AdminPanel>`. Note that `pong_game_players` does NOT join `pong_games` here — we fetch `pong_games` and `pong_game_players` separately, then build the structured data in the server component.

- [ ] **Step 1: Create `app/admin/page.tsx` with this exact content:**

```tsx
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
  winner1_id: string
  winner2_id: string
  loser1_id: string
  loser2_id: string
  points_differential: number
  played_at: string
}

export type AdminHeartsGame = {
  id: string
  played_at: string
  game_players: { player_id: string; lost: boolean }[]
}

async function getData() {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGamesRaw },
      { data: pongPlayers },
      { data: beerDieGames },
      { data: heartsGamesRaw },
      { data: heartsPlayers },
      { data: users },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at').order('played_at', { ascending: false }),
      supabase.from('pong_game_players').select('game_id, player_id, side'),
      supabase.from('beer_die_games').select('id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_games').select('id, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_game_players').select('game_id, player_id, lost'),
      supabase.from('users').select('id, name, created_at').order('name'),
    ])

    const pongGames: AdminPongGame[] = (pongGamesRaw ?? []).map((g: any) => {
      const gamePlayers = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return {
        id: g.id,
        cups_left: g.cups_left,
        played_at: g.played_at,
        winner_ids: gamePlayers.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
        loser_ids: gamePlayers.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id),
      }
    })

    const heartsGames: AdminHeartsGame[] = (heartsGamesRaw ?? []).map((g: any) => ({
      id: g.id,
      played_at: g.played_at,
      game_players: (heartsPlayers ?? [])
        .filter((p: any) => p.game_id === g.id)
        .map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

    return {
      pongGames,
      beerDieGames: (beerDieGames ?? []) as AdminBeerDieGame[],
      heartsGames,
      players: (users ?? []) as User[],
    }
  } catch {
    return { pongGames: [], beerDieGames: [], heartsGames: [], players: [] }
  }
}

export default async function AdminPage() {
  const { pongGames, beerDieGames, heartsGames, players } = await getData()
  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-1">⚙️ Admin</h1>
      <p className="text-slate-400 text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={pongGames}
        beerDieGames={beerDieGames}
        heartsGames={heartsGames}
        players={players}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin page server component"
```

---

## Task 5: EditPongGame component

**Files:**
- Create: `components/admin/EditPongGame.tsx`

Uses the existing `PlayerSelector` component at `@/components/log/PlayerSelector`.

- [ ] **Step 1: Create `components/admin/EditPongGame.tsx` with this exact content:**

```tsx
'use client'
import { useState } from 'react'
import PlayerSelector from '@/components/log/PlayerSelector'
import { User } from '@/lib/types'
import { AdminPongGame } from '@/app/admin/page'

type Props = {
  game: AdminPongGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditPongGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [cupsLeft, setCupsLeft] = useState(String(game.cups_left))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('Select at least 1 winner')
    if (losers.length < 1) return setError('Select at least 1 loser')
    if (cupsLeft === '' || isNaN(Number(cupsLeft)) || Number(cupsLeft) < 0)
      return setError('Enter cups left (0 or more)')
    setLoading(true)
    const res = await fetch(`/api/pong/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cupsLeft) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-4">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Cups Left</label>
        <input
          type="number" min="0" value={cupsLeft} onChange={e => setCupsLeft(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-black font-bold px-4 py-1.5 rounded text-sm hover:bg-green-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-slate-700 text-slate-300 font-bold px-4 py-1.5 rounded text-sm hover:bg-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/EditPongGame.tsx
git commit -m "feat: add EditPongGame inline edit form"
```

---

## Task 6: EditBeerDieGame component

**Files:**
- Create: `components/admin/EditBeerDieGame.tsx`

Four individual player `<select>` dropdowns (not PlayerSelector — Beer Die always has exactly 2 winners + 2 losers).

- [ ] **Step 1: Create `components/admin/EditBeerDieGame.tsx` with this exact content:**

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminBeerDieGame } from '@/app/admin/page'

type Props = {
  game: AdminBeerDieGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditBeerDieGame({ game, players, onSave, onCancel }: Props) {
  const [winner1, setWinner1] = useState(game.winner1_id)
  const [winner2, setWinner2] = useState(game.winner2_id)
  const [loser1, setLoser1] = useState(game.loser1_id)
  const [loser2, setLoser2] = useState(game.loser2_id)
  const [points, setPoints] = useState(String(game.points_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectClass = "bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-win"

  const save = async () => {
    setError('')
    if (!winner1 || !winner2 || !loser1 || !loser2) return setError('All 4 players required')
    const ids = [winner1, winner2, loser1, loser2]
    if (new Set(ids).size !== 4) return setError('All 4 players must be different')
    if (!points || Number(points) < 1) return setError('Points must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/beer-die/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner1_id: winner1, winner2_id: winner2, loser1_id: loser1, loser2_id: loser2, points_differential: Number(points) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  const playerOptions = players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Winner 1</label>
          <select value={winner1} onChange={e => setWinner1(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Winner 2</label>
          <select value={winner2} onChange={e => setWinner2(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Loser 1</label>
          <select value={loser1} onChange={e => setLoser1(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Loser 2</label>
          <select value={loser2} onChange={e => setLoser2(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Points Differential</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-black font-bold px-4 py-1.5 rounded text-sm hover:bg-green-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-slate-700 text-slate-300 font-bold px-4 py-1.5 rounded text-sm hover:bg-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/EditBeerDieGame.tsx
git commit -m "feat: add EditBeerDieGame inline edit form"
```

---

## Task 7: EditHeartsGame component

**Files:**
- Create: `components/admin/EditHeartsGame.tsx`

- [ ] **Step 1: Create `components/admin/EditHeartsGame.tsx` with this exact content:**

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminHeartsGame } from '@/app/admin/page'

type Props = {
  game: AdminHeartsGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditHeartsGame({ game, players, onSave, onCancel }: Props) {
  const [participants, setParticipants] = useState<string[]>(
    game.game_players.map(p => p.player_id)
  )
  const [loser, setLoser] = useState<string>(
    game.game_players.find(p => p.lost)?.player_id ?? ''
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleParticipant = (id: string) => {
    if (participants.includes(id)) {
      setParticipants(participants.filter(p => p !== id))
      if (loser === id) setLoser('')
    } else {
      setParticipants([...participants, id])
    }
  }

  const save = async () => {
    setError('')
    if (participants.length < 3) return setError('At least 3 players required')
    if (!loser) return setError('Select who lost')
    setLoading(true)
    const game_players = participants.map(id => ({ player_id: id, lost: id === loser }))
    const res = await fetch(`/api/hearts/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_players }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-3">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Players (click to toggle)</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${inGame ? 'bg-card' : 'bg-slate-900/50'}`}>
                <button type="button" onClick={() => toggleParticipant(p.id)}
                  className={`text-sm font-medium text-left ${inGame ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
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
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-black font-bold px-4 py-1.5 rounded text-sm hover:bg-green-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-slate-700 text-slate-300 font-bold px-4 py-1.5 rounded text-sm hover:bg-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/EditHeartsGame.tsx
git commit -m "feat: add EditHeartsGame inline edit form"
```

---

## Task 8: AdminPanel client component

**Files:**
- Create: `components/admin/AdminPanel.tsx`

This is the main client component. It renders the PIN gate and, once authenticated, the full chronological game list with Edit/Delete actions. It imports the three edit-form components from the same directory.

- [ ] **Step 1: Create `components/admin/AdminPanel.tsx` with this exact content:**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminHeartsGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditHeartsGame from './EditHeartsGame'

const ADMIN_PASSWORD = '1111'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  heartsGames: AdminHeartsGame[]
  players: User[]
}

export default function AdminPanel({ pongGames, beerDieGames, heartsGames, players }: Props) {
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
    if (pin === ADMIN_PASSWORD) {
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
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    const endpoint = kind === 'pong' ? `/api/pong/${id}` : kind === 'beer-die' ? `/api/beer-die/${id}` : `/api/hearts/${id}`
    await fetch(endpoint, { method: 'DELETE' })
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
      return `${name(d.winner1_id)} & ${name(d.winner2_id)} def. ${name(d.loser1_id)} & ${name(d.loser2_id)} +${d.points_differential}`
    }
    const d = g.data as AdminHeartsGame
    const loserName = name(d.game_players.find(p => p.lost)?.player_id ?? '')
    const others = d.game_players.filter(p => !p.lost).map(p => name(p.player_id)).join(', ')
    return `${others} — ${loserName} lost`
  }

  const badgeColor = (kind: string) =>
    kind === 'pong' ? 'bg-blue-900 text-blue-300' : kind === 'beer-die' ? 'bg-yellow-900 text-yellow-300' : 'bg-pink-900 text-pink-300'

  if (!authed) {
    return (
      <form onSubmit={handlePinSubmit} className="max-w-xs space-y-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Enter PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false) }}
            className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-win"
            placeholder="••••"
            autoFocus
          />
        </div>
        {pinError && <p className="text-loss text-sm">Incorrect PIN</p>}
        <button type="submit"
          className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 transition-colors">
          Unlock
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      {allGames.length === 0 && <p className="text-slate-500 text-sm">No games logged yet.</p>}
      {allGames.map(g => {
        const id = g.data.id
        const isEditing = editingId === id
        const isConfirmingDelete = confirmDeleteId === id

        return (
          <div key={id} className="bg-card rounded-lg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${badgeColor(g.kind)}`}>
                  {g.kind === 'pong' ? 'PONG' : g.kind === 'beer-die' ? 'DIE' : 'HEARTS'}
                </span>
                <span className="text-sm text-slate-300 truncate">{gameSummary(g)}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatDate(g.played_at)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isConfirmingDelete && (
                  <>
                    <button
                      onClick={() => setEditingId(isEditing ? null : id)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      {isEditing ? 'Close' : '✏️ Edit'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(id)}
                      className="text-xs text-slate-400 hover:text-loss px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
                {isConfirmingDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sure?</span>
                    <button
                      onClick={() => handleDelete(g.kind, id)}
                      disabled={deleteLoading}
                      className="text-xs font-bold bg-loss text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && g.kind === 'pong' && (
              <EditPongGame
                game={g.data as AdminPongGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
            {isEditing && g.kind === 'beer-die' && (
              <EditBeerDieGame
                game={g.data as AdminBeerDieGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
            {isEditing && g.kind === 'hearts' && (
              <EditHeartsGame
                game={g.data as AdminHeartsGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/AdminPanel.tsx
git commit -m "feat: add AdminPanel client component with PIN gate, edit, and delete"
```

---

## Task 9: Final push to deploy

- [ ] **Step 1: Push all commits to GitHub to trigger Vercel deploy**

```bash
git push origin master
```

Expected: Vercel auto-deploys. After ~1-2 minutes, navigating to `/admin` on the live site shows a PIN input. Entering `1111` reveals the game list.
