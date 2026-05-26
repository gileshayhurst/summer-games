import {
  computePongLeaderboard,
  computePongHeadToHead,
  computeBeerDieLeaderboard,
  computeBeerDieHeadToHead,
  computeHeartsLeaderboard,
} from '../../lib/stats'
import { User, PongGamePlayer, BeerDieGame, HeartsGamePlayer } from '../../lib/types'

const users: User[] = [
  { id: 'u1', name: 'Giles', created_at: '2026-01-01' },
  { id: 'u2', name: 'Sherm', created_at: '2026-01-01' },
  { id: 'u3', name: 'Rob',   created_at: '2026-01-01' },
  { id: 'u4', name: 'Ant',   created_at: '2026-01-01' },
]

const pg = (id: string, cups: number) => ({ id, cups_left: cups, played_at: '2026-05-01T12:00:00Z' })

// ── Pong ──────────────────────────────────────────────────────────────────────

describe('computePongLeaderboard', () => {
  const gamePlayers: PongGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant — 3 cups left
    { game_id: 'g1', player_id: 'u1', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pong_games: pg('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm — 1 cup left
    { game_id: 'g2', player_id: 'u3', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pong_games: pg('g2', 1) },
    // g3: Giles+Sherm beat Rob+Ant — 2 cups left
    { game_id: 'g3', player_id: 'u1', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'loser',  pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pong_games: pg('g3', 2) },
  ]

  it('ranks by win rate descending', () => {
    const result = computePongLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')
    expect(result[0].wins).toBe(2)
    expect(result[0].losses).toBe(1)
    expect(result[0].cup_differential).toBe(5) // 3+2
    expect(result[2].win_rate).toBeCloseTo(0.333)
  })

  it('excludes players with 0 games', () => {
    expect(computePongLeaderboard(users, [])).toHaveLength(0)
  })
})

describe('computePongHeadToHead', () => {
  const gamePlayers: PongGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant
    { game_id: 'g1', player_id: 'u1', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pong_games: pg('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pong_games: pg('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm
    { game_id: 'g2', player_id: 'u3', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pong_games: pg('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pong_games: pg('g2', 1) },
    // g3: Giles+Rob teammates (should NOT count as h2h between them)
    { game_id: 'g3', player_id: 'u1', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'winner', pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'loser',  pong_games: pg('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pong_games: pg('g3', 2) },
  ]

  it('counts wins and losses between opponents', () => {
    const r = computePongHeadToHead('u1', 'u3', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })

  it('ignores games where they were teammates', () => {
    const r = computePongHeadToHead('u1', 'u3', [gamePlayers[8], gamePlayers[9], gamePlayers[10], gamePlayers[11]])
    expect(r.wins).toBe(0)
    expect(r.losses).toBe(0)
  })
})

// ── Beer Die ──────────────────────────────────────────────────────────────────

describe('computeBeerDieLeaderboard', () => {
  const games: BeerDieGame[] = [
    { id: 'g1', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 5, played_at: '2026-05-01T12:00:00Z' },
    { id: 'g2', winner1_id: 'u3', winner2_id: 'u4', loser1_id: 'u1', loser2_id: 'u2', points_differential: 3, played_at: '2026-05-02T12:00:00Z' },
  ]

  it('computes point differential correctly', () => {
    const result = computeBeerDieLeaderboard(users, games)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.wins).toBe(1)
    expect(giles.losses).toBe(1)
    expect(giles.point_differential).toBe(2) // +5 − 3
  })

  it('excludes players with 0 games', () => {
    expect(computeBeerDieLeaderboard(users, [])).toHaveLength(0)
  })
})

describe('computeBeerDieHeadToHead', () => {
  const games: BeerDieGame[] = [
    { id: 'g1', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 5, played_at: '2026-05-01T12:00:00Z' },
    { id: 'g2', winner1_id: 'u1', winner2_id: 'u2', loser1_id: 'u3', loser2_id: 'u4', points_differential: 2, played_at: '2026-05-02T12:00:00Z' },
    { id: 'g3', winner1_id: 'u1', winner2_id: 'u3', loser1_id: 'u2', loser2_id: 'u4', points_differential: 1, played_at: '2026-05-03T12:00:00Z' },
  ]

  it('counts opponent matchups only', () => {
    // g1+g2: Giles wins vs Rob. g3: Giles+Rob teammates → skip
    const r = computeBeerDieHeadToHead('u1', 'u3', games)
    expect(r.wins).toBe(2)
    expect(r.losses).toBe(0)
  })
})

// ── Hearts ────────────────────────────────────────────────────────────────────

describe('computeHeartsLeaderboard', () => {
  const gamePlayers: HeartsGamePlayer[] = [
    { game_id: 'g1', player_id: 'u1', lost: true,  hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g1', player_id: 'u2', lost: false, hearts_games: { id: 'g1', played_at: '2026-05-01T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u1', lost: false, hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g2', player_id: 'u2', lost: true,  hearts_games: { id: 'g2', played_at: '2026-05-02T12:00:00Z' } },
    { game_id: 'g3', player_id: 'u2', lost: true,  hearts_games: { id: 'g3', played_at: '2026-05-03T12:00:00Z' } },
  ]

  it('ranks by loss rate ascending', () => {
    const result = computeHeartsLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')   // 1/2 = 50%
    expect(result[1].name).toBe('Sherm')   // 2/3 = 67%
  })

  it('excludes players with 0 games', () => {
    expect(computeHeartsLeaderboard(users, [])).toHaveLength(0)
  })
})
