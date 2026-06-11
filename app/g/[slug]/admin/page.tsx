export const dynamic = 'force-dynamic'

import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { notFound } from 'next/navigation'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame } from '@/app/admin/page'
import { User } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const [
    { data: pongGamesRaw },
    { data: pendingPongRaw },
    { data: pongPlayers },
    { data: beerDieGamesRaw },
    { data: pendingBeerDieRaw },
    { data: beerDiePlayers },
    { data: cornholeGamesRaw },
    { data: pendingCornholeRaw },
    { data: cornholePlayers },
    { data: spikeballGamesRaw },
    { data: pendingSpikeballRaw },
    { data: spikeballPlayers },
    { data: heartsGamesRaw },
    { data: pendingHeartsRaw },
    { data: heartsPlayers },
    { data: users },
  ] = await Promise.all([
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('pong_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('beer_die_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('cornhole_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('spikeball_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', true).order('played_at', { ascending: false }),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).eq('approved', false).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
  ])

  const assemblePong = (raw: any[]): AdminPongGame[] =>
    raw.map((g: any) => {
      const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, cups_left: g.cups_left, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleBeerDie = (raw: any[]): AdminBeerDieGame[] =>
    raw.map((g: any) => {
      const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleCornhole = (raw: any[]): AdminCornholeGame[] =>
    raw.map((g: any) => {
      const gp = (cornholePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleSpikeball = (raw: any[]): AdminSpikeballGame[] =>
    raw.map((g: any) => {
      const gp = (spikeballPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

  const assembleHearts = (raw: any[]): AdminHeartsGame[] =>
    raw.map((g: any) => ({
      id: g.id, played_at: g.played_at,
      game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        cornholeGames={assembleCornhole(cornholeGamesRaw ?? [])}
        spikeballGames={assembleSpikeball(spikeballGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        pendingPongGames={assemblePong(pendingPongRaw ?? [])}
        pendingBeerDieGames={assembleBeerDie(pendingBeerDieRaw ?? [])}
        pendingCornholeGames={assembleCornhole(pendingCornholeRaw ?? [])}
        pendingSpikeballGames={assembleSpikeball(pendingSpikeballRaw ?? [])}
        pendingHeartsGames={assembleHearts(pendingHeartsRaw ?? [])}
        players={(users ?? []) as User[]}
        groupPin={group.pin}
      />
    </div>
  )
}
