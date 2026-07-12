'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminPokerGame } from '@/app/admin/page'

type Props = {
  game: AdminPokerGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditPokerGame({ game, players, onSave, onCancel }: Props) {
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(game.player_amounts.map(pa => [pa.player_id, (pa.amount_cents / 100).toFixed(2)]))
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const nameMap = new Map(players.map(p => [p.id, p.name]))

  const save = async () => {
    setError('')
    const player_amounts = game.player_amounts.map(pa => ({
      player_id: pa.player_id,
      amount_cents: Math.round(parseFloat(amounts[pa.player_id] ?? '0') * 100),
    }))
    if (player_amounts.some(pa => isNaN(pa.amount_cents))) return setError('Invalid amount')
    setLoading(true)
    const res = await fetch(`/api/poker/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_amounts }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-warm rounded-xl space-y-3">
      {game.player_amounts.map(pa => (
        <div key={pa.player_id} className="flex items-center gap-3">
          <span className="text-sm font-bold text-stone-900 w-24 truncate">{nameMap.get(pa.player_id) ?? pa.player_id}</span>
          <div className="flex items-center gap-1">
            <span className="text-muted text-sm">$</span>
            <input
              type="number"
              step="0.01"
              value={amounts[pa.player_id] ?? ''}
              onChange={e => setAmounts(prev => ({ ...prev, [pa.player_id]: e.target.value }))}
              className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win-ink text-sm"
            />
          </div>
        </div>
      ))}
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
