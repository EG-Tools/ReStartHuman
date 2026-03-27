import { useEffect, useState } from 'react'
import { APP_VERSION_LABEL } from '../../config/appMeta'
import { PrimaryButton } from './Ui'

interface AppOptionsButtonProps {
  onClick: () => void
}

interface AppOptionsModalProps {
  onClose: () => void
  isAdFreeEnabled: boolean
  canEnableAdFree: boolean
  onEnableAdFree: () => boolean
}

const text = {
  openOptions: '\uC635\uC158 \uC5F4\uAE30',
  settings: '\uC124\uC815',
  options: '\uC635\uC158',
  developerSupport: '\uAC1C\uBC1C\uC790 \uD6C4\uC6D0',
  activeStatus: '\uAD11\uACE0 \uC0DD\uB7B5 \uD65C\uC131',
  temporarySupport: '\uC784\uC2DC \uD6C4\uC6D0',
  preparing: '\uC900\uBE44 \uC911',
  usingWithoutAds: '\uAD11\uACE0 \uC5C6\uC774 \uC0AC\uC6A9 \uC911',
  supportPrice: '\uD6C4\uC6D0 1\uB144\uC5D0 3,000\uC6D0',
  supportPreparing: '\uD6C4\uC6D0 \uC900\uBE44 \uC911',
  enabledCopy:
    '\uC774 \uAE30\uAE30\uC5D0\uC11C\uB294 \uACB0\uACFC \uC804 \uAD11\uACE0\uB97C \uAC74\uB108\uB701\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C\uD55C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4. \uC9C0\uAE08\uC740 \uAC1C\uBC1C\uC6A9 \uC784\uC2DC \uAD6C\uD604\uC774\uB77C \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5\uC18C\uB97C \uC9C0\uC6B0\uBA74 \uB2E4\uC2DC \uAD11\uACE0\uAC00 \uBCF4\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  temporaryCopy:
    '\uD6C4\uC6D0 \uAE30\uB2A5\uC740 \uC544\uC9C1 \uAC1C\uBC1C\uC6A9\uC73C\uB85C\uB9CC \uC784\uC2DC \uC5F0\uACB0\uB3FC \uC788\uC2B5\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C\uD55C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4. \uD655\uC778\uC744 \uB204\uB974\uBA74 \uC774 \uAE30\uAE30\uC5D0\uC11C\uB9CC \uACB0\uACFC \uC804 \uAD11\uACE0\uB97C \uC784\uC2DC\uB85C \uC228\uAE41\uB2C8\uB2E4.',
  preparingCopy:
    '\uD6C4\uC6D0 \uAE30\uB2A5\uC740 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uACB0\uC81C \uC5F0\uB3D9\uC774 \uC644\uB8CC\uB418\uAE30 \uC804\uAE4C\uC9C0\uB294 \uC77C\uBC18 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uAD11\uACE0 \uC81C\uAC70\uB97C \uC5F4\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
  creator: '\uC81C\uC791\uC790\uBA85',
  email: '\uC774\uBA54\uC77C',
  close: '\uB2EB\uAE30',
  confirmSupport: '\uD6C4\uC6D0 \uD655\uC778',
  supportQuestion: '\uD6C4\uC6D0\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?',
  supportNote:
    '\uC608\uB97C \uB204\uB974\uBA74 \uC774 \uAE30\uAE30\uC5D0\uC11C\uB9CC \uACB0\uACFC \uC804 \uAD11\uACE0\uB97C \uC784\uC2DC\uB85C \uC228\uAE41\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C\uD55C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4.',
  yes: '\uC608',
  no: '\uC544\uB2C8\uC624',
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
  isAdFreeEnabled,
  canEnableAdFree,
  onEnableAdFree,
}: AppOptionsModalProps) {
  const [isSupportPromptOpen, setIsSupportPromptOpen] = useState(false)
  const canOpenSupportPrompt = canEnableAdFree && !isAdFreeEnabled

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
    const didEnable = onEnableAdFree()

    if (!didEnable) {
      setIsSupportPromptOpen(false)
      return
    }

    setIsSupportPromptOpen(false)
    onClose()
  }

  const supportStatusLabel = isAdFreeEnabled
    ? text.activeStatus
    : canEnableAdFree
      ? text.temporarySupport
      : text.preparing

  const supportButtonLabel = isAdFreeEnabled
    ? text.usingWithoutAds
    : canEnableAdFree
      ? text.supportPrice
      : text.supportPreparing

  const supportCopy = isAdFreeEnabled
    ? text.enabledCopy
    : canEnableAdFree
      ? text.temporaryCopy
      : text.preparingCopy

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
            <span className={'support-status-pill' + (isAdFreeEnabled ? ' is-active' : '')}>
              {supportStatusLabel}
            </span>
          </div>

          <p className="support-copy">{supportCopy}</p>

          <div className="support-actions">
            <PrimaryButton
              variant={isAdFreeEnabled ? 'primary' : 'secondary'}
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
      </div>
    </div>
  )
}
