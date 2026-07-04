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

export function computeStreaks(resultsOldestFirst: boolean[]): { current: number; max: number; currentLoss: number; maxLoss: number } {
  let running = 0
  let max = 0
  let runningLoss = 0
  let maxLoss = 0
  for (const isWin of resultsOldestFirst) {
    if (isWin) {
      running++
      max = Math.max(max, running)
      runningLoss = 0
    } else {
      runningLoss++
      maxLoss = Math.max(maxLoss, runningLoss)
      running = 0
    }
  }
  return { current: running, max, currentLoss: runningLoss, maxLoss }
}

function computeStreaksByPlayer<GP>(
  gamePlayers: GP[],
  playerId: (gp: GP) => string,
  isWin: (gp: GP) => boolean,
  playedAt: (gp: GP) => string
): Map<string, { current: number; max: number; currentLoss: number; maxLoss: number }> {
  const gamesByPlayer = new Map<string, GP[]>()
  for (const gp of gamePlayers) {
    const pid = playerId(gp)
    if (!gamesByPlayer.has(pid)) gamesByPlayer.set(pid, [])
    gamesByPlayer.get(pid)!.push(gp)
  }

  const streaksByPlayer = new Map<string, { current: number; max: number; currentLoss: number; maxLoss: number }>()
  for (const [pid, games] of gamesByPlayer) {
    const sorted = [...games].sort((a, b) => playedAt(a).localeCompare(playedAt(b)))
    streaksByPlayer.set(pid, computeStreaks(sorted.map(isWin)))
  }
  return streaksByPlayer
}

export function computePongLeaderboard(
  users: User[],
  gamePlayers: PongGamePlayer[]
): PongLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, cup_diff: 0 }]))

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.cup_diff += gp.pong_games.cups_left }
    else { s.losses++; s.cup_diff -= gp.pong_games.cups_left }
  }

  const streaksByPlayer = computeStreaksByPlayer(
    gamePlayers,
    gp => gp.player_id,
    gp => gp.side === 'winner',
    gp => gp.pong_games.played_at
  )

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        cup_differential: s.cup_diff,
        current_streak: current,
        max_streak: max,
        current_loss_streak: currentLoss,
        max_loss_streak: maxLoss,
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

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.beer_die_games.points_differential }
    else { s.losses++; s.point_diff -= gp.beer_die_games.points_differential }
  }

  const streaksByPlayer = computeStreaksByPlayer(
    gamePlayers,
    gp => gp.player_id,
    gp => gp.side === 'winner',
    gp => gp.beer_die_games.played_at
  )

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
      const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
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
        current_loss_streak: currentLoss,
        max_loss_streak: maxLoss,
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
  const gamesByPlayer = new Map<string, { isWin: boolean; played_at: string }[]>()

  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    s.played++
    if (gp.lost) s.losses++

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    // Hearts has no side/winner field either — it only tracks whether each player lost that round,
    // so "not losing" is the win condition for streak purposes
    gamesByPlayer.get(gp.player_id)!.push({ isWin: !gp.lost, played_at: gp.hearts_games.played_at })
  }

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const wins = s.played - s.losses
      const { current, max, currentLoss, maxLoss } = computeStreaks((gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at)).map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.played,
        wins,
        losses: s.losses,
        win_rate: s.played > 0 ? wins / s.played : 0,
        current_streak: current,
        max_streak: max,
        current_loss_streak: currentLoss,
        max_loss_streak: maxLoss,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.games_played - a.games_played)
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
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.cornhole_games.points_differential }
    else { s.losses++; s.point_diff -= gp.cornhole_games.points_differential }
  }
  const streaksByPlayer = computeStreaksByPlayer(
    gamePlayers,
    gp => gp.player_id,
    gp => gp.side === 'winner',
    gp => gp.cornhole_games.played_at
  )
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
        current_loss_streak: currentLoss, max_loss_streak: maxLoss,
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
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.point_diff += gp.spikeball_games.points_differential }
    else { s.losses++; s.point_diff -= gp.spikeball_games.points_differential }
  }
  const streaksByPlayer = computeStreaksByPlayer(
    gamePlayers,
    gp => gp.player_id,
    gp => gp.side === 'winner',
    gp => gp.spikeball_games.played_at
  )
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, point_differential: s.point_diff,
        current_streak: current, max_streak: max,
        current_loss_streak: currentLoss, max_loss_streak: maxLoss,
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
  for (const gp of gamePlayers) {
    const s = stats.get(gp.player_id)
    if (!s) continue
    if (gp.side === 'winner') { s.wins++; s.balls_diff += gp.pool_games.balls_differential }
    else { s.losses++; s.balls_diff -= gp.pool_games.balls_differential }
  }
  const streaksByPlayer = computeStreaksByPlayer(
    gamePlayers,
    gp => gp.player_id,
    gp => gp.side === 'winner',
    gp => gp.pool_games.played_at
  )
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      const { current, max, currentLoss, maxLoss } = streaksByPlayer.get(u.id) ?? { current: 0, max: 0, currentLoss: 0, maxLoss: 0 }
      return {
        player_id: u.id, name: u.name, wins: s.wins, losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0, balls_differential: s.balls_diff,
        current_streak: current, max_streak: max,
        current_loss_streak: currentLoss, max_loss_streak: maxLoss,
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
    // Poker has no side/winner field — profit is the outcome, so a "win" is a profitable session
    if (gp.amount_cents > 0) s.win_sessions++

    if (!gamesByPlayer.has(gp.player_id)) gamesByPlayer.set(gp.player_id, [])
    gamesByPlayer.get(gp.player_id)!.push({ isWin: gp.amount_cents > 0, played_at: gp.poker_games.played_at })
  }
  return users
    .map(u => {
      const s = stats.get(u.id)!
      const games = (gamesByPlayer.get(u.id) ?? []).sort((a, b) => a.played_at.localeCompare(b.played_at))
      const { current, max, currentLoss, maxLoss } = computeStreaks(games.map(g => g.isWin))
      return {
        player_id: u.id,
        name: u.name,
        games_played: s.games_played,
        total_profit_cents: s.total_profit_cents,
        win_sessions: s.win_sessions,
        win_rate: s.games_played > 0 ? s.win_sessions / s.games_played : 0,
        current_streak: current,
        max_streak: max,
        current_loss_streak: currentLoss,
        max_loss_streak: maxLoss,
      }
    })
    .filter(e => e.games_played > 0 && isVisible(e.name))
    .sort((a, b) => b.total_profit_cents - a.total_profit_cents)
}

export function topStreaks<E extends { name: string; current_streak: number }>(
  entries: E[],
  winsOf: (e: E) => number
): { name: string; streak: number }[] {
  return entries
    .filter(e => e.current_streak >= 3)
    .sort((a, b) => b.current_streak - a.current_streak || winsOf(b) - winsOf(a))
    .slice(0, 3)
    .map(e => ({ name: e.name, streak: e.current_streak }))
}

export function topLossStreaks<E extends { name: string; current_loss_streak: number }>(
  entries: E[],
  lossesOf: (e: E) => number
): { name: string; streak: number }[] {
  return entries
    .filter(e => e.current_loss_streak >= 3)
    .sort((a, b) => b.current_loss_streak - a.current_loss_streak || lossesOf(b) - lossesOf(a))
    .slice(0, 3)
    .map(e => ({ name: e.name, streak: e.current_loss_streak }))
}
