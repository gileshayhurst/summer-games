# Landing Page UI Polish

**Date:** 2026-07-02

## Overview

Two small UI improvements to the landing page:

1. Make the feedback/suggestion form collapsible (starts closed)
2. Fix feature card text overflow on mobile

---

## 1. Collapsible Feedback Form

### Current state

`page.tsx` renders a `<p>` prompt ("Want to suggest a game or give other feedback?") with a `#want-anchor` span (used by `CurvedArrow`), followed by `<SuggestionForm />` which is always visible.

### Changes

**`components/SuggestionForm.tsx`** — absorb the prompt text and own the open/close state:

- Add `isOpen` boolean state, default `false`.
- Render a toggle button that contains:
  - The prompt text with the `id="want-anchor"` span (keeps `CurvedArrow` pointing target in DOM)
  - Bold, prominent styling to draw attention
  - A chevron icon (SVG `›` rotated) that rotates 90° when open via `transition-transform`
- When `isOpen` is false: only the toggle button is rendered.
- When `isOpen` is true: toggle button + form fields below.
- On successful submit: keep open, show confirmation message (existing behaviour).

**`app/page.tsx`** — remove the `<p>` prompt text (it moves into `SuggestionForm`). Keep `<SuggestionForm />` in the same position. The `CurvedArrow` still works because `#want-anchor` lives inside the toggle button.

### Toggle button style

- Full-width clickable row with `flex items-center justify-between`
- Text: `font-bold text-stone-700` (bolder than current muted style)
- Chevron: inline SVG chevron-right, rotates to chevron-down when open, `transition-transform duration-200`

---

## 2. Mobile Feature Card Text Overflow

### Current state

```jsx
<div className="grid grid-cols-3 gap-6 text-left">
```

No responsive breakpoint — on mobile (375px) each card is ~93px wide, causing text to overflow.

### Change

```jsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
```

Cards stack vertically below `sm` (640px) and return to 3-column above it. No other changes to card markup needed.

---

## Files Changed

| File | Change |
|------|--------|
| `components/SuggestionForm.tsx` | Add collapse toggle with chevron; absorb prompt text |
| `app/page.tsx` | Remove `<p>` prompt; fix grid to `grid-cols-1 sm:grid-cols-3` |
