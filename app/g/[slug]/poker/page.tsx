export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import { PokerGamePlayer, User, RecentPokerGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePokerLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

function formatCents(cents: number): string {
  const abs = Math.abs(cents)
  const dollars = (abs / 100).toFixed(2)
  return cents >= 0 ? `+$${dollars}` : `-$${dollars}`
}

export default async function GroupPokerPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: gamePlayers }, { data: recentRaw }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('poker_game_players')
      .select('game_id, player_id, amount_cents, poker_games ( id, played_at )')
      .eq('group_id', group.id),
    supabase.from('poker_games')
      .select('id, played_at, poker_game_players ( player_id, amount_cents, users ( id, name ) )')
      .eq('group_id', group.id).eq('approved', true)
      .order('played_at', { ascending: false }).limit(5),
  ])

  const leaderboard = computePokerLeaderboard(
    (users ?? []) as User[],
    (gamePlayers ?? []) as unknown as PokerGamePlayer[]
  )

  const recentGames: RecentPokerGame[] = (recentRaw ?? []).map((g: any) => ({
    type: 'poker' as const,
    id: g.id,
    played_at: g.played_at,
    results: (g.poker_game_players ?? []).map((p: any) => ({
      name: p.users?.name ?? 'Unknown',
      amount_cents: p.amount_cents,
    })),
  }))

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'games_played', label: 'Games' },
    { key: 'total_profit_cents', label: 'Total Profit', colorize: true, format: (v: number | string) => formatCents(Number(v)) },
    { key: 'win_sessions', label: 'Wins' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">♠ Poker</h1>
        <p className="text-muted text-sm">Ranked by total profit</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
        <RecentGames games={recentGames} />
      </div>
    </div>
  )
}
