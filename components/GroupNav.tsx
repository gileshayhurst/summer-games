import Link from 'next/link'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  return (
    <nav className="bg-card border-b border-slate-700 px-4 py-3 flex items-center gap-6 sticky top-0 z-10">
      <Link href={base} className="text-win font-black text-sm tracking-widest uppercase">
        {groupName}
      </Link>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <Link href={`${base}/pong`} className="hover:text-white transition-colors">🏓 Pong</Link>
        <Link href={`${base}/beer-die`} className="hover:text-white transition-colors">🎲 Beer Die</Link>
        <Link href={`${base}/hearts`} className="hover:text-white transition-colors">♥ Hearts</Link>
        <Link href={`${base}/players`} className="hover:text-white transition-colors">👥 Players</Link>
      </div>
      <Link
        href={`${base}/log`}
        className="ml-auto bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
      >
        + LOG GAME
      </Link>
    </nav>
  )
}
