'use client'
import { useState } from 'react'
import { User, HeadToHeadResult } from '@/lib/types'

type Props = {
  players: User[]
  currentPlayerId?: string
  game: 'pong' | 'beer-die'
}

export default function PartnerRecord({ players, currentPlayerId, game }: Props) {
  const [player1Id, setPlayer1Id] = useState(currentPlayerId ?? '')
  const [player2Id, setPlayer2Id] = useState('')
  const [result, setResult] = useState<HeadToHeadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRecord = async (p1: string, p2: string) => {
    if (!p1 || !p2 || p1 === p2) { setResult(null); return }
    setLoading(true)
    const res = await fetch(`/api/${game}/record-with?player1=${p1}&player2=${p2}`)
    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  const handlePlayer1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer1Id(e.target.value)
    setResult(null)
    fetchRecord(e.target.value, player2Id)
  }

  const handlePlayer2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayer2Id(e.target.value)
    setResult(null)
    fetchRecord(player1Id, e.target.value)
  }

  const player1Name = players.find(p => p.id === player1Id)?.name ?? ''

  return (
    <div className="bg-card rounded-lg p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Record With</p>

      {!currentPlayerId && (
        <select
          value={player1Id}
          onChange={handlePlayer1Change}
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-2 focus:outline-none focus:border-win"
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
        className="bg-bg border border-slate-600 rounded px-3 py-2 text-white text-sm w-full mb-4 focus:outline-none focus:border-win"
      >
        <option value="">{currentPlayerId ? 'Select teammate...' : 'with teammate...'}</option>
        {players
          .filter(p => p.id !== player1Id)
          .map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </select>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {result && !loading && (
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-win">{result.wins}</p>
            <p className="text-xs text-slate-400 uppercase">{currentPlayerId ? 'Wins' : `${player1Name} Wins`}</p>
          </div>
          <div className="text-slate-600 text-2xl self-center">–</div>
          <div>
            <p className="text-2xl font-black text-loss">{result.losses}</p>
            <p className="text-xs text-slate-400 uppercase">{currentPlayerId ? 'Losses' : `${player1Name} Losses`}</p>
          </div>
        </div>
      )}
    </div>
  )
}
