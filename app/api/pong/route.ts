import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'
import { PongGamePlayer, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()

  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('pong_game_players').select(`
      game_id, player_id, side,
      pong_games ( id, cups_left, played_at )
    `),
  ])

  const leaderboard = computePongLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PongGamePlayer[]
  )

  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, cups_left } = await req.json()

  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be a non-negative number' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('pong_games')
    .insert({ cups_left })
    .select()
    .single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'winner' })),
    ...loser_ids.map((id: string) => ({ game_id: game.id, player_id: id, side: 'loser' })),
  ]
  const { error: playersErr } = await supabase.from('pong_game_players').insert(playerRows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })

  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
