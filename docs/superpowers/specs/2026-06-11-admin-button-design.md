# Admin Button Design

**Date:** 2026-06-11

## Summary

Replace the URL-hack admin access (`/admin` appended manually) with a ⚙️ settings icon in the group nav bar, and update related copy to reflect the new access method.

## Changes

### 1. GroupNav — ⚙️ icon button

Add a `⚙️` icon as a `<Link>` to `/g/[slug]/admin`, placed immediately left of the "LOG GAME →" button in `components/GroupNav.tsx`. Style matches the existing 🏠 home button: muted text colour, hover darkens, `shrink-0`.

### 2. Create page — label clarification

In `app/create/page.tsx`, update the Admin PIN field label from:
> Admin PIN (4 digits)

to:
> Admin PIN (4 digits) — accessible through ⚙️

### 3. Log page — tip text update

In `app/g/[slug]/log/page.tsx`, update the tip from:
> To approve submissions, add `/admin` to the end of your group link (PIN required).

to:
> To approve submissions, tap the ⚙️ icon in the nav (PIN required).

## Files Touched

- `components/GroupNav.tsx`
- `app/create/page.tsx`
- `app/g/[slug]/log/page.tsx`
