'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RequestAdminStatus({
  groupId,
  slug,
  initialPending,
}: {
  groupId: string
  slug: string
  initialPending: boolean
}) {
  const [pending, setPending] = useState(initialPending)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestAdmin = async () => {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/groups/${groupId}/request-admin`, { method: 'POST' })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPending(true)
  }

  return (
    <div className="max-w-sm mx-auto text-center py-16 space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight text-stone-900">
        {pending ? 'Your request is pending' : "You don't have admin access"}
      </h1>
      <p className="text-muted text-sm">
        {pending
          ? 'The group owner will review your request soon.'
          : 'Ask the group owner to make you an admin, or request it yourself.'}
      </p>
      {error && <p className="text-loss text-sm">{error}</p>}
      {!pending && (
        <button
          onClick={requestAdmin}
          disabled={loading}
          className="bg-win text-white text-xs font-black px-6 py-3 rounded-full uppercase tracking-wide hover:bg-orange-400 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Requesting…' : 'Request Admin Status'}
        </button>
      )}
      <div>
        <Link href={`/g/${slug}`} className="text-sm font-bold text-win hover:text-orange-400">
          ← Back to group
        </Link>
      </div>
    </div>
  )
}
