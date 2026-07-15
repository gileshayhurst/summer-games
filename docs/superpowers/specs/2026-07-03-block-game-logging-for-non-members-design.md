# Block Game Logging for Non-Members

**Date:** 2026-07-03  
**Status:** Approved

## Problem

Users browsing public groups via the Discover page can navigate to `/g/[slug]/log` and see the full "Log a Game" form even though they are not group members. The API routes already reject submissions with 403, but the UI presents the form without any indication that the user lacks permission — leading to a confusing dead end. The LOG GAME and LOG+ nav buttons are also visible to non-members, which is misleading.

## Scope

Fix three files with two layers of defense. No schema changes, no new components, no new props.

---

## Layer 1 — Page Guard

**File:** `app/g/[slug]/log/page.tsx`

Call `requireMembership(params.slug)` in the page (Next.js deduplicates this fetch with the layout's call). If `member` is null, render a "members only" card instead of `LogTabs`.

**Members-only UI:** An amber card matching the app's existing style (`bg-amber-50 border border-warm rounded-xl p-4`), containing:
- Heading: "Members only"
- Body: "You need to be a member to log games. Ask a group member for an invite link."

No redirect. The user stays on the page and can read the message.

---

## Layer 2 — Nav Button Guards

Both `GroupNav` and `BottomNav` are client components under `GroupProvider`. They gain access to membership by calling `useGroup()` (already importable from `@/lib/group-context`).

**`components/GroupNav.tsx`**
- Call `const { membership } = useGroup()` inside the component.
- Wrap the "LOG GAME →" `<Link>` in `{membership && ...}` so it only renders for members.

**`components/BottomNav.tsx`**
- Call `const { membership } = useGroup()` inside the component.
- Change the LOG+ button condition from `{isExample ? ... : <Link ...>LOG+</Link>}` to `{isExample || !membership ? <div className="flex-1" /> : <Link ...>LOG+</Link>}` — non-members get an empty spacer to preserve layout, same as the `isExample` path.

---

## What Is Not Changing

- `requireMembership` behaviour — no changes to auth logic.
- API route guards — already correct, no changes needed.
- The group home, game leaderboard pages, players page — all remain viewable by non-members (intentional for public groups).
- The `isExample` flag — untouched; example group logic is separate.
