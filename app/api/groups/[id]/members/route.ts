import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

// GET /api/groups/[id]/members — list all members (requires membership)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profiles(display_name, avatar_url), users(name)')
    .eq('group_id', params.id)
    .order('joined_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data })
}
