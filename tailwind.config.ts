import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fffbf0',
        card: '#fff7ed',
        win: '#f97316',
        loss: '#ef4444',
        gold: '#eab308',
        brand: '#c2410c',
        muted: '#78716c',
        warm: '#f0e0b8',
      },
    },
  },
}

export default config
