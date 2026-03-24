import { useMemo, useState } from 'react'
import type {
  RetireCalcFormData,
  RetireCalcResult,
  SaveSlotRecord,
} from '../types/retireCalc'

const SLOT_COUNT = 5
const STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-'
const SLOT_NAME_STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-name-'

const getStorageKey = (slotId: number) => `${STORAGE_KEY_PREFIX}${slotId}`
const getSlotNameStorageKey = (slotId: number) => `${SLOT_NAME_STORAGE_KEY_PREFIX}${slotId}`
const getDefaultSlotName = (slotId: number) => `은퇴계산${slotId}`

const normalizeSlotName = (slotId: number, nextName: string) => {
  const trimmedName = nextName.replace(/\s+/g, ' ').trim().slice(0, 24)
  return trimmedName.length > 0 ? trimmedName : getDefaultSlotName(slotId)
}

const readSlots = (): SaveSlotRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }

  return Array.from({ length: SLOT_COUNT }, (_, index) => index + 1)
    .map((slotId) => {
      const rawValue = window.localStorage.getItem(getStorageKey(slotId))

      if (!rawValue) {
        return null
      }

      try {
        return JSON.parse(rawValue) as SaveSlotRecord
      } catch {
        return null
      }
    })
    .filter((slot): slot is SaveSlotRecord => slot !== null)
}

const readSlotNames = () => {
  const slotNameMap = new Map<number, string>()

  Array.from({ length: SLOT_COUNT }, (_, index) => index + 1).forEach((slotId) => {
    const defaultSlotName = getDefaultSlotName(slotId)

    if (typeof window === 'undefined') {
      slotNameMap.set(slotId, defaultSlotName)
      return
    }

    const rawName = window.localStorage.getItem(getSlotNameStorageKey(slotId))
    slotNameMap.set(slotId, normalizeSlotName(slotId, rawName ?? defaultSlotName))
  })

  return slotNameMap
}

export const useSaveSlots = () => {
  const [slots, setSlots] = useState<SaveSlotRecord[]>(() => readSlots())
  const [slotNamesById, setSlotNamesById] = useState<Map<number, string>>(() => readSlotNames())

  const slotsById = useMemo(() => {
    const slotMap = new Map<number, SaveSlotRecord>()

    slots.forEach((slot) => {
      slotMap.set(slot.slotId, slot)
    })

    return slotMap
  }, [slots])

  const replaceSlot = (nextRecord: SaveSlotRecord) => {
    setSlots((currentSlots) =>
      [...currentSlots.filter((slot) => slot.slotId !== nextRecord.slotId), nextRecord].sort(
        (left, right) => left.slotId - right.slotId,
      ),
    )
  }

  const renameSlot = (slotId: number, nextName: string) => {
    if (typeof window === 'undefined') {
      return
    }

    const normalizedName = normalizeSlotName(slotId, nextName)
    const defaultSlotName = getDefaultSlotName(slotId)

    if (normalizedName === defaultSlotName) {
      window.localStorage.removeItem(getSlotNameStorageKey(slotId))
    } else {
      window.localStorage.setItem(getSlotNameStorageKey(slotId), normalizedName)
    }

    setSlotNamesById((currentNames) => {
      const nextNames = new Map(currentNames)
      nextNames.set(slotId, normalizedName)
      return nextNames
    })

    const currentSlot = slotsById.get(slotId)

    if (!currentSlot) {
      return
    }

    const nextRecord: SaveSlotRecord = {
      ...currentSlot,
      name: normalizedName,
    }

    window.localStorage.setItem(getStorageKey(slotId), JSON.stringify(nextRecord))
    replaceSlot(nextRecord)
  }

  const saveSlot = (
    slotId: number,
    formData: RetireCalcFormData,
    result: RetireCalcResult,
  ) => {
    if (typeof window === 'undefined') {
      return
    }

    const resolvedSlotName =
      slotNamesById.get(slotId) ?? slotsById.get(slotId)?.name ?? getDefaultSlotName(slotId)

    const record: SaveSlotRecord = {
      slotId,
      name: resolvedSlotName,
      savedAt: new Date().toISOString(),
      formData,
      result,
    }

    window.localStorage.setItem(getStorageKey(slotId), JSON.stringify(record))
    replaceSlot(record)
  }

  const deleteSlot = (slotId: number) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(getStorageKey(slotId))
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.slotId !== slotId))
  }

  return {
    slotCount: SLOT_COUNT,
    slots,
    slotsById,
    slotNamesById,
    saveSlot,
    deleteSlot,
    renameSlot,
  }
}
