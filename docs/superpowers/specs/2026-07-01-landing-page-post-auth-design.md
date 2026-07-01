# Landing Page Post-Auth Design

## Context

The app now has a real login/membership system (Google sign-in, `group_members`, join codes, public/private visibility, `/discover` for public groups, `/join/[code]` for joining a group). The landing page (`app/page.tsx`) still reflects the old, pre-auth, PIN-based world: it advertises "no login required," links to a static `/g/example` demo group, and offers a plain "Browse Groups" button. This spec brings the landing page copy and calls-to-action in line with the current auth model, and adds a "Join by Code" entry point that was missing.

## Goals

1. Remove all "no login required" messaging — login is now required to create a group, join a group, or log games.
2. Remove the "See an Example" button and its link to `/g/example`.
3. Rename "Browse Groups" to "Browse Public Groups" (still links to the existing `/discover` page — no changes to `/discover` itself).
4. Add a "Join by Code" entry point that lets a visitor type a join code and get routed into the existing join flow.

## Non-goals

- No changes to `/discover`, `/join/[code]`, the sign-in page, or any API route — all of that already exists and works.
- No header/nav changes (e.g. showing signed-in state) — out of scope for this pass.
- No validation of the join code on the landing page itself — `/join/[code]` already handles invalid codes.

## Copy changes (`app/page.tsx`)

| Location | Before | After |
|---|---|---|
| Top badge | `Free · No login required` | `Free` |
| Subtitle paragraph | `Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew. No app, no login.` | `Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew.` |
| Shareable feature card | `Public link your whole group can add to home screen to view as an app! No login necessary.` | `Public link your whole group can add to home screen to view as an app!` |

## Button row changes

Current: `Create Your Group` · `Browse Groups` · `See an Example`

New: `Create Your Group` · `Join by Code` · `Browse Public Groups`

- `Create Your Group` — unchanged, still links to `/create`.
- `See an Example` (`/g/example` link) — deleted entirely.
- `Browse Groups` → relabeled `Browse Public Groups`, still links to `/discover`.
- `Join by Code` — new, described below.

## Join by Code component

New file: `components/JoinByCodeButton.tsx` (client component), rendered inline in the button row on `app/page.tsx`.

**States:**
- **Collapsed (default):** a pill button styled like the other secondary buttons in the row, labeled "Join by Code".
- **Expanded:** clicking the button swaps it for a small inline form (visually consistent with the existing `SuggestionForm` component further down the page): a text input (placeholder "Enter code") plus a "Join →" submit button, rendered centered below the button row. Clicking the "Join by Code" trigger again (or a small cancel affordance) collapses it back to the default state.

**Behavior:**
- On submit, if the input is non-empty, navigate via `router.push('/join/' + code.trim().toUpperCase())`.
- No client-side validation of the code's existence — `/join/[code]` already renders an "Invalid join code" error and handles the sign-in redirect / claim-a-player flow.
- Empty submission is a no-op (submit button or form can simply require non-empty input via HTML `required`).

## Testing

Manual verification in the browser:
- Landing page no longer shows any "no login" messaging or the "See an Example" button.
- "Browse Public Groups" navigates to `/discover`.
- Clicking "Join by Code" reveals the input; typing a valid existing join code and submitting lands on `/join/[code]`'s claim flow; typing garbage lands on its "Invalid join code" error state.
- Clicking "Join by Code" again collapses the form.
