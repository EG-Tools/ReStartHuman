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
      aria-label="?? ??"
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
    ? '?? ?? ??'
    : canEnableAdFree
      ? '?? ??'
      : '?? ?'

  const supportButtonLabel = isAdFreeEnabled
    ? '?? ?? ?? ?'
    : canEnableAdFree
      ? '?? 1?? 3,000?'
      : '?? ?? ?'

  const supportCopy = isAdFreeEnabled
    ? '? ????? ?? ? ??? ?????. ??? ??? ??? ? ??, ??? ???? 1? ?? ?????. ??? ??? ?? ???? ???? ???? ??? ?? ??? ?? ? ????.'
    : canEnableAdFree
      ? '?? ??? ?? ?????? ?? ??? ????. ??? ??? ??? ? ??, ??? ???? 1? ?? ?????. ??? ??? ? ????? ?? ? ??? ??? ????.'
      : '?? ??? ?? ????. ?? ?? ??? ???? ???? ?? ????? ?? ??? ?? ????.'

  return (
    <div className="modal-backdrop settings-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="??"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header settings-modal-header">
          <div>
            <p className="eyebrow">??</p>
          </div>
        </div>

        <section className="note-panel support-panel">
          <div className="support-panel-header">
            <div>
              <p className="support-version-label">{APP_VERSION_LABEL}</p>
              <h2>??? ??</h2>
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
              <span>????</span>
              <strong>EGSY</strong>
            </div>
            <div className="support-option-row">
              <span>???</span>
              <strong>Lyrikey@Naver.com</strong>
            </div>
          </div>

          <PrimaryButton className="settings-close-button" onClick={onClose}>
            ??
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
              aria-label="?? ??"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="eyebrow">?? ??</p>
              <h2>?????????</h2>
              <p className="support-note">
                ?? ??? ? ????? ?? ? ??? ??? ????. ??? ??? ??? ? ??,
                ??? ???? 1? ?? ?????.
              </p>
              <div className="support-confirm-actions">
                <PrimaryButton onClick={handleConfirmSupport}>?</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={() => setIsSupportPromptOpen(false)}>
                  ???
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
