import Link from 'next/link'
import CurvedArrow from '@/components/CurvedArrow'
import SuggestionForm from '@/components/SuggestionForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="px-6 py-4 flex items-center justify-between border-b border-warm bg-card">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-7 w-auto" />
          <span className="text-brand font-black text-sm tracking-widest uppercase">Garage League</span>
        </div>
        <Link href="/create"
          className="bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase">
          Create Your Group →
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-amber-100 text-brand text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-6">
          Free · No login required
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tight leading-none text-stone-900 mb-4">
          Track Your Group&apos;s<br />
          <span className="text-win">Wins &amp; Losses.</span>
        </h1>
        <p className="text-lg text-muted mb-3 leading-relaxed">
          Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew. No app, no login.
        </p>
        <p className="text-base font-bold italic text-brand mb-12">
          The unofficial official scoreboard.
        </p>
        <div className="flex gap-4 justify-center mb-20">
          <Link href="/create"
            className="bg-win text-white font-black px-8 py-3 rounded-full hover:bg-orange-400 transition-colors text-base tracking-wider uppercase">
            Create Your Group →
          </Link>
          <Link href="/g/example"
            className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase">
            See an Example (press home in top left to return)
          </Link>
        </div>
        <div className="relative">
          <div className="grid grid-cols-3 gap-6 text-left">
            <div id="multi-games-card" className="bg-card rounded-xl p-5 border border-warm">
              <div className="text-2xl mb-2">🏓</div>
              <h3 className="font-black text-xs uppercase tracking-widest text-stone-900 mb-2">Multiple Games</h3>
              <p className="text-muted text-sm">Pong, Beer Die, Cards — <span className="text-brand font-bold">with more games to come!</span></p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-warm">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-black text-xs uppercase tracking-widest text-stone-900 mb-2">Live Leaderboards</h3>
              <p className="text-muted text-sm">Win rates, differentials, head-to-head. Always up to date.</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-warm">
              <div className="text-2xl mb-2">🔗</div>
              <h3 className="font-black text-xs uppercase tracking-widest text-stone-900 mb-2">Shareable</h3>
              <p className="text-muted text-sm">Public link your whole group can add to home screen to view as an app! No login necessary.</p>
            </div>
          </div>
          <div className="mt-16">
            <p className="text-muted text-sm mb-4">
              <span id="want-anchor">Want</span> to suggest a game or give other feedback?
            </p>
            <SuggestionForm />
          </div>
          <CurvedArrow fromId="multi-games-card" toId="want-anchor" />
        </div>
      </main>
    </div>
  )
}
