# Leaderboard Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-game sort dropdown to every leaderboard page, letting users re-order by any stat column client-side.

**Architecture:** Extend the `Column` type with an optional `sortDirection` field; convert `Leaderboard` to a `'use client'` component that holds sort state and re-sorts entries via `useMemo`; update each game page (real + example) to annotate their column definitions and pass `defaultSortKey`.

**Tech Stack:** Next.js 13 App Router, React (useState/useMemo), TypeScript, Tailwind CSS. Test runner: Jest (`npm test`). No React Testing Library — sort logic is inline in `useMemo`; manual verification via dev server.

---

### Task 1: Rewrite `Leaderboard` component with sort support

**Files:**
- Modify: `components/Leaderboard.tsx`

- [ ] **Step 1: Replace `components/Leaderboard.tsx` with the new client component**

Write the entire file (replaces existing content):

```tsx
'use client'

import { useState, useMemo } from 'react'

type Column = {
  key: string
  label: string
  format?: (v: number | string) => string
  colorize?: boolean
  sortDirection?: 'asc' | 'desc'
}

type Props = {
  entries: Record<string, string | number>[]
  columns: Column[]
  defaultSortKey: string
}

export default function Leaderboard({ entries, columns, defaultSortKey }: Props) {
  const [sortKey, setSortKey] = useState(defaultSortKey)

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortKey)
    const direction = sortKey === 'name' ? 'asc' : (col?.sortDirection ?? 'desc')
    return [...entries].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      if (direction === 'desc') cmp = -cmp
      if (cmp === 0) return String(a.name).localeCompare(String(b.name))
      return cmp
    })
  }, [entries, columns, sortKey])

  const sortOptions = [
    { value: 'name', label: 'Player (A–Z)' },
    ...columns.filter(c => c.sortDirection).map(c => ({ value: c.key, label: c.label })),
  ]

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted uppercase tracking-widest font-black">Sort</span>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="text-xs border border-warm rounded-lg px-2 py-1 bg-card text-stone-900 font-bold focus:outline-none"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-card rounded-xl overflow-hidden border border-warm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm">
              <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-black w-8">#</th>
              {columns.map(c => (
                <th key={c.key} className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-black">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr key={entry.player_id as string} className="border-b border-warm hover:bg-amber-50 transition-colors">
                <td className="px-4 py-3 text-muted font-mono">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                {columns.map(c => {
                  const val = entry[c.key]
                  const display = c.format ? c.format(val as number) : val
                  let color = 'text-stone-900 font-bold'
                  if (c.colorize) {
                    color = typeof val === 'number' && val > 0
                      ? 'text-win font-bold'
                      : typeof val === 'number' && val < 0
                      ? 'text-loss font-bold'
                      : 'text-stone-900 font-bold'
                  }
                  return (
                    <td key={c.key} className={`px-4 py-3 ${color}`}>
                      {display as string}
                    </td>
                  )
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  No games yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors relating to `Leaderboard.tsx`. (Game pages will show errors about missing `defaultSortKey` until later tasks — that's fine.)

- [ ] **Step 3: Commit**

```bash
git add components/Leaderboard.tsx
git commit -m "feat: make Leaderboard a client component with sort dropdown"
```

---

### Task 2: Update Pong pages

**Files:**
- Modify: `app/g/[slug]/pong/page.tsx`
- Modify: `app/g/example/pong/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/pong/page.tsx`**

Replace the `columns` array and `<Leaderboard>` call. Find the existing columns block and replace it:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call to add `defaultSortKey`:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/example/pong/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={examplePongLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for pong pages.

- [ ] **Step 4: Commit**

```bash
git add app/g/[slug]/pong/page.tsx app/g/example/pong/page.tsx
git commit -m "feat: add sort options to pong leaderboard"
```

---

### Task 3: Update Beer Die pages

**Files:**
- Modify: `app/g/[slug]/beer-die/page.tsx`
- Modify: `app/g/example/beer-die/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/beer-die/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/example/beer-die/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={exampleBeerDieLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for beer-die pages.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/beer-die/page.tsx" app/g/example/beer-die/page.tsx
git commit -m "feat: add sort options to beer die leaderboard"
```

---

### Task 4: Update Poker pages

**Files:**
- Modify: `app/g/[slug]/poker/page.tsx`
- Modify: `app/g/example/poker/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/poker/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
    { key: 'total_profit_cents', label: 'Total Profit', colorize: true, format: (v: number | string) => formatCents(Number(v)), sortDirection: 'desc' as const },
    { key: 'win_sessions', label: 'Wins', sortDirection: 'desc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="total_profit_cents" />
```

- [ ] **Step 2: Update `app/g/example/poker/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
  { key: 'total_profit_cents', label: 'Total Profit', colorize: true, format: (v: number | string) => formatCents(Number(v)), sortDirection: 'desc' as const },
  { key: 'win_sessions', label: 'Wins', sortDirection: 'desc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={examplePokerLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="total_profit_cents" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for poker pages.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/poker/page.tsx" app/g/example/poker/page.tsx
git commit -m "feat: add sort options to poker leaderboard"
```

---

### Task 5: Update Hearts pages

**Files:**
- Modify: `app/g/[slug]/hearts/page.tsx`
- Modify: `app/g/example/hearts/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/hearts/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
    { key: 'losses', label: 'Losses', sortDirection: 'asc' as const },
    { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'asc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="loss_rate" />
```

- [ ] **Step 2: Update `app/g/example/hearts/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
  { key: 'losses', label: 'Losses', sortDirection: 'asc' as const },
  { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'asc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={exampleHeartsLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="loss_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for hearts pages.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/hearts/page.tsx" app/g/example/hearts/page.tsx
git commit -m "feat: add sort options to hearts leaderboard"
```

---

### Task 6: Update Pool pages

**Files:**
- Modify: `app/g/[slug]/pool/page.tsx`
- Modify: `app/g/example/pool/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/pool/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'balls_differential', label: 'Ball Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/example/pool/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  { key: 'balls_differential', label: 'Ball Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={examplePoolLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for pool pages.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/pool/page.tsx" app/g/example/pool/page.tsx
git commit -m "feat: add sort options to pool leaderboard"
```

---

### Task 7: Update Cornhole pages

**Files:**
- Modify: `app/g/[slug]/cornhole/page.tsx`
- Modify: `app/g/example/cornhole/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/cornhole/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/example/cornhole/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={exampleCornholeLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors for cornhole pages.

- [ ] **Step 4: Commit**

```bash
git add "app/g/[slug]/cornhole/page.tsx" app/g/example/cornhole/page.tsx
git commit -m "feat: add sort options to cornhole leaderboard"
```

---

### Task 8: Update Spikeball pages

**Files:**
- Modify: `app/g/[slug]/spikeball/page.tsx`
- Modify: `app/g/example/spikeball/page.tsx`

- [ ] **Step 1: Update `app/g/[slug]/spikeball/page.tsx`**

Replace the `columns` array:

```tsx
  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
  ]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 2: Update `app/g/example/spikeball/page.tsx`**

Replace the `columns` array:

```tsx
const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%`, sortDirection: 'desc' as const },
  { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v), sortDirection: 'desc' as const },
]
```

And update the `<Leaderboard>` call:

```tsx
      <Leaderboard entries={exampleSpikeballLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors. All 8 tasks done means zero TypeScript errors across the codebase.

- [ ] **Step 4: Run existing tests**

```bash
npm test
```

Expected: all existing tests pass (stats.test.ts — these are pure function tests unaffected by UI changes).

- [ ] **Step 5: Commit**

```bash
git add "app/g/[slug]/spikeball/page.tsx" app/g/example/spikeball/page.tsx
git commit -m "feat: add sort options to spikeball leaderboard"
```
