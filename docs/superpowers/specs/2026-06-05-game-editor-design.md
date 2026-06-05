# Game Editor — Design Spec
**Date:** 2026-06-05

## Summary

An `/admin` page that lists all logged games across Pong, Beer Die, and Hearts. Protected by a PIN ("1111" stored in `sessionStorage`). Each game row has **Edit** and **Delete** actions. Edit shows an inline form pre-filled with current values. Delete requires a confirmation click before proceeding.

---

## Password Gate

- Client-side only. On mount, `AdminPanel` checks `sessionStorage.getItem('admin_authed')`.
- If not set: renders a PIN input. Correct entry ("1111") sets `sessionStorage.setItem('admin_authed', '1')` and reveals the panel.
- Wrong entry shows an error message.
- No server-side auth. This is a casual accidental-edit guard for a friends-only tracker.

---

## Pages & Components

### `app/admin/page.tsx` (Server Component)
- `export const dynamic = 'force-dynamic'`
- Fetches all games + all users directly from Supabase (no self-fetch via API)
- Passes structured data to `<AdminPanel>`
- Data fetched:
  - `pong_games` with `pong_game_players(player_id, side)`, ordered newest-first
  - `beer_die_games` (explicit columns), ordered newest-first
  - `hearts_games` with `hearts_game_players(player_id, lost)`, ordered newest-first
  - `users(id, name)`, ordered by name

### `components/admin/AdminPanel.tsx` (Client Component)
Receives: `pongGames`, `beerDieGames`, `heartsGames`, `players: User[]`

State:
- `authed: boolean` — derived from sessionStorage on mount
- `pin: string` — PIN input value
- `editingId: string | null` — which game row is open for editing
- `confirmDeleteId: string | null` — which game is awaiting delete confirmation

Renders a flat chronological list of all games. Each row shows:
- Type badge (PONG / BEER DIE / HEARTS)
- Game summary (player names + score)
- **Edit** button — toggles inline edit form below the row
- **Delete** button — shows "Confirm?" with Yes/Cancel; on Yes sends DELETE and calls `window.location.reload()`

After a successful edit save: calls `window.location.reload()`.

### `components/admin/EditPongGame.tsx` (Client Component)
Props: `game` (id, cups_left, winner_ids, loser_ids), `players: User[]`, `onSave()`, `onCancel()`
- `PlayerSelector` for winners (excluded: current losers)
- `PlayerSelector` for losers (excluded: current winners)
- Number input for cups_left (min 0)
- Save → `PUT /api/pong/{id}` with `{ winner_ids, loser_ids, cups_left }`

### `components/admin/EditBeerDieGame.tsx` (Client Component)
Props: `game` (id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential), `players: User[]`, `onSave()`, `onCancel()`
- Four individual `<select>` dropdowns (winner 1, winner 2, loser 1, loser 2) — all must be distinct
- Number input for points_differential (min 1)
- Save → `PUT /api/beer-die/{id}` with updated fields

### `components/admin/EditHeartsGame.tsx` (Client Component)
Props: `game` (id, game_players: {player_id, lost}[]), `players: User[]`, `onSave()`, `onCancel()`
- Toggle buttons per player (in/out of game)
- Among participants, a "LOST" toggle to mark exactly one loser
- Validates: ≥ 3 participants, exactly 1 loser
- Save → `PUT /api/hearts/{id}` with `{ game_players: [{player_id, lost}] }`

---

## API Routes

### `app/api/pong/[id]/route.ts`
**PUT** — accepts `{ winner_ids: string[], loser_ids: string[], cups_left: number }`
1. Update `pong_games` set `cups_left` where `id`
2. Delete all `pong_game_players` where `game_id`
3. Insert new player rows

**DELETE** — delete from `pong_games` where `id` (CASCADE removes `pong_game_players`)

### `app/api/beer-die/[id]/route.ts`
**PUT** — accepts `{ winner1_id, winner2_id, loser1_id, loser2_id, points_differential }`
1. Update `beer_die_games` where `id`

**DELETE** — delete from `beer_die_games` where `id` (CASCADE removes `beer_die_sinks`)

### `app/api/hearts/[id]/route.ts`
**PUT** — accepts `{ game_players: [{ player_id: string, lost: boolean }] }`
1. Delete all `hearts_game_players` where `game_id`
2. Insert new player rows

**DELETE** — delete from `hearts_games` where `id` (CASCADE removes `hearts_game_players`)

All routes return `{ ok: true }` on success or `{ error: string }` with appropriate status on failure.

---

## Out of Scope

- Beer Die sink editing (sinks remain attached to the game after a player edit)
- Creating new games from admin (use the /log page)
- Any server-side authentication
- Navigation link to /admin (access by typing the URL directly)
