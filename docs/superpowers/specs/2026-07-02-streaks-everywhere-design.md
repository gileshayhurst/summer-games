# Streaks everywhere

**Date:** 2026-07-02
**Status:** Approved

## Goal

Surface win streaks in two places they are currently absent:

1. Every individual game leaderboard page (pong, hearts, cornhole, spikeball, pool, poker), matching the decoration Beer Die already shows.
2. The home page game cards, where the top 3 hottest players per game appear in the top-right corner.

No changes to `lib/stats.ts` — all leaderboards already compute `current_streak` and `max_streak`.

---

## Part 1 — Leaderboard streak decoration

### Behaviour

On each game leaderboard page, any player whose `current_streak >= 3` gets their name decorated in the Player column. The format is:

```
🔥{N} {Name}
```

e.g. `🔥5 Jake`

The number comes **before** the name. This updates Beer Die (which currently renders `Jake 🔥5`) and adds the decoration to all other games.

### Threshold

`current_streak >= 3`. Players below this threshold show their name undecorated.

### Files

Apply the same `entries` mapping pattern that Beer Die already uses, updated to the new format:

```ts
const entries = leaderboard.map(e => ({
  ...e,
  name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
}))
```

Affected pages (under `app/g/[slug]/`):

- `pong/page.tsx` — add mapping
- `beer-die/page.tsx` — update format (flip number/name order)
- `hearts/page.tsx` — add mapping
- `cornhole/page.tsx` — add mapping
- `spikeball/page.tsx` — add mapping
- `pool/page.tsx` — add mapping
- `poker/page.tsx` — add mapping

Mirror the same changes to all seven pages under `app/g/example/`.

---

## Part 2 — Home page card hot streaks

### Behaviour

Each game card on the home page (`app/g/[slug]/page.tsx`) shows up to 3 players currently on a winning streak of 3 or more, stacked in the top-right corner of the card:

```
🔥5 Jake
🔥3 Mike
🔥3 Sam
```

If no player has a streak ≥ 3, the top-right corner is empty (no placeholder text).

### Sorting

Hot streaks within a game are sorted by:

1. `current_streak` descending (primary)
2. `wins` descending (tie-breaker)

For Hearts the wins proxy is `games_played - losses`; for Poker it is `win_sessions`. This ensures that when multiple players share the same streak length, those with more overall wins in that game rank higher and are more likely to appear in the top 3.

### Data model

Extend the existing `GameLeader` type:

```ts
type GameLeader = {
  name: string
  wins: number
  losses: number
  winRatePct: number
  statLine?: string
  hotStreaks: { name: string; streak: number }[]
} | null
```

`hotStreaks` is always an array (empty when no active streaks ≥ 3), never undefined.

### Implementation

In `getGameLeaders`, after computing each leaderboard, derive hot streaks with a shared helper:

```ts
function topStreaks(
  entries: { name: string; current_streak: number; wins?: number }[],
  winsOf: (e: any) => number
): { name: string; streak: number }[] {
  return entries
    .filter(e => e.current_streak >= 3)
    .sort((a, b) => b.current_streak - a.current_streak || winsOf(b) - winsOf(a))
    .slice(0, 3)
    .map(e => ({ name: e.name, streak: e.current_streak }))
}
```

Each game passes the appropriate wins accessor:

- Pong / Beer Die / Cornhole / Spikeball / Pool: `e => e.wins`
- Hearts: `e => e.games_played - e.losses`
- Poker: `e => e.win_sessions`

`toLeader` is updated to accept and attach the `hotStreaks` array.

### Card JSX

The card's top row becomes a flex row with the game icon on the left and the streak list right-aligned:

```tsx
<div className="flex items-start justify-between mb-1 gap-2">
  <div className="text-xl">{icon}</div>
  {leader?.hotStreaks && leader.hotStreaks.length > 0 && (
    <div className="flex flex-col items-end gap-0.5">
      {leader.hotStreaks.map(({ name, streak }) => (
        <div key={name} className="text-[10px] font-bold text-amber-600 leading-tight whitespace-nowrap">
          🔥{streak} {name}
        </div>
      ))}
    </div>
  )}
</div>
```

### Example pages

`app/g/example/page.tsx` uses hardcoded data from `app/g/example/data.ts`. If that data includes streak fields, apply the same `topStreaks` logic. If not, hot streaks on the example page can be omitted (empty arrays) — the example group is a static demo, not a live leaderboard.

---

## What is not changing

- `lib/stats.ts` — no changes; streak computation is already correct for all games.
- The `Leaderboard` component — the name decoration is applied at the page level before passing entries in, so the component itself needs no changes.
- Streak logic for the `current_streak` column visibility — it remains hidden by default (not added as a sortable column) unless a future spec addresses column management.
