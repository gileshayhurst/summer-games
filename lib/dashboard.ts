export type ActivityItem = {
  type: 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball' | 'pool' | 'poker'
  id: string
  played_at: string
  result: string
}

export function getLeaderboardRank(
  leaderboard: { player_id: string }[],
  playerId: string
): { rank: number; total: number } | null {
  const index = leaderboard.findIndex(e => e.player_id === playerId)
  if (index === -1) return null
  return { rank: index + 1, total: leaderboard.length }
}

export function mergeRecentActivity(items: ActivityItem[], limit = 10): ActivityItem[] {
  return [...items]
    .sort((a, b) => b.played_at.localeCompare(a.played_at))
    .slice(0, limit)
}

export function formatSideResult(side: 'winner' | 'loser', detail: string): string {
  return `${side === 'winner' ? 'Won' : 'Lost'}, ${detail}`
}

export function formatHeartsResult(lost: boolean): string {
  return lost ? 'Lost' : 'Played'
}

export function formatPokerResult(amountCents: number): string {
  const dollars = (Math.abs(amountCents) / 100).toFixed(2)
  return amountCents >= 0 ? `+$${dollars}` : `-$${dollars}`
}

export function formatStreak(value: number): string {
  return value >= 3 ? `🔥${value}` : String(value)
}

export function formatLossStreak(value: number): string {
  return value >= 3 ? `😂${value}` : String(value)
}

export function sortCardsByPlayed<T extends { hasPlayed: boolean }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => Number(b.hasPlayed) - Number(a.hasPlayed))
}
