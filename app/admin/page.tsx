export const dynamic = 'force-dynamic'

import { createServerClient } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import { User } from '@/lib/types'

export type AdminPongGame = {
  id: string
  cups_left: number
  played_at: string
  winner_ids: string[]
  loser_ids: string[]
}

export type AdminBeerDieGame = {
  id: string
  winner1_id: string
  winner2_id: string
  loser1_id: string
  loser2_id: string
  points_differential: number
  played_at: string
}

export type AdminHeartsGame = {
  id: string
  played_at: string
  game_players: { player_id: string; lost: boolean }[]
}

async function getData() {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGamesRaw },
      { data: pongPlayers },
      { data: beerDieGames },
      { data: heartsGamesRaw },
      { data: heartsPlayers },
      { data: users },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at').order('played_at', { ascending: false }),
      supabase.from('pong_game_players').select('game_id, player_id, side'),
      supabase.from('beer_die_games').select('id, winner1_id, winner2_id, loser1_id, loser2_id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_games').select('id, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_game_players').select('game_id, player_id, lost'),
      supabase.from('users').select('id, name, created_at').order('name'),
    ])

    const pongGames: AdminPongGame[] = (pongGamesRaw ?? []).map((g: any) => {
      const gamePlayers = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return {
        id: g.id,
        cups_left: g.cups_left,
        played_at: g.played_at,
        winner_ids: gamePlayers.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id),
        loser_ids: gamePlayers.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id),
      }
    })

    const heartsGames: AdminHeartsGame[] = (heartsGamesRaw ?? []).map((g: any) => ({
      id: g.id,
      played_at: g.played_at,
      game_players: (heartsPlayers ?? [])
        .filter((p: any) => p.game_id === g.id)
        .map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

    return {
      pongGames,
      beerDieGames: (beerDieGames ?? []) as AdminBeerDieGame[],
      heartsGames,
      players: (users ?? []) as User[],
    }
  } catch {
    return { pongGames: [], beerDieGames: [], heartsGames: [], players: [] }
  }
}

export default async function AdminPage() {
  const { pongGames, beerDieGames, heartsGames, players } = await getData()
  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-1">⚙️ Admin</h1>
      <p className="text-slate-400 text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={pongGames}
        beerDieGames={beerDieGames}
        heartsGames={heartsGames}
        players={players}
      />
    </div>
  )
}
