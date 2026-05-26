import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { RecentGame } from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()

  const [{ data: pongGames }, { data: beerDieGames }, { data: heartsGames }] = await Promise.all([
    supabase
      .from('pong_games')
      .select(`id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )`)
      .order('played_at', { ascending: false })
      .limit(10),
    supabase
      .from('beer_die_games')
      .select('*')
      .order('played_at', { ascending: false })
      .limit(10),
    supabase
      .from('hearts_games')
      .select(`id, played_at, hearts_game_players ( lost, users ( id, name ) )`)
      .order('played_at', { ascending: false })
      .limit(10),
  ])

  // Resolve beer die player names via a batch lookup
  const allBeerDieIds = (beerDieGames ?? []).flatMap((g: any) => [
    g.winner1_id, g.winner2_id, g.loser1_id, g.loser2_id,
  ])
  const { data: bdUsers } = allBeerDieIds.length
    ? await supabase.from('users').select('id, name').in('id', Array.from(new Set(allBeerDieIds)))
    : { data: [] }
  const nameMap = new Map((bdUsers ?? []).map((u: any) => [u.id, u.name as string]))

  const recent: RecentGame[] = [
    ...(pongGames ?? []).map((g: any) => ({
      type: 'pong' as const,
      id: g.id,
      played_at: g.played_at,
      winners: g.pong_game_players
        .filter((p: any) => p.side === 'winner')
        .map((p: any) => p.users.name as string),
      losers: g.pong_game_players
        .filter((p: any) => p.side === 'loser')
        .map((p: any) => p.users.name as string),
      cups_left: g.cups_left,
    })),
    ...(beerDieGames ?? []).map((g: any) => ({
      type: 'beer-die' as const,
      id: g.id,
      played_at: g.played_at,
      winner1: nameMap.get(g.winner1_id) ?? '',
      winner2: nameMap.get(g.winner2_id) ?? '',
      loser1: nameMap.get(g.loser1_id) ?? '',
      loser2: nameMap.get(g.loser2_id) ?? '',
      points_differential: g.points_differential,
    })),
    ...(heartsGames ?? []).map((g: any) => ({
      type: 'hearts' as const,
      id: g.id,
      played_at: g.played_at,
      players: g.hearts_game_players.map((p: any) => p.users.name as string),
      loser: g.hearts_game_players.find((p: any) => p.lost)?.users?.name ?? '',
    })),
  ]

  recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  return NextResponse.json({ games: recent.slice(0, 20) })
}
