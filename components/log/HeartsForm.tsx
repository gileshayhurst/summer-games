'use client'
import { useState } from 'react'
import { User } from '@/lib/types'

export default function HeartsForm({ players }: { players: User[] }) {
  const [participants, setParticipants] = useState<string[]>([])
  const [loser, setLoser] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleParticipant = (id: string) => {
    if (participants.includes(id)) {
      setParticipants(participants.filter(p => p !== id))
      if (loser === id) setLoser('')
    } else {
      setParticipants([...participants, id])
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (participants.length < 3) return setError('At least 3 players required')
    if (!loser) return setError('Select who lost')
    setLoading(true)
    const game_players = participants.map(id => ({ player_id: id, lost: id === loser }))
    const res = await fetch('/api/hearts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_players }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = '/hearts' }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Who Played? (click to add, then mark who lost)</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${inGame ? 'bg-card' : 'bg-slate-800/50'}`}>
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
      {success && <p className="text-win text-sm">Game logged! ✓</p>}
      <button type="submit" disabled={loading}
        className="bg-win text-black font-bold px-6 py-2 rounded hover:bg-green-400 disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
