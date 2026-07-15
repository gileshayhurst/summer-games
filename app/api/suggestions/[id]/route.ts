import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { requireGroupAdmin } from '@/lib/auth'

// Suggestions are global app feedback, surfaced and managed only on the
// summer-games group's admin page (see app/g/[slug]/admin/page.tsx, which loads
// them for that slug alone). Deleting one is therefore a summer-games admin
// action — gate on it rather than leaving the endpoint open to anyone.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups').select('id').eq('slug', 'summer-games').single()
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const admin = await requireGroupAdmin(group.id)
  if (!admin) return NextResponse.json({ error: 'Admin required' }, { status: 403 })

  const { error } = await supabase.from('suggestions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
