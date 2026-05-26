import Leaderboard from '@/components/Leaderboard'
import { HeartsLeaderboardEntry } from '@/lib/types'

async function getData(): Promise<{ leaderboard: HeartsLeaderboardEntry[] }> {
  try {
    const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/hearts`, { cache: 'no-store' })
    if (!res.ok) return { leaderboard: [] }
    return res.json()
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
