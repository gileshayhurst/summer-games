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
      <h1 className="text-2xl font-black mb-2 tracking-wide">Log a Game</h1>
      <p className="text-slate-400 text-sm mb-6">Select the game type and fill in the result.</p>
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-8 text-sm text-slate-300">
        🔒 <span className="font-medium">Games are reviewed before appearing on the leaderboard</span> — this keeps things fair on a public site.
        To approve submissions, add <span className="font-mono text-slate-200">/admin</span> to the end of your group link (PIN required).
      </div>
      <LogTabs players={players ?? []} />
    </div>
  )
}
