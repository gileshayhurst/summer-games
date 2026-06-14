'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  const pathname = usePathname()
  const [showHomeModal, setShowHomeModal] = useState(false)

  useEffect(() => {
    if (!showHomeModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowHomeModal(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHomeModal])

  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/players`, label: 'Players' },
  ]

  return (
    <>
      <nav className="bg-card border-b border-warm px-4 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => setShowHomeModal(true)}
          className="text-muted hover:text-stone-900 transition-colors mr-3 text-base shrink-0"
          aria-label="Go to home screen"
        >
          🏠
        </button>
        <Link href={base} className="text-brand font-black text-sm tracking-widest uppercase shrink-0">
          {groupName}
        </Link>
        <div className="hidden md:flex flex-1 items-center justify-evenly px-4 flex-wrap gap-y-1">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'text-win border-b-2 border-win pb-0.5'
                    : 'text-muted hover:text-stone-900'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
        <div className="flex-1 md:hidden" />
        <Link
          href={`${base}/admin`}
          className="text-muted hover:text-stone-900 transition-colors mr-2 text-base shrink-0"
          aria-label="Admin settings"
        >
          ⚙️
        </Link>
        <Link
          href={`${base}/log`}
          className="hidden md:inline-flex shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
        >
          LOG GAME →
        </Link>
      </nav>

      {showHomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowHomeModal(false)}
        >
          <div
            className="bg-card border border-warm rounded-2xl p-6 max-w-sm mx-4 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-stone-900 font-bold mb-6">
              This will take you back to the &apos;create a group screen&apos;.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHomeModal(false)}
                className="bg-stone-100 text-stone-600 font-bold px-4 py-2 rounded-full text-sm hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <Link
                href="/"
                className="bg-win text-white font-black px-4 py-2 rounded-full text-sm hover:bg-orange-400 transition-colors uppercase tracking-wide"
              >
                Confirm
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
