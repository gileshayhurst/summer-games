import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export async function POST(req: NextRequest) {
  const { name, slug: rawSlug, pin, players } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'Group name required' }, { status: 400 })
  if (!pin || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 })
  if (!Array.isArray(players) || players.length < 1)
    return NextResponse.json({ error: 'At least 1 player required' }, { status: 400 })

  const slug = rawSlug?.trim() ? toSlug(rawSlug.trim()) : toSlug(name.trim())
  if (!slug) return NextResponse.json({ error: 'Invalid group name for URL' }, { status: 400 })

  const supabase = createServerClient()

  const { data: existing } = await supabase.from('groups').select('id').eq('slug', slug).single()
  if (existing) return NextResponse.json({ error: 'That URL is already taken' }, { status: 409 })

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), slug, pin })
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

  return NextResponse.json({ slug }, { status: 201 })
}
