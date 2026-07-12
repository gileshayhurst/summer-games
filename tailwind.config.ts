import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        win: 'var(--color-win)',
        'win-ink': 'var(--color-win-ink)',
        ink: 'var(--color-ink)',
        loss: 'var(--color-loss)',
        'loss-ink': 'var(--color-loss-ink)',
        gold: 'var(--color-gold)',
        brand: 'var(--color-brand)',
        muted: 'var(--color-muted)',
        warm: 'var(--color-warm)',
        forest: 'var(--color-forest)',
      },
    },
  },
}

export default config
