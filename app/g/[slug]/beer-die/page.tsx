export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { BeerDieGamePlayer, BeerDieSink, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupBeerDiePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
  ])

  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
  )

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">🎲 Beer Die</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs space-y-4">
        <HeadToHead players={(users ?? []) as User[]} game="beer-die" />
        <PartnerRecord players={(users ?? []) as User[]} game="beer-die" />
      </div>
    </div>
  )
}
