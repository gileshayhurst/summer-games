# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all Jest tests
npm run test:watch   # Jest in watch mode
npx jest __tests__/lib/stats.test.ts   # Run a single test file
npm run seed         # Seed the database (scripts/seed.ts)
```

## Environment Variables

The app requires `.env.local` with:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — used by `lib/supabase-server.ts` for all server-side DB access (bypasses RLS)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by `lib/auth.ts` for cookie-based auth via `@supabase/ssr`

## Architecture

**Next.js 14 App Router** with Supabase as the database and auth provider.

### Data model

- **`users`** — the playerbase. One row per named player in a group. Players exist before any auth user claims them. `group_id` on each `users` row scopes players to a group.
- **`groups`** — a game group with a `slug` (URL key), `visibility` (`public`/`private`), `join_code`, and `owner_id`.
- **`group_members`** — the auth membership table. Links a Supabase auth user (`profiles.id`) to a group, with `role` (`owner`/`admin`/`member`) and an optional `player_id` foreign key into `users`. A user can be a member without having claimed a player slot.
- **`profiles`** — one row per Supabase auth user, auto-created by a DB trigger on sign-up.
- Game tables: `pong_games` / `pong_game_players`, `beer_die_games`, `hearts_games` / `hearts_game_players`, `cornhole_games`, `spikeball_games`, `pool_games`, `poker_games`.

**Key distinction**: `users` = players (named people in the playerbase, may be unclaimed); `profiles` = authenticated app users; `group_members` = the bridge between them.

### Auth flow (`lib/auth.ts`)

`requireMembership(slug)` is called in every page layout under `/g/[slug]/`. It:
1. Fetches the group by slug.
2. Looks up the current user's `group_members` row.
3. For **public** groups: returns `member: null` if the user isn't a member — public pages render for non-members.
4. For **private** groups with no member row: calls `notFound()`, except for legacy groups (`owner_id === null`) which auto-enroll signed-in visitors.

`getMemberForAPI(groupId)` is the equivalent for API route handlers — returns `null` if unauthenticated or not a member.

Two different Supabase clients are used:
- `createServerClient()` (`lib/supabase-server.ts`) — service-role key, used for all data queries (bypasses RLS).
- `createCookieClient()` inside `lib/auth.ts` — anon key + cookie jar, used only for `auth.getUser()`.

### Group context

`GroupProvider` / `lib/group-context.tsx` provides `{ id, slug, name, membership }` to all client components under `/g/[slug]/`. Access it with `useGroup()`.

### Stats (`lib/stats.ts`)

Pure functions that compute leaderboards and streaks from raw game-player arrays fetched server-side. No DB queries inside — all data is fetched in the page, passed in. Players whose names start with `random` (case-insensitive) are filtered out of leaderboards via the `isVisible` helper.

### API routes

All game CRUD lives under `app/api/{game}/`. Pattern: `POST /api/pong` to create, `PUT /api/pong/[id]` to edit, `DELETE /api/pong/[id]` to delete. All mutating routes check `getMemberForAPI` and require at least `role: 'member'`; admin operations additionally check for `role: 'admin'` or `role: 'owner'`.

### Groups with `example` slug

`app/g/example/` is a static demo group with hardcoded data (`app/g/example/data.ts`) — no DB queries. It's used as a landing-page preview.
