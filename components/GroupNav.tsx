'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGroup } from '@/lib/group-context'

export default function GroupNav({ slug, groupName, isExample = false }: { slug: string; groupName: string; isExample?: boolean }) {
  const base = `/g/${slug}`
  const pathname = usePathname()
  const [showHomeModal, setShowHomeModal] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const [showBrowseButton, setShowBrowseButton] = useState(false)
  const { membership } = useGroup()

  useEffect(() => {
    if (sessionStorage.getItem('fromDiscover')) setShowBrowseButton(true)
  }, [])

  // Native <dialog> handles Escape, focus trap, and focus restore; just sync open state.
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (showHomeModal && !d.open) d.showModal()
    else if (!showHomeModal && d.open) d.close()
  }, [showHomeModal])

  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/pool`, label: 'Pool' },
    { href: `${base}/poker`, label: 'Poker' },
    { href: `${base}/players`, label: 'Players' },
  ]
  const myStatsHref = `${base}/me`
  const isMyStatsActive = pathname === myStatsHref || pathname.startsWith(myStatsHref + '/')

  return (
    <>
      <nav className="bg-card border-b border-warm px-4 pb-3 flex items-center sticky top-0 z-10 relative" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <button
          onClick={() => setShowHomeModal(true)}
          className="hover:opacity-70 transition-opacity mr-3 shrink-0"
          aria-label="Go to home screen"
        >
          <img src="/icon.svg" alt="Garage League" className="h-7 w-auto" />
        </button>
        {showBrowseButton && !isExample && (
          <button
            onClick={() => {
              sessionStorage.removeItem('fromDiscover')
              router.push('/discover')
            }}
            className="text-muted text-xs hover:text-stone-900 transition-colors shrink-0 mr-3 font-semibold"
          >
            ← Browse
          </button>
        )}
        <Link href={base} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 text-brand font-black text-sm tracking-widest uppercase shrink-0">
          {groupName}
        </Link>
        {!isExample && (
          <Link
            href={myStatsHref}
            className={`hidden md:inline-block ml-4 text-xs font-black uppercase tracking-widest transition-colors shrink-0 ${
              isMyStatsActive ? 'text-win-ink border-b-2 border-win pb-0.5' : 'text-muted hover:text-stone-900'
            }`}
          >
            My Stats
          </Link>
        )}
        <div className="hidden md:flex flex-1 items-center justify-evenly px-4 flex-wrap gap-y-1">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'text-win-ink border-b-2 border-win pb-0.5'
                    : 'text-muted hover:text-stone-900'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <div className="flex-1 md:hidden" />
        {!isExample && (
          <Link
            href={`${base}/admin`}
            className="text-muted hover:text-stone-900 transition-colors mr-2 text-base shrink-0"
            aria-label="Admin settings"
          >
            ⚙️
          </Link>
        )}
        {!isExample && membership && (
          <Link
            href={`${base}/log`}
            className="hidden md:inline-flex shrink-0 bg-win text-ink text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
          >
            LOG GAME →
          </Link>
        )}
      </nav>

      <dialog
        ref={dialogRef}
        onClose={() => setShowHomeModal(false)}
        onClick={e => { if (e.target === dialogRef.current) setShowHomeModal(false) }}
        aria-label="Leave this group"
        aria-describedby="home-modal-desc"
        className="bg-transparent p-0 w-[min(24rem,calc(100%-2rem))] backdrop:bg-black/40"
      >
        <div className="bg-card border border-warm rounded-2xl p-6 shadow-lg">
          <p id="home-modal-desc" className="text-stone-900 font-bold mb-6">
            This will take you back to the &apos;create a group screen&apos;.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowHomeModal(false)}
              className="bg-stone-100 text-stone-600 font-bold px-4 py-2 rounded-full text-sm hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <Link
              href="/"
              className="bg-win text-ink font-black px-4 py-2 rounded-full text-sm hover:bg-orange-400 transition-colors uppercase tracking-wide"
            >
              Confirm
            </Link>
          </div>
        </div>
      </dialog>
    </>
  )
}
