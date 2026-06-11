export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

async function getRecentGames(groupId: string): Promise<RecentGame[]> {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGames },
      { data: beerDieGames },
      { data: cornholeGames },
      { data: spikeballGames },
      { data: heartsGames },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('beer_die_games').select('id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('cornhole_games').select('id, points_differential, played_at, cornhole_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('spikeball_games').select('id, points_differential, played_at, spikeball_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('hearts_games').select('id, played_at, hearts_game_players ( lost, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
    ])

    const recent: RecentGame[] = [
      ...(pongGames ?? []).map((g: any) => ({
        type: 'pong' as const, id: g.id, played_at: g.played_at,
        winners: (g.pong_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pong_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        cups_left: g.cups_left,
      })),
      ...(beerDieGames ?? []).map((g: any) => ({
        type: 'beer-die' as const, id: g.id, played_at: g.played_at,
        winners: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.beer_die_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(cornholeGames ?? []).map((g: any) => ({
        type: 'cornhole' as const, id: g.id, played_at: g.played_at,
        winners: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.cornhole_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(spikeballGames ?? []).map((g: any) => ({
        type: 'spikeball' as const, id: g.id, played_at: g.played_at,
        winners: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.spikeball_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(heartsGames ?? []).map((g: any) => ({
        type: 'hearts' as const, id: g.id, played_at: g.played_at,
        players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
        loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
      })),
    ]
    recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    return recent.slice(0, 20)
  } catch { return [] }
}

export default async function GroupHomePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const games = await getRecentGames(group.id)
  const base = `/g/${params.slug}`

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{group.name}</h1>
        <p className="text-muted mt-2 italic font-bold">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {[
          { href: `${base}/pong`, label: '🏓 Pong' },
          { href: `${base}/beer-die`, label: '🎲 Beer Die' },
          { href: `${base}/hearts`, label: '♥ Hearts' },
          { href: `${base}/cornhole`, label: '🌽 Cornhole' },
          { href: `${base}/spikeball`, label: '🏐 Spikeball' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="bg-card rounded-xl p-6 text-center font-black uppercase tracking-widest text-sm hover:bg-amber-50 transition-colors border border-warm">
            {label}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-xs font-black mb-4 tracking-widest uppercase text-muted">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
