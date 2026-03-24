import { useMemo, useRef, useState } from 'react'
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

const DEFAULT_SLOT_NAME_ROOT = '은퇴계산'
const getDefaultSlotName = (slotId: number) => `${DEFAULT_SLOT_NAME_ROOT}${slotId}`

const normalizeEditableSlotName = (nextName: string) => {
  const collapsedName = nextName.replace(/\s+/g, ' ')
  const trimmedName = collapsedName.trim().slice(0, 24)
  return trimmedName.length > 0 ? trimmedName : DEFAULT_SLOT_NAME_ROOT
}

const toEditableSlotName = (slotId: number, fullName: string) =>
  fullName === getDefaultSlotName(slotId) ? DEFAULT_SLOT_NAME_ROOT : fullName

const toCommittedSlotName = (slotId: number, editableName: string) => {
  const normalizedEditableName = normalizeEditableSlotName(editableName)
  return normalizedEditableName === DEFAULT_SLOT_NAME_ROOT
    ? getDefaultSlotName(slotId)
    : normalizedEditableName
}

const moveCaretToEnd = (input: HTMLInputElement) => {
  if (input.value.length === 0) {
    return
  }

  const caretPosition = input.value.length

  try {
    input.setSelectionRange(caretPosition, caretPosition)
  } catch {
    // 일부 모바일 브라우저에서는 selectionRange 설정이 실패할 수 있다.
  }
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
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const composingSlotIdsRef = useRef<Record<number, boolean>>({})
  const [draftSlotNames, setDraftSlotNames] = useState<Record<number, string>>({})

  const activeMode = !canSave || mode === 'load' ? 'load' : mode === 'manage' ? 'save' : 'save'
  const showModeTabs = mode === 'manage'
  const title = activeMode === 'save' ? '현재 계산 저장' : '저장된 계산 불러오기'

  const resolvedSlotNames = useMemo(() => {
    const nextMap = new Map<number, string>()

    Array.from({ length: slotCount }, (_, index) => index + 1).forEach((slotId) => {
      nextMap.set(
        slotId,
        slotNamesById.get(slotId) ?? slotsById.get(slotId)?.name ?? getDefaultSlotName(slotId),
      )
    })

    return nextMap
  }, [slotCount, slotNamesById, slotsById])

  const commitSlotName = (slotId: number) => {
    const resolvedSlotName = resolvedSlotNames.get(slotId) ?? getDefaultSlotName(slotId)
    const rawDraftName = draftSlotNames[slotId] ?? toEditableSlotName(slotId, resolvedSlotName)
    const committedSlotName = toCommittedSlotName(slotId, rawDraftName)
    const committedEditableName = toEditableSlotName(slotId, committedSlotName)

    setDraftSlotNames((currentNames) => ({
      ...currentNames,
      [slotId]: committedEditableName,
    }))

    onRenameSlotName(slotId, committedSlotName)
    return committedSlotName
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-panel save-slot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-slot-modal-title"
      >
        <div className="modal-header save-slot-modal-header">
          <div className="save-slot-modal-heading">
            {showModeTabs ? (
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
            ) : null}
            <h2 id="save-slot-modal-title">{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="slot-list">
          {Array.from({ length: slotCount }, (_, index) => index + 1).map((slotId) => {
            const slot = slotsById.get(slotId)
            const resolvedSlotName = resolvedSlotNames.get(slotId) ?? getDefaultSlotName(slotId)
            const editableSlotName =
              draftSlotNames[slotId] ?? toEditableSlotName(slotId, resolvedSlotName)
            const showDefaultSuffix =
              toCommittedSlotName(slotId, editableSlotName) === getDefaultSlotName(slotId)
            const savedAtLabel = slot ? `저장날짜 ${formatDateTime(slot.savedAt)}` : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card">
                <div className="slot-card-main">
                  <div className="slot-name-row">
                    <span className="slot-index-badge">슬롯 {slotId}</span>
                    <div className={`slot-name-field ${showDefaultSuffix ? 'has-suffix' : ''}`.trim()}>
                      <input
                        ref={(node) => {
                          inputRefs.current[slotId] = node
                        }}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        className="slot-name-input"
                        value={editableSlotName}
                        maxLength={24}
                        onFocus={(event) => {
                          const input = event.currentTarget
                          requestAnimationFrame(() => {
                            if (document.activeElement === input && !composingSlotIdsRef.current[slotId]) {
                              moveCaretToEnd(input)
                            }
                          })
                        }}
                        onCompositionStart={() => {
                          composingSlotIdsRef.current[slotId] = true
                        }}
                        onCompositionEnd={(event) => {
                          composingSlotIdsRef.current[slotId] = false
                          const nextValue =
                            event.currentTarget.value === getDefaultSlotName(slotId)
                              ? DEFAULT_SLOT_NAME_ROOT
                              : event.currentTarget.value

                          setDraftSlotNames((currentNames) => ({
                            ...currentNames,
                            [slotId]: nextValue,
                          }))
                        }}
                        onChange={(event) => {
                          const rawNextValue = event.currentTarget.value
                          const nextValue =
                            rawNextValue === getDefaultSlotName(slotId)
                              ? DEFAULT_SLOT_NAME_ROOT
                              : rawNextValue

                          setDraftSlotNames((currentNames) => ({
                            ...currentNames,
                            [slotId]: nextValue,
                          }))
                        }}
                        onBlur={() => {
                          if (composingSlotIdsRef.current[slotId]) {
                            return
                          }

                          commitSlotName(slotId)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            event.currentTarget.blur()
                          }
                        }}
                        aria-label={`${slotId}번 슬롯 이름`}
                      />
                      {showDefaultSuffix ? (
                        <span className="slot-name-suffix" aria-hidden="true">
                          {slotId}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="slot-status">{savedAtLabel}</p>
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
                  <PrimaryButton
                    onClick={() => {
                      commitSlotName(slotId)
                      onSave(slotId)
                    }}
                    disabled={!canSave}
                  >
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
