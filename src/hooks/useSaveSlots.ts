import { useMemo, useState } from 'react'
import type {
  RetireCalcFormData,
  RetireCalcResult,
  SaveSlotRecord,
} from '../types/retireCalc'

const SLOT_COUNT = 5
const STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-'

const getStorageKey = (slotId: number) => `${STORAGE_KEY_PREFIX}${slotId}`

const normalizeSlotName = (rawName?: string) => {
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
        const parsedValue = JSON.parse(rawValue) as SaveSlotRecord
        return {
          ...parsedValue,
          name: normalizeSlotName(parsedValue.name),
        }
      } catch {
        return null
      }
    })
    .filter((slot): slot is SaveSlotRecord => slot !== null)
}

export const useSaveSlots = () => {
  const [slots, setSlots] = useState<SaveSlotRecord[]>(() => readSlots())

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

  const saveSlot = (
    slotId: number,
    formData: RetireCalcFormData,
    result: RetireCalcResult,
    slotName?: string,
  ) => {
    if (typeof window === 'undefined') {
      return
    }

    const record: SaveSlotRecord = {
      slotId,
      name: normalizeSlotName(slotName),
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
    saveSlot,
    deleteSlot,
  }
}
