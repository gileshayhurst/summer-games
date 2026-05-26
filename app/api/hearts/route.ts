import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { HeartsGamePlayer, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('hearts_game_players').select(`
      game_id, player_id, lost,
      hearts_games ( id, played_at )
    `),
  ])
  const leaderboard = computeHeartsLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as HeartsGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { game_players } = await req.json()
  if (!Array.isArray(game_players) || game_players.length < 3)
    return NextResponse.json({ error: 'At least 3 players required' }, { status: 400 })
  const losers = game_players.filter((p: { lost: boolean }) => p.lost)
  if (losers.length !== 1)
    return NextResponse.json({ error: 'Exactly 1 loser required' }, { status: 400 })

  const supabase = createServerClient()
  const { data: game, error: gameErr } = await supabase
    .from('hearts_games')
    .insert({})
    .select()
    .single()
  if (gameErr) return NextResponse.json({ error: gameErr.message }, { status: 500 })

  const rows = game_players.map((p: { player_id: string; lost: boolean }) => ({
    game_id: game.id,
    player_id: p.player_id,
    lost: p.lost,
  }))
  const { error: playersErr } = await supabase.from('hearts_game_players').insert(rows)
  if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  return NextResponse.json({ game_id: game.id }, { status: 201 })
}
