export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import { BeerDieLeaderboardEntry, BeerDieGame, User } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'

async function getData(): Promise<{ leaderboard: BeerDieLeaderboardEntry[]; players: User[]; debug?: string }> {
  try {
    const supabase = createServerClient()
    const [{ data: users, error: usersErr }, { data: games, error: gamesErr }] = await Promise.all([
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('beer_die_games').select('*'),
    ])
    if (usersErr) return { leaderboard: [], players: [], debug: `users error: ${usersErr.message}` }
    if (gamesErr) return { leaderboard: [], players: [], debug: `games error: ${gamesErr.message}` }
    const leaderboard = computeBeerDieLeaderboard((users ?? []) as User[], (games ?? []) as BeerDieGame[])
    return { leaderboard, players: (users ?? []) as User[], debug: `users: ${users?.length}, games: ${games?.length}, leaderboard: ${leaderboard.length}` }
  } catch (e: any) {
    return { leaderboard: [], players: [], debug: `catch: ${e?.message}` }
  }
}

export default async function BeerDiePage() {
  const { leaderboard, players, debug } = await getData()

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
        {debug && <p className="text-xs text-yellow-400 mt-1">{debug}</p>}
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs">
        <HeadToHead players={players} game="beer-die" />
      </div>
    </div>
  )
}
