'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GroupNav({ slug, groupName }: { slug: string; groupName: string }) {
  const base = `/g/${slug}`
  const pathname = usePathname()

  const navItems = [
    { href: `${base}/pong`, label: 'Pong' },
    { href: `${base}/beer-die`, label: 'Beer Die' },
    { href: `${base}/hearts`, label: 'Hearts' },
    { href: `${base}/cornhole`, label: 'Cornhole' },
    { href: `${base}/spikeball`, label: 'Spikeball' },
    { href: `${base}/players`, label: 'Players' },
  ]

  return (
    <nav className="bg-card border-b border-warm px-4 py-3 flex items-center sticky top-0 z-10">
      <Link href={base} className="text-brand font-black text-sm tracking-widest uppercase shrink-0">
        {groupName}
      </Link>
      <div className="flex-1 flex items-center justify-evenly px-4 flex-wrap gap-y-1">
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
      <Link
        href={`${base}/log`}
        className="shrink-0 bg-win text-white text-xs font-black px-4 py-2 rounded-full hover:bg-orange-400 transition-colors tracking-wider uppercase"
      >
        LOG GAME →
      </Link>
    </nav>
  )
}
