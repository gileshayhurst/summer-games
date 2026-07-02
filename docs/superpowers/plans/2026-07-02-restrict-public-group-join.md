# Restrict Public Group Join Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Join →" button from public group pages so non-members can only view, and update Discover page copy to match.

**Architecture:** Two isolated UI-only edits in existing server components. No new files, no API or auth changes. The non-member banner on the group homepage drops its join link and becomes a read-only notice; the Discover page subtitle changes one word.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS

---

### Task 1: Update non-member banner on group homepage

**Files:**
- Modify: `app/g/[slug]/page.tsx` (lines 185–194)

- [ ] **Step 1: Make the change**

In `app/g/[slug]/page.tsx`, find the non-member banner block (currently around line 185) and replace it:

**Before:**
```tsx
{!member && isPublic && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between mb-6">
    <p className="text-sm font-bold text-stone-900">Sign in and join to log games.</p>
    <a
      href={`/join/${group.join_code}`}
      className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
    >
      Join →
    </a>
  </div>
)}
```

**After:**
```tsx
{!member && isPublic && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 mb-6">
    <p className="text-sm font-bold text-stone-900">Join this group with an invite link from a member.</p>
  </div>
)}
```

- [ ] **Step 2: Verify `join_code` is no longer referenced in this file**

Run:
```bash
grep -n "join_code" app/g/\[slug\]/page.tsx
```
Expected: no output (zero matches).

- [ ] **Step 3: Run the linter**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/g/[slug]/page.tsx
git commit -m "feat: replace join button on public group page with read-only invite notice"
```

---

### Task 2: Update Discover page subtitle

**Files:**
- Modify: `app/discover/page.tsx` (line 48)

- [ ] **Step 1: Make the change**

In `app/discover/page.tsx`, find the subtitle paragraph and change "follow" to "view":

**Before:**
```tsx
<p className="text-muted text-sm mt-1">Public groups you can follow.</p>
```

**After:**
```tsx
<p className="text-muted text-sm mt-1">Public groups you can view.</p>
```

- [ ] **Step 2: Run the linter**

```bash
npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/discover/page.tsx
git commit -m "fix: update Discover page copy from 'follow' to 'view'"
```

---

### Task 3: Verify in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check the Discover page**

Navigate to `http://localhost:3000/discover`. Confirm the subtitle reads "Public groups you can view."

- [ ] **Step 3: Check a public group page as a non-member**

Open a private/incognito window (or sign out) and navigate to a public group's URL (e.g. `http://localhost:3000/g/example` if it has `visibility: 'public'`, or any real public group slug).

Confirm:
- The amber banner is visible with text "Join this group with an invite link from a member."
- There is **no** "Join →" button.
- The rest of the page (game cards, recent games) renders normally.

- [ ] **Step 4: Confirm the join flow still works via direct link**

Navigate to `http://localhost:3000/join/[any-valid-code]`. Confirm the join page loads and the full join flow works as before.
