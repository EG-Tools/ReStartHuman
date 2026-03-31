import { useEffect, useState } from 'react'
import { APP_VERSION_LABEL } from '../../config/appMeta'
import type { AppAccessMode } from '../../types/alpha'
import { PrimaryButton } from './Ui'

interface AppOptionsButtonProps {
  onClick: () => void
}

interface AppOptionsModalProps {
  onClose: () => void
  isAdminModeEnabled: boolean
  canEnableAdminMode: boolean
  onEnableAdminMode: () => boolean
  accessMode: AppAccessMode
  canToggleAccessMode: boolean
  onChangeAccessMode: (mode: AppAccessMode) => boolean
}

const text = {
  openOptions: '옵션 열기',
  settings: '설정',
  options: '옵션',
  developerSupport: '개발자 후원',
  activeStatus: '관리자 모드',
  temporarySupport: '테스트 후원',
  preparing: '준비 중',
  usingWithoutAds: '관리자 모드 사용 중',
  supportPrice: '후원 1년에 3,000원',
  supportPreparing: '후원 준비 중',
  enabledCopyPro:
    '후원에 감사드립니다. 이 기기에서는 관리자 모드가 활성화되어 결과 전 광고 없이 전체 기능을 확인할 수 있습니다. 구독은 언제든 취소할 수 있고, 결제한 시점부터 1년 동안 유지됩니다.',
  enabledCopyGeneral:
    '관리자 모드가 활성화되어 있지만 지금은 일반 보기로 전환해 광고와 일반 사용자 흐름을 테스트하고 있습니다. 필요하면 아래 토글에서 프로 보기로 다시 바꿀 수 있습니다.',
  temporaryCopy:
    '테스트 버전에서는 후원을 확인하면 이 기기에서 관리자 모드가 활성화됩니다. 구독은 언제든 취소할 수 있고, 결제한 시점부터 1년 동안 유지됩니다. 지금은 실제 결제 연동 전 테스트 흐름으로 운영합니다.',
  preparingCopy:
    '후원 기능은 준비 중입니다. 실제 결제 연동이 완료되기 전까지는 일반 사용자에게 광고 제거를 열지 않습니다.',
  modeLabel: '테스트 표시 모드',
  modeGeneral: '일반',
  modePro: '프로',
  modeGeneralCopy:
    '일반 보기는 광고가 포함된 흐름과 일반 사용자 기준 화면을 테스트할 때 쓸 수 있습니다.',
  modeProCopy:
    '프로 보기는 관리자 모드와 광고 생략 상태를 그대로 테스트할 때 쓸 수 있습니다.',
  creator: '제작자명',
  email: '이메일',
  close: '닫기',
  confirmSupport: '후원 확인',
  supportQuestion: '후원하시겠습니까?',
  supportNote:
    '예를 누르면 후원 감사 메시지 뒤에 이 기기에서 관리자 모드가 활성화됩니다. 구독은 언제든 취소할 수 있고, 결제한 시점부터 1년 동안 유지됩니다.',
  supportThanks: '후원에 감사드립니다.',
  supportSuccessNote:
    '이 기기에서 관리자 모드가 활성화되었습니다. 이제 일반/프로 표시 모드를 바꿔가며 테스트할 수 있습니다.',
  confirm: '확인',
  yes: '예',
  no: '아니오',
} as const

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
      aria-label={text.openOptions}
      onClick={onClick}
    >
      <SettingsIcon />
    </button>
  )
}

export function AppOptionsModal({
  onClose,
  isAdminModeEnabled,
  canEnableAdminMode,
  onEnableAdminMode,
  accessMode,
  canToggleAccessMode,
  onChangeAccessMode,
}: AppOptionsModalProps) {
  const [isSupportPromptOpen, setIsSupportPromptOpen] = useState(false)
  const [isSupportSuccessOpen, setIsSupportSuccessOpen] = useState(false)
  const canOpenSupportPrompt = canEnableAdminMode && !isAdminModeEnabled

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSupportSuccessOpen) {
          setIsSupportSuccessOpen(false)
          return
        }

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
  }, [isSupportPromptOpen, isSupportSuccessOpen, onClose])

  const handleConfirmSupport = () => {
    const didEnable = onEnableAdminMode()
    setIsSupportPromptOpen(false)

    if (!didEnable) {
      return
    }

    setIsSupportSuccessOpen(true)
  }

  const supportStatusLabel = isAdminModeEnabled
    ? text.activeStatus
    : canEnableAdminMode
      ? text.temporarySupport
      : text.preparing

  const supportButtonLabel = isAdminModeEnabled
    ? text.usingWithoutAds
    : canEnableAdminMode
      ? text.supportPrice
      : text.supportPreparing

  const supportCopy = isAdminModeEnabled
    ? accessMode === 'pro'
      ? text.enabledCopyPro
      : text.enabledCopyGeneral
    : canEnableAdminMode
      ? text.temporaryCopy
      : text.preparingCopy

  const currentModeLabel = accessMode === 'pro' ? text.modePro : text.modeGeneral
  const currentModeCopy = accessMode === 'pro' ? text.modeProCopy : text.modeGeneralCopy

  return (
    <div className="modal-backdrop settings-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label={text.settings}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header settings-modal-header">
          <div>
            <p className="eyebrow">{text.options}</p>
          </div>
        </div>

        <section className="note-panel support-panel">
          <div className="support-panel-header">
            <div>
              <p className="support-version-label">{APP_VERSION_LABEL}</p>
              <h2>{text.developerSupport}</h2>
            </div>
            <span className={'support-status-pill' + (isAdminModeEnabled ? ' is-active' : '')}>
              {supportStatusLabel}
            </span>
          </div>

          <p className="support-copy">{supportCopy}</p>

          {canToggleAccessMode ? (
            <div className="support-option-row support-mode-section">
              <span>{text.modeLabel}</span>
              <strong>{currentModeLabel}</strong>
              <p className="support-note support-mode-copy">{currentModeCopy}</p>
              <div className="slot-mode-switch support-mode-toggle" role="tablist" aria-label={text.modeLabel}>
                <button
                  type="button"
                  className={`slot-mode-button ${accessMode === 'general' ? 'is-active' : ''}`.trim()}
                  role="tab"
                  aria-selected={accessMode === 'general'}
                  onClick={() => onChangeAccessMode('general')}
                >
                  {text.modeGeneral}
                </button>
                <button
                  type="button"
                  className={`slot-mode-button ${accessMode === 'pro' ? 'is-active' : ''}`.trim()}
                  role="tab"
                  aria-selected={accessMode === 'pro'}
                  onClick={() => onChangeAccessMode('pro')}
                >
                  {text.modePro}
                </button>
              </div>
            </div>
          ) : null}

          <div className="support-actions">
            <PrimaryButton
              variant={isAdminModeEnabled ? 'primary' : 'secondary'}
              onClick={() => {
                if (canOpenSupportPrompt) {
                  setIsSupportPromptOpen(true)
                }
              }}
              disabled={!canOpenSupportPrompt}
            >
              {supportButtonLabel}
            </PrimaryButton>
          </div>

          <div className="support-option-list">
            <div className="support-option-row">
              <span>{text.creator}</span>
              <strong>EGSY</strong>
            </div>
            <div className="support-option-row">
              <span>{text.email}</span>
              <strong>Lyrikey@Naver.com</strong>
            </div>
          </div>

          <PrimaryButton className="settings-close-button" onClick={onClose}>
            {text.close}
          </PrimaryButton>
        </section>

        {isSupportPromptOpen && canOpenSupportPrompt ? (
          <div
            className="support-confirm-backdrop"
            role="presentation"
            onClick={() => setIsSupportPromptOpen(false)}
          >
            <div
              className="support-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={text.confirmSupport}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">{text.confirmSupport}</p>
              <h2>{text.supportQuestion}</h2>
              <p className="support-note">{text.supportNote}</p>
              <div className="support-confirm-actions">
                <PrimaryButton onClick={handleConfirmSupport}>{text.yes}</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={() => setIsSupportPromptOpen(false)}>
                  {text.no}
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}

        {isSupportSuccessOpen ? (
          <div
            className="support-confirm-backdrop"
            role="presentation"
            onClick={() => setIsSupportSuccessOpen(false)}
          >
            <div
              className="support-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label={text.supportThanks}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">{text.developerSupport}</p>
              <h2>{text.supportThanks}</h2>
              <p className="support-note">{text.supportSuccessNote}</p>
              <div className="support-confirm-actions">
                <PrimaryButton onClick={() => setIsSupportSuccessOpen(false)}>
                  {text.confirm}
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
