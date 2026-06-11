type Column = {
  key: string
  label: string
  format?: (v: number | string) => string
  colorize?: boolean
}

type Props = {
  entries: Record<string, string | number>[]
  columns: Column[]
}

export default function Leaderboard({ entries, columns }: Props) {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-warm">
      <table className="w-full text-sm">
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
          {entries.map((entry, i) => (
            <tr key={entry.player_id as string} className="border-b border-warm hover:bg-amber-50 transition-colors">
              <td className="px-4 py-3 text-muted font-mono">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              {columns.map(c => {
                const val = entry[c.key]
                const display = c.format ? c.format(val as number) : val
                let color = 'text-stone-900 font-bold'
                if (c.colorize) {
                  color = typeof val === 'number' && val > 0
                    ? 'text-win font-bold'
                    : typeof val === 'number' && val < 0
                    ? 'text-loss font-bold'
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
          {entries.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted">
                No games yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
