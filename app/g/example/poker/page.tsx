import Leaderboard from '@/components/Leaderboard'
import RecentGames from '@/components/RecentGames'
import Link from 'next/link'
import { examplePokerLeaderboard, examplePokerRecent } from '../data'

const columns = [
  { key: 'name', label: 'Player' },
  { key: 'games_played', label: 'Games', sortDirection: 'desc' as const },
  { key: 'total_profit_cents', label: 'Total Profit', colorize: true, format: 'cents' as const, sortDirection: 'desc' as const },
  { key: 'win_sessions', label: 'Wins', sortDirection: 'desc' as const },
  { key: 'win_rate', label: 'Win%', format: 'percent' as const, sortDirection: 'desc' as const },
]

export default function ExamplePokerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">♠ Poker</h1>
        <p className="text-muted text-sm">Ranked by total profit</p>
      </div>
      <Leaderboard entries={examplePokerLeaderboard as unknown as Record<string, string | number>[]} columns={columns} defaultSortKey="total_profit_cents" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-warm rounded-xl p-5 text-center">
          <p className="text-sm font-bold text-stone-900 mb-1">Want to track your crew&apos;s poker results?</p>
          <p className="text-sm text-muted mb-3">Create your own group to track profit and loss over time.</p>
          <Link href="/create" className="inline-block bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
            Create Your Group →
          </Link>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Recent Games</p>
          <RecentGames games={examplePokerRecent as any[]} />
        </div>
      </div>
    </div>
  )
}
