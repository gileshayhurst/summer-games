export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import { HeartsGamePlayer, User, RecentHeartsGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

export default async function GroupHeartsPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at, hearts_game_players ( lost, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])

  const entries = leaderboard.map(e => ({
    ...e,
    name: e.current_streak >= 3
      ? `🔥${e.current_streak} ${e.name}`
      : e.current_loss_streak >= 3
        ? `😂${e.current_loss_streak} ${e.name}`
        : e.name,
  }))

  const recentGames: RecentHeartsGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'hearts' as const,
    id: g.id,
    played_at: g.played_at,
    players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
    loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
    { key: 'wins', label: 'Wins', sortDirection: 'desc' as const },
    { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">♥ Hearts</h1>
        <p className="text-muted text-sm">Ranked by highest win rate</p>
      </div>
      <Leaderboard entries={entries as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
        <RecentGames games={recentGames} />
      </div>
    </div>
  )
}
