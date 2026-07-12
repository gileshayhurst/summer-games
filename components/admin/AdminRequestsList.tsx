'use client'
import { useState } from 'react'

type Request = {
  user_id: string
  profiles: { display_name: string } | null
  users: { name: string } | null
}

export default function AdminRequestsList({
  initial,
  groupId,
}: {
  initial: Request[]
  groupId: string
}) {
  const [requests, setRequests] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const respond = async (userId: string, body: Record<string, unknown>) => {
    setLoading(userId)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error); return }
    setRequests(prev => prev.filter(r => r.user_id !== userId))
  }

  if (requests.length === 0) return null

  return (
    <div className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-4">
        Admin Requests
        <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>
      </h2>
      {error && <p className="text-loss-ink text-sm mb-2">{error}</p>}
      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.user_id} className="bg-card rounded-xl border border-warm px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-stone-900">{r.profiles?.display_name ?? 'Unknown'}</p>
              <p className="text-xs text-muted mt-0.5">
                Player: {r.users?.name ?? <span className="italic">unclaimed</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => respond(r.user_id, { role: 'admin' })}
                disabled={loading === r.user_id}
                className="text-[10px] font-black px-3 py-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => respond(r.user_id, { admin_requested_at: null })}
                disabled={loading === r.user_id}
                className="text-[10px] font-black px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
