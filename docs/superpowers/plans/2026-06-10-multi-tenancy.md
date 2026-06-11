# Summer Games Multi-Tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-tenant Summer Games tracker into a shared platform where any friend group can create their own space at `/g/[slug]`.

**Architecture:** Add a `groups` table to Supabase; add `group_id` FK to every game/player table; scope all queries by `group_id`. All group pages live under `app/g/[slug]/`. A React context (`GroupContext`) propagates `groupId` to client components so they can include it in API calls. Existing API routes are updated to require a `group_id` param rather than creating new route trees.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL), Tailwind CSS, Vercel. No new dependencies needed.

---

## File Structure

### New files
- `supabase/migration.sql` — DB migration (run manually in Supabase SQL editor)
- `lib/group-context.tsx` — React context + `useGroup()` hook
- `components/GroupProvider.tsx` — Client-side context provider
- `components/GroupNav.tsx` — Slug-aware navigation bar
- `components/SuggestGame.tsx` — "Suggest a game" mailto link
- `app/api/groups/route.ts` — POST to create a group
- `app/create/page.tsx` — Group creation form page
- `app/g/[slug]/layout.tsx` — Fetches group, wraps children in GroupProvider + GroupNav
- `app/g/[slug]/page.tsx` — Group home (recent games)
- `app/g/[slug]/pong/page.tsx`
- `app/g/[slug]/beer-die/page.tsx`
- `app/g/[slug]/hearts/page.tsx`
- `app/g/[slug]/players/page.tsx`
- `app/g/[slug]/players/[name]/page.tsx`
- `app/g/[slug]/log/page.tsx`
- `app/g/[slug]/admin/page.tsx`
- `app/g/[slug]/pong/opengraph-image.tsx`
- `app/g/[slug]/beer-die/opengraph-image.tsx`
- `app/g/[slug]/hearts/opengraph-image.tsx`

### Modified files
- `lib/types.ts` — add `Group` type
- `lib/supabase-server.ts` — add `getGroupBySlug()`
- `app/layout.tsx` — remove `<Nav>` and `<main>` wrapper (group layout adds its own)
- `app/page.tsx` — rewrite as marketing landing page
- `next.config.mjs` — add redirects from old flat routes to `/g/summer-games/...`
- `app/api/players/route.ts` — filter by `group_id`
- `app/api/pong/route.ts` — filter by `group_id`
- `app/api/pong/[id]/route.ts` — scope delete/update to `group_id`
- `app/api/pong/head-to-head/route.ts` — filter by `group_id`
- `app/api/pong/record-with/route.ts` — filter by `group_id`
- `app/api/beer-die/route.ts` — filter by `group_id`
- `app/api/beer-die/[id]/route.ts` — scope to `group_id`
- `app/api/beer-die/head-to-head/route.ts` — filter by `group_id`
- `app/api/beer-die/record-with/route.ts` — filter by `group_id`
- `app/api/hearts/route.ts` — filter by `group_id`
- `app/api/hearts/[id]/route.ts` — scope to `group_id`
- `components/HeadToHead.tsx` — read `groupId` from context
- `components/PartnerRecord.tsx` — read `groupId` from context
- `components/log/LogTabs.tsx` — pass through (no change needed)
- `components/log/PongForm.tsx` — read `groupId`+`groupSlug` from context
- `components/log/BeerDieForm.tsx` — read `groupId`+`groupSlug` from context
- `components/log/HeartsForm.tsx` — read `groupId`+`groupSlug` from context
- `components/admin/AdminPanel.tsx` — accept `groupPin`, `groupId`, `groupSlug` props; remove hardcoded PIN
- `components/admin/EditPongGame.tsx` — accept `groupSlug` prop for redirect
- `components/admin/EditBeerDieGame.tsx` — accept `groupSlug` prop
- `components/admin/EditHeartsGame.tsx` — accept `groupSlug` prop

---

## Task 1: Supabase DB Migration

**Files:**
- Create: `supabase/migration.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migration.sql` with this exact content:

```sql
-- 1. Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  pin text NOT NULL DEFAULT '1111',
  premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Seed Giles's existing group
INSERT INTO groups (id, slug, name, pin)
VALUES ('00000000-0000-0000-0000-000000000001', 'summer-games', 'Summer Games', '1111')
ON CONFLICT (slug) DO NOTHING;

-- 3. users
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE users SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE users ALTER COLUMN group_id SET NOT NULL;

-- 4. pong_games
ALTER TABLE pong_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE pong_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE pong_games ALTER COLUMN group_id SET NOT NULL;

-- 5. pong_game_players
ALTER TABLE pong_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE pong_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE pong_game_players ALTER COLUMN group_id SET NOT NULL;

-- 6. beer_die_games
ALTER TABLE beer_die_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_games ALTER COLUMN group_id SET NOT NULL;

-- 7. beer_die_game_players
ALTER TABLE beer_die_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_game_players ALTER COLUMN group_id SET NOT NULL;

-- 8. beer_die_sinks
ALTER TABLE beer_die_sinks ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE beer_die_sinks SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE beer_die_sinks ALTER COLUMN group_id SET NOT NULL;

-- 9. hearts_games
ALTER TABLE hearts_games ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE hearts_games SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE hearts_games ALTER COLUMN group_id SET NOT NULL;

-- 10. hearts_game_players
ALTER TABLE hearts_game_players ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
UPDATE hearts_game_players SET group_id = '00000000-0000-0000-0000-000000000001' WHERE group_id IS NULL;
ALTER TABLE hearts_game_players ALTER COLUMN group_id SET NOT NULL;
```

- [ ] **Step 2: Run migration**

Go to your Supabase project dashboard → SQL Editor → paste the contents of `supabase/migration.sql` → Run. Confirm no errors. The existing data is now associated with the `summer-games` group.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration.sql
git commit -m "feat: add groups table and group_id to all game tables"
```

---

## Task 2: Types and Server Helpers

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/supabase-server.ts`

- [ ] **Step 1: Add Group type to `lib/types.ts`**

Add this block at the top of `lib/types.ts` (before existing types):

```ts
export type Group = {
  id: string
  slug: string
  name: string
  pin: string
  premium: boolean
  created_at: string
}
```

- [ ] **Step 2: Add `getGroupBySlug` to `lib/supabase-server.ts`**

Replace the entire file with:

```ts
import { createClient } from '@supabase/supabase-js'
import { Group } from './types'

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('groups')
    .select('id, slug, name, pin, premium, created_at')
    .eq('slug', slug)
    .single()
  return data ?? null
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/supabase-server.ts
git commit -m "feat: add Group type and getGroupBySlug helper"
```

---

## Task 3: Group Context

**Files:**
- Create: `lib/group-context.tsx`
- Create: `components/GroupProvider.tsx`

- [ ] **Step 1: Create `lib/group-context.tsx`**

```tsx
'use client'
import { createContext, useContext } from 'react'

type GroupContextValue = {
  id: string
  slug: string
  name: string
}

export const GroupContext = createContext<GroupContextValue | null>(null)

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider')
  return ctx
}
```

- [ ] **Step 2: Create `components/GroupProvider.tsx`**

```tsx
'use client'
import { GroupContext } from '@/lib/group-context'

type Props = {
  group: { id: string; slug: string; name: string }
  children: React.ReactNode
}

export default function GroupProvider({ group, children }: Props) {
  return <GroupContext.Provider value={group}>{children}</GroupContext.Provider>
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/group-context.tsx components/GroupProvider.tsx
git commit -m "feat: add GroupContext and GroupProvider"
```

---

## Task 4: Group API Route + Create Page

**Files:**
- Create: `app/api/groups/route.ts`
- Create: `app/create/page.tsx`

- [ ] **Step 1: Create `app/api/groups/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export async function POST(req: NextRequest) {
  const { name, slug: rawSlug, pin, players } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 })
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  if (!Array.isArray(players) || players.length < 1)
    return NextResponse.json({ error: 'At least 1 player required' }, { status: 400 })

  const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(name.trim())
  if (!slug) return NextResponse.json({ error: 'Invalid group name for URL' }, { status: 400 })

  const supabase = createServerClient()

  const { data: existing } = await supabase.from('groups').select('id').eq('slug', slug).single()
  if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), slug, pin })
    .select()
    .single()
  if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 })

  const playerRows = players
    .map((n: string) => n.trim())
    .filter(Boolean)
    .map((n: string) => ({ name: n, group_id: group.id }))

  if (playerRows.length > 0) {
    const { error: playersErr } = await supabase.from('users').insert(playerRows)
    if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  }

  return NextResponse.json({ slug }, { status: 201 })
}
```

- [ ] **Step 2: Create `app/create/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function CreatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [players, setPlayers] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (v: string) => {
    setName(v)
    setSlug(toSlug(v))
  }

  const updatePlayer = (i: number, v: string) => {
    const next = [...players]
    next[i] = v
    if (i === players.length - 1 && v.trim()) next.push('')
    setPlayers(next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const filledPlayers = players.map(p => p.trim()).filter(Boolean)
    if (!name.trim()) return setError('Group name required')
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be exactly 4 digits')
    if (filledPlayers.length < 1) return setError('Add at least 1 player')
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, pin, players: filledPlayers }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push(`/g/${data.slug}`)
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/" className="text-slate-400 text-sm hover:text-white mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-black tracking-wide mb-2">Create Your Group</h1>
        <p className="text-slate-400 text-sm mb-8">Set up your leaderboard in 60 seconds.</p>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Group Name</label>
            <input
              value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="Rob's Crew"
              className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-win"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">summergames.app/g/</span>
              <input
                value={slug} onChange={e => setSlug(toSlug(e.target.value))}
                placeholder="robs-crew"
                className="bg-card border border-slate-600 rounded px-3 py-2 text-white flex-1 focus:outline-none focus:border-win"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Admin PIN (4 digits)</label>
            <input
              type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Players</label>
            <div className="space-y-2">
              {players.map((p, i) => (
                <input
                  key={i} value={p} onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-win"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-loss text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors w-full">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Visit `http://localhost:3000/create`. Fill in the form with a test group name, PIN `9999`, and a couple players. Submit. Should redirect to `/g/[your-slug]` (which 404s for now — that's expected).

- [ ] **Step 4: Commit**

```bash
git add app/api/groups/route.ts app/create/page.tsx
git commit -m "feat: add group creation API and create page"
```

---

## Task 5: Landing Page + Root Layout Update

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `app/layout.tsx`** — remove Nav and main wrapper

Replace entire file:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Summer Games',
  description: 'Track your friend group\'s game results',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Rewrite `app/page.tsx`** as landing page

Replace entire file:

```tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <span className="text-win font-black text-sm tracking-widest uppercase">Summer Games</span>
        <Link href="/create"
          className="bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors">
          Create Your Group
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-black tracking-widest uppercase text-win mb-4">Summer Games</h1>
        <p className="text-xl text-slate-300 mb-4">
          Track wins, losses, and bragging rights for your crew.
        </p>
        <p className="text-slate-400 mb-12">
          Leaderboards for Pong, Beer Die, Hearts, and more — shared with your whole group, no app needed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/create"
            className="bg-win text-black font-bold px-8 py-3 rounded-lg hover:bg-green-400 transition-colors text-lg">
            Create Your Group
          </Link>
          <Link href="/g/summer-games"
            className="bg-card text-white font-bold px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg">
            See an Example →
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-6 text-left">
          {[
            { icon: '🏓', title: 'Multiple Games', desc: 'Pong, Beer Die, Hearts — with more games added based on what groups want.' },
            { icon: '📊', title: 'Live Leaderboards', desc: 'Win rates, differentials, head-to-head records. Always up to date.' },
            { icon: '🔗', title: 'Shareable', desc: 'Public links your whole group can bookmark. No login required.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-card rounded-lg p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="font-bold mb-1">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-16 text-slate-500 text-sm">
          Want to suggest a game?{' '}
          <a href="mailto:summergamesapp@gmail.com?subject=Game suggestion" className="text-slate-300 underline hover:text-white">
            Let us know
          </a>
        </p>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

`npm run dev` → visit `http://localhost:3000`. Should show the landing page with working links.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add landing page and simplify root layout"
```

---

## Task 6: Group Layout + GroupNav

**Files:**
- Create: `components/GroupNav.tsx`
- Create: `app/g/[slug]/layout.tsx`

- [ ] **Step 1: Create `components/GroupNav.tsx`**

```tsx
import Link from 'next/link'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  return (
    <nav className="bg-card border-b border-slate-700 px-4 py-3 flex items-center gap-6 sticky top-0 z-10">
      <Link href={base} className="text-win font-black text-sm tracking-widest uppercase">
        {groupName}
      </Link>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <Link href={`${base}/pong`} className="hover:text-white transition-colors">🏓 Pong</Link>
        <Link href={`${base}/beer-die`} className="hover:text-white transition-colors">🎲 Beer Die</Link>
        <Link href={`${base}/hearts`} className="hover:text-white transition-colors">♥ Hearts</Link>
        <Link href={`${base}/players`} className="hover:text-white transition-colors">👥 Players</Link>
      </div>
      <Link
        href={`${base}/log`}
        className="ml-auto bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
      >
        + LOG GAME
      </Link>
    </nav>
  )
}
```

- [ ] **Step 2: Create `app/g/[slug]/layout.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { getGroupBySlug } from '@/lib/supabase-server'
import GroupProvider from '@/components/GroupProvider'
import GroupNav from '@/components/GroupNav'

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
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </GroupProvider>
  )
}
```

- [ ] **Step 3: Create placeholder `app/g/[slug]/page.tsx`** (temporary, replaced in Task 8)

```tsx
export default function GroupHomePlaceholder() {
  return <div className="text-slate-400">Loading group...</div>
}
```

- [ ] **Step 4: Verify**

`npm run dev` → visit `http://localhost:3000/g/summer-games`. Should show the nav bar with "Summer Games" and game links (page content is just placeholder text for now). A non-existent slug like `/g/fake` should show a 404.

- [ ] **Step 5: Commit**

```bash
git add components/GroupNav.tsx app/g/[slug]/layout.tsx app/g/[slug]/page.tsx
git commit -m "feat: add group layout and GroupNav"
```

---

## Task 7: Update All API Routes to Be Group-Aware

**Files:**
- Modify: `app/api/players/route.ts`
- Modify: `app/api/pong/route.ts`
- Modify: `app/api/pong/[id]/route.ts`
- Modify: `app/api/pong/head-to-head/route.ts`
- Modify: `app/api/pong/record-with/route.ts`
- Modify: `app/api/beer-die/route.ts`
- Modify: `app/api/beer-die/[id]/route.ts`
- Modify: `app/api/beer-die/head-to-head/route.ts`
- Modify: `app/api/beer-die/record-with/route.ts`
- Modify: `app/api/hearts/route.ts`
- Modify: `app/api/hearts/[id]/route.ts`

- [ ] **Step 1: Update `app/api/players/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users').select('id, name, created_at').eq('group_id', group_id).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ players: data })
}

export async function POST(req: NextRequest) {
  const { name, group_id } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users').insert({ name: name.trim(), group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data }, { status: 201 })
}
```

- [ ] **Step 2: Update `app/api/pong/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { PongGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group_id),
  ])
  const leaderboard = computePongLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, cups_left, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be >= 0' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('pong_games').insert({ cups_left, group_id }).select().single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playersErr } = await supabase.from('pong_game_players').insert(playerRows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
```

- [ ] **Step 3: Update `app/api/pong/[id]/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, cups_left, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be >= 0' }, { status: 400 })

  const supabase = createServerClient()
  const { error: updateErr } = await supabase
    .from('pong_games').update({ cups_left }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('pong_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id })),
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

- [ ] **Step 4: Update `app/api/pong/head-to-head/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongHeadToHead } from '@/lib/stats'
import { PongGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pong_game_players')
    .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePongHeadToHead(player1, player2, (data ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 5: Update `app/api/pong/record-with/route.ts`**

Read the file first, then replace with the same pattern as head-to-head but calling `computePongPartnerRecord`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongPartnerRecord } from '@/lib/stats'
import { PongGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pong_game_players')
    .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePongPartnerRecord(player1, player2, (data ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 6: Update `app/api/beer-die/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { BeerDieGamePlayer, BeerDieSink, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group_id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group_id),
  ])
  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, points_differential, sinks, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_games').insert({ points_differential, group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playerError } = await supabase.from('beer_die_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  if (Array.isArray(sinks) && sinks.length > 0) {
    const sinkRows = sinks
      .filter((s: { player_id: string; type: string }) => s.player_id && (s.type === 'sink' || s.type === 'self_sink'))
      .map((s: { player_id: string; type: string }) => ({ game_id: data.id, player_id: s.player_id, type: s.type, group_id }))
    if (sinkRows.length > 0) await supabase.from('beer_die_sinks').insert(sinkRows)
  }

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
```

- [ ] **Step 7: Update `app/api/beer-die/[id]/route.ts`**

Replace entire file:

```ts
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
    .from('beer_die_games').update({ points_differential }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('beer_die_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: insertErr } = await supabase.from('beer_die_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('beer_die_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 8: Update `app/api/beer-die/head-to-head/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieHeadToHead } from '@/lib/stats'
import { BeerDieGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_game_players')
    .select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeBeerDieHeadToHead(player1, player2, (data ?? []) as unknown as BeerDieGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 9: Update `app/api/beer-die/record-with/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDiePartnerRecord } from '@/lib/stats'
import { BeerDieGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_game_players')
    .select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeBeerDiePartnerRecord(player1, player2, (data ?? []) as unknown as BeerDieGamePlayer[])
  return NextResponse.json({ result })
}
```

- [ ] **Step 10: Update `app/api/hearts/route.ts`**

Replace entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { HeartsGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group_id),
  ])
  const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { game_players, group_id } = await req.json()
  if (!Array.isArray(game_players) || game_players.length < 3)
    return NextResponse.json({ error: 'At least 3 players required' }, { status: 400 })
  if (game_players.filter((p: { lost: boolean }) => p.lost).length !== 1)
    return NextResponse.json({ error: 'Exactly 1 loser required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('hearts_games').insert({ group_id }).select().single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const rows = game_players.map((p: { player_id: string; lost: boolean }) => ({
    game_id: game.id, player_id: p.player_id, lost: p.lost, group_id,
  }))
  const { error: playersErr } = await supabase.from('hearts_game_players').insert(rows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
```

- [ ] **Step 11: Update `app/api/hearts/[id]/route.ts`**

Read the file first to get current content, then replace with the group-aware version (same pattern as pong/[id]/route.ts — update the game row and delete/re-insert player rows with `group_id` in the payload):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { game_players, group_id } = await req.json()
  if (!Array.isArray(game_players) || game_players.length < 3)
    return NextResponse.json({ error: 'At least 3 players required' }, { status: 400 })
  if (game_players.filter((p: { lost: boolean }) => p.lost).length !== 1)
    return NextResponse.json({ error: 'Exactly 1 loser required' }, { status: 400 })

  const supabase = createServerClient()
  const { error: deleteErr } = await supabase
    .from('hearts_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const rows = game_players.map((p: { player_id: string; lost: boolean }) => ({
    game_id: params.id, player_id: p.player_id, lost: p.lost, group_id,
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

- [ ] **Step 12: Commit**

```bash
git add app/api/players/route.ts app/api/pong/route.ts "app/api/pong/[id]/route.ts" app/api/pong/head-to-head/route.ts app/api/pong/record-with/route.ts app/api/beer-die/route.ts "app/api/beer-die/[id]/route.ts" app/api/beer-die/head-to-head/route.ts app/api/beer-die/record-with/route.ts app/api/hearts/route.ts "app/api/hearts/[id]/route.ts"
git commit -m "feat: add group_id filtering to all API routes"
```

---

## Task 8: Group Home Page

**Files:**
- Modify: `app/g/[slug]/page.tsx`

- [ ] **Step 1: Replace `app/g/[slug]/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

async function getRecentGames(groupId: string): Promise<RecentGame[]> {
  try {
    const supabase = createServerClient()
    const [{ data: pongGames }, { data: beerDieGames }, { data: heartsGames }] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).order('played_at', { ascending: false }).limit(10),
      supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).order('played_at', { ascending: false }).limit(10),
      supabase.from('hearts_games').select('id, played_at, hearts_game_players ( lost, users ( id, name ) )')
        .eq('group_id', groupId).order('played_at', { ascending: false }).limit(10),
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
        <h1 className="text-4xl font-black tracking-widest text-win uppercase">{group.name}</h1>
        <p className="text-slate-400 mt-2">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: `${base}/pong`, label: '🏓 Pong' },
          { href: `${base}/beer-die`, label: '🎲 Beer Die' },
          { href: `${base}/hearts`, label: '♥ Hearts' },
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

- [ ] **Step 2: Verify**

`npm run dev` → visit `http://localhost:3000/g/summer-games`. Should show the group name, game tiles, and recent games feed.

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/page.tsx"
git commit -m "feat: add group home page with recent games"
```

---

## Task 9: Group Game Pages (Pong, Beer Die, Hearts)

**Files:**
- Create: `app/g/[slug]/pong/page.tsx`
- Create: `app/g/[slug]/beer-die/page.tsx`
- Create: `app/g/[slug]/hearts/page.tsx`

- [ ] **Step 1: Create `app/g/[slug]/pong/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { PongLeaderboardEntry, PongGamePlayer, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupPongPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
  ])

  const leaderboard = computePongLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as PongGamePlayer[])

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
        <h1 className="text-2xl font-black tracking-wide mb-1">🏓 Pong</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs space-y-4">
        <HeadToHead players={(users ?? []) as User[]} game="pong" />
        <PartnerRecord players={(users ?? []) as User[]} game="pong" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/g/[slug]/beer-die/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { BeerDieLeaderboardEntry, BeerDieGamePlayer, BeerDieSink, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupBeerDiePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
  ])

  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
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
        <h1 className="text-2xl font-black tracking-wide mb-1">🎲 Beer Die</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs space-y-4">
        <HeadToHead players={(users ?? []) as User[]} game="beer-die" />
        <PartnerRecord players={(users ?? []) as User[]} game="beer-die" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/g/[slug]/hearts/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import { HeartsLeaderboardEntry, HeartsGamePlayer, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupHeartsPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
  ])

  const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])

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

- [ ] **Step 4: Verify**

`npm run dev` → visit `/g/summer-games/pong`, `/g/summer-games/beer-die`, `/g/summer-games/hearts`. All three should load leaderboards with existing data.

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/pong/page.tsx" "app/g/[slug]/beer-die/page.tsx" "app/g/[slug]/hearts/page.tsx"
git commit -m "feat: add group-scoped pong, beer-die, and hearts pages"
```

---

## Task 10: Update Client Components to Use Group Context

**Files:**
- Modify: `components/HeadToHead.tsx`
- Modify: `components/PartnerRecord.tsx`
- Modify: `components/log/PongForm.tsx`
- Modify: `components/log/BeerDieForm.tsx`
- Modify: `components/log/HeartsForm.tsx`

- [ ] **Step 1: Update `components/HeadToHead.tsx`**

Replace the `fetchH2H` function — add `useGroup()` and append `group_id` to the fetch URL:

Replace entire file:

```tsx
'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function HeadToHead({ players, currentPlayerId, game }: Props) {
  const { id: groupId } = useGroup()
  const [player1Id, setPlayer1Id] = useState(currentPlayerId ?? '')
  const [player2Id, setPlayer2Id] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchH2H = async (p1: string, p2: string) => {
    if (!p1 || !p2 || p1 === p2) { setResult(null); return }
    setLoading(true)
    const res = await fetch(`/api/${game}/head-to-head?player1=${p1}&player2=${p2}&group_id=${groupId}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handlePlayer1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer1Id(e.target.value); setResult(null); fetchH2H(e.target.value, player2Id)
  }
  const handlePlayer2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer2Id(e.target.value); setResult(null); fetchH2H(player1Id, e.target.value)
  }

  const player1Name = players.find(p => p.id === player1Id)?.name ?? ''

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Head-to-Head</p>
      {!currentPlayerId && (
        <select value={player1Id} onChange={handlePlayer1Change}
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-2 focus:outline-none focus:border-win">
          <option value="">Select player...</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <select value={player2Id} onChange={handlePlayer2Change}
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win">
        <option value="">{currentPlayerId ? 'Select opponent...' : 'vs. opponent...'}</option>
        {players.filter(p => p.id !== player1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

- [ ] **Step 2: Update `components/PartnerRecord.tsx`**

Replace entire file (same pattern as HeadToHead but calls `record-with`):

```tsx
'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function PartnerRecord({ players, currentPlayerId, game }: Props) {
  const { id: groupId } = useGroup()
  const [player1Id, setPlayer1Id] = useState(currentPlayerId ?? '')
  const [player2Id, setPlayer2Id] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRecord = async (p1: string, p2: string) => {
    if (!p1 || !p2 || p1 === p2) { setResult(null); return }
    setLoading(true)
    const res = await fetch(`/api/${game}/record-with?player1=${p1}&player2=${p2}&group_id=${groupId}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handlePlayer1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer1Id(e.target.value); setResult(null); fetchRecord(e.target.value, player2Id)
  }
  const handlePlayer2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer2Id(e.target.value); setResult(null); fetchRecord(player1Id, e.target.value)
  }

  const player1Name = players.find(p => p.id === player1Id)?.name ?? ''

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Record With</p>
      {!currentPlayerId && (
        <select value={player1Id} onChange={handlePlayer1Change}
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-2 focus:outline-none focus:border-win">
          <option value="">Select player...</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <select value={player2Id} onChange={handlePlayer2Change}
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win">
        <option value="">{currentPlayerId ? 'Select teammate...' : 'with teammate...'}</option>
        {players.filter(p => p.id !== player1Id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

- [ ] **Step 3: Update `components/log/PongForm.tsx`**

Replace entire file — add `useGroup()`, pass `group_id` in POST body, redirect to group-scoped URL:

```tsx
'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function PongForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [cupsLeft, setCupsLeft] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('Select at least 1 winner')
    if (losers.length < 1) return setError('Select at least 1 loser')
    if (cupsLeft === '' || isNaN(Number(cupsLeft)) || Number(cupsLeft) < 0)
      return setError('Enter cups left (0 or more)')
    setLoading(true)
    const res = await fetch('/api/pong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cupsLeft), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/pong` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Cups Left (winners)</label>
        <input type="number" min="0" value={cupsLeft} onChange={e => setCupsLeft(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win" placeholder="0" />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Read and update `components/log/BeerDieForm.tsx`**

Read the current file, then replace it with the same pattern — add `useGroup()`, pass `group_id` in POST body, redirect to `/g/${groupSlug}/beer-die`.

The key changes are:
1. Add `import { useGroup } from '@/lib/group-context'`
2. Add `const { id: groupId, slug: groupSlug } = useGroup()` at the top of the component
3. Add `group_id: groupId` to the POST body
4. Change the redirect from `window.location.href = '/beer-die'` to `window.location.href = `/g/${groupSlug}/beer-die``

- [ ] **Step 5: Read and update `components/log/HeartsForm.tsx`**

Same pattern as BeerDieForm — add `useGroup()`, pass `group_id` in POST body, redirect to `/g/${groupSlug}/hearts`.

- [ ] **Step 6: Verify**

`npm run dev` → visit `/g/summer-games/pong`. Head-to-head dropdowns should work. Visit `/g/summer-games/log`, submit a pong game — should log and redirect to `/g/summer-games/pong`.

- [ ] **Step 7: Commit**

```bash
git add components/HeadToHead.tsx components/PartnerRecord.tsx components/log/PongForm.tsx components/log/BeerDieForm.tsx components/log/HeartsForm.tsx
git commit -m "feat: update client components to use GroupContext for group-scoped API calls"
```

---

## Task 11: Group Players Pages

**Files:**
- Create: `app/g/[slug]/players/page.tsx`
- Create: `app/g/[slug]/players/[name]/page.tsx`

- [ ] **Step 1: Create `app/g/[slug]/players/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { User } from '@/lib/types'
import { notFound } from 'next/navigation'
import AddPlayerForm from '@/components/AddPlayerForm'

export default async function GroupPlayersPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name').eq('group_id', group.id).order('name')

  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {(players ?? []).map((p: Pick<User, 'id' | 'name'>) => (
          <Link key={p.id} href={`/g/${params.slug}/players/${encodeURIComponent(p.name)}`}
            className="bg-card rounded-lg p-4 text-center hover:bg-slate-700 transition-colors">
            <p className="font-bold text-white">{p.name}</p>
          </Link>
        ))}
      </div>
      <AddPlayerForm groupId={group.id} groupSlug={params.slug} />
    </div>
  )
}
```

- [ ] **Step 2: Create `components/AddPlayerForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddPlayerForm({ groupId, groupSlug }: { groupId: string; groupSlug: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setName('')
    router.refresh()
  }

  return (
    <div className="bg-card rounded-lg p-6 max-w-sm">
      <h2 className="font-bold mb-4">Add New Player</h2>
      <form onSubmit={submit} className="flex gap-3">
        <input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white flex-1 focus:outline-none focus:border-win text-sm" />
        <button type="submit" disabled={loading}
          className="bg-win text-black font-bold px-4 py-2 rounded hover:bg-green-400 transition-colors text-sm disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="text-loss text-sm mt-2">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/g/[slug]/players/[name]/page.tsx`**

```tsx
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard } from '@/lib/stats'
import HeadToHead from '@/components/HeadToHead'
import { User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: pongPlayers }, { data: beerDiePlayers }, { data: sinks }, { data: heartsPlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
  ])

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDiePlayers as unknown as BeerDieGamePlayer[], (sinks ?? []) as BeerDieSink[])
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

- [ ] **Step 4: Verify**

`npm run dev` → visit `/g/summer-games/players`. Should show player grid. Click a player to see their profile with stats.

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/players/page.tsx" "app/g/[slug]/players/[name]/page.tsx" components/AddPlayerForm.tsx
git commit -m "feat: add group players pages and AddPlayerForm component"
```

---

## Task 12: Group Log Page

**Files:**
- Create: `app/g/[slug]/log/page.tsx`

- [ ] **Step 1: Create `app/g/[slug]/log/page.tsx`**

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
      <p className="text-slate-400 text-sm mb-8">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Verify**

`npm run dev` → visit `/g/summer-games/log`. Tabs should render. Submit a game — should succeed and redirect to the leaderboard page.

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/log/page.tsx"
git commit -m "feat: add group log page"
```

---

## Task 13: Group Admin Page

**Files:**
- Create: `app/g/[slug]/admin/page.tsx`
- Modify: `components/admin/AdminPanel.tsx`
- Modify: `components/admin/EditPongGame.tsx`
- Modify: `components/admin/EditBeerDieGame.tsx`
- Modify: `components/admin/EditHeartsGame.tsx`

- [ ] **Step 1: Create `app/g/[slug]/admin/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { User } from '@/lib/types'
import { notFound } from 'next/navigation'
import { AdminPongGame, AdminBeerDieGame, AdminHeartsGame } from '@/components/admin/AdminPanel'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: pongGamesRaw }, { data: pongPlayers },
    { data: beerDieGamesRaw }, { data: beerDiePlayers },
    { data: heartsGamesRaw }, { data: heartsPlayers },
    { data: users },
  ] = await Promise.all([
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('pong_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('beer_die_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
  ])

  const pongGames: AdminPongGame[] = (pongGamesRaw ?? []).map((g: any) => {
    const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
    return { id: g.id, cups_left: g.cups_left, played_at: g.played_at,
      winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
      loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
  })
  const beerDieGames: AdminBeerDieGame[] = (beerDieGamesRaw ?? []).map((g: any) => {
    const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
    return { id: g.id, points_differential: g.points_differential, played_at: g.played_at,
      winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
      loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
  })
  const heartsGames: AdminHeartsGame[] = (heartsGamesRaw ?? []).map((g: any) => ({
    id: g.id, played_at: g.played_at,
    game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
  }))

  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-1">⚙️ Admin</h1>
      <p className="text-slate-400 text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={pongGames} beerDieGames={beerDieGames} heartsGames={heartsGames}
        players={(users ?? []) as User[]}
        groupPin={group.pin} groupId={group.id} groupSlug={params.slug}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update `components/admin/AdminPanel.tsx`**

Replace the hardcoded `ADMIN_PASSWORD` with the `groupPin` prop, and add `groupId` and `groupSlug` props. Pass them to the Edit components. Replace entire file:

```tsx
'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditHeartsGame from './EditHeartsGame'

export type AdminPongGame = {
  id: string; cups_left: number; played_at: string; winner_ids: string[]; loser_ids: string[]
}
export type AdminBeerDieGame = {
  id: string; winner_ids: string[]; loser_ids: string[]; points_differential: number; played_at: string
}
export type AdminHeartsGame = {
  id: string; played_at: string; game_players: { player_id: string; lost: boolean }[]
}

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]; beerDieGames: AdminBeerDieGame[]; heartsGames: AdminHeartsGame[]
  players: User[]; groupPin: string; groupId: string; groupSlug: string
}

export default function AdminPanel({ pongGames, beerDieGames, heartsGames, players, groupPin, groupId, groupSlug }: Props) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(`admin_authed_${groupSlug}`) === '1') setAuthed(true)
  }, [groupSlug])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === groupPin) {
      sessionStorage.setItem(`admin_authed_${groupSlug}`, '1')
      setAuthed(true)
    } else {
      setPinError(true); setPin('')
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
          <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinError(false) }}
            className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-win"
            placeholder="••••" autoFocus />
        </div>
        {pinError && <p className="text-loss text-sm">Incorrect PIN</p>}
        <button type="submit" className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 transition-colors">Unlock</button>
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
                    <button onClick={() => setEditingId(isEditing ? null : id)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                      {isEditing ? 'Close' : '✏️ Edit'}
                    </button>
                    <button onClick={() => setConfirmDeleteId(id)}
                      className="text-xs text-slate-400 hover:text-loss px-2 py-1 rounded hover:bg-slate-700 transition-colors">
                      🗑 Delete
                    </button>
                  </>
                )}
                {isConfirmingDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sure?</span>
                    <button onClick={() => handleDelete(g.kind, id)} disabled={deleteLoading}
                      className="text-xs font-bold bg-loss text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50">Yes</button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600">Cancel</button>
                  </div>
                )}
              </div>
            </div>
            {isEditing && g.kind === 'pong' && (
              <EditPongGame game={g.data as AdminPongGame} players={players} groupId={groupId} groupSlug={groupSlug}
                onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
            )}
            {isEditing && g.kind === 'beer-die' && (
              <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} groupId={groupId} groupSlug={groupSlug}
                onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
            )}
            {isEditing && g.kind === 'hearts' && (
              <EditHeartsGame game={g.data as AdminHeartsGame} players={players} groupId={groupId} groupSlug={groupSlug}
                onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Read `components/admin/EditPongGame.tsx` then update it**

Read the current file. Then add `groupId: string` and `groupSlug: string` to the Props type. The `onSave` and `onCancel` props are already there. In the `save` function, add `group_id: groupId` to the PUT request body.

The key changes to `EditPongGame.tsx`:
1. Add `groupId: string; groupSlug: string` to Props
2. Add `group_id: groupId` to the PUT body: `body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cups), group_id: groupId })`

- [ ] **Step 4: Read `components/admin/EditBeerDieGame.tsx` then update it**

Same pattern: add `groupId` and `groupSlug` to Props, add `group_id: groupId` to the PUT body.

- [ ] **Step 5: Read `components/admin/EditHeartsGame.tsx` then update it**

Same pattern: add `groupId` and `groupSlug` to Props, add `group_id: groupId` to the PUT body (hearts edit sends `game_players` array — include `group_id` in the body alongside it).

- [ ] **Step 6: Verify**

`npm run dev` → visit `/g/summer-games/admin`. PIN gate should work. Edit and delete should work.

- [ ] **Step 7: Commit**

```bash
git add "app/g/[slug]/admin/page.tsx" components/admin/AdminPanel.tsx components/admin/EditPongGame.tsx components/admin/EditBeerDieGame.tsx components/admin/EditHeartsGame.tsx
git commit -m "feat: add group admin page with per-group PIN"
```

---

## Task 14: OG Images

**Files:**
- Create: `app/g/[slug]/pong/opengraph-image.tsx`
- Create: `app/g/[slug]/beer-die/opengraph-image.tsx`
- Create: `app/g/[slug]/hearts/opengraph-image.tsx`

- [ ] **Step 1: Create `app/g/[slug]/pong/opengraph-image.tsx`**

```tsx
import { ImageResponse } from 'next/og'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { PongGamePlayer, User } from '@/lib/types'

export const alt = 'Pong Leaderboard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group?.id ?? '').order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group?.id ?? ''),
  ])
  const lb = computePongLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as PongGamePlayer[])
  const top3 = lb.slice(0, 3)

  return new ImageResponse(
    <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 60, fontFamily: 'sans-serif' }}>
      <div style={{ color: '#22c55e', fontSize: 28, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
        {group?.name ?? 'Summer Games'}
      </div>
      <div style={{ color: 'white', fontSize: 56, fontWeight: 900, marginBottom: 48 }}>🏓 Pong Leaderboard</div>
      <div style={{ display: 'flex', gap: 32 }}>
        {top3.map((p, i) => (
          <div key={p.player_id} style={{ background: '#1e293b', borderRadius: 16, padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 200 }}>
            <div style={{ color: i === 0 ? '#f59e0b' : '#94a3b8', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>#{i + 1}</div>
            <div style={{ color: 'white', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
            <div style={{ color: '#22c55e', fontSize: 20 }}>{(p.win_rate * 100).toFixed(0)}% win rate</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/g/[slug]/beer-die/opengraph-image.tsx`**

Same structure as pong — swap `computePongLeaderboard` for `computeBeerDieLeaderboard`, query `beer_die_game_players` instead of `pong_game_players`, change the title to "🎲 Beer Die Leaderboard". The data shape for the leaderboard is the same (has `win_rate`).

- [ ] **Step 3: Create `app/g/[slug]/hearts/opengraph-image.tsx`**

Same structure — swap `computePongLeaderboard` for `computeHeartsLeaderboard`, query `hearts_game_players`, change title to "♥ Hearts Leaderboard". Sort by `loss_rate` ascending and show top 3 best players.

- [ ] **Step 4: Verify**

Visit `/g/summer-games/pong` and share the URL in iMessage or Discord. The preview card should show the leaderboard. Alternatively, test directly at `/g/summer-games/pong/opengraph-image`.

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/pong/opengraph-image.tsx" "app/g/[slug]/beer-die/opengraph-image.tsx" "app/g/[slug]/hearts/opengraph-image.tsx"
git commit -m "feat: add OG image cards for leaderboard sharing"
```

---

## Task 15: Redirects from Old Routes

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Add redirects to `next.config.mjs`**

Replace entire file:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: '/pong', destination: '/g/summer-games/pong', permanent: false },
      { source: '/beer-die', destination: '/g/summer-games/beer-die', permanent: false },
      { source: '/hearts', destination: '/g/summer-games/hearts', permanent: false },
      { source: '/players', destination: '/g/summer-games/players', permanent: false },
      { source: '/players/:name', destination: '/g/summer-games/players/:name', permanent: false },
      { source: '/log', destination: '/g/summer-games/log', permanent: false },
      { source: '/admin', destination: '/g/summer-games/admin', permanent: false },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: Verify**

`npm run dev` → visit `http://localhost:3000/pong`. Should redirect to `/g/summer-games/pong`.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "feat: add redirects from old single-tenant routes to summer-games group"
```

---

## Final Verification Checklist

Before considering this complete, verify end-to-end:

- [ ] `http://localhost:3000` shows the landing page with "Create Your Group" and "See an Example" buttons
- [ ] `/create` — fill in a test group (e.g. name: "Test Crew", PIN: 1234, add 2 players) — should redirect to `/g/test-crew`
- [ ] `/g/test-crew` — shows group home with the new group name and empty recent games
- [ ] `/g/test-crew/pong` — shows empty leaderboard
- [ ] `/g/test-crew/log` — log a pong game — should redirect to `/g/test-crew/pong` and show the new entry
- [ ] `/g/summer-games` — existing data from Giles's group should still show correctly
- [ ] `/g/summer-games/admin` — PIN `1111` should unlock admin panel; edit and delete should work
- [ ] `/pong` — should redirect to `/g/summer-games/pong`
- [ ] Head-to-head on `/g/summer-games/pong` should work
- [ ] OG image visible at `/g/summer-games/pong/opengraph-image`
- [ ] Two groups' data is fully isolated (test group's log page only shows test group's players)
