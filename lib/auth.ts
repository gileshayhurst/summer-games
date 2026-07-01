import { createServerClient as createSSRClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createServerClient } from './supabase-server'
import type { GroupMember, GroupMemberRole } from './types'

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

export type RoleResult = {
  group: GroupInfo
  member: GroupMember
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
export async function requireMembership(slug: string): Promise<MembershipResult> {
  const supabase = createServerClient()
  const user = await getCurrentUser()

  const { data: group } = await supabase
    .from('groups')
    .select('id, slug, name, visibility, join_code, owner_id')
    .eq('slug', slug)
    .single()

  if (!group) notFound()

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

  if (group.visibility === 'private' && !member) notFound()

  return { group, member, isPublic: group.visibility === 'public' }
}

// Use on pages/routes that require admin or owner role
export async function requireRole(slug: string, allowedRoles: GroupMemberRole[]): Promise<RoleResult> {
  const { group, member } = await requireMembership(slug)
  if (!member || !allowedRoles.includes(member.role)) notFound()
  return { group, member }
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
