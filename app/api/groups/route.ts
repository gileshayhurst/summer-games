import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { generateJoinCode } from '@/lib/join-code'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

async function generateUniqueJoinCode(supabase: ReturnType<typeof createServerClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateJoinCode()
    const { data } = await supabase.from('groups').select('id').eq('join_code', code).single()
    if (!data) return code
  }
  throw new Error('Could not generate unique join code')
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { name, slug: rawSlug, players, visibility } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 })
  if (!Array.isArray(players) || players.length < 1)
    return NextResponse.json({ error: 'At least 1 player required' }, { status: 400 })

  const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(name.trim())
  if (!slug) return NextResponse.json({ error: 'Invalid group name for URL' }, { status: 400 })

  const groupVisibility = visibility === 'public' ? 'public' : 'private'

  const supabase = createServerClient()

  const { data: existing } = await supabase.from('groups').select('id').eq('slug', slug).single()
  if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })

  const joinCode = await generateUniqueJoinCode(supabase)

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), slug, pin: '0000', join_code: joinCode, visibility: groupVisibility, owner_id: user.id })
    .select()
    .single()
  if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 })

  const playerRows = players
    .map((n: string) => n.trim())
    .filter(Boolean)
    .map((n: string) => ({ name: n, group_id: group.id }))

  if (playerRows.length > 0) {
    const { error: playersErr } = await supabase.from('users').insert(playerRows)
    if (playersErr) return NextResponse.json({ error: playersErr.message }, { status: 500 })
  }

  const { error: memberErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'owner' })
  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

  return NextResponse.json({ slug, join_code: joinCode }, { status: 201 })
}
