import { createServerClient } from '@/lib/supabase-server'
import { computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard } from '@/lib/stats'
import HeadToHead from '@/components/HeadToHead'
import { User, PongGamePlayer, BeerDieGame, HeartsGamePlayer } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function PlayerPage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  const supabase = createServerClient()

  const [{ data: users }, { data: pongPlayers }, { data: beerDieGames }, { data: heartsPlayers }] = await Promise.all([
    supabase.from('users').select('id, name, created_at').order('name'),
    supabase.from('pong_game_players').select('game_id, player_id, side, pong_games ( id, cups_left, played_at )'),
    supabase.from('beer_die_games').select('*'),
    supabase.from('hearts_game_players').select('game_id, player_id, lost, hearts_games ( id, played_at )'),
  ])

  const player = (users ?? []).find((u: User) => u.name === name)
  if (!player) notFound()

  const pongLB = computePongLeaderboard(users as User[], pongPlayers as unknown as PongGamePlayer[])
  const beerDieLB = computeBeerDieLeaderboard(users as User[], beerDieGames as BeerDieGame[])
  const heartsLB = computeHeartsLeaderboard(users as User[], heartsPlayers as unknown as HeartsGamePlayer[])

  const pong = pongLB.find(e => e.player_id === player.id)
  const beerDie = beerDieLB.find(e => e.player_id === player.id)
  const hearts = heartsLB.find(e => e.player_id === player.id)

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-bg rounded p-3 text-center">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-wide">{name}</h1>

      <section>
        <h2 className="text-lg font-bold mb-4">🏓 Pong</h2>
        {pong ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Wins" value={String(pong.wins)} />
              <Stat label="Losses" value={String(pong.losses)} />
              <Stat label="Win%" value={`${(pong.win_rate * 100).toFixed(1)}%`} />
              <Stat label="Cup Diff" value={pong.cup_differential > 0 ? `+${pong.cup_differential}` : String(pong.cup_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="pong" />
            </div>
          </div>
        ) : <p className="text-slate-500">No pong games yet</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">🎲 Beer Die</h2>
        {beerDie ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Wins" value={String(beerDie.wins)} />
              <Stat label="Losses" value={String(beerDie.losses)} />
              <Stat label="Win%" value={`${(beerDie.win_rate * 100).toFixed(1)}%`} />
              <Stat label="Pt Diff" value={beerDie.point_differential > 0 ? `+${beerDie.point_differential}` : String(beerDie.point_differential)} />
            </div>
            <div className="max-w-xs">
              <HeadToHead players={(users ?? []) as User[]} currentPlayerId={player.id} game="beer-die" />
            </div>
          </div>
        ) : <p className="text-slate-500">No beer die games yet</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">♥ Hearts</h2>
        {hearts ? (
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            <Stat label="Games" value={String(hearts.games_played)} />
            <Stat label="Losses" value={String(hearts.losses)} />
            <Stat label="Loss%" value={`${(hearts.loss_rate * 100).toFixed(1)}%`} />
          </div>
        ) : <p className="text-slate-500">No hearts games yet</p>}
      </section>
    </div>
  )
}
