import {
  getLeaderboardRank,
  mergeRecentActivity,
  formatSideResult,
  formatHeartsResult,
  formatPokerResult,
  ActivityItem,
} from '../../lib/dashboard'

describe('getLeaderboardRank', () => {
  const leaderboard = [
    { player_id: 'u1' },
    { player_id: 'u2' },
    { player_id: 'u3' },
  ]

  it('returns 1-based rank and total for a player on the board', () => {
    expect(getLeaderboardRank(leaderboard, 'u2')).toEqual({ rank: 2, total: 3 })
  })

  it('returns null when the player has no entry', () => {
    expect(getLeaderboardRank(leaderboard, 'u9')).toBeNull()
  })
})

describe('mergeRecentActivity', () => {
  const item = (id: string, played_at: string): ActivityItem => ({
    type: 'pong',
    id,
    played_at,
    result: 'Won, 3 cups left',
  })

  it('sorts merged items by played_at descending', () => {
    const items = [item('a', '2026-05-01'), item('b', '2026-06-01'), item('c', '2026-05-15')]
    const result = mergeRecentActivity(items)
    expect(result.map(i => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('limits to the given count', () => {
    const items = Array.from({ length: 15 }, (_, i) =>
      item(`g${i}`, `2026-01-${String(i + 1).padStart(2, '0')}`)
    )
    expect(mergeRecentActivity(items, 10)).toHaveLength(10)
  })
})

describe('formatSideResult', () => {
  it('prefixes Won, for winners', () => {
    expect(formatSideResult('winner', '3 cups left')).toBe('Won, 3 cups left')
  })

  it('prefixes Lost, for losers', () => {
    expect(formatSideResult('loser', '5 pts')).toBe('Lost, 5 pts')
  })
})

describe('formatHeartsResult', () => {
  it('returns Lost when the player lost', () => {
    expect(formatHeartsResult(true)).toBe('Lost')
  })

  it('returns Played when the player did not lose', () => {
    expect(formatHeartsResult(false)).toBe('Played')
  })
})

describe('formatPokerResult', () => {
  it('formats a positive profit with a plus sign', () => {
    expect(formatPokerResult(1450)).toBe('+$14.50')
  })

  it('formats a loss with a minus sign', () => {
    expect(formatPokerResult(-320)).toBe('-$3.20')
  })
})
