'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function PokerForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const togglePlayer = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(p => p !== id))
      setAmounts(prev => { const next = { ...prev }; delete next[id]; return next })
    } else {
      setSelectedIds(prev => [...prev, id])
      setAmounts(prev => ({ ...prev, [id]: '' }))
    }
  }

  const totalCents = selectedIds.reduce((sum, id) => {
    const v = parseFloat(amounts[id] ?? '0')
    return sum + (isNaN(v) ? 0 : Math.round(v * 100))
  }, 0)

  const doesNotBalance = selectedIds.length > 0 && totalCents !== 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (selectedIds.length < 2) return setError('At least 2 players required')
    for (const id of selectedIds) {
      if (amounts[id] === '' || amounts[id] === undefined) return setError('Enter an amount for every selected player')
      if (isNaN(parseFloat(amounts[id]))) return setError('All amounts must be valid numbers')
    }
    const player_amounts = selectedIds.map(id => ({
      player_id: id,
      amount_cents: Math.round(parseFloat(amounts[id]) * 100),
    }))
    setLoading(true)
    const res = await fetch('/api/poker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_amounts, group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/poker` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-2">Players in this session</p>
        <div className="flex flex-wrap gap-2">
          {players.map(p => {
            const isSelected = selectedIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlayer(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  isSelected
                    ? 'bg-win text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-warm'
                }`}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>
      {selectedIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-widest font-black">Amounts won/lost (use − for losses)</p>
          {selectedIds.map(id => {
            const player = players.find(p => p.id === id)!
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="text-sm font-bold text-stone-900 w-24 truncate">{player.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amounts[id] ?? ''}
                    onChange={e => setAmounts(prev => ({ ...prev, [id]: e.target.value }))}
                    className="bg-card border border-warm rounded px-2 py-1.5 text-stone-900 w-24 focus:outline-none focus:border-win text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )
          })}
          {doesNotBalance && (
            <p className="text-amber-600 text-xs font-bold">
              ⚠ Amounts don&apos;t sum to $0 (off by ${(Math.abs(totalCents) / 100).toFixed(2)})
            </p>
          )}
        </div>
      )}
      {error && <p className="text-loss text-sm">{error}</p>}
      {success && <p className="text-win text-sm font-bold">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-white font-black px-6 py-2 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors uppercase tracking-wide">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
