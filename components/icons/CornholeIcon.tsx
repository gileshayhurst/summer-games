export default function CornholeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" fill="none">
      <line x1="12" y1="50" x2="16" y2="38" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="44" y1="50" x2="40" y2="38" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="6,38 50,38 46,12 10,12" fill="#f59e0b" />
      <line x1="10" y1="20" x2="46" y2="20" stroke="#d97706" strokeWidth="1" opacity="0.5" />
      <line x1="10" y1="29" x2="46" y2="29" stroke="#d97706" strokeWidth="1" opacity="0.5" />
      <ellipse cx="28" cy="23" rx="9" ry="7" fill="#292524" />
      <ellipse cx="28" cy="23" rx="9" ry="7" fill="none" stroke="#1c1917" strokeWidth="1.5" />
      <polygon points="6,38 50,38 46,12 10,12" fill="none" stroke="#b45309" strokeWidth="1.5" />
    </svg>
  )
}
