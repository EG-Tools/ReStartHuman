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

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

class ThrowingStorage implements Storage {
  get length(): number {
    return 0
  }

  clear(): void {
    throw new Error('storage-disabled')
  }

  getItem(key: string): string | null {
    void key
    throw new Error('storage-disabled')
  }

  key(index: number): string | null {
    void index
    return null
  }

  removeItem(key: string): void {
    void key
    throw new Error('storage-disabled')
  }

  setItem(key: string, value: string): void {
    void key
    void value
    throw new Error('storage-disabled')
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


test('readSaveSlotRecords tolerates storage access failures', () => {
  const storage = new ThrowingStorage()

  assert.doesNotThrow(() => {
    assert.deepEqual(readSaveSlotRecords(storage), [])
  })
})

test('writeSaveSlotRecord and removeSaveSlotRecord tolerate storage access failures', () => {
  const storage = new ThrowingStorage()
  const record = makeRecord(1, 'safe write')

  assert.doesNotThrow(() => {
    writeSaveSlotRecord(storage, record)
    removeSaveSlotRecord(storage, 1)
  })
})
