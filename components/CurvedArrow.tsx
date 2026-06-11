'use client'
import { useEffect, useState } from 'react'

export default function CurvedArrow({ fromId, toId }: { fromId: string; toId: string }) {
  const [d, setD] = useState('')

  useEffect(() => {
    function calc() {
      const fromEl = document.getElementById(fromId)
      const toEl = document.getElementById(toId)
      const svg = document.getElementById('curved-arrow-svg')
      if (!fromEl || !toEl || !svg) return
      const parent = svg.parentElement
      if (!parent) return

      const pRect = parent.getBoundingClientRect()
      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()

      const sx = fromRect.left - pRect.left + fromRect.width / 2
      const sy = fromRect.bottom - pRect.top
      const ex = toRect.left - pRect.left - 18
      const ey = toRect.top - pRect.top + toRect.height / 2

      const c1x = sx - 15
      const c1y = sy + (ey - sy) * 0.6
      const c2x = ex - 40
      const c2y = ey - 6

      setD(`M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`)
    }

    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [fromId, toId])

  if (!d) return null

  return (
    <svg
      id="curved-arrow-svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <marker id="curved-arrowhead" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#f97316" />
        </marker>
      </defs>
      <path
        d={d}
        stroke="#f97316"
        strokeWidth="2"
        fill="none"
        strokeDasharray="6,4"
        strokeLinecap="round"
        markerEnd="url(#curved-arrowhead)"
      />
    </svg>
  )
}
