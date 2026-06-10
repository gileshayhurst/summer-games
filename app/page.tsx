export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'
import { createServerClient } from '@/lib/supabase-server'

async function getRecentGames(): Promise<RecentGame[]> {
  try {
    const supabase = createServerClient()
    const [{ data: pongGames }, { data: beerDieGames }, { data: heartsGames }] = await Promise.all([
      supabase
        .from('pong_games')
        .select(`id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )`)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('beer_die_games')
        .select(`id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )`)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('hearts_games')
        .select(`id, played_at, hearts_game_players ( lost, users ( id, name ) )`)
        .order('played_at', { ascending: false })
        .limit(10),
    ])

    const recent: RecentGame[] = [
      ...(pongGames ?? []).map((g: any) => ({
        type: 'pong' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.pong_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pong_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        cups_left: g.cups_left,
      })),
      ...(beerDieGames ?? []).map((g: any) => ({
        type: 'beer-die' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(heartsGames ?? []).map((g: any) => ({
        type: 'hearts' as const,
        id: g.id,
        played_at: g.played_at,
        players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
        loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
      })),
    ]

    recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    return recent.slice(0, 20)
  } catch {
    return []
  }
}

export default async function HomePage() {
  const games = await getRecentGames()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-widest text-win uppercase">Summer Games</h1>
        <p className="text-slate-400 mt-2">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/pong', label: '🏓 Pong' },
          { href: '/beer-die', label: '🎲 Beer Die' },
          { href: '/hearts', label: '♥ Hearts' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="bg-card rounded-lg p-6 text-center font-bold hover:bg-slate-700 transition-colors text-lg">
            {label}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4 tracking-wide uppercase text-slate-400">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
