'use client'
import { useState, useEffect } from 'react'
import { User } from '@/lib/types'
import { AdminPongGame, AdminBeerDieGame, AdminHeartsGame } from '@/app/admin/page'
import EditPongGame from './EditPongGame'
import EditBeerDieGame from './EditBeerDieGame'
import EditHeartsGame from './EditHeartsGame'

const ADMIN_PASSWORD = '1111'

type AllGame =
  | { kind: 'pong'; played_at: string; data: AdminPongGame }
  | { kind: 'beer-die'; played_at: string; data: AdminBeerDieGame }
  | { kind: 'hearts'; played_at: string; data: AdminHeartsGame }

type Props = {
  pongGames: AdminPongGame[]
  beerDieGames: AdminBeerDieGame[]
  heartsGames: AdminHeartsGame[]
  players: User[]
}

export default function AdminPanel({ pongGames, beerDieGames, heartsGames, players }: Props) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_authed') === '1') setAuthed(true)
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PASSWORD) {
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
    ...heartsGames.map(g => ({ kind: 'hearts' as const, played_at: g.played_at, data: g })),
  ].sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())

  const handleDelete = async (kind: string, id: string) => {
    setDeleteLoading(true)
    const endpoint = kind === 'pong' ? `/api/pong/${id}` : kind === 'beer-die' ? `/api/beer-die/${id}` : `/api/hearts/${id}`
    await fetch(endpoint, { method: 'DELETE' })
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
      return `${name(d.winner1_id)} & ${name(d.winner2_id)} def. ${name(d.loser1_id)} & ${name(d.loser2_id)} +${d.points_differential}`
    }
    const d = g.data as AdminHeartsGame
    const loserName = name(d.game_players.find(p => p.lost)?.player_id ?? '')
    const others = d.game_players.filter(p => !p.lost).map(p => name(p.player_id)).join(', ')
    return `${others} — ${loserName} lost`
  }

  const badgeColor = (kind: string) =>
    kind === 'pong' ? 'bg-blue-900 text-blue-300' : kind === 'beer-die' ? 'bg-yellow-900 text-yellow-300' : 'bg-pink-900 text-pink-300'

  if (!authed) {
    return (
      <form onSubmit={handlePinSubmit} className="max-w-xs space-y-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Enter PIN</label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false) }}
            className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-full focus:outline-none focus:border-win"
            placeholder="••••"
            autoFocus
          />
        </div>
        {pinError && <p className="text-loss text-sm">Incorrect PIN</p>}
        <button type="submit"
          className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 transition-colors">
          Unlock
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-2">
      {allGames.length === 0 && <p className="text-slate-500 text-sm">No games logged yet.</p>}
      {allGames.map(g => {
        const id = g.data.id
        const isEditing = editingId === id
        const isConfirmingDelete = confirmDeleteId === id

        return (
          <div key={id} className="bg-card rounded-lg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${badgeColor(g.kind)}`}>
                  {g.kind === 'pong' ? 'PONG' : g.kind === 'beer-die' ? 'DIE' : 'HEARTS'}
                </span>
                <span className="text-sm text-slate-300 truncate">{gameSummary(g)}</span>
                <span className="text-xs text-slate-500 shrink-0">{formatDate(g.played_at)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isConfirmingDelete && (
                  <>
                    <button
                      onClick={() => setEditingId(isEditing ? null : id)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      {isEditing ? 'Close' : '✏️ Edit'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(id)}
                      className="text-xs text-slate-400 hover:text-loss px-2 py-1 rounded hover:bg-slate-700 transition-colors"
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
                {isConfirmingDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sure?</span>
                    <button
                      onClick={() => handleDelete(g.kind, id)}
                      disabled={deleteLoading}
                      className="text-xs font-bold bg-loss text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing && g.kind === 'pong' && (
              <EditPongGame
                game={g.data as AdminPongGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
            {isEditing && g.kind === 'beer-die' && (
              <EditBeerDieGame
                game={g.data as AdminBeerDieGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
            {isEditing && g.kind === 'hearts' && (
              <EditHeartsGame
                game={g.data as AdminHeartsGame}
                players={players}
                onSave={() => window.location.reload()}
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
