import { useMemo, useState } from 'react'
import type { RetireCalcFormData, RetireCalcResult, SaveSlotRecord } from '../types/retireCalc'
import {
  SAVE_SLOT_COUNT,
  createSaveSlotRecord,
  readSaveSlotRecords,
  removeSaveSlotRecord,
  sortSaveSlotRecords,
  writeSaveSlotRecord,
} from '../utils/saveSlots'

const readSlots = (): SaveSlotRecord[] =>
  readSaveSlotRecords(typeof window === 'undefined' ? undefined : window.localStorage)

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
    setSlots((currentSlots) => sortSaveSlotRecords([
      ...currentSlots.filter((slot) => slot.slotId !== nextRecord.slotId),
      nextRecord,
    ]))
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

    const record = createSaveSlotRecord(slotId, formData, result, slotName)
    writeSaveSlotRecord(window.localStorage, record)
    replaceSlot(record)
  }

  const deleteSlot = (slotId: number) => {
    if (typeof window === 'undefined') {
      return
    }

    removeSaveSlotRecord(window.localStorage, slotId)
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.slotId !== slotId))
  }

  return {
    slotCount: SAVE_SLOT_COUNT,
    slots,
    slotsById,
    saveSlot,
    deleteSlot,
  }
}
