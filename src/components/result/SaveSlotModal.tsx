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

            return (
              <article key={slotId} className="slot-card">
                <div>
                  <h3>{slot?.name ?? `은퇴계산${slotId}`}</h3>
                  <p>{slot ? `${formatDateTime(slot.savedAt)} 저장` : '비어 있는 슬롯'}</p>
                </div>

                <div className="slot-actions">
                  {mode === 'load' ? (
                    <PrimaryButton
                      variant="secondary"
                      onClick={() => slot && onLoad(slot)}
                      disabled={!slot}
                    >
                      불러오기
                    </PrimaryButton>
                  ) : mode === 'save' ? (
                    <PrimaryButton onClick={() => onSave(slotId)}>
                      {slot ? '덮어쓰기' : '여기에 저장'}
                    </PrimaryButton>
                  ) : (
                    <>
                      <PrimaryButton
                        variant="secondary"
                        onClick={() => slot && onLoad(slot)}
                        disabled={!slot}
                      >
                        불러오기
                      </PrimaryButton>
                      <PrimaryButton onClick={() => onSave(slotId)}>
                        {slot ? '덮어쓰기' : '여기에 저장'}
                      </PrimaryButton>
                    </>
                  )}

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
