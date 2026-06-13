# Game Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 🌽 cornhole and 🏐 spikeball emojis with custom 3D SVG icon components across all five locations in the app where they appear.

**Architecture:** Create three new components in `components/icons/` — `CornholeIcon`, `SpikeballIcon`, and `GameIcon` (dispatcher). Then update five existing files to import and use these components instead of emoji strings. All icons accept a `className` prop for Tailwind-based sizing. No new routes, no new state, no API changes.

**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, inline SVG

---

### Task 1: Create CornholeIcon component

**Files:**
- Create: `components/icons/CornholeIcon.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
export default function CornholeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" fill="none">
      <line x1="12" y1="50" x2="16" y2="38" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="44" y1="50" x2="40" y2="38" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="6,38 50,38 46,12 10,12" fill="#f59e0b" />
      <line x1="10" y1="20" x2="46" y2="20" stroke="#d97706" strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="29" x2="46" y2="29" stroke="#d97706" strokeWidth="1" opacity="0.5" />
      <ellipse cx="28" cy="23" rx="9" ry="7" fill="#292524" />
      <ellipse cx="28" cy="23" rx="9" ry="7" fill="none" stroke="#1c1917" strokeWidth="1.5" />
      <polygon points="6,38 50,38 46,12 10,12" fill="none" stroke="#b45309" strokeWidth="1.5" />
    </svg>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `C:\Users\giles\Downloads\SummerGames`:
```
npx tsc --noEmit
```
Expected: same pre-existing errors as before (beer-die test failures), no new errors.

- [ ] **Step 3: Commit**

```
git add components/icons/CornholeIcon.tsx
git commit -m "feat: add CornholeIcon SVG component"
```

---

### Task 2: Create SpikeballIcon component

**Files:**
- Create: `components/icons/SpikeballIcon.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
export default function SpikeballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sb-grad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="22" r="19" fill="url(#sb-grad)" />
      <ellipse cx="28" cy="47" rx="17" ry="4" fill="none" stroke="#737373" strokeWidth="2.5" />
      <line x1="11" y1="47" x2="45" y2="47" stroke="#a3a3a3" strokeWidth="1.5" />
      <line x1="28" y1="43" x2="28" y2="51" stroke="#a3a3a3" strokeWidth="1.5" />
      <line x1="13" y1="43.5" x2="43" y2="50.5" stroke="#a3a3a3" strokeWidth="1" />
      <line x1="43" y1="43.5" x2="13" y2="50.5" stroke="#a3a3a3" strokeWidth="1" />
    </svg>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```
git add components/icons/SpikeballIcon.tsx
git commit -m "feat: add SpikeballIcon SVG component"
```

---

### Task 3: Create GameIcon dispatcher component

**Files:**
- Create: `components/icons/GameIcon.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
import CornholeIcon from './CornholeIcon'
import SpikeballIcon from './SpikeballIcon'

const emojiMap: Record<string, string> = {
  pong: '🏓',
  'beer-die': '🎲',
  hearts: '♥',
}

export default function GameIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'cornhole') return <CornholeIcon className={className} />
  if (type === 'spikeball') return <SpikeballIcon className={className} />
  return <span className={className}>{emojiMap[type] ?? '🎮'}</span>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```
git add components/icons/GameIcon.tsx
git commit -m "feat: add GameIcon dispatcher component"
```

---

### Task 4: Update RecentGames to use GameIcon

**Files:**
- Modify: `components/RecentGames.tsx`

Current state of the relevant parts (lines 1, 26-32, 44-45):
```tsx
import { RecentGame } from '@/lib/types'

const gameEmoji: Record<string, string> = {
  pong: '🏓',
  'beer-die': '🎲',
  cornhole: '🌽',
  spikeball: '🏐',
  hearts: '♥',
}

// inside the map:
<span className="text-lg">{gameEmoji[g.type]}</span>
```

- [ ] **Step 1: Replace the file content**

Write `components/RecentGames.tsx` with this exact content:

```tsx
import { RecentGame } from '@/lib/types'
import GameIcon from './icons/GameIcon'

function formatGame(g: RecentGame): { title: string; detail: string } {
  if (g.type === 'pong') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `${g.cups_left} cup${g.cups_left !== 1 ? 's' : ''} left`,
  }
  if (g.type === 'beer-die') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'cornhole') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'spikeball') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  return {
    title: `Hearts — ${g.players.join(', ')}`,
    detail: `${g.loser} lost`,
  }
}

export default function RecentGames({ games }: { games: RecentGame[] }) {
  if (games.length === 0)
    return <p className="text-muted text-sm">No games yet — go log one!</p>

  return (
    <div className="space-y-2">
      {games.map(g => {
        const { title, detail } = formatGame(g)
        const date = new Date(g.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <div key={`${g.type}-${g.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
            <GameIcon type={g.type} className="w-6 h-6 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{title}</p>
              <p className="text-xs text-muted">{detail}</p>
            </div>
            <span className="text-xs text-muted shrink-0">{date}</span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```
git add components/RecentGames.tsx
git commit -m "feat: replace cornhole and spikeball emoji in RecentGames with SVG icons"
```

---

### Task 5: Update LogTabs to use GameIcon

**Files:**
- Modify: `components/log/LogTabs.tsx`

Current state (lines 1-18):
```tsx
'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball'

const tabs: { id: Tab; label: string }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: '🌽 Cornhole' },
  { id: 'spikeball', label: '🏐 Spikeball' },
]
```

- [ ] **Step 1: Replace the file content**

Write `components/log/LogTabs.tsx` with this exact content:

```tsx
'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'
import GameIcon from '../icons/GameIcon'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball'

const tabs: { id: Tab; label: ReactNode }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: <><GameIcon type="cornhole" className="inline w-4 h-4 mr-1 align-middle" /> Cornhole</> },
  { id: 'spikeball', label: <><GameIcon type="spikeball" className="inline w-4 h-4 mr-1 align-middle" /> Spikeball</> },
]

export default function LogTabs({ players }: { players: User[] }) {
  const [active, setActive] = useState<Tab>('pong')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-5 py-2 rounded-full font-black text-sm transition-colors uppercase tracking-wide ${
              active === t.id ? 'bg-win text-white' : 'bg-card text-muted hover:text-stone-900 border border-warm'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'pong' && <PongForm players={players} />}
      {active === 'beer-die' && <BeerDieForm players={players} />}
      {active === 'hearts' && <HeartsForm players={players} />}
      {active === 'cornhole' && <CornholeForm players={players} />}
      {active === 'spikeball' && <SpikeballForm players={players} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```
git add components/log/LogTabs.tsx
git commit -m "feat: replace cornhole and spikeball emoji in LogTabs with SVG icons"
```

---

### Task 6: Update group home page game cards

**Files:**
- Modify: `app/g/[slug]/page.tsx`

Current state of the relevant section (lines 80–93):
```tsx
<div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
  {[
    { href: `${base}/pong`, label: '🏓 Pong' },
    { href: `${base}/beer-die`, label: '🎲 Beer Die' },
    { href: `${base}/hearts`, label: '♥ Hearts' },
    { href: `${base}/cornhole`, label: '🌽 Cornhole' },
    { href: `${base}/spikeball`, label: '🏐 Spikeball' },
  ].map(({ href, label }) => (
    <Link key={href} href={href}
      className="bg-card rounded-xl p-6 text-center font-black uppercase tracking-widest text-sm hover:bg-amber-50 transition-colors border border-warm">
      {label}
    </Link>
  ))}
</div>
```

- [ ] **Step 1: Add these two imports at the top of the file** (after the existing imports on line 7)

```tsx
import type { ReactNode } from 'react'
import GameIcon from '@/components/icons/GameIcon'
```

- [ ] **Step 2: Replace the game card array block**

Find the `<div className="grid grid-cols-3 gap-4 sm:grid-cols-5">` block and replace the entire block with:

```tsx
<div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
  {([
    { href: `${base}/pong`, label: '🏓 Pong' },
    { href: `${base}/beer-die`, label: '🎲 Beer Die' },
    { href: `${base}/hearts`, label: '♥ Hearts' },
    { href: `${base}/cornhole`, label: <><GameIcon type="cornhole" className="inline w-5 h-5 mr-1 align-middle" /> Cornhole</> },
    { href: `${base}/spikeball`, label: <><GameIcon type="spikeball" className="inline w-5 h-5 mr-1 align-middle" /> Spikeball</> },
  ] as { href: string; label: ReactNode }[]).map(({ href, label }) => (
    <Link key={href} href={href}
      className="bg-card rounded-xl p-6 text-center font-black uppercase tracking-widest text-sm hover:bg-amber-50 transition-colors border border-warm">
      {label}
    </Link>
  ))}
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```
git add "app/g/[slug]/page.tsx"
git commit -m "feat: replace cornhole and spikeball emoji in group home game cards with SVG icons"
```

---

### Task 7: Update cornhole and spikeball page headings

**Files:**
- Modify: `app/g/[slug]/cornhole/page.tsx`
- Modify: `app/g/[slug]/spikeball/page.tsx`

**Cornhole page — current line 49:**
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1">🌽 Cornhole</h1>
```

**Spikeball page — current line 49:**
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏐 Spikeball</h1>
```

- [ ] **Step 1: Add CornholeIcon import to cornhole page**

After the existing imports in `app/g/[slug]/cornhole/page.tsx`, add:
```tsx
import CornholeIcon from '@/components/icons/CornholeIcon'
```

- [ ] **Step 2: Replace the h1 in cornhole page**

Change line 49 from:
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1">🌽 Cornhole</h1>
```
to:
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1"><CornholeIcon className="inline w-9 h-9 mr-1 align-middle" /> Cornhole</h1>
```

- [ ] **Step 3: Add SpikeballIcon import to spikeball page**

After the existing imports in `app/g/[slug]/spikeball/page.tsx`, add:
```tsx
import SpikeballIcon from '@/components/icons/SpikeballIcon'
```

- [ ] **Step 4: Replace the h1 in spikeball page**

Change line 49 from:
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏐 Spikeball</h1>
```
to:
```tsx
<h1 className="text-3xl font-black uppercase tracking-tight mb-1"><SpikeballIcon className="inline w-9 h-9 mr-1 align-middle" /> Spikeball</h1>
```

- [ ] **Step 5: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```
git add "app/g/[slug]/cornhole/page.tsx" "app/g/[slug]/spikeball/page.tsx"
git commit -m "feat: replace cornhole and spikeball emoji in page headings with SVG icons"
```
