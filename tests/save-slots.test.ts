import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import {
  createSaveSlotRecord,
  getSaveSlotStorageKey,
  normalizeSaveSlotName,
  readSaveSlotRecords,
  removeSaveSlotRecord,
  writeSaveSlotRecord,
} from '../src/utils/saveSlots'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

const makeRecord = (slotId: number, name?: string) =>
  createSaveSlotRecord(slotId, defaultFormData, calculateAlphaScenario(defaultFormData), name)

test('저장 슬롯 이름은 공백을 정리하고 기본 이름은 비운다', () => {
  assert.equal(normalizeSaveSlotName('  나의   은퇴  플랜  '), '나의 은퇴 플랜')
  assert.equal(normalizeSaveSlotName('빈슬롯'), '')
  assert.equal(normalizeSaveSlotName('은퇴계산3'), '')
})

test('저장 슬롯은 저장 후 다시 읽으면 슬롯 번호 순서대로 돌아온다', () => {
  const storage = new MemoryStorage()

  writeSaveSlotRecord(storage, makeRecord(3, '세 번째'))
  writeSaveSlotRecord(storage, makeRecord(1, '첫 번째'))

  const records = readSaveSlotRecords(storage)

  assert.deepEqual(
    records.map((record) => ({ slotId: record.slotId, name: record.name })),
    [
      { slotId: 1, name: '첫 번째' },
      { slotId: 3, name: '세 번째' },
    ],
  )
})

test('저장 슬롯은 알 수 없는 버전이나 깨진 데이터는 무시한다', () => {
  const storage = new MemoryStorage()
  const validRecord = makeRecord(1, '정상 슬롯')

  writeSaveSlotRecord(storage, validRecord)
  storage.setItem(getSaveSlotStorageKey(2), '{not-json')
  storage.setItem(
    getSaveSlotStorageKey(3),
    JSON.stringify({
      version: 999,
      ...makeRecord(3, '버전 오류'),
    }),
  )

  const records = readSaveSlotRecords(storage)

  assert.deepEqual(records.map((record) => record.slotId), [1])
})

test('저장 슬롯 삭제는 해당 슬롯만 제거한다', () => {
  const storage = new MemoryStorage()

  writeSaveSlotRecord(storage, makeRecord(1, '보관'))
  writeSaveSlotRecord(storage, makeRecord(2, '삭제 대상'))
  removeSaveSlotRecord(storage, 2)

  const records = readSaveSlotRecords(storage)

  assert.deepEqual(records.map((record) => record.slotId), [1])
})
