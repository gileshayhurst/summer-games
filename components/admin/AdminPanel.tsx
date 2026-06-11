'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminCornholeGame, AdminSpikeballGame, AdminHeartsGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditCornholeGame from './EditCornholeGame'
import EditSpikeballGame from './EditSpikeballGame'
import EditHeartsGame from './EditHeartsGame'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'cornhole'; played_at: string; data: AdminCornholeGame }
  | { kind: 'spikeball'; played_at: string; data: AdminSpikeballGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  cornholeGames: AdminCornholeGame[]
  spikeballGames: AdminSpikeballGame[]
  heartsGames: AdminHeartsGame[]
  pendingPongGames: AdminPongGame[]
  pendingBeerDieGames: AdminBeerDieGame[]
  pendingCornholeGames: AdminCornholeGame[]
  pendingSpikeballGames: AdminSpikeballGame[]
  pendingHeartsGames: AdminHeartsGame[]
  players: User[]
  groupPin: string
}

export default function AdminPanel({
  pongGames, beerDieGames, cornholeGames, spikeballGames, heartsGames,
  pendingPongGames, pendingBeerDieGames, pendingCornholeGames, pendingSpikeballGames, pendingHeartsGames,
  players, groupPin,
}: Props) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [approveLoading, setApproveLoading] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === '1') setAuthed(true)
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === groupPin) {
      sessionStorage.setItem('admin_authed', '1')
      setAuthed(true)
    } else {
      setPinError(true)
      setPin('')
    }
  }

  const nameMap = new Map(players.map(p => [p.id, p.name]))
  const name = (id: string) => nameMap.get(id) ?? id

  const allGames: AllGame[] = [
    ...pongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...beerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...cornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
    ...spikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const pendingGames: AllGame[] = [
    ...pendingPongGames.map(g => ({ kind: 'pong' as const, played_at: g.played_at, data: g })),
    ...pendingBeerDieGames.map(g => ({ kind: 'beer-die' as const, played_at: g.played_at, data: g })),
    ...pendingCornholeGames.map(g => ({ kind: 'cornhole' as const, played_at: g.played_at, data: g })),
    ...pendingSpikeballGames.map(g => ({ kind: 'spikeball' as const, played_at: g.played_at, data: g })),
    ...pendingHeartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const apiPath = (kind: string, id: string) => {
    if (kind === 'pong') return `/api/pong/${id}`
    if (kind === 'beer-die') return `/api/beer-die/${id}`
    if (kind === 'cornhole') return `/api/cornhole/${id}`
    if (kind === 'spikeball') return `/api/spikeball/${id}`
    return `/api/hearts/${id}`
  }

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    await fetch(apiPath(kind, id), { method: 'DELETE' })
    setDeleteLoading(false)
    window.location.reload()
  }

  const handleApprove = async (kind: string, id: string) => {
    setApproveLoading(id)
    await fetch(apiPath(kind, id), { method: 'PATCH' })
    setApproveLoading(null)
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
    return 'HEARTS'
  }

  const badgeColor = (kind: string) => {
    if (kind === 'pong') return 'bg-blue-100 text-blue-700'
    if (kind === 'beer-die') return 'bg-amber-100 text-amber-700'
    if (kind === 'cornhole') return 'bg-green-100 text-green-700'
    if (kind === 'spikeball') return 'bg-orange-100 text-orange-700'
    return 'bg-pink-100 text-pink-700'
  }

  if (!authed) {
    return (
      <form onSubmit={handlePinSubmit} className="max-w-xs space-y-4">
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-2">Enter PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false) }}
            className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
            placeholder="••••"
            autoFocus
          />
        </div>
        {pinError && <p className="text-loss text-sm">Incorrect PIN</p>}
        <button type="submit"
          className="bg-win text-white font-black px-6 py-2 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors">
          Unlock →
        </button>
      </form>
    )
  }

  const GameRow = ({ g, isPending }: { g: AllGame; isPending: boolean }) => {
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
                {isPending ? (
                  <button
                    onClick={() => handleApprove(g.kind, id)}
                    disabled={approveLoading === id}
                    className="text-xs font-bold bg-win text-white px-2 py-1 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors"
                  >
                    {approveLoading === id ? '...' : '✓ Approve'}
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(isEditing ? null : id)}
                    className="text-xs text-muted hover:text-stone-900 px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                  >
                    {isEditing ? 'Close' : '✏️ Edit'}
                  </button>
                )}
                <button
                  onClick={() => setConfirmDeleteId(id)}
                  className="text-xs text-muted hover:text-loss px-2 py-1 rounded hover:bg-amber-50 transition-colors"
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

        {!isPending && isEditing && g.kind === 'pong' && (
          <EditPongGame game={g.data as AdminPongGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'beer-die' && (
          <EditBeerDieGame game={g.data as AdminBeerDieGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'cornhole' && (
          <EditCornholeGame game={g.data as AdminCornholeGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'spikeball' && (
          <EditSpikeballGame game={g.data as AdminSpikeballGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
        {!isPending && isEditing && g.kind === 'hearts' && (
          <EditHeartsGame game={g.data as AdminHeartsGame} players={players} onSave={() => window.location.reload()} onCancel={() => setEditingId(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pendingGames.length > 0 && (
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">
            Pending Approval
            <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pendingGames.length}</span>
          </h2>
          <div className="space-y-2">
            {pendingGames.map(g => <GameRow key={g.data.id} g={g} isPending={true} />)}
          </div>
        </div>
      )}

      <div>
        {pendingGames.length > 0 && (
          <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-3">Approved Games</h2>
        )}
        <div className="space-y-2">
          {allGames.length === 0 && <p className="text-muted text-sm">No games logged yet.</p>}
          {allGames.map(g => <GameRow key={g.data.id} g={g} isPending={false} />)}
        </div>
      </div>
    </div>
  )
}
