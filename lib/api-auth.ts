import { NextResponse } from 'next/server'
import { createServerClient } from './supabase-server'
import { requireGroupAdmin } from './auth'

// Authorizes a mutation on a single game. The group is read from the game's own
// row — never trusted from the request body — so an admin of one group cannot
// edit, delete, or approve a game belonging to another group.
//
// Lives apart from lib/auth.ts because it imports next/server (which pulls in
// runtime web globals), keeping the pure auth helpers importable in unit tests.
export async function authorizeGameMutation(
  table: string,
  gameId: string
): Promise<{ ok: true; groupId: string } | { ok: false; response: NextResponse }> {
  const supabase = createServerClient()
  const { data: game } = await supabase
    .from(table)
    .select('group_id')
    .eq('id', gameId)
    .single()
  if (!game) return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  const admin = await requireGroupAdmin(game.group_id)
  if (!admin) return { ok: false, response: NextResponse.json({ error: 'Admin required' }, { status: 403 }) }
  return { ok: true, groupId: game.group_id }
}
