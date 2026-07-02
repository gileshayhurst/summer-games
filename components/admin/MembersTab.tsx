'use client'
import { useState } from 'react'

type Member = {
  id: string
  user_id: string
  role: string
  player_id: string | null
  profiles: { display_name: string } | null
  users: { name: string } | null
}

export default function MembersTab({
  initial,
  groupId,
  currentUserRole,
}: {
  initial: Member[]
  groupId: string
  currentUserRole: string
}) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const updateMember = async (userId: string, body: Record<string, unknown>) => {
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
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, ...body } : m))
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Remove this member from the group?')) return
    setLoading(userId)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
    setLoading(null)
    if (!res.ok) { setError('Failed to remove member'); return }
    setMembers(prev => prev.filter(m => m.user_id !== userId))
  }

  const unlinkPlayer = async (userId: string) => {
    if (!confirm('Unlink this member from their player slot?')) return
    setLoading(userId)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: null }),
    })
    const data = await res.json()
    setLoading(null)
    if (!res.ok) { setError(data.error); return }
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, player_id: null, users: null } : m))
  }

  return (
    <div>
      {error && <p className="text-loss text-sm mb-4">{error}</p>}
      {members.length === 0 && <p className="text-muted text-sm">No members yet.</p>}
      <div className="space-y-3">
        {members.map(m => (
          <div key={m.user_id} className="bg-card border border-warm rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-stone-900 text-sm">
                  {m.profiles?.display_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  Player: {m.users?.name ?? <span className="italic">unclaimed</span>}
                </p>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                m.role === 'owner' ? 'bg-amber-100 text-brand' :
                m.role === 'admin' ? 'bg-green-100 text-green-800' :
                'bg-stone-100 text-stone-600'
              }`}>
                {m.role}
              </span>
            </div>
            {currentUserRole === 'owner' && m.role !== 'owner' && (
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => updateMember(m.user_id, { role: m.role === 'admin' ? 'member' : 'admin' })}
                  disabled={loading === m.user_id}
                  className="text-[10px] font-black px-3 py-1 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                >
                  {m.role === 'admin' ? 'Demote' : 'Make Admin'}
                </button>
                {m.users && (
                  <button
                    onClick={() => unlinkPlayer(m.user_id)}
                    disabled={loading === m.user_id}
                    className="text-[10px] font-black px-3 py-1 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                  >
                    Unlink Player
                  </button>
                )}
                <button
                  onClick={() => removeMember(m.user_id)}
                  disabled={loading === m.user_id}
                  className="text-[10px] font-black px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 uppercase tracking-wide transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
