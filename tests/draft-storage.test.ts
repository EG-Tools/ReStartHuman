import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import {
  FORM_DRAFT_STORAGE_KEY,
  readFormDraft,
  removeFormDraft,
  writeFormDraft,
} from '../src/utils/draftStorage'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string) {
    return this.store.get(key) ?? null
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

test('입력 임시본은 다시 열 때 복구되고 명시적으로 지울 수 있다', () => {
  const storage = new MemoryStorage()
  const draft = { ...defaultFormData, currentAge: 61, isaDividendAnnual: 7_000_000 }

  assert.equal(writeFormDraft(storage, draft), true)
  assert.deepEqual(readFormDraft(storage), draft)
  assert.equal(removeFormDraft(storage), true)
  assert.equal(readFormDraft(storage), null)
})

test('깨졌거나 알 수 없는 버전의 입력 임시본은 무시한다', () => {
  const storage = new MemoryStorage()

  storage.setItem(FORM_DRAFT_STORAGE_KEY, '{broken-json')
  assert.equal(readFormDraft(storage), null)

  storage.setItem(
    FORM_DRAFT_STORAGE_KEY,
    JSON.stringify({ version: 999, savedAt: new Date().toISOString(), formData: defaultFormData }),
  )
  assert.equal(readFormDraft(storage), null)
})

test('저장소를 사용할 수 없어도 임시본 작업은 실패값만 반환한다', () => {
  assert.equal(writeFormDraft(undefined, defaultFormData), false)
  assert.equal(removeFormDraft(undefined), false)
})
