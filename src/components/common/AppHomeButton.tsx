interface AppHomeButtonProps {
  onClick: () => void
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="home-icon">
      <path
        d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-4.8v-5.2a1 1 0 0 0-1-1H10.8a1 1 0 0 0-1 1V21H5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AppHomeButton({ onClick }: AppHomeButtonProps) {
  return (
    <button
      type="button"
      className="icon-button app-home-button"
      aria-label={'\uCC98\uC74C\uC73C\uB85C \uC774\uB3D9'}
      onClick={onClick}
    >
      <HomeIcon />
    </button>
  )
}