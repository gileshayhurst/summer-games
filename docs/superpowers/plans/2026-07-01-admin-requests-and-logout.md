# Admin Requests & Log Out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an existing group member request admin status from the (currently role-gated) admin page, let the group owner approve/deny those requests at the top of the admin page, and add a Log Out button to the My Stats page.

**Architecture:** One new nullable column (`group_members.admin_requested_at`) tracks a pending request. `app/g/[slug]/admin/page.tsx` branches on the viewer's role instead of 404ing non-admins outright. A new self-service API route lets a member set their own flag; the existing members PATCH route (already owner-gated for role changes) is extended to clear it on approve/deny. Log Out is a small client component reusing the existing browser Supabase client pattern.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + Auth), TypeScript, Jest (existing `lib/*` unit tests only — this codebase does not unit-test API routes or components, so this plan follows that convention and relies on `tsc` + manual review).

**Spec:** [docs/superpowers/specs/2026-07-01-admin-requests-and-logout-design.md](../specs/2026-07-01-admin-requests-and-logout-design.md)

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260701_admin_requests.sql` |
| Modify | `lib/types.ts` |
| Modify | `lib/auth.ts` |
| Modify | `app/api/groups/[id]/members/[userId]/route.ts` |
| Create | `app/api/groups/[id]/request-admin/route.ts` |
| Create | `components/admin/RequestAdminStatus.tsx` |
| Create | `components/admin/AdminRequestsList.tsx` |
| Modify | `app/g/[slug]/admin/page.tsx` |
| Create | `components/LogOutButton.tsx` |
| Modify | `app/g/[slug]/me/page.tsx` |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260701_admin_requests.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- A member can ask the group owner to promote them to admin. NULL = no
-- pending request. Set = pending. Cleared back to NULL on approve or deny
-- (approve also sets role = 'admin' in the same update).
ALTER TABLE group_members ADD COLUMN admin_requested_at TIMESTAMPTZ;
```

- [ ] **Step 2: Run the migration in Supabase**

Go to your Supabase project → SQL Editor → paste the file contents → Run.

Expected: No errors. `admin_requested_at` appears as a column on `group_members` in Table Editor.

- [ ] **Step 3: Verify**

In Supabase SQL Editor run:

```sql
SELECT admin_requested_at FROM group_members LIMIT 1;
```

Expected: Query succeeds (column exists), value is `null` for existing rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260701_admin_requests.sql
git commit -m "feat: add admin_requested_at column to group_members"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `lib/types.ts:256-263`

- [ ] **Step 1: Add `admin_requested_at` to the `GroupMember` type**

In `lib/types.ts`, replace:

```typescript
export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: GroupMemberRole
  player_id: string | null
  joined_at: string
}
```

With:

```typescript
export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: GroupMemberRole
  player_id: string | null
  joined_at: string
  admin_requested_at: string | null
}
```

`MemberWithProfile` (directly below) extends `GroupMember`, so it picks up the new field automatically — no change needed there.

- [ ] **Step 2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new errors. `lib/auth.ts` only ever constructs `GroupMember` values via `as GroupMember` casts on untyped Supabase query results (never an object literal checked structurally against the type), so the new field is additive and safe.

- [ ] **Step 3: Run existing tests**

```bash
npx jest __tests__/lib/auth.test.ts
```

Expected: All tests still pass (the test file's mocks use their own local, structurally looser type for member objects — not `GroupMember` — so they're unaffected).

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add admin_requested_at to GroupMember type"
```

---

## Task 3: Remove unused `requireRole` from lib/auth.ts

**Files:**
- Modify: `lib/auth.ts:22-25` (RoleResult type), `lib/auth.ts:110-115` (requireRole function)

The admin page (Task 8) will call `requireMembership` directly and branch on role itself, so `requireRole` and its `RoleResult` type become dead code. Removing now, before the admin page is rewired, keeps `lib/auth.ts` clean without a dangling unused export in between.

- [ ] **Step 1: Remove the `RoleResult` type**

In `lib/auth.ts`, delete:

```typescript
export type RoleResult = {
  group: GroupInfo
  member: GroupMember
}
```

- [ ] **Step 2: Remove the `requireRole` function**

In `lib/auth.ts`, delete:

```typescript
// Use on pages/routes that require admin or owner role
export async function requireRole(slug: string, allowedRoles: GroupMemberRole[]): Promise<RoleResult> {
  const { group, member } = await requireMembership(slug)
  if (!member || !allowedRoles.includes(member.role)) notFound()
  return { group, member }
}
```

- [ ] **Step 3: Verify no remaining references**

```bash
grep -rn "requireRole\|RoleResult" --include="*.ts" --include="*.tsx" app components lib
```

Expected: No output. (`app/g/[slug]/admin/page.tsx` still imports `requireRole` at this point in the plan — that's fixed in Task 8. If you run this check now, it's expected to show that one remaining import; the check is here as a reminder to re-run once Task 8 is done, not a blocker for this task's commit.)

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts
git commit -m "refactor: remove unused requireRole/RoleResult"
```

---

## Task 4: Extend members PATCH route for approve/deny

**Files:**
- Modify: `app/api/groups/[id]/members/[userId]/route.ts:6-46`

- [ ] **Step 1: Update the `PATCH` handler**

In `app/api/groups/[id]/members/[userId]/route.ts`, replace the `PATCH` function body:

```typescript
// PATCH /api/groups/[id]/members/[userId] — update role or player_id (requires admin/owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.role !== undefined) {
    if (!['member', 'admin'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    // Only owner can promote/demote
    if (requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 })
    }
    update.role = body.role
    // A role change (promote or demote) makes any pending admin request stale.
    update.admin_requested_at = null
  }

  if ('admin_requested_at' in body) {
    if (body.admin_requested_at !== null) {
      return NextResponse.json({ error: 'Invalid admin_requested_at' }, { status: 400 })
    }
    // Only owner can deny a pending admin request
    if (requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can deny admin requests' }, { status: 403 })
    }
    update.admin_requested_at = null
  }

  if ('player_id' in body) {
    update.player_id = body.player_id ?? null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .update(update)
    .eq('group_id', params.id)
    .eq('user_id', params.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

(The `DELETE` handler below it is unchanged.)

This single route now handles both actions the owner takes on a pending request:
- **Approve** → caller sends `{ role: 'admin' }` (already existed) — now also clears `admin_requested_at`.
- **Deny** → caller sends `{ admin_requested_at: null }` — owner-gated the same way role changes are.

- [ ] **Step 2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/groups/[id]/members/[userId]/route.ts"
git commit -m "feat: support approving/denying admin requests via members PATCH route"
```

---

## Task 5: Self-service request-admin API route

**Files:**
- Create: `app/api/groups/[id]/request-admin/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

// POST /api/groups/[id]/request-admin — a member requests admin status for themselves
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const member = await getMemberForAPI(params.id)
  if (!member) {
    return NextResponse.json({ error: 'Membership required' }, { status: 403 })
  }
  if (member.role !== 'member') {
    return NextResponse.json({ error: 'Already admin or owner' }, { status: 400 })
  }
  if (member.admin_requested_at) {
    return NextResponse.json({ error: 'Request already pending' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .update({ admin_requested_at: new Date().toISOString() })
    .eq('group_id', params.id)
    .eq('user_id', member.user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/api/groups/[id]/request-admin/route.ts"
git commit -m "feat: add self-service request-admin API route"
```

---

## Task 6: RequestAdminStatus component

**Files:**
- Create: `components/admin/RequestAdminStatus.tsx`

This is the screen a `member`-role visitor sees instead of the admin panel. It handles both states (no request yet / pending) in one client component so the "Request Admin Status" button can flip the view without a full page reload.

- [ ] **Step 1: Write the component**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RequestAdminStatus({
  groupId,
  slug,
  initialPending,
}: {
  groupId: string
  slug: string
  initialPending: boolean
}) {
  const [pending, setPending] = useState(initialPending)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestAdmin = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/request-admin`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPending(true)
  }

  return (
    <div className="max-w-sm mx-auto text-center py-16 space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight text-stone-900">
        {pending ? 'Your request is pending' : "You don't have admin access"}
      </h1>
      <p className="text-muted text-sm">
        {pending
          ? 'The group owner will review your request soon.'
          : 'Ask the group owner to make you an admin, or request it yourself.'}
      </p>
      {error && <p className="text-loss text-sm">{error}</p>}
      {!pending && (
        <button
          onClick={requestAdmin}
          disabled={loading}
          className="bg-win text-white text-xs font-black px-6 py-3 rounded-full uppercase tracking-wide hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Requesting…' : 'Request Admin Status'}
        </button>
      )}
      <div>
        <Link href={`/g/${slug}`} className="text-sm font-bold text-win hover:text-orange-400">
          ← Back to group
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/RequestAdminStatus.tsx
git commit -m "feat: add RequestAdminStatus component"
```

---

## Task 7: AdminRequestsList component

**Files:**
- Create: `components/admin/AdminRequestsList.tsx`

Styled after the existing `components/admin/SuggestionsList.tsx` (hides entirely when empty, count badge) and `components/admin/MembersTab.tsx` (per-row loading/error state, PATCH fetch pattern).

- [ ] **Step 1: Write the component**

```tsx
'use client'
import { useState } from 'react'

type Request = {
  user_id: string
  profiles: { display_name: string } | null
  users: { name: string } | null
}

export default function AdminRequestsList({
  initial,
  groupId,
}: {
  initial: Request[]
  groupId: string
}) {
  const [requests, setRequests] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const respond = async (userId: string, body: Record<string, unknown>) => {
    setLoading(userId)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error); return }
    setRequests(prev => prev.filter(r => r.user_id !== userId))
  }

  if (requests.length === 0) return null

  return (
    <div className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-4">
        Admin Requests
        <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
      </h2>
      {error && <p className="text-loss text-sm mb-2">{error}</p>}
      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.user_id} className="bg-card rounded-xl border border-warm px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-stone-900">{r.profiles?.display_name ?? 'Unknown'}</p>
              <p className="text-xs text-muted mt-0.5">
                Player: {r.users?.name ?? <span className="italic">unclaimed</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => respond(r.user_id, { role: 'admin' })}
                disabled={loading === r.user_id}
                className="text-[10px] font-black px-3 py-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => respond(r.user_id, { admin_requested_at: null })}
                disabled={loading === r.user_id}
                className="text-[10px] font-black px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminRequestsList.tsx
git commit -m "feat: add AdminRequestsList component"
```

---

## Task 8: Wire up the admin page

**Files:**
- Modify: `app/g/[slug]/admin/page.tsx`

- [ ] **Step 1: Replace the imports and function signature**

At the top of `app/g/[slug]/admin/page.tsx`, replace:

```tsx
export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import SuggestionsList from '@/components/admin/SuggestionsList'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame, AdminPokerGame } from '@/app/admin/page'
import { User } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireRole(params.slug, ['admin', 'owner'])

  const supabase = createServerClient()
```

With:

```tsx
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import SuggestionsList from '@/components/admin/SuggestionsList'
import AdminRequestsList from '@/components/admin/AdminRequestsList'
import RequestAdminStatus from '@/components/admin/RequestAdminStatus'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame, AdminPokerGame } from '@/app/admin/page'
import { User, MemberWithProfile } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireMembership(params.slug)

  if (!member) notFound()

  if (member.role === 'member') {
    return (
      <RequestAdminStatus
        groupId={group.id}
        slug={params.slug}
        initialPending={!!member.admin_requested_at}
      />
    )
  }

  const supabase = createServerClient()
```

This restores the exact 404 behavior for non-members (private groups already 404 inside `requireMembership`; public groups where the visitor hasn't joined get `member === null` here and still 404), while giving `role === 'member'` visitors the new request screen instead of a 404, and leaving `admin`/`owner` visitors on the unchanged path below.

- [ ] **Step 2: Compute pending requests and render the new list**

In the same file, find this line (in the return statement, just before `<SuggestionsList initial={suggestions} />`):

```tsx
  const suggestions = (suggestionsRaw ?? []) as { id: string; name: string | null; email: string | null; game_suggestion: string | null; feedback: string | null; created_at: string }[]

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Manage your group.</p>
      <SuggestionsList initial={suggestions} />
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        cornholeGames={assembleCornhole(cornholeGamesRaw ?? [])}
        spikeballGames={assembleSpikeball(spikeballGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        poolGames={assemblePool(poolGamesRaw ?? [])}
        pokerGames={assemblePoker(pokerGamesRaw ?? [])}
        players={(users ?? []) as User[]}
        members={(membersRaw ?? []) as any}
        groupId={group.id}
        groupSlug={group.slug}
        visibility={group.visibility}
        joinCode={group.join_code}
        currentUserRole={member.role}
      />
    </div>
  )
}
```

Replace it with:

```tsx
  const suggestions = (suggestionsRaw ?? []) as { id: string; name: string | null; email: string | null; game_suggestion: string | null; feedback: string | null; created_at: string }[]
  const members = (membersRaw ?? []) as MemberWithProfile[]
  const pendingRequests = member.role === 'owner' ? members.filter(m => m.admin_requested_at) : []

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Manage your group.</p>
      <AdminRequestsList initial={pendingRequests} groupId={group.id} />
      <SuggestionsList initial={suggestions} />
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        cornholeGames={assembleCornhole(cornholeGamesRaw ?? [])}
        spikeballGames={assembleSpikeball(spikeballGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        poolGames={assemblePool(poolGamesRaw ?? [])}
        pokerGames={assemblePoker(pokerGamesRaw ?? [])}
        players={(users ?? []) as User[]}
        members={members}
        groupId={group.id}
        groupSlug={group.slug}
        visibility={group.visibility}
        joinCode={group.join_code}
        currentUserRole={member.role}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify no remaining `requireRole` references**

```bash
grep -rn "requireRole\|RoleResult" --include="*.ts" --include="*.tsx" app components lib
```

Expected: No output.

- [ ] **Step 4: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/admin/page.tsx"
git commit -m "feat: gate admin page on role, add request-admin and admin-requests flows"
```

---

## Task 9: Log Out button

**Files:**
- Create: `components/LogOutButton.tsx`
- Modify: `app/g/[slug]/me/page.tsx:169-173`

- [ ] **Step 1: Write `components/LogOutButton.tsx`**

```tsx
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function LogOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const logOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={logOut}
      disabled={loading}
      className="text-xs font-black px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors shrink-0"
    >
      {loading ? 'Logging Out…' : 'Log Out'}
    </button>
  )
}
```

- [ ] **Step 2: Add it to the My Stats page header**

In `app/g/[slug]/me/page.tsx`, add the import near the top (alongside the other component imports):

```tsx
import StatCard from '@/components/StatCard'
import GameIcon from '@/components/icons/GameIcon'
import LogOutButton from '@/components/LogOutButton'
```

Then replace:

```tsx
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
        <p className="text-muted text-sm">Signed in as {playerName}</p>
      </div>
```

With:

```tsx
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
          <p className="text-muted text-sm">Signed in as {playerName}</p>
        </div>
        <LogOutButton />
      </div>
```

- [ ] **Step 3: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Run the full test suite**

```bash
npx jest
```

Expected: All tests pass (no test covers the new UI components/routes, consistent with this codebase's existing convention of only unit-testing `lib/*` pure logic — but this confirms nothing in `lib/` regressed).

- [ ] **Step 5: Commit**

```bash
git add components/LogOutButton.tsx "app/g/[slug]/me/page.tsx"
git commit -m "feat: add Log Out button to My Stats page"
```

---

## Self-Review

**Spec coverage:**
- Scope (existing members only) → Task 8, Step 1 (`if (!member) notFound()` before the role branch).
- Data model → Task 1.
- Admin page gating (3-way branch) → Task 8.
- Request Admin / Request Pending screens → Task 6 (`RequestAdminStatus`, single stateful component covering both).
- Self-service request API → Task 5.
- Owner-side approval UI → Task 7.
- Approve/deny via existing PATCH route → Task 4.
- Log Out → Task 9.

**Placeholder scan:** No TBD/TODO markers; every step has complete, runnable code.

**Type consistency:** `GroupMember`/`MemberWithProfile` (Task 2) → consumed identically in the members route (Task 4), request-admin route (Task 5), and admin page (Task 8) as `admin_requested_at: string | null`. `AdminRequestsList`'s `Request` type (Task 7) matches the shape of `MemberWithProfile` filtered in Task 8 (`user_id`, `profiles.display_name`, `users.name`). Route paths match: `RequestAdminStatus` (Task 6) posts to `/api/groups/${groupId}/request-admin`, matching the route created in Task 5; `AdminRequestsList` (Task 7) patches `/api/groups/${groupId}/members/${userId}`, matching Task 4.
