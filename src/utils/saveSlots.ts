import type {
  RetireCalcFormData,
  RetireCalcResult,
  SaveSlotRecord,
} from '../types/retireCalc'

export const SAVE_SLOT_COUNT = 5
export const SAVE_SLOT_STORAGE_VERSION = 1 as const
const STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-'

interface PersistedSaveSlotRecordV1 extends SaveSlotRecord {
  version: typeof SAVE_SLOT_STORAGE_VERSION
}

type PersistedSaveSlotRecord = PersistedSaveSlotRecordV1

type LegacySaveSlotRecord = SaveSlotRecord & {
  version?: undefined
}

type ParsedSaveSlotRecord = PersistedSaveSlotRecord | LegacySaveSlotRecord

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isSaveSlotRecordShape = (value: unknown): value is SaveSlotRecord => {
  if (!isRecordObject(value)) {
    return false
  }

  return (
    typeof value.slotId === 'number' &&
    typeof value.name === 'string' &&
    typeof value.savedAt === 'string' &&
    isRecordObject(value.formData) &&
    isRecordObject(value.result)
  )
}

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

const migrateParsedSaveSlotRecord = (value: unknown): SaveSlotRecord | null => {
  if (!isSaveSlotRecordShape(value)) {
    return null
  }

  const parsedRecord = value as ParsedSaveSlotRecord

  if ('version' in parsedRecord && parsedRecord.version !== SAVE_SLOT_STORAGE_VERSION) {
    return null
  }

  return sanitizeSaveSlotRecord({
    slotId: parsedRecord.slotId,
    name: parsedRecord.name,
    savedAt: parsedRecord.savedAt,
    formData: parsedRecord.formData as RetireCalcFormData,
    result: parsedRecord.result as RetireCalcResult,
  })
}

const serializeSaveSlotRecord = (record: SaveSlotRecord): PersistedSaveSlotRecord => ({
  version: SAVE_SLOT_STORAGE_VERSION,
  ...sanitizeSaveSlotRecord(record),
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
        return migrateParsedSaveSlotRecord(JSON.parse(rawValue))
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

  storage.setItem(getSaveSlotStorageKey(record.slotId), JSON.stringify(serializeSaveSlotRecord(record)))
}

export const removeSaveSlotRecord = (storage: Storage | undefined, slotId: number) => {
  if (!storage) {
    return
  }

  storage.removeItem(getSaveSlotStorageKey(slotId))
}
