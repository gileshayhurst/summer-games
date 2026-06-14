export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame, User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer, CornholeGamePlayer, SpikeballGamePlayer } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard } from '@/lib/stats'
import { notFound } from 'next/navigation'

type GameLeader = { name: string; wins: number; losses: number; winRatePct: number } | null

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

async function getGameLeaders(groupId: string): Promise<Record<string, GameLeader>> {
  try {
    const supabase = createServerClient()
    const [
      { data: users },
      { data: pongPlayers },
      { data: beerDiePlayers },
      { data: beerDieSinks },
      { data: heartsPlayers },
      { data: cornholePlayers },
      { data: spikeballPlayers },
    ] = await Promise.all([
      supabase.from('users').select('id, name, created_at').eq('group_id', groupId).order('name'),
      supabase.from('pong_game_players').select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )').eq('group_id', groupId).eq('pong_games.approved', true),
      supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('beer_die_games.approved', true),
      supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', groupId),
      supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games!inner ( id, played_at )').eq('group_id', groupId).eq('hearts_games.approved', true),
      supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('cornhole_games.approved', true),
      supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('spikeball_games.approved', true),
    ])

    const u = (users ?? []) as User[]

    const pongTop = computePongLeaderboard(u, (pongPlayers ?? []) as unknown as PongGamePlayer[])[0]
    const beerDieTop = computeBeerDieLeaderboard(u, (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[], (beerDieSinks ?? []) as BeerDieSink[])[0]
    const heartsTop = computeHeartsLeaderboard(u, (heartsPlayers ?? []) as unknown as HeartsGamePlayer[])[0]
    const cornholeTop = computeCornholeLeaderboard(u, (cornholePlayers ?? []) as unknown as CornholeGamePlayer[])[0]
    const spikeballTop = computeSpikeballLeaderboard(u, (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[])[0]

    const toLeader = (entry: any, isHearts = false): GameLeader => {
      if (!entry) return null
      if (isHearts) {
        const wins = entry.games_played - entry.losses
        return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100) }
      }
      return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100) }
    }

    return {
      pong: toLeader(pongTop),
      'beer-die': toLeader(beerDieTop),
      hearts: toLeader(heartsTop, true),
      cornhole: toLeader(cornholeTop),
      spikeball: toLeader(spikeballTop),
    }
  } catch { return {} }
}

const GAME_CARDS = [
  { key: 'pong', slug: 'pong', icon: '🏓', name: 'Pong' },
  { key: 'beer-die', slug: 'beer-die', icon: '🎲', name: 'Beer Die' },
  { key: 'hearts', slug: 'hearts', icon: '♥', name: 'Hearts' },
  { key: 'cornhole', slug: 'cornhole', icon: '🌽', name: 'Cornhole' },
  { key: 'spikeball', slug: 'spikeball', icon: '🏐', name: 'Spikeball' },
]

export default async function GroupHomePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const [games, leaders] = await Promise.all([
    getRecentGames(group.id),
    getGameLeaders(group.id),
  ])

  const base = `/g/${params.slug}`

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{group.name}</h1>
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
        <RecentGames games={games} />
      </div>
    </div>
  )
}
