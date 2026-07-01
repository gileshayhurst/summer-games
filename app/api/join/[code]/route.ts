import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/join/[code] — validate code and return group info + unclaimed players
export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups')
    .select('id, name, slug, visibility')
    .eq('join_code', params.code.toUpperCase())
    .single()

  if (!group) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

  const [{ data: members }, { data: allPlayers }] = await Promise.all([
    supabase.from('group_members').select('player_id').eq('group_id', group.id),
    supabase.from('users').select('id, name').eq('group_id', group.id).order('name'),
  ])

  const claimedPlayerIds = new Set((members ?? []).map((m: any) => m.player_id).filter(Boolean))
  const players = (allPlayers ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    claimed: claimedPlayerIds.has(p.id),
  }))

  const memberCount = members?.length ?? 0

  return NextResponse.json({ group: { id: group.id, name: group.name, slug: group.slug }, memberCount, players })
}

// POST /api/join/[code] — join the group; optionally claim or create a player
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups')
    .select('id, slug')
    .eq('join_code', params.code.toUpperCase())
    .single()

  if (!group) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    return NextResponse.json({ slug: group.slug, alreadyMember: true })
  }

  const { playerId, playerName } = await req.json().catch(() => ({}))

  let resolvedPlayerId: string | null = null

  if (playerId) {
    // Verify player belongs to group and isn't already claimed
    const { data: player } = await supabase
      .from('users')
      .select('id')
      .eq('id', playerId)
      .eq('group_id', group.id)
      .single()
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    const { data: existingClaim } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('player_id', playerId)
      .single()
    if (existingClaim) return NextResponse.json({ error: 'That player is already claimed' }, { status: 409 })

    resolvedPlayerId = playerId
  } else if (playerName?.trim()) {
    const trimmed = playerName.trim()
    if (trimmed.length > 100) {
      return NextResponse.json({ error: 'Player name must be 100 characters or fewer' }, { status: 400 })
    }
    const { data: newPlayer, error: playerErr } = await supabase
      .from('users')
      .insert({ name: trimmed, group_id: group.id })
      .select()
      .single()
    if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 })
    resolvedPlayerId = newPlayer.id
  }

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member', player_id: resolvedPlayerId })
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  return NextResponse.json({ slug: group.slug }, { status: 201 })
}
