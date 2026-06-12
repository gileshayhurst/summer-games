# Admin Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace URL-hack admin access with a ⚙️ icon in the group nav, and update related copy to match.

**Architecture:** Three isolated text/JSX edits across three existing files — no new files, no new logic, no state changes. Each task is fully independent and can be committed separately.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS

---

### Task 1: Add ⚙️ admin link to GroupNav

**Files:**
- Modify: `components/GroupNav.tsx`

- [ ] **Step 1: Open the file and locate the LOG GAME button**

The right end of the `<nav>` element currently ends with:

```tsx
<Link
  href={`${base}/log`}
  className="shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
>
  LOG GAME →
</Link>
```

- [ ] **Step 2: Add the ⚙️ link immediately before the LOG GAME button**

Replace the LOG GAME link with this pair (⚙️ first, then LOG GAME):

```tsx
<Link
  href={`${base}/admin`}
  className="text-muted hover:text-stone-900 transition-colors mr-2 text-base shrink-0"
  aria-label="Admin settings"
>
  ⚙️
</Link>
<Link
  href={`${base}/log`}
  className="shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
>
  LOG GAME →
</Link>
```

- [ ] **Step 3: Verify the file compiles — run the type-check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/GroupNav.tsx
git commit -m "feat: add admin settings icon to group nav"
```

---

### Task 2: Update Admin PIN label on create page

**Files:**
- Modify: `app/create/page.tsx`

- [ ] **Step 1: Locate the Admin PIN label**

In `app/create/page.tsx` around line 77, the label currently reads:

```tsx
<label className="text-xs text-muted uppercase tracking-wide block mb-2">Admin PIN (4 digits)</label>
```

- [ ] **Step 2: Update the label text**

Replace it with:

```tsx
<label className="text-xs text-muted uppercase tracking-wide block mb-2">Admin PIN (4 digits) — accessible through ⚙️</label>
```

- [ ] **Step 3: Verify the file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/create/page.tsx
git commit -m "feat: clarify admin PIN label with settings icon reference"
```

---

### Task 3: Update tip text on log page

**Files:**
- Modify: `app/g/[slug]/log/page.tsx`

- [ ] **Step 1: Locate the tip text**

In `app/g/[slug]/log/page.tsx` around line 18, the tip currently reads:

```tsx
To approve submissions, add <span className="font-mono text-brand">/admin</span> to the end of your group link (PIN required).
```

- [ ] **Step 2: Replace with updated copy**

Replace that line with:

```tsx
To approve submissions, tap the ⚙️ icon in the nav (PIN required).
```

The full `<div>` block should now look like:

```tsx
<div className="bg-amber-50 border border-warm rounded-xl px-4 py-3 mb-8 text-sm text-stone-700">
  🔒 <span className="font-bold">Games are reviewed before appearing on the leaderboard</span> — this keeps things fair on a public site.
  To approve submissions, tap the ⚙️ icon in the nav (PIN required).
</div>
```

- [ ] **Step 3: Verify the file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/log/page.tsx"
git commit -m "feat: update log page tip to reference settings icon"
```
