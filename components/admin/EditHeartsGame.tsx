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
    <div className="mt-3 p-4 bg-slate-800 rounded-lg space-y-3">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Players (click to toggle)</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${inGame ? 'bg-card' : 'bg-slate-900/50'}`}>
                <button type="button" onClick={() => toggleParticipant(p.id)}
                  className={`text-sm font-medium text-left ${inGame ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {p.name}
                </button>
                {inGame && (
                  <button type="button" onClick={() => setLoser(isLoser ? '' : p.id)}
                    className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${isLoser ? 'bg-loss text-white' : 'bg-slate-600 text-slate-400 hover:bg-slate-500'}`}>
                    {isLoser ? 'LOST' : 'won'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
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
