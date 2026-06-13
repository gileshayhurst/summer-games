# Game Icons Design

**Date:** 2026-06-13

## Summary

Replace the 🌽 cornhole emoji and 🏐 spikeball emoji with custom 3D/illustrated SVG icons throughout the app. Other game emojis (pong 🏓, beer die 🎲, hearts ♥) are unchanged.

## Icon Style

**3D/Illustrated** — perspective-angle cornhole board with legs and a hole; yellow ball with radial gradient highlight and a round net ring below for spikeball. Approximately the look of the second option shown in brainstorming ("Illustrated / 3D").

## New Files

### `components/icons/CornholeIcon.tsx`
SVG React component. Accepts `className` prop (forwarded to `<svg>`). Renders:
- Two angled legs at the bottom
- A perspective-skewed rectangular board (amber/wood colour)
- A dark elliptical hole near the top-centre of the board

### `components/icons/SpikeballIcon.tsx`
SVG React component. Accepts `className` prop. Renders:
- A circle with a radial gradient (light highlight top-left → amber bottom-right) for the ball
- An ellipse with cross-lines below representing the trampoline net

### `components/icons/GameIcon.tsx`
Maps a game-type string to the appropriate icon. Cornhole and spikeball get their SVG components; all other types fall back to their existing emoji character. Accepts `type: string` and `className?: string`.

```tsx
// Usage
<GameIcon type="cornhole" className="inline w-6 h-6" />
<GameIcon type="spikeball" className="inline w-6 h-6" />
<GameIcon type="pong" />  // renders 🏓
```

## Modified Files

### `components/RecentGames.tsx`
Replace the `gameEmoji: Record<string, string>` lookup and `<span>{gameEmoji[g.type]}</span>` with `<GameIcon type={g.type} className="w-6 h-6" />`.

### `components/log/LogTabs.tsx`
Change tab definition type from `{ id: Tab; label: string }` to `{ id: Tab; label: React.ReactNode }`. Update the cornhole and spikeball tab labels to include `<GameIcon>` inline before the text. Tab button renders `{t.label}` — no other change needed.

### `app/g/[slug]/page.tsx`
The game card array currently uses string labels. Change cornhole and spikeball entries to JSX, embedding `<GameIcon>` before the text inside the `<Link>`.

### `app/g/[slug]/cornhole/page.tsx`
Replace `🌽` in the `<h1>` with `<CornholeIcon className="inline w-9 h-9 mr-1 align-middle" />`.

### `app/g/[slug]/spikeball/page.tsx`
Replace `🏐` in the `<h1>` with `<SpikeballIcon className="inline w-9 h-9 mr-1 align-middle" />`.

## Sizing

Icons are sized via Tailwind `w-*`/`h-*` classes on the `className` prop:
- H1 headings: `w-9 h-9`
- Game cards / tab labels: `w-6 h-6`
- Recent games list: `w-6 h-6`
