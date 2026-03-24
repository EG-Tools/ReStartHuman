import { useMemo, useState } from 'react'
import { normalizeSaveSlotName } from '../../utils/saveSlots'
import {
  createSaveSlotDraftNames,
  getResolvedSaveSlotMode,
  getSaveSlotStatusLabel,
} from './saveSlotModal.shared'
import type { SaveSlotModalProps } from './saveSlotModal.shared'
import { SaveSlotCard, SaveSlotModeTabs } from './saveSlotModal.sections'

export function SaveSlotModal({
  mode,
  slotCount,
  slotsById,
  canSave,
  onClose,
  onModeChange,
  onLoad,
  onSave,
  onDelete,
}: SaveSlotModalProps) {
  const resolvedCanSave = canSave ?? true
  const activeMode = getResolvedSaveSlotMode(mode, resolvedCanSave)
  const showModeTabs = mode === 'manage' && typeof onModeChange === 'function'
  const slotIds = useMemo(
    () => Array.from({ length: slotCount }, (_, index) => index + 1),
    [slotCount],
  )
  const [draftNames, setDraftNames] = useState<Record<number, string>>(() =>
    createSaveSlotDraftNames(slotCount, slotsById),
  )

  const updateDraftName = (slotId: number, nextName: string) => {
    setDraftNames((currentDraftNames) => ({
      ...currentDraftNames,
      [slotId]: nextName,
    }))
  }

  const handleSave = (slotId: number) => {
    const normalizedName = normalizeSaveSlotName(draftNames[slotId])
    updateDraftName(slotId, normalizedName)
    onSave(slotId, normalizedName)
  }

  const handleDelete = (slotId: number) => {
    updateDraftName(slotId, '')
    onDelete(slotId)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel save-slot-modal" role="dialog" aria-modal="true">
        <div className="modal-header save-slot-modal-header">
          <div className="save-slot-modal-heading">
            {showModeTabs ? (
              <SaveSlotModeTabs
                activeMode={activeMode}
                canSave={resolvedCanSave}
                onModeChange={onModeChange}
              />
            ) : null}
            <h2>저장 불러오기</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="slot-list">
          {slotIds.map((slotId) => {
            const slot = slotsById.get(slotId)

            return (
              <SaveSlotCard
                key={slotId}
                slotId={slotId}
                slot={slot}
                slotName={draftNames[slotId] ?? ''}
                canSave={resolvedCanSave}
                statusLabel={getSaveSlotStatusLabel(slot)}
                onChangeSlotName={updateDraftName}
                onSave={handleSave}
                onLoad={onLoad}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
