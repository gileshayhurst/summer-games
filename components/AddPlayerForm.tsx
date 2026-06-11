'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddPlayerForm({ groupId, groupSlug }: { groupId: string; groupSlug: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), group_id: groupId }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setName('')
    router.refresh()
  }

  return (
    <div className="bg-card rounded-lg p-6 max-w-sm">
      <h2 className="font-bold mb-4">Add New Player</h2>
      <form onSubmit={submit} className="flex gap-3">
        <input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required
          className="bg-bg border border-slate-600 rounded px-3 py-2 text-white flex-1 focus:outline-none focus:border-win text-sm" />
        <button type="submit" disabled={loading}
          className="bg-win text-black font-bold px-4 py-2 rounded hover:bg-green-400 transition-colors text-sm disabled:opacity-50">
          Add
        </button>
      </form>
      {error && <p className="text-loss text-sm mt-2">{error}</p>}
    </div>
  )
}
