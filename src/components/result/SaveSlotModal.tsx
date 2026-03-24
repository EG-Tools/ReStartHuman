import { PrimaryButton } from '../common/Ui'
import { formatDateTime } from '../../utils/format'
import type { SaveSlotRecord } from '../../types/retireCalc'

type SaveSlotMode = 'load' | 'save' | 'manage'
type SwitchableSaveSlotMode = 'load' | 'save'

interface SaveSlotModalProps {
  mode: SaveSlotMode
  slotCount: number
  slotsById: Map<number, SaveSlotRecord>
  slotNamesById?: Map<number, string>
  canSave?: boolean
  onClose: () => void
  onModeChange?: (mode: SwitchableSaveSlotMode) => void
  onLoad: (slot: SaveSlotRecord) => void
  onSave: (slotId: number) => void
  onDelete: (slotId: number) => void
  onRenameSlotName?: (slotId: number, nextName: string) => void
}

const getDefaultSlotName = (slotId: number) => `은퇴계산${slotId}`

const normalizeSlotName = (slotId: number, rawName?: string) => {
  const fallbackName = getDefaultSlotName(slotId)
  const resolvedName = (rawName || fallbackName).trim()

  return /^은퇴계산\d+$/.test(resolvedName) ? '은퇴계산' : resolvedName
}

export function SaveSlotModal({
  mode,
  slotCount,
  slotsById,
  slotNamesById,
  canSave,
  onClose,
  onModeChange,
  onLoad,
  onSave,
  onDelete,
  onRenameSlotName,
}: SaveSlotModalProps) {
  const resolvedCanSave = canSave ?? true
  const activeMode: SwitchableSaveSlotMode =
    !resolvedCanSave || mode === 'load' ? 'load' : mode === 'manage' ? 'save' : 'save'
  const showModeTabs = mode === 'manage' && typeof onModeChange === 'function'
  const title = activeMode === 'save' ? '현재 계산 저장' : '저장 불러오기'

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel save-slot-modal" role="dialog" aria-modal="true">
        <div className="modal-header save-slot-modal-header">
          <div className="save-slot-modal-heading">
            {showModeTabs ? (
              <div className="slot-mode-switch" role="tablist" aria-label="저장 슬롯 모드">
                <button
                  type="button"
                  className={`slot-mode-button ${activeMode === 'save' ? 'is-active' : ''}`.trim()}
                  role="tab"
                  aria-selected={activeMode === 'save'}
                  onClick={() => resolvedCanSave && onModeChange('save')}
                  disabled={!resolvedCanSave}
                >
                  저장
                </button>
                <button
                  type="button"
                  className={`slot-mode-button ${activeMode === 'load' ? 'is-active' : ''}`.trim()}
                  role="tab"
                  aria-selected={activeMode === 'load'}
                  onClick={() => onModeChange('load')}
                >
                  불러오기
                </button>
              </div>
            ) : null}
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="slot-list">
          {Array.from({ length: slotCount }, (_, index) => index + 1).map((slotId) => {
            const slot = slotsById.get(slotId)
            const slotName = normalizeSlotName(slotId, slotNamesById?.get(slotId) ?? slot?.name)
            const savedAtLabel = slot
              ? `저장날짜 ${formatDateTime(slot.savedAt)}`
              : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card save-slot-card">
                <div className="save-slot-card-main">
                  <div className="save-slot-label-row">
                    <span className="save-slot-index">결과 {slotId}</span>
                    {typeof onRenameSlotName === 'function' ? (
                      <input
                        type="text"
                        className="slot-name-input"
                        defaultValue={slotName}
                        maxLength={24}
                        onBlur={(event) => onRenameSlotName(slotId, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.currentTarget.blur()
                          }
                        }}
                        aria-label={`${slotId}번 결과 이름`}
                      />
                    ) : (
                      <h3 className="save-slot-name">{slotName}</h3>
                    )}
                  </div>
                  <p className="save-slot-status">{savedAtLabel}</p>
                </div>

                <div className="slot-actions save-slot-actions">
                  <PrimaryButton onClick={() => onSave(slotId)} disabled={!resolvedCanSave}>
                    저장
                  </PrimaryButton>
                  <PrimaryButton
                    variant="secondary"
                    className="slot-load-button"
                    onClick={() => slot && onLoad(slot)}
                    disabled={!slot}
                  >
                    불러오기
                  </PrimaryButton>
                  <PrimaryButton
                    variant="ghost"
                    onClick={() => onDelete(slotId)}
                    disabled={!slot}
                  >
                    삭제
                  </PrimaryButton>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
