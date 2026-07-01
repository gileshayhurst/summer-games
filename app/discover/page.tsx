export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'

type PublicGroup = {
  id: string
  name: string
  slug: string
  created_at: string
  memberCount: number
}

async function getPublicGroups(): Promise<PublicGroup[]> {
  const supabase = createServerClient()
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, slug, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!groups) return []

  const memberCounts = await Promise.all(
    groups.map(g =>
      supabase
        .from('group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', g.id)
        .then(({ count }) => ({ id: g.id, count: count ?? 0 }))
    )
  )

  const countMap = new Map(memberCounts.map(c => [c.id, c.count]))

  return groups.map(g => ({ ...g, memberCount: countMap.get(g.id) ?? 0 }))
}

export default async function DiscoverPage() {
  const groups = await getPublicGroups()

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-stone-900">Discover Groups</h1>
            <p className="text-muted text-sm mt-1">Public groups you can follow.</p>
          </div>
          <Link href="/" className="text-muted text-sm hover:text-stone-900">← Home</Link>
        </div>

        {groups.length === 0 ? (
          <p className="text-muted text-sm">No public groups yet.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(g => (
              <Link
                key={g.id}
                href={`/g/${g.slug}`}
                className="block bg-card border border-warm rounded-xl p-4 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">{g.name}</span>
                  <span className="text-xs text-muted">{g.memberCount} member{g.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
