import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authorizeRowMutation } from '@/lib/api-auth'

const GAME_PLAYER_TABLES = [
  'pong_game_players',
  'beer_die_game_players',
  'beer_ball_game_players',
  'cornhole_game_players',
  'spikeball_game_players',
  'hearts_game_players',
  'pool_game_players',
  'poker_game_players',
]

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeRowMutation('users', params.id)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()

  const [{ data: player }, memberCount, ...gameCounts] = await Promise.all([
    supabase.from('users').select('name').eq('id', params.id).single(),
    supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('player_id', params.id),
    ...GAME_PLAYER_TABLES.map(t =>
      supabase.from(t).select('game_id', { count: 'exact', head: true }).eq('player_id', params.id)
    ),
  ])

  const name = player?.name ?? 'This player'
  const games = gameCounts.reduce((sum, r) => sum + (r.count ?? 0), 0)
  if (games > 0)
    return NextResponse.json(
      { error: `${name} is in ${games} game${games === 1 ? '' : 's'} — delete those games first` },
      { status: 409 }
    )

  // group_members.player_id is ON DELETE SET NULL, so without this check deleting
  // a player would silently unclaim a member's identity with no warning anywhere.
  if ((memberCount.count ?? 0) > 0)
    return NextResponse.json(
      { error: `${name} is claimed by a member — unlink them first` },
      { status: 409 }
    )

  const { error } = await supabase.from('users').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
