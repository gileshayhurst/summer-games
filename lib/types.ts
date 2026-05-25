export type User = {
  id: string
  name: string
  created_at: string
}

export type PongGame = {
  id: string
  cups_left: number
  played_at: string
}

export type PongGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  pong_games: PongGame
}

export type BeerDieGame = {
  id: string
  winner1_id: string
  winner2_id: string
  loser1_id: string
  loser2_id: string
  points_differential: number
  played_at: string
}

export type HeartsGame = {
  id: string
  played_at: string
}

export type HeartsGamePlayer = {
  game_id: string
  player_id: string
  lost: boolean
  hearts_games: HeartsGame
}

export type PongLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  cup_differential: number
}

export type BeerDieLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
}

export type HeartsLeaderboardEntry = {
  player_id: string
  name: string
  games_played: number
  losses: number
  loss_rate: number
}

export type HeadToHeadResult = {
  wins: number
  losses: number
}

export type RecentPongGame = {
  type: 'pong'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  cups_left: number
}

export type RecentBeerDieGame = {
  type: 'beer-die'
  id: string
  played_at: string
  winner1: string
  winner2: string
  loser1: string
  loser2: string
  points_differential: number
}

export type RecentHeartsGame = {
  type: 'hearts'
  id: string
  played_at: string
  players: string[]
  loser: string
}

export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentHeartsGame
