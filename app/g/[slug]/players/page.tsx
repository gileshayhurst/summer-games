export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import { User } from '@/lib/types'
import { notFound } from 'next/navigation'
import AddPlayerForm from '@/components/AddPlayerForm'

export default async function GroupPlayersPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name').eq('group_id', group.id).order('name')

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {(players ?? []).map((p: Pick<User, 'id' | 'name'>) => (
          <Link key={p.id} href={`/g/${params.slug}/players/${encodeURIComponent(p.name)}`}
            className="bg-card rounded-xl p-4 text-center hover:bg-amber-50 transition-colors border border-warm">
            <p className="font-black text-stone-900 uppercase tracking-wide text-sm">{p.name}</p>
          </Link>
        ))}
      </div>
      <AddPlayerForm groupId={group.id} groupSlug={params.slug} />
    </div>
  )
}
