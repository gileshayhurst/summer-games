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
    <div className="bg-card rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wide w-8">#</th>
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 text-slate-400 text-xs uppercase tracking-wide">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={entry.player_id as string} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              <td className="px-4 py-3 text-slate-500 font-mono">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </td>
              {columns.map(c => {
                const val = entry[c.key]
                const display = c.format ? c.format(val as number) : val
                let color = 'text-white'
                if (c.colorize) {
                  color = typeof val === 'number' && val > 0
                    ? 'text-win'
                    : typeof val === 'number' && val < 0
                    ? 'text-loss'
                    : 'text-white'
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
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                No games yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
