import type {
  RetireCalcFormData,
  RetireCalcResult,
  SaveSlotRecord,
} from '../types/retireCalc'

export const SAVE_SLOT_COUNT = 5
const STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-'

export const getSaveSlotStorageKey = (slotId: number) => `${STORAGE_KEY_PREFIX}${slotId}`

export const normalizeSaveSlotName = (rawName?: string) => {
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

const sanitizeSaveSlotRecord = (record: SaveSlotRecord): SaveSlotRecord => ({
  ...record,
  name: normalizeSaveSlotName(record.name),
})

export const sortSaveSlotRecords = (records: SaveSlotRecord[]) =>
  [...records].sort((left, right) => left.slotId - right.slotId)

export const readSaveSlotRecords = (storage?: Storage): SaveSlotRecord[] => {
  if (!storage) {
    return []
  }

  return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => index + 1)
    .map((slotId) => {
      const rawValue = storage.getItem(getSaveSlotStorageKey(slotId))

      if (!rawValue) {
        return null
      }

      try {
        return sanitizeSaveSlotRecord(JSON.parse(rawValue) as SaveSlotRecord)
      } catch {
        return null
      }
    })
    .filter((slot): slot is SaveSlotRecord => slot !== null)
}

export const createSaveSlotRecord = (
  slotId: number,
  formData: RetireCalcFormData,
  result: RetireCalcResult,
  slotName?: string,
): SaveSlotRecord => ({
  slotId,
  name: normalizeSaveSlotName(slotName),
  savedAt: new Date().toISOString(),
  formData,
  result,
})

export const writeSaveSlotRecord = (storage: Storage | undefined, record: SaveSlotRecord) => {
  if (!storage) {
    return
  }

  storage.setItem(getSaveSlotStorageKey(record.slotId), JSON.stringify(record))
}

export const removeSaveSlotRecord = (storage: Storage | undefined, slotId: number) => {
  if (!storage) {
    return
  }

  storage.removeItem(getSaveSlotStorageKey(slotId))
}
