export default function SpikeballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sb-grad" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="22" r="19" fill="url(#sb-grad)" />
      <ellipse cx="28" cy="47" rx="17" ry="4" fill="none" stroke="#737373" strokeWidth="2.5" />
      <line x1="11" y1="47" x2="45" y2="47" stroke="#a3a3a3" strokeWidth="1.5" />
      <line x1="28" y1="43" x2="28" y2="51" stroke="#a3a3a3" strokeWidth="1.5" />
      <line x1="13" y1="43.5" x2="43" y2="50.5" stroke="#a3a3a3" strokeWidth="1" />
      <line x1="43" y1="43.5" x2="13" y2="50.5" stroke="#a3a3a3" strokeWidth="1" />
    </svg>
  )
}
