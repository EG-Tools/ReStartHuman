import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatNumericDraftValue,
  getNumericInputPrecision,
  parseNumericDraftValue,
  sanitizeNumericDraftValue,
} from '../src/utils/numericInput'

test('소수점 단계 입력은 소수점을 유지한다', () => {
  const precision = getNumericInputPrecision(0.5)
  const draft = sanitizeNumericDraftValue('2.5', precision)

  assert.equal(precision, 1)
  assert.equal(draft, '2.5')
  assert.equal(parseNumericDraftValue({ rawValue: draft, min: 0, precision }), 2.5)
  assert.equal(formatNumericDraftValue(2.5, precision), '2.5')
})

test('정수 단계 입력은 기존처럼 숫자만 허용한다', () => {
  const precision = getNumericInputPrecision(1)

  assert.equal(sanitizeNumericDraftValue('2.5만원', precision), '25')
})
