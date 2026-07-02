import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

// PATCH /api/groups/[id]/members/[userId] — update role or player_id (requires admin/owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const body = await req.json()
  const update: Record<string, unknown> = {}

  if (body.role !== undefined) {
    if (!['member', 'admin'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    // Only owner can promote/demote
    if (requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 })
    }
    update.role = body.role
    // A role change (promote or demote) makes any pending admin request stale.
    update.admin_requested_at = null
  }

  if ('admin_requested_at' in body) {
    if (body.admin_requested_at !== null) {
      return NextResponse.json({ error: 'Invalid admin_requested_at' }, { status: 400 })
    }
    // Only owner can deny a pending admin request
    if (requester.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can deny admin requests' }, { status: 403 })
    }
    update.admin_requested_at = null
  }

  if ('player_id' in body) {
    update.player_id = body.player_id ?? null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .update(update)
    .eq('group_id', params.id)
    .eq('user_id', params.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/groups/[id]/members/[userId] — remove member (requires admin/owner)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const requester = await getMemberForAPI(params.id)
  if (!requester || !['admin', 'owner'].includes(requester.role)) {
    return NextResponse.json({ error: 'Admin required' }, { status: 403 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', params.id)
    .eq('user_id', params.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
