import Link from 'next/link'
import RecentGames from '@/components/RecentGames'
import { RecentGame } from '@/lib/types'

async function getRecentGames(): Promise<RecentGame[]> {
  const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/recent`, { cache: 'no-store' })
  const data = await res.json()
  return data.games ?? []
}

export default async function HomePage() {
  const games = await getRecentGames()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-widest text-win uppercase">Summer Games</h1>
        <p className="text-slate-400 mt-2">The unofficial official scoreboard.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/pong', label: '🏓 Pong' },
          { href: '/beer-die', label: '🎲 Beer Die' },
          { href: '/hearts', label: '♥ Hearts' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="bg-card rounded-lg p-6 text-center font-bold hover:bg-slate-700 transition-colors text-lg">
            {label}
          </Link>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4 tracking-wide uppercase text-slate-400">Recent Games</h2>
        <RecentGames games={games} />
      </div>
    </div>
  )
}
