import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="bg-card border-b border-warm px-4 py-3 flex items-center gap-6 sticky top-0 z-10">
      <Link href="/" className="text-win-ink font-black text-sm tracking-widest uppercase">
        Summer Games
      </Link>
      <div className="flex items-center gap-4 text-muted text-sm">
        <Link href="/pong" className="hover:text-stone-900 transition-colors">🏓 Pong</Link>
        <Link href="/beer-die" className="hover:text-stone-900 transition-colors">🎲 Beer Die</Link>
        <Link href="/hearts" className="hover:text-stone-900 transition-colors">♥ Hearts</Link>
        <Link href="/players" className="hover:text-stone-900 transition-colors">👥 Players</Link>
      </div>
      <Link
        href="/log"
        className="ml-auto bg-win text-ink text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider hover:bg-orange-400 transition-colors"
      >
        LOG GAME →
      </Link>
    </nav>
  )
}
