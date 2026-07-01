let mockUser: { id: string } | null = null

jest.mock('next/headers', () => ({
  cookies: () => ({ getAll: () => [], set: () => {} }),
}))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
  redirect: jest.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`) }),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
  }),
}))

type Group = {
  id: string; slug: string; name: string; visibility: string
  join_code: string; owner_id: string | null
}

function mockSupabaseServer(opts: {
  group: Group | null
  member?: { id: string; role: string; player_id: string | null } | null
  insertedMember?: { id: string; role: string; player_id: string | null } | null
  insertError?: boolean
}) {
  return {
    from: (table: string) => {
      if (table === 'groups') {
        return { select: () => ({ eq: () => ({ single: async () => ({ data: opts.group }) }) }) }
      }
      if (table === 'group_members') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: opts.member ?? null }) }) }) }),
          insert: () => ({
            select: () => ({
              single: async () => opts.insertError
                ? { data: null, error: { message: 'insert failed' } }
                : { data: opts.insertedMember ?? null, error: null },
            }),
          }),
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
  }
}

const supabaseServerMock = { createServerClient: jest.fn() }
jest.mock('../../lib/supabase-server', () => ({
  createServerClient: () => supabaseServerMock.createServerClient(),
}))

import { requireMembership } from '../../lib/auth'
import { notFound, redirect } from 'next/navigation'

const legacyPrivateGroup: Group = {
  id: 'g1', slug: 'summer-games', name: 'Summer Games',
  visibility: 'private', join_code: 'ABC123', owner_id: null,
}

const newPrivateGroup: Group = {
  id: 'g2', slug: 'robs-crew', name: "Rob's Crew",
  visibility: 'private', join_code: 'XYZ789', owner_id: 'owner-user-id',
}

beforeEach(() => {
  mockUser = null
  jest.clearAllMocks()
})

describe('requireMembership — legacy private groups (owner_id null)', () => {
  it('redirects an unauthenticated visitor to sign-in instead of 404', async () => {
    supabaseServerMock.createServerClient.mockReturnValue(
      mockSupabaseServer({ group: legacyPrivateGroup, member: null })
    )

    await expect(requireMembership('summer-games')).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/signin?next=/g/summer-games')
    expect(notFound).not.toHaveBeenCalled()
  })

  it('auto-provisions membership for a signed-in visitor with no member row', async () => {
    mockUser = { id: 'user-1' }
    supabaseServerMock.createServerClient.mockReturnValue(
      mockSupabaseServer({
        group: legacyPrivateGroup,
        member: null,
        insertedMember: { id: 'm1', role: 'member', player_id: null },
      })
    )

    const result = await requireMembership('summer-games')

    expect(notFound).not.toHaveBeenCalled()
    expect(result.member).toEqual({ id: 'm1', role: 'member', player_id: null })
  })
})

describe('requireMembership — new private groups (owner_id set)', () => {
  it('still 404s an unauthenticated visitor', async () => {
    supabaseServerMock.createServerClient.mockReturnValue(
      mockSupabaseServer({ group: newPrivateGroup, member: null })
    )

    await expect(requireMembership('robs-crew')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('still 404s a signed-in visitor who is not a member', async () => {
    mockUser = { id: 'user-1' }
    supabaseServerMock.createServerClient.mockReturnValue(
      mockSupabaseServer({ group: newPrivateGroup, member: null })
    )

    await expect(requireMembership('robs-crew')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
