import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { BeerDieGamePlayer, BeerDieSink, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )'),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type'),
  ])
  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, points_differential, sinks } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_games')
    .insert({ points_differential })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner' })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser' })),
  ]
  const { error: playerError } = await supabase.from('beer_die_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  // Insert sinks if any were provided
  if (Array.isArray(sinks) && sinks.length > 0) {
    const sinkRows = sinks
      .filter((s: { player_id: string; type: string }) =>
        s.player_id && (s.type === 'sink' || s.type === 'self_sink')
      )
      .map((s: { player_id: string; type: string }) => ({
        game_id: data.id,
        player_id: s.player_id,
        type: s.type,
      }))
    if (sinkRows.length > 0) {
      await supabase.from('beer_die_sinks').insert(sinkRows)
    }
  }

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
