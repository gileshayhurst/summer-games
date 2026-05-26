import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { BeerDieGame, User } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()
  const [{ data: users }, { data: games }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('beer_die_games').select('id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential, played_at'),
  ])
  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (games ?? []) as BeerDieGame[]
  )
  return NextResponse.json({ leaderboard, players: users ?? [] })
}

export async function POST(req: NextRequest) {
  const { winner1_id, winner2_id, loser1_id, loser2_id, points_differential } = await req.json()
  if (!winner1_id || !winner2_id || !loser1_id || !loser2_id)
    return NextResponse.json({ error: 'All 4 player IDs required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_games')
    .insert({ winner1_id, winner2_id, loser1_id, loser2_id, points_differential })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ game_id: data.id }, { status: 201 })
}
