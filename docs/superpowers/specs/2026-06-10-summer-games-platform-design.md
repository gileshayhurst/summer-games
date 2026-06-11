# Summer Games Platform — Business & Multi-Tenancy Design Spec

**Date:** 2026-06-10

## Overview

Transform Summer Games from a single-group tracker into a shared platform that any friend group in the country can use to track their game results. The goal is a lean side project with real growth potential — free to start, ad-supported once traffic warrants it, built on the existing Next.js/Supabase stack.

---

## Business Model

**Phase 1 (MVP → meaningful traffic):** Free. No ads, no billing. Focus entirely on getting real groups using the platform via word of mouth and shared leaderboard links.

**Phase 2 (once traffic builds):** Google AdSense banner ads on public leaderboard pages only (not log or admin pages). Realistic CPM ~$2-5 for this niche. Covers hosting costs well before generating meaningful income.

**Phase 2b (optional):** A "Go Ad-Free" upgrade at ~$2-3/month per group. No Stripe integration at first — manual via Venmo/PayPal, flip a `premium` boolean on the group row. Automate only if volume justifies it.

**What we skip at MVP:** Stripe/billing infrastructure, per-player accounts, paywalled features, any freemium feature gating.

---

## Architecture

### Multi-Tenancy Approach

Add a `groups` table. Scope all existing data to a group via `group_id` foreign keys on every table. No fundamental change to app logic — everything becomes group-aware.

**Tech stack unchanged:**
| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS |
| Hosting | Vercel |

### Cost Profile at Scale

| Scale | Est. Monthly Cost |
|-------|-------------------|
| Dozens of groups | $0 (free tiers) |
| 100–500 active groups | ~$45–50/month (Vercel Pro + Supabase Pro) |
| Thousands of groups | Scales, but covered by ad revenue at that point |

> **Future optimization note:** Leaderboard pages currently fetch real-time data on every request. If Vercel serverless invocation costs become an issue at scale, add Next.js ISR (60-second revalidation) to leaderboard pages. Skip this until it's actually a problem.

---

## Database Schema Changes

### New `groups` table
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `slug` | text UNIQUE | URL-safe, e.g. `robs-crew` |
| `name` | text | Display name, e.g. "Rob's Crew" |
| `admin_pin_hash` | text | Bcrypt hash of 4-digit PIN |
| `premium` | boolean | Ad-free flag, default false |
| `created_at` | timestamptz | |

### Existing tables — add `group_id`
All of the following get a `group_id uuid FK → groups` column:
- `users` (players)
- `pong_games` + `pong_game_players`
- `beer_die_games`
- `hearts_games` + `hearts_game_players`

### Migration
Giles's existing group is migrated into the first row of `groups` (slug: `summer-games` or chosen at migration time). All existing rows get that group's `id` as their `group_id`. Zero data loss.

---

## URL Structure

| Old Route | New Route |
|-----------|-----------|
| `/` | `/g/[slug]` (group home) |
| `/pong` | `/g/[slug]/pong` |
| `/beer-die` | `/g/[slug]/beer-die` |
| `/hearts` | `/g/[slug]/hearts` |
| `/players` | `/g/[slug]/players` |
| `/players/[name]` | `/g/[slug]/players/[name]` |
| `/log` | `/g/[slug]/log` |
| `/admin` | `/g/[slug]/admin` |
| *(none)* | `/` — new public landing page |
| *(none)* | `/create` — group creation form |

---

## Group Onboarding

### Landing Page (`/`)
- One-sentence explanation of what Summer Games is
- Screenshot of a leaderboard
- "Create Your Group" CTA button
- Link to an example public group (Giles's crew) so visitors can see it in action before committing

### Group Creation Form (`/create`)
1. Group name (display name)
2. Slug — auto-generated from name, user-editable, validated for uniqueness
3. Admin PIN (4 digits)
4. Add initial players (same multi-input as current players page)

On submit: `groups` row created, players seeded, redirect to `/g/[slug]`.

### Returning Users
Groups bookmark `/g/[slug]`. No login required. Admin PIN gate protects log/edit/delete — same as today.

---

## Public Shareable Pages

All group content is public by default:
- `/g/[slug]` — recent games feed
- `/g/[slug]/pong`, `/beer-die`, `/hearts` — leaderboards
- `/g/[slug]/players/[name]` — individual player profiles

**Private (PIN-gated):**
- `/g/[slug]/admin` — edit/delete panel

**Open Graph preview cards:**
Built using Next.js's `opengraph-image` route. When a leaderboard link is shared in iMessage, Discord, Instagram DMs, etc., it renders a preview card showing the group name, current #1 player, and top 3 standings. No extra dependencies, runs free on Vercel.

Example preview: *"🏓 Rob's Crew — Pong Leaderboard: Giles #1 (78%)"*

---

## Game Expansion

Games are self-contained modules: database table(s), API routes, leaderboard page, log form tab. New games are added by building the module — no platform-level changes required.

**Discovery mechanism:** A "Suggest a Game" link on the group home page (prefilled email or simple form) lets groups tell you what they want to track next.

**Good candidates based on common friend group games:**
- Cornhole
- Spades / Euchre
- Darts
- Pickleball / Tennis
- Mario Kart / Smash Bros

**What we don't build:** A custom game builder. Expand the built-in list based on real requests first.

---

## What We're Not Building (Yet)

- Per-player user accounts / authentication
- Stripe billing integration
- Group discovery or cross-group features
- Custom game builder
- Mobile app
