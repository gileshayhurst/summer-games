export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { CornholeGamePlayer, User, RecentCornholeGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeCornholeLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'
import CornholeIcon from '@/components/icons/CornholeIcon'

export default async function GroupCornholePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at, cornhole_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeCornholeLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as CornholeGamePlayer[]
  )

  const recentGames: RecentCornholeGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'cornhole' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: 'signed', sortDirection: 'desc' as const },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1"><CornholeIcon className="inline w-9 h-9 mr-1 align-middle" /> Cornhole</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="cornhole" />
          <PartnerRecord players={(users ?? []) as User[]} game="cornhole" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
