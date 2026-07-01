import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const member = await getMemberForAPI(group_id)
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const supabase = createServerClient()
  const [{ data: members }, { data: allPlayers }] = await Promise.all([
    supabase.from('group_members').select('player_id').eq('group_id', group_id),
    supabase.from('users').select('id, name').eq('group_id', group_id).order('name'),
  ])

  const claimedPlayerIds = new Set((members ?? []).map((m: any) => m.player_id).filter(Boolean))
  const players = (allPlayers ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    claimed: claimedPlayerIds.has(p.id),
  }))

  return NextResponse.json({ players })
}
