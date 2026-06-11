import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <span className="text-win font-black text-sm tracking-widest uppercase">Summer Games</span>
        <Link href="/create"
          className="bg-win text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-green-400 transition-colors">
          Create Your Group
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-black tracking-widest uppercase text-win mb-4">Summer Games</h1>
        <p className="text-xl text-slate-300 mb-4">
          Track wins, losses, and bragging rights for your crew.
        </p>
        <p className="text-slate-400 mb-12">
          Leaderboards for Pong, Beer Die, Hearts, and more — shared with your whole group, no app needed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/create"
            className="bg-win text-black font-bold px-8 py-3 rounded-lg hover:bg-green-400 transition-colors text-lg">
            Create Your Group
          </Link>
          <Link href="/g/summer-games"
            className="bg-card text-white font-bold px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors text-lg">
            See an Example →
          </Link>
        </div>
        <div className="mt-20 grid grid-cols-3 gap-6 text-left">
          {[
            { icon: '🏓', title: 'Multiple Games', desc: 'Pong, Beer Die, Hearts — with more games added based on what groups want.' },
            { icon: '📊', title: 'Live Leaderboards', desc: 'Win rates, differentials, head-to-head records. Always up to date.' },
            { icon: '🔗', title: 'Shareable', desc: 'Public links your whole group can bookmark. No login required.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-card rounded-lg p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="font-bold mb-1">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-16 text-slate-500 text-sm">
          Want to suggest a game?{' '}
          <a href="mailto:summergamesapp@gmail.com?subject=Game suggestion" className="text-slate-300 underline hover:text-white">
            Let us know
          </a>
        </p>
      </main>
    </div>
  )
}
