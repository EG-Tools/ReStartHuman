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

export function SaveSlotModal({
  mode,
  slotCount,
  slotsById,
  onClose,
  onLoad,
  onSave,
  onDelete,
}: SaveSlotModalProps) {
  const title =
    mode === 'save'
      ? '현재 계산 저장'
      : mode === 'load'
        ? '저장된 계산 불러오기'
        : '저장/불러오기'

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
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
            const slotName = slot?.name ?? `은퇴계산${slotId}`
            const savedAtLabel = slot
              ? `저장날짜 ${formatDateTime(slot.savedAt)}`
              : '저장날짜 정보 없음'

            return (
              <article key={slotId} className="slot-card">
                <div className="slot-card-header">
                  <h3>{slotName}</h3>
                  <p>{savedAtLabel}</p>
                </div>

                <div className="slot-actions">
                  <PrimaryButton
                    variant="secondary"
                    onClick={() => slot && onLoad(slot)}
                    disabled={!slot}
                  >
                    불러오기
                  </PrimaryButton>
                  <PrimaryButton onClick={() => onSave(slotId)}>덮어쓰기</PrimaryButton>
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