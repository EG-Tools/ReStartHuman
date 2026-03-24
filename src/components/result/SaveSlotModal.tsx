import { PrimaryButton } from '../common/Ui'
import { formatDateTime } from '../../utils/format'
import type { SaveSlotRecord } from '../../types/retireCalc'

interface SaveSlotModalProps {
  mode: 'load' | 'save' | 'manage'
  slotCount: number
  slotsById: Map<number, SaveSlotRecord>
  slotNamesById: Map<number, string>
  canSave: boolean
  onClose: () => void
  onModeChange: (mode: 'load' | 'save') => void
  onLoad: (slot: SaveSlotRecord) => void
  onSave: (slotId: number) => void
  onDelete: (slotId: number) => void
  onRenameSlotName: (slotId: number, nextName: string) => void
}

const getDefaultSlotName = (slotId: number) => `은퇴계산${slotId}`

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
  const activeMode = !canSave || mode === 'load' ? 'load' : 'save'
  const title = activeMode === 'save' ? '저장할 슬롯을 선택하세요' : '불러올 슬롯을 선택하세요'

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-slot-modal-title"
      >
        <div className="modal-header">
          <div className="slot-modal-heading">
            <div className="slot-mode-switch" role="tablist" aria-label="저장 슬롯 모드">
              <button
                type="button"
                className={`slot-mode-button ${activeMode === 'save' ? 'is-active' : ''}`.trim()}
                role="tab"
                aria-selected={activeMode === 'save'}
                onClick={() => canSave && onModeChange('save')}
                disabled={!canSave}
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
            <h2 id="save-slot-modal-title">{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="slot-list">
          {Array.from({ length: slotCount }, (_, index) => index + 1).map((slotId) => {
            const slot = slotsById.get(slotId)
            const slotName = slotNamesById.get(slotId) ?? slot?.name ?? getDefaultSlotName(slotId)
            const savedAtLabel = slot
              ? `저장날짜 ${formatDateTime(slot.savedAt)}`
              : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card">
                <div className="slot-card-header">
                  <div className="slot-name-row">
                    <span className="slot-index-badge">슬롯 {slotId}</span>
                    <input
                      type="text"
                      className="slot-name-input"
                      value={slotName}
                      maxLength={24}
                      onChange={(event) => onRenameSlotName(slotId, event.target.value)}
                      aria-label={`${slotId}번 슬롯 이름`}
                    />
                  </div>
                  <p>{savedAtLabel}</p>
                </div>

                <div className="slot-actions">
                  <PrimaryButton
                    variant="secondary"
                    className="slot-load-button"
                    onClick={() => slot && onLoad(slot)}
                    disabled={!slot}
                  >
                    불러오기
                  </PrimaryButton>
                  <PrimaryButton onClick={() => onSave(slotId)} disabled={!canSave}>
                    저장
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
