import CornholeIcon from './CornholeIcon'
import SpikeballIcon from './SpikeballIcon'

const emojiMap: Record<string, string> = {
  pong: '🏓',
  'beer-die': '🎲',
  hearts: '♥',
}

export default function GameIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'cornhole') return <CornholeIcon className={className} />
  if (type === 'spikeball') return <SpikeballIcon className={className} />
  return <span className={className}>{emojiMap[type] ?? '🎮'}</span>
}
