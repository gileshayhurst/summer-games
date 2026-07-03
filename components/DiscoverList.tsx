'use client'

import Link from 'next/link'

type Group = {
  id: string
  name: string
  slug: string
  memberCount: number
}

export default function DiscoverList({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-3">
      {groups.map(g => (
        <Link
          key={g.id}
          href={`/g/${g.slug}`}
          onClick={() => sessionStorage.setItem('fromDiscover', '1')}
          className="block bg-card border border-warm rounded-xl p-4 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-black text-stone-900">{g.name}</span>
            <span className="text-xs text-muted">{g.memberCount} player{g.memberCount !== 1 ? 's' : ''}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
