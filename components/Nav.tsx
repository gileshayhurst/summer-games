import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="bg-card border-b border-slate-700 px-4 py-3 flex items-center gap-6 sticky top-0 z-10">
      <Link href="/" className="text-win font-black text-sm tracking-widest uppercase">
        Summer Games
      </Link>
      <div className="flex items-center gap-4 text-slate-400 text-sm">
        <Link href="/pong" className="hover:text-white transition-colors">🏓 Pong</Link>
        <Link href="/beer-die" className="hover:text-white transition-colors">🎲 Beer Die</Link>
        <Link href="/hearts" className="hover:text-white transition-colors">♥ Hearts</Link>
        <Link href="/players" className="hover:text-white transition-colors">👥 Players</Link>
      </div>
      <Link
        href="/log"
        className="ml-auto bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors"
      >
        + LOG GAME
      </Link>
    </nav>
  )
}
