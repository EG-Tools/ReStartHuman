import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'

test('상세 생활비는 자녀가 있을 때 학원비를 포함한다', () => {
  const result = calculateAlphaScenario({
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
  const result = calculateAlphaScenario({
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
  const result = calculateAlphaScenario({
    ...defaultFormData,
    simulationYears: 1,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 1)
})

test('현금흐름 기간은 80년 입력을 그대로 유지한다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    simulationYears: 80,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 80)
})

test('국민연금은 수령 시작 나이 전에는 현재 월 유입에 반영하지 않고 이후 기간만 누적 반영한다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 30,
    inflationEnabled: false,
    startingCashReserve: 0,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    otherIncomeType: 'none',
    pensionMonthlyAmount: 1_000_000,
    pensionStartAge: 65,
  })

  assert.equal(result.pensionMonthlyApplied, 0)
  assert.equal(result.projectionPensionIncomeTotal, 180_000_000)
  assert.equal(result.cashBalanceTimeline[15]?.balance, 0)
  assert.equal(result.cashBalanceTimeline[30]?.balance, 180_000_000)
})

test('기타연금도 수령 시작 나이 전에는 현재 월 유입에서 제외하고 시작 후부터 누적 반영한다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 63,
    simulationYears: 5,
    inflationEnabled: false,
    startingCashReserve: 0,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    otherIncomeType: 'pension',
    otherIncomeMonthly: 500_000,
    otherIncomeStartAge: 65,
  })

  assert.equal(result.otherIncomeMonthlyApplied, 0)
  assert.equal(result.projectionOtherIncomeTotal, 18_000_000)
  assert.equal(result.cashBalanceTimeline[2]?.balance, 0)
  assert.equal(result.cashBalanceTimeline[5]?.balance, 18_000_000)
})