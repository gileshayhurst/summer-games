import Leaderboard from '@/components/Leaderboard'
import HeadToHead from '@/components/HeadToHead'
import { PongLeaderboardEntry, User } from '@/lib/types'

async function getData(): Promise<{ leaderboard: PongLeaderboardEntry[]; players: User[] }> {
  const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/pong`, { cache: 'no-store' })
  return res.json()
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
