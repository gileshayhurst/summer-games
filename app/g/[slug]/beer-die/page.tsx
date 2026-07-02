export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { BeerDieGamePlayer, BeerDieSink, User, RecentBeerDieGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupBeerDiePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: sinks }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeBeerDieLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerDieGamePlayer[],
    (sinks ?? []) as BeerDieSink[]
  )

  const recentGames: RecentBeerDieGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'beer-die' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    points_differential: g.points_differential,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
    { key: 'point_differential', label: 'Pt Diff', colorize: true, format: 'signed', sortDirection: 'desc' as const },
    { key: 'sinks', label: 'Sinks', sortDirection: 'desc' as const },
    { key: 'self_sinks', label: 'Self Sinks', sortDirection: 'asc' as const },
  ]

  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3 ? `🔥${e.current_streak} ${e.name}` : e.name,
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🎲 Beer Die</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="beer-die" />
          <PartnerRecord players={(users ?? []) as User[]} game="beer-die" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
