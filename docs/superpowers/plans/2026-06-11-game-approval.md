# Game Approval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-approval gate so logged games are held as pending until the group admin approves them, preventing griefing on a public site.

**Architecture:** Add `approved boolean DEFAULT false` to the three game tables and backfill existing rows to `true`. All read (GET) routes filter to `approved = true`. Three new `PATCH` endpoints flip a game to approved. The admin panel gains a Pending section above the game list. The log page gets an info banner explaining the review process.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS

---

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migration-approval.sql`

- [ ] **Create the migration file**

```sql
-- Add approved column to game tables (default false = pending)
ALTER TABLE pong_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE beer_die_games ADD COLUMN approved boolean NOT NULL DEFAULT false;
ALTER TABLE hearts_games ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Backfill: all existing games are already legitimate, mark them approved
UPDATE pong_games SET approved = true;
UPDATE beer_die_games SET approved = true;
UPDATE hearts_games SET approved = true;
```

- [ ] **Commit**

```
git add supabase/migration-approval.sql
git commit -m "feat: add migration SQL for game approval column"
```

> **MANUAL STEP (user action required):** Run this file in the Supabase SQL editor before testing any other task.

---

### Task 2: Filter leaderboard GET routes by approved

**Files:**
- Modify: `app/api/pong/route.ts`
- Modify: `app/api/beer-die/route.ts`
- Modify: `app/api/hearts/route.ts`

The leaderboard routes query via the junction tables (`pong_game_players`, etc.) which join to the game tables. Use `!inner` on the join and `.eq('<table>.approved', true)` to restrict to approved games only.

- [ ] **Update `app/api/pong/route.ts` GET handler**

Replace the `gamePlayers` query line:
```ts
supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group_id),
```
With:
```ts
supabase.from('pong_game_players').select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )').eq('group_id', group_id).eq('pong_games.approved', true),
```

- [ ] **Update `app/api/beer-die/route.ts` GET handler**

Replace the `gamePlayers` query line:
```ts
supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group_id),
```
With:
```ts
supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )').eq('group_id', group_id).eq('beer_die_games.approved', true),
```

- [ ] **Update `app/api/hearts/route.ts` GET handler**

Replace the `gamePlayers` query line:
```ts
supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group_id),
```
With:
```ts
supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games!inner ( id, played_at )').eq('group_id', group_id).eq('hearts_games.approved', true),
```

- [ ] **Commit**

```
git add app/api/pong/route.ts app/api/beer-die/route.ts app/api/hearts/route.ts
git commit -m "feat: filter leaderboard GET routes to approved games only"
```

---

### Task 3: Filter head-to-head and record-with routes by approved

**Files:**
- Modify: `app/api/pong/head-to-head/route.ts`
- Modify: `app/api/pong/record-with/route.ts`
- Modify: `app/api/beer-die/head-to-head/route.ts`
- Modify: `app/api/beer-die/record-with/route.ts`

All four files follow the same pattern — query `*_game_players` joined to the game table, filtered by `group_id`.

- [ ] **Update `app/api/pong/head-to-head/route.ts`**

Replace the query:
```ts
const { data, error } = await supabase
  .from('pong_game_players')
  .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
```
With:
```ts
const { data, error } = await supabase
  .from('pong_game_players')
  .select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
  .eq('pong_games.approved', true)
```

- [ ] **Update `app/api/pong/record-with/route.ts`**

Replace the query:
```ts
const { data, error } = await supabase
  .from('pong_game_players')
  .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
```
With:
```ts
const { data, error } = await supabase
  .from('pong_game_players')
  .select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
  .eq('pong_games.approved', true)
```

- [ ] **Update `app/api/beer-die/head-to-head/route.ts`**

Replace the query:
```ts
const { data, error } = await supabase
  .from('beer_die_game_players')
  .select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
```
With:
```ts
const { data, error } = await supabase
  .from('beer_die_game_players')
  .select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
  .eq('beer_die_games.approved', true)
```

- [ ] **Update `app/api/beer-die/record-with/route.ts`**

Replace the query:
```ts
const { data, error } = await supabase
  .from('beer_die_game_players')
  .select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
```
With:
```ts
const { data, error } = await supabase
  .from('beer_die_game_players')
  .select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )')
  .in('player_id', [player1, player2])
  .eq('group_id', group_id)
  .eq('beer_die_games.approved', true)
```

- [ ] **Commit**

```
git add app/api/pong/head-to-head/route.ts app/api/pong/record-with/route.ts app/api/beer-die/head-to-head/route.ts app/api/beer-die/record-with/route.ts
git commit -m "feat: filter head-to-head and record-with routes to approved games only"
```

---

### Task 4: Filter recent games route by approved

**Files:**
- Modify: `app/api/recent/route.ts`

The recent route queries the three game tables directly (not via junction tables), so simply add `.eq('approved', true)` to each query.

- [ ] **Update all three queries in `app/api/recent/route.ts`**

Replace:
```ts
supabase
  .from('pong_games')
  .select(`id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )`)
  .order('played_at', { ascending: false })
  .limit(10),
supabase
  .from('beer_die_games')
  .select(`id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )`)
  .order('played_at', { ascending: false })
  .limit(10),
supabase
  .from('hearts_games')
  .select(`id, played_at, hearts_game_players ( lost, users ( id, name ) )`)
  .order('played_at', { ascending: false })
  .limit(10),
```
With:
```ts
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
```

- [ ] **Commit**

```
git add app/api/recent/route.ts
git commit -m "feat: filter recent games to approved only"
```

---

### Task 5: Add PATCH approve endpoints

**Files:**
- Modify: `app/api/pong/[id]/route.ts`
- Modify: `app/api/beer-die/[id]/route.ts`
- Modify: `app/api/hearts/[id]/route.ts`

Each file already has PUT and DELETE. Add a PATCH handler that sets `approved = true`.

- [ ] **Add PATCH to `app/api/pong/[id]/route.ts`**

Append after the existing DELETE handler:
```ts
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('pong_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Add PATCH to `app/api/beer-die/[id]/route.ts`**

Append after the existing DELETE handler:
```ts
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('beer_die_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Add PATCH to `app/api/hearts/[id]/route.ts`**

Append after the existing DELETE handler:
```ts
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('hearts_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit**

```
git add "app/api/pong/[id]/route.ts" "app/api/beer-die/[id]/route.ts" "app/api/hearts/[id]/route.ts"
git commit -m "feat: add PATCH approve endpoints for pong, beer-die, and hearts"
```

---

### Task 6: Admin page — fetch pending games and update AdminPanel

**Files:**
- Modify: `app/g/[slug]/admin/page.tsx`
- Modify: `app/admin/page.tsx` (pass empty pending arrays to keep it working)
- Modify: `components/admin/AdminPanel.tsx`

The group admin page needs to fetch both approved games (for the edit list) and pending games (for the Pending section). AdminPanel receives them as separate props and renders a Pending section at the top.

- [ ] **Update `app/g/[slug]/admin/page.tsx`**

Replace the entire file with:
```tsx
export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { notFound } from 'next/navigation'
import { AdminPongGame, AdminBeerDieGame, AdminHeartsGame } from '@/app/admin/page'
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
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
  ])

  const assemblePong = (raw: any[]): AdminPongGame[] =>
    raw.map((g: any) => {
      const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return {
        id: g.id, cups_left: g.cups_left, played_at: g.played_at,
        winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
        loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id),
      }
    })

  const assembleBeerDie = (raw: any[]): AdminBeerDieGame[] =>
    raw.map((g: any) => {
      const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return {
        id: g.id, points_differential: g.points_differential, played_at: g.played_at,
        winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
        loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id),
      }
    })

  const assembleHearts = (raw: any[]): AdminHeartsGame[] =>
    raw.map((g: any) => ({
      id: g.id, played_at: g.played_at,
      game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-1">⚙️ Admin</h1>
      <p className="text-slate-400 text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        pendingPongGames={assemblePong(pendingPongRaw ?? [])}
        pendingBeerDieGames={assembleBeerDie(pendingBeerDieRaw ?? [])}
        pendingHeartsGames={assembleHearts(pendingHeartsRaw ?? [])}
        players={(users ?? []) as User[]}
        groupPin={group.pin}
      />
    </div>
  )
}
```

- [ ] **Update `app/admin/page.tsx` — add empty pending props to existing AdminPanel usage**

Find the `<AdminPanel` render and add the three empty pending props:
```tsx
<AdminPanel
  pongGames={pongGames}
  beerDieGames={beerDieGames}
  heartsGames={heartsGames}
  pendingPongGames={[]}
  pendingBeerDieGames={[]}
  pendingHeartsGames={[]}
  players={players}
  groupPin="1111"
/>
```

- [ ] **Update `components/admin/AdminPanel.tsx`**

Replace the entire file with:
```tsx
'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminHeartsGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditHeartsGame from './EditHeartsGame'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  heartsGames: AdminHeartsGame[]
  pendingPongGames: AdminPongGame[]
  pendingBeerDieGames: AdminBeerDieGame[]
  pendingHeartsGames: AdminHeartsGame[]
  players: User[]
  groupPin: string
}

export default function AdminPanel({
  pongGames, beerDieGames, heartsGames,
  pendingPongGames, pendingBeerDieGames, pendingHeartsGames,
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
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const pendingGames: AllGame[] = [
    ...pendingPongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...pendingBeerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...pendingHeartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    const endpoint = kind === 'pong' ? `/api/pong/${id}` : kind === 'beer-die' ? `/api/beer-die/${id}` : `/api/hearts/${id}`
    await fetch(endpoint, { method: 'DELETE' })
    setDeleteLoading(false)
    window.location.reload()
  }

  const handleApprove = async (kind: string, id: string) => {
    setApproveLoading(id)
    const endpoint = kind === 'pong' ? `/api/pong/${id}` : kind === 'beer-die' ? `/api/beer-die/${id}` : `/api/hearts/${id}`
    await fetch(endpoint, { method: 'PATCH' })
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

  const GameRow = ({ g, isPending }: { g: AllGame; isPending: boolean }) => {
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
                {isPending ? (
                  <button
                    onClick={() => handleApprove(g.kind, id)}
                    disabled={approveLoading === id}
                    className="text-xs font-bold bg-win text-black px-2 py-1 rounded hover:bg-green-400 disabled:opacity-50 transition-colors"
                  >
                    {approveLoading === id ? '...' : '✓ Approve'}
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(isEditing ? null : id)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                  >
                    {isEditing ? 'Close' : '✏️ Edit'}
                  </button>
                )}
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

        {!isPending && isEditing && g.kind === 'pong' && (
          <EditPongGame game={g.data as AdminPongGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'beer-die' && (
          <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
            Pending Approval
            <span className="ml-2 bg-yellow-900 text-yellow-300 text-xs px-1.5 py-0.5 rounded">{pendingGames.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingGames.map(g => <GameRow key={g.data.id} g={g} isPending={true} />)}
          </div>
        </div>
      )}

      <div>
        {pendingGames.length > 0 && (
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Approved Games</h2>
        )}
        <div className="space-y-2">
          {allGames.length === 0 && <p className="text-slate-500 text-sm">No games logged yet.</p>}
          {allGames.map(g => <GameRow key={g.data.id} g={g} isPending={false} />)}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```
git add "app/g/[slug]/admin/page.tsx" app/admin/page.tsx components/admin/AdminPanel.tsx
git commit -m "feat: add pending approval section to admin panel"
```

---

### Task 7: Add admin instructions banner to log page

**Files:**
- Modify: `app/g/[slug]/log/page.tsx`

Add a banner above `<LogTabs>` that explains the approval flow and how to reach the admin panel.

- [ ] **Update `app/g/[slug]/log/page.tsx`**

Replace the entire file with:
```tsx
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import LogTabs from '@/components/log/LogTabs'
import { notFound } from 'next/navigation'

export default async function GroupLogPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name')

  return (
    <div>
      <h1 className="text-2xl font-black mb-2 tracking-wide">Log a Game</h1>
      <p className="text-slate-400 text-sm mb-6">Select the game type and fill in the result.</p>
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-8 text-sm text-slate-300">
        🔒 <span className="font-medium">Games are reviewed before appearing on the leaderboard</span> — this keeps things fair on a public site.
        To approve submissions, add <span className="font-mono text-slate-200">/admin</span> to the end of your group link (PIN required).
      </div>
      <LogTabs players={players ?? []} />
    </div>
  )
}
```

- [ ] **Commit**

```
git add "app/g/[slug]/log/page.tsx"
git commit -m "feat: add admin instructions banner to log page"
```

---

## Manual Step

After all code tasks are complete, run `supabase/migration-approval.sql` in the Supabase SQL editor to add the `approved` column and backfill existing games.
