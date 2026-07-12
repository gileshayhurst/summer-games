'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

export default function HeartsForm({ players }: { players: User[] }) {
  const { id: groupId, slug: groupSlug } = useGroup()
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
      body: JSON.stringify({ game_players, group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
    setTimeout(() => { window.location.href = `/g/${groupSlug}/hearts` }, 1000)
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-black mb-2">Who Played? (click to add, then mark who lost)</p>
        <div className="space-y-2">
          {players.map(p => {
            const inGame = participants.includes(p.id)
            const isLoser = loser === p.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors border ${inGame ? 'bg-card border-warm' : 'bg-stone-50 border-stone-200'}`}>
                <button type="button" onClick={() => toggleParticipant(p.id)}
                  className={`text-sm font-bold text-left ${inGame ? 'text-stone-900' : 'text-muted hover:text-stone-900'}`}>
                  {p.name}
                </button>
                {inGame && (
                  <button type="button" onClick={() => setLoser(isLoser ? '' : p.id)}
                    className={`text-xs font-black px-3 py-0.5 rounded-full transition-colors uppercase tracking-wide ${isLoser ? 'bg-loss text-white' : 'bg-stone-100 text-muted hover:bg-stone-200 border border-warm'}`}>
                    {isLoser ? 'Lost' : 'Won'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
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
