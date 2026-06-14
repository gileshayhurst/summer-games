'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function CreatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [pin, setPin] = useState('')
  const [players, setPlayers] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (v: string) => {
    setName(v)
    setSlug(toSlug(v))
  }

  const updatePlayer = (i: number, v: string) => {
    const next = [...players]
    next[i] = v
    if (i === players.length - 1 && v.trim()) next.push('')
    setPlayers(next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const filledPlayers = players.map(p => p.trim()).filter(Boolean)
    if (!name.trim()) return setError('Group name required')
    if (!/^\d{4}$/.test(pin)) return setError('PIN must be exactly 4 digits')
    if (filledPlayers.length < 1) return setError('Add at least 1 player')
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, pin, players: filledPlayers }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) return setError(data.error)
    router.push(`/g/${data.slug}`)
  }

  return (
    <div className="min-h-screen bg-bg text-stone-900">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/" className="text-muted text-sm hover:text-stone-900 mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Create Your Group</h1>
        <p className="text-muted text-sm mb-1">Set up your leaderboard in 60 seconds.</p>
        <p className="text-muted text-sm mb-8">Once created, tap the Share button then &ldquo;Add to Home Screen&rdquo; for easier access.</p>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Group Name</label>
            <input
              value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="Rob's Crew"
              className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-muted text-sm">summergames.app/g/</span>
              <input
                value={slug} onChange={e => setSlug(toSlug(e.target.value))}
                placeholder="robs-crew"
                className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 flex-1 focus:outline-none focus:border-win"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Admin PIN (4 digits) — accessible through ⚙️</label>
            <input
              type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-24 focus:outline-none focus:border-win"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Players</label>
            <div className="space-y-2">
              {players.map((p, i) => (
                <input
                  key={i} value={p} onChange={e => updatePlayer(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 w-full focus:outline-none focus:border-win"
                />
              ))}
            </div>
          </div>
          {error && <p className="text-loss text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-win text-white font-black px-6 py-2 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors w-full">
            {loading ? 'Creating...' : 'Create Group →'}
          </button>
        </form>
      </div>
    </div>
  )
}
