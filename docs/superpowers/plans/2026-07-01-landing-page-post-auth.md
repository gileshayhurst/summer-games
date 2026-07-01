# Landing Page Post-Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the landing page (`app/page.tsx`) to match the app's current login-required model — remove "no login" messaging and the static example-group link, rename "Browse Groups" to "Browse Public Groups", and add a "Join by Code" entry point into the existing `/join/[code]` flow.

**Architecture:** `app/page.tsx` is a server component; all interactive behavior (expand/collapse, navigation) needs a small client component. `components/JoinByCodeButton.tsx` is a new self-contained client component that renders as a pill button matching the existing secondary-button style, and expands into an inline code-entry form (visually consistent with the existing `components/SuggestionForm.tsx`) that routes to `/join/[code]` on submit. No backend changes — `/join/[code]` already exists and handles validation, sign-in redirect, and the claim-a-player flow.

**Tech Stack:** Next.js 14 App Router, React (client component with `useState` + `next/navigation`'s `useRouter`), Tailwind CSS, TypeScript

---

## Spec

See `docs/superpowers/specs/2026-07-01-landing-page-post-auth-design.md` for the full design rationale.

## File Map

| Action | File |
|---|---|
| Create | `components/JoinByCodeButton.tsx` |
| Modify | `app/page.tsx` |

---

## Task 1: Create the Join by Code component

**Files:**
- Create: `components/JoinByCodeButton.tsx`

- [ ] **Step 1: Write the component**

Create `components/JoinByCodeButton.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinByCodeButton() {
  const [expanded, setExpanded] = useState(false)
  const [code, setCode] = useState('')
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    router.push(`/join/${trimmed.toUpperCase()}`)
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase"
      >
        Join by Code
      </button>
    )
  }

  return (
    <div className="basis-full w-full mt-4 flex justify-center">
      <form onSubmit={submit} className="flex gap-2 items-center max-w-sm w-full">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter code"
          autoFocus
          required
          className="bg-card border border-warm rounded-full px-4 py-2 text-stone-900 text-sm flex-1 focus:outline-none focus:border-win uppercase"
        />
        <button
          type="submit"
          className="bg-win text-white font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors text-sm uppercase tracking-wide"
        >
          Join →
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(false); setCode('') }}
          aria-label="Cancel"
          className="text-muted text-sm font-bold px-2 hover:text-stone-900 transition-colors"
        >
          ✕
        </button>
      </form>
    </div>
  )
}
```

Notes on why it's built this way:
- Returning the button vs. the form (instead of rendering both and toggling visibility with CSS) keeps the collapsed state a plain pill button identical in markup to the other secondary buttons in the row.
- `basis-full w-full` on the expanded wrapper forces it onto its own line inside the parent's `flex flex-wrap` row (in `app/page.tsx`), which is what makes it appear centered *below* the button row without needing any changes to the parent's layout.
- No fetch/validation here — submitting always navigates to `/join/[code]`, which already renders its own "Invalid join code" error state.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add components/JoinByCodeButton.tsx
git commit -m "feat: add JoinByCodeButton component for landing page"
```

---

## Task 2: Update the landing page copy and button row

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the import**

In `app/page.tsx`, add the new import alongside the existing ones:

```tsx
import Link from 'next/link'
import CurvedArrow from '@/components/CurvedArrow'
import SuggestionForm from '@/components/SuggestionForm'
import JoinByCodeButton from '@/components/JoinByCodeButton'
```

- [ ] **Step 2: Update the top badge**

Replace:

```tsx
        <div className="inline-block bg-amber-100 text-brand text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-6">
          Free · No login required
        </div>
```

With:

```tsx
        <div className="inline-block bg-amber-100 text-brand text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-6">
          Free
        </div>
```

- [ ] **Step 3: Update the subtitle paragraph**

Replace:

```tsx
        <p className="text-lg text-muted mb-3 leading-relaxed">
          Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew. No app, no login.
        </p>
```

With:

```tsx
        <p className="text-lg text-muted mb-3 leading-relaxed">
          Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew.
        </p>
```

- [ ] **Step 4: Replace the button row**

Replace:

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

With:

```tsx
        <div className="flex gap-4 justify-center flex-wrap mb-20">
          <Link href="/create"
            className="bg-win text-white font-black px-8 py-3 rounded-full hover:bg-orange-400 transition-colors text-base tracking-wider uppercase">
            Create Your Group →
          </Link>
          <JoinByCodeButton />
          <Link href="/discover"
            className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase">
            Browse Public Groups
          </Link>
        </div>
```

- [ ] **Step 5: Update the Shareable feature card**

Replace:

```tsx
              <p className="text-muted text-sm">Public link your whole group can add to home screen to view as an app! No login necessary.</p>
```

With:

```tsx
              <p className="text-muted text-sm">Public link your whole group can add to home screen to view as an app!</p>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update landing page for post-auth model, add join-by-code entry"
```

---

## Task 3: Manual verification

No automated tests exist for page-level UI in this codebase (only `lib/` unit tests under `__tests__/`), so this task is manual browser verification, matching the spec's Testing section.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Server starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Verify copy removals**

Open `http://localhost:3000` in a browser (or via the project's preview tool).

Expected:
- The badge above the headline reads exactly "Free" (no "No login required").
- The subtitle paragraph ends after "...shared with your whole crew." with no "No app, no login." sentence.
- The "Shareable" feature card (🔗) reads "Public link your whole group can add to home screen to view as an app!" with no "No login necessary." sentence.
- There is no "See an Example" button anywhere on the page.

- [ ] **Step 3: Verify the button row**

Expected: three buttons in this order — "Create Your Group →", "Join by Code", "Browse Public Groups".

Click "Browse Public Groups" — expect navigation to `/discover`.

- [ ] **Step 4: Verify Join by Code — happy path**

Go back to `/`. Click "Join by Code".

Expected: the button is replaced by an inline text input (placeholder "Enter code") with a "Join →" button and a "✕" cancel button, appearing centered on its own line below the button row.

Find an existing group's join code (Supabase Table Editor → `groups` table → `join_code` column, or create a test group via `/create` and copy the code shown on the success screen). Type that code into the input (any case) and click "Join →".

Expected: navigation to `/join/<CODE>` (uppercased), which shows that group's join flow (or a sign-in prompt if not signed in).

- [ ] **Step 5: Verify Join by Code — invalid code and cancel**

Go back to `/`. Click "Join by Code", type a code that doesn't exist (e.g. `ZZZZZZ`), and submit.

Expected: navigation to `/join/ZZZZZZ`, which shows "Invalid join code".

Go back to `/`. Click "Join by Code" to expand it, then click the "✕" button.

Expected: the form collapses back to the plain "Join by Code" button, and the input is cleared (re-expanding shows an empty field).

- [ ] **Step 6: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: All existing tests pass (this change touches no tested logic, so the suite should be unaffected).

- [ ] **Step 7: Production build check**

Run: `npm run build`
Expected: Build completes with no errors.
