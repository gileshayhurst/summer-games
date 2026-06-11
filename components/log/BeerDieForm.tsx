'use client'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

type SinkType = 'sink' | 'self_sink' | ''

export default function BeerDieForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [winners, setWinners] = useState<string[]>([])
  const [losers, setLosers] = useState<string[]>([])
  const [points, setPoints] = useState('')
  const [sinkMap, setSinkMap] = useState<Record<string, SinkType>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const allSelected = [...winners, ...losers]
  const showSinks = allSelected.length > 0

  const setSink = (playerId: string, type: SinkType) => {
    setSinkMap(prev => ({ ...prev, [playerId]: type }))
  }

  const getName = (id: string) => players.find(p => p.id === id)?.name ?? id

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (winners.length < 1) return setError('At least 1 winner required')
    if (losers.length < 1) return setError('At least 1 loser required')
    if (!points || Number(points) < 1) return setError('Points differential must be at least 1')
    setLoading(true)

    const sinks = allSelected
      .filter(id => sinkMap[id])
      .map(id => ({ player_id: id, type: sinkMap[id] as 'sink' | 'self_sink' }))

    const res = await fetch('/api/beer-die', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winner_ids: winners,
        loser_ids: losers,
        points_differential: Number(points),
        sinks,
        group_id: groupId,
      }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/beer-die` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PlayerSelector players={players} selected={winners} onChange={setWinners} label="Winning Team" excluded={losers} />
      <PlayerSelector players={players} selected={losers} onChange={setLosers} label="Losing Team" excluded={winners} />
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Points Won By</label>
        <input
          type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
          className="bg-card border border-slate-600 rounded px-3 py-2 text-white w-24 focus:outline-none focus:border-win"
          placeholder="1"
        />
      </div>

      {showSinks && (
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wide block mb-2">Sinks (optional)</label>
          <div className="space-y-2">
            {allSelected.map(id => {
              const current = sinkMap[id] ?? ''
              return (
                <div key={id} className="flex items-center justify-between bg-card px-3 py-2 rounded">
                  <span className="text-sm text-white">{getName(id)}</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSink(id, current === 'sink' ? '' : 'sink')}
                      className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${
                        current === 'sink'
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      ✓ Sink
                    </button>
                    <button
                      type="button"
                      onClick={() => setSink(id, current === 'self_sink' ? '' : 'self_sink')}
                      className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${
                        current === 'self_sink'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      ✗ Self Sink
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
