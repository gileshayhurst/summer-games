# My Groups — Landing Page Design

**Date:** 2026-07-02

## Summary

Add an auth-aware "Your Groups" section to the top of the landing page (`app/page.tsx`) so signed-in users can see and navigate to all their groups from a single place. This replaces the need to bookmark individual group URLs.

---

## Architecture

`app/page.tsx` becomes a dynamic server component:

- Add `export const dynamic = 'force-dynamic'`
- Call `getCurrentUser()` from `lib/auth.ts` at the top of the page
- If authenticated, query `group_members` (with joins to `groups` and `users`) using the service-role Supabase client from `lib/supabase-server.ts`
- Render a "Your Groups" section above the existing hero content, conditionally based on auth state

No new routes, no new API endpoints, no client components needed.

---

## Data Query

For a signed-in user, fetch:

```sql
group_members
  where user_id = current_user.id
  select role, player_id,
         groups (name, slug),
         users (name) -- via player_id
```

In practice: query `group_members` filtered by `user_id`, select `role`, `player_id`, and join `groups` for `name` and `slug`. If `player_id` is set, look up `users.name` for that ID. This can be done in one query with Supabase's relational select syntax.

Order results by group `name` ascending for stable display.

---

## UI — Three States

### State 1: Signed out

A compact amber-tinted banner between the nav and the hero:

- Label: **YOUR GROUPS** (small uppercase)
- Text: "Sign in to see your groups."
- Button: **Sign In →** — links to `/signin?next=/` so the user returns to the landing page after auth

### State 2: Signed in, no groups

Same banner position:

- Label: **YOUR GROUPS**
- Text: "You're not in any groups yet."
- Button: **Create One →** — links to `/create`

### State 3: Signed in, with groups

A card list in the amber-tinted section:

Each card shows:
- **Group name** (bold, links to `/g/[slug]`)
- Sub-line: "Playing as **[player name]**" — or "No player claimed yet" in muted italic if `player_id` is null
- **Role badge** on the right: Owner (amber), Admin (amber), Member (stone)

Cards are full-width links. The section expands naturally to fit the list — no scroll, no cap on number shown.

---

## Unchanged

- The existing hero, CTA buttons (Create / Join / Browse), feature cards, and suggestion form remain exactly as-is below the new section.
- The nav header is unchanged.
- All existing group pages, auth flows, and join flows are unaffected.

---

## Edge Cases

- **User is a member with no player claimed**: card shows "No player claimed yet" in muted italic. The card still links to `/g/[slug]`, from which the user can claim a player as usual. No special handling needed in this view.
- **Query returns no rows / DB error**: treat as zero groups — show State 2 (empty state) rather than crashing.

---

## Files Changed

| File | Change |
|------|--------|
| `app/page.tsx` | Add `dynamic = 'force-dynamic'`, auth check, groups query, "Your Groups" section |

No migrations, no schema changes, no new files needed.
