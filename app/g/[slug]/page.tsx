export const dynamic = 'force-dynamic'

import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame, User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer, CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer } from '@/lib/types'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard, computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard, topStreaks } from '@/lib/stats'
import { notFound } from 'next/navigation'
import { requireMembership } from '@/lib/auth'
import InstallPrompt from '@/components/InstallPrompt'

type GameLeader = {
  name: string
  wins: number
  losses: number
  winRatePct: number
  statLine?: string
  hotStreaks: { name: string; streak: number }[]
} | null

async function getRecentGames(groupId: string): Promise<RecentGame[]> {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGames },
      { data: beerDieGames },
      { data: cornholeGames },
      { data: spikeballGames },
      { data: heartsGames },
      { data: poolGames },
      { data: pokerGames },
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
      supabase.from('pool_games').select('id, balls_differential, played_at, pool_game_players ( side, users ( id, name ) )')
        .eq('group_id', groupId).eq('approved', true).order('played_at', { ascending: false }).limit(10),
      supabase.from('poker_games').select('id, played_at, poker_game_players ( player_id, amount_cents, users ( id, name ) )')
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
      ...(poolGames ?? []).map((g: any) => ({
        type: 'pool' as const, id: g.id, played_at: g.played_at,
        winners: (g.pool_game_players ?? []).filter((p: any) => p.side === 'winner').map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pool_game_players ?? []).filter((p: any) => p.side === 'loser').map((p: any) => p.users?.name ?? 'Unknown'),
        balls_differential: g.balls_differential,
      })),
      ...(pokerGames ?? []).map((g: any) => ({
        type: 'poker' as const, id: g.id, played_at: g.played_at,
        results: (g.poker_game_players ?? []).map((p: any) => ({
          name: p.users?.name ?? 'Unknown',
          amount_cents: p.amount_cents,
        })),
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
      { data: poolPlayers },
      { data: pokerPlayers },
    ] = await Promise.all([
      supabase.from('users').select('id, name, created_at').eq('group_id', groupId).order('name'),
      supabase.from('pong_game_players').select('game_id, player_id, side, pong_games!inner ( id, cups_left, played_at )').eq('group_id', groupId).eq('pong_games.approved', true),
      supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('beer_die_games.approved', true),
      supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', groupId),
      supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games!inner ( id, played_at )').eq('group_id', groupId).eq('hearts_games.approved', true),
      supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('cornhole_games.approved', true),
      supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games!inner ( id, points_differential, played_at )').eq('group_id', groupId).eq('spikeball_games.approved', true),
      supabase.from('pool_game_players').select('game_id, player_id, side, pool_games!inner ( id, balls_differential, played_at )').eq('group_id', groupId).eq('pool_games.approved', true),
      supabase.from('poker_game_players').select('game_id, player_id, amount_cents, poker_games!inner ( id, played_at )').eq('group_id', groupId).eq('poker_games.approved', true),
    ])

    const u = (users ?? []) as User[]

    const pongLB       = computePongLeaderboard(u, (pongPlayers ?? []) as unknown as PongGamePlayer[])
    const beerDieLB    = computeBeerDieLeaderboard(u, (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[], (beerDieSinks ?? []) as BeerDieSink[])
    const heartsLB     = computeHeartsLeaderboard(u, (heartsPlayers ?? []) as unknown as HeartsGamePlayer[])
    const cornholeLB   = computeCornholeLeaderboard(u, (cornholePlayers ?? []) as unknown as CornholeGamePlayer[])
    const spikeballLB  = computeSpikeballLeaderboard(u, (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[])
    const poolLB       = computePoolLeaderboard(u, (poolPlayers ?? []) as unknown as PoolGamePlayer[])
    const pokerLB      = computePokerLeaderboard(u, (pokerPlayers ?? []) as unknown as PokerGamePlayer[])

    const byWins             = (e: { wins: number }) => e.wins
    const byWinSessions      = (e: { win_sessions: number }) => e.win_sessions
    const byGamesMinusLosses = (e: { games_played: number; losses: number }) => e.games_played - e.losses

    const toLeader = (entry: any, hs: { name: string; streak: number }[], isHearts = false): GameLeader => {
      if (!entry) return null
      if (isHearts) {
        const wins = entry.games_played - entry.losses
        return { name: entry.name, wins, losses: entry.losses, winRatePct: Math.round((1 - entry.loss_rate) * 100), hotStreaks: hs }
      }
      return { name: entry.name, wins: entry.wins, losses: entry.losses, winRatePct: Math.round(entry.win_rate * 100), hotStreaks: hs }
    }

    const pokerTop = pokerLB[0]

    return {
      pong:       toLeader(pongLB[0],      topStreaks(pongLB,      byWins)),
      'beer-die': toLeader(beerDieLB[0],   topStreaks(beerDieLB,   byWins)),
      hearts:     toLeader(heartsLB[0],    topStreaks(heartsLB,    byGamesMinusLosses), true),
      cornhole:   toLeader(cornholeLB[0],  topStreaks(cornholeLB,  byWins)),
      spikeball:  toLeader(spikeballLB[0], topStreaks(spikeballLB, byWins)),
      pool:       toLeader(poolLB[0],      topStreaks(poolLB,      byWins)),
      poker: (() => {
        if (!pokerTop) return null
        const abs = Math.abs(pokerTop.total_profit_cents)
        const dollars = (abs / 100).toFixed(2)
        const sign = pokerTop.total_profit_cents >= 0 ? '+' : '-'
        return {
          name: pokerTop.name,
          wins: pokerTop.win_sessions,
          losses: pokerTop.games_played - pokerTop.win_sessions,
          winRatePct: Math.round(pokerTop.win_rate * 100),
          statLine: `${sign}$${dollars} · ${pokerTop.games_played} games`,
          hotStreaks: topStreaks(pokerLB, byWinSessions),
        }
      })(),
    }
  } catch { return {} }
}

const GAME_CARDS = [
  { key: 'pong', slug: 'pong', icon: '🏓', name: 'Pong' },
  { key: 'beer-die', slug: 'beer-die', icon: '🎲', name: 'Beer Die' },
  { key: 'hearts', slug: 'hearts', icon: '♥', name: 'Hearts' },
  { key: 'cornhole', slug: 'cornhole', icon: '🌽', name: 'Cornhole' },
  { key: 'spikeball', slug: 'spikeball', icon: '🏐', name: 'Spikeball' },
  { key: 'pool', slug: 'pool', icon: '🎱', name: 'Pool' },
  { key: 'poker', slug: 'poker', icon: '♠', name: 'Poker' },
]

export default async function GroupHomePage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const { member, isPublic } = await requireMembership(params.slug)

  const [games, leaders] = await Promise.all([
    getRecentGames(group.id),
    getGameLeaders(group.id),
  ])

  const base = `/g/${params.slug}`

  return (
    <div className="space-y-10">
      <InstallPrompt />
      {!member && isPublic && (
        <div className="bg-amber-50 border border-warm rounded-xl p-4 mb-6">
          <p className="text-sm font-bold text-stone-900">Join this group with an invite link from a member.</p>
        </div>
      )}
      {member && !member.player_id && (
        <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-stone-900">You haven&apos;t claimed a player yet.</p>
          <a
            href={`/g/${params.slug}/claim`}
            className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
          >
            Claim →
          </a>
        </div>
      )}
      <div>
        <h1 className="text-4xl font-black tracking-tight text-stone-900 uppercase">{group.name}</h1>
        <p className="text-muted mt-2 italic font-bold">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {GAME_CARDS.map(({ key, slug, icon, name }) => {
          const leader = leaders[key] ?? null
          return (
            <Link
              key={key}
              href={`${base}/${slug}`}
              className="bg-card rounded-xl p-4 border border-warm hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xl">{icon}</div>
                {leader && leader.hotStreaks.length > 0 && (
                  <div className="flex flex-col items-end gap-0.5">
                    {leader.hotStreaks.map(({ name: n, streak }) => (
                      <div key={`${n}-${streak}`} className="text-[10px] font-bold text-amber-600 leading-tight whitespace-nowrap">
                        🔥{streak} {n}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-2">{name}</div>
              <div className="text-sm font-black text-stone-900 truncate">{leader?.name ?? '—'}</div>
              <div className={`text-[10px] font-bold ${leader ? 'text-muted' : 'text-stone-300'}`}>
                {leader ? (leader.statLine ?? `${leader.wins}W · ${leader.losses}L · ${leader.winRatePct}%`) : 'No games yet'}
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
