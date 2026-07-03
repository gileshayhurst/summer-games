export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import PlayerStats from '@/components/PlayerStats'

export default async function GroupPlayerPage({ params }: { params: { slug: string; name: string } }) {
  const name = decodeURIComponent(params.name)
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

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
  const player = u.find(p => p.name === name)
  if (!player) notFound()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight">{player.name}</h1>

      <PlayerStats
        playerId={player.id}
        users={u}
        pongPlayers={(pongPlayers ?? []) as unknown as PongGamePlayer[]}
        beerDiePlayers={(beerDiePlayers ?? []) as unknown as BeerDieGamePlayer[]}
        beerDieSinks={(beerDieSinks ?? []) as BeerDieSink[]}
        heartsPlayers={(heartsPlayers ?? []) as unknown as HeartsGamePlayer[]}
        cornholePlayers={(cornholePlayers ?? []) as unknown as CornholeGamePlayer[]}
        spikeballPlayers={(spikeballPlayers ?? []) as unknown as SpikeballGamePlayer[]}
        poolPlayers={(poolPlayers ?? []) as unknown as PoolGamePlayer[]}
        pokerPlayers={(pokerPlayers ?? []) as unknown as PokerGamePlayer[]}
      />
    </div>
  )
}
