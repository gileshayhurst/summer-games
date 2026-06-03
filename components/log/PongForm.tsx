'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'

export default function PongForm({ players }: { players: User[] }) {
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [cupsLeft, setCupsLeft] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('Select at least 1 winner')
    if (losers.length < 1) return setError('Select at least 1 loser')
    if (cupsLeft === '' || isNaN(Number(cupsLeft)) || Number(cupsLeft) < 0)
      return setError('Enter cups left (0 or more)')
    setLoading(true)
    const res = await fetch('/api/pong', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cups_left: Number(cupsLeft) }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = '/pong' }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Cups Left (winners)</label>
        <input
          type="number" min="0" value={cupsLeft} onChange={e => setCupsLeft(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
          placeholder="0"
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
