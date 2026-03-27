import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { buildResultRows } from '../src/components/result/resultScreen.editors'
import {
  buildDeficitAdviceItems,
  buildInterpretationItems,
  getLivingCostSnapshot,
} from '../src/components/result/resultScreen.helpers'

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
  const result = calculateAlphaScenario(formData)
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
  const result = calculateAlphaScenario(formData)
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

test('결과 해석은 적자일 때 행동 조언을 추가한다', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 30,
    inflationEnabled: false,
    startingCashReserve: 0,
    housingType: 'own' as const,
    homeMarketValue: 0,
    homeOfficialValue: 0,
    livingCostInputMode: 'total' as const,
    livingCostMonthlyTotal: 3_000_000,
    taxableAccountDividendAnnual: 0,
    isaDividendAnnual: 0,
    pensionDividendAnnual: 0,
    pensionMonthlyAmount: 0,
    otherIncomeType: 'none' as const,
    healthInsuranceType: 'dependent' as const,
  }
  const result = calculateAlphaScenario(formData)
  const items = buildDeficitAdviceItems(formData, result)

  assert.ok(items.length > 0)
  assert.ok(items.every((item) => typeof item.message === 'string' && item.message.length > 0))
  assert.ok(items.some((item) => Boolean(item.actionLabel)))
  assert.ok(items.some((item) => item.patch && Object.keys(item.patch).length > 0))
})

test('결과 해석은 흑자일 때 기본 해석만 유지한다', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 30,
    inflationEnabled: false,
    startingCashReserve: 0,
    livingCostInputMode: 'total' as const,
    livingCostMonthlyTotal: 500_000,
    taxableAccountDividendAnnual: 24_000_000,
    otherIncomeType: 'none' as const,
    pensionMonthlyAmount: 0,
    healthInsuranceType: 'dependent' as const,
  }
  const result = calculateAlphaScenario(formData)
  const adviceItems = buildDeficitAdviceItems(formData, result)
  const interpretationItems = buildInterpretationItems({
    assetInterpretation: 'test interpretation',
    effectiveComprehensiveRate: 0,
    formData,
    result,
  })

  assert.equal(adviceItems.length, 0)
  assert.equal(interpretationItems.length, 5)
})
