import { useMemo, useState } from 'react'
import type {
  RetireCalcFormData,
  RetireCalcResult,
  SaveSlotRecord,
} from '../types/retireCalc'

const SLOT_COUNT = 5
const STORAGE_KEY_PREFIX = 'kr-retire-calc-slot-'

const getStorageKey = (slotId: number) => `${STORAGE_KEY_PREFIX}${slotId}`

const getDefaultSlotName = (slotId: number) => `은퇴계산${slotId}`

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
  ) => {
    if (typeof window === 'undefined') {
      return
    }

    const record: SaveSlotRecord = {
      slotId,
      name: getDefaultSlotName(slotId),
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
