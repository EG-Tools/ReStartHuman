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

test('living cost snapshot includes academy cost when children exist', () => {
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

test('result rows show academy cost only when children exist', () => {
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

test('result rows hide academy cost when children do not exist', () => {
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

test('deficit advice is added when the scenario is deficit-like', () => {
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

test('jeonse advice moves released housing cash into starting reserve', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 30,
    inflationEnabled: false,
    housingType: 'own' as const,
    homeMarketValue: 1_000_000_000,
    homeOfficialValue: 600_000_000,
    jeonseDeposit: 0,
    startingCashReserve: 100_000_000,
    livingCostInputMode: 'total' as const,
    livingCostMonthlyTotal: 0,
    taxableAccountDividendAnnual: 0,
    isaDividendAnnual: 0,
    pensionDividendAnnual: 0,
    pensionMonthlyAmount: 0,
    otherIncomeType: 'none' as const,
    healthInsuranceType: 'regional' as const,
  }
  const result = calculateAlphaScenario(formData)
  const items = buildDeficitAdviceItems(formData, result)
  const jeonseAdvice = items.find((item) => item.id === 'jeonse-shift')

  assert.ok(jeonseAdvice)
  assert.equal(jeonseAdvice.patch?.housingType, 'jeonse')
  assert.equal(jeonseAdvice.patch?.jeonseDeposit, 600_000_000)
  assert.equal(jeonseAdvice.patch?.startingCashReserve, 500_000_000)
})

test('non-deficit scenarios keep only the base interpretation items', () => {
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

test('result rows include additional homes and rental income tax rows', () => {
  const formData = {
    ...defaultFormData,
    housingType: 'own' as const,
    homeMarketValue: 800_000_000,
    homeOfficialValue: 500_000_000,
    additionalHomes: [
      {
        housingType: 'monthlyRent' as const,
        marketValue: 400_000_000,
        officialValue: 300_000_000,
      },
    ],
    otherIncomeType: 'monthlyRent' as const,
    otherIncomeMonthly: 1_500_000,
    livingCostInputMode: 'total' as const,
    livingCostMonthlyTotal: 0,
    healthInsuranceType: 'regional' as const,
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

  assert.ok(rows.some((row) => row.item === '추가주택 1'))
  assert.ok(rows.some((row) => row.item === '임대소득세'))
})
test('해석 문구는 피부양자와 세금 검토 문구를 함께 보여준다', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    healthInsuranceType: 'dependent' as const,
    selectedIncomeCategories: ['rental'] as Array<'rental'>,
    rentalIncomeMonthly: 1_200_000,
    dependentRentalIncomeType: 'housing' as const,
  }
  const result = calculateAlphaScenario(formData)
  const interpretationItems = buildInterpretationItems({
    assetInterpretation: 'test interpretation',
    effectiveComprehensiveRate: 0,
    formData,
    result,
  })

  assert.equal(interpretationItems.length, 5)
  assert.ok(
    interpretationItems.some((item) => item.includes('피부양자 기준으로 입력했지만')),
  )
  assert.ok(
    interpretationItems.some(
      (item) => item.includes('분리과세 선택 가능성') || item.includes('과세 방식 확인이 필요합니다'),
    ),
  )
})

