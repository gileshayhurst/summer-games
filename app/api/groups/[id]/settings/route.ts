import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'
import { generateJoinCode } from '@/lib/join-code'

// PATCH /api/groups/[id]/settings — update visibility or rotate join code (requires admin/owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.visibility !== undefined) {
    if (!['public', 'private'].includes(body.visibility)) {
      return NextResponse.json({ error: 'visibility must be public or private' }, { status: 400 })
    }
    update.visibility = body.visibility
  }

  if (body.rotateCode === true) {
    const supabase = createServerClient()
    for (let i = 0; i < 10; i++) {
      const code = generateJoinCode()
      const { data } = await supabase.from('groups').select('id').eq('join_code', code).single()
      if (!data) { update.join_code = code; break }
    }
    if (!update.join_code) return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('groups')
    .update(update)
    .eq('id', params.id)
    .select('visibility, join_code')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
