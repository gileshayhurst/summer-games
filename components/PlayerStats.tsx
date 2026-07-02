import {
  computePongLeaderboard, computeBeerDieLeaderboard, computeHeartsLeaderboard,
  computeCornholeLeaderboard, computeSpikeballLeaderboard, computePoolLeaderboard, computePokerLeaderboard,
} from '@/lib/stats'
import {
  getLeaderboardRank, mergeRecentActivity, formatSideResult, formatHeartsResult,
  formatPokerResult, formatStreak, sortCardsByPlayed, ActivityItem,
} from '@/lib/dashboard'
import {
  User, PongGamePlayer, BeerDieGamePlayer, BeerDieSink, HeartsGamePlayer,
  CornholeGamePlayer, SpikeballGamePlayer, PoolGamePlayer, PokerGamePlayer,
} from '@/lib/types'
import StatCard from '@/components/StatCard'
import GameIcon from '@/components/icons/GameIcon'

function GameCard({
  gameType, name, rank, children,
}: {
  gameType: string
  name: string
  rank: { rank: number; total: number } | null
  children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-warm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GameIcon type={gameType} className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest text-stone-900">{name}</span>
        </div>
        {rank && <span className="text-[10px] font-black text-muted">#{rank.rank} of {rank.total}</span>}
      </div>
      {children}
    </div>
  )
}

function NoGamesYet() {
  return <p className="text-muted text-sm">No games yet</p>
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function PongCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePongLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="pong" name="Pong" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Cup Diff" value={signed(entry.cup_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function BeerDieCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeBeerDieLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="beer-die" name="Beer Die" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Sinks" value={String(entry.sinks)} />
          <StatCard label="Self Sinks" value={String(entry.self_sinks)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function CornholeCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeCornholeLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="cornhole" name="Cornhole" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function SpikeballCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeSpikeballLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="spikeball" name="Spikeball" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Pt Diff" value={signed(entry.point_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function PoolCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePoolLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="pool" name="Pool" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Wins" value={String(entry.wins)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Ball Diff" value={signed(entry.balls_differential)} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function PokerCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computePokerLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="poker" name="Poker" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Win%" value={`${(entry.win_rate * 100).toFixed(1)}%`} />
          <StatCard label="Profit" value={`${entry.total_profit_cents >= 0 ? '+' : '-'}$${(Math.abs(entry.total_profit_cents) / 100).toFixed(2)}`} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

function HeartsCard({
  entry, rank,
}: {
  entry: ReturnType<typeof computeHeartsLeaderboard>[number] | undefined
  rank: { rank: number; total: number } | null
}) {
  return (
    <GameCard gameType="hearts" name="Hearts" rank={rank}>
      {entry ? (
        <StatGrid>
          <StatCard label="Games" value={String(entry.games_played)} />
          <StatCard label="Losses" value={String(entry.losses)} />
          <StatCard label="Loss%" value={`${(entry.loss_rate * 100).toFixed(1)}%`} />
          <StatCard label="Streak" value={formatStreak(entry.current_streak)} />
          <StatCard label="Max Streak" value={formatStreak(entry.max_streak)} />
        </StatGrid>
      ) : <NoGamesYet />}
    </GameCard>
  )
}

export default function PlayerStats({
  playerId,
  users,
  pongPlayers,
  beerDiePlayers,
  beerDieSinks,
  heartsPlayers,
  cornholePlayers,
  spikeballPlayers,
  poolPlayers,
  pokerPlayers,
}: {
  playerId: string
  users: User[]
  pongPlayers: PongGamePlayer[]
  beerDiePlayers: BeerDieGamePlayer[]
  beerDieSinks: BeerDieSink[]
  heartsPlayers: HeartsGamePlayer[]
  cornholePlayers: CornholeGamePlayer[]
  spikeballPlayers: SpikeballGamePlayer[]
  poolPlayers: PoolGamePlayer[]
  pokerPlayers: PokerGamePlayer[]
}) {
  const pongLB = computePongLeaderboard(users, pongPlayers)
  const beerDieLB = computeBeerDieLeaderboard(users, beerDiePlayers, beerDieSinks)
  const heartsLB = computeHeartsLeaderboard(users, heartsPlayers)
  const cornholeLB = computeCornholeLeaderboard(users, cornholePlayers)
  const spikeballLB = computeSpikeballLeaderboard(users, spikeballPlayers)
  const poolLB = computePoolLeaderboard(users, poolPlayers)
  const pokerLB = computePokerLeaderboard(users, pokerPlayers)

  const pongEntry = pongLB.find(e => e.player_id === playerId)
  const beerDieEntry = beerDieLB.find(e => e.player_id === playerId)
  const heartsEntry = heartsLB.find(e => e.player_id === playerId)
  const cornholeEntry = cornholeLB.find(e => e.player_id === playerId)
  const spikeballEntry = spikeballLB.find(e => e.player_id === playerId)
  const poolEntry = poolLB.find(e => e.player_id === playerId)
  const pokerEntry = pokerLB.find(e => e.player_id === playerId)

  const activity = mergeRecentActivity([
    ...pongPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pong',
      id: gp.game_id,
      played_at: gp.pong_games.played_at,
      result: formatSideResult(gp.side, `${gp.pong_games.cups_left} cup${gp.pong_games.cups_left !== 1 ? 's' : ''} left`),
    })),
    ...beerDiePlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'beer-die',
      id: gp.game_id,
      played_at: gp.beer_die_games.played_at,
      result: formatSideResult(gp.side, `${gp.beer_die_games.points_differential} pt${gp.beer_die_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...cornholePlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'cornhole',
      id: gp.game_id,
      played_at: gp.cornhole_games.played_at,
      result: formatSideResult(gp.side, `${gp.cornhole_games.points_differential} pt${gp.cornhole_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...spikeballPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'spikeball',
      id: gp.game_id,
      played_at: gp.spikeball_games.played_at,
      result: formatSideResult(gp.side, `${gp.spikeball_games.points_differential} pt${gp.spikeball_games.points_differential !== 1 ? 's' : ''}`),
    })),
    ...poolPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'pool',
      id: gp.game_id,
      played_at: gp.pool_games.played_at,
      result: formatSideResult(gp.side, `${gp.pool_games.balls_differential} ball${gp.pool_games.balls_differential !== 1 ? 's' : ''}`),
    })),
    ...heartsPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'hearts',
      id: gp.game_id,
      played_at: gp.hearts_games.played_at,
      result: formatHeartsResult(gp.lost),
    })),
    ...pokerPlayers.filter(gp => gp.player_id === playerId).map((gp): ActivityItem => ({
      type: 'poker',
      id: gp.game_id,
      played_at: gp.poker_games.played_at,
      result: formatPokerResult(gp.amount_cents),
    })),
  ])

  const gameCards = [
    { key: 'pong', hasPlayed: !!pongEntry, node: <PongCard entry={pongEntry} rank={getLeaderboardRank(pongLB, playerId)} /> },
    { key: 'beer-die', hasPlayed: !!beerDieEntry, node: <BeerDieCard entry={beerDieEntry} rank={getLeaderboardRank(beerDieLB, playerId)} /> },
    { key: 'cornhole', hasPlayed: !!cornholeEntry, node: <CornholeCard entry={cornholeEntry} rank={getLeaderboardRank(cornholeLB, playerId)} /> },
    { key: 'spikeball', hasPlayed: !!spikeballEntry, node: <SpikeballCard entry={spikeballEntry} rank={getLeaderboardRank(spikeballLB, playerId)} /> },
    { key: 'pool', hasPlayed: !!poolEntry, node: <PoolCard entry={poolEntry} rank={getLeaderboardRank(poolLB, playerId)} /> },
    { key: 'poker', hasPlayed: !!pokerEntry, node: <PokerCard entry={pokerEntry} rank={getLeaderboardRank(pokerLB, playerId)} /> },
    { key: 'hearts', hasPlayed: !!heartsEntry, node: <HeartsCard entry={heartsEntry} rank={getLeaderboardRank(heartsLB, playerId)} /> },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortCardsByPlayed(gameCards).map(c => c.node)}
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-muted text-sm">No games yet — go log one!</p>
        ) : (
          <div className="space-y-2">
            {activity.map(a => (
              <div key={`${a.type}-${a.id}`} className="bg-card rounded-xl px-4 py-3 flex items-center gap-4 border border-warm">
                <GameIcon type={a.type} className="w-6 h-6 shrink-0" />
                <p className="flex-1 text-sm font-bold text-stone-900">{a.result}</p>
                <span className="text-xs text-muted shrink-0">
                  {new Date(a.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
