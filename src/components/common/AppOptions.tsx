import { useEffect } from 'react'
import { PrimaryButton } from './Ui'

interface AppOptionsButtonProps {
  onClick: () => void
}

interface AppOptionsModalProps {
  onClose: () => void
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="settings-icon">
      <path
        d="M10.4 2.8a1 1 0 0 1 1.2 0l1.1.9a2 2 0 0 0 2 .3l1.3-.5a1 1 0 0 1 1.2.5l1.1 1.9a2 2 0 0 0 1.6 1l1.4.2a1 1 0 0 1 .8.9v2.2a1 1 0 0 1-.8.9l-1.4.2a2 2 0 0 0-1.6 1l-1.1 1.9a1 1 0 0 1-1.2.5l-1.3-.5a2 2 0 0 0-2 .3l-1.1.9a1 1 0 0 1-1.2 0l-1.1-.9a2 2 0 0 0-2-.3l-1.3.5a1 1 0 0 1-1.2-.5l-1.1-1.9a2 2 0 0 0-1.6-1L2 13.7a1 1 0 0 1-.8-.9V10.6a1 1 0 0 1 .8-.9l1.4-.2a2 2 0 0 0 1.6-1l1.1-1.9a1 1 0 0 1 1.2-.5l1.3.5a2 2 0 0 0 2-.3l1.1-.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.7" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function AppOptionsButton({ onClick }: AppOptionsButtonProps) {
  return (
    <button
      type="button"
      className="icon-button app-options-button"
      aria-label="옵션 열기"
      onClick={onClick}
    >
      <SettingsIcon />
    </button>
  )
}

export function AppOptionsModal({ onClose }: AppOptionsModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="설정"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header settings-modal-header">
          <div>
            <p className="eyebrow">옵션</p>
            <h2>설정</h2>
          </div>
        </div>

        <section className="note-panel support-panel">
          <div className="support-panel-header">
            <div>
              <h2>개발자 후원</h2>
            </div>
            <span className="support-status-pill">준비중</span>
          </div>

          <p className="support-copy">
            후원 기능이 연결되면 한 번이라도 후원한 사용자에게 결과 전 광고를 생략하는 흐름을 붙일 계획입니다.
          </p>

          <div className="support-actions">
            <PrimaryButton variant="secondary" disabled>
              후원 3,000원
            </PrimaryButton>
          </div>

          <div className="support-option-list">
            <div className="support-option-row">
              <span>회사명</span>
              <strong>EGSY</strong>
            </div>
            <div className="support-option-row">
              <span>이메일</span>
              <strong>Lyrikey@Naver.com</strong>
            </div>
          </div>

          <PrimaryButton className="settings-close-button" onClick={onClose}>
            닫기
          </PrimaryButton>
        </section>
      </div>
    </div>
  )
}