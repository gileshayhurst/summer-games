import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import {
  EXAMPLE_GROUP_NAME,
  examplePongLeaderboard,
  exampleBeerDieLeaderboard,
  exampleCornholeLeaderboard,
  exampleSpikeballLeaderboard,
  exampleHeartsLeaderboard,
  exampleRecentAll,
} from './data'

type GameLeader = { name: string; wins: number; losses: number; winRatePct: number } | null

const GAME_CARDS = [
  { key: 'pong', slug: 'pong', icon: '🏓', name: 'Pong' },
  { key: 'beer-die', slug: 'beer-die', icon: '🎲', name: 'Beer Die' },
  { key: 'hearts', slug: 'hearts', icon: '♥', name: 'Hearts' },
  { key: 'cornhole', slug: 'cornhole', icon: '🌽', name: 'Cornhole' },
  { key: 'spikeball', slug: 'spikeball', icon: '🏐', name: 'Spikeball' },
]

function toLeader(entry: any, isHearts = false): GameLeader {
  if (!entry) return null
  if (isHearts) {
    const wins = entry.games_played - entry.losses
    return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100) }
  }
  return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100) }
}

const leaders: Record<string, GameLeader> = {
  pong: toLeader((examplePongLeaderboard as any[])[0]),
  'beer-die': toLeader((exampleBeerDieLeaderboard as any[])[0]),
  hearts: toLeader((exampleHeartsLeaderboard as any[])[0], true),
  cornhole: toLeader((exampleCornholeLeaderboard as any[])[0]),
  spikeball: toLeader((exampleSpikeballLeaderboard as any[])[0]),
}

export default function ExampleHomePage() {
  const base = '/g/example'
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{EXAMPLE_GROUP_NAME}</h1>
        <p className="text-muted mt-2 italic font-bold">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {GAME_CARDS.map(({ key, slug, icon, name }) => {
          const leader = leaders[key] ?? null
          return (
            <Link
              key={key}
              href={`${base}/${slug}`}
              className="bg-card rounded-xl p-4 border border-warm hover:bg-amber-50 transition-colors"
            >
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-2">{name}</div>
              <div className="text-sm font-black text-stone-900 truncate">{leader?.name ?? '—'}</div>
              <div className={`text-[10px] font-bold ${leader ? 'text-muted' : 'text-stone-300'}`}>
                {leader ? `${leader.wins}W · ${leader.losses}L · ${leader.winRatePct}%` : 'No games yet'}
              </div>
            </Link>
          )
        })}
      </div>
      <div>
        <h2 className="text-xs font-black mb-4 tracking-widest uppercase text-muted">Recent Games</h2>
        <RecentGames games={exampleRecentAll} />
      </div>
    </div>
  )
}
