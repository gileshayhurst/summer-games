import Link from 'next/link'
import { examplePlayers } from '../data'

export default function ExamplePlayersPage() {
  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {examplePlayers.map((name) => (
          <div key={name} className="bg-card rounded-xl p-4 text-center border border-warm">
            <p className="font-black text-stone-900 uppercase tracking-wide text-sm">{name}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-warm rounded-xl p-5 text-center max-w-sm mx-auto">
        <p className="text-sm font-bold text-stone-900 mb-1">Want to track your own crew?</p>
        <p className="text-sm text-muted mb-3">Create a free group and add your players in seconds.</p>
        <Link href="/create" className="inline-block bg-win text-ink text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
          Create Your Group →
        </Link>
      </div>
    </div>
  )
}
