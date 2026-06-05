'use client'
import { useState } from 'react'
import PlayerSelector from '@/components/log/PlayerSelector'
import { User } from '@/lib/types'
import { AdminPongGame } from '@/app/admin/page'

type Props = {
  game: AdminPongGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditPongGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [cupsLeft, setCupsLeft] = useState(String(game.cups_left))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('Select at least 1 winner')
    if (losers.length < 1) return setError('Select at least 1 loser')
    if (cupsLeft === '' || isNaN(Number(cupsLeft)) || Number(cupsLeft) < 0)
      return setError('Enter cups left (0 or more)')
    setLoading(true)
    const res = await fetch(`/api/pong/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cupsLeft) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-4">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Cups Left</label>
        <input
          type="number" min="0" value={cupsLeft} onChange={e => setCupsLeft(e.target.value)}
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
