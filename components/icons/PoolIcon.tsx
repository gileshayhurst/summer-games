export default function PoolIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="pool-ball" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#525252" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <radialGradient id="pool-shine" cx="35%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="24" fill="url(#pool-ball)" />
      <circle cx="28" cy="28" r="24" fill="url(#pool-shine)" />
      <circle cx="28" cy="28" r="10" fill="white" />
      <text
        x="28" y="32"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#0a0a0a"
      >8</text>
    </svg>
  )
}
