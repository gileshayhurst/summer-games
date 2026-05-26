import { createServerClient } from '@/lib/supabase-server'
import LogTabs from '@/components/log/LogTabs'

export default async function LogPage() {
  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name, created_at').order('name')

  return (
    <div>
      <h1 className="text-2xl font-black mb-2 tracking-wide">Log a Game</h1>
      <p className="text-slate-400 text-sm mb-8">Select the game type and fill in the result.</p>
      <LogTabs players={players ?? []} />
    </div>
  )
}
