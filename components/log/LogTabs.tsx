'use client'
import { useState } from 'react'
import { User } from '@/lib/types'
import PongForm from './PongForm'
import BeerDieForm from './BeerDieForm'
import HeartsForm from './HeartsForm'

type Tab = 'pong' | 'beer-die' | 'hearts'

const tabs: { id: Tab; label: string }[] = [
  { id: 'pong', label: '🏓 Pong' },
  { id: 'beer-die', label: '🎲 Beer Die' },
  { id: 'hearts', label: '♥ Hearts' },
]

export default function LogTabs({ players }: { players: User[] }) {
  const [active, setActive] = useState<Tab>('pong')

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
              active === t.id ? 'bg-win text-black' : 'bg-card text-slate-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {active === 'pong' && <PongForm players={players} />}
      {active === 'beer-die' && <BeerDieForm players={players} />}
      {active === 'hearts' && <HeartsForm players={players} />}
    </div>
  )
}
