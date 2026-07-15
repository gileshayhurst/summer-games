import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from './supabase-server'
import type { GroupMember } from './types'

type GroupInfo = {
  id: string
  slug: string
  name: string
  visibility: string
  join_code: string
  owner_id: string | null
}

export type MembershipResult = {
  group: GroupInfo
  member: GroupMember | null
  isPublic: boolean
}

function createCookieClient() {
  const cookieStore = cookies()
  return createSSRClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getCurrentUser() {
  const { data: { user } } = await createCookieClient().auth.getUser()
  return user ?? null
}

// Use in page layouts and server pages under /g/[slug]/
// - Returns group + membership for members
// - Returns group + null member for public groups (non-members can view)
// - Returns 404 for private groups when not a member
// - Exception: "legacy" groups (owner_id null — created before the auth
//   system existed) never had a join flow, so the URL itself was the only
//   access control. Unauthenticated visitors get sent to sign in instead of
//   404, and signed-in visitors are auto-enrolled as members on first visit.
export async function requireMembership(slug: string): Promise<MembershipResult> {
  const supabase = createServerClient()
  const user = await getCurrentUser()

  const { data: group } = await supabase
    .from('groups')
    .select('id, slug, name, visibility, join_code, owner_id')
    .eq('slug', slug)
    .single()

  if (!group) notFound()

  const isLegacy = group.owner_id === null

  let member: GroupMember | null = null
  if (user) {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()
    member = (data as GroupMember) ?? null
  }

  if (group.visibility === 'private' && !member) {
    if (!isLegacy) notFound()
    if (!user) redirect(`/signin?next=/g/${slug}`)

    // First person to ever join a legacy group claims ownership — the
    // group's URL was the only access control before auth existed, so
    // whoever gets there first inherits admin rights, same as before.
    const { count } = await supabase
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', group.id)
    const role = count ? 'member' : 'owner'

    const { data: inserted } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role, player_id: null })
      .select('*')
      .single()
    if (!inserted) notFound()
    member = inserted as GroupMember
  }

  return { group, member, isPublic: group.visibility === 'public' }
}

// Use in POST API routes — returns null if unauthenticated or not a member
export async function getMemberForAPI(groupId: string): Promise<GroupMember | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = createServerClient()
  const { data } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()
  return (data as GroupMember) ?? null
}

// Returns the member row when the caller is admin/owner of the group, else null.
export async function requireGroupAdmin(groupId: string): Promise<GroupMember | null> {
  const member = await getMemberForAPI(groupId)
  if (!member || !['admin', 'owner'].includes(member.role)) return null
  return member
}

// True if a non-member may read the group (it's public) or the caller is a
// member. Mirrors the read rule in requireMembership for API route handlers.
export async function canReadGroup(groupId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data: group } = await supabase
    .from('groups')
    .select('visibility')
    .eq('id', groupId)
    .single()
  if (!group) return false
  if (group.visibility === 'public') return true
  return (await getMemberForAPI(groupId)) !== null
}
