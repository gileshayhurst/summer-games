'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

type Player = { id: string; name: string; claimed: boolean }
type GroupInfo = { id: string; name: string; slug: string }

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const code = params.code.toUpperCase()

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(true)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setFetching(false); return }
        setGroup(data.group)
        setMemberCount(data.memberCount)
        setPlayers(data.players)
        setFetching(false)
      })
      .catch(() => { setError('Failed to load group info'); setFetching(false) })
  }, [code])

  const handleJoin = async (skip = false) => {
    if (!user) {
      router.push(`/signin?next=/join/${code}`)
      return
    }
    setJoining(true)
    const body: Record<string, string> = {}
    if (!skip) {
      if (mode === 'list' && selectedPlayerId) body.playerId = selectedPlayerId
      if (mode === 'create' && newPlayerName.trim()) body.playerName = newPlayerName.trim()
    }
    const res = await fetch(`/api/join/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setJoining(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/g/${data.slug}`)
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <p className="text-muted text-sm mb-4">Sign in to join this group.</p>
          <Link
            href={`/signin?next=/join/${code}`}
            className="block w-full bg-stone-900 text-white font-black py-3 rounded-full text-center hover:bg-stone-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (fetching) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-muted">Loading…</p></div>
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-loss-ink font-bold mb-4">{error}</p>
          <p className="text-muted text-sm">This join link may have expired or been reset.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900 mb-1">
          Joining {group?.name}
        </h1>
        <p className="text-muted text-sm mb-8">{memberCount} member{memberCount !== 1 ? 's' : ''}</p>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">
            Are you on the leaderboard?
          </p>
          <div className="space-y-2">
            {players.map(p => (
              <button
                key={p.id}
                disabled={p.claimed}
                onClick={() => { setMode('list'); setSelectedPlayerId(p.id); setNewPlayerName('') }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
                  p.claimed
                    ? 'border-warm bg-stone-50 text-stone-300 cursor-not-allowed'
                    : selectedPlayerId === p.id && mode === 'list'
                    ? 'border-win bg-green-50 text-stone-900'
                    : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
                }`}
              >
                {p.name}
                {p.claimed && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-muted">Claimed</span>}
              </button>
            ))}
            <button
              onClick={() => { setMode('create'); setSelectedPlayerId(null) }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
                mode === 'create'
                  ? 'border-win bg-green-50 text-stone-900'
                  : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
              }`}
            >
              I&apos;m not listed — create my player
            </button>
          </div>

          {mode === 'create' && (
            <div className="mt-3">
              <input
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="Your name"
                className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win-ink"
              />
            </div>
          )}
        </div>

        {error && <p className="text-loss-ink text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={() => handleJoin(false)}
            disabled={joining || (mode === 'list' && !selectedPlayerId) || (mode === 'create' && !newPlayerName.trim())}
            className="w-full bg-win text-ink font-black py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {joining ? 'Joining…' : 'Join Group →'}
          </button>
          <button
            onClick={() => handleJoin(true)}
            disabled={joining}
            className="w-full text-muted font-bold py-2 text-sm hover:text-stone-900 transition-colors"
          >
            Skip for now (claim a player later)
          </button>
        </div>
      </div>
    </div>
  )
}
