export const dynamic = 'force-dynamic'

import HeadToHead from '@/components/HeadToHead'
import PartnerRecord from '@/components/PartnerRecord'
import { BeerDieLeaderboardEntry, BeerDieGame, BeerDieSink, User } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'
import { computeBeerDieLeaderboard } from '@/lib/stats'

async function getData(): Promise<{ leaderboard: BeerDieLeaderboardEntry[]; players: User[] }> {
  try {
    const supabase = createServerClient()
    const [{ data: users }, { data: games }, { data: sinks }] = await Promise.all([
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('beer_die_games').select('id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential, played_at'),
      supabase.from('beer_die_sinks').select('id, game_id, player_id, type'),
    ])
    const leaderboard = computeBeerDieLeaderboard(
      (users ?? []) as User[],
      (games ?? []) as BeerDieGame[],
      (sinks ?? []) as BeerDieSink[]
    )
    return { leaderboard, players: (users ?? []) as User[] }
  } catch {
    return { leaderboard: [], players: [] }
  }
}

export default async function BeerDiePage() {
  const { leaderboard, players } = await getData()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-wide mb-1">🎲 Beer Die</h1>
        <p className="text-slate-400 text-sm">Ranked by win rate</p>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-slate-500 text-sm">No games yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wide border-b border-slate-700">
                <th className="text-left py-2 pr-4">Player</th>
                <th className="text-center py-2 px-2">W</th>
                <th className="text-center py-2 px-2">L</th>
                <th className="text-center py-2 px-2">Win%</th>
                <th className="text-center py-2 px-2">Pt Diff</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((e, i) => (
                <tr key={e.player_id} className={`border-b border-slate-800 ${i === 0 ? 'text-win font-bold' : 'text-white'}`}>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1.5">
                      {e.name}
                      {e.sinks > 0 && (
                        <span className="text-green-400 font-bold text-xs" title={`${e.sinks} sink${e.sinks !== 1 ? 's' : ''}`}>
                          {'✓'.repeat(Math.min(e.sinks, 5))}
                          {e.sinks > 5 ? `×${e.sinks}` : ''}
                        </span>
                      )}
                      {e.self_sinks > 0 && (
                        <span className="text-red-400 font-bold text-xs" title={`${e.self_sinks} self sink${e.self_sinks !== 1 ? 's' : ''}`}>
                          {'✗'.repeat(Math.min(e.self_sinks, 5))}
                          {e.self_sinks > 5 ? `×${e.self_sinks}` : ''}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">{e.wins}</td>
                  <td className="text-center py-2 px-2">{e.losses}</td>
                  <td className="text-center py-2 px-2">{(e.win_rate * 100).toFixed(1)}%</td>
                  <td className={`text-center py-2 px-2 ${e.point_differential > 0 ? 'text-win' : e.point_differential < 0 ? 'text-loss' : ''}`}>
                    {e.point_differential > 0 ? `+${e.point_differential}` : e.point_differential}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="max-w-xs space-y-4">
        <HeadToHead players={players} game="beer-die" />
        <PartnerRecord players={players} game="beer-die" />
      </div>
    </div>
  )
}
