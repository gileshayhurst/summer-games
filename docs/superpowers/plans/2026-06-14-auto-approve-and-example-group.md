# Auto-Approve Games + Static Example Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the game approval gate so games appear on the leaderboard immediately, and create a static read-only `/g/example` page (hardcoded data snapshot) so the landing page demo no longer points at the owner's real group.

**Architecture:** Part A strips the pending-approval UI and writes a SQL migration to change the column default from false→true. Part B creates `app/g/example/` (static Next.js route, takes precedence over `[slug]`), adds an `isExample` prop to `GroupNav` and `BottomNav` to hide Log/Admin buttons, and populates a `data.ts` file with live data fetched via a one-off Node script.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (postgres), Tailwind CSS, `@supabase/supabase-js`, `dotenv`

---

## File Map

**Modified:**
- `components/admin/AdminPanel.tsx` — remove pending approval UI
- `app/g/[slug]/admin/page.tsx` — remove pending queries, simplify to one query per game
- `app/g/[slug]/log/page.tsx` — remove approval banner
- `components/GroupNav.tsx` — add optional `isExample` prop
- `components/BottomNav.tsx` — add optional `isExample` prop
- `app/page.tsx` — update "See an Example" link

**Created:**
- `docs/superpowers/plans/approval-system-archive.md` — code archive for re-enabling later
- `supabase/migration-auto-approve.sql` — SQL to run in Supabase dashboard
- `scripts/fetch-example-data.js` — one-off data fetch script (delete after use)
- `app/g/example/data.ts` — hardcoded snapshot
- `app/g/example/layout.tsx`
- `app/g/example/page.tsx`
- `app/g/example/pong/page.tsx`
- `app/g/example/beer-die/page.tsx`
- `app/g/example/cornhole/page.tsx`
- `app/g/example/spikeball/page.tsx`
- `app/g/example/hearts/page.tsx`
- `app/g/example/players/page.tsx`

---

## Part A: Remove Approval Gate

### Task 1: Archive approval code

**Files:**
- Create: `docs/superpowers/plans/approval-system-archive.md`

- [ ] **Step 1: Create the archive file**

```markdown
# Approval System Archive

Re-enable by: (1) running the reverse SQL migration, (2) restoring the code below, (3) re-adding the log page banner.

## Reverse SQL migration

```sql
ALTER TABLE pong_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE beer_die_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE cornhole_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE spikeball_games ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE hearts_games ALTER COLUMN approved SET DEFAULT false;
```

## Log page banner (add above `<LogTabs>` in `app/g/[slug]/log/page.tsx`)

```tsx
<div className="bg-amber-50 border border-warm rounded-xl px-4 py-3 mb-8 text-sm text-stone-700">
  🔒 <span className="font-bold">Games are reviewed before appearing on the leaderboard</span> — this keeps things fair on a public site.
  To approve submissions, tap the ⚙️ icon in the nav (PIN required).
</div>
```

## AdminPanel pending props (restore to Props type in `components/admin/AdminPanel.tsx`)

```ts
pendingPongGames: AdminPongGame[]
pendingBeerDieGames: AdminBeerDieGame[]
pendingCornholeGames: AdminCornholeGame[]
pendingSpikeballGames: AdminSpikeballGame[]
pendingHeartsGames: AdminHeartsGame[]
```

## AdminPanel pending state + handler (restore inside component body)

```ts
const [approveLoading, setApproveLoading] = useState<string | null>(null)

const handleApprove = async (kind: string, id: string) => {
  setApproveLoading(id)
  await fetch(apiPath(kind, id), { method: 'PATCH' })
  setApproveLoading(null)
  window.location.reload()
}

const pendingGames: AllGame[] = [
  ...pendingPongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
  ...pendingBeerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
  ...pendingCornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
  ...pendingSpikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
  ...pendingHeartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
```

## GameRow approve button (restore inside `!isConfirmingDelete` block, before Edit button, when `isPending`)

```tsx
{isPending ? (
  <button
    onClick={() => handleApprove(g.kind, id)}
    disabled={approveLoading === id}
    className="text-xs font-bold bg-win text-white px-2 py-1 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors"
  >
    {approveLoading === id ? '...' : '✓ Approve'}
  </button>
) : (
  <button onClick={() => setEditingId(isEditing ? null : id)} ...>
    {isEditing ? 'Close' : '✏️ Edit'}
  </button>
)}
```

## Pending Approval section (restore before the main games list in AdminPanel return)

```tsx
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
{pendingGames.length > 0 && (
  <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">Approved Games</h2>
)}
```

## Admin page pending queries (restore to the Promise.all in `app/g/[slug]/admin/page.tsx`)

```ts
supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
// (repeat pattern for beer_die, cornhole, spikeball, hearts)
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/approval-system-archive.md
git commit -m "docs: archive approval system code for potential re-enablement"
```

---

### Task 2: Create SQL migration file

**Files:**
- Create: `supabase/migration-auto-approve.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Change default so new games are auto-approved on insert
ALTER TABLE pong_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE beer_die_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE cornhole_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE spikeball_games ALTER COLUMN approved SET DEFAULT true;
ALTER TABLE hearts_games ALTER COLUMN approved SET DEFAULT true;

-- Backfill any currently-pending games
UPDATE pong_games SET approved = true WHERE approved = false;
UPDATE beer_die_games SET approved = true WHERE approved = false;
UPDATE cornhole_games SET approved = true WHERE approved = false;
UPDATE spikeball_games SET approved = true WHERE approved = false;
UPDATE hearts_games SET approved = true WHERE approved = false;
```

- [ ] **Step 2: Run this SQL in the Supabase dashboard SQL editor**

Open the Supabase project → SQL Editor → paste and run the contents of `supabase/migration-auto-approve.sql`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-auto-approve.sql
git commit -m "feat: SQL migration to auto-approve games on insert"
```

---

### Task 3: Clean up admin page

**Files:**
- Modify: `app/g/[slug]/admin/page.tsx`

- [ ] **Step 1: Replace the entire file content**

Replace the file with the following (removes pending queries and pending props):

```tsx
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
        players={(users ?? []) as User[]}
        groupPin={group.pin}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/\[slug\]/admin/page.tsx
git commit -m "feat: remove pending game queries from admin page"
```

---

### Task 4: Clean up AdminPanel component

**Files:**
- Modify: `components/admin/AdminPanel.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
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
  players: User[]
  groupPin: string
}

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, players, groupPin,
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

- [ ] **Step 2: Commit**

```bash
git add components/admin/AdminPanel.tsx
git commit -m "feat: remove pending approval UI from AdminPanel"
```

---

### Task 5: Remove log page approval banner

**Files:**
- Modify: `app/g/[slug]/log/page.tsx`

- [ ] **Step 1: Replace the file**

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
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
      <p className="text-muted text-sm mb-6">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/\[slug\]/log/page.tsx
git commit -m "feat: remove approval gate banner from log page"
```

---

## Part B: Static Example Group

### Task 6: Fetch live data and create data.ts

**Files:**
- Create (temporary): `scripts/fetch-example-data.js`
- Create: `app/g/example/data.ts`

- [ ] **Step 1: Create the fetch script**

Create `scripts/fetch-example-data.js`:

```js
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const GROUP_ID = '00000000-0000-0000-0000-000000000001'

function computePong(users, gamePlayers) {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, cup_diff: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s || !gp.pong_games) continue
    if (gp.side === 'winner') { s.wins++; s.cup_diff += gp.pong_games.cups_left }
    else { s.losses++; s.cup_diff -= gp.pong_games.cups_left }
  }
  return users.map(u => {
    const s = stats.get(u.id)
    const total = s.wins + s.losses
    return { name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, cup_differential: s.cup_diff }
  }).filter(e => e.wins + e.losses > 0 && !e.name.toLowerCase().startsWith('random'))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

function computeWinLoss(users, gamePlayers, gameKey) {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s || !gp[gameKey]) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp[gameKey].points_differential }
    else { s.losses++; s.point_diff -= gp[gameKey].points_differential }
  }
  return users.map(u => {
    const s = stats.get(u.id)
    const total = s.wins + s.losses
    return { name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff }
  }).filter(e => e.wins + e.losses > 0 && !e.name.toLowerCase().startsWith('random'))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

function computeBeerDie(users, gamePlayers, sinks) {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0, sinks: 0, self_sinks: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s || !gp.beer_die_games) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.beer_die_games.points_differential }
    else { s.losses++; s.point_diff -= gp.beer_die_games.points_differential }
  }
  for (const sink of (sinks || [])) {
    const s = stats.get(sink.player_id)
    if (!s) continue
    if (sink.type === 'sink') s.sinks++
    else if (sink.type === 'self_sink') s.self_sinks++
  }
  return users.map(u => {
    const s = stats.get(u.id)
    const total = s.wins + s.losses
    return { name: u.name, wins: s.wins, losses: s.losses, win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff, sinks: s.sinks, self_sinks: s.self_sinks }
  }).filter(e => e.wins + e.losses > 0 && !e.name.toLowerCase().startsWith('random'))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

function computeHearts(users, gamePlayers) {
  const stats = new Map(users.map(u => [u.id, { played: 0, losses: 0 }]))
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.played++
    if (gp.lost) s.losses++
  }
  return users.map(u => {
    const s = stats.get(u.id)
    return { name: u.name, games_played: s.played, losses: s.losses, loss_rate: s.played > 0 ? s.losses / s.played : 0 }
  }).filter(e => e.games_played > 0 && !e.name.toLowerCase().startsWith('random'))
    .sort((a, b) => a.loss_rate - b.loss_rate || a.losses - b.losses)
}

async function main() {
  const [
    { data: users },
    { data: pongPlayers },
    { data: beerDiePlayers },
    { data: beerDieSinks },
    { data: cornholePlayers },
    { data: spikeballPlayers },
    { data: heartsPlayers },
    { data: pongRecent },
    { data: beerDieRecent },
    { data: cornholeRecent },
    { data: spikeballRecent },
    { data: heartsRecent },
  ] = await Promise.all([
    supabase.from('users').select('id, name').eq('group_id', GROUP_ID).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games(id, cups_left, played_at)').eq('group_id', GROUP_ID),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games(id, points_differential, played_at)').eq('group_id', GROUP_ID),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', GROUP_ID),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games(id, points_differential, played_at)').eq('group_id', GROUP_ID),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games(id, points_differential, played_at)').eq('group_id', GROUP_ID),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games(id, played_at)').eq('group_id', GROUP_ID),
    supabase.from('pong_games').select('id, cups_left, played_at, pong_game_players(side, users(id, name))').eq('group_id', GROUP_ID).eq('approved', true).order('played_at', { ascending: false }).limit(5),
    supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players(side, users(id, name))').eq('group_id', GROUP_ID).eq('approved', true).order('played_at', { ascending: false }).limit(5),
    supabase.from('cornhole_games').select('id, points_differential, played_at, cornhole_game_players(side, users(id, name))').eq('group_id', GROUP_ID).eq('approved', true).order('played_at', { ascending: false }).limit(5),
    supabase.from('spikeball_games').select('id, points_differential, played_at, spikeball_game_players(side, users(id, name))').eq('group_id', GROUP_ID).eq('approved', true).order('played_at', { ascending: false }).limit(5),
    supabase.from('hearts_games').select('id, played_at, hearts_game_players(lost, users(id, name))').eq('group_id', GROUP_ID).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const pongLb = computePong(users, pongPlayers)
  const beerDieLb = computeBeerDie(users, beerDiePlayers, beerDieSinks)
  const cornholeLb = computeWinLoss(users, cornholePlayers, 'cornhole_games')
  const spikeballLb = computeWinLoss(users, spikeballPlayers, 'spikeball_games')
  const heartsLb = computeHearts(users, heartsPlayers)

  const fmtPongRecent = (pongRecent || []).map(g => ({
    type: 'pong', id: g.id, played_at: g.played_at,
    winners: (g.pong_game_players || []).filter(p => p.side === 'winner').map(p => p.users?.name ?? 'Unknown'),
    losers: (g.pong_game_players || []).filter(p => p.side === 'loser').map(p => p.users?.name ?? 'Unknown'),
    cups_left: g.cups_left,
  }))

  const fmtBeerDieRecent = (beerDieRecent || []).map(g => ({
    type: 'beer-die', id: g.id, played_at: g.played_at,
    winners: (g.beer_die_game_players || []).filter(p => p.side === 'winner').map(p => p.users?.name ?? 'Unknown'),
    losers: (g.beer_die_game_players || []).filter(p => p.side === 'loser').map(p => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const fmtCornholeRecent = (cornholeRecent || []).map(g => ({
    type: 'cornhole', id: g.id, played_at: g.played_at,
    winners: (g.cornhole_game_players || []).filter(p => p.side === 'winner').map(p => p.users?.name ?? 'Unknown'),
    losers: (g.cornhole_game_players || []).filter(p => p.side === 'loser').map(p => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const fmtSpikeballRecent = (spikeballRecent || []).map(g => ({
    type: 'spikeball', id: g.id, played_at: g.played_at,
    winners: (g.spikeball_game_players || []).filter(p => p.side === 'winner').map(p => p.users?.name ?? 'Unknown'),
    losers: (g.spikeball_game_players || []).filter(p => p.side === 'loser').map(p => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const fmtHeartsRecent = (heartsRecent || []).map(g => ({
    type: 'hearts', id: g.id, played_at: g.played_at,
    players: (g.hearts_game_players || []).map(p => p.users?.name ?? 'Unknown'),
    loser: (g.hearts_game_players || []).find(p => p.lost)?.users?.name ?? '',
  }))

  const allRecent = [
    ...fmtPongRecent, ...fmtBeerDieRecent, ...fmtCornholeRecent, ...fmtSpikeballRecent, ...fmtHeartsRecent,
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()).slice(0, 20)

  const playerNames = (users || []).map(u => u.name).filter(n => !n.toLowerCase().startsWith('random'))

  const out = `import type { RecentGame } from '@/lib/types'

export const EXAMPLE_GROUP_NAME = 'Summer Games'

export const examplePlayers: string[] = ${JSON.stringify(playerNames, null, 2)}

export const examplePongLeaderboard = ${JSON.stringify(pongLb, null, 2)} as const

export const examplePongRecent = ${JSON.stringify(fmtPongRecent, null, 2)} as const

export const exampleBeerDieLeaderboard = ${JSON.stringify(beerDieLb, null, 2)} as const

export const exampleBeerDieRecent = ${JSON.stringify(fmtBeerDieRecent, null, 2)} as const

export const exampleCornholeLeaderboard = ${JSON.stringify(cornholeLb, null, 2)} as const

export const exampleCornholeRecent = ${JSON.stringify(fmtCornholeRecent, null, 2)} as const

export const exampleSpikeballLeaderboard = ${JSON.stringify(spikeballLb, null, 2)} as const

export const exampleSpikeballRecent = ${JSON.stringify(fmtSpikeballRecent, null, 2)} as const

export const exampleHeartsLeaderboard = ${JSON.stringify(heartsLb, null, 2)} as const

export const exampleHeartsRecent = ${JSON.stringify(fmtHeartsRecent, null, 2)} as const

export const exampleRecentAll: RecentGame[] = ${JSON.stringify(allRecent, null, 2)} as unknown as RecentGame[]
`

  fs.writeFileSync('app/g/example/data.ts', out, 'utf8')
  console.log('Written app/g/example/data.ts')
}

main().catch(console.error)
```

- [ ] **Step 2: Create the example directory and run the script**

```bash
mkdir -p app/g/example
node scripts/fetch-example-data.js
```

Expected output: `Written app/g/example/data.ts`

If the script fails with a module error, try: `node --require dotenv/config scripts/fetch-example-data.js` or check that `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.

- [ ] **Step 3: Delete the fetch script**

```bash
rm scripts/fetch-example-data.js
```

- [ ] **Step 4: Commit**

```bash
git add app/g/example/data.ts
git commit -m "feat: add hardcoded example group data snapshot"
```

---

### Task 7: Add isExample prop to GroupNav and BottomNav

**Files:**
- Modify: `components/GroupNav.tsx`
- Modify: `components/BottomNav.tsx`

- [ ] **Step 1: Update GroupNav — add isExample prop**

In `components/GroupNav.tsx`, change the function signature from:
```tsx
export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
```
to:
```tsx
export default function GroupNav({ slug, groupName, isExample = false }: { slug: string; groupName: string; isExample?: boolean }) {
```

Then wrap the admin link so it only renders when not example:
```tsx
{/* Replace this: */}
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

{/* With this: */}
{!isExample && (
  <Link
    href={`${base}/admin`}
    className="text-muted hover:text-stone-900 transition-colors mr-2 text-base shrink-0"
    aria-label="Admin settings"
  >
    ⚙️
  </Link>
)}
{!isExample && (
  <Link
    href={`${base}/log`}
    className="hidden md:inline-flex shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
  >
    LOG GAME →
  </Link>
)}
```

- [ ] **Step 2: Update BottomNav — add isExample prop**

In `components/BottomNav.tsx`, change the function signature from:
```tsx
export default function BottomNav({ slug }: { slug: string }) {
```
to:
```tsx
export default function BottomNav({ slug, isExample = false }: { slug: string; isExample?: boolean }) {
```

Then replace the LOG+ button with a conditional:
```tsx
{/* Replace this: */}
<Link
  href={`${base}/log`}
  onClick={() => setShowMore(false)}
  className="flex-1 flex items-center justify-center"
>
  <span className="bg-win text-white text-[9px] font-black px-3 py-2 rounded-full tracking-wider uppercase">LOG+</span>
</Link>

{/* With this: */}
{isExample ? (
  <div className="flex-1" />
) : (
  <Link
    href={`${base}/log`}
    onClick={() => setShowMore(false)}
    className="flex-1 flex items-center justify-center"
  >
    <span className="bg-win text-white text-[9px] font-black px-3 py-2 rounded-full tracking-wider uppercase">LOG+</span>
  </Link>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/GroupNav.tsx components/BottomNav.tsx
git commit -m "feat: add isExample prop to GroupNav and BottomNav"
```

---

### Task 8: Create example layout

**Files:**
- Create: `app/g/example/layout.tsx`

- [ ] **Step 1: Create the layout file**

```tsx
import type { Metadata } from 'next'
import GroupNav from '@/components/GroupNav'
import BottomNav from '@/components/BottomNav'
import { EXAMPLE_GROUP_NAME } from './data'

export const metadata: Metadata = {
  title: `${EXAMPLE_GROUP_NAME} — Example`,
  description: 'See how Summer Games looks for your crew',
}

export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GroupNav slug="example" groupName={EXAMPLE_GROUP_NAME} isExample={true} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-8">{children}</main>
      <BottomNav slug="example" isExample={true} />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/layout.tsx
git commit -m "feat: add example group layout"
```

---

### Task 9: Create example home page

**Files:**
- Create: `app/g/example/page.tsx`

- [ ] **Step 1: Create the home page**

```tsx
import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import {
  EXAMPLE_GROUP_NAME,
  examplePongLeaderboard,
  exampleBeerDieLeaderboard,
  exampleCornholeLeaderboard,
  exampleSpikeballLeaderboard,
  exampleHeartsLeaderboard,
  exampleRecentAll,
} from './data'

type GameLeader = { name: string; wins: number; losses: number; winRatePct: number } | null

const GAME_CARDS = [
  { key: 'pong', slug: 'pong', icon: '🏓', name: 'Pong' },
  { key: 'beer-die', slug: 'beer-die', icon: '🎲', name: 'Beer Die' },
  { key: 'hearts', slug: 'hearts', icon: '♥', name: 'Hearts' },
  { key: 'cornhole', slug: 'cornhole', icon: '🌽', name: 'Cornhole' },
  { key: 'spikeball', slug: 'spikeball', icon: '🏐', name: 'Spikeball' },
]

function toLeader(entry: any, isHearts = false): GameLeader {
  if (!entry) return null
  if (isHearts) {
    const wins = entry.games_played - entry.losses
    return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100) }
  }
  return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100) }
}

const leaders: Record<string, GameLeader> = {
  pong: toLeader(examplePongLeaderboard[0]),
  'beer-die': toLeader(exampleBeerDieLeaderboard[0]),
  hearts: toLeader(exampleHeartsLeaderboard[0], true),
  cornhole: toLeader(exampleCornholeLeaderboard[0]),
  spikeball: toLeader(exampleSpikeballLeaderboard[0]),
}

export default function ExampleHomePage() {
  const base = '/g/example'
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{EXAMPLE_GROUP_NAME}</h1>
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
        <RecentGames games={exampleRecentAll} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/page.tsx
git commit -m "feat: add example group home page"
```

---

### Task 10: Create example pong page

**Files:**
- Create: `app/g/example/pong/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import { examplePongLeaderboard, examplePongRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
]

export default function ExamplePongPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏓 Pong</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={examplePongLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew's game history.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={examplePongRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/pong/page.tsx
git commit -m "feat: add example pong page"
```

---

### Task 11: Create example beer-die page

**Files:**
- Create: `app/g/example/beer-die/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import { exampleBeerDieLeaderboard, exampleBeerDieRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
]

export default function ExampleBeerDiePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🎲 Beer Die</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={exampleBeerDieLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew's game history.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={exampleBeerDieRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/g/example/beer-die/page.tsx"
git commit -m "feat: add example beer-die page"
```

---

### Task 12: Create example cornhole page

**Files:**
- Create: `app/g/example/cornhole/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import CornholeIcon from '@/components/icons/CornholeIcon'
import { exampleCornholeLeaderboard, exampleCornholeRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
]

export default function ExampleCornholePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1"><CornholeIcon className="inline w-9 h-9 mr-1 align-middle" /> Cornhole</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={exampleCornholeLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew's game history.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={exampleCornholeRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/cornhole/page.tsx
git commit -m "feat: add example cornhole page"
```

---

### Task 13: Create example spikeball page

**Files:**
- Create: `app/g/example/spikeball/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import SpikeballIcon from '@/components/icons/SpikeballIcon'
import { exampleSpikeballLeaderboard, exampleSpikeballRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
]

export default function ExampleSpikeballPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1"><SpikeballIcon className="inline w-9 h-9 mr-1 align-middle" /> Spikeball</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={exampleSpikeballLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew's game history.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={exampleSpikeballRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/spikeball/page.tsx
git commit -m "feat: add example spikeball page"
```

---

### Task 14: Create example hearts page

**Files:**
- Create: `app/g/example/hearts/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import { exampleHeartsLeaderboard, exampleHeartsRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'games_played', label: 'Games' },
  { key: 'losses', label: 'Losses' },
  { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
]

export default function ExampleHeartsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">♥ Hearts</h1>
        <p className="text-muted text-sm">Ranked by lowest loss rate</p>
      </div>
      <Leaderboard entries={exampleHeartsLeaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
        <RecentGames games={exampleHeartsRecent as any[]} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/hearts/page.tsx
git commit -m "feat: add example hearts page"
```

---

### Task 15: Create example players page

**Files:**
- Create: `app/g/example/players/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { examplePlayers } from '../data'

export default function ExamplePlayersPage() {
  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {examplePlayers.map((name) => (
          <div key={name} className="bg-card rounded-xl p-4 text-center border border-warm">
            <p className="font-black text-stone-900 uppercase tracking-wide text-sm">{name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/g/example/players/page.tsx
git commit -m "feat: add example players page"
```

---

### Task 16: Update landing page link

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Change the See an Example link href**

In `app/page.tsx`, find:
```tsx
<Link href="/g/summer-games"
```
Replace with:
```tsx
<Link href="/g/example"
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: point See an Example link to static /g/example route"
```
