import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateRetireScenario } from '../src/engine/calculator'

test('상세 생활비는 자녀가 있을 때 학원비를 포함한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    hasChildren: true,
    livingCostInputMode: 'detailed',
    foodMonthly: 1_000_000,
    academyMonthly: 500_000,
    otherLivingMonthly: 250_000,
  })

  assert.equal(result.livingExpenseMonthly, 1_750_000)
})

test('상세 생활비는 자녀가 없으면 남아 있던 학원비를 무시한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    hasChildren: false,
    livingCostInputMode: 'detailed',
    foodMonthly: 1_000_000,
    academyMonthly: 500_000,
    otherLivingMonthly: 250_000,
  })

  assert.equal(result.livingExpenseMonthly, 1_250_000)
})

test('현금흐름 기간은 1년 입력을 그대로 유지한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    simulationYears: 1,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 1)
})

test('현금흐름 기간은 80년 입력을 그대로 유지한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    simulationYears: 80,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 80)
})
