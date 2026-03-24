import { useMemo, useState } from 'react'
import { PrimaryButton } from '../common/Ui'
import { formatDateTime } from '../../utils/format'
import type { SaveSlotRecord } from '../../types/retireCalc'

type SaveSlotMode = 'load' | 'save' | 'manage'
type SwitchableSaveSlotMode = 'load' | 'save'

interface SaveSlotModalProps {
  mode: SaveSlotMode
  slotCount: number
  slotsById: Map<number, SaveSlotRecord>
  canSave?: boolean
  onClose: () => void
  onModeChange?: (mode: SwitchableSaveSlotMode) => void
  onLoad: (slot: SaveSlotRecord) => void
  onSave: (slotId: number, slotName: string) => void
  onDelete: (slotId: number) => void
}

const normalizeDraftName = (rawName?: string) => {
  const normalizedName = (rawName ?? '').replace(/\s+/g, ' ').trim().slice(0, 24)

  if (
    normalizedName.length === 0 ||
    normalizedName === '빈슬롯' ||
    /^은퇴계산\d*$/.test(normalizedName)
  ) {
    return ''
  }

  return normalizedName
}

const createDraftNames = (slotCount: number, slotsById: Map<number, SaveSlotRecord>) => {
  const nextDraftNames: Record<number, string> = {}

  Array.from({ length: slotCount }, (_, index) => index + 1).forEach((slotId) => {
    nextDraftNames[slotId] = normalizeDraftName(slotsById.get(slotId)?.name)
  })

  return nextDraftNames
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
  const activeMode: SwitchableSaveSlotMode =
    !resolvedCanSave || mode === 'load' ? 'load' : mode === 'manage' ? 'save' : 'save'
  const showModeTabs = mode === 'manage' && typeof onModeChange === 'function'
  const slotIds = useMemo(
    () => Array.from({ length: slotCount }, (_, index) => index + 1),
    [slotCount],
  )
  const [draftNames, setDraftNames] = useState<Record<number, string>>(() =>
    createDraftNames(slotCount, slotsById),
  )

  const updateDraftName = (slotId: number, nextName: string) => {
    setDraftNames((currentDraftNames) => ({
      ...currentDraftNames,
      [slotId]: nextName,
    }))
  }

  const handleSave = (slotId: number) => {
    const normalizedName = normalizeDraftName(draftNames[slotId])
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
              <div className="slot-mode-switch" role="tablist" aria-label="저장 슬롯 모드">
                <button
                  type="button"
                  className={`slot-mode-button ${activeMode === 'save' ? 'is-active' : ''}`.trim()}
                  role="tab"
                  aria-selected={activeMode === 'save'}
                  onClick={() => resolvedCanSave && onModeChange?.('save')}
                  disabled={!resolvedCanSave}
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
            const draftName = draftNames[slotId] ?? ''
            const savedAtLabel = slot
              ? `저장날짜 ${formatDateTime(slot.savedAt)}`
              : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card">
                <div className="slot-card-main">
                  <div className="slot-name-row">
                    <span className="slot-index-badge">결과 {slotId}</span>
                    <div className="slot-name-field">
                      <input
                        type="text"
                        className="slot-name-input"
                        value={draftName}
                        placeholder="빈슬롯"
                        maxLength={24}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => {
                          updateDraftName(slotId, event.target.value)
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
                  <p className="slot-status">{savedAtLabel}</p>
                </div>

                <div className="slot-actions">
                  <PrimaryButton onClick={() => handleSave(slotId)} disabled={!resolvedCanSave}>
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
                    onClick={() => handleDelete(slotId)}
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
