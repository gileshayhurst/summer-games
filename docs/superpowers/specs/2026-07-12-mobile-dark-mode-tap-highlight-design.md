# Mobile Dark Mode Tap Highlight Fix — Design

Date: 2026-07-12

## Problem

Tapping a player name on mobile in dark mode makes the name text disappear.

Player names are `<Link>` cards on the players page (`app/g/[slug]/players/page.tsx`). The codebase defines **no `::selection` rule and no `-webkit-tap-highlight-color`** anywhere. On mobile the browser therefore applies its *default* highlight — a fixed **light** color that does not adapt to the app's dark theme.

In dark mode the name text is flipped to near-white (`.text-stone-900 { color: #fafaf9 }` in `app/globals.css`). When the browser highlights that text with its default light color on tap/selection, the result is white text on a light highlight — invisible.

This is a latent bug on **every** tappable text element in dark mode, not just player names. Player cards are simply where it was first noticed.

It also violates two of the project's own standards (per `PRODUCT.md` / `DESIGN.md`):
- **WCAG AA:** the highlighted/selected state must still clear 4.5:1 contrast. The browser default does not in dark mode.
- **Thumb-first affordance:** a navigation link's label should not be selectable text — a tap should navigate, not select. The selection here is an accident of markup.

## Fix

A single CSS block added to `app/globals.css`. Root-cause, global — it fixes every tappable element app-wide, not just the player cards.

### 1. Branded, theme-proof `::selection`

Placed at the top level (outside the `@media (prefers-color-scheme: dark)` block) so it applies in both themes:

```css
::selection      { background: #fde68a; color: #1c1917; }
::-moz-selection { background: #fde68a; color: #1c1917; }
```

Forcing **both** background and text color means selected text is always dark ink on amber (`#1c1917` on `#fde68a` ≈ 11:1, well past AA). It no longer inherits the white dark-mode text color, so it cannot vanish. Amber ties it to the brand palette.

### 2. Remove the default tap flash and make nav labels non-selectable

```css
a, button, [role="button"] {
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
```

A tap on a name now navigates instead of selecting, and the default light tap flash is gone.

### Deliberate scope cuts

- **No separate `:active` rule.** Tap feedback is already provided by the existing `hover:bg-amber-50` on the cards, which sticks on touch. Adding a global `:active` would introduce new visual surface area across every button in the app for no real gain.
- **No per-component changes.** The global rule fixes every tappable element at once, so no page or component files are touched.

## Files changed

- `app/globals.css` — add the `::selection` rules and the interactive-element reset block.

## Verification

After implementing, verify in the mobile browser preview in **both** light and dark mode:
- Tapping a player name navigates and the name text stays visible (no disappearing highlight).
- Selecting body text (where selection is still allowed) renders dark ink on amber, readable in both themes.
