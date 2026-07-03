export const dynamic = 'force-dynamic'

import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import LogOutButton from '@/components/LogOutButton'
import PlayerStats from '@/components/PlayerStats'

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

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1">My Dashboard</h1>
          <p className="text-muted text-sm">Signed in as {playerName}</p>
        </div>
        <LogOutButton />
      </div>

      <PlayerStats
        playerId={playerId}
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
