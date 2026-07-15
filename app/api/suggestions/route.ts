import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const MAX_LEN = 2000

export async function POST(req: NextRequest) {
  if (!rateLimit(`suggestions:${clientIp(req)}`, 5, 60_000))
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { name, game_suggestion, feedback, email } = await req.json()

  for (const [key, value] of Object.entries({ name, game_suggestion, feedback, email })) {
    if (value != null && (typeof value !== 'string' || value.length > MAX_LEN))
      return NextResponse.json({ error: `${key} must be a string of at most ${MAX_LEN} characters` }, { status: 400 })
  }

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
