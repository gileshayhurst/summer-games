import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { player_amounts, group_id } = await req.json()
  if (!Array.isArray(player_amounts) || player_amounts.length < 2)
    return NextResponse.json({ error: 'At least 2 players required' }, { status: 400 })
  const supabase = createServerClient()
  const { error: deleteErr } = await supabase
    .from('poker_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  const playerRows = player_amounts.map((pa: { player_id: string; amount_cents: number }) => ({
    game_id: params.id,
    player_id: pa.player_id,
    amount_cents: pa.amount_cents,
    group_id,
  }))
  const { error: insertErr } = await supabase.from('poker_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('poker_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
