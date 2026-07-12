'use client'

import { useState, useMemo } from 'react'

type Column = {
  key: string
  label: string
  format?: string
  colorize?: boolean
  sortDirection?: 'asc' | 'desc'
}

function applyFormat(format: Column['format'], v: number | string): string {
  if (!format) return String(v)
  const n = Number(v)
  if (format === 'percent') return `${(n * 100).toFixed(1)}%`
  if (format === 'signed') return n > 0 ? `+${v}` : String(v)
  if (format === 'cents') return n >= 0 ? `+$${(n / 100).toFixed(2)}` : `-$${(Math.abs(n) / 100).toFixed(2)}`
  return String(v)
}

type Props = {
  entries: Record<string, string | number>[]
  columns: Column[]
  defaultSortKey: string
}

export default function Leaderboard({ entries, columns, defaultSortKey }: Props) {
  const [sortKey, setSortKey] = useState(defaultSortKey)

  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sortKey)
    const direction = sortKey === 'name' ? 'asc' : (col?.sortDirection ?? 'desc')
    return [...entries].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      if (direction === 'desc') cmp = -cmp
      if (cmp === 0) return String(a.name).localeCompare(String(b.name))
      return cmp
    })
  }, [entries, columns, sortKey])

  const sortOptions = [
    { value: 'name', label: 'Player (A–Z)' },
    ...columns.filter(c => c.sortDirection).map(c => ({ value: c.key, label: c.label })),
  ]

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted uppercase tracking-widest font-black">Sort</span>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="text-xs border border-warm rounded-lg px-3 min-h-[44px] bg-card text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Sort leaderboard by"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-card rounded-xl overflow-hidden border border-warm">
        <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-warm">
              <th className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-black w-8">#</th>
              {columns.map(c => (
                <th key={c.key} className="text-left px-4 py-3 text-muted text-xs uppercase tracking-widest font-black">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr key={(entry.player_id ?? entry.name) as string} className="border-b border-warm hover:bg-amber-50 transition-colors">
                <td className="px-4 py-3 text-muted font-mono">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                {columns.map(c => {
                  const val = entry[c.key]
                  const display = c.format ? applyFormat(c.format, val as number) : val
                  let color = 'text-stone-900 font-bold'
                  if (c.colorize) {
                    color = typeof val === 'number' && val > 0
                      ? 'text-win-ink font-bold'
                      : typeof val === 'number' && val < 0
                      ? 'text-loss-ink font-bold'
                      : 'text-stone-900 font-bold'
                  }
                  return (
                    <td key={c.key} className={`px-4 py-3 ${color}`}>
                      {display as string}
                    </td>
                  )
                })}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                  No games yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
