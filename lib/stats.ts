import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, CornholeLeaderboardEntry,
  SpikeballGamePlayer, SpikeballLeaderboardEntry,
  PoolGamePlayer, PoolLeaderboardEntry,
  PokerGamePlayer, PokerLeaderboardEntry,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'

const isVisible = (name: string) => !name.toLowerCase().startsWith('random')

export function computeStreaks(resultsOldestFirst: boolean[]): { current: number; max: number } {
  let running = 0
  let max = 0
  for (const isWin of resultsOldestFirst) {
    if (isWin) {
      running++
      max = Math.max(max, running)
    } else {
      running = 0
    }
  }
  return { current: running, max }
}

export function computePongLeaderboard(
  users: User[],
  gamePlayers: PongGamePlayer[]
): PongLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, cup_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.cup_diff += gp.pong_games.cups_left }
    else { s.losses++; s.cup_diff -= gp.pong_games.cups_left }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.pong_games.played_at })
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        cup_differential: s.cup_diff,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computePongHeadToHead(
  player1Id: string,
  player2Id: string,
  gamePlayers: PongGamePlayer[]
): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeBeerDieLeaderboard(
  users: User[],
  gamePlayers: BeerDieGamePlayer[],
  sinks: BeerDieSink[] = []
): BeerDieLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0, sinks: 0, self_sinks: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.beer_die_games.points_differential }
    else { s.losses++; s.point_diff -= gp.beer_die_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.beer_die_games.played_at })
  }

  for (const sink of sinks) {
    const s = stats.get(sink.player_id)
    if (!s) continue
    if (sink.type === 'sink') s.sinks++
    else if (sink.type === 'self_sink') s.self_sinks++
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        point_differential: s.point_diff,
        sinks: s.sinks,
        self_sinks: s.self_sinks,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeBeerDieHeadToHead(
  player1Id: string,
  player2Id: string,
  gamePlayers: BeerDieGamePlayer[]
): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeHeartsLeaderboard(
  users: User[],
  gamePlayers: HeartsGamePlayer[]
): HeartsLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { played: 0, losses: 0 }]))

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.played++
    if (gp.lost) s.losses++
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.played,
        losses: s.losses,
        loss_rate: s.played > 0 ? s.losses / s.played : 0,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => a.loss_rate - b.loss_rate || b.games_played - a.games_played)
}

export function computePongPartnerRecord(
  player1Id: string,
  player2Id: string,
  gamePlayers: PongGamePlayer[]
): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeBeerDiePartnerRecord(
  player1Id: string,
  player2Id: string,
  gamePlayers: BeerDieGamePlayer[]
): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeCornholeLeaderboard(
  users: User[],
  gamePlayers: CornholeGamePlayer[]
): CornholeLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.cornhole_games.points_differential }
    else { s.losses++; s.point_diff -= gp.cornhole_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.cornhole_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeCornholeHeadToHead(player1Id: string, player2Id: string, gamePlayers: CornholeGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeCornholePartnerRecord(player1Id: string, player2Id: string, gamePlayers: CornholeGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeSpikeballLeaderboard(
  users: User[],
  gamePlayers: SpikeballGamePlayer[]
): SpikeballLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.spikeball_games.points_differential }
    else { s.losses++; s.point_diff -= gp.spikeball_games.points_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.spikeball_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeSpikeballHeadToHead(player1Id: string, player2Id: string, gamePlayers: SpikeballGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computeSpikeballPartnerRecord(player1Id: string, player2Id: string, gamePlayers: SpikeballGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computePoolLeaderboard(
  users: User[],
  gamePlayers: PoolGamePlayer[]
): PoolLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, balls_diff: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.balls_diff += gp.pool_games.balls_differential }
    else { s.losses++; s.balls_diff -= gp.pool_games.balls_differential }

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.side === 'winner', played_at: gp.pool_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, balls_differential: s.balls_diff,
        current_streak: current, max_streak: max,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computePoolHeadToHead(player1Id: string, player2Id: string, gamePlayers: PoolGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.losers.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.winners.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computePoolPartnerRecord(player1Id: string, player2Id: string, gamePlayers: PoolGamePlayer[]): HeadToHeadResult {
  const gameMap = new Map<string, { winners: Set<string>; losers: Set<string> }>()
  for (const gp of gamePlayers) {
    if (!gameMap.has(gp.game_id)) gameMap.set(gp.game_id, { winners: new Set(), losers: new Set() })
    const g = gameMap.get(gp.game_id)!
    gp.side === 'winner' ? g.winners.add(gp.player_id) : g.losers.add(gp.player_id)
  }
  let wins = 0, losses = 0
  for (const g of Array.from(gameMap.values())) {
    if (g.winners.has(player1Id) && g.winners.has(player2Id)) wins++
    else if (g.losers.has(player1Id) && g.losers.has(player2Id)) losses++
  }
  return { wins, losses }
}

export function computePokerLeaderboard(
  users: User[],
  gamePlayers: PokerGamePlayer[]
): PokerLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { games_played: 0, total_profit_cents: 0, win_sessions: 0 }]))
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.games_played++
    s.total_profit_cents += gp.amount_cents
    if (gp.amount_cents > 0) s.win_sessions++

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.amount_cents > 0, played_at: gp.poker_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.games_played,
        total_profit_cents: s.total_profit_cents,
        win_sessions: s.win_sessions,
        win_rate: s.games_played > 0 ? s.win_sessions / s.games_played : 0,
        current_streak: current,
        max_streak: max,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => b.total_profit_cents - a.total_profit_cents)
}
