import CornholeIcon from './CornholeIcon'
import SpikeballIcon from './SpikeballIcon'
import PoolIcon from './PoolIcon'
import PokerIcon from './PokerIcon'

const emojiMap: Record<string, string> = {
  pong: '🏓',
  'beer-die': '🎲',
  hearts: '♥',
}

export default function GameIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'cornhole') return <CornholeIcon className={className} />
  if (type === 'spikeball') return <SpikeballIcon className={className} />
  if (type === 'pool') return <PoolIcon className={className} />
  if (type === 'poker') return <PokerIcon className={className} />
  return <span className={className}>{emojiMap[type] ?? '🎮'}</span>
}
