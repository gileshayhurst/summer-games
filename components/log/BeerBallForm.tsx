'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function BeerBallForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [cans, setCans] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (cans === '' || Number(cans) < 0) return setError('Cans left must be 0 or more')
    setLoading(true)
    const res = await fetch('/api/beer-ball', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner_ids: winners, loser_ids: losers, cans_left: Number(cans), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/beer-ball` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-muted uppercase tracking-widest font-black block mb-2">Cans Left</label>
        <input
          type="number" min="0" value={cans} onChange={e => setCans(e.target.value)}
          className="bg-card border border-warm rounded px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win-ink"
          placeholder="0"
        />
      </div>
      {error && <p className="text-loss-ink text-sm">{error}</p>}
      {success && <p className="text-win-ink text-sm font-bold">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-ink font-black px-6 py-2 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors uppercase tracking-wide">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
