import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        card: '#1e293b',
        win: '#22c55e',
        loss: '#ef4444',
        gold: '#f59e0b',
      },
    },
  },
}

export default config
