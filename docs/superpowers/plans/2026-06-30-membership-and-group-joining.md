# Membership & Group Joining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sign in with Google, a real membership model (group_members table), public/private group visibility, a join-by-code/link flow, a public group directory, and role-based admin access — replacing the existing 4-digit PIN gate.

**Architecture:** Supabase Auth (Google provider) supplies identity. A new `profiles` table (auto-created by DB trigger) and `group_members` join table store who belongs to which groups. App-layer guards in `lib/auth.ts` enforce visibility and role requirements in every page layout and API route. All existing game logic and tables are unchanged.

**Tech Stack:** Next.js 14 App Router, `@supabase/ssr`, Supabase Auth (Google), Tailwind CSS, TypeScript

---

## ⚠️ Manual prerequisites (do before Task 1)

1. **Create a Google OAuth app** — Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID. Set the application type to "Web application". No paid account needed.
2. **Add Authorized Redirect URI in Google** — In your OAuth client, add: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. **Enable Google provider in Supabase** — Dashboard → Authentication → Providers → Google → enter your Client ID and Client Secret → Save.

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260630_membership.sql` |
| Modify | `.env.local.example` + `.env.local` |
| Modify | `lib/types.ts` |
| Create | `lib/join-code.ts` |
| Create | `__tests__/join-code.test.ts` |
| Modify | `lib/supabase-server.ts` |
| Create | `lib/auth.ts` |
| Create | `app/auth/callback/route.ts` |
| Create | `components/AuthProvider.tsx` |
| Modify | `app/layout.tsx` |
| Create | `app/signin/page.tsx` |
| Modify | `app/api/groups/route.ts` |
| Create | `app/api/join/[code]/route.ts` |
| Create | `app/api/groups/[id]/members/route.ts` |
| Create | `app/api/groups/[id]/members/[userId]/route.ts` |
| Create | `app/api/groups/[id]/settings/route.ts` |
| Modify | `app/api/pong/route.ts` |
| Modify | `app/api/beer-die/route.ts` |
| Modify | `app/api/hearts/route.ts` |
| Modify | `app/api/cornhole/route.ts` |
| Modify | `app/api/spikeball/route.ts` |
| Modify | `app/api/pool/route.ts` |
| Modify | `app/api/poker/route.ts` |
| Create | `app/join/[code]/page.tsx` |
| Modify | `app/create/page.tsx` |
| Create | `app/discover/page.tsx` |
| Modify | `lib/group-context.tsx` |
| Modify | `components/GroupProvider.tsx` |
| Modify | `app/g/[slug]/layout.tsx` |
| Modify | `app/g/[slug]/page.tsx` |
| Create | `app/g/[slug]/claim/page.tsx` |
| Create | `components/admin/MembersTab.tsx` |
| Create | `components/admin/GroupSettingsTab.tsx` |
| Modify | `components/admin/AdminPanel.tsx` |
| Modify | `app/g/[slug]/admin/page.tsx` |
| Modify | `app/page.tsx` |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260630_membership.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- profiles: one row per Supabase auth user (auto-created by trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: create profile automatically on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- group_members: who belongs to which group
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id),
  UNIQUE (group_id, player_id)
);

-- Add membership columns to groups
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Generate join codes for any existing groups that don't have one
UPDATE groups
SET join_code = UPPER(SUBSTRING(MD5(id::TEXT || RANDOM()::TEXT), 1, 6))
WHERE join_code IS NULL;

-- Now make join_code required
ALTER TABLE groups ALTER COLUMN join_code SET NOT NULL;
```

- [ ] **Step 2: Run the migration in Supabase**

Go to your Supabase project → SQL Editor → paste the file contents → Run.

Expected: No errors. Tables `profiles` and `group_members` appear in Table Editor.

- [ ] **Step 3: Verify**

In Supabase SQL Editor run:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'groups' AND column_name IN ('visibility','join_code','owner_id');
```
Expected: 3 rows returned.

---

## Task 2: Install @supabase/ssr and update env vars

**Files:**
- Modify: `.env.local.example`
- Modify: `.env.local`

- [ ] **Step 1: Install the package**

```bash
npm install @supabase/ssr
```

Expected: `@supabase/ssr` appears in `package.json` dependencies.

- [ ] **Step 2: Update `.env.local.example`**

Replace the file entirely:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_URL=http://localhost:3000
```

- [ ] **Step 3: Update your local `.env.local`**

Add these two lines (values from Supabase Dashboard → Project Settings → API):
```
NEXT_PUBLIC_SUPABASE_URL=<same value as SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / public key from dashboard>
```

- [ ] **Step 4: Commit**

```bash
git add .env.local.example package.json package-lock.json
git commit -m "feat: install @supabase/ssr, add anon key env vars"
```

---

## Task 3: Update TypeScript types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add new types to the bottom of `lib/types.ts`**

```typescript
export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export type GroupMemberRole = 'owner' | 'admin' | 'member'

export type GroupMember = {
  id: string
  group_id: string
  user_id: string
  role: GroupMemberRole
  player_id: string | null
  joined_at: string
}

export type MemberWithProfile = GroupMember & {
  profiles: { display_name: string; avatar_url: string | null }
  users: { name: string } | null
}
```

- [ ] **Step 2: Update the `Group` type at the top of `lib/types.ts`**

Replace:
```typescript
export type Group = {
  id: string
  slug: string
  name: string
  pin: string
  premium: boolean
  created_at: string
}
```

With:
```typescript
export type Group = {
  id: string
  slug: string
  name: string
  pin: string
  premium: boolean
  created_at: string
  visibility: 'public' | 'private'
  join_code: string
  owner_id: string | null
}
```

- [ ] **Step 3: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new errors (the new fields are additive; existing code that doesn't use them is unaffected).

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Profile, GroupMember, MemberWithProfile types; extend Group"
```

---

## Task 4: Join code utility and tests

**Files:**
- Create: `lib/join-code.ts`
- Create: `__tests__/join-code.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `__tests__/join-code.test.ts`:

```typescript
import { generateJoinCode } from '@/lib/join-code'

describe('generateJoinCode', () => {
  it('returns a string of length 6 by default', () => {
    expect(generateJoinCode()).toHaveLength(6)
  })

  it('uses only unambiguous uppercase alphanumeric characters', () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 50; i++) {
      expect(generateJoinCode()).toMatch(allowed)
    }
  })

  it('generates different codes across calls', () => {
    const codes = new Set(Array.from({ length: 30 }, () => generateJoinCode()))
    expect(codes.size).toBeGreaterThan(20)
  })

  it('respects a custom length', () => {
    expect(generateJoinCode(8)).toHaveLength(8)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx jest __tests__/join-code.test.ts
```

Expected: `Cannot find module '@/lib/join-code'`

- [ ] **Step 3: Implement `lib/join-code.ts`**

```typescript
// Excludes 0/O/1/I to avoid visual ambiguity
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
npx jest __tests__/join-code.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/join-code.ts __tests__/join-code.test.ts
git commit -m "feat: add join code generator with tests"
```

---

## Task 5: Auth utilities

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServerClient } from './supabase-server'
import type { GroupMember, GroupMemberRole, MemberWithProfile } from './types'

type GroupInfo = {
  id: string
  slug: string
  name: string
  visibility: string
  join_code: string
  owner_id: string | null
}

export type MembershipResult = {
  group: GroupInfo
  member: GroupMember | null
  isPublic: boolean
}

export type RoleResult = {
  group: GroupInfo
  member: GroupMember
}

function createCookieClient() {
  const cookieStore = cookies()
  return createSSRClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getCurrentUser() {
  const { data: { user } } = await createCookieClient().auth.getUser()
  return user ?? null
}

// Use in page layouts and server pages under /g/[slug]/
// - Returns group + membership for members
// - Returns group + null member for public groups (non-members can view)
// - Returns 404 for private groups when not a member
export async function requireMembership(slug: string): Promise<MembershipResult> {
  const supabase = createServerClient()
  const user = await getCurrentUser()

  const { data: group } = await supabase
    .from('groups')
    .select('id, slug, name, visibility, join_code, owner_id')
    .eq('slug', slug)
    .single()

  if (!group) notFound()

  let member: GroupMember | null = null
  if (user) {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()
    member = (data as GroupMember) ?? null
  }

  if (group.visibility === 'private' && !member) notFound()

  return { group, member, isPublic: group.visibility === 'public' }
}

// Use on pages/routes that require admin or owner role
export async function requireRole(slug: string, allowedRoles: GroupMemberRole[]): Promise<RoleResult> {
  const { group, member } = await requireMembership(slug)
  if (!member || !allowedRoles.includes(member.role)) notFound()
  return { group, member }
}

// Use in POST API routes — returns null if unauthenticated or not a member
export async function getMemberForAPI(groupId: string): Promise<GroupMember | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = createServerClient()
  const { data } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  return (data as GroupMember) ?? null
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: auth utilities — getCurrentUser, requireMembership, requireRole, getMemberForAPI"
```

---

## Task 6: Auth callback route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create `app/auth/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_failed`)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add auth callback route for Google OAuth"
```

---

## Task 7: AuthProvider and root layout

**Files:**
- Create: `components/AuthProvider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `components/AuthProvider.tsx`**

```tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

type AuthContextValue = { user: User | null; loading: boolean }
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
```

- [ ] **Step 2: Update `app/layout.tsx`**

Replace the file entirely:

```tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1A4731' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Garage League',
  description: "Track your friend group's game results",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/AuthProvider.tsx app/layout.tsx
git commit -m "feat: add AuthProvider client wrapper to root layout"
```

---

## Task 8: Sign-in page

**Files:**
- Create: `app/signin/page.tsx`

- [ ] **Step 1: Create `app/signin/page.tsx`**

```tsx
'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-black uppercase tracking-tight text-stone-900 mb-2">Sign In</h1>
        <p className="text-muted text-sm mb-8">Sign in to join groups and log games.</p>
        {error && (
          <p className="text-loss text-sm mb-4">Sign-in failed. Please try again.</p>
        )}
        <button
          onClick={signInWithGoogle}
          className="w-full bg-white border border-stone-300 text-stone-900 font-black py-3 rounded-full flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/signin/page.tsx
git commit -m "feat: add sign-in page with Google OAuth"
```

---

## Task 9: Update groups POST API (create group)

**Files:**
- Modify: `app/api/groups/route.ts`

- [ ] **Step 1: Replace `app/api/groups/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { generateJoinCode } from '@/lib/join-code'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

async function generateUniqueJoinCode(supabase: ReturnType<typeof createServerClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode()
    const { data } = await supabase.from('groups').select('id').eq('join_code', code).single()
    if (!data) return code
  }
  throw new Error('Could not generate unique join code')
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { name, slug: rawSlug, players, visibility } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 })
  if (!Array.isArray(players) || players.length < 1)
    return NextResponse.json({ error: 'At least 1 player required' }, { status: 400 })

  const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(name.trim())
  if (!slug) return NextResponse.json({ error: 'Invalid group name for URL' }, { status: 400 })

  const groupVisibility = visibility === 'public' ? 'public' : 'private'

  const supabase = createServerClient()

  const { data: existing } = await supabase.from('groups').select('id').eq('slug', slug).single()
  if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })

  const joinCode = await generateUniqueJoinCode(supabase)

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), slug, pin: '0000', join_code: joinCode, visibility: groupVisibility, owner_id: user.id })
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

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner' })
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  return NextResponse.json({ slug, join_code: joinCode }, { status: 201 })
}
```

Note: `pin: '0000'` satisfies the existing NOT NULL constraint on the `pin` column without removing it.

- [ ] **Step 2: Commit**

```bash
git add app/api/groups/route.ts
git commit -m "feat: require auth on group creation; generate join_code; create owner membership"
```

---

## Task 10: Join API

**Files:**
- Create: `app/api/join/[code]/route.ts`

- [ ] **Step 1: Create `app/api/join/[code]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { generateJoinCode } from '@/lib/join-code'

// GET /api/join/[code] — validate code and return group info + unclaimed players
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups')
    .select('id, name, slug, visibility')
    .eq('join_code', params.code.toUpperCase())
    .single()

  if (!group) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

  const [{ data: members }, { data: allPlayers }] = await Promise.all([
    supabase.from('group_members').select('player_id').eq('group_id', group.id),
    supabase.from('users').select('id, name').eq('group_id', group.id).order('name'),
  ])

  const claimedPlayerIds = new Set((members ?? []).map((m: any) => m.player_id).filter(Boolean))
  const players = (allPlayers ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    claimed: claimedPlayerIds.has(p.id),
  }))

  const memberCount = members?.length ?? 0

  return NextResponse.json({ group: { id: group.id, name: group.name, slug: group.slug }, memberCount, players })
}

// POST /api/join/[code] — join the group; optionally claim or create a player
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups')
    .select('id, slug')
    .eq('join_code', params.code.toUpperCase())
    .single()

  if (!group) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return NextResponse.json({ slug: group.slug, alreadyMember: true })
  }

  const { playerId, playerName } = await req.json().catch(() => ({}))

  let resolvedPlayerId: string | null = null

  if (playerId) {
    // Verify player belongs to group and isn't already claimed
    const { data: player } = await supabase
      .from('users')
      .select('id')
      .eq('id', playerId)
      .eq('group_id', group.id)
      .single()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: existingClaim } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('player_id', playerId)
      .single()
    if (existingClaim) return NextResponse.json({ error: 'That player is already claimed' }, { status: 409 })

    resolvedPlayerId = playerId
  } else if (playerName?.trim()) {
    const { data: newPlayer, error: playerErr } = await supabase
      .from('users')
      .insert({ name: playerName.trim(), group_id: group.id })
      .select()
      .single()
    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })
    resolvedPlayerId = newPlayer.id
  }

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member', player_id: resolvedPlayerId })
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  return NextResponse.json({ slug: group.slug }, { status: 201 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/join/
git commit -m "feat: join API — validate code, join group, claim or create player"
```

---

## Task 11: Members API

**Files:**
- Create: `app/api/groups/[id]/members/route.ts`
- Create: `app/api/groups/[id]/members/[userId]/route.ts`

- [ ] **Step 1: Create `app/api/groups/[id]/members/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

// GET /api/groups/[id]/members — list all members (requires membership)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(display_name, avatar_url), users(name)')
    .eq('group_id', params.id)
    .order('joined_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data })
}
```

- [ ] **Step 2: Create `app/api/groups/[id]/members/[userId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

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

// DELETE /api/groups/[id]/members/[userId] — remove member (requires admin/owner)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('user_id', params.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/groups/
git commit -m "feat: members API — list, update role/player, remove"
```

---

## Task 12: Group settings API

**Files:**
- Create: `app/api/groups/[id]/settings/route.ts`

- [ ] **Step 1: Create `app/api/groups/[id]/settings/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'
import { generateJoinCode } from '@/lib/join-code'

// PATCH /api/groups/[id]/settings — update visibility or rotate join code (requires admin/owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.visibility !== undefined) {
    if (!['public', 'private'].includes(body.visibility)) {
      return NextResponse.json({ error: 'visibility must be public or private' }, { status: 400 })
    }
    update.visibility = body.visibility
  }

  if (body.rotateCode === true) {
    const supabase = createServerClient()
    for (let i = 0; i < 10; i++) {
      const code = generateJoinCode()
      const { data } = await supabase.from('groups').select('id').eq('join_code', code).single()
      if (!data) { update.join_code = code; break }
    }
    if (!update.join_code) return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('groups')
    .update(update)
    .eq('id', params.id)
    .select('visibility, join_code')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/groups/
git commit -m "feat: settings API — update visibility, rotate join code"
```

---

## Task 13: Protect game log API routes (POST endpoints)

**Files:**
- Modify: `app/api/pong/route.ts`
- Modify: `app/api/beer-die/route.ts`
- Modify: `app/api/hearts/route.ts`
- Modify: `app/api/cornhole/route.ts`
- Modify: `app/api/spikeball/route.ts`
- Modify: `app/api/pool/route.ts`
- Modify: `app/api/poker/route.ts`

**Pattern:** Add `getMemberForAPI` check to every POST handler, right after `group_id` is validated.

- [ ] **Step 1: Replace `app/api/pong/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { PongGamePlayer, User } from '@/lib/types'
import { getMemberForAPI } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )').eq('group_id', group_id).eq('pong_games.approved', true),
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

  const member = await getMemberForAPI(group_id)
  if (!member) return NextResponse.json({ error: 'Must be a group member to log games' }, { status: 403 })

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

- [ ] **Step 2: Add the membership guard to the remaining six routes**

For each of the following files, open the file and add these two lines immediately after `group_id` is validated in the POST handler (after the `if (!group_id) return ...` line):

```typescript
const member = await getMemberForAPI(group_id)
if (!member) return NextResponse.json({ error: 'Must be a group member to log games' }, { status: 403 })
```

And add the import at the top of each file:
```typescript
import { getMemberForAPI } from '@/lib/auth'
```

Files to update:
- `app/api/beer-die/route.ts` — `group_id` is destructured from body; add guard after its validation
- `app/api/hearts/route.ts` — same pattern
- `app/api/cornhole/route.ts` — same pattern
- `app/api/spikeball/route.ts` — same pattern
- `app/api/pool/route.ts` — same pattern
- `app/api/poker/route.ts` — same pattern

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/pong/route.ts app/api/beer-die/route.ts app/api/hearts/route.ts app/api/cornhole/route.ts app/api/spikeball/route.ts app/api/pool/route.ts app/api/poker/route.ts
git commit -m "feat: require group membership on all game log POST routes"
```

---

## Task 14: Join flow page

**Files:**
- Create: `app/join/[code]/page.tsx`

- [ ] **Step 1: Create `app/join/[code]/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

type Player = { id: string; name: string; claimed: boolean }
type GroupInfo = { id: string; name: string; slug: string }

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const code = params.code.toUpperCase()

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(true)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setFetching(false); return }
        setGroup(data.group)
        setMemberCount(data.memberCount)
        setPlayers(data.players)
        setFetching(false)
      })
      .catch(() => { setError('Failed to load group info'); setFetching(false) })
  }, [code])

  const handleJoin = async (skip = false) => {
    if (!user) {
      router.push(`/signin?next=/join/${code}`)
      return
    }
    setJoining(true)
    const body: Record<string, string> = {}
    if (!skip) {
      if (mode === 'list' && selectedPlayerId) body.playerId = selectedPlayerId
      if (mode === 'create' && newPlayerName.trim()) body.playerName = newPlayerName.trim()
    }
    const res = await fetch(`/api/join/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setJoining(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/g/${data.slug}`)
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <p className="text-muted text-sm mb-4">Sign in to join this group.</p>
          <Link
            href={`/signin?next=/join/${code}`}
            className="block w-full bg-stone-900 text-white font-black py-3 rounded-full text-center hover:bg-stone-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (fetching) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-muted">Loading…</p></div>
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-loss font-bold mb-4">{error}</p>
          <p className="text-muted text-sm">This join link may have expired or been reset.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900 mb-1">
          Joining {group?.name}
        </h1>
        <p className="text-muted text-sm mb-8">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">
            Are you on the leaderboard?
          </p>
          <div className="space-y-2">
            {players.map(p => (
              <button
                key={p.id}
                disabled={p.claimed}
                onClick={() => { setMode('list'); setSelectedPlayerId(p.id); setNewPlayerName('') }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
                  p.claimed
                    ? 'border-warm bg-stone-50 text-stone-300 cursor-not-allowed'
                    : selectedPlayerId === p.id && mode === 'list'
                    ? 'border-win bg-green-50 text-stone-900'
                    : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
                }`}
              >
                {p.name}
                {p.claimed && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-stone-300">Claimed</span>}
              </button>
            ))}
            <button
              onClick={() => { setMode('create'); setSelectedPlayerId(null) }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
                mode === 'create'
                  ? 'border-win bg-green-50 text-stone-900'
                  : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
              }`}
            >
              I&apos;m not listed — create my player
            </button>
          </div>

          {mode === 'create' && (
            <div className="mt-3">
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Your name"
                className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
              />
            </div>
          )}
        </div>

        {error && <p className="text-loss text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={() => handleJoin(false)}
            disabled={joining || (mode === 'list' && !selectedPlayerId) || (mode === 'create' && !newPlayerName.trim())}
            className="w-full bg-win text-white font-black py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {joining ? 'Joining…' : 'Join Group →'}
          </button>
          <button
            onClick={() => handleJoin(true)}
            disabled={joining}
            className="w-full text-muted font-bold py-2 text-sm hover:text-stone-900 transition-colors"
          >
            Skip for now (claim a player later)
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/join/
git commit -m "feat: join flow page — claim or create player, skip option"
```

---

## Task 15: Update create group page

**Files:**
- Modify: `app/create/page.tsx`

- [ ] **Step 1: Replace `app/create/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [players, setPlayers] = useState<string[]>(['', ''])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ slug: string; joinCode: string } | null>(null)

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
    if (filledPlayers.length < 1) return setError('Add at least 1 player')
    setLoadingSubmit(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, players: filledPlayers, visibility }),
    })
    const data = await res.json()
    setLoadingSubmit(false)
    if (!res.ok) return setError(data.error)
    setCreated({ slug: data.slug, joinCode: data.join_code })
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-bg text-stone-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Link href="/" className="text-muted text-sm hover:text-stone-900 mb-8 inline-block">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Create Your Group</h1>
          <p className="text-muted text-sm mb-6">You need to sign in first.</p>
          <Link
            href="/signin?next=/create"
            className="bg-win text-white font-black px-6 py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors inline-block"
          >
            Sign In →
          </Link>
        </div>
      </div>
    )
  }

  if (created) {
    const joinLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${created.joinCode}`
    return (
      <div className="min-h-screen bg-bg text-stone-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Group Created! 🎉</h1>
          <p className="text-muted text-sm mb-8">Share this with your crew to let them join.</p>
          <div className="bg-card border border-warm rounded-xl p-5 mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-1">Join Code</p>
            <p className="text-3xl font-black tracking-widest text-stone-900 mb-3">{created.joinCode}</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-1">Join Link</p>
            <p className="text-sm text-muted break-all mb-3">{joinLink}</p>
            <button
              onClick={() => navigator.clipboard.writeText(joinLink)}
              className="bg-stone-100 text-stone-700 font-black text-xs px-4 py-2 rounded-full hover:bg-stone-200 transition-colors uppercase tracking-wide"
            >
              Copy Link
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-muted">Visibility:</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${visibility === 'public' ? 'bg-amber-100 text-brand' : 'bg-stone-100 text-stone-600'}`}>
              {visibility}
            </span>
            <span className="text-xs text-muted">{visibility === 'public' ? '— listed in directory' : '— invite only'}</span>
          </div>
          <Link
            href={`/g/${created.slug}`}
            className="bg-win text-white font-black px-6 py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors inline-block w-full text-center"
          >
            Go to Your Group →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-stone-900">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/" className="text-muted text-sm hover:text-stone-900 mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Create Your Group</h1>
        <p className="text-muted text-sm mb-8">Set up your leaderboard in 60 seconds.</p>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Group Name</label>
            <input
              value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="Rob's Crew"
              className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-muted text-sm">garageleague.app/g/</span>
              <input
                value={slug} onChange={e => setSlug(toSlug(e.target.value))}
                placeholder="robs-crew"
                className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 flex-1 focus:outline-none focus:border-win"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Visibility</label>
            <div className="flex gap-3">
              {(['private', 'public'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 py-2 rounded-xl border font-black text-xs uppercase tracking-wide transition-colors ${
                    visibility === v
                      ? 'border-win bg-green-50 text-stone-900'
                      : 'border-warm bg-card text-muted hover:bg-amber-50'
                  }`}
                >
                  {v === 'private' ? '🔒 Private' : '🌐 Public'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-1">
              {visibility === 'private' ? 'Invite-only. Not listed anywhere.' : 'Listed in the public directory. Anyone can view.'}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">
              Players <span className="normal-case font-normal">(You can add more later)</span>
            </label>
            <div className="space-y-2">
              {players.map((p, i) => (
                <input
                  key={i} value={p} onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-loss text-sm">{error}</p>}
          <button type="submit" disabled={loadingSubmit}
            className="bg-win text-white font-black px-6 py-2 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors w-full">
            {loadingSubmit ? 'Creating...' : 'Create Group →'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/create/page.tsx
git commit -m "feat: update create group page — auth gate, visibility toggle, post-creation share screen"
```

---

## Task 16: Discover page

**Files:**
- Create: `app/discover/page.tsx`

- [ ] **Step 1: Create `app/discover/page.tsx`**

```tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'

type PublicGroup = {
  id: string
  name: string
  slug: string
  created_at: string
  memberCount: number
}

async function getPublicGroups(): Promise<PublicGroup[]> {
  const supabase = createServerClient()
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, slug, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!groups) return []

  const memberCounts = await Promise.all(
    groups.map(g =>
      supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', g.id)
        .then(({ count }) => ({ id: g.id, count: count ?? 0 }))
    )
  )

  const countMap = new Map(memberCounts.map(c => [c.id, c.count]))

  return groups.map(g => ({ ...g, memberCount: countMap.get(g.id) ?? 0 }))
}

export default async function DiscoverPage() {
  const groups = await getPublicGroups()

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900">Discover Groups</h1>
            <p className="text-muted text-sm mt-1">Public groups you can follow.</p>
          </div>
          <Link href="/" className="text-muted text-sm hover:text-stone-900">← Home</Link>
        </div>

        {groups.length === 0 ? (
          <p className="text-muted text-sm">No public groups yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(g => (
              <Link
                key={g.id}
                href={`/g/${g.slug}`}
                className="block bg-card border border-warm rounded-xl p-4 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-stone-900">{g.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-muted text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/discover/
git commit -m "feat: discover page — public group directory"
```

---

## Task 17: Update GroupProvider and context

**Files:**
- Modify: `lib/group-context.tsx`
- Modify: `components/GroupProvider.tsx`

- [ ] **Step 1: Replace `lib/group-context.tsx`**

```typescript
'use client'
import { createContext, useContext } from 'react'
import type { GroupMember } from './types'

type GroupContextValue = {
  id: string
  slug: string
  name: string
  membership: GroupMember | null
}

export const GroupContext = createContext<GroupContextValue | null>(null)

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider')
  return ctx
}
```

- [ ] **Step 2: Replace `components/GroupProvider.tsx`**

```tsx
'use client'
import { GroupContext } from '@/lib/group-context'
import type { GroupMember } from '@/lib/types'

type Props = {
  group: { id: string; slug: string; name: string }
  membership: GroupMember | null
  children: React.ReactNode
}

export default function GroupProvider({ group, membership, children }: Props) {
  return (
    <GroupContext.Provider value={{ ...group, membership }}>
      {children}
    </GroupContext.Provider>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: Errors will appear for `app/g/[slug]/layout.tsx` (doesn't pass `membership` yet) — that's expected and will be fixed in the next task.

- [ ] **Step 4: Commit**

```bash
git add lib/group-context.tsx components/GroupProvider.tsx
git commit -m "feat: add membership to GroupProvider context"
```

---

## Task 18: Update group layout with membership guard

**Files:**
- Modify: `app/g/[slug]/layout.tsx`

- [ ] **Step 1: Replace `app/g/[slug]/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { requireMembership } from '@/lib/auth'
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
  const { group, member } = await requireMembership(params.slug)

  return (
    <GroupProvider group={{ id: group.id, slug: group.slug, name: group.name }} membership={member}>
      <GroupNav slug={group.slug} groupName={group.name} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      <BottomNav slug={group.slug} />
    </GroupProvider>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Test access control manually**

Start the dev server: `npm run dev`

1. Visit `/g/summer-games` (public group assumed if migration was applied) — should load.
2. Visit `/g/some-private-group` when not signed in — should 404.
3. Sign in, then revisit — should load if you're a member.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/layout.tsx"
git commit -m "feat: apply membership guard in group layout; single fetch for group + member"
```

---

## Task 19: Update group home page (member/non-member views)

**Files:**
- Modify: `app/g/[slug]/page.tsx`

- [ ] **Step 1: Add the membership-aware banner to `app/g/[slug]/page.tsx`**

Open `app/g/[slug]/page.tsx`. Find the `GroupHomePage` component's return JSX. Add this import at the top of the file:

```typescript
import { requireMembership } from '@/lib/auth'
```

Then inside `GroupHomePage`, add a membership check after fetching the group:

```tsx
// After: const group = await getGroupBySlug(params.slug)
// Add:
const { member, isPublic } = await requireMembership(params.slug)
```

Then, inside the `return (...)` JSX, add a non-member join CTA before the `<div className="space-y-10">` content:

```tsx
{!member && isPublic && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between mb-6">
    <p className="text-sm font-bold text-stone-900">Sign in and join to log games.</p>
    <a
      href={`/g/${params.slug}/join-prompt`}
      className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
    >
      Join →
    </a>
  </div>
)}
{member && !member.player_id && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between mb-6">
    <p className="text-sm font-bold text-stone-900">You haven&apos;t claimed a player yet.</p>
    <a
      href={`/g/${params.slug}/claim`}
      className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
    >
      Claim →
    </a>
  </div>
)}
```

Note: The `getGroupBySlug` call is now redundant since `requireMembership` fetches the group, but removing it from all downstream page calls is a separate cleanup. Leave it in place for now to avoid breaking other pages.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add "app/g/[slug]/page.tsx"
git commit -m "feat: group home shows join CTA for non-members, claim banner for unclaimed members"
```

---

## Task 20: Claim player page

**Files:**
- Create: `app/g/[slug]/claim/page.tsx`

- [ ] **Step 1: Create `app/g/[slug]/claim/page.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/lib/group-context'

type Player = { id: string; name: string; claimed: boolean }

export default function ClaimPage() {
  const { id: groupId, slug } = useGroup()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/join/claim-list?group_id=${groupId}`)
      .then(r => r.json())
      .then(data => { setPlayers(data.players ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [groupId])

  const save = async () => {
    setSaving(true)
    setError('')
    const body: Record<string, string> = {}
    if (mode === 'list' && selectedId) body.playerId = selectedId
    if (mode === 'create' && newName.trim()) body.playerName = newName.trim()
    const res = await fetch(`/api/groups/${groupId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/g/${slug}`)
  }

  if (loading) return <div className="p-8 text-muted">Loading…</div>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Claim Your Player</h1>
      <p className="text-muted text-sm mb-6">Link your account to your name on the leaderboard.</p>

      <div className="space-y-2 mb-6">
        {players.map(p => (
          <button
            key={p.id}
            disabled={p.claimed}
            onClick={() => { setMode('list'); setSelectedId(p.id); setNewName('') }}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
              p.claimed
                ? 'border-warm bg-stone-50 text-stone-300 cursor-not-allowed'
                : selectedId === p.id && mode === 'list'
                ? 'border-win bg-green-50 text-stone-900'
                : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
            }`}
          >
            {p.name}
            {p.claimed && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-stone-300">Claimed</span>}
          </button>
        ))}
        <button
          onClick={() => { setMode('create'); setSelectedId(null) }}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
            mode === 'create' ? 'border-win bg-green-50 text-stone-900' : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
          }`}
        >
          I&apos;m not listed — create my player
        </button>
      </div>

      {mode === 'create' && (
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Your name"
          className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win mb-4"
        />
      )}

      {error && <p className="text-loss text-sm mb-4">{error}</p>}

      <button
        onClick={save}
        disabled={saving || (mode === 'list' && !selectedId) || (mode === 'create' && !newName.trim())}
        className="w-full bg-win text-white font-black py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create the claim API route `app/api/groups/[id]/claim/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI, getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const member = await getMemberForAPI(params.id)
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { playerId, playerName } = await req.json()
  const supabase = createServerClient()

  let resolvedPlayerId: string | null = null

  if (playerId) {
    const { data: player } = await supabase
      .from('users').select('id').eq('id', playerId).eq('group_id', params.id).single()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: existing } = await supabase
      .from('group_members').select('id').eq('group_id', params.id).eq('player_id', playerId).single()
    if (existing) return NextResponse.json({ error: 'That player is already claimed' }, { status: 409 })

    resolvedPlayerId = playerId
  } else if (playerName?.trim()) {
    const { data: newPlayer, error: playerErr } = await supabase
      .from('users').insert({ name: playerName.trim(), group_id: params.id }).select().single()
    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })
    resolvedPlayerId = newPlayer.id
  } else {
    return NextResponse.json({ error: 'playerId or playerName required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('group_members')
    .update({ player_id: resolvedPlayerId })
    .eq('group_id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Create the claim list API route `app/api/join/claim-list/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const member = await getMemberForAPI(group_id)
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const supabase = createServerClient()
  const [{ data: members }, { data: allPlayers }] = await Promise.all([
    supabase.from('group_members').select('player_id').eq('group_id', group_id),
    supabase.from('users').select('id, name').eq('group_id', group_id).order('name'),
  ])

  const claimedPlayerIds = new Set((members ?? []).map((m: any) => m.player_id).filter(Boolean))
  const players = (allPlayers ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    claimed: claimedPlayerIds.has(p.id),
  }))

  return NextResponse.json({ players })
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/claim/" app/api/groups/ app/api/join/
git commit -m "feat: claim player page and API for existing members"
```

---

## Task 21: Update admin page and AdminPanel

**Files:**
- Create: `components/admin/MembersTab.tsx`
- Create: `components/admin/GroupSettingsTab.tsx`
- Modify: `components/admin/AdminPanel.tsx`
- Modify: `app/g/[slug]/admin/page.tsx`

- [ ] **Step 1: Create `components/admin/MembersTab.tsx`**

```tsx
'use client'
import { useState } from 'react'

type Member = {
  id: string
  user_id: string
  role: string
  player_id: string | null
  profiles: { display_name: string } | null
  users: { name: string } | null
}

export default function MembersTab({
  initial,
  groupId,
  currentUserRole,
}: {
  initial: Member[]
  groupId: string
  currentUserRole: string
}) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const updateMember = async (userId: string, body: Record<string, unknown>) => {
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
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, ...body } : m))
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the group?')) return
    setLoading(userId)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
    setLoading(null)
    if (!res.ok) { setError('Failed to remove member'); return }
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const unlinkPlayer = async (userId: string) => {
    await updateMember(userId, { player_id: null })
  }

  return (
    <div>
      {error && <p className="text-loss text-sm mb-4">{error}</p>}
      {members.length === 0 && <p className="text-muted text-sm">No members yet.</p>}
      <div className="space-y-3">
        {members.map(m => (
          <div key={m.user_id} className="bg-card border border-warm rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-stone-900 text-sm">
                  {m.profiles?.display_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Player: {m.users?.name ?? <span className="italic">unclaimed</span>}
                </p>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                m.role === 'owner' ? 'bg-amber-100 text-brand' :
                m.role === 'admin' ? 'bg-green-100 text-green-800' :
                'bg-stone-100 text-stone-600'
              }`}>
                {m.role}
              </span>
            </div>
            {currentUserRole === 'owner' && m.role !== 'owner' && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => updateMember(m.user_id, { role: m.role === 'admin' ? 'member' : 'admin' })}
                  disabled={loading === m.user_id}
                  className="text-[10px] font-black px-3 py-1 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                >
                  {m.role === 'admin' ? 'Demote' : 'Make Admin'}
                </button>
                {m.users && (
                  <button
                    onClick={() => unlinkPlayer(m.user_id)}
                    disabled={loading === m.user_id}
                    className="text-[10px] font-black px-3 py-1 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                  >
                    Unlink Player
                  </button>
                )}
                <button
                  onClick={() => removeMember(m.user_id)}
                  disabled={loading === m.user_id}
                  className="text-[10px] font-black px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/admin/GroupSettingsTab.tsx`**

```tsx
'use client'
import { useState } from 'react'

export default function GroupSettingsTab({
  groupId,
  initialVisibility,
  initialJoinCode,
  groupSlug,
}: {
  groupId: string
  initialVisibility: string
  initialJoinCode: string
  groupSlug: string
}) {
  const [visibility, setVisibility] = useState(initialVisibility)
  const [joinCode, setJoinCode] = useState(initialJoinCode)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${joinCode}`
    : `/join/${joinCode}`

  const updateVisibility = async (v: string) => {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: v }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setVisibility(data.visibility)
  }

  const rotateCode = async () => {
    if (!confirm('This will invalidate the current join link. Continue?')) return
    setRotating(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotateCode: true }),
    })
    const data = await res.json()
    setRotating(false)
    if (!res.ok) { setError(data.error); return }
    setJoinCode(data.join_code)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-loss text-sm">{error}</p>}

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Visibility</p>
        <div className="flex gap-3">
          {(['private', 'public'] as const).map(v => (
            <button
              key={v}
              onClick={() => updateVisibility(v)}
              disabled={saving || visibility === v}
              className={`flex-1 py-2 rounded-xl border font-black text-xs uppercase tracking-wide transition-colors ${
                visibility === v
                  ? 'border-win bg-green-50 text-stone-900'
                  : 'border-warm bg-card text-muted hover:bg-amber-50'
              } disabled:cursor-default`}
            >
              {v === 'private' ? '🔒 Private' : '🌐 Public'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1">
          {visibility === 'private' ? 'Invite-only. Not listed in the directory.' : 'Listed in the public directory. Anyone can view.'}
        </p>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Join Code</p>
        <div className="bg-card border border-warm rounded-xl p-4">
          <p className="text-3xl font-black tracking-widest text-stone-900 mb-2">{joinCode}</p>
          <p className="text-xs text-muted break-all mb-3">{joinLink}</p>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="bg-stone-100 text-stone-700 font-black text-xs px-4 py-2 rounded-full hover:bg-stone-200 transition-colors uppercase tracking-wide"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={rotateCode}
              disabled={rotating}
              className="bg-red-100 text-red-700 font-black text-xs px-4 py-2 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors uppercase tracking-wide"
            >
              {rotating ? 'Rotating…' : 'Rotate Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `components/admin/AdminPanel.tsx` — remove PIN gate, add tabs**

Find the top of `AdminPanel.tsx`. Replace the Props type and the component opening (up through the PIN form) with the following. Keep everything from `const nameMap = ...` onward — only the state/props/PIN-gate section changes.

Replace from the top of the file through the first `if (!authed)` return block with:

```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame, AdminPokerGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditCornholeGame from './EditCornholeGame'
import EditSpikeballGame from './EditSpikeballGame'
import EditHeartsGame from './EditHeartsGame'
import EditPoolGame from './EditPoolGame'
import EditPokerGame from './EditPokerGame'
import MembersTab from './MembersTab'
import GroupSettingsTab from './GroupSettingsTab'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'cornhole'; played_at: string; data: AdminCornholeGame }
  | { kind: 'spikeball'; played_at: string; data: AdminSpikeballGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }
  | { kind: 'pool'; played_at: string; data: AdminPoolGame }
  | { kind: 'poker'; played_at: string; data: AdminPokerGame }

type MemberRow = {
  id: string
  user_id: string
  role: string
  player_id: string | null
  profiles: { display_name: string } | null
  users: { name: string } | null
}

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  cornholeGames: AdminCornholeGame[]
  spikeballGames: AdminSpikeballGame[]
  heartsGames: AdminHeartsGame[]
  poolGames: AdminPoolGame[]
  pokerGames: AdminPokerGame[]
  players: User[]
  members: MemberRow[]
  groupId: string
  groupSlug: string
  visibility: string
  joinCode: string
  currentUserRole: string
}

type Tab = 'games' | 'members' | 'settings'

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames, pokerGames,
  players, members, groupId, groupSlug, visibility, joinCode, currentUserRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
```

Then, after the `const nameMap = ...` line and the `name` helper function, find the component's return and add the tab bar. Replace the current `return (` opening with:

```tsx
  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-warm">
        {(['games', 'members', 'settings'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-win text-stone-900'
                : 'border-transparent text-muted hover:text-stone-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <MembersTab initial={members} groupId={groupId} currentUserRole={currentUserRole} />
      )}

      {activeTab === 'settings' && (
        <GroupSettingsTab
          groupId={groupId}
          initialVisibility={visibility}
          initialJoinCode={joinCode}
          groupSlug={groupSlug}
        />
      )}

      {activeTab === 'games' && (
        <div>
```

And close the `{activeTab === 'games' && (` block at the very bottom of the component, just before the final `)`  closing the component return — add `</div>)}` there.

- [ ] **Step 4: Update `app/g/[slug]/admin/page.tsx`**

Replace the file entirely:

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
    { data: pokerGamesRaw },
    { data: pokerPlayers },
    { data: users },
    { data: suggestionsRaw },
    { data: membersRaw },
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
    supabase.from('poker_games').select('id, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('poker_game_players').select('game_id, player_id, amount_cents').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    params.slug === 'summer-games'
      ? supabase.from('suggestions').select('id, name, email, game_suggestion, feedback, created_at').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('group_members').select('*, profiles(display_name, avatar_url), users(name)').eq('group_id', group.id).order('joined_at'),
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
  const assemblePoker = (raw: any[]): AdminPokerGame[] =>
    raw.map((g: any) => ({
      id: g.id, played_at: g.played_at,
      player_amounts: (pokerPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, amount_cents: p.amount_cents })),
    }))

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

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add components/admin/MembersTab.tsx components/admin/GroupSettingsTab.tsx components/admin/AdminPanel.tsx "app/g/[slug]/admin/page.tsx"
git commit -m "feat: admin — role-gated access, Members tab, Group Settings tab; remove PIN gate"
```

---

## Task 22: Add Discover link to landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add Discover link to `app/page.tsx`**

In `app/page.tsx`, find the `<div className="flex gap-4 justify-center mb-20">` block and add the Discover link alongside the existing buttons:

```tsx
<div className="flex gap-4 justify-center flex-wrap mb-20">
  <Link href="/create"
    className="bg-win text-white font-black px-8 py-3 rounded-full hover:bg-orange-400 transition-colors text-base tracking-wider uppercase">
    Create Your Group →
  </Link>
  <Link href="/discover"
    className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase">
    Browse Groups
  </Link>
  <Link href="/g/example"
    className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase">
    See an Example
  </Link>
</div>
```

- [ ] **Step 2: Final TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest
```

Expected: All tests pass (join-code tests + any existing tests).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Browse Groups link to landing page"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Sign in with Apple (Supabase Auth) | Tasks 2, 6, 7, 8 |
| `profiles` table auto-created by trigger | Task 1 |
| `group_members` table with role + player_id | Task 1 |
| `UNIQUE (group_id, player_id)` — one claim per player | Task 1 |
| `groups.visibility`, `join_code`, `owner_id` | Task 1 |
| `Group` type extended; `Profile`, `GroupMember` types | Task 3 |
| `requireMembership` — 404 for private non-members | Task 5 |
| Public groups readable without membership | Task 5, 18 |
| App-layer guard in every group layout | Task 18 |
| `getMemberForAPI` on all game log POST routes | Task 13 |
| `generateJoinCode` — 6-char unambiguous code | Task 4 |
| Create group requires auth; generates join code; owner membership | Task 9 |
| Join flow — validate code, show group + unclaimed players | Tasks 10, 14 |
| Claim a player (unique per group) | Tasks 10, 14, 20 |
| Create new player during join | Tasks 10, 14 |
| Skip claiming; claim later via `/g/[slug]/claim` | Tasks 14, 20 |
| Unclaimed banner on group home | Task 19 |
| Non-member join CTA on public group home | Task 19 |
| Directory at `/discover` listing public groups | Task 16 |
| Admin: role-gate replaces PIN gate | Task 21 |
| Admin: Members tab (promote, demote, remove, unlink) | Task 21 |
| Admin: Settings tab (visibility toggle, rotate code) | Tasks 12, 21 |
| `AuthProvider` in root layout | Task 7 |
| `GroupProvider` passes membership through context | Task 17 |
| Discover link on landing page | Task 22 |

### Placeholder scan

No TBDs, TODOs, or incomplete steps. All code blocks are complete and runnable.

### Type consistency

- `GroupMember` defined in Task 3, imported in Tasks 5, 17
- `MemberWithProfile` defined in Task 3, used in Task 21 (cast via `as any` from Supabase join — intentional given Supabase's dynamic return type)
- `requireMembership` returns `{ group, member, isPublic }` — consumed in Tasks 18, 19, 21
- `requireRole` returns `{ group, member }` — consumed in Task 21
- `getMemberForAPI` returns `GroupMember | null` — consumed in Tasks 10, 11, 12, 13, 20
- `GroupContextValue` in `lib/group-context.tsx` adds `membership: GroupMember | null` — consumed by `useGroup()` in Task 20's claim page
- `AdminPanel` props: `groupPin` removed; `members`, `groupId`, `groupSlug`, `visibility`, `joinCode`, `currentUserRole` added in Task 21
