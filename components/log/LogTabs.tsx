'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'
import CornholeForm from './CornholeForm'
import SpikeballForm from './SpikeballForm'
import GameIcon from '../icons/GameIcon'

type Tab = 'pong' | 'beer-die' | 'hearts' | 'cornhole' | 'spikeball'

const tabs: { id: Tab; label: ReactNode }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
  { id: 'cornhole', label: <><GameIcon type="cornhole" className="inline w-4 h-4 mr-1 align-middle" /> Cornhole</> },
  { id: 'spikeball', label: <><GameIcon type="spikeball" className="inline w-4 h-4 mr-1 align-middle" /> Spikeball</> },
]

export default function LogTabs({ players }: { players: User[] }) {
  const [active, setActive] = useState<Tab>('pong')

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-5 py-2 rounded-full font-black text-sm transition-colors uppercase tracking-wide ${
              active === t.id ? 'bg-win text-white' : 'bg-card text-muted hover:text-stone-900 border border-warm'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'pong' && <PongForm players={players} />}
      {active === 'beer-die' && <BeerDieForm players={players} />}
      {active === 'hearts' && <HeartsForm players={players} />}
      {active === 'cornhole' && <CornholeForm players={players} />}
      {active === 'spikeball' && <SpikeballForm players={players} />}
    </div>
  )
}
