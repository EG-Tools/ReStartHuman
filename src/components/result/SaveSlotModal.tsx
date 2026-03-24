import { useMemo, useRef } from 'react'
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

const normalizeSlotName = (slotId: number, nextName: string) => {
  const collapsedName = nextName.replace(/\s+/g, ' ')
  const trimmedName = collapsedName.trim().slice(0, 24)
  return trimmedName.length > 0 ? trimmedName : getDefaultSlotName(slotId)
}

const moveCaretToEnd = (node: HTMLElement) => {
  const textLength = node.textContent?.length ?? 0

  if (textLength === 0) {
    return
  }

  const selection = window.getSelection()

  if (!selection) {
    return
  }

  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  selection.removeAllRanges()
  selection.addRange(range)
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
  const inputRefs = useRef<Record<number, HTMLDivElement | null>>({})

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
    const input = inputRefs.current[slotId]
    const rawValue = input?.textContent ?? resolvedSlotNames.get(slotId) ?? getDefaultSlotName(slotId)
    const committedName = normalizeSlotName(slotId, rawValue)

    if (input && input.textContent !== committedName) {
      input.textContent = committedName
    }

    onRenameSlotName(slotId, committedName)
    return committedName
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
            const defaultSlotName = getDefaultSlotName(slotId)
            const slotName = resolvedSlotNames.get(slotId) ?? defaultSlotName
            const savedAtLabel = slot ? `저장날짜 ${formatDateTime(slot.savedAt)}` : '아직 저장되지 않음'

            return (
              <article key={slotId} className="slot-card">
                <div className="slot-card-main">
                  <div className="slot-name-row">
                    <span className="slot-index-badge">슬롯 {slotId}</span>
                    <div
                      ref={(node) => {
                        inputRefs.current[slotId] = node
                      }}
                      contentEditable="plaintext-only"
                      suppressContentEditableWarning
                      lang="ko"
                      className="slot-name-input"
                      role="textbox"
                      aria-label={`${slotId}번 슬롯 이름`}
                      data-slot-id={slotId}
                      onFocus={(event) => {
                        moveCaretToEnd(event.currentTarget)
                      }}
                      onBlur={() => {
                        commitSlotName(slotId)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          event.currentTarget.blur()
                        }
                      }}
                      onPaste={(event) => {
                        event.preventDefault()
                        const pastedText = event.clipboardData.getData('text/plain').replace(/\s+/g, ' ')
                        document.execCommand('insertText', false, pastedText)
                      }}
                    >
                      {slotName}
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
