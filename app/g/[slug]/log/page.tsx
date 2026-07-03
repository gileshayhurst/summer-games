import { createServerClient } from '@/lib/supabase-server'
import { requireMembership } from '@/lib/auth'
import LogTabs from '@/components/log/LogTabs'

export default async function GroupLogPage({ params }: { params: { slug: string } }) {
  const { group, member } = await requireMembership(params.slug)

  if (!member) {
    return (
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
        <div className="bg-amber-50 border border-warm rounded-xl p-4">
          <p className="text-sm font-bold text-stone-900">Members only</p>
          <p className="text-sm text-muted mt-1">
            You need to be a member to log games. Ask a group member for an invite link.
          </p>
        </div>
      </div>
    )
  }

  const supabase = createServerClient()
  const { data: players } = await supabase
    .from('users')
    .select('id, name, created_at')
    .eq('group_id', group.id)
    .order('name')

  return (
    <div>
      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Log a Game</h1>
      <p className="text-muted text-sm mb-6">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
