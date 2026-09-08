export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import RecentGames from '@/components/RecentGames'
import { BeerBallGamePlayer, User, RecentBeerBallGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeBeerBallLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupBeerBallPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('beer_ball_game_players').select('game_id, player_id, side, beer_ball_games ( id, cans_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_ball_games').select('id, cans_left, played_at, beer_ball_game_players ( side, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeBeerBallLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as BeerBallGamePlayer[]
  )

  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3
      ? `🔥${e.current_streak} ${e.name}`
      : e.current_loss_streak >= 3
        ? `😂${e.current_loss_streak} ${e.name}`
        : e.name,
  }))

  const recentGames: RecentBeerBallGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'beer-ball' as const,
    id: g.id,
    played_at: g.played_at,
    winners: (g.beer_ball_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
    losers: (g.beer_ball_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
    cans_left: g.cans_left,
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W', sortDirection: 'desc' as const },
    { key: 'losses', label: 'L', sortDirection: 'asc' as const },
    { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
    { key: 'can_differential', label: 'Can Diff', colorize: true, format: 'signed', sortDirection: 'desc' as const },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🍺 Beer Ball</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <HeadToHead players={(users ?? []) as User[]} game="beer-ball" />
          <PartnerRecord players={(users ?? []) as User[]} game="beer-ball" />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={recentGames} />
        </div>
      </div>
    </div>
  )
}
