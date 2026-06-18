'use client'
import { useState } from 'react'

type Suggestion = {
  id: string
  name: string | null
  email: string | null
  game_suggestion: string | null
  feedback: string | null
  created_at: string
}

export default function SuggestionsList({ initial }: { initial: Suggestion[] }) {
  const [suggestions, setSuggestions] = useState(initial)

  const dismiss = async (id: string) => {
    setSuggestions(s => s.filter(x => x.id !== id))
    await fetch(`/api/suggestions/${id}`, { method: 'DELETE' })
  }

  if (suggestions.length === 0) return null

  return (
    <div className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-muted mb-4">
        Suggestions & Feedback
        <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{suggestions.length}</span>
      </h2>
      <div className="space-y-3">
        {suggestions.map(s => (
          <div key={s.id} className="bg-card rounded-xl border border-warm px-4 py-3 space-y-1 relative">
            <button
              onClick={() => dismiss(s.id)}
              className="absolute top-2.5 right-3 text-muted hover:text-stone-900 text-lg leading-none transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
            <div className="flex items-center gap-3 pr-6">
              <span className="text-sm font-bold text-stone-900">{s.name ?? 'Anonymous'}</span>
              <span className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {s.email && <p className="text-xs text-muted">{s.email}</p>}
            {s.game_suggestion && <p className="text-sm text-stone-700"><span className="font-bold">Game:</span> {s.game_suggestion}</p>}
            {s.feedback && <p className="text-sm text-stone-700"><span className="font-bold">Feedback:</span> {s.feedback}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
