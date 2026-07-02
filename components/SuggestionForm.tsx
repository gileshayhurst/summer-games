'use client'
import { useState } from 'react'

export default function SuggestionForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [gameSuggestion, setGameSuggestion] = useState('')
  const [feedback, setFeedback] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, game_suggestion: gameSuggestion, feedback, email }),
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); return setError(d.error) }
    setSuccess(true)
  }

  return (
    <div className="max-w-sm mx-auto">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-between w-full text-left mb-4"
      >
        <span className="font-bold text-stone-700 text-sm">
          <span id="want-anchor">Want</span> to suggest a game or give other feedback?
        </span>
        <svg
          className={`w-4 h-4 text-stone-500 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isOpen && (
        success ? (
          <p className="text-brand text-sm font-bold">Thanks for the feedback! ✓</p>
        ) : (
          <form onSubmit={submit} className="space-y-3 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted uppercase tracking-wide block mb-1">Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Optional"
                  className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
                />
              </div>
              <div>
                <label className="text-xs text-muted uppercase tracking-wide block mb-1">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional"
                  className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide block mb-1">Game Suggestion</label>
              <input
                type="text" value={gameSuggestion} onChange={e => setGameSuggestion(e.target.value)} placeholder="Optional"
                className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win"
              />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wide block mb-1">Feedback</label>
              <textarea
                value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Optional" rows={3}
                className="bg-card border border-warm rounded px-3 py-2 text-stone-900 text-sm w-full focus:outline-none focus:border-win resize-none"
              />
            </div>
            {error && <p className="text-loss text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="bg-win text-white font-black px-5 py-2 rounded-full hover:bg-orange-400 disabled:opacity-50 transition-colors text-sm uppercase tracking-wide">
              {loading ? 'Sending...' : 'Submit →'}
            </button>
          </form>
        )
      )}
    </div>
  )
}
