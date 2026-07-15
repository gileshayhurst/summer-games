import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authorizeGameMutation } from '@/lib/api-auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeGameMutation('pong_games', params.id)
  if (!auth.ok) return auth.response

  const { winner_ids, loser_ids, cups_left } = await req.json()
  if (!Array.isArray(winner_ids) || winner_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 winner required' }, { status: 400 })
  if (!Array.isArray(loser_ids) || loser_ids.length < 1)
    return NextResponse.json({ error: 'At least 1 loser required' }, { status: 400 })
  if (typeof cups_left !== 'number' || cups_left < 0)
    return NextResponse.json({ error: 'cups_left must be >= 0' }, { status: 400 })

  const supabase = createServerClient()
  const { error: updateErr } = await supabase
    .from('pong_games').update({ cups_left }).eq('id', params.id)
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const { error: deleteErr } = await supabase
    .from('pong_game_players').delete().eq('game_id', params.id)
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

  const playerRows = [
    ...winner_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'winner', group_id: auth.groupId })),
    ...loser_ids.map((id: string) => ({ game_id: params.id, player_id: id, side: 'loser', group_id: auth.groupId })),
  ]
  const { error: insertErr } = await supabase.from('pong_game_players').insert(playerRows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeGameMutation('pong_games', params.id)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()
  const { error } = await supabase.from('pong_games').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeGameMutation('pong_games', params.id)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()
  const { error } = await supabase.from('pong_games').update({ approved: true }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
