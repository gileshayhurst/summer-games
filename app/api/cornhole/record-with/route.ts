import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeCornholePartnerRecord } from '@/lib/stats'
import { CornholeGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('cornhole_game_players')
    .select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('cornhole_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeCornholePartnerRecord(player1, player2, (data ?? []) as unknown as CornholeGamePlayer[])
  return NextResponse.json({ result })
}
