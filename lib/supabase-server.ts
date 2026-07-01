import { createClient } from '@supabase/supabase-js'
import { Group } from './types'

export function createServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  )
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('groups')
    .select('id, slug, name, pin, premium, created_at, visibility, join_code, owner_id')
    .eq('slug', slug)
    .single()
  return data ?? null
}
