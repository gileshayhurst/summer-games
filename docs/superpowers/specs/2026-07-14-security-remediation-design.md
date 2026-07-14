# Security Remediation — Design

**Date:** 2026-07-14
**Status:** Approved, ready for implementation plan

## Background

A full security audit found that every database query in the app uses the
Supabase **service-role key** (`lib/supabase-server.ts`), which bypasses Row-Level
Security. There are no RLS policies. Therefore the authorization check inside each
API route is the *only* thing gating access to the database, and any route missing
that check is fully exposed to the internet.

The audit produced findings from one critical bug to a set of hardening gaps. This
design covers **all** of them.

### Findings addressed

| # | Severity | Finding |
|---|----------|---------|
| 1 | Critical | Game `[id]` routes (PUT/DELETE/PATCH) for all 7 games have zero authorization — anyone unauthenticated can edit, delete, or approve any game in any group. |
| 2 | High | No RLS anywhere; no defense-in-depth behind the API checks. |
| 3 | Medium | Read routes (`GET /api/{game}`, `/players`, `/record-with`, `/head-to-head`) take `group_id` with no membership check, leaking private-group data. |
| 3b | Medium | `/api/recent` is global (no group filter) and surfaces **private** groups' player names and results on the public landing page. |
| 4 | Medium | No rate limiting; join codes are 6 chars from a 32-char alphabet via `Math.random()`, brute-forceable with no throttle. |
| 5 | Low | `/api/suggestions` POST is unauthenticated and unvalidated (spam/abuse). |
| 6 | Low | Join code uses non-cryptographic `Math.random()`. |

## Decisions

- **Scope:** every finding above.
- **Edit/delete/approve permission:** `admin`/`owner` only, matching the current
  UI (all edit/delete/approve controls live under `components/admin/`). Creating a
  game stays open to any member.
- **RLS style:** enable RLS with **no policies** (deny-all to anon/authenticated
  clients). Safe because the app reads exclusively via the service-role key; the
  anon client is used only for `auth.*` calls, never table reads.
- **Rate limiting:** in-memory / best-effort now, with the distributed upgrade
  (Upstash or Vercel WAF) tracked as a follow-up — not shipped in this pass.

## Design

### 1. Authorize the game `[id]` routes (fixes #1)

The 7 files `app/api/{game}/[id]/route.ts` (pong, beer-die, hearts, cornhole,
poker, pool, spikeball) gain an admin/owner gate on PUT, DELETE, and PATCH.

The handler only receives a game `id`, and the PUT body's `group_id` is
attacker-controlled, so the group is derived **from the game record**, never from
input:

1. Fetch the game by `params.id`; read its real `group_id`. Return 404 if not found.
2. Call `requireGroupAdmin(group_id)`; return 403 unless role is `admin`/`owner`.
3. Proceed with the existing mutation logic.

This closes the missing-auth hole and the cross-group hole (editing a game in group
A while claiming admin on group B) together. On PUT, stop trusting `group_id` from
the body — use the game's own `group_id` for the inserted player rows.

### 2. Shared auth helpers (supports #1, #3)

Add to `lib/auth.ts`, reusing `getMemberForAPI`:

- `requireGroupAdmin(groupId): Promise<GroupMember | null>` — returns the member
  when role is `admin`/`owner`, else `null`.
- `canReadGroup(groupId): Promise<boolean>` — `true` when the group's
  `visibility === 'public'` **or** the caller is a member. Mirrors the read rule
  already in `requireMembership`.

Centralizing prevents the next new route from silently omitting the check.

### 3. Scope the read routes (fixes #3, #3b)

- Apply `canReadGroup(group_id)` (403 on false) to the GET handlers of
  `/api/{game}`, `/api/{game}/record-with`, `/api/{game}/head-to-head`, and
  `/api/players`.
- `/api/join/[code]` GET stays public (needed before joining) but is rate-limited
  (see §5).
- `/api/recent`: rewrite to join `groups` and return only games where
  `visibility = 'public'`, eliminating the private-group leak on the landing page.

### 4. RLS backstop (fixes #2)

New migration under `supabase/migrations/`:
`ENABLE ROW LEVEL SECURITY` on every app table — `users`, `groups`,
`group_members`, `profiles`, and all `*_games` / `*_game_players` tables — with **no
policies**. The service-role key bypasses RLS, so app behavior is unchanged; any
future accidental exposure through the anon client becomes deny-all rather than
full read.

### 5. Rate limiting — in-memory, marked for upgrade (fixes #4, part of #5)

New `lib/rate-limit.ts`: a small `Map` of key → recent-request timestamps (~10
lines), keyed by client IP + route. Applied to the abuse-prone unauthenticated
routes:

- `POST /api/join/[code]` (join-code brute force)
- `POST /api/groups`
- `POST /api/suggestions`

Carries a `ponytail:` comment naming the ceiling (per serverless instance; resets
on cold start; not shared across instances) and the upgrade path. Also listed under
Follow-ups below.

### 6. Low-severity cleanups (fixes #5, #6)

- `POST /api/suggestions`: keep public (feedback form), but cap each field's length
  and apply the rate limit from §5.
- `lib/join-code.ts`: replace `Math.random()` with `crypto.randomInt`.

## Verification

Repo uses Jest. One runnable check per non-trivial piece:

- Unauthenticated `DELETE` on a game `[id]` route returns 403.
- `requireGroupAdmin` returns null for a plain member, the member for an admin/owner.
- `canReadGroup` allows a public group for a non-member and denies a private group
  for a non-member.
- `/api/recent` query excludes private-group games.

## Follow-ups (out of scope for this pass)

- **Distributed rate limiting.** Replace the in-memory limiter with Upstash Redis
  (`@upstash/ratelimit`, free tier, in-repo, per-route) or Vercel WAF rules (Pro
  plan, dashboard-managed). The in-memory version only slows casual abuse; a
  determined attacker across cold starts / instances is not stopped.
