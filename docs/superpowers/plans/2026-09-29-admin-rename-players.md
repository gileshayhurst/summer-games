# Admin Rename Players — Implementation Plan

Spec: `docs/superpowers/specs/2026-09-29-admin-rename-players-design.md`

1. **API** — add `PATCH` to `app/api/players/[id]/route.ts`: authorize via
   `authorizeRowMutation('users', id)`, trim/validate `name`, `update({ name }).eq('id', id)`,
   map `23505` → 409.
2. **UI** — in `components/admin/PlayersTab.tsx` add `editId`/`draft` state, a Rename button,
   inline input with Save/Cancel (Enter/Escape), `PATCH` fetch, reload on success, reuse `errors`.
3. **Verify** — `npm run lint`, `npx tsc --noEmit`, `npm test`.
4. **Commit & push** to `master`.
