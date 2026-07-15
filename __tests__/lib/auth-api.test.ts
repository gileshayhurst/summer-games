/**
 * @jest-environment node
 */
// Covers the API authorization helpers added in the security remediation:
// requireGroupAdmin, canReadGroup, and authorizeGameMutation.
// Runs in the node environment because authorizeGameMutation imports next/server,
// which needs runtime web globals (Request/Response) absent under jsdom.

let mockUser: { id: string } | null = null

jest.mock('next/headers', () => ({
  cookies: () => ({ getAll: () => [], set: () => {} }),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
  }),
}))

// Mutable state the mocked DB reads from, reset per test.
const db: {
  gameGroupId: string | null
  groupVisibility: string | null
  member: { id: string; role: string; player_id: string | null } | null
} = { gameGroupId: null, groupVisibility: null, member: null }

jest.mock('../../lib/supabase-server', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      if (table === 'groups') {
        return { select: () => ({ eq: () => ({ single: async () => ({
          data: db.groupVisibility ? { visibility: db.groupVisibility } : null,
        }) }) }) }
      }
      if (table === 'group_members') {
        return { select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({
          data: db.member,
        }) }) }) }) }
      }
      // any *_games table
      return { select: () => ({ eq: () => ({ single: async () => ({
        data: db.gameGroupId ? { group_id: db.gameGroupId } : null,
      }) }) }) }
    },
  }),
}))

import { requireGroupAdmin, canReadGroup } from '../../lib/auth'
import { authorizeGameMutation } from '../../lib/api-auth'

beforeEach(() => {
  mockUser = null
  db.gameGroupId = null
  db.groupVisibility = null
  db.member = null
})

describe('requireGroupAdmin', () => {
  it('returns null for a plain member', async () => {
    mockUser = { id: 'u1' }
    db.member = { id: 'm1', role: 'member', player_id: null }
    expect(await requireGroupAdmin('g1')).toBeNull()
  })

  it('returns null when unauthenticated', async () => {
    db.member = { id: 'm1', role: 'owner', player_id: null }
    expect(await requireGroupAdmin('g1')).toBeNull()
  })

  it('returns the member for an admin', async () => {
    mockUser = { id: 'u1' }
    db.member = { id: 'm1', role: 'admin', player_id: null }
    expect(await requireGroupAdmin('g1')).toEqual({ id: 'm1', role: 'admin', player_id: null })
  })

  it('returns the member for an owner', async () => {
    mockUser = { id: 'u1' }
    db.member = { id: 'm1', role: 'owner', player_id: null }
    expect(await requireGroupAdmin('g1')).toEqual({ id: 'm1', role: 'owner', player_id: null })
  })
})

describe('canReadGroup', () => {
  it('allows a non-member to read a public group', async () => {
    db.groupVisibility = 'public'
    db.member = null
    expect(await canReadGroup('g1')).toBe(true)
  })

  it('denies a non-member on a private group', async () => {
    mockUser = { id: 'u1' }
    db.groupVisibility = 'private'
    db.member = null
    expect(await canReadGroup('g1')).toBe(false)
  })

  it('allows a member on a private group', async () => {
    mockUser = { id: 'u1' }
    db.groupVisibility = 'private'
    db.member = { id: 'm1', role: 'member', player_id: null }
    expect(await canReadGroup('g1')).toBe(true)
  })

  it('denies when the group does not exist', async () => {
    db.groupVisibility = null
    expect(await canReadGroup('nope')).toBe(false)
  })
})

describe('authorizeGameMutation', () => {
  it('403s an unauthenticated caller', async () => {
    db.gameGroupId = 'g1'
    db.member = null
    const result = await authorizeGameMutation('pong_games', 'game1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('403s a plain member', async () => {
    mockUser = { id: 'u1' }
    db.gameGroupId = 'g1'
    db.member = { id: 'm1', role: 'member', player_id: null }
    const result = await authorizeGameMutation('pong_games', 'game1')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('404s when the game does not exist', async () => {
    mockUser = { id: 'u1' }
    db.gameGroupId = null
    db.member = { id: 'm1', role: 'owner', player_id: null }
    const result = await authorizeGameMutation('pong_games', 'missing')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(404)
  })

  it('authorizes an admin and returns the game\'s own group id', async () => {
    mockUser = { id: 'u1' }
    db.gameGroupId = 'g-from-record'
    db.member = { id: 'm1', role: 'admin', player_id: null }
    const result = await authorizeGameMutation('pong_games', 'game1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.groupId).toBe('g-from-record')
  })
})
