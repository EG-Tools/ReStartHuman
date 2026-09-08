import { useCallback, useMemo, useState } from 'react'
import type { AlphaFormData, AlphaResult, SaveSlotRecord } from '../types/alpha'
import { getBrowserStorage } from '../utils/browserStorage'
import {
  SAVE_SLOT_COUNT,
  createSaveSlotRecord,
  readSaveSlotRecords,
  removeSaveSlotRecord,
  sortSaveSlotRecords,
  writeSaveSlotRecord,
} from '../utils/saveSlots'

const readSlots = (): SaveSlotRecord[] => readSaveSlotRecords(getBrowserStorage())

export const useSaveSlots = () => {
  const [slots, setSlots] = useState<SaveSlotRecord[]>(() => readSlots())
  const [storageError, setStorageError] = useState<string | null>(null)

  const slotsById = useMemo(() => {
    const slotMap = new Map<number, SaveSlotRecord>()

    slots.forEach((slot) => {
      slotMap.set(slot.slotId, slot)
    })

    return slotMap
  }, [slots])

  const replaceSlot = useCallback((nextRecord: SaveSlotRecord) => {
    setSlots((currentSlots) =>
      sortSaveSlotRecords([
        ...currentSlots.filter((slot) => slot.slotId !== nextRecord.slotId),
        nextRecord,
      ]),
    )
  }, [])

  const saveSlot = useCallback(
    (
      slotId: number,
      formData: AlphaFormData,
      result: AlphaResult,
      slotName?: string,
    ) => {
      const storage = getBrowserStorage()

      if (!storage) {
        setStorageError('이 브라우저에서는 결과를 저장할 수 없습니다.')
        return false
      }

      const record = createSaveSlotRecord(slotId, formData, result, slotName)
      if (!writeSaveSlotRecord(storage, record)) {
        setStorageError('결과를 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.')
        return false
      }

      replaceSlot(record)
      setStorageError(null)
      return true
    },
    [replaceSlot],
  )

  const deleteSlot = useCallback((slotId: number) => {
    const storage = getBrowserStorage()

    if (!storage) {
      setStorageError('이 브라우저에서는 저장 결과를 삭제할 수 없습니다.')
      return false
    }

    if (!removeSaveSlotRecord(storage, slotId)) {
      setStorageError('저장 결과를 삭제하지 못했습니다. 브라우저 저장 공간을 확인해주세요.')
      return false
    }

    setSlots((currentSlots) => currentSlots.filter((slot) => slot.slotId !== slotId))
    setStorageError(null)
    return true
  }, [])

  return {
    slotCount: SAVE_SLOT_COUNT,
    slots,
    slotsById,
    storageError,
    saveSlot,
    deleteSlot,
  }
}
