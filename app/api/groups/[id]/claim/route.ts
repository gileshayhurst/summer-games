import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI, getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const member = await getMemberForAPI(params.id)
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { playerId, playerName } = await req.json()
  const supabase = createServerClient()

  let resolvedPlayerId: string | null = null

  if (playerId) {
    const { data: player } = await supabase
      .from('users').select('id').eq('id', playerId).eq('group_id', params.id).single()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: existing } = await supabase
      .from('group_members').select('id').eq('group_id', params.id).eq('player_id', playerId).single()
    if (existing) return NextResponse.json({ error: 'That player is already claimed' }, { status: 409 })

    resolvedPlayerId = playerId
  } else if (playerName?.trim()) {
    const { data: newPlayer, error: playerErr } = await supabase
      .from('users').insert({ name: playerName.trim(), group_id: params.id }).select().single()
    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })
    resolvedPlayerId = newPlayer.id
  } else {
    return NextResponse.json({ error: 'playerId or playerName required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('group_members')
    .update({ player_id: resolvedPlayerId })
    .eq('group_id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
