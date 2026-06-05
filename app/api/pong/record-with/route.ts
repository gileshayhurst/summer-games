import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computePongPartnerRecord } from '@/lib/stats'
import { PongGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  if (!player1 || !player2)
    return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pong_game_players')
    .select('game_id, player_id, side, pong_games ( id, cups_left, played_at )')
    .in('player_id', [player1, player2])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computePongPartnerRecord(player1, player2, (data ?? []) as unknown as PongGamePlayer[])
  return NextResponse.json({ result })
}
