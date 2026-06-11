'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'
import { useGroup } from '@/lib/group-context'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die' | 'cornhole' | 'spikeball'
}

export default function HeadToHead({ players, currentPlayerId, game }: Props) {
  const { id: groupId } = useGroup()
  const [player1Id, setPlayer1Id] = useState(currentPlayerId ?? '')
  const [player2Id, setPlayer2Id] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchH2H = async (p1: string, p2: string) => {
    if (!p1 || !p2 || p1 === p2) { setResult(null); return }
    setLoading(true)
    const res = await fetch(`/api/${game}/head-to-head?player1=${p1}&player2=${p2}&group_id=${groupId}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handlePlayer1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer1Id(e.target.value)
    setResult(null)
    fetchH2H(e.target.value, player2Id)
  }

  const handlePlayer2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer2Id(e.target.value)
    setResult(null)
    fetchH2H(player1Id, e.target.value)
  }

  const player1Name = players.find(p => p.id === player1Id)?.name ?? ''

  return (
    <div className="bg-card rounded-xl p-4 border border-warm">
      <p className="text-xs text-muted uppercase tracking-widest font-black mb-3">Head-to-Head</p>

      {!currentPlayerId && (
        <select
          value={player1Id}
          onChange={handlePlayer1Change}
          className="bg-bg border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full mb-2 focus:outline-none focus:border-win"
        >
          <option value="">Select player...</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <select
        value={player2Id}
        onChange={handlePlayer2Change}
        className="bg-bg border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full mb-4 focus:outline-none focus:border-win"
      >
        <option value="">{currentPlayerId ? 'Select opponent...' : 'vs. opponent...'}</option>
        {players
          .filter(p => p.id !== player1Id)
          .map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </select>

      {loading && <p className="text-muted text-sm">Loading...</p>}
      {result && !loading && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-win">{result.wins}</p>
            <p className="text-xs text-muted uppercase tracking-wide">{currentPlayerId ? 'Wins' : `${player1Name} Wins`}</p>
          </div>
          <div className="text-muted text-2xl self-center">–</div>
          <div>
            <p className="text-2xl font-black text-loss">{result.losses}</p>
            <p className="text-xs text-muted uppercase tracking-wide">{currentPlayerId ? 'Losses' : `${player1Name} Losses`}</p>
          </div>
        </div>
      )}
    </div>
  )
}
