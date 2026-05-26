export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import { PongLeaderboardEntry, PongGamePlayer, User } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard } from '@/lib/stats'

async function getData(): Promise<{ leaderboard: PongLeaderboardEntry[]; players: User[] }> {
  try {
    const supabase = createServerClient()
    const [{ data: users }, { data: gamePlayers }] = await Promise.all([
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('pong_game_players').select(`game_id, player_id, side, pong_games ( id, cups_left, played_at )`),
    ])
    const leaderboard = computePongLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as PongGamePlayer[])
    return { leaderboard, players: (users ?? []) as User[] }
  } catch {
    return { leaderboard: [], players: [] }
  }
}

export default async function PongPage() {
  const { leaderboard, players } = await getData()

  const columns = [
    { key: 'name', label: 'Player' },
    { key: 'wins', label: 'W' },
    { key: 'losses', label: 'L' },
    { key: 'win_rate', label: 'Win%', format: (v: number | string) => `${(Number(v) * 100).toFixed(1)}%` },
    { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: (v: number | string) => Number(v) > 0 ? `+${v}` : String(v) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">🏓 Pong</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={leaderboard as unknown as Record<string, string | number>[]} columns={columns} />
      <div className="max-w-xs">
        <HeadToHead players={players} game="pong" />
      </div>
    </div>
  )
}
