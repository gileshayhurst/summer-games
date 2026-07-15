# Block Game Logging for Non-Members — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent non-members of public groups from accessing the "Log a Game" UI, while leaving all read-only group pages open.

**Architecture:** Two-layer defence — (1) the `/log` server page checks membership and renders a "members only" card for visitors; (2) the LOG GAME and LOG+ nav buttons are hidden from non-members via the `GroupContext` membership value that is already available to both client nav components.

**Tech Stack:** Next.js 14 App Router, React, TypeScript. No new dependencies.

---

## Files Changed

| File | Change |
|---|---|
| `app/g/[slug]/log/page.tsx` | Modify — add `requireMembership` call, render members-only card when `member` is null |
| `components/GroupNav.tsx` | Modify — read `membership` from `useGroup()`, gate the desktop "LOG GAME →" link |
| `components/BottomNav.tsx` | Modify — read `membership` from `useGroup()`, gate the mobile "LOG+" button |

---

### Task 1: Guard the log page for non-members

**Files:**
- Modify: `app/g/[slug]/log/page.tsx`

The log page is a server component. It already calls `getGroupBySlug`, but never checks membership. Adding `requireMembership` here is safe — Next.js deduplicates the DB call with the identical call already made in the layout for the same request.

- [ ] **Step 1: Open `app/g/[slug]/log/page.tsx` and replace its contents**

```tsx
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { requireMembership } from '@/lib/auth'
import LogTabs from '@/components/log/LogTabs'
import { notFound } from 'next/navigation'

export default async function GroupLogPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const { member } = await requireMembership(params.slug)

  if (!member) {
    return (
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
        <div className="bg-amber-50 border border-warm rounded-xl p-4">
          <p className="text-sm font-bold text-stone-900">Members only</p>
          <p className="text-sm text-muted mt-1">
            You need to be a member to log games. Ask a group member for an invite link.
          </p>
        </div>
      </div>
    )
  }

  const supabase = createServerClient()
  const { data: players } = await supabase
    .from('users')
    .select('id, name, created_at')
    .eq('group_id', group.id)
    .order('name')

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
      <p className="text-muted text-sm mb-6">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Run the existing test suite to confirm nothing broke**

```bash
npm test
```

Expected: all tests pass (no tests cover this page directly; confirming no import/type regressions).

- [ ] **Step 3: Commit**

```bash
git add app/g/[slug]/log/page.tsx
git commit -m "feat: show members-only card on /log for non-members of public groups"
```

---

### Task 2: Hide the desktop "LOG GAME →" button in GroupNav for non-members

**Files:**
- Modify: `components/GroupNav.tsx`

`GroupNav` is a client component rendered under `GroupProvider`. It can call `useGroup()` (from `@/lib/group-context`) to read `membership`. Currently the "LOG GAME →" link is gated only on `!isExample`. Add a `membership` check so the button only renders for actual members.

- [ ] **Step 1: Add the `useGroup` import to `components/GroupNav.tsx`**

At the top of the file, alongside the existing imports, add:

```tsx
import { useGroup } from '@/lib/group-context'
```

- [ ] **Step 2: Read membership inside the component**

In the component body, after the existing `const [showBrowseButton, setShowBrowseButton] = useState(false)` line, add:

```tsx
const { membership } = useGroup()
```

- [ ] **Step 3: Gate the "LOG GAME →" link on membership**

Find this block (around line 99–106):

```tsx
{!isExample && (
  <Link
    href={`${base}/log`}
    className="hidden md:inline-flex shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
  >
    LOG GAME →
  </Link>
)}
```

Replace it with:

```tsx
{!isExample && membership && (
  <Link
    href={`${base}/log`}
    className="hidden md:inline-flex shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
  >
    LOG GAME →
  </Link>
)}
```

- [ ] **Step 4: Run the test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/GroupNav.tsx
git commit -m "feat: hide LOG GAME nav button for non-members of public groups"
```

---

### Task 3: Hide the mobile "LOG+" button in BottomNav for non-members

**Files:**
- Modify: `components/BottomNav.tsx`

`BottomNav` is also a client component under `GroupProvider`. The "LOG+" button is currently gated with a ternary: `{isExample ? <div /> : <Link>LOG+</Link>}`. Extend that condition to also hide for non-members, replacing the link with a spacer div (same as the `isExample` path) to preserve the five-slot layout.

- [ ] **Step 1: Add the `useGroup` import to `components/BottomNav.tsx`**

At the top of the file, alongside the existing imports, add:

```tsx
import { useGroup } from '@/lib/group-context'
```

- [ ] **Step 2: Read membership inside the component**

In the component body, after the existing `const isFull = pinned.length >= MAX_PINS` line, add:

```tsx
const { membership } = useGroup()
```

- [ ] **Step 3: Gate the LOG+ button on membership**

Find this block (around line 130–139):

```tsx
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

Replace it with:

```tsx
{isExample || !membership ? (
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

- [ ] **Step 4: Run the test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/BottomNav.tsx
git commit -m "feat: hide LOG+ bottom nav button for non-members of public groups"
```

---

## Verification

After all three tasks are committed, verify end-to-end in the browser:

1. Start the dev server: `npm run dev`
2. Navigate to `/discover` and click into any public group **without being a member of it**.
3. Confirm: the "LOG GAME →" button is absent from the desktop nav bar.
4. Confirm: the "LOG+" button is absent from the mobile bottom nav.
5. Navigate directly to `/g/[slug]/log` — confirm the "Members only" card is shown, not the form.
6. Sign in as a member of a group, navigate to that group's `/log` — confirm the full log form renders as before.
