'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function HeadToHead({ players, currentPlayerId, game }: Props) {
  const [opponentId, setOpponentId] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchH2H = async (oppId: string) => {
    if (!oppId || !currentPlayerId) return
    setLoading(true)
    const res = await fetch(`/api/${game}/head-to-head?player1=${currentPlayerId}&player2=${oppId}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOpponentId(e.target.value)
    fetchH2H(e.target.value)
  }

  const opponents = players.filter(p => p.id !== currentPlayerId)

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Head-to-Head</p>
      <select
        value={opponentId}
        onChange={handleChange}
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win"
      >
        <option value="">Select opponent...</option>
        {opponents.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {result && !loading && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-win">{result.wins}</p>
            <p className="text-xs text-slate-400 uppercase">Wins</p>
          </div>
          <div className="text-slate-600 text-2xl self-center">–</div>
          <div>
            <p className="text-2xl font-black text-loss">{result.losses}</p>
            <p className="text-xs text-slate-400 uppercase">Losses</p>
          </div>
        </div>
      )}
    </div>
  )
}
