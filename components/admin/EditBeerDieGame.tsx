'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminBeerDieGame } from '@/app/admin/page'

type Props = {
  game: AdminBeerDieGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditBeerDieGame({ game, players, onSave, onCancel }: Props) {
  const [winner1, setWinner1] = useState(game.winner1_id)
  const [winner2, setWinner2] = useState(game.winner2_id)
  const [loser1, setLoser1] = useState(game.loser1_id)
  const [loser2, setLoser2] = useState(game.loser2_id)
  const [points, setPoints] = useState(String(game.points_differential))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectClass = "bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-win"

  const save = async () => {
    setError('')
    if (!winner1 || !winner2 || !loser1 || !loser2) return setError('All 4 players required')
    const ids = [winner1, winner2, loser1, loser2]
    if (new Set(ids).size !== 4) return setError('All 4 players must be different')
    if (!points || Number(points) < 1) return setError('Points must be at least 1')
    setLoading(true)
    const res = await fetch(`/api/beer-die/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner1_id: winner1, winner2_id: winner2, loser1_id: loser1, loser2_id: loser2, points_differential: Number(points) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  const playerOptions = players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Winner 1</label>
          <select value={winner1} onChange={e => setWinner1(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Winner 2</label>
          <select value={winner2} onChange={e => setWinner2(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Loser 1</label>
          <select value={loser1} onChange={e => setLoser1(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Loser 2</label>
          <select value={loser2} onChange={e => setLoser2(e.target.value)} className={selectClass}>
            <option value="">Select...</option>{playerOptions}
          </select>
        </div>
      </div>
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
