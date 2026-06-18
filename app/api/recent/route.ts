import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { RecentGame } from '@/lib/types'

export async function GET() {
  try {
    const supabase = createServerClient()

    const [
      { data: pongGames },
      { data: beerDieGames },
      { data: heartsGames },
      { data: poolGames },
    ] = await Promise.all([
      supabase
        .from('pong_games')
        .select(`id, cups_left, played_at, pong_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('beer_die_games')
        .select(`id, points_differential, played_at, beer_die_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('hearts_games')
        .select(`id, played_at, hearts_game_players ( lost, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
      supabase
        .from('pool_games')
        .select(`id, balls_differential, played_at, pool_game_players ( side, users ( id, name ) )`)
        .eq('approved', true)
        .order('played_at', { ascending: false })
        .limit(10),
    ])

    const recent: RecentGame[] = [
      ...(pongGames ?? []).map((g: any) => ({
        type: 'pong' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.pong_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pong_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        cups_left: g.cups_left,
      })),
      ...(beerDieGames ?? []).map((g: any) => ({
        type: 'beer-die' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.beer_die_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.beer_die_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        points_differential: g.points_differential,
      })),
      ...(heartsGames ?? []).map((g: any) => ({
        type: 'hearts' as const,
        id: g.id,
        played_at: g.played_at,
        players: (g.hearts_game_players ?? []).map((p: any) => p.users?.name ?? 'Unknown'),
        loser: (g.hearts_game_players ?? []).find((p: any) => p.lost)?.users?.name ?? '',
      })),
      ...(poolGames ?? []).map((g: any) => ({
        type: 'pool' as const,
        id: g.id,
        played_at: g.played_at,
        winners: (g.pool_game_players ?? [])
          .filter((p: any) => p.side === 'winner')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        losers: (g.pool_game_players ?? [])
          .filter((p: any) => p.side === 'loser')
          .map((p: any) => p.users?.name ?? 'Unknown'),
        balls_differential: g.balls_differential,
      })),
    ]

    recent.sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

    return NextResponse.json({ games: recent.slice(0, 20) })
  } catch (err) {
    console.error('Recent games error:', err)
    return NextResponse.json({ games: [] })
  }
}
