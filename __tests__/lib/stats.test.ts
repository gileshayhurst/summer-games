import {
  computePongLeaderboard,
  computePongHeadToHead,
  computeBeerDieLeaderboard,
  computeBeerDieHeadToHead,
  computeHeartsLeaderboard,
  computePoolLeaderboard,
  computePoolHeadToHead,
  computePoolPartnerRecord,
  computePokerLeaderboard,
  computeStreaks,
} from '../../lib/stats'
import { User, PongGamePlayer, BeerDieGame, HeartsGamePlayer, PoolGamePlayer, PokerGamePlayer } from '../../lib/types'

describe('computeStreaks', () => {
  it('returns 0/0 for no games', () => {
    expect(computeStreaks([])).toEqual({ current: 0, max: 0 })
  })

  it('returns the full length when every game is a win', () => {
    expect(computeStreaks([true, true, true])).toEqual({ current: 3, max: 3 })
  })

  it('returns 0/0 when every game is a loss', () => {
    expect(computeStreaks([false, false])).toEqual({ current: 0, max: 0 })
  })

  it('current streak only counts the trailing run; max looks at the whole history', () => {
    // oldest → newest: W W W L W  →  current streak is 1 (just the last game),
    // max streak is 3 (the run at the start)
    expect(computeStreaks([true, true, true, false, true])).toEqual({ current: 1, max: 3 })
  })

  it('current streak equals max streak when the trailing run is the longest', () => {
    expect(computeStreaks([false, true, true])).toEqual({ current: 2, max: 2 })
  })
})

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

  it('computes current_streak and max_streak', () => {
    // u1 (Giles): g1 win, g2 loss, g3 win → current streak 1, max streak 1
    const result = computePongLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)
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

describe('computeBeerDieLeaderboard — streaks', () => {
  const bdg = (id: string, at: string) => ({ id, points_differential: 5, played_at: at })

  const mkGP = (gameId: string, playerId: string, side: 'winner' | 'loser', at: string) => ({
    game_id: gameId,
    player_id: playerId,
    side,
    beer_die_games: bdg(gameId, at),
  })

  it('returns empty for a group with no games', () => {
    const result = computeBeerDieLeaderboard(users, [], [])
    expect(result).toHaveLength(0)
  })

  it('counts consecutive wins at the end of game history as current_streak', () => {
    // u1: loss (g1), win (g2), win (g3), win (g4) → current streak 3, max streak 3
    const gamePlayers = [
      mkGP('g1', 'u1', 'loser',  '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g2', 'u1', 'winner', '2026-05-02T12:00:00Z'),
      mkGP('g2', 'u2', 'loser',  '2026-05-02T12:00:00Z'),
      mkGP('g3', 'u1', 'winner', '2026-05-03T12:00:00Z'),
      mkGP('g3', 'u2', 'loser',  '2026-05-03T12:00:00Z'),
      mkGP('g4', 'u1', 'winner', '2026-05-04T12:00:00Z'),
      mkGP('g4', 'u2', 'loser',  '2026-05-04T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(3)
    expect(u1.max_streak).toBe(3)
  })

  it('returns 0 current_streak when most recent game was a loss, but keeps the historical max_streak', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
      mkGP('g2', 'u1', 'winner', '2026-05-02T12:00:00Z'),
      mkGP('g2', 'u2', 'loser',  '2026-05-02T12:00:00Z'),
      mkGP('g3', 'u1', 'loser',  '2026-05-03T12:00:00Z'),
      mkGP('g3', 'u2', 'winner', '2026-05-03T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(0)
    expect(u1.max_streak).toBe(2)
  })

  it('counts a single win as a streak of 1', () => {
    const gamePlayers = [
      mkGP('g1', 'u1', 'winner', '2026-05-01T12:00:00Z'),
      mkGP('g1', 'u2', 'loser',  '2026-05-01T12:00:00Z'),
    ]
    const result = computeBeerDieLeaderboard(users, gamePlayers, [])
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(1)
    expect(u1.max_streak).toBe(1)
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

  it('computes current_streak and max_streak based on not losing', () => {
    // Giles (u1): g1 lost=true (loss), g2 lost=false (win) → current streak 1, max streak 1
    const result = computeHeartsLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.current_streak).toBe(1)
    expect(giles.max_streak).toBe(1)

    // Sherm (u2): g1 lost=false (win), g2 lost=true (loss), g3 lost=true (loss) → current streak 0, max streak 1
    const sherm = result.find(e => e.name === 'Sherm')!
    expect(sherm.current_streak).toBe(0)
    expect(sherm.max_streak).toBe(1)
  })
})

// ── Pool ──────────────────────────────────────────────────────────────────────

const pg2 = (id: string, balls: number) => ({ id, balls_differential: balls, played_at: '2026-06-01T12:00:00Z' })

describe('computePoolLeaderboard', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant by 3
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pool_games: pg2('g1', 3) },
    // g2: Rob+Ant beat Giles+Sherm by 1
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pool_games: pg2('g2', 1) },
    // g3: Giles+Sherm beat Rob+Ant by 2
    { game_id: 'g3', player_id: 'u1', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'loser',  pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u4', side: 'loser',  pool_games: pg2('g3', 2) },
  ]

  it('ranks by win rate descending', () => {
    const result = computePoolLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Giles')
    expect(result[0].wins).toBe(2)
    expect(result[0].losses).toBe(1)
    expect(result[0].balls_differential).toBe(4) // +3+2-1
  })

  it('excludes players with 0 games', () => {
    expect(computePoolLeaderboard(users, [])).toHaveLength(0)
  })

  it('computes current_streak and max_streak using distinct game dates', () => {
    const mkPoolGP = (gameId: string, playerId: string, side: 'winner' | 'loser', at: string) => ({
      game_id: gameId,
      player_id: playerId,
      side,
      pool_games: { id: gameId, balls_differential: 2, played_at: at },
    })
    // u1: win (g1, oldest), win (g2), loss (g3), win (g4, newest)
    // → current_streak = 1 (just g4), max_streak = 2 (g1+g2)
    const gamePlayers = [
      mkPoolGP('g1', 'u1', 'winner', '2026-06-01T12:00:00Z'),
      mkPoolGP('g1', 'u2', 'loser',  '2026-06-01T12:00:00Z'),
      mkPoolGP('g2', 'u1', 'winner', '2026-06-02T12:00:00Z'),
      mkPoolGP('g2', 'u2', 'loser',  '2026-06-02T12:00:00Z'),
      mkPoolGP('g3', 'u1', 'loser',  '2026-06-03T12:00:00Z'),
      mkPoolGP('g3', 'u2', 'winner', '2026-06-03T12:00:00Z'),
      mkPoolGP('g4', 'u1', 'winner', '2026-06-04T12:00:00Z'),
      mkPoolGP('g4', 'u2', 'loser',  '2026-06-04T12:00:00Z'),
    ]
    const result = computePoolLeaderboard(users, gamePlayers)
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(1)
    expect(u1.max_streak).toBe(2)
  })
})

describe('computePoolHeadToHead', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles beats Rob
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 3) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 3) },
    // g2: Rob beats Giles
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    // g3: Giles+Rob on same team — should NOT count as h2h
    { game_id: 'g3', player_id: 'u1', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u3', side: 'winner', pool_games: pg2('g3', 2) },
    { game_id: 'g3', player_id: 'u2', side: 'loser',  pool_games: pg2('g3', 2) },
  ]

  it('counts wins and losses between opponents', () => {
    const r = computePoolHeadToHead('u1', 'u3', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })

  it('ignores games where they were teammates', () => {
    const r = computePoolHeadToHead('u1', 'u3', gamePlayers.slice(4))
    expect(r.wins).toBe(0)
    expect(r.losses).toBe(0)
  })
})

describe('computePoolPartnerRecord', () => {
  const gamePlayers: PoolGamePlayer[] = [
    // g1: Giles+Sherm beat Rob+Ant
    { game_id: 'g1', player_id: 'u1', side: 'winner', pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u2', side: 'winner', pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u3', side: 'loser',  pool_games: pg2('g1', 2) },
    { game_id: 'g1', player_id: 'u4', side: 'loser',  pool_games: pg2('g1', 2) },
    // g2: Giles+Sherm lose
    { game_id: 'g2', player_id: 'u3', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u4', side: 'winner', pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u1', side: 'loser',  pool_games: pg2('g2', 1) },
    { game_id: 'g2', player_id: 'u2', side: 'loser',  pool_games: pg2('g2', 1) },
  ]

  it('counts wins and losses when partnered together', () => {
    const r = computePoolPartnerRecord('u1', 'u2', gamePlayers)
    expect(r.wins).toBe(1)
    expect(r.losses).toBe(1)
  })
})

// ── Poker ─────────────────────────────────────────────────────────────────────

const pk = (id: string) => ({ id, played_at: '2026-06-18T12:00:00Z' })

describe('computePokerLeaderboard', () => {
  const gamePlayers: PokerGamePlayer[] = [
    // g1: Giles +$40, Sherm -$20, Rob -$20
    { game_id: 'g1', player_id: 'u1', amount_cents: 4000,  poker_games: pk('g1') },
    { game_id: 'g1', player_id: 'u2', amount_cents: -2000, poker_games: pk('g1') },
    { game_id: 'g1', player_id: 'u3', amount_cents: -2000, poker_games: pk('g1') },
    // g2: Sherm +$60, Giles -$30, Rob -$30
    { game_id: 'g2', player_id: 'u2', amount_cents: 6000,  poker_games: pk('g2') },
    { game_id: 'g2', player_id: 'u1', amount_cents: -3000, poker_games: pk('g2') },
    { game_id: 'g2', player_id: 'u3', amount_cents: -3000, poker_games: pk('g2') },
  ]
  // Sherm: 6000-2000 = +4000 (+$40)
  // Giles: 4000-3000 = +1000 (+$10)
  // Rob:  -2000-3000 = -5000 (-$50)

  it('ranks by total_profit_cents descending', () => {
    const result = computePokerLeaderboard(users, gamePlayers)
    expect(result[0].name).toBe('Sherm')
    expect(result[0].total_profit_cents).toBe(4000)
    expect(result[1].name).toBe('Giles')
    expect(result[1].total_profit_cents).toBe(1000)
    expect(result[2].name).toBe('Rob')
    expect(result[2].total_profit_cents).toBe(-5000)
  })

  it('counts games_played and win_sessions correctly', () => {
    const result = computePokerLeaderboard(users, gamePlayers)
    const giles = result.find(e => e.name === 'Giles')!
    expect(giles.games_played).toBe(2)
    expect(giles.win_sessions).toBe(1)
    expect(giles.win_rate).toBeCloseTo(0.5)
  })

  it('excludes players with 0 games', () => {
    expect(computePokerLeaderboard(users, [])).toHaveLength(0)
  })

  it('computes current_streak and max_streak based on profitable sessions, using distinct game dates', () => {
    const mkPokerGP = (gameId: string, playerId: string, amountCents: number, at: string) => ({
      game_id: gameId,
      player_id: playerId,
      amount_cents: amountCents,
      poker_games: { id: gameId, played_at: at },
    })
    // u1 (Giles): +$10 (win, g1, oldest), +$20 (win, g2), -$5 (loss, g3), +$15 (win, g4, newest)
    // → current_streak = 1 (just g4), max_streak = 2 (g1+g2)
    const gamePlayers = [
      mkPokerGP('g1', 'u1', 1000,  '2026-07-01T12:00:00Z'),
      mkPokerGP('g2', 'u1', 2000,  '2026-07-02T12:00:00Z'),
      mkPokerGP('g3', 'u1', -500,  '2026-07-03T12:00:00Z'),
      mkPokerGP('g4', 'u1', 1500,  '2026-07-04T12:00:00Z'),
    ]
    const result = computePokerLeaderboard(users, gamePlayers)
    const u1 = result.find(e => e.player_id === 'u1')!
    expect(u1.current_streak).toBe(1)
    expect(u1.max_streak).toBe(2)
  })
})
