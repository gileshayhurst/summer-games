import { RecentGame } from '@/lib/types'
import GameIcon from './icons/GameIcon'

function formatGame(g: RecentGame): { title: string; detail: string } {
  if (g.type === 'pong') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `${g.cups_left} cup${g.cups_left !== 1 ? 's' : ''} left`,
  }
  if (g.type === 'beer-die') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'cornhole') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'spikeball') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.points_differential} pt${g.points_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'pool') return {
    title: `${g.winners.join(' & ')} beat ${g.losers.join(' & ')}`,
    detail: `won by ${g.balls_differential} ball${g.balls_differential !== 1 ? 's' : ''}`,
  }
  if (g.type === 'poker') return {
    title: `Poker — ${g.results.map(r => r.name).join(', ')}`,
    detail: `${g.results.length} player${g.results.length !== 1 ? 's' : ''}`,
  }
  return {
    title: `Hearts — ${g.players.join(', ')}`,
    detail: `${g.loser} lost`,
  }
}

export default function RecentGames({ games }: { games: RecentGame[] }) {
  if (games.length === 0)
    return <p className="text-muted text-sm">No games yet — go log one!</p>

  return (
    <div className="space-y-2">
      {games.map(g => {
        const { title, detail } = formatGame(g)
        const date = new Date(g.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <div key={`${g.type}-${g.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
            <GameIcon type={g.type} className="w-6 h-6 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{title}</p>
              <p className="text-xs text-muted">{detail}</p>
            </div>
            <span className="text-xs text-muted shrink-0">{date}</span>
          </div>
        )
      })}
    </div>
  )
}
