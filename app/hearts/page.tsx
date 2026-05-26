export const dynamic = 'force-dynamic'

import Leaderboard from '@/components/Leaderboard'
import { HeartsLeaderboardEntry, HeartsGamePlayer, User } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'
import { computeHeartsLeaderboard } from '@/lib/stats'

async function getData(): Promise<{ leaderboard: HeartsLeaderboardEntry[] }> {
  try {
    const supabase = createServerClient()
    const [{ data: users }, { data: gamePlayers }] = await Promise.all([
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('hearts_game_players').select(`game_id, player_id, lost, hearts_games ( id, played_at )`),
    ])
    const leaderboard = computeHeartsLeaderboard((users ?? []) as User[], (gamePlayers ?? []) as unknown as HeartsGamePlayer[])
    return { leaderboard }
  } catch {
    return { leaderboard: [] }
  }
}

export default async function HeartsPage() {
  const { leaderboard } = await getData()

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
