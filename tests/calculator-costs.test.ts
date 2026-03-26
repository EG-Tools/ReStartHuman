import assert from 'node:assert/strict'
import test from 'node:test'
import { policyConfig } from '../src/config/policyConfig'
import { defaultFormData } from '../src/data/defaultFormData'
import {
  calculateCashProjection,
  calculateExpenses,
  estimateHealthInsurance,
} from '../src/engine/calculator.costs'
import { calculateRetireScenario } from '../src/engine/calculator'

test('지출 계산은 월세·차량유지비·대출이자를 모두 합산한다', () => {
  const expenses = calculateExpenses({
    ...defaultFormData,
    housingType: 'monthlyRent',
    monthlyRentAmount: 800_000,
    insuranceMonthly: 100_000,
    maintenanceMonthly: 50_000,
    telecomMonthly: 150_000,
    otherFixedMonthly: 200_000,
    carYearlyCost: 1_200_000,
    loanInterestMonthly: 300_000,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 1_000_000,
  })

  assert.equal(expenses.carMonthlyConverted, 100_000)
  assert.equal(expenses.fixedExpenseMonthly, 600_000)
  assert.equal(expenses.housingMonthlyCost, 800_000)
  assert.equal(expenses.totalExpenseMonthly, 2_700_000)
})

test('현금흐름은 대출이자 반영 기간이 끝나면 그 이후 해부터 이자를 제외한다', () => {
  const projection = calculateCashProjection(
    {
      ...defaultFormData,
      inflationEnabled: false,
      loanInterestMonthly: 100_000,
      loanInterestYears: 2,
      startingCashReserve: 0,
    },
    1_000_000,
    700_000,
    0,
    0,
    0,
    3,
  )

  assert.deepEqual(
    projection.timeline.map((point) => point.balance),
    [0, 3_600_000, 7_200_000, 12_000_000],
  )
  assert.equal(projection.endingBalance, 12_000_000)
})

test('물가상승이 켜지면 같은 조건에서도 마지막 해 잔액이 더 낮아진다', () => {
  const baseFormData = {
    ...defaultFormData,
    loanInterestMonthly: 0,
    loanInterestYears: 0,
    startingCashReserve: 0,
  }

  const withoutInflation = calculateCashProjection(
    {
      ...baseFormData,
      inflationEnabled: false,
      inflationRateAnnual: 0.05,
    },
    2_000_000,
    1_500_000,
    0,
    0,
    0,
    3,
  )

  const withInflation = calculateCashProjection(
    {
      ...baseFormData,
      inflationEnabled: true,
      inflationRateAnnual: 0.05,
    },
    2_000_000,
    1_500_000,
    0,
    0,
    0,
    3,
  )

  assert.ok(withInflation.endingBalance < withoutInflation.endingBalance)
})

test('피부양자는 추가 소득이 기준 이하이면 건강보험료를 0으로 본다', () => {
  const premium = estimateHealthInsurance(
    {
      ...defaultFormData,
      healthInsuranceType: 'dependent',
      otherIncomeType: 'none',
    },
    0,
    0,
    0,
  )

  assert.equal(premium, 0)
})

test('피부양자는 추가 소득이 기준을 넘으면 지역가입자 방식 보험료가 발생한다', () => {
  const annualGross =
    policyConfig.healthInsurance.employeeAdditionalIncomeThresholdAnnual + 12_000_000

  const premium = estimateHealthInsurance(
    {
      ...defaultFormData,
      healthInsuranceType: 'dependent',
      otherIncomeType: 'none',
    },
    annualGross,
    0,
    0,
  )

  assert.ok(premium > 0)
})

test('근로소득 입력은 월 추가소득과 급여 중 큰 값을 사용한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    otherIncomeType: 'earned',
    otherIncomeMonthly: 1_500_000,
    salaryMonthly: 3_000_000,
  })

  assert.equal(result.otherIncomeMonthlyApplied, 3_000_000)
  assert.equal(result.totalIncomeMonthly, 3_000_000)
})

test('건강보험료 수동 입력값이 있으면 계산값 대신 수동값을 사용한다', () => {
  const result = calculateRetireScenario({
    ...defaultFormData,
    healthInsuranceType: 'regional',
    taxableAccountDividendAnnual: 30_000_000,
    healthInsuranceOverrideMonthly: 123_456,
  })

  assert.equal(result.healthInsuranceMonthly, 123_456)
  assert.equal(result.healthInsuranceSource, 'manual')
})
