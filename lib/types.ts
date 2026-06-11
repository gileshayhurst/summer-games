export type Group = {
  id: string
  slug: string
  name: string
  pin: string
  premium: boolean
  created_at: string
}

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
  points_differential: number
  played_at: string
}

export type BeerDieGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  beer_die_games: BeerDieGame
}

export type CornholeGame = {
  id: string
  points_differential: number
  played_at: string
}

export type CornholeGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  cornhole_games: CornholeGame
}

export type SpikeballGame = {
  id: string
  points_differential: number
  played_at: string
}

export type SpikeballGamePlayer = {
  game_id: string
  player_id: string
  side: 'winner' | 'loser'
  spikeball_games: SpikeballGame
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

export type BeerDieSink = {
  id: string
  game_id: string
  player_id: string
  type: 'sink' | 'self_sink'
}

export type BeerDieLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
  sinks: number
  self_sinks: number
}

export type CornholeLeaderboardEntry = {
  player_id: string
  name: string
  wins: number
  losses: number
  win_rate: number
  point_differential: number
}

export type SpikeballLeaderboardEntry = {
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
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentCornholeGame = {
  type: 'cornhole'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentSpikeballGame = {
  type: 'spikeball'
  id: string
  played_at: string
  winners: string[]
  losers: string[]
  points_differential: number
}

export type RecentHeartsGame = {
  type: 'hearts'
  id: string
  played_at: string
  players: string[]
  loser: string
}

export type RecentGame = RecentPongGame | RecentBeerDieGame | RecentCornholeGame | RecentSpikeballGame | RecentHeartsGame
