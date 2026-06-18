import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePokerLeaderboard } from '@/lib/stats'
import { PokerGamePlayer, User } from '@/lib/types'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('poker_game_players')
      .select('game_id, player_id, amount_cents, poker_games!inner ( id, played_at )')
      .eq('group_id', group_id)
      .eq('poker_games.approved', true),
  ])
  const leaderboard = computePokerLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PokerGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { player_amounts, group_id } = await req.json()
  if (!Array.isArray(player_amounts) || player_amounts.length < 2)
    return NextResponse.json({ error: 'At least 2 players required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  for (const pa of player_amounts) {
    if (typeof pa.player_id !== 'string' || typeof pa.amount_cents !== 'number')
      return NextResponse.json({ error: 'Each player must have player_id and amount_cents' }, { status: 400 })
  }
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('poker_games').insert({ group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const playerRows = player_amounts.map((pa: { player_id: string; amount_cents: number }) => ({
    game_id: data.id,
    player_id: pa.player_id,
    amount_cents: pa.amount_cents,
    group_id,
  }))
  const { error: playerError } = await supabase.from('poker_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })
  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
