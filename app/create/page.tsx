'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function CreatePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [players, setPlayers] = useState<string[]>(['', ''])
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ slug: string; joinCode: string } | null>(null)

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
    if (filledPlayers.length < 1) return setError('Add at least 1 player')
    setLoadingSubmit(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, players: filledPlayers, visibility }),
    })
    const data = await res.json()
    setLoadingSubmit(false)
    if (!res.ok) return setError(data.error)
    setCreated({ slug: data.slug, joinCode: data.join_code })
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-bg text-stone-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Link href="/" className="text-muted text-sm hover:text-stone-900 mb-8 inline-block">← Back</Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Create Your Group</h1>
          <p className="text-muted text-sm mb-6">You need to sign in first.</p>
          <Link
            href="/signin?next=/create"
            className="bg-win text-white font-black px-6 py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors inline-block"
          >
            Sign In →
          </Link>
        </div>
      </div>
    )
  }

  if (created) {
    const joinLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${created.joinCode}`
    return (
      <div className="min-h-screen bg-bg text-stone-900">
        <div className="max-w-lg mx-auto px-4 py-12">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Group Created! 🎉</h1>
          <p className="text-muted text-sm mb-8">Share this with your crew to let them join.</p>
          <div className="bg-card border border-warm rounded-xl p-5 mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-1">Join Code</p>
            <p className="text-3xl font-black tracking-widest text-stone-900 mb-3">{created.joinCode}</p>
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-1">Join Link</p>
            <p className="text-sm text-muted break-all mb-3">{joinLink}</p>
            <button
              onClick={() => navigator.clipboard.writeText(joinLink)}
              className="bg-stone-100 text-stone-700 font-black text-xs px-4 py-2 rounded-full hover:bg-stone-200 transition-colors uppercase tracking-wide"
            >
              Copy Link
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-black uppercase tracking-widest text-muted">Visibility:</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide ${visibility === 'public' ? 'bg-amber-100 text-brand' : 'bg-stone-100 text-stone-600'}`}>
              {visibility}
            </span>
            <span className="text-xs text-muted">{visibility === 'public' ? '— listed in directory' : '— invite only'}</span>
          </div>
          <Link
            href={`/g/${created.slug}`}
            className="bg-win text-white font-black px-6 py-3 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors inline-block w-full text-center"
          >
            Go to Your Group →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-stone-900">
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link href="/" className="text-muted text-sm hover:text-stone-900 mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Create Your Group</h1>
        <p className="text-muted text-sm mb-8">Set up your leaderboard in 60 seconds.</p>
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
              <span className="text-muted text-sm">garageleague.app/g/</span>
              <input
                value={slug} onChange={e => setSlug(toSlug(e.target.value))}
                placeholder="robs-crew"
                className="bg-card border border-warm rounded-xl px-3 py-2 text-stone-900 flex-1 focus:outline-none focus:border-win"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">Visibility</label>
            <div className="flex gap-3">
              {(['private', 'public'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 py-2 rounded-xl border font-black text-xs uppercase tracking-wide transition-colors ${
                    visibility === v
                      ? 'border-win bg-green-50 text-stone-900'
                      : 'border-warm bg-card text-muted hover:bg-amber-50'
                  }`}
                >
                  {v === 'private' ? '🔒 Private' : '🌐 Public'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-1">
              {visibility === 'private' ? 'Invite-only. Not listed anywhere.' : 'Listed in the public directory. Anyone can view.'}
            </p>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wide block mb-2">
              Players <span className="normal-case font-normal">(You can add more later)</span>
            </label>
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
          <button type="submit" disabled={loadingSubmit}
            className="bg-win text-white font-black px-6 py-2 rounded-full uppercase tracking-wider hover:bg-orange-400 disabled:opacity-50 transition-colors w-full">
            {loadingSubmit ? 'Creating...' : 'Create Group →'}
          </button>
        </form>
      </div>
    </div>
  )
}
