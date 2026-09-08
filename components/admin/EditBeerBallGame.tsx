'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminBeerBallGame } from '@/app/admin/page'
import PlayerSelector from '@/components/log/PlayerSelector'

type Props = {
  game: AdminBeerBallGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditBeerBallGame({ game, players, onSave, onCancel }: Props) {
  const [winners, setWinners] = useState<string[]>(game.winner_ids)
  const [losers, setLosers] = useState<string[]>(game.loser_ids)
  const [cans, setCans] = useState(String(game.cans_left))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (cans === '' || Number(cans) < 0) return setError('Cans left must be 0 or more')
    setLoading(true)
    const res = await fetch(`/api/beer-ball/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cans_left: Number(cans) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-warm rounded-xl space-y-3">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-wide block mb-1">Cans Left</label>
        <input
          type="number" min="0" value={cans} onChange={e => setCans(e.target.value)}
          className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win-ink"
        />
      </div>
      {error && <p className="text-loss-ink text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading}
          className="bg-win text-ink font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-wide hover:bg-orange-400 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="bg-stone-100 text-stone-600 font-bold px-4 py-1.5 rounded-full text-sm hover:bg-stone-200">
          Cancel
        </button>
      </div>
    </div>
  )
}
