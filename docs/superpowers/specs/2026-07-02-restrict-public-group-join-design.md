# Design Spec: Restrict Public Group Joining to Invite Link/Code Only

**Date:** 2026-07-02  
**Status:** Approved

## Problem

When a user browses to a public group page (via `/discover` or a direct URL), they see a banner reading "Sign in and join to log games." with a "Join →" button. That button links to `/join/[join_code]`, effectively handing the group's join code to any anonymous visitor. Joining should only be possible when someone is explicitly given the join link or code by a group member.

## Goal

Non-members who browse to a public group page see a read-only notice that explains how to join — no button, no exposed join code. The `/join/[code]` flow itself is unchanged; it remains the only path into a group.

## Changes

### 1. `app/g/[slug]/page.tsx` — Non-member banner

**Before:**
```tsx
{!member && isPublic && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between mb-6">
    <p className="text-sm font-bold text-stone-900">Sign in and join to log games.</p>
    <a
      href={`/join/${group.join_code}`}
      className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
    >
      Join →
    </a>
  </div>
)}
```

**After:**
```tsx
{!member && isPublic && (
  <div className="bg-amber-50 border border-warm rounded-xl p-4 mb-6">
    <p className="text-sm font-bold text-stone-900">Join this group with an invite link from a member.</p>
  </div>
)}
```

The `join_code` field is no longer referenced in this render path.

### 2. `app/discover/page.tsx` — Subtitle copy

**Before:**
```tsx
<p className="text-muted text-sm mt-1">Public groups you can follow.</p>
```

**After:**
```tsx
<p className="text-muted text-sm mt-1">Public groups you can view.</p>
```

## What is not changing

- The `/join/[code]` page and API (`app/join/[code]/page.tsx`, `app/api/join/[code]/route.ts`) are untouched.
- The "Join by Code" button on the landing page is untouched.
- Non-members can still freely view public group pages (leaderboards, recent games, player stats).
- Auth and membership logic in `lib/auth.ts` is untouched.
- No DB or API changes.

## Testing

- Browse to a public group while signed out → see read-only banner, no Join button.
- Browse to a public group while signed in as a non-member → same.
- Navigate to `/join/[valid-code]` directly → join flow works as before.
- Discover page subtitle reads "Public groups you can view."
