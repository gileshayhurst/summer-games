'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminBeerDieGame } from '@/app/admin/page'
import PlayerSelector from '@/components/log/PlayerSelector'

type Props = {
  game: AdminBeerDieGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditBeerDieGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [points, setPoints] = useState(String(game.points_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/beer-die/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, points_differential: Number(points) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-3">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Points Differential</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-black font-bold px-4 py-1.5 rounded text-sm hover:bg-green-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-slate-700 text-slate-300 font-bold px-4 py-1.5 rounded text-sm hover:bg-slate-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
