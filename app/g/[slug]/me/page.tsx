export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import { getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult, formatPokerResult, ActivityItem } from '@/lib/dashboard'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import StatCard from '@/components/StatCard'
import GameIcon from '@/components/icons/GameIcon'

function GameCard({
  gameType, name, rank, children,
}: {
  gameType: string
  name: string
  rank: { rank: number; total: number } | null
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-warm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameIcon type={gameType} className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest text-stone-900">{name}</span>
        </div>
        {rank && <span className="text-[10px] font-black text-muted">#{rank.rank} of {rank.total}</span>}
      </div>
      {children}
    </div>
  )
}

export default async function MyDashboardPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireMembership(params.slug)

  if (!member) {
    return (
      <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-stone-900">Sign in and join to see your dashboard.</p>
        <a
          href={`/join/${group.join_code}`}
          className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
        >
          Join →
        </a>
      </div>
    )
  }

  if (!member.player_id) {
    return (
      <div className="bg-amber-50 border border-warm rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-stone-900">You haven&apos;t claimed a player yet.</p>
        <a
          href={`/g/${params.slug}/claim`}
          className="bg-win text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-wide hover:bg-orange-400 transition-colors"
        >
          Claim →
        </a>
      </div>
    )
  }

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
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
    supabase.from('cornhole_game_players').select('game_id, player_id, side, cornhole_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('spikeball_game_players').select('game_id, player_id, side, spikeball_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('pool_game_players').select('game_id, player_id, side, pool_games ( id, balls_differential, played_at )').eq('group_id', group.id),
    supabase.from('poker_game_players').select('game_id, player_id, amount_cents, poker_games ( id, played_at )').eq('group_id', group.id),
  ])

  const u = (users ?? []) as User[]
  const playerId = member.player_id
  const playerName = u.find(x => x.id === playerId)?.name ?? 'You'

  const pong = (pongPlayers ?? []) as unknown as PongGamePlayer[]
  const beerDie = (beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[]
  const sinks = (beerDieSinks ?? []) as BeerDieSink[]
  const hearts = (heartsPlayers ?? []) as unknown as HeartsGamePlayer[]
  const cornhole = (cornholePlayers ?? []) as unknown as CornholeGamePlayer[]
  const spikeball = (spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[]
  const pool = (poolPlayers ?? []) as unknown as PoolGamePlayer[]
  const poker = (pokerPlayers ?? []) as unknown as PokerGamePlayer[]

  const pongLB = computePongLeaderboard(u, pong)
  const beerDieLB = computeBeerDieLeaderboard(u, beerDie, sinks)
  const heartsLB = computeHeartsLeaderboard(u, hearts)
  const cornholeLB = computeCornholeLeaderboard(u, cornhole)
  const spikeballLB = computeSpikeballLeaderboard(u, spikeball)
  const poolLB = computePoolLeaderboard(u, pool)
  const pokerLB = computePokerLeaderboard(u, poker)

  const pongEntry = pongLB.find(e => e.player_id === playerId)
  const beerDieEntry = beerDieLB.find(e => e.player_id === playerId)
  const heartsEntry = heartsLB.find(e => e.player_id === playerId)
  const cornholeEntry = cornholeLB.find(e => e.player_id === playerId)
  const spikeballEntry = spikeballLB.find(e => e.player_id === playerId)
  const poolEntry = poolLB.find(e => e.player_id === playerId)
  const pokerEntry = pokerLB.find(e => e.player_id === playerId)

  const activity = mergeRecentActivity([
    ...pong.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pong',
      id: gp.game_id,
      played_at: gp.pong_games.played_at,
      result: formatSideResult(gp.side, `${gp.pong_games.cups_left} cup${gp.pong_games.cups_left !== 1 ? 's' : ''} left`),
    })),
    ...beerDie.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'beer-die',
      id: gp.game_id,
      played_at: gp.beer_die_games.played_at,
      result: formatSideResult(gp.side, `${gp.beer_die_games.points_differential} pt${gp.beer_die_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...cornhole.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'cornhole',
      id: gp.game_id,
      played_at: gp.cornhole_games.played_at,
      result: formatSideResult(gp.side, `${gp.cornhole_games.points_differential} pt${gp.cornhole_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...spikeball.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'spikeball',
      id: gp.game_id,
      played_at: gp.spikeball_games.played_at,
      result: formatSideResult(gp.side, `${gp.spikeball_games.points_differential} pt${gp.spikeball_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...pool.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pool',
      id: gp.game_id,
      played_at: gp.pool_games.played_at,
      result: formatSideResult(gp.side, `${gp.pool_games.balls_differential} ball${gp.pool_games.balls_differential !== 1 ? 's' : ''}`),
    })),
    ...hearts.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'hearts',
      id: gp.game_id,
      played_at: gp.hearts_games.played_at,
      result: formatHeartsResult(gp.lost),
    })),
    ...poker.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'poker',
      id: gp.game_id,
      played_at: gp.poker_games.played_at,
      result: formatPokerResult(gp.amount_cents),
    })),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
        <p className="text-muted text-sm">Signed in as {playerName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GameCard gameType="pong" name="Pong" rank={getLeaderboardRank(pongLB, playerId)}>
          {pongEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(pongEntry.wins)} />
              <StatCard label="Losses" value={String(pongEntry.losses)} />
              <StatCard label="Win%" value={`${(pongEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Cup Diff" value={pongEntry.cup_differential > 0 ? `+${pongEntry.cup_differential}` : String(pongEntry.cup_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="beer-die" name="Beer Die" rank={getLeaderboardRank(beerDieLB, playerId)}>
          {beerDieEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(beerDieEntry.wins)} />
              <StatCard label="Losses" value={String(beerDieEntry.losses)} />
              <StatCard label="Win%" value={`${(beerDieEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={beerDieEntry.point_differential > 0 ? `+${beerDieEntry.point_differential}` : String(beerDieEntry.point_differential)} />
              <StatCard label="Sinks" value={String(beerDieEntry.sinks)} />
              <StatCard label="Self Sinks" value={String(beerDieEntry.self_sinks)} />
              <StatCard label="Streak" value={beerDieEntry.win_streak >= 3 ? `🔥${beerDieEntry.win_streak}` : String(beerDieEntry.win_streak)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="cornhole" name="Cornhole" rank={getLeaderboardRank(cornholeLB, playerId)}>
          {cornholeEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(cornholeEntry.wins)} />
              <StatCard label="Losses" value={String(cornholeEntry.losses)} />
              <StatCard label="Win%" value={`${(cornholeEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={cornholeEntry.point_differential > 0 ? `+${cornholeEntry.point_differential}` : String(cornholeEntry.point_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="spikeball" name="Spikeball" rank={getLeaderboardRank(spikeballLB, playerId)}>
          {spikeballEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(spikeballEntry.wins)} />
              <StatCard label="Losses" value={String(spikeballEntry.losses)} />
              <StatCard label="Win%" value={`${(spikeballEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={spikeballEntry.point_differential > 0 ? `+${spikeballEntry.point_differential}` : String(spikeballEntry.point_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="pool" name="Pool" rank={getLeaderboardRank(poolLB, playerId)}>
          {poolEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Wins" value={String(poolEntry.wins)} />
              <StatCard label="Losses" value={String(poolEntry.losses)} />
              <StatCard label="Win%" value={`${(poolEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Ball Diff" value={poolEntry.balls_differential > 0 ? `+${poolEntry.balls_differential}` : String(poolEntry.balls_differential)} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="poker" name="Poker" rank={getLeaderboardRank(pokerLB, playerId)}>
          {pokerEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Games" value={String(pokerEntry.games_played)} />
              <StatCard label="Win%" value={`${(pokerEntry.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Profit" value={`${pokerEntry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(pokerEntry.total_profit_cents) / 100).toFixed(2)}`} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>

        <GameCard gameType="hearts" name="Hearts" rank={getLeaderboardRank(heartsLB, playerId)}>
          {heartsEntry ? (
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Games" value={String(heartsEntry.games_played)} />
              <StatCard label="Losses" value={String(heartsEntry.losses)} />
              <StatCard label="Loss%" value={`${(heartsEntry.loss_rate * 100).toFixed(1)}%`} />
            </div>
          ) : <p className="text-muted text-sm">No games yet</p>}
        </GameCard>
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-muted text-sm">No games yet — go log one!</p>
        ) : (
          <div className="space-y-2">
            {activity.map(a => (
              <div key={`${a.type}-${a.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
                <GameIcon type={a.type} className="w-6 h-6 shrink-0" />
                <p className="flex-1 text-sm font-bold text-stone-900">{a.result}</p>
                <span className="text-xs text-muted shrink-0">
                  {new Date(a.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/g/${params.slug}/players/${encodeURIComponent(playerName)}`}
        className="inline-block text-sm font-bold text-win hover:text-orange-400"
      >
        View full public profile →
      </Link>
    </div>
  )
}
