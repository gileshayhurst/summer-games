'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinByCodeButton() {
  const [expanded, setExpanded] = useState(false)
  const [code, setCode] = useState('')
  const router = useRouter()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    router.push(`/join/${encodeURIComponent(trimmed.toUpperCase())}`)
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase"
      >
        Join by Code
      </button>
    )
  }

  return (
    <div className="basis-full w-full mt-4 flex justify-center">
      <form onSubmit={submit} className="flex gap-2 items-center max-w-sm w-full">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter code"
          autoFocus
          required
          className="bg-card border border-warm rounded-full px-4 py-2 text-stone-900 text-sm flex-1 focus:outline-none focus:border-win uppercase"
        />
        <button
          type="submit"
          className="bg-win text-white font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors text-sm uppercase tracking-wide"
        >
          Join →
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(false); setCode('') }}
          aria-label="Cancel"
          className="text-muted text-sm font-bold px-2 hover:text-stone-900 transition-colors"
        >
          ✕
        </button>
      </form>
    </div>
  )
}
