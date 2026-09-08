import { NextResponse } from 'next/server'
import { createServerClient } from './supabase-server'
import { requireGroupAdmin } from './auth'

// Authorizes a mutation on a single row of a group-scoped table (a game, a player).
// The group is read from the row itself — never trusted from the request body — so
// an admin of one group cannot edit, delete, or approve a row belonging to another.
//
// Lives apart from lib/auth.ts because it imports next/server (which pulls in
// runtime web globals), keeping the pure auth helpers importable in unit tests.
export async function authorizeRowMutation(
  table: string,
  rowId: string
): Promise<{ ok: true; groupId: string } | { ok: false; response: NextResponse }> {
  const supabase = createServerClient()
  const { data: row } = await supabase
    .from(table)
    .select('group_id')
    .eq('id', rowId)
    .single()
  if (!row) return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  const admin = await requireGroupAdmin(row.group_id)
  if (!admin) return { ok: false, response: NextResponse.json({ error: 'Admin required' }, { status: 403 }) }
  return { ok: true, groupId: row.group_id }
}
