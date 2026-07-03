export const dynamic = 'force-dynamic'

import Link from 'next/link'
import CurvedArrow from '@/components/CurvedArrow'
import SuggestionForm from '@/components/SuggestionForm'
import JoinByCodeButton from '@/components/JoinByCodeButton'
import { getCurrentUser } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'
import type { GroupMemberRole } from '@/lib/types'

type MyGroup = {
  name: string
  slug: string
  role: GroupMemberRole
  playerName: string | null
}

export default async function LandingPage() {
  const user = await getCurrentUser()

  let myGroups: MyGroup[] = []
  if (user) {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('group_members')
      .select('role, player_id, groups ( name, slug ), users!player_id ( name )')
      .eq('user_id', user.id)

    myGroups = (data ?? [])
      .map(m => {
        const g = (Array.isArray(m.groups) ? m.groups[0] : m.groups) as { name: string; slug: string }
        return {
          name: g.name,
          slug: g.slug,
          role: m.role as GroupMemberRole,
          playerName: m.player_id
            ? ((m as any).users as { name: string } | null)?.name ?? null
            : null,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

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

      <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
        {!user ? (
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-800 mb-0.5">Your Groups</p>
              <p className="text-sm text-muted">Sign in to see your groups.</p>
            </div>
            <Link
              href="/signin?next=/"
              className="shrink-0 bg-white border-2 border-amber-600 text-amber-700 text-xs font-black px-5 py-2 rounded-full hover:bg-amber-100 transition-colors tracking-wider uppercase"
            >
              Sign In →
            </Link>
          </div>
        ) : myGroups.length === 0 ? (
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-800 mb-0.5">Your Groups</p>
              <p className="text-sm text-muted">You&apos;re not in any groups yet.</p>
            </div>
            <Link
              href="/create"
              className="shrink-0 bg-win text-white text-xs font-black px-5 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
            >
              Create One →
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800 mb-3">Your Groups</p>
            <div className="space-y-2">
              {myGroups.map(g => (
                <Link
                  key={g.slug}
                  href={`/g/${g.slug}`}
                  className="flex items-center justify-between bg-white border border-warm rounded-xl px-4 py-3 hover:bg-amber-50 transition-colors"
                >
                  <div>
                    <p className="font-black text-stone-900 text-sm">{g.name}</p>
                    {g.playerName ? (
                      <p className="text-xs text-muted">Playing as <strong className="text-stone-900">{g.playerName}</strong></p>
                    ) : (
                      <p className="text-xs text-muted italic">No player claimed yet</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    g.role === 'owner' || g.role === 'admin'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}>
                    {g.role}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-2xl mx-auto px-6 py-10 md:py-20 text-center">
        <div className="inline-block bg-amber-100 text-brand text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase mb-6">
          Free
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none text-stone-900 mb-4">
          Track Your Group&apos;s<br />
          <span className="text-win">Wins &amp; Losses.</span>
        </h1>
        <p className="text-lg text-muted mb-3 leading-relaxed">
          Leaderboards for Pong, Beer Die, Cards, and more — shared with your whole crew.
        </p>
        <p className="text-base font-bold italic text-brand mb-12">
          The unofficial official scoreboard.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-10 md:mb-20">
          <Link href="/create"
            className="bg-win text-white font-black px-8 py-3 rounded-full hover:bg-orange-400 transition-colors text-base tracking-wider uppercase">
            Create Your Group →
          </Link>
          <JoinByCodeButton />
          <Link href="/discover"
            className="text-muted font-bold px-8 py-3 rounded-full border-2 border-warm hover:bg-card transition-colors text-base tracking-wide uppercase">
            Browse Public Groups
          </Link>
        </div>
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
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
              <p className="text-muted text-sm">Public link your whole group can add to home screen to view as an app!</p>
            </div>
          </div>
          <div className="mt-16">
            <SuggestionForm />
          </div>
          <div className="hidden md:block">
            <CurvedArrow fromId="multi-games-card" toId="want-anchor" />
          </div>
        </div>
      </main>
    </div>
  )
}
