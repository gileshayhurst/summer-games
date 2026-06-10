import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { winner_ids, loser_ids, points_differential } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof points_differential !== 'number' || points_differential < 1)
    return NextResponse.json({ error: 'points_differential must be >= 1' }, { status: 400 })

  const supabase = createServerClient()

  // Update points_differential on the game
  const { error } = await supabase
    .from('beer_die_games')
    .update({ points_differential })
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete existing player rows and re-insert
  const { error: deleteError } = await supabase
    .from('beer_die_game_players')
    .delete()
    .eq('game_id', params.id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner' })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser' })),
  ]
  const { error: insertError } = await supabase.from('beer_die_game_players').insert(playerRows)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('beer_die_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
