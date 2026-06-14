import { createServerClient, getGroupBySlug } from '@/lib/supabase-server'
import LogTabs from '@/components/log/LogTabs'
import { notFound } from 'next/navigation'

export default async function GroupLogPage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name, created_at').eq('group_id', group.id).order('name')

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
      <p className="text-muted text-sm mb-6">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
