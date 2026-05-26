'use client'
import { User } from '@/lib/types'

type Props = {
  players: User[]
  selected: string[]
  onChange: (ids: string[]) => void
  label: string
  excluded?: string[]
  maxSelect?: number
}

export default function PlayerSelector({ players, selected, onChange, label, excluded = [], maxSelect }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id))
    } else {
      if (maxSelect && selected.length >= maxSelect) return
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {players.map(p => {
          const isSelected = selected.includes(p.id)
          const isExcluded = excluded.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              disabled={isExcluded}
              onClick={() => toggle(p.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-win text-black'
                  : isExcluded
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
