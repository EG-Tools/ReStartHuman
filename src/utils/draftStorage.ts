import type { AlphaFormData } from '../types/alpha'
import { safeStorageGetItem, safeStorageRemoveItem, safeStorageSetItem } from './browserStorage'
import { normalizeStoredFormData } from './formDataValidation'

export const FORM_DRAFT_STORAGE_KEY = 'restarthuman-alpha-form-draft'
export const FORM_DRAFT_STORAGE_VERSION = 1 as const

type PersistedFormDraft = {
  version: typeof FORM_DRAFT_STORAGE_VERSION
  savedAt: string
  formData: AlphaFormData
}

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const readFormDraft = (storage?: Storage): AlphaFormData | null => {
  const rawValue = safeStorageGetItem(storage, FORM_DRAFT_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue)

    if (
      !isRecordObject(parsedValue) ||
      parsedValue.version !== FORM_DRAFT_STORAGE_VERSION ||
      typeof parsedValue.savedAt !== 'string' ||
      !Number.isFinite(Date.parse(parsedValue.savedAt))
    ) {
      return null
    }

    return normalizeStoredFormData(parsedValue.formData)
  } catch {
    return null
  }
}

export const writeFormDraft = (storage: Storage | undefined, formData: AlphaFormData) => {
  if (!storage) {
    return false
  }

  const record: PersistedFormDraft = {
    version: FORM_DRAFT_STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    formData,
  }

  return safeStorageSetItem(storage, FORM_DRAFT_STORAGE_KEY, JSON.stringify(record))
}

export const removeFormDraft = (storage?: Storage) => {
  if (!storage) {
    return false
  }

  return safeStorageRemoveItem(storage, FORM_DRAFT_STORAGE_KEY)
}
