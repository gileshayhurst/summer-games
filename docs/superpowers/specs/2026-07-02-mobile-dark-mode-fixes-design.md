# Mobile & Dark Mode Fixes Design
Date: 2026-07-02

## Overview

Three independent bugs affecting mobile and dark mode users:
1. Beer Die leaderboard Sinks/Self Sinks columns invisible on mobile
2. Landing screen layout breaks on mobile
3. Dark mode readability — several missing CSS overrides

---

## Fix 1: Beer Die Sinks/Self Sinks Columns

### Problem

`components/Leaderboard.tsx` wraps the `<table>` in a div with `overflow-hidden` (required to clip the rounded-xl corners). There is no inner `overflow-x-auto` container. With 7 columns on the Beer Die leaderboard (Player, W, L, Win%, Pt Diff, Sinks, Self Sinks), CSS squeezes all columns into the available mobile width — the rightmost columns (Sinks, Self Sinks) get effectively zero width and are invisible.

The column definitions, stats computation, and data queries are all correct. Only the rendering container is broken.

### Fix

**File: `components/Leaderboard.tsx`**

- Add an `overflow-x-auto` inner div between the rounded container and the `<table>`.
- Change `w-full` → `min-w-full` on the `<table>` so it fills the container when columns fit, but can expand and scroll when they don't.

```
Before:
<div className="bg-card rounded-xl overflow-hidden border border-warm">
  <table className="w-full text-sm">

After:
<div className="bg-card rounded-xl overflow-hidden border border-warm">
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
```

No other files change. The leaderboard shows numeric sink counts (e.g., 3 sinks, 1 self-sink) in those columns.

---

## Fix 2: Landing Screen Mobile Layout

### Problem

`app/page.tsx` uses desktop-first spacing with no responsive breakpoints:
- `py-20` (80px top/bottom) on the main section is excessive on mobile
- `mb-20` (80px) on the button row pushes content off-screen
- `text-5xl` hero heading is slightly too large for small phones
- `CurvedArrow` is a decorative SVG that connects two element IDs; on mobile, those elements stack in a different position, causing it to render incorrectly

### Fix

**File: `app/page.tsx`**

| Element | Current class | New class |
|---|---|---|
| `<main>` vertical padding | `py-20` | `py-10 md:py-20` |
| Button row bottom margin | `mb-20` | `mb-10 md:mb-20` |
| Hero `<h1>` | `text-5xl` | `text-4xl sm:text-5xl` |
| `<CurvedArrow>` wrapper | always rendered | wrap in `<div className="hidden md:block">` |

---

## Fix 3: Dark Mode Readability

### Problem

`app/globals.css` manually overrides specific Tailwind class names for dark mode. Several classes used throughout the app are missing from the override list, causing unreadable text or invisible UI elements.

### Missing Overrides

| Class | Problem | Fix value |
|---|---|---|
| `bg-white` | Landing group cards render white background; `text-stone-900` is overridden to near-white, making text invisible on white bg | `background-color: #292524` |
| `text-amber-800` | "Your Groups" heading and similar labels render dark amber on dark background — unreadable | `color: #fcd34d` |
| `border-amber-200` | Yellow banner border barely distinguishable from background | `border-color: #57534e` |
| `hover:bg-amber-50` | Currently overridden to `#312e2b`, almost identical to card bg `#292524` — tap highlight imperceptible | Change to `#3c3836` |

### Fix

**File: `app/globals.css`** — add to the existing `@media (prefers-color-scheme: dark)` block:

```css
.bg-white        { background-color: #292524; }
.text-amber-800  { color: #fcd34d; }
.border-amber-200 { border-color: #57534e; }
.hover\:bg-amber-50:hover { background-color: #3c3836; }  /* replace existing */
```

Before finalising, grep for `bg-white`, `text-amber-8`, and `border-amber-2` across all component and page files to catch any additional instances not yet identified.

---

## Files Changed

- `components/Leaderboard.tsx` — add `overflow-x-auto` wrapper, change `w-full` → `min-w-full`
- `app/page.tsx` — responsive spacing breakpoints, hide CurvedArrow on mobile
- `app/globals.css` — add/update dark mode class overrides
