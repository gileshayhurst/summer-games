'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ALL_GAMES = [
  { slug: 'me', label: 'My Stats', icon: '👤' },
  { slug: 'pong', label: 'Pong', icon: '🏓' },
  { slug: 'beer-die', label: 'Beer Die', icon: '🎲' },
  { slug: 'hearts', label: 'Hearts', icon: '♥' },
  { slug: 'cornhole', label: 'Cornhole', icon: '🌽' },
  { slug: 'spikeball', label: 'Spikeball', icon: '🏐' },
  { slug: 'pool', label: 'Pool', icon: '🎱' },
  { slug: 'poker', label: 'Poker', icon: '♠' },
  { slug: 'players', label: 'Players', icon: '👥' },
]

const DEFAULT_PINS = ['me', 'pong', 'beer-die']
const MAX_PINS = 3

export default function BottomNav({ slug, isExample = false }: { slug: string; isExample?: boolean }) {
  const base = `/g/${slug}`
  const pathname = usePathname()
  const storageKey = `sg-pinned-${slug}`

  const [pinned, setPinned] = useState<string[]>(DEFAULT_PINS)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed: string[] = JSON.parse(stored)
        const valid = parsed.filter((s) => ALL_GAMES.some((g) => g.slug === s))
        if (valid.length > 0) setPinned(valid)
      }
    } catch {}
  }, [storageKey])

  const savePinned = (next: string[]) => {
    setPinned(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  const togglePin = (gameSlug: string) => {
    if (pinned.includes(gameSlug)) {
      savePinned(pinned.filter(p => p !== gameSlug))
    } else if (pinned.length < MAX_PINS) {
      // Maintain master-list order
      const next = ALL_GAMES.map(g => g.slug).filter(s => pinned.includes(s) || s === gameSlug)
      savePinned(next)
    }
  }

  const isFull = pinned.length >= MAX_PINS
  const pinnedGames = ALL_GAMES.filter(g => pinned.includes(g.slug) && (!isExample || g.slug !== 'me'))
  // ALL_GAMES is ordered for the pin bar (My Stats first, so it defaults to the leftmost slot).
  // The "All Games" sheet lists actual games first, then utility entries (Players, My Stats),
  // since neither of those is a "game" and shouldn't sit above the list under that heading.
  const sheetGames = [
    ...ALL_GAMES.filter(g => g.slug !== 'me' && g.slug !== 'players'),
    ...ALL_GAMES.filter(g => g.slug === 'players'),
    ...ALL_GAMES.filter(g => g.slug === 'me'),
  ]
  const sheetRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when sheet is open; drag-to-dismiss with snap
  useEffect(() => {
    if (!showMore) return
    document.body.style.overflow = 'hidden'
    const sheet = sheetRef.current
    if (!sheet) return
    let startY = 0
    let delta = 0
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      delta = 0
      sheet.style.transition = 'none'
    }
    const onMove = (e: TouchEvent) => {
      delta = Math.max(0, e.touches[0].clientY - startY)
      sheet.style.transform = `translateY(${delta}px)`
      e.preventDefault()
    }
    const onEnd = () => {
      const height = sheet.offsetHeight
      sheet.style.transition = 'transform 0.25s ease'
      if (delta > height / 2) {
        sheet.style.transform = `translateY(${height}px)`
        setTimeout(() => setShowMore(false), 250)
      } else {
        sheet.style.transform = 'translateY(0)'
      }
    }
    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      document.body.style.overflow = ''
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
    }
  }, [showMore])

  const tabClass = (gameSlug: string) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
      pathname.startsWith(`${base}/${gameSlug}`) ? 'text-win' : 'text-muted'
    }`

  return (
    <>
      {/* Bottom bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-warm z-10">
        <div className="flex items-center h-16">
          {pinnedGames[0] ? (
            <Link href={`${base}/${pinnedGames[0].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[0].slug)}>
              <span className="text-lg leading-none">{pinnedGames[0].icon}</span>
              <span>{pinnedGames[0].label}</span>
            </Link>
          ) : <div className="flex-1" />}

          {pinnedGames[1] ? (
            <Link href={`${base}/${pinnedGames[1].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[1].slug)}>
              <span className="text-lg leading-none">{pinnedGames[1].icon}</span>
              <span>{pinnedGames[1].label}</span>
            </Link>
          ) : <div className="flex-1" />}

          {isExample ? (
            <div className="flex-1" />
          ) : (
            <Link
              href={`${base}/log`}
              onClick={() => setShowMore(false)}
              className="flex-1 flex items-center justify-center"
            >
              <span className="bg-win text-white text-[9px] font-black px-3 py-2 rounded-full tracking-wider uppercase">LOG+</span>
            </Link>
          )}

          {pinnedGames[2] ? (
            <Link href={`${base}/${pinnedGames[2].slug}`} onClick={() => setShowMore(false)} className={tabClass(pinnedGames[2].slug)}>
              <span className="text-lg leading-none">{pinnedGames[2].icon}</span>
              <span>{pinnedGames[2].label}</span>
            </Link>
          ) : <div className="flex-1" />}

          <button
            onClick={() => setShowMore(s => !s)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
              showMore ? 'text-win' : 'text-muted'
            }`}
          >
            <span className="text-lg leading-none">···</span>
            <span>More</span>
          </button>
        </div>
        {/* Safe area spacer — grows the bar below the tabs on iPhone */}
        <div aria-hidden="true" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>

      {/* More sheet backdrop */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/30"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More sheet */}
      {showMore && (
        <div
          ref={sheetRef}
          className="md:hidden fixed left-0 right-0 z-30 bg-card rounded-t-2xl border-t border-warm shadow-xl will-change-transform"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-warm rounded-full" />
          </div>
          <div className="px-4 pb-6">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">All Games</p>
            {isFull && (
              <p className="text-[11px] text-win font-bold mb-2">Bar full — unpin one to add another</p>
            )}
            {sheetGames.filter(g => !isExample || g.slug !== 'me').map(game => {
              const isPinned = pinned.includes(game.slug)
              const canPin = !isPinned && !isFull
              return (
                <div key={game.slug} className="flex items-center justify-between py-2.5 border-b border-warm last:border-0">
                  <Link
                    href={`${base}/${game.slug}`}
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-2 font-black text-sm text-stone-900"
                  >
                    <span>{game.icon}</span>
                    <span>{game.label}</span>
                  </Link>
                  <button
                    onClick={() => togglePin(game.slug)}
                    disabled={!isPinned && !canPin}
                    className={`text-[10px] font-black px-3 py-1 rounded-full transition-colors ${
                      isPinned
                        ? 'bg-forest text-white'
                        : canPin
                        ? 'bg-stone-100 text-muted'
                        : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    }`}
                  >
                    {isPinned ? 'PINNED' : '+ PIN'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
