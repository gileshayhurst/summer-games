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
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminCornholeGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminSpikeballGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  points_differential: number
  played_at: string
}

export type AdminHeartsGame = {
  id: string
  played_at: string
  game_players: { player_id: string; lost: boolean }[]
}

export type AdminPoolGame = {
  id: string
  winner_ids: string[]
  loser_ids: string[]
  balls_differential: number
  played_at: string
}

export type Suggestion = {
  id: string
  name: string | null
  game_suggestion: string | null
  feedback: string | null
  email: string | null
  created_at: string
}

async function getData() {
  try {
    const supabase = createServerClient()
    const [
      { data: pongGamesRaw },
      { data: pongPlayers },
      { data: beerDieGamesRaw },
      { data: beerDiePlayers },
      { data: cornholeGamesRaw },
      { data: cornholePlayers },
      { data: spikeballGamesRaw },
      { data: spikeballPlayers },
      { data: heartsGamesRaw },
      { data: heartsPlayers },
      { data: poolGamesRaw },
      { data: poolPlayers },
      { data: users },
      { data: suggestionsRaw },
    ] = await Promise.all([
      supabase.from('pong_games').select('id, cups_left, played_at').order('played_at', { ascending: false }),
      supabase.from('pong_game_players').select('game_id, player_id, side'),
      supabase.from('beer_die_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('beer_die_game_players').select('game_id, player_id, side'),
      supabase.from('cornhole_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('cornhole_game_players').select('game_id, player_id, side'),
      supabase.from('spikeball_games').select('id, points_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('spikeball_game_players').select('game_id, player_id, side'),
      supabase.from('hearts_games').select('id, played_at').order('played_at', { ascending: false }),
      supabase.from('hearts_game_players').select('game_id, player_id, lost'),
      supabase.from('pool_games').select('id, balls_differential, played_at').order('played_at', { ascending: false }),
      supabase.from('pool_game_players').select('game_id, player_id, side'),
      supabase.from('users').select('id, name, created_at').order('name'),
      supabase.from('suggestions').select('id, name, game_suggestion, feedback, email, created_at').order('created_at', { ascending: false }),
    ])

    const pongGames: AdminPongGame[] = (pongGamesRaw ?? []).map((g: any) => {
      const gp = (pongPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, cups_left: g.cups_left, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const beerDieGames: AdminBeerDieGame[] = (beerDieGamesRaw ?? []).map((g: any) => {
      const gp = (beerDiePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const cornholeGames: AdminCornholeGame[] = (cornholeGamesRaw ?? []).map((g: any) => {
      const gp = (cornholePlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const spikeballGames: AdminSpikeballGame[] = (spikeballGamesRaw ?? []).map((g: any) => {
      const gp = (spikeballPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, points_differential: g.points_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    const heartsGames: AdminHeartsGame[] = (heartsGamesRaw ?? []).map((g: any) => ({
      id: g.id, played_at: g.played_at,
      game_players: (heartsPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, lost: p.lost })),
    }))

    const poolGames: AdminPoolGame[] = (poolGamesRaw ?? []).map((g: any) => {
      const gp = (poolPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, balls_differential: g.balls_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })

    return {
      pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames,
      players: (users ?? []) as User[],
      suggestions: (suggestionsRaw ?? []) as Suggestion[],
    }
  } catch {
    return { pongGames: [], beerDieGames: [], cornholeGames: [], spikeballGames: [], heartsGames: [], poolGames: [], players: [], suggestions: [] }
  }
}

export default async function AdminPage() {
  const { pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames, players, suggestions } = await getData()
  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Edit or delete logged games.</p>
      <AdminPanel
        pongGames={pongGames}
        beerDieGames={beerDieGames}
        cornholeGames={cornholeGames}
        spikeballGames={spikeballGames}
        heartsGames={heartsGames}
        poolGames={poolGames}
        players={players}
        groupPin="1111"
      />
      {suggestions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-4">
            Suggestions & Feedback
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{suggestions.length}</span>
          </h2>
          <div className="space-y-3">
            {suggestions.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-warm px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-900">{s.name ?? 'Anonymous'}</span>
                  <span className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {s.email && <p className="text-xs text-muted">{s.email}</p>}
                {s.game_suggestion && <p className="text-sm text-stone-700"><span className="font-bold">Game:</span> {s.game_suggestion}</p>}
                {s.feedback && <p className="text-sm text-stone-700"><span className="font-bold">Feedback:</span> {s.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
