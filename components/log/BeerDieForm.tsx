'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'

export default function BeerDieForm({ players }: { players: User[] }) {
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [points, setPoints] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length !== 2) return setError('Exactly 2 winners required')
    if (losers.length !== 2) return setError('Exactly 2 losers required')
    if (!points || Number(points) < 1) return setError('Points differential must be at least 1')
    setLoading(true)
    const res = await fetch('/api/beer-die', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner1_id: winners[0], winner2_id: winners[1],
        loser1_id: losers[0], loser2_id: losers[1],
        points_differential: Number(points),
      }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = '/beer-die' }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team (2)" excluded={losers} maxSelect={2} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team (2)" excluded={winners} maxSelect={2} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Points Won By</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
          placeholder="1"
        />
      </div>
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
