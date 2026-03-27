import { formatDateTime } from '../../utils/format'
import { normalizeSaveSlotName } from '../../utils/saveSlots'
import type { SaveSlotRecord } from '../../types/alpha'

export type SaveSlotMode = 'load' | 'save' | 'manage'
export type SwitchableSaveSlotMode = 'load' | 'save'

export interface SaveSlotModalProps {
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

export const createSaveSlotDraftNames = (
  slotCount: number,
  slotsById: Map<number, SaveSlotRecord>,
) => {
  const nextDraftNames: Record<number, string> = {}

  Array.from({ length: slotCount }, (_, index) => index + 1).forEach((slotId) => {
    nextDraftNames[slotId] = normalizeSaveSlotName(slotsById.get(slotId)?.name)
  })

  return nextDraftNames
}

export const getResolvedSaveSlotMode = (
  mode: SaveSlotMode,
  canSave: boolean,
): SwitchableSaveSlotMode => {
  if (!canSave || mode === 'load') {
    return 'load'
  }

  return mode === 'manage' ? 'save' : 'save'
}

export const getSaveSlotStatusLabel = (slot?: SaveSlotRecord) =>
  slot ? `저장날짜 ${formatDateTime(slot.savedAt)}` : '아직 저장되지 않음'
