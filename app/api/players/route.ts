import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getMemberForAPI, canReadGroup } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const group_id = new URL(req.url).searchParams.get('group_id')
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })
  if (!(await canReadGroup(group_id)))
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users').select('id, name, created_at').eq('group_id', group_id).order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ players: data })
}

export async function POST(req: NextRequest) {
  const { name, group_id } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!group_id) return NextResponse.json({ error: 'group_id required' }, { status: 400 })

  const member = await getMemberForAPI(group_id)
  if (!member) return NextResponse.json({ error: 'Must be a group member to add players' }, { status: 403 })

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users').insert({ name: name.trim(), group_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ player: data }, { status: 201 })
}
