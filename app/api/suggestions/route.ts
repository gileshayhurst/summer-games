import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { name, game_suggestion, feedback, email } = await req.json()

  const supabase = createServerClient()
  const { error } = await supabase.from('suggestions').insert({
    name: name || null,
    game_suggestion: game_suggestion || null,
    feedback: feedback || null,
    email: email || null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
