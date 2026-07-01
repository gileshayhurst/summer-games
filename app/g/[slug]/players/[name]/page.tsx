import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import { formatStreak } from '@/lib/dashboard'
import HeadToHead from '@/components/HeadToHead'
import StatCard from '@/components/StatCard'
import {
  User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: users }, { data: pongPlayers }, { data: beerDiePlayers }, { data: sinks }, { data: heartsPlayers },
    { data: cornholePlayers }, { data: spikeballPlayers }, { data: poolPlayers }, { data: pokerPlayers },
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

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDiePlayers as unknown as BeerDieGamePlayer[], (sinks ?? []) as BeerDieSink[])
  const heartsLB = computeHeartsLeaderboard(users as User[], heartsPlayers as unknown as HeartsGamePlayer[])
  const cornholeLB = computeCornholeLeaderboard(users as User[], cornholePlayers as unknown as CornholeGamePlayer[])
  const spikeballLB = computeSpikeballLeaderboard(users as User[], spikeballPlayers as unknown as SpikeballGamePlayer[])
  const poolLB = computePoolLeaderboard(users as User[], poolPlayers as unknown as PoolGamePlayer[])
  const pokerLB = computePokerLeaderboard(users as User[], pokerPlayers as unknown as PokerGamePlayer[])

  const pong = pongLB.find(e => e.player_id === player.id)
  const beerDie = beerDieLB.find(e => e.player_id === player.id)
  const hearts = heartsLB.find(e => e.player_id === player.id)
  const cornhole = cornholeLB.find(e => e.player_id === player.id)
  const spikeball = spikeballLB.find(e => e.player_id === player.id)
  const pool = poolLB.find(e => e.player_id === player.id)
  const poker = pokerLB.find(e => e.player_id === player.id)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight">{name}</h1>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🏓 Pong</h2>
        {pong ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(pong.wins)} />
              <StatCard label="Losses" value={String(pong.losses)} />
              <StatCard label="Win%" value={`${(pong.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Cup Diff" value={pong.cup_differential > 0 ? `+${pong.cup_differential}` : String(pong.cup_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pong" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No pong games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🎲 Beer Die</h2>
        {beerDie ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(beerDie.wins)} />
              <StatCard label="Losses" value={String(beerDie.losses)} />
              <StatCard label="Win%" value={`${(beerDie.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={beerDie.point_differential > 0 ? `+${beerDie.point_differential}` : String(beerDie.point_differential)} />
              <StatCard label="Sinks" value={String(beerDie.sinks)} />
              <StatCard label="Self Sinks" value={String(beerDie.self_sinks)} />
              <StatCard label="Streak" value={formatStreak(beerDie.current_streak)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="beer-die" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No beer die games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🌽 Cornhole</h2>
        {cornhole ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(cornhole.wins)} />
              <StatCard label="Losses" value={String(cornhole.losses)} />
              <StatCard label="Win%" value={`${(cornhole.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={cornhole.point_differential > 0 ? `+${cornhole.point_differential}` : String(cornhole.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="cornhole" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No cornhole games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🏐 Spikeball</h2>
        {spikeball ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(spikeball.wins)} />
              <StatCard label="Losses" value={String(spikeball.losses)} />
              <StatCard label="Win%" value={`${(spikeball.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Pt Diff" value={spikeball.point_differential > 0 ? `+${spikeball.point_differential}` : String(spikeball.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="spikeball" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No spikeball games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">🎱 Pool</h2>
        {pool ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Wins" value={String(pool.wins)} />
              <StatCard label="Losses" value={String(pool.losses)} />
              <StatCard label="Win%" value={`${(pool.win_rate * 100).toFixed(1)}%`} />
              <StatCard label="Ball Diff" value={pool.balls_differential > 0 ? `+${pool.balls_differential}` : String(pool.balls_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pool" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No pool games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">♠ Poker</h2>
        {poker ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <StatCard label="Games" value={String(poker.games_played)} />
            <StatCard label="Win%" value={`${(poker.win_rate * 100).toFixed(1)}%`} />
            <StatCard label="Profit" value={`${poker.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(poker.total_profit_cents) / 100).toFixed(2)}`} />
          </div>
        ) : <p className="text-muted text-sm">No poker games yet</p>}
      </section>
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">♥ Hearts</h2>
        {hearts ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <StatCard label="Games" value={String(hearts.games_played)} />
            <StatCard label="Losses" value={String(hearts.losses)} />
            <StatCard label="Loss%" value={`${(hearts.loss_rate * 100).toFixed(1)}%`} />
          </div>
        ) : <p className="text-muted text-sm">No hearts games yet</p>}
      </section>
    </div>
  )
}
