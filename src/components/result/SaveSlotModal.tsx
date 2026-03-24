import { PrimaryButton } from '../common/Ui'
import { formatDateTime } from '../../utils/format'
import type { SaveSlotRecord } from '../../types/retireCalc'

interface SaveSlotModalProps {
  mode: 'load' | 'save' | 'manage'
  slotCount: number
  slotsById: Map<number, SaveSlotRecord>
  onClose: () => void
  onLoad: (slot: SaveSlotRecord) => void
  onSave: (slotId: number) => void
  onDelete: (slotId: number) => void
}

const normalizeSlotName = (slotId: number, rawName?: string) => {
  const fallbackName = `은퇴계산${slotId}`
  const resolvedName = (rawName || fallbackName).trim()

  return /^은퇴계산\d+$/.test(resolvedName) ? '은퇴계산' : resolvedName
}

export function SaveSlotModal({
  mode,
  slotCount,
  slotsById,
  onClose,
  onLoad,
  onSave,
  onDelete,
}: SaveSlotModalProps) {
  const title = mode === 'save' ? '현재 계산 저장' : '저장 불러오기'

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel save-slot-modal" role="dialog" aria-modal="true">
        <div className="modal-header save-slot-modal-header">
          <div className="save-slot-modal-heading">
            <p className="eyebrow">저장 슬롯</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="slot-list">
          {Array.from({ length: slotCount }, (_, index) => index + 1).map((slotId) => {
            const slot = slotsById.get(slotId)
            const slotName = normalizeSlotName(slotId, slot?.name)
            const savedAtLabel = slot
              ? `저장날짜 ${formatDateTime(slot.savedAt)}`
              : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card save-slot-card">
                <div className="save-slot-card-main">
                  <div className="save-slot-label-row">
                    <span className="save-slot-index">결과 {slotId}</span>
                    <h3 className="save-slot-name">{slotName}</h3>
                  </div>
                  <p className="save-slot-status">{savedAtLabel}</p>
                </div>

                <div className="slot-actions save-slot-actions">
                  <PrimaryButton onClick={() => onSave(slotId)}>저장</PrimaryButton>
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
