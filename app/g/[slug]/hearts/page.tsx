export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import { HeartsGamePlayer, User } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupHeartsPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
  ])

  const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games' },
    { key: 'losses', label: 'Losses' },
    { key: 'loss_rate', label: 'Loss%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">♥ Hearts</h1>
        <p className="text-slate-400 text-sm">Ranked by lowest loss rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
    </div>
  )
}
