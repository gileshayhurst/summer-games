import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import { examplePongLeaderboard, examplePongRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'wins', label: 'W', sortDirection: 'desc' as const },
  { key: 'losses', label: 'L', sortDirection: 'asc' as const },
  { key: 'win_rate', label: 'Win%', format: 'percent', sortDirection: 'desc' as const },
  { key: 'cup_differential', label: 'Cup Diff', colorize: true, format: 'signed', sortDirection: 'desc' as const },
]

export default function ExamplePongPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">🏓 Pong</h1>
        <p className="text-muted text-sm">Ranked by win rate</p>
      </div>
      <Leaderboard entries={examplePongLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="win_rate" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want head-to-head stats and partner records?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track your crew&apos;s game history.</p>
          <Link href="/create" className="inline-block bg-win text-ink text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={examplePongRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
