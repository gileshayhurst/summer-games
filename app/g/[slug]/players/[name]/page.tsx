import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard } from '@/lib/stats'
import HeadToHead from '@/components/HeadToHead'
import { User, PongGamePlayer, BeerDieGamePlayer, HeartsGamePlayer, BeerDieSink } from '@/lib/types'
import { notFound } from 'next/navigation'
import StatCard from '@/components/StatCard'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [{ data: users }, { data: pongPlayers }, { data: beerDiePlayers }, { data: sinks }, { data: heartsPlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_game_players').select('game_id, player_id, side, beer_die_games ( id, points_differential, played_at )').eq('group_id', group.id),
    supabase.from('beer_die_sinks').select('id, game_id, player_id, type').eq('group_id', group.id),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )').eq('group_id', group.id),
  ])

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDiePlayers as unknown as BeerDieGamePlayer[], (sinks ?? []) as BeerDieSink[])
  const heartsLB = computeHeartsLeaderboard(users as User[], heartsPlayers as unknown as HeartsGamePlayer[])

  const pong = pongLB.find(e => e.player_id === player.id)
  const beerDie = beerDieLB.find(e => e.player_id === player.id)
  const hearts = heartsLB.find(e => e.player_id === player.id)

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
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="beer-die" />
            </div>
          </div>
        ) : <p className="text-muted text-sm">No beer die games yet</p>}
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
