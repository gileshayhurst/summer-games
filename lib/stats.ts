import {
  User, PongGamePlayer, BeerDieGame, BeerDieSink, HeartsGamePlayer,
  PongLeaderboardEntry, BeerDieLeaderboardEntry, HeartsLeaderboardEntry,
  HeadToHeadResult,
} from './types'

const isVisible = (name: string) => !name.toLowerCase().startsWith('random')

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

  return users
    .map(u => {
      const s = stats.get(u.id)!
      const total = s.wins + s.losses
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        cup_differential: s.cup_diff,
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
  games: BeerDieGame[],
  sinks: BeerDieSink[] = []
): BeerDieLeaderboardEntry[] {
  const stats = new Map(users.map(u => [u.id, { wins: 0, losses: 0, point_diff: 0, sinks: 0, self_sinks: 0 }]))

  for (const g of games) {
    for (const id of [g.winner1_id, g.winner2_id]) {
      const s = stats.get(id)
      if (s) { s.wins++; s.point_diff += g.points_differential }
    }
    for (const id of [g.loser1_id, g.loser2_id]) {
      const s = stats.get(id)
      if (s) { s.losses++; s.point_diff -= g.points_differential }
    }
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
      return {
        player_id: u.id,
        name: u.name,
        wins: s.wins,
        losses: s.losses,
        win_rate: total > 0 ? s.wins / total : 0,
        point_differential: s.point_diff,
        sinks: s.sinks,
        self_sinks: s.self_sinks,
      }
    })
    .filter(e => e.wins + e.losses > 0 && isVisible(e.name))
    .sort((a, b) => b.win_rate - a.win_rate || b.wins - a.wins)
}

export function computeBeerDieHeadToHead(
  player1Id: string,
  player2Id: string,
  games: BeerDieGame[]
): HeadToHeadResult {
  let wins = 0, losses = 0
  for (const g of games) {
    const w = [g.winner1_id, g.winner2_id]
    const l = [g.loser1_id, g.loser2_id]
    if (w.includes(player1Id) && l.includes(player2Id)) wins++
    else if (l.includes(player1Id) && w.includes(player2Id)) losses++
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
  games: BeerDieGame[]
): HeadToHeadResult {
  let wins = 0, losses = 0
  for (const g of games) {
    const w = [g.winner1_id, g.winner2_id]
    const l = [g.loser1_id, g.loser2_id]
    if (w.includes(player1Id) && w.includes(player2Id)) wins++
    else if (l.includes(player1Id) && l.includes(player2Id)) losses++
  }
  return { wins, losses }
}
