export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { requireMembership } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import AdminPanel from '@/components/admin/AdminPanel'
import SuggestionsList from '@/components/admin/SuggestionsList'
import AdminRequestsList from '@/components/admin/AdminRequestsList'
import RequestAdminStatus from '@/components/admin/RequestAdminStatus'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame, AdminPokerGame } from '@/app/admin/page'
import { User, MemberWithProfile } from '@/lib/types'

export default async function GroupAdminPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireMembership(params.slug)

  if (!member) notFound()

  if (member.role === 'member') {
    return (
      <RequestAdminStatus
        groupId={group.id}
        slug={params.slug}
        initialPending={!!member.admin_requested_at}
      />
    )
  }

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
    { data: pokerGamesRaw },
    { data: pokerPlayers },
    { data: users },
    { data: suggestionsRaw },
    { data: membersRaw },
  ] = await Promise.all([
    supabase.from('pong_games').select('id, cups_left, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('pong_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('beer_die_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('beer_die_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('cornhole_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('cornhole_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('spikeball_games').select('id, points_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('spikeball_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('hearts_games').select('id, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('hearts_game_players').select('game_id, player_id, lost').eq('group_id', group.id),
    supabase.from('pool_games').select('id, balls_differential, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('pool_game_players').select('game_id, player_id, side').eq('group_id', group.id),
    supabase.from('poker_games').select('id, played_at').eq('group_id', group.id).order('played_at', { ascending: false }),
    supabase.from('poker_game_players').select('game_id, player_id, amount_cents').eq('group_id', group.id),
    supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name'),
    params.slug === 'summer-games'
      ? supabase.from('suggestions').select('id, name, email, game_suggestion, feedback, created_at').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('group_members').select('*, profiles(display_name, avatar_url), users(name)').eq('group_id', group.id).order('joined_at'),
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
  const assemblePool = (raw: any[]): AdminPoolGame[] =>
    raw.map((g: any) => {
      const gp = (poolPlayers ?? []).filter((p: any) => p.game_id === g.id)
      return { id: g.id, balls_differential: g.balls_differential, played_at: g.played_at, winner_ids: gp.filter((p: any) => p.side === 'winner').map((p: any) => p.player_id), loser_ids: gp.filter((p: any) => p.side === 'loser').map((p: any) => p.player_id) }
    })
  const assemblePoker = (raw: any[]): AdminPokerGame[] =>
    raw.map((g: any) => ({
      id: g.id, played_at: g.played_at,
      player_amounts: (pokerPlayers ?? []).filter((p: any) => p.game_id === g.id).map((p: any) => ({ player_id: p.player_id, amount_cents: p.amount_cents })),
    }))

  const suggestions = (suggestionsRaw ?? []) as { id: string; name: string | null; email: string | null; game_suggestion: string | null; feedback: string | null; created_at: string }[]
  const members = (membersRaw ?? []) as MemberWithProfile[]
  const pendingRequests = member.role === 'owner' ? members.filter(m => m.admin_requested_at) : []

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-1">⚙️ Admin</h1>
      <p className="text-muted text-sm mb-8">Manage your group.</p>
      <AdminRequestsList initial={pendingRequests} groupId={group.id} />
      <SuggestionsList initial={suggestions} />
      <AdminPanel
        pongGames={assemblePong(pongGamesRaw ?? [])}
        beerDieGames={assembleBeerDie(beerDieGamesRaw ?? [])}
        cornholeGames={assembleCornhole(cornholeGamesRaw ?? [])}
        spikeballGames={assembleSpikeball(spikeballGamesRaw ?? [])}
        heartsGames={assembleHearts(heartsGamesRaw ?? [])}
        poolGames={assemblePool(poolGamesRaw ?? [])}
        pokerGames={assemblePoker(pokerGamesRaw ?? [])}
        players={(users ?? []) as User[]}
        members={members}
        groupId={group.id}
        groupSlug={group.slug}
        visibility={group.visibility}
        joinCode={group.join_code}
        currentUserRole={member.role}
      />
    </div>
  )
}
