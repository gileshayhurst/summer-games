'use client'
import { useState } from 'react'
import { User } from '@/lib/types'

export default function PlayersTab({ players }: { players: User[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const remove = async (id: string) => {
    setLoadingId(id)
    setErrors(e => ({ ...e, [id]: '' }))
    const res = await fetch(`/api/players/${id}`, { method: 'DELETE' })
    setLoadingId(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({ error: 'Delete failed' }))
      setConfirmId(null)
      return setErrors(e => ({ ...e, [id]: d.error ?? 'Delete failed' }))
    }
    window.location.reload()
  }

  if (players.length === 0) return <p className="text-muted text-sm">No players yet.</p>

  return (
    <div className="space-y-2">
      <p className="text-muted text-sm mb-4">
        A player can only be deleted once they have no logged games and no member has claimed them.
      </p>
      {players.map(p => (
        <div key={p.id} className="bg-card rounded-xl border border-warm px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-stone-900 uppercase tracking-wide text-sm truncate">{p.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              {confirmId !== p.id && (
                <button
                  onClick={() => setConfirmId(p.id)}
                  className="text-xs text-muted hover:text-loss-ink px-2 py-1 rounded hover:bg-amber-50 transition-colors"
                >
                  🗑 Delete
                </button>
              )}
              {confirmId === p.id && (
                <>
                  <span className="text-xs text-muted">Sure?</span>
                  <button
                    onClick={() => remove(p.id)}
                    disabled={loadingId === p.id}
                    className="text-xs font-bold bg-loss text-white px-2 py-1 rounded-full hover:bg-red-600 disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded hover:bg-stone-200"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          {errors[p.id] && <p className="text-loss-ink text-xs mt-2">{errors[p.id]}</p>}
        </div>
      ))}
    </div>
  )
}
