---
name: Garage League
description: The unofficial official scoreboard for a friend group's games.
colors:
  brand-deep: "#c2410c"
  win-orange: "#f97316"
  win-orange-hover: "#fb923c"
  win-ink: "#c2410c"
  ink: "#1c1917"
  loss-red: "#dc2626"
  loss-ink: "#dc2626"
  gold: "#eab308"
  forest: "#1a4731"
  streak-cold: "#3b82f6"
  cream-bg: "#fffbf0"
  cream-card: "#fff7ed"
  hover-tint: "#fffbeb"
  sand-border: "#f0e0b8"
  ink: "#1c1917"
  muted: "#78716c"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 6vw, 3rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.win-orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.win-orange-hover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
  button-ghost:
    backgroundColor: "{colors.cream-card}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "12px 32px"
  input-text:
    backgroundColor: "{colors.cream-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.cream-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  stat-card:
    backgroundColor: "{colors.cream-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  badge-pill:
    backgroundColor: "{colors.hover-tint}"
    textColor: "{colors.brand-deep}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.label}"
---

# Design System: Garage League

## 1. Overview

**Creative North Star: "The Broadcast Lower-Third"**

Garage League looks like the on-screen graphics package for a sports broadcast that a friend group built for itself. Every screen is a name bar, a streak chyron, a stat line — the punchy uppercase overlay that flashes at the bottom of the TV telling you who's winning and by how much. The interface talks like a scoreboard graphic, never like a spreadsheet. The tagline *"the unofficial official scoreboard"* is the whole thesis: authoritative enough to argue from, homemade enough to be fun.

The system runs warm, not cold. The surface is a cream/amber field (`#fffbf0`) — the color of a garage wall or a bar napkin, not a dashboard. Against that warmth, **orange (`#f97316`) is the "live" signal**: it means *win*, *now*, *do this*. It's the tally light on the camera. Type carries most of the personality: Inter pushed to its heaviest weight (900), set uppercase with wide tracking for labels and tight tracking for headlines, so a leaderboard reads like a chyron and a group name reads like a title card. Depth is nearly flat — hairline sand borders and two tones of cream do the layering; shadows appear only when something genuinely lifts off the page (a sheet, a modal).

This system explicitly rejects the **corporate SaaS analytics dashboard** — no cold gray/blue enterprise chrome, no sterile hero-metric card grids, no "business intelligence" sterility. It equally rejects the **childish, over-gamified** look — no cartoon mascots, no confetti storms, no Duolingo badge parades. The humor here is dry (a 😂 on a losing streak), the palette is grown-up-warm, and the loudness is broadcast-loud, not toy-loud.

**Key Characteristics:**
- Broadcast-graphic voice: uppercase, black-weight, tracked type as the primary material
- Warm garage palette — cream field, orange "live" signal, sand hairlines
- Flat by default; elevation reserved for true overlays
- Orange = win / primary action, and almost nothing else
- Thumb-first: built to be logged one-handed on a phone at a party

## 2. Colors

A warm, homemade palette where a single hot orange does all the shouting against a field of cream and sand.

### Primary
- **Live Orange** (`#f97316`): The "on-air" signal — used as a **fill**. Every primary action (Create Group, Log Game, Submit), every button, the active-nav underline. It is the camera's tally light — when you see it, something wants your tap. Hover deepens to **Flare Orange** (`#fb923c`). Text sitting on a Live Orange fill is always **Scoreboard Ink** (`#1c1917`), never white — white on Live Orange fails AA (2.80:1), ink passes (6.3:1) and reads more sports-broadcast anyway.
- **Broadcast Ember** (`#c2410c`): Live Orange's job when orange is **text**, not fill. The wordmark, inline emphasis, active nav labels, positive stat values, the hero accent word — anywhere orange sits as type on cream, it's Ember (4.9:1), because Live Orange as text fails contrast (2.64:1). Exposed as the `win-ink` token, which flips to bright `#fb923c` in dark mode where the surface is charcoal. The rule of thumb: **Live Orange fills, Ember writes.**

### Secondary
- **Loss Red** (`#dc2626`): Negatives only — losses, error messages, negative differentials. One value at `#dc2626`: as a **chip fill** (loser chips, remove buttons) it clears white text at 4.8:1; as **text** (token `loss-ink`, error messages, negative stat values) it clears cream at 4.7:1 and flips to `#f87171` in dark mode where the surface is charcoal. (The old `#ef4444` failed both — 3.8:1 under white, 3.6:1 as text.) Paired always with text or sign, never color alone.
- **Trophy Gold** (`#eab308`): Reserved accent for standings and highlights; the medal-stand color.
- **Field Forest** (`#1a4731`): The theme color (browser chrome, PWA status bar) and the confirmed/"pinned" state. The one cool color in the system — it grounds the warmth and signals "locked in."

### Tertiary
- **Streak Cold** (`#3b82f6`): The 😂 cold-streak decoration — the counterpoint to the 🔥 hot streak's amber. Used exclusively on losing-streak call-outs.

### Neutral
- **Garage Cream** (`#fffbf0`): The page field. Warm off-white, the wall the scoreboard hangs on.
- **Card Cream** (`#fff7ed`): One step warmer; every surface, card, nav bar, table, and input sits on this against the field. The primary tonal-layering move.
- **Hover Tint** (`#fffbeb`): The amber wash a row or card takes on hover — the "you're pointing at this" state.
- **Sand** (`#f0e0b8`): Every border and divider. Hairline warm dividers instead of gray rules — the system's signature "no cold lines" tell.
- **Scoreboard Ink** (`#1c1917`): Primary text (stone-900). Near-black with a warm cast so it belongs to the cream, not to a spreadsheet.
- **Muted Stone** (`#78716c`): Secondary text, labels, inactive nav. Warm gray — the quiet voice.

### Named Rules
**The Tally-Light Rule.** Orange means *win* or *primary action* — nothing else. It never decorates. If an element is orange, it is either the thing that is winning or the one thing you're meant to tap on this screen. Its scarcity is what makes it read as "live."

**The Fills-vs-Writes Rule.** Live Orange (`#f97316`) is a **fill** color; Broadcast Ember (`#c2410c`, token `win-ink`) is orange as **text**. Text on a Live Orange fill is Scoreboard Ink, never white. This split is not stylistic — it's what keeps every orange element at WCAG AA (white-on-Live-Orange is 2.80:1, Live-Orange-as-text on cream is 2.64:1; both fail). Ink-on-orange and Ember-on-cream both pass.

**The No Cold Lines Rule.** Every border, divider, and rule is Sand (`#f0e0b8`), never a gray hairline. Cold gray lines are the SaaS-dashboard tell; warm sand keeps the garage.

**Dark mode.** The system inverts to warm charcoals (field `#1c1917`, card `#292524`, sand `#44403c`) and brightens the brand to Flare Orange (`#fb923c`) so the wordmark holds. Orange, red, gold, and forest keep their meaning.

## 3. Typography

**Display / Body / Label Font:** Inter (with `system-ui, sans-serif` fallback)

**Character:** One family, worked across its full weight range — from 400 for prose to 900 for everything that shouts. There is no second typeface; contrast comes entirely from weight, case, and tracking. Inter at 900 uppercase is the broadcast chyron; Inter at 400 is the quiet caption underneath. The discipline of a single family is what keeps the loudness from becoming noise.

### Hierarchy
- **Display** (900, `clamp(2.25rem, 6vw, 3rem)`, line-height 1, tracking `-0.02em`, UPPERCASE): Landing hero and title cards. Set tight and heavy so it reads as a title-card, not a paragraph. Use `text-wrap: balance`.
- **Headline** (900, `2.25rem`, tracking `-0.02em`, UPPERCASE): Group name / page title — the chyron's main bar.
- **Title** (900, `1.125rem`): Stat values, card leader names. Heavy but not tracked; these are numbers you read fast.
- **Body** (400–500, `1rem`, line-height 1.6): Descriptions and prose. Warm muted stone or ink. Cap measure at 65–75ch.
- **Label** (900, `0.75rem`, tracking `0.1em`, UPPERCASE): The signature. Section kickers ("Recent Games", "Your Groups"), table headers, nav items, form labels, badges. This tracked black-caps micro-type is the connective tissue of the whole system.

### Named Rules
**The One-Family Rule.** Inter only. Never pair it with a second sans — hierarchy is built from weight (400 → 900), case, and tracking, never from a new typeface.

**The Loudest-One-Thing Rule.** Black-weight uppercase is the brand, but it only works when one thing is loudest per screen. Don't set the label, the title, AND the value all at maximum — pick the hero (the winner, the streak, the standing) and let the supporting type step down to muted body. Everything shouting equals nothing shouting.

## 4. Elevation

Flat by default. Depth comes from **tonal warm layering** (Card Cream surfaces floating on the Garage Cream field) and **Sand hairline borders**, not from shadows. A leaderboard, a stat card, and a nav bar are all the same flat cream plane distinguished only by a 1px sand edge. This is deliberate: the broadcast-graphic look is flat, and shadows would make it look like a 2014 app.

Shadows appear **only when something genuinely lifts off the page** as a response to interaction — never at rest, never decoratively.

### Shadow Vocabulary
- **Sheet Lift** (`box-shadow: 0 -4px 24px rgba(0,0,0,0.15)` — Tailwind `shadow-xl`): The mobile "All Games" bottom sheet as it slides up over the page.
- **Modal Lift** (`box-shadow: 0 10px 30px rgba(0,0,0,0.15)` — Tailwind `shadow-lg`): Centered confirmation dialogs above their `black/40` backdrop.

### Named Rules
**The Flat-Field Rule.** Surfaces are flat at rest — cream on cream, separated by a sand hairline. A shadow is a verb, not a decoration: it may appear only while an element is actively lifted (a sheet dragging up, a modal open). If a resting card has a drop shadow, it's wrong.

## 5. Components

Punchy and tactile: confident pill buttons, flat warm cards with a single hairline edge, and a snappy color-shift (never a scale-bounce) on interaction. Everything feels physical and solid, nothing feels glassy or floaty.

### Buttons
- **Shape:** Fully round pills (`9999px`, `rounded-full`). Always. No square buttons anywhere in the system.
- **Primary:** Live Orange (`#f97316`) fill, **Scoreboard Ink (`#1c1917`) text** (never white — white fails AA on this orange), UPPERCASE black-weight with `tracking-wide`, padding ~`8px 24px`. The tap target — black-on-orange reads like a scoreboard chyron. Hover shifts to Flare Orange (`#fb923c`); disabled drops to 50% opacity.
- **Ghost / Secondary:** Transparent or Card Cream fill with a `2px` Sand or brand border, Muted or brand text, same pill shape and caps ("Browse Public Groups", "Sign In"). Used for the not-primary action so orange stays scarce.
- **Cancel / Tertiary:** `stone-100` fill, muted text, pill — the quiet dismiss in dialogs.
- **Hover / Focus:** Color-shift only via `transition-colors`. No transform, no bounce. Focus-visible must show a ring (see Inputs).

### Chips / Badges
- **Style:** Tiny round pills (`rounded-full`), black-weight UPPERCASE at `10px` with wide tracking. Role-colored, low-saturation fills: admin/owner = `amber-100` on `amber-700`; member = `stone-100` on `stone-500`; **pinned/confirmed = Field Forest (`#1a4731`) on white**.
- **Streak decorations:** `🔥{n}` in amber for hot streaks, `😂{n}` in Streak Cold blue for cold — the roast-gently-celebrate-loudly signature. Emoji + number + name, never color alone.

### Cards / Containers
- **Corner Style:** `12px` (`rounded-xl`); overlays step up to `16px` (`rounded-2xl`).
- **Background:** Card Cream (`#fff7ed`) on the Garage Cream field.
- **Shadow Strategy:** None at rest (see Elevation).
- **Border:** Always a `1px` Sand (`#f0e0b8`) hairline — the defining edge.
- **Hover (interactive cards):** Wash to Hover Tint (`#fffbeb`) via `transition-colors`.
- **Internal Padding:** `12px` (stat/compact) to `24px` (forms/modals).
- **Never nest cards.** A card inside a card is prohibited.

### Inputs / Fields
- **Style:** Card Cream or field-cream fill, `1px` Sand border, small radius (`4px`), padding ~`8px 12px`, ink text.
- **Focus:** Border shifts to Ember (`focus:border-win-ink`, ≥4.5:1 against the field) OR a `2px` amber focus ring (`focus:ring-amber-400`) on selects. Always `focus:outline-none` paired with a visible replacement — never remove the outline without one. (Live Orange as a 1px focus border is only 2.6:1 — use the Ember `win-ink` variant.)
- **Labels:** The Label style above — `10–12px` black-weight UPPERCASE tracked, muted, sitting above the field.
- **Error:** Loss Red **as text** (`#dc2626`, token `loss-ink`) message below the field; success is Ember (`win-ink`) with a `✓`.

### Navigation
- **Desktop top bar:** Sticky, Card Cream, Sand bottom border. Wordmark in Broadcast Ember black-caps; nav items are Label-style black-caps, muted at rest, **Live Orange with a `2px` orange underline when active**. Primary "LOG GAME →" pill sits at the right.
- **Mobile bottom bar:** Fixed, Card Cream, Sand top border, `env(safe-area-inset-bottom)` aware. Up to 3 user-pinned game tabs plus a "More" tab, with a central **Live Orange "LOG+" pill** as the thumb-anchor. Active tab is Live Orange. This is the thumb-first core of the app.
- **"All Games" sheet:** Drag-dismissable bottom sheet (`rounded-t-2xl`, Sheet Lift shadow, grab-handle) for pinning/reordering games.

### Leaderboard Table (signature component)
The system's centerpiece — the scoreboard itself. Flat Card Cream container, `rounded-xl`, Sand border, no shadow. Header row is Label-style muted black-caps. Body rows are separated by Sand hairlines and wash to Hover Tint on hover. **Rank is theatrical:** 🥇🥈🥉 for the top three, then `font-mono` numerals. Colorized stat columns turn Live Orange when positive, Loss Red when negative — the standings read at a glance, like a broadcast graphic.

## 6. Do's and Don'ts

### Do:
- **Do** keep orange on its leash — Live Orange (`#f97316`) means *win* or *primary action* only (**The Tally-Light Rule**). One orange thing per screen wherever possible.
- **Do** use Live Orange as a fill and Broadcast Ember (`win-ink`) as orange text; put **Scoreboard Ink on orange fills, never white** (**The Fills-vs-Writes Rule**).
- **Do** build hierarchy from Inter's weight range (400 → 900), case, and tracking — one family, no second typeface (**The One-Family Rule**).
- **Do** pick one loudest element per screen — the winner, the streak, the standing — and let everything else step down to muted body (**The Loudest-One-Thing Rule**).
- **Do** use `1px` Sand (`#f0e0b8`) for every border and divider (**The No Cold Lines Rule**).
- **Do** keep surfaces flat at rest; reserve shadows for elements actively lifting off the page (**The Flat-Field Rule**).
- **Do** make everything work one-handed on a phone — real touch targets, the LOG+ pill within thumb reach, nothing important behind a hover.
- **Do** pair every win/loss and hot/cold signal with text, sign, or emoji — never color alone (WCAG AA).
- **Do** ship a visible focus state (orange border or amber ring) with every `focus:outline-none`.

### Don't:
- **Don't** drift toward a **corporate SaaS analytics dashboard** — no cold gray/blue chrome, no sterile hero-metric card grid, no gray hairline rules. This is a garage, not a boardroom.
- **Don't** go **childish or over-gamified** — no cartoon mascots, confetti storms, or Duolingo-style badge overload. The humor is dry (a single 😂 on a cold streak), not a theme park.
- **Don't** reach for the **generic AI-template startup look** — no purple gradients, no glassmorphism, no floating 3D blobs, no tracked eyebrow above every section.
- **Don't** let Poker (or anything) slide into **gambling/sportsbook slickness** — keep the friendly-ledger warmth, not a neon betting board.
- **Don't** nest a card inside a card, ever.
- **Don't** put a drop shadow on a resting surface — if it's not actively lifting, it's flat.
- **Don't** use a second font family to create emphasis — that's what weight is for.
- **Don't** set label, title, and value all at max loudness; if everything shouts, nothing does.
- **Don't** use muted stone body text on the cream field below 4.5:1 — bump toward Scoreboard Ink when contrast is close (the muted-gray-on-warm-near-white trap).
