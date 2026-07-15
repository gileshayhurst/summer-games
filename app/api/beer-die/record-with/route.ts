import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { canReadGroup } from '@/lib/auth'
import { computeBeerDiePartnerRecord } from '@/lib/stats'
import { BeerDieGamePlayer } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const player1 = searchParams.get('player1')
  const player2 = searchParams.get('player2')
  const group_id = searchParams.get('group_id')
  if (!player1 || !player2) return NextResponse.json({ error: 'player1 and player2 required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  if (!(await canReadGroup(group_id)))
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('beer_die_game_players')
    .select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )')
    .in('player_id', [player1, player2])
    .eq('group_id', group_id)
    .eq('beer_die_games.approved', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = computeBeerDiePartnerRecord(player1, player2, (data ?? []) as unknown as BeerDieGamePlayer[])
  return NextResponse.json({ result })
}
