# Membership & Group Joining Design

**Date:** 2026-06-30
**Scope:** Spec 1 of 2. Covers identity, membership, group visibility, and the join flow. iOS App Store packaging is a separate spec.

---

## Problem

The app currently has no user identity. Groups are public URLs gated by a shared 4-digit PIN. This makes "private groups" impossible (any leaked link exposes the group) and "joining" meaningless (anyone with the URL can view everything). To support public/private groups with a real join flow, we need authenticated user accounts and a membership model.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Identity provider | Sign in with Apple (Supabase Auth) | Supabase is already the backend; Apple is required on iOS if any social login is offered |
| Privacy enforcement | App-layer guards (service-role client) | Fastest path to ship; easy to audit; existing routes mostly reused |
| Public group semantics | Viewable by anyone, joinable only by code/link | Prevents random strangers from logging games into public groups |
| Private group semantics | Invisible to non-members; code/link required to join | 404 returned (not 401) so group existence is not leaked |
| Join mechanism | 6-char join code or deep link (`/join/[code]`) | Same for public and private groups; visibility controls discoverability only |
| Player claiming | One member ↔ one player, enforced by unique index | Prevents two accounts claiming the same leaderboard identity |
| Legacy PIN column | Retained in DB, no longer used for auth | Avoids a risky migration; drop in a cleanup pass later |
| Directory | `/discover` screen listing public groups | Browse-only; no join button; accessible without sign-in |

---

## Data Model

### New tables

**`profiles`**
| column | type | notes |
|---|---|---|
| `id` | uuid PK | = Supabase auth user id |
| `display_name` | text | editable; seeded from Apple display name |
| `avatar_url` | text nullable | future use |
| `created_at` | timestamptz | |

Created automatically by a Supabase DB trigger on `auth.users` insert — the app never manually creates profiles.

**`group_members`**
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `group_id` | uuid FK → groups | |
| `user_id` | uuid FK → profiles | |
| `role` | text | `owner` \| `admin` \| `member` |
| `player_id` | uuid FK → users nullable | the player row this member has claimed |
| `joined_at` | timestamptz | |

Constraints:
- `UNIQUE (group_id, user_id)` — one membership row per person per group
- `UNIQUE (group_id, player_id)` — one member can claim each player; once claimed it is unavailable to others

### Modified tables

**`groups`** — add columns:
- `visibility` text `'public' | 'private'` DEFAULT `'private'`
- `join_code` text UNIQUE — 6-char alphanumeric, auto-generated on group creation
- `owner_id` uuid FK → profiles — set to creator on creation

The `pin` column is retained but no longer used for authentication.

### Unchanged tables

`users` (players), all `*_games` tables, all `*_game_players` tables — no structural changes. The new identity layer is purely additive.

---

## Auth Setup

- Enable the Apple provider in Supabase Auth.
- Install `@supabase/ssr` (replaces direct `createClient` calls on the browser side).
- **Server client:** reads the session from request cookies; used for identity checks. Still uses service-role key for actual DB queries.
- **Browser client:** stores session in cookies; used for sign-in, sign-out, and passing the session to server routes.
- **Profile trigger:** Supabase SQL function + trigger on `auth.users` that inserts into `profiles` on new user creation.

---

## App-Layer Guard

A server utility `requireAuth(request)` returns the current user's profile or redirects to sign-in.

A server utility `requireMembership(slug, userId?)` does the following:
1. Fetches the group by slug.
2. If `visibility = 'private'` and user has no `group_members` row → returns `notFound()` (404, not 401).
3. If `visibility = 'public'` → allows read-only access for any caller including unauthenticated.
4. If user has a membership row → returns `{ group, member }` with their role.

Every server page under `/g/[slug]/` and every API route under `/api/` that touches group data calls this guard. Write operations (log game, admin actions) additionally assert `member.role !== null`.

---

## Screens & Flows

### Sign-in screen
- Shown when an unauthenticated user attempts an authenticated action (join, log, create).
- Single "Continue with Apple" button.
- Redirects back to the originating page after sign-in.

### Directory (`/discover`)
- Accessible without sign-in.
- Lists all `visibility = 'public'` groups: name, member count, most recent game date.
- Tapping a group opens it in read-only mode.
- No join button — directory is spectating only.

### Group home (`/g/[slug]/`)
| Visitor type | Experience |
|---|---|
| Private group, not a member | 404 |
| Public group, not signed in | Full read-only; no LOG+; subtle "Sign in to join" |
| Public group, signed in but not a member | Full read-only; "Join this group" CTA using the join code |
| Member (`member` / `admin` / `owner`) | Full experience: LOG+, pin customisation, all existing features |

### Join flow (`/join/[code]`)
1. User arrives via deep link or types the 6-char code at a join screen.
2. If not signed in → Apple sign-in, then continue.
3. Validate code → show group name + member count ("Joining Rob's Crew — 8 members").
4. **Claim or create player:**
   - List of unclaimed players in the group (claimed players greyed out and labelled).
   - Search field.
   - Bottom option: "I'm not listed — create my player" → name input.
   - Option to skip: "Join without claiming a player (do this later)."
5. One tap to confirm → `group_members` row inserted, `player_id` set if claimed.
6. Redirect to group home as a member.

If the user skipped claiming: a persistent banner on the group home page ("You haven't claimed a player yet — claim one to appear on leaderboards") links back to a claim screen at `/g/[slug]/claim`. The claim screen is the same player list from step 4. Admins can also link a member to a player from the Members tab.

Tapping a claimed (greyed-out) player shows: "This player is already claimed by another member."

### Create group flow (replaces `/create`)
- Creator must be signed in (redirect to sign-in if not).
- Same fields as today: group name, slug, initial players.
- PIN field is removed.
- On submit:
  - Group created with `visibility = 'private'` by default.
  - `join_code` auto-generated (6-char, unique, retry if collision).
  - Creator inserted into `group_members` with `role = 'owner'`.
- After creation → "Share your group" screen showing join link and code, plus visibility toggle (public/private).

### Admin screen (`/g/[slug]/admin`)
- Access gated by role check (`owner` or `admin`); PIN gate removed.
- **Existing tabs:** approve/edit/delete games (unchanged).
- **New tab — Members:**
  - List of all members: display name, claimed player (or "unclaimed"), role badge.
  - Owner actions: promote to admin, demote to member, remove from group, unlink player claim.
- **New tab — Group settings:**
  - Visibility toggle: Public / Private.
  - Join code: shown, with "Rotate code" button (invalidates old code) and "Copy join link" button.
  - Group name and slug editing (slug change is dangerous — confirm dialog).

---

## Role Permissions Matrix

| Action | Unauthenticated | Member | Admin | Owner |
|---|---|---|---|---|
| View public group | ✓ | ✓ | ✓ | ✓ |
| View private group | ✗ (404) | ✓ | ✓ | ✓ |
| Log a game | ✗ | ✓ | ✓ | ✓ |
| Approve / edit / delete games | ✗ | ✗ | ✓ | ✓ |
| Manage members | ✗ | ✗ | ✓ | ✓ |
| Promote/demote admins | ✗ | ✗ | ✗ | ✓ |
| Rotate join code | ✗ | ✗ | ✓ | ✓ |
| Change visibility | ✗ | ✗ | ✓ | ✓ |
| Add / edit players | ✗ | ✗ | ✓ | ✓ |
| Transfer ownership | ✗ | ✗ | ✗ | ✓ |

---

## What Does NOT Change

- All game tables, leaderboard logic, and stats computation are untouched.
- The `users` (players) table is structurally unchanged.
- All existing `/api/*` route shapes are reused — guards are added, not routes replaced.
- The example group (`/g/example`) continues to work without auth (it can be hard-coded as a public group with a no-op guard).
- Desktop layout unchanged; this is mobile-first but the web UI is the same app.

---

## Out of Scope (this spec)

- iOS App Store packaging (Capacitor) — separate spec.
- Push notifications.
- Row-Level Security (Postgres RLS) — retained as a future hardening option.
- Dropping the legacy `pin` column.
- Group discovery search / filtering beyond a basic list.
- Transferring group ownership UI (the DB supports it; the UI is a later add).
