import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { User } from '@/lib/types'
import { revalidatePath } from 'next/cache'

async function addPlayer(formData: FormData) {
  'use server'
  const name = formData.get('name') as string
  if (!name?.trim()) return
  const supabase = createServerClient()
  await supabase.from('users').insert({ name: name.trim() })
  revalidatePath('/players')
}

export default async function PlayersPage() {
  const supabase = createServerClient()
  const { data: players } = await supabase.from('users').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-2xl font-black tracking-wide mb-8">👥 Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
        {(players ?? []).map((p: Pick<User, 'id' | 'name'>) => (
          <Link key={p.id} href={`/players/${encodeURIComponent(p.name)}`}
            className="bg-card rounded-lg p-4 text-center hover:bg-slate-700 transition-colors">
            <p className="font-bold text-white">{p.name}</p>
          </Link>
        ))}
      </div>
      <div className="bg-card rounded-lg p-6 max-w-sm">
        <h2 className="font-bold mb-4">Add New Player</h2>
        <form action={addPlayer} className="flex gap-3">
          <input name="name" placeholder="Name" required
            className="bg-bg border border-slate-600 rounded px-3 py-2 text-white flex-1 focus:outline-none focus:border-win text-sm" />
          <button type="submit"
            className="bg-win text-black font-bold px-4 py-2 rounded hover:bg-green-400 transition-colors text-sm">
            Add
          </button>
        </form>
      </div>
    </div>
  )
}
