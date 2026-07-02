import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

// POST /api/groups/[id]/request-admin — a member requests admin status for themselves
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const member = await getMemberForAPI(params.id)
  if (!member) {
    return NextResponse.json({ error: 'Membership required' }, { status: 403 })
  }
  if (member.role !== 'member') {
    return NextResponse.json({ error: 'Already admin or owner' }, { status: 400 })
  }
  if (member.admin_requested_at) {
    return NextResponse.json({ error: 'Request already pending' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .update({ admin_requested_at: new Date().toISOString() })
    .eq('group_id', params.id)
    .eq('user_id', member.user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
