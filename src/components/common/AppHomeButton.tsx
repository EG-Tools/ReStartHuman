import { HomeIcon } from './AppIcons'

interface AppHomeButtonProps {
  onClick: () => void
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
