import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateRetireScenario } from '../src/engine/calculator'
import { buildResultRows } from '../src/components/result/resultScreen.editors'
import { getLivingCostSnapshot } from '../src/components/result/resultScreen.helpers'

test('생활비 스냅샷은 자녀가 있을 때 학원비를 포함한다', () => {
  const total = getLivingCostSnapshot({
    ...defaultFormData,
    hasChildren: true,
    livingCostInputMode: 'detailed',
    foodMonthly: 400_000,
    necessitiesMonthly: 100_000,
    academyMonthly: 300_000,
    otherLivingMonthly: 200_000,
  })

  assert.equal(total, 1_000_000)
})

test('결과표는 학원비가 있을 때만 학원비 행을 보여준다', () => {
  const formData = {
    ...defaultFormData,
    hasChildren: true,
    livingCostInputMode: 'detailed' as const,
    academyMonthly: 300_000,
  }
  const result = calculateRetireScenario(formData)
  const rows = buildResultRows({
    dividendBasisLabel: '세전 입력',
    fixedExpenseAnnualBase: result.fixedExpenseMonthly * 12,
    fixedExpenseMonthlyBase: result.fixedExpenseMonthly,
    formData,
    householdSummary: '본인',
    housingRowLabel: '자가',
    housingRowNote: '테스트',
    onPatchFormData: () => {},
    result,
  })

  assert.ok(rows.some((row) => row.item === '학원비'))
})

test('결과표는 자녀가 없으면 학원비 행을 숨긴다', () => {
  const formData = {
    ...defaultFormData,
    hasChildren: false,
    livingCostInputMode: 'detailed' as const,
    academyMonthly: 300_000,
  }
  const result = calculateRetireScenario(formData)
  const rows = buildResultRows({
    dividendBasisLabel: '세전 입력',
    fixedExpenseAnnualBase: result.fixedExpenseMonthly * 12,
    fixedExpenseMonthlyBase: result.fixedExpenseMonthly,
    formData,
    householdSummary: '본인',
    housingRowLabel: '자가',
    housingRowNote: '테스트',
    onPatchFormData: () => {},
    result,
  })

  assert.ok(!rows.some((row) => row.item === '학원비'))
})
