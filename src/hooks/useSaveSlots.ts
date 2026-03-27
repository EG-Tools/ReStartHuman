import { useCallback, useMemo, useState } from 'react'
import type { AlphaFormData, AlphaResult, SaveSlotRecord } from '../types/alpha'
import {
  SAVE_SLOT_COUNT,
  createSaveSlotRecord,
  readSaveSlotRecords,
  removeSaveSlotRecord,
  sortSaveSlotRecords,
  writeSaveSlotRecord,
} from '../utils/saveSlots'

const getBrowserStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage)

const readSlots = (): SaveSlotRecord[] => readSaveSlotRecords(getBrowserStorage())

export const useSaveSlots = () => {
  const [slots, setSlots] = useState<SaveSlotRecord[]>(() => readSlots())

  const slotsById = useMemo(() => {
    const slotMap = new Map<number, SaveSlotRecord>()

    slots.forEach((slot) => {
      slotMap.set(slot.slotId, slot)
    })

    return slotMap
  }, [slots])

  const replaceSlot = useCallback((nextRecord: SaveSlotRecord) => {
    setSlots((currentSlots) => sortSaveSlotRecords([
      ...currentSlots.filter((slot) => slot.slotId !== nextRecord.slotId),
      nextRecord,
    ]))
  }, [])

  const saveSlot = useCallback((
    slotId: number,
    formData: AlphaFormData,
    result: AlphaResult,
    slotName?: string,
  ) => {
    const storage = getBrowserStorage()

    if (!storage) {
      return
    }

    const record = createSaveSlotRecord(slotId, formData, result, slotName)
    writeSaveSlotRecord(storage, record)
    replaceSlot(record)
  }, [replaceSlot])

  const deleteSlot = useCallback((slotId: number) => {
    const storage = getBrowserStorage()

    if (!storage) {
      return
    }

    removeSaveSlotRecord(storage, slotId)
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.slotId !== slotId))
  }, [])

  return {
    slotCount: SAVE_SLOT_COUNT,
    slots,
    slotsById,
    saveSlot,
    deleteSlot,
  }
}
