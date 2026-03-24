import { useMemo, useState } from 'react'
import { PrimaryButton } from '../common/Ui'
import { normalizeSaveSlotName } from '../../utils/saveSlots'
import type { SaveSlotRecord } from '../../types/retireCalc'
import {
  createSaveSlotDraftNames,
  getResolvedSaveSlotMode,
  getSaveSlotStatusLabel,
} from './saveSlotModal.shared'
import type { SaveSlotModalProps, SwitchableSaveSlotMode } from './saveSlotModal.shared'

interface SaveSlotModeTabsProps {
  activeMode: SwitchableSaveSlotMode
  canSave: boolean
  onModeChange?: (mode: SwitchableSaveSlotMode) => void
}

interface SaveSlotCardProps {
  slotId: number
  slot?: SaveSlotRecord
  slotName: string
  canSave: boolean
  statusLabel: string
  onChangeSlotName: (slotId: number, nextName: string) => void
  onSave: (slotId: number) => void
  onLoad: (slot: SaveSlotRecord) => void
  onDelete: (slotId: number) => void
}

function SaveSlotModeTabs({ activeMode, canSave, onModeChange }: SaveSlotModeTabsProps) {
  return (
    <div className="slot-mode-switch" role="tablist" aria-label="저장 슬롯 모드">
      <button
        type="button"
        className={`slot-mode-button ${activeMode === 'save' ? 'is-active' : ''}`.trim()}
        role="tab"
        aria-selected={activeMode === 'save'}
        onClick={() => canSave && onModeChange?.('save')}
        disabled={!canSave}
      >
        저장
      </button>
      <button
        type="button"
        className={`slot-mode-button ${activeMode === 'load' ? 'is-active' : ''}`.trim()}
        role="tab"
        aria-selected={activeMode === 'load'}
        onClick={() => onModeChange?.('load')}
      >
        불러오기
      </button>
    </div>
  )
}

function SaveSlotCard({
  slotId,
  slot,
  slotName,
  canSave,
  statusLabel,
  onChangeSlotName,
  onSave,
  onLoad,
  onDelete,
}: SaveSlotCardProps) {
  return (
    <article className="slot-card">
      <div className="slot-card-main">
        <div className="slot-name-row">
          <span className="slot-index-badge">결과 {slotId}</span>
          <div className="slot-name-field">
            <input
              type="text"
              className="slot-name-input"
              value={slotName}
              placeholder="빈슬롯"
              maxLength={24}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                onChangeSlotName(slotId, event.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                }
              }}
              aria-label={`${slotId}번 결과 이름`}
            />
          </div>
        </div>
        <p className="slot-status">{statusLabel}</p>
      </div>

      <div className="slot-actions">
        <PrimaryButton onClick={() => onSave(slotId)} disabled={!canSave}>
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
        <PrimaryButton variant="ghost" onClick={() => onDelete(slotId)} disabled={!slot}>
          삭제
        </PrimaryButton>
      </div>
    </article>
  )
}

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
