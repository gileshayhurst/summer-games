import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerBallLeaderboard } from '@/lib/stats'
import { BeerBallGamePlayer, User } from '@/lib/types'
import { getMemberForAPI, canReadGroup } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  if (!(await canReadGroup(group_id)))
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group_id).order('name'),
    supabase.from('beer_ball_game_players').select('game_id, player_id, side, beer_ball_games!inner ( id, cans_left, played_at )').eq('group_id', group_id).eq('beer_ball_games.approved', true),
  ])
  const leaderboard = computeBeerBallLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerBallGamePlayer[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner_ids, loser_ids, cans_left, group_id } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cans_left !== 'number' || !Number.isInteger(cans_left) || cans_left < 0)
    return NextResponse.json({ error: 'cans_left must be an integer >= 0' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const member = await getMemberForAPI(group_id)
  if (!member) return NextResponse.json({ error: 'Must be a group member to log games' }, { status: 403 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_ball_games').insert({ cans_left, group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'winner', group_id })),
    ...loser_ids.map((id: string) => ({ game_id: data.id, player_id: id, side: 'loser', group_id })),
  ]
  const { error: playerError } = await supabase.from('beer_ball_game_players').insert(playerRows)
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 })

  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
