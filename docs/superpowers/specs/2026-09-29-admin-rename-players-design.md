# Admin: Rename Players — Design

## Goal
Group admins/owners can edit a player's name from the admin panel's Players tab.

## Why it's safe
Every game table, `group_members.player_id`, and all stats reference players by `users.id`,
never by name. Renaming updates one column on one row; history, claims and leaderboards follow
automatically.

## API
`PATCH /api/players/[id]` with body `{ name }`, added to `app/api/players/[id]/route.ts`.

- Auth: `authorizeRowMutation('users', id)` — reads `group_id` from the row, requires admin/owner
  of that group (same gate as DELETE).
- Validation: `name` trimmed; empty → 400.
- Unique-name violation (Postgres `23505`) → 409 `"<name> is already taken"`.
- Other DB errors → 500. Success → `{ player }`.

## UI
`components/admin/PlayersTab.tsx`: each row gets a `✏️ Rename` button beside `🗑 Delete`.
Clicking swaps the name for a text input prefilled with the current name, plus Save / Cancel.
Enter saves, Escape cancels. On success the page reloads (matches the delete flow); on error
the message shows under the row using the existing `errors` state.

## Out of scope
Renaming from non-admin pages, rename history/audit log.

## Testing
Manual: rename in admin panel, confirm leaderboards show new name; rename to an existing
name shows the 409 message; non-admin PATCH returns 403. The route is thin glue over the
already-tested `authorizeRowMutation`, so no new unit test.
