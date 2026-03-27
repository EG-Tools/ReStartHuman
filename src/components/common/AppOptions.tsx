import { useEffect, useState } from 'react'
import { PrimaryButton } from './Ui'
import { APP_VERSION_LABEL } from '../../config/appMeta'

interface AppOptionsButtonProps {
  onClick: () => void
}

interface AppOptionsModalProps {
  onClose: () => void
  isAdFreeEnabled: boolean
  onEnableAdFree: () => void
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

export function AppOptionsModal({
  onClose,
  isAdFreeEnabled,
  onEnableAdFree,
}: AppOptionsModalProps) {
  const [isSupportPromptOpen, setIsSupportPromptOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSupportPromptOpen) {
          setIsSupportPromptOpen(false)
          return
        }

        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSupportPromptOpen, onClose])

  const handleConfirmSupport = () => {
    onEnableAdFree()
    setIsSupportPromptOpen(false)
    onClose()
  }

  return (
    <div className="modal-backdrop settings-modal-backdrop" role="presentation" onClick={onClose}>
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
          </div>
        </div>

        <section className="note-panel support-panel">
          <div className="support-panel-header">
            <div>
              <p className="support-version-label">{APP_VERSION_LABEL}</p>
              <h2>개발자 후원</h2>
            </div>
            <span className={`support-status-pill${isAdFreeEnabled ? ' is-active' : ''}`}>
              {isAdFreeEnabled ? '광고 생략 활성' : '임시 후원'}
            </span>
          </div>

          <p className="support-copy">
            {isAdFreeEnabled
              ? '이 기기에서는 결과 전 광고를 건너뜁니다. 임시 구현이라 브라우저 저장소를 지우면 다시 광고가 보일 수 있습니다.'
              : '후원 기능을 임시로 연결했습니다. 한 번 활성화하면 이 기기에서는 결과 전 광고를 건너뜁니다.'}
          </p>

          <div className="support-actions">
            <PrimaryButton
              variant={isAdFreeEnabled ? 'primary' : 'secondary'}
              onClick={() => setIsSupportPromptOpen(true)}
            >
              {isAdFreeEnabled ? '광고 없이 사용 중' : '후원 1년에 3,000원'}
            </PrimaryButton>
          </div>

          <div className="support-option-list">
            <div className="support-option-row">
              <span>제작자명</span>
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

        {isSupportPromptOpen ? (
          <div
            className="support-confirm-backdrop"
            role="presentation"
            onClick={() => setIsSupportPromptOpen(false)}
          >
            <div
              className="support-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="후원 확인"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">후원 확인</p>
              <h2>후원하겠습니까?</h2>
              <p className="support-note">
                예를 누르면 이 기기에서는 결과 전 광고를 임시로 숨깁니다.
              </p>
              <div className="support-confirm-actions">
                <PrimaryButton onClick={handleConfirmSupport}>예</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={() => setIsSupportPromptOpen(false)}>
                  아니오
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
