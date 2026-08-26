interface SharedIconProps {
  className?: string
}

export function HomeIcon({ className = '' }: SharedIconProps) {
  return (
    <span aria-hidden="true" className={`css-home-icon ${className}`.trim()}>
      <span />
    </span>
  )
}

export function BookIcon({ className = '' }: SharedIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 5.7A4.6 4.6 0 0 1 7.7 4h3.1v15.8H7.7a4.6 4.6 0 0 0-4.2 1.7Z" />
        <path d="M20.5 5.7A4.6 4.6 0 0 0 16.3 4h-3.1v15.8h3.1a4.6 4.6 0 0 1 4.2 1.7Z" />
      </g>
    </svg>
  )
}

export function ClockIcon({ className = '' }: SharedIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 7.2v5.2l3.4 2" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
