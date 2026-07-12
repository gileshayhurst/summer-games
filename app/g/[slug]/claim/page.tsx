'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/lib/group-context'

type Player = { id: string; name: string; claimed: boolean }

export default function ClaimPage() {
  const { id: groupId, slug } = useGroup()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [mode, setMode] = useState<'list' | 'create' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/join/claim-list?group_id=${groupId}`)
      .then(r => r.json())
      .then(data => { setPlayers(data.players ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [groupId])

  const save = async () => {
    setSaving(true)
    setError('')
    const body: Record<string, string> = {}
    if (mode === 'list' && selectedId) body.playerId = selectedId
    if (mode === 'create' && newName.trim()) body.playerName = newName.trim()
    const res = await fetch(`/api/groups/${groupId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/g/${slug}`)
  }

  if (loading) return <div className="p-8 text-muted">Loading…</div>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Claim Your Player</h1>
      <p className="text-muted text-sm mb-6">Link your account to your name on the leaderboard.</p>

      <div className="space-y-2 mb-6">
        {players.map(p => (
          <button
            key={p.id}
            disabled={p.claimed}
            onClick={() => { setMode('list'); setSelectedId(p.id); setNewName('') }}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
              p.claimed
                ? 'border-warm bg-stone-50 text-stone-300 cursor-not-allowed'
                : selectedId === p.id && mode === 'list'
                ? 'border-win bg-green-50 text-stone-900'
                : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
            }`}
          >
            {p.name}
            {p.claimed && <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-muted">Claimed</span>}
          </button>
        ))}
        <button
          onClick={() => { setMode('create'); setSelectedId(null) }}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-bold ${
            mode === 'create' ? 'border-win bg-green-50 text-stone-900' : 'border-warm bg-card text-stone-900 hover:bg-amber-50'
          }`}
        >
          I&apos;m not listed — create my player
        </button>
      </div>

      {mode === 'create' && (
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Your name"
          className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win-ink mb-4"
        />
      )}

      {error && <p className="text-loss-ink text-sm mb-4">{error}</p>}

      <button
        onClick={save}
        disabled={saving || (mode === 'list' && !selectedId) || (mode === 'create' && !newName.trim())}
        className="w-full bg-win text-ink font-black py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving…' : 'Save →'}
      </button>
    </div>
  )
}
