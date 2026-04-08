import { useEffect, useState } from 'react'
import { APP_VERSION_LABEL } from '../../config/appMeta'
import type { ThemeMode } from '../../hooks/useThemeMode'
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
  themeMode: ThemeMode
  onChangeThemeMode: (mode: ThemeMode) => boolean
  accessMode: AppAccessMode
  canToggleAccessMode: boolean
  onChangeAccessMode: (mode: AppAccessMode) => boolean
}

const text = {
  openOptions: '\uC635\uC158 \uC5F4\uAE30',
  settings: '\uC124\uC815',
  options: '\uC635\uC158',
  developerSupport: '\uAC1C\uBC1C\uC790 \uD6C4\uC6D0',
  activeStatus: '\uAD00\uB9AC\uC790 \uBAA8\uB4DC',
  temporarySupport: '\uD14C\uC2A4\uD2B8 \uD6C4\uC6D0',
  preparing: '\uC900\uBE44 \uC911',
  usingWithoutAds: '\uAD00\uB9AC\uC790 \uBAA8\uB4DC \uC0AC\uC6A9 \uC911',
  supportPrice: '\uD6C4\uC6D0 1\uB144\uC5D0 3,000\uC6D0',
  supportPreparing: '\uD6C4\uC6D0 \uC900\uBE44 \uC911',
  enabledCopyPro:
    '\uD6C4\uC6D0\uC5D0 \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4. \uC774 \uAE30\uAE30\uC5D0\uC11C\uB294 \uAD00\uB9AC\uC790 \uBAA8\uB4DC\uAC00 \uD65C\uC131\uD654\uB418\uC5B4 \uAD11\uACE0 \uC5C6\uC774 \uC804\uCCB4 \uAE30\uB2A5\uC744 \uD14C\uC2A4\uD2B8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4.',
  enabledCopyGeneral:
    '\uAD00\uB9AC\uC790 \uBAA8\uB4DC\uB294 \uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC9C0\uB9CC, \uC9C0\uAE08\uC740 \uC77C\uBC18 \uBCF4\uAE30\uB85C \uC804\uD658\uD574 \uAD11\uACE0\uC640 \uC77C\uBC18 \uC0AC\uC6A9\uC790 \uD750\uB984\uC744 \uD14C\uC2A4\uD2B8\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC544\uB798\uC5D0\uC11C \uD504\uB85C \uBCF4\uAE30\uB85C \uB2E4\uC2DC \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  temporaryCopy:
    '\uD14C\uC2A4\uD2B8 \uBC84\uC804\uC5D0\uC11C\uB294 \uD6C4\uC6D0\uC744 \uD655\uC778\uD558\uBA74 \uC774 \uAE30\uAE30\uC5D0\uC11C \uAD00\uB9AC\uC790 \uBAA8\uB4DC\uAC00 \uD65C\uC131\uD654\uB429\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4. \uC9C0\uAE08\uC740 \uC2E4\uC81C \uACB0\uC81C \uC5F0\uB3D9 \uC5C6\uC774 \uD14C\uC2A4\uD2B8 \uD750\uB984\uC73C\uB85C\uB9CC \uB3D9\uC791\uD569\uB2C8\uB2E4.',
  preparingCopy:
    '\uD6C4\uC6D0 \uAE30\uB2A5\uC740 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uACB0\uC81C \uC5F0\uB3D9\uC774 \uB05D\uB098\uAE30 \uC804\uAE4C\uC9C0\uB294 \uC77C\uBC18 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uAD11\uACE0 \uC81C\uAC70\uB97C \uC5F4\uC5B4\uB450\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
  modeLabel: '\uD14C\uC2A4\uD2B8 \uD45C\uC2DC \uBAA8\uB4DC',
  modeGeneral: '\uC77C\uBC18',
  modePro: '\uD504\uB85C',
  modeGeneralCopy:
    '\uC77C\uBC18 \uBCF4\uAE30\uB294 1\uC778 \uAC00\uAD6C \uBE60\uB978 \uCD94\uC815\uACFC \uAD11\uACE0 \uD750\uB984\uC744 \uD14C\uC2A4\uD2B8\uD560 \uB54C \uC0AC\uC6A9\uD569\uB2C8\uB2E4.',
  modeProCopy:
    '\uD504\uB85C \uBCF4\uAE30\uB294 \uBD80\uBD80, \uACF5\uB3D9\uBA85\uC758, \uB2E4\uC8FC\uD0DD, ISA, \uC138\uAE08\u00B7\uAC74\uBCF4 \uC0C1\uC138 \uACC4\uC0B0\uAE4C\uC9C0 \uBAA8\uB450 \uC5FD\uB2C8\uB2E4.',
  modeSummaryLabel: '\uBAA8\uB4DC \uBE44\uAD50',
  generalPlanTitle: '1\uC778 \uAC00\uAD6C \uBE60\uB978 \uCD94\uC815',
  generalPlanCopy:
    '\uC77C\uBC18\uC8FC\uC2DD, \uAD6D\uBBFC\uC5F0\uAE08, \uCD1D\uC561 \uC785\uB825 \uC911\uC2EC\uC73C\uB85C \uBE60\uB974\uAC8C \uACC4\uC0B0\uD569\uB2C8\uB2E4.',
  proPlanTitle: '\uC815\uBC00 \uACC4\uC0B0',
  proPlanCopy:
    '\uBD80\uBD80, \uACF5\uB3D9\uBA85\uC758, \uB2E4\uC8FC\uD0DD, ISA, \uC18C\uB4DD \uC720\uD615\uBCC4, \uC138\uAE08\u00B7\uAC74\uBCF4 \uC0C1\uC138 \uACC4\uC0B0\uC744 \uBAA8\uB450 \uC5FD\uB2C8\uB2E4.',
  themeLabel: '\uCEEC\uB7EC \uD14C\uB9C8',
  themeWhite: 'White',
  themeDark: 'Dark',
  themeWhiteCopy:
    '\uBC1D\uC740 \uBC30\uACBD\uACFC \uC5F0\uD55C \uC885\uC774 \uD1A4\uC73C\uB85C \uBCF4\uB294 \uD14C\uB9C8\uC785\uB2C8\uB2E4.',
  themeDarkCopy:
    '\uC9C0\uAE08\uCC98\uB7FC \uC5B4\uB450\uC6B4 \uBC30\uACBD \uAE30\uC900\uC758 \uB2E4\uD06C \uD14C\uB9C8\uC785\uB2C8\uB2E4.',
  creator: '\uC81C\uC791\uC790',
  email: '\uC774\uBA54\uC77C',
  close: '\uB2EB\uAE30',
  confirmSupport: '\uD6C4\uC6D0 \uD655\uC778',
  supportQuestion: '\uD6C4\uC6D0\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?',
  supportNote:
    '\uC608\uB97C \uB204\uB974\uBA74 \uD6C4\uC6D0 \uAC10\uC0AC \uBA54\uC2DC\uC9C0 \uB4A4\uC5D0 \uC774 \uAE30\uAE30\uC5D0\uC11C \uAD00\uB9AC\uC790 \uBAA8\uB4DC\uAC00 \uD65C\uC131\uD654\uB429\uB2C8\uB2E4. \uAD6C\uB3C5\uC740 \uC5B8\uC81C\uB4E0 \uCDE8\uC18C\uD560 \uC218 \uC788\uACE0, \uACB0\uC81C\uD55C \uC2DC\uC810\uBD80\uD130 1\uB144 \uB3D9\uC548 \uC720\uC9C0\uB429\uB2C8\uB2E4.',
  supportThanks: '\uD6C4\uC6D0\uC5D0 \uAC10\uC0AC\uB4DC\uB9BD\uB2C8\uB2E4.',
  supportSuccessNote:
    '\uC774 \uAE30\uAE30\uC5D0\uC11C \uAD00\uB9AC\uC790 \uBAA8\uB4DC\uAC00 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC774\uC81C \uC77C\uBC18/\uD504\uB85C \uD45C\uC2DC \uBAA8\uB4DC\uB97C \uBC14\uAFB8\uBA70 \uD14C\uC2A4\uD2B8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  confirm: '\uD655\uC778',
  yes: '\uC608',
  no: '\uC544\uB2C8\uC624',
} as const

const modeCards = [
  {
    key: 'general' as const,
    eyebrow: text.modeGeneral,
    title: text.generalPlanTitle,
    copy: text.generalPlanCopy,
    features: [
      '\uC77C\uBC18\uC8FC\uC2DD \uC790\uC0B0/\uBC30\uB2F9',
      '\uAD6D\uBBFC\uC5F0\uAE08',
      '\uCD94\uAC00\uC18C\uB4DD \uCD1D\uC561',
      '\uACE0\uC815\uC9C0\uCD9C \uCD1D\uC561',
      '\uC0DD\uD65C\uBE44 \uCD1D\uC561',
      '\uAD11\uACE0 \uD3EC\uD568',
    ],
  },
  {
    key: 'pro' as const,
    eyebrow: text.modePro,
    title: text.proPlanTitle,
    copy: text.proPlanCopy,
    features: [
      '\uBD80\uBD80\u00B7\uACF5\uB3D9\uBA85\uC758',
      '\uB2E4\uC8FC\uD0DD\u00B7\uD1A0\uC9C0',
      'ISA\u00B7\uAE30\uD0C0\uACC4\uC88C',
      '\uC18C\uB4DD \uC720\uD615\uBCC4 \uC785\uB825',
      '\uAC74\uBCF4\u00B7\uC138\uAE08 \uC0C1\uC138',
      '\uAD11\uACE0 \uC5C6\uC774 \uD14C\uC2A4\uD2B8',
    ],
  },
]

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
  themeMode,
  onChangeThemeMode,
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
  const currentThemeLabel = themeMode === 'white' ? text.themeWhite : text.themeDark
  const currentThemeCopy = themeMode === 'white' ? text.themeWhiteCopy : text.themeDarkCopy

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

          <div className="support-option-row support-mode-section">
            <span>{text.themeLabel}</span>
            <strong>{currentThemeLabel}</strong>
            <p className="support-note support-mode-copy">{currentThemeCopy}</p>
            <div className="slot-mode-switch support-mode-toggle" role="tablist" aria-label={text.themeLabel}>
              <button
                type="button"
                className={`slot-mode-button ${themeMode === 'white' ? 'is-active' : ''}`.trim()}
                role="tab"
                aria-selected={themeMode === 'white'}
                onClick={() => onChangeThemeMode('white')}
              >
                {text.themeWhite}
              </button>
              <button
                type="button"
                className={`slot-mode-button ${themeMode === 'dark' ? 'is-active' : ''}`.trim()}
                role="tab"
                aria-selected={themeMode === 'dark'}
                onClick={() => onChangeThemeMode('dark')}
              >
                {text.themeDark}
              </button>
            </div>
          </div>

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

          <div className="support-option-row support-mode-section">
            <span>{text.modeSummaryLabel}</span>
            <div className="access-mode-summary-grid">
              {modeCards.map((card) => {
                const isActive = accessMode === card.key

                return (
                  <article
                    key={card.key}
                    className={`access-mode-card ${isActive ? 'is-active' : ''}`.trim()}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <p className="eyebrow access-mode-card-eyebrow">{card.eyebrow}</p>
                    <h3>{card.title}</h3>
                    <p className="support-note">{card.copy}</p>
                    <ul className="access-mode-feature-list">
                      {card.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>

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