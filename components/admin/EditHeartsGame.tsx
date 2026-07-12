'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { AdminHeartsGame } from '@/app/admin/page'

type Props = {
  game: AdminHeartsGame
  players: User[]
  onSave: () => void
  onCancel: () => void
}

export default function EditHeartsGame({ game, players, onSave, onCancel }: Props) {
  const [participants, setParticipants] = useState<string[]>(
    game.game_players.map(p => p.player_id)
  )
  const [loser, setLoser] = useState<string>(
    game.game_players.find(p => p.lost)?.player_id ?? ''
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleParticipant = (id: string) => {
    if (participants.includes(id)) {
      setParticipants(participants.filter(p => p !== id))
      if (loser === id) setLoser('')
    } else {
      setParticipants([...participants, id])
    }
  }

  const save = async () => {
    setError('')
    if (participants.length < 3) return setError('At least 3 players required')
    if (!loser) return setError('Select who lost')
    setLoading(true)
    const game_players = participants.map(id => ({ player_id: id, lost: id === loser }))
    const res = await fetch(`/api/hearts/${game.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_players }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    onSave()
  }

  return (
    <div className="mt-3 p-4 bg-amber-50 border border-warm rounded-xl space-y-3">
      <div>
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Players (click to toggle)</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${inGame ? 'bg-card border border-warm' : 'bg-stone-50 border border-stone-200'}`}>
                <button type="button" onClick={() => toggleParticipant(p.id)}
                  className={`text-sm font-medium text-left ${inGame ? 'text-stone-900' : 'text-muted hover:text-stone-700'}`}>
                  {p.name}
                </button>
                {inGame && (
                  <button type="button" onClick={() => setLoser(isLoser ? '' : p.id)}
                    className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${isLoser ? 'bg-loss text-white' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'}`}>
                    {isLoser ? 'LOST' : 'won'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
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
