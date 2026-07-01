# Admin Requests & Log Out

**Date:** 2026-07-01

## Summary

Two additions to the membership/auth model:

1. A member who isn't an admin/owner can request admin status from the group's admin page. The group owner sees pending requests at the top of the admin page and can approve or deny them.
2. A "Log Out" button on the My Stats page (`/g/[slug]/me`).

## Scope

Applies only to people who are already members of the group (signed in, joined via code/link) with `role = 'member'`. Non-members and signed-out visitors keep today's behavior when hitting `/g/[slug]/admin` — `notFound()` for private groups (or the existing join-flow for public groups). This feature does not change access for anyone who isn't already a member.

## Data Model

New migration `supabase/migrations/20260701_admin_requests.sql`:

```sql
ALTER TABLE group_members ADD COLUMN admin_requested_at TIMESTAMPTZ;
```

Nullable, single column, no history table. A member has at most one pending request at a time:
- `NULL` — no pending request.
- Set — request pending review.
- Denial resets it back to `NULL` (not a permanent "denied" state) — the member can request again anytime.
- Approval promotes `role` to `admin` and clears it back to `NULL`.

## Admin Page Gating (`app/g/[slug]/admin/page.tsx`)

Today this page calls `requireRole(params.slug, ['admin', 'owner'])`, which 404s any non-admin/owner. Replace this with a direct call to `requireMembership(params.slug)` and branch on `member.role`:

| Case | Behavior |
|---|---|
| Not a member (`member` is `null`) | Unchanged — `notFound()` for private groups, existing join-flow behavior for public groups. |
| `member.role === 'member'`, no pending request | Render the **Request Admin** screen (see below) instead of the admin panel. |
| `member.role === 'member'`, pending request | Render the **Request Pending** screen (see below). |
| `member.role` is `admin` or `owner` | Unchanged — full admin panel as today. |

`requireRole` in [lib/auth.ts](../../../lib/auth.ts) has no other callers after this change and will be deleted.

### Request Admin screen

Shown to a `member`-role visitor with no pending request:
- Heading: "You don't have admin access"
- Body copy: "Ask the group owner to make you an admin, or request it yourself."
- **Request Admin Status** button (primary)
- "← Back to group" link → `/g/[slug]`

### Request Pending screen

Shown to a `member`-role visitor with a pending request:
- Heading: "Your request is pending"
- Body copy: "The group owner will review your request soon."
- "← Back to group" link → `/g/[slug]` (no request button — already pending)

## Self-Service Request API

New route `app/api/groups/[id]/request-admin/route.ts`:

- **`POST`** — resolves the caller's own membership via `getMemberForAPI(params.id)`.
  - Not a member → 403.
  - Already `admin`/`owner` → 400 (no-op).
  - Already has `admin_requested_at` set → 400 (no-op).
  - Otherwise → sets `admin_requested_at = now()` on the caller's own `group_members` row and returns `{ ok: true }`.

The "Request Admin Status" button is a client component (`components/admin/RequestAdminButton.tsx`) that POSTs to this route and flips the page into the pending state on success, without a full reload.

## Owner-Side Approval UI

New component `components/admin/AdminRequestsList.tsx`, styled after the existing [SuggestionsList.tsx](../../../components/admin/SuggestionsList.tsx) pattern:
- Renders `null` entirely when there are no pending requests.
- Otherwise: heading "Admin Requests" with a count badge, one card per pending request showing the requester's display name and claimed player (or "unclaimed"), with **Approve** / **Deny** buttons.

Rendered in `app/g/[slug]/admin/page.tsx` above `SuggestionsList`/`AdminPanel`, **only when the current viewer's `member.role === 'owner'`** (approval is owner-only, matching the existing promote/demote restriction). The page's existing `group_members` query already does `select('*', ...)`, so `admin_requested_at` is included automatically — filter `membersRaw` client-side (server-side, in the page component) for entries where `admin_requested_at` is not null and pass them as a `pendingRequests` prop.

### Approve / Deny actions

Both reuse the existing `PATCH /api/groups/[id]/members/[userId]` route (already owner-gated for role changes) rather than adding new endpoints:

- **Approve** → `PATCH { role: 'admin' }`. Existing behavior (owner-only, sets role). Additionally: whenever `role` is changed by this route (promote or demote), clear `admin_requested_at` back to `NULL` in the same update, since a stale pending flag no longer makes sense after a role change.
- **Deny** → `PATCH { admin_requested_at: null }`. New field branch in the route, gated the same way role changes are (owner-only).

## Log Out

New client component `components/LogOutButton.tsx`:
- Uses the same `createBrowserClient` pattern as [AuthProvider.tsx](../../../components/AuthProvider.tsx) / [app/signin/page.tsx](../../../app/signin/page.tsx).
- On click: calls `supabase.auth.signOut()`, then redirects to `/`.

Placed on `app/g/[slug]/me/page.tsx`, near the existing "Signed in as {playerName}" line.

## Files Touched

- `supabase/migrations/20260701_admin_requests.sql` (new)
- `lib/auth.ts` — remove unused `requireRole`
- `app/g/[slug]/admin/page.tsx` — switch to `requireMembership`, branch on role, render new screens/component
- `app/api/groups/[id]/request-admin/route.ts` (new)
- `app/api/groups/[id]/members/[userId]/route.ts` — clear `admin_requested_at` on role change; support `admin_requested_at: null` (deny)
- `components/admin/RequestAdminButton.tsx` (new)
- `components/admin/AdminRequestsList.tsx` (new)
- `components/LogOutButton.tsx` (new)
- `app/g/[slug]/me/page.tsx` — add `LogOutButton`

## Out of Scope

- Non-members requesting admin status without first joining the group.
- Any admin (non-owner) approving/denying requests.
- Request history/audit trail.
- Notifying the requester when their request is approved/denied (they see the updated state next time they visit the admin page).
- Canceling a pending request from the requester's side.
- Changes to the join flow, member removal, or any other existing admin panel behavior.
