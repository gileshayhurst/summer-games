'use client'
import { useState } from 'react'

export default function GroupSettingsTab({
  groupId,
  initialVisibility,
  initialJoinCode,
  groupSlug,
}: {
  groupId: string
  initialVisibility: string
  initialJoinCode: string
  groupSlug: string
}) {
  const [visibility, setVisibility] = useState(initialVisibility)
  const [joinCode, setJoinCode] = useState(initialJoinCode)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const joinLink = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${joinCode}`
    : `/join/${joinCode}`

  const updateVisibility = async (v: string) => {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: v }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error); return }
    setVisibility(data.visibility)
  }

  const rotateCode = async () => {
    if (!confirm('This will invalidate the current join link. Continue?')) return
    setRotating(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotateCode: true }),
    })
    const data = await res.json()
    setRotating(false)
    if (!res.ok) { setError(data.error); return }
    setJoinCode(data.join_code)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-loss text-sm">{error}</p>}

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Visibility</p>
        <div className="flex gap-3">
          {(['private', 'public'] as const).map(v => (
            <button
              key={v}
              onClick={() => updateVisibility(v)}
              disabled={saving || visibility === v}
              className={`flex-1 py-2 rounded-xl border font-black text-xs uppercase tracking-wide transition-colors ${
                visibility === v
                  ? 'border-win bg-green-50 text-stone-900'
                  : 'border-warm bg-card text-muted hover:bg-amber-50'
              } disabled:cursor-default`}
            >
              {v === 'private' ? '🔒 Private' : '🌐 Public'}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted mt-1">
          {visibility === 'private' ? 'Invite-only. Not listed in the directory.' : 'Listed in the public directory. Anyone can view.'}
        </p>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Join Code</p>
        <div className="bg-card border border-warm rounded-xl p-4">
          <p className="text-3xl font-black tracking-widest text-stone-900 mb-2">{joinCode}</p>
          <p className="text-xs text-muted break-all mb-3">{joinLink}</p>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="bg-stone-100 text-stone-700 font-black text-xs px-4 py-2 rounded-full hover:bg-stone-200 transition-colors uppercase tracking-wide"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={rotateCode}
              disabled={rotating}
              className="bg-red-100 text-red-700 font-black text-xs px-4 py-2 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors uppercase tracking-wide"
            >
              {rotating ? 'Rotating…' : 'Rotate Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
