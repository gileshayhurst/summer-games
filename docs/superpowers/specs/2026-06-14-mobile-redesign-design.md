# Mobile Redesign Design Spec

**Date:** 2026-06-14  
**Scope:** Mobile-first redesign of the group pages. Two changes: (1) replace the overflowing top nav with a customisable bottom tab bar on mobile, (2) transform the home page game grid from pure navigation links into leader cards showing the current #1 player per game. Desktop is unchanged.

---

## Problem

`GroupNav` uses `flex-wrap` on 6 nav items, collapsing into multiple rows on mobile and making the nav tall and messy. The home page game grid is also pure navigation, redundant once a bottom bar exists.

---

## Change 1: Mobile Bottom Tab Bar

### Layout

**Mobile top bar** (modified `GroupNav`):
- Slim single row: 🏠 | Group Name | ⚙️
- Game nav links hidden on mobile (`hidden md:flex` on the link container)
- LOG GAME button removed from top bar on mobile (moves to bottom bar)

**Bottom bar** (new `BottomNav` component, `md:hidden`):
- Fixed to bottom of screen, always visible on mobile
- 5 slots: `[Game A] [Game B] [LOG GAME] [Game C] [More]`
- LOG GAME is always the centre slot — never customisable
- The 3 game slots (left of LOG, right of LOG, rightmost before More) hold pinned games
- Active game tab has an orange underline

**Desktop**: existing `GroupNav` unchanged. `BottomNav` is hidden (`md:hidden`).

### Customisation — Pin/Unpin

**Persistence**: `localStorage` key `sg-pinned-${slug}` stores a JSON array of game slugs, e.g. `["pong", "beer-die", "hearts"]`. Max length 3.

**Default** (first visit / no stored value): `["pong", "beer-die", "hearts"]`

**All pinnable items** (in list order):
`pong`, `beer-die`, `hearts`, `cornhole`, `spikeball`, `players`
Future games added to this list are automatically available in More.

### More Sheet

Tapping "···  More" opens a bottom sheet (slides up). Sheet shows:
- Pull handle at top
- "All Games" label
- Every game item regardless of pin state, in list order
- Each item: icon + label on the left, badge on the right
  - Green "PINNED" badge → tap to unpin
  - Grey "+ PIN" badge → tap to pin
  - When 3 slots are full: "+ PIN" is greyed out, a hint reads "Bar full — unpin one to add another"
- Tapping a non-pinned game name navigates to that game (closes sheet)
- Tapping outside the sheet closes it

### Bar slot order
Pinned games appear in the bar in the order they appear in the master list (not the order they were pinned). This keeps the bar stable as games are added/removed.

---

## Change 2: Home Page Leader Cards

### What changes
The 5 game link cards on `/g/[slug]` are replaced with leader cards. Each card:
- Game icon + game name (same as before)
- **Current leader's name** (bold, from top of that game's leaderboard)
- **Record**: `{wins}W · {losses}L · {win_rate%}` (same format for all games)
- Tapping the card navigates to that game's leaderboard (same as before)
- If no games played yet: show `—` for name and `No games yet` for record

### Hearts record
Hearts leaderboard ranks by lowest `loss_rate`. The #1 player (lowest loss rate) is shown. Derived wins = `games_played − losses`. Display: `{wins}W · {losses}L · {Math.round((1 − loss_rate) * 100)}%`. Same format as all other games.

### Data fetching
The home page (`app/g/[slug]/page.tsx`) adds leaderboard queries — one per game — to get the top-ranked player. Uses the same Supabase queries already used in each game's individual page, but fetches only enough data to compute rank #1.

### Grid layout
- Mobile: 2-column grid (down from 3-column)
- Desktop: 5-column grid (unchanged)
- Card padding reduced (`p-4` instead of `p-6`) for mobile compactness

---

## File Map

| Action | File | Notes |
|---|---|---|
| Modify | `components/GroupNav.tsx` | Hide game links on mobile; remove LOG GAME on mobile |
| Create | `components/BottomNav.tsx` | New client component — bottom bar + More sheet + pin state |
| Modify | `app/g/[slug]/layout.tsx` | Render `<BottomNav>` beneath `<GroupNav>` |
| Modify | `app/g/[slug]/page.tsx` | Fetch top player per game; render leader cards |

---

## Out of scope

- Desktop nav changes
- Drag-to-reorder
- Server-side pin persistence (localStorage is sufficient, no login exists)
- Landing page (`/`) or create page
