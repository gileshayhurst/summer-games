# Default Pinned Games → Pong, Beer Die, Poker

**Date:** 2026-06-26

## Goal

Change the three games that are automatically pinned in the mobile bottom navigation
for **new users** from Pong / Beer Die / Hearts to **Pong / Beer Die / Poker**.

## Change

In `components/BottomNav.tsx`, update the `DEFAULT_PINS` constant:

```js
const DEFAULT_PINS = ['pong', 'beer-die', 'hearts']
// →
const DEFAULT_PINS = ['pong', 'beer-die', 'poker']
```

`poker` already exists in `ALL_GAMES` (slug `poker`, icon ♠). `pinnedGames` is derived
by filtering `ALL_GAMES` in master-list order, so the bar renders
**🏓 Pong · 🎲 Beer Die · ♠ Poker**.

## Scope / behavior

- This is a **default only**. `DEFAULT_PINS` is the initial state used when a group has
  no saved selection in `localStorage` (`sg-pinned-<slug>`).
- On mount the component reads `localStorage` and, if a valid saved set exists, uses that
  instead. Therefore:
  - **New / untouched users** see the new default (Pong, Beer Die, Poker).
  - **Existing users with a saved pin set** keep their own choices — they are **not**
    force-reset.

## Out of scope

- No migration or reset of existing users' saved pins.
- No change to `MAX_PINS`, the All Games list, or the pin/unpin interaction.

## Testing

- Manual: in a browser with cleared `sg-pinned-*` localStorage, load a group page and
  confirm the bottom nav shows Pong, Beer Die, Poker.
- Manual: with an existing saved pin set, confirm it is preserved (not overwritten).
