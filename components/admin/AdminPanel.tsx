'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame, AdminPoolGame, AdminPokerGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditCornholeGame from './EditCornholeGame'
import EditSpikeballGame from './EditSpikeballGame'
import EditHeartsGame from './EditHeartsGame'
import EditPoolGame from './EditPoolGame'
import EditPokerGame from './EditPokerGame'
import MembersTab from './MembersTab'
import GroupSettingsTab from './GroupSettingsTab'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'cornhole'; played_at: string; data: AdminCornholeGame }
  | { kind: 'spikeball'; played_at: string; data: AdminSpikeballGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }
  | { kind: 'pool'; played_at: string; data: AdminPoolGame }
  | { kind: 'poker'; played_at: string; data: AdminPokerGame }

type MemberRow = {
  id: string
  user_id: string
  role: string
  player_id: string | null
  profiles: { display_name: string } | null
  users: { name: string } | null
}

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  cornholeGames: AdminCornholeGame[]
  spikeballGames: AdminSpikeballGame[]
  heartsGames: AdminHeartsGame[]
  poolGames: AdminPoolGame[]
  pokerGames: AdminPokerGame[]
  players: User[]
  members?: MemberRow[]
  groupId?: string
  groupSlug?: string
  visibility?: string
  joinCode?: string
  currentUserRole?: string
}

type Tab = 'games' | 'members' | 'settings'

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames, poolGames, pokerGames,
  players, members = [], groupId = '', groupSlug = '', visibility = 'private', joinCode = '', currentUserRole = 'member',
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Only show tabs if we're in a group context
  const isGroupContext = !!groupId

  const nameMap = new Map(players.map(p => [p.id, p.name]))
  const name = (id: string) => nameMap.get(id) ?? id

  const allGames: AllGame[] = [
    ...pongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...beerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...cornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
    ...spikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
    ...poolGames.map(g => ({ kind: 'pool' as const, played_at: g.played_at, data: g })),
    ...pokerGames.map(g => ({ kind: 'poker' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const apiPath = (kind: string, id: string) => {
    if (kind === 'pong') return `/api/pong/${id}`
    if (kind === 'beer-die') return `/api/beer-die/${id}`
    if (kind === 'cornhole') return `/api/cornhole/${id}`
    if (kind === 'spikeball') return `/api/spikeball/${id}`
    if (kind === 'pool') return `/api/pool/${id}`
    if (kind === 'poker') return `/api/poker/${id}`
    return `/api/hearts/${id}`
  }

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    await fetch(apiPath(kind, id), { method: 'DELETE' })
    setDeleteLoading(false)
    window.location.reload()
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const gameSummary = (g: AllGame) => {
    if (g.kind === 'pong') {
      const d = g.data as AdminPongGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} (${d.cups_left} cups)`
    }
    if (g.kind === 'beer-die') {
      const d = g.data as AdminBeerDieGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'cornhole') {
      const d = g.data as AdminCornholeGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'spikeball') {
      const d = g.data as AdminSpikeballGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.points_differential}`
    }
    if (g.kind === 'pool') {
      const d = g.data as AdminPoolGame
      return `${d.winner_ids.map(name).join(' & ')} def. ${d.loser_ids.map(name).join(' & ')} +${d.balls_differential} balls`
    }
    if (g.kind === 'poker') {
      const d = g.data as AdminPokerGame
      return d.player_amounts
        .sort((a, b) => b.amount_cents - a.amount_cents)
        .map(pa => {
          const abs = (Math.abs(pa.amount_cents) / 100).toFixed(2)
          return `${name(pa.player_id)} ${pa.amount_cents >= 0 ? '+' : '-'}$${abs}`
        })
        .join(', ')
    }
    const d = g.data as AdminHeartsGame
    const loserName = name(d.game_players.find(p => p.lost)?.player_id ?? '')
    const others = d.game_players.filter(p => !p.lost).map(p => name(p.player_id)).join(', ')
    return `${others} — ${loserName} lost`
  }

  const badgeLabel = (kind: string) => {
    if (kind === 'pong') return 'PONG'
    if (kind === 'beer-die') return 'DIE'
    if (kind === 'cornhole') return 'CORN'
    if (kind === 'spikeball') return 'SPIKE'
    if (kind === 'pool') return 'POOL'
    if (kind === 'poker') return 'POKER'
    return 'HEARTS'
  }

  const badgeColor = (kind: string) => {
    if (kind === 'pong') return 'bg-blue-100 text-blue-700'
    if (kind === 'beer-die') return 'bg-amber-100 text-amber-700'
    if (kind === 'cornhole') return 'bg-green-100 text-green-700'
    if (kind === 'spikeball') return 'bg-orange-100 text-orange-700'
    if (kind === 'pool') return 'bg-purple-100 text-purple-700'
    if (kind === 'poker') return 'bg-teal-100 text-teal-700'
    return 'bg-pink-100 text-pink-700'
  }

  const GameRow = ({ g }: { g: AllGame }) => {
    const id = g.data.id
    const isEditing = editingId === id
    const isConfirmingDelete = confirmDeleteId === id

    return (
      <div key={id} className="bg-card rounded-xl border border-warm px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor(g.kind)}`}>
              {badgeLabel(g.kind)}
            </span>
            <span className="text-sm text-stone-900 truncate">{gameSummary(g)}</span>
            <span className="text-xs text-muted shrink-0">{formatDate(g.played_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isConfirmingDelete && (
              <>
                <button
                  onClick={() => setEditingId(isEditing ? null : id)}
                  className="text-xs text-muted hover:text-stone-900 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                >
                  {isEditing ? 'Close' : '✏️ Edit'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(id)}
                  className="text-xs text-muted hover:text-loss-ink px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                >
                  🗑 Delete
                </button>
              </>
            )}
            {isConfirmingDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Sure?</span>
                <button
                  onClick={() => handleDelete(g.kind, id)}
                  disabled={deleteLoading}
                  className="text-xs font-bold bg-loss text-white px-2 py-1 rounded-full hover:bg-red-600 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing && g.kind === 'pong' && (
          <EditPongGame game={g.data as AdminPongGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'beer-die' && (
          <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'cornhole' && (
          <EditCornholeGame game={g.data as AdminCornholeGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'spikeball' && (
          <EditSpikeballGame game={g.data as AdminSpikeballGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'hearts' && (
          <EditHeartsGame game={g.data as AdminHeartsGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'pool' && (
          <EditPoolGame game={g.data as AdminPoolGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {isEditing && g.kind === 'poker' && (
          <EditPokerGame game={g.data as AdminPokerGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
      </div>
    )
  }

  if (!isGroupContext) {
    // Global admin page - show just games
    return (
      <div className="space-y-2">
        {allGames.length === 0 && <p className="text-muted text-sm">No games logged yet.</p>}
        {allGames.map(g => <GameRow key={g.data.id} g={g} />)}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-warm">
        {(['games', 'members', 'settings'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-win text-stone-900'
                : 'border-transparent text-muted hover:text-stone-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'members' && (
        <MembersTab initial={members} groupId={groupId} currentUserRole={currentUserRole} />
      )}

      {activeTab === 'settings' && (
        <GroupSettingsTab
          groupId={groupId}
          initialVisibility={visibility}
          initialJoinCode={joinCode}
          groupSlug={groupSlug}
        />
      )}

      {activeTab === 'games' && (
        <div className="space-y-2">
          {allGames.length === 0 && <p className="text-muted text-sm">No games logged yet.</p>}
          {allGames.map(g => <GameRow key={g.data.id} g={g} />)}
        </div>
      )}
    </div>
  )
}
