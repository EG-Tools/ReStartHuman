import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { buildResultRows } from '../src/components/result/resultScreen.editors'
import { formatCompactCurrency } from '../src/utils/format'

const buildRows = (formData = defaultFormData) => {
  const result = calculateAlphaScenario(formData)

  return buildResultRows({
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
}

test('total income row shows an empty-income message when nothing is entered', () => {
  const rows = buildRows({
    ...defaultFormData,
    taxableAccountDividendAnnual: 0,
    isaDividendAnnual: 0,
    pensionMonthlyAmount: 0,
    otherIncomeType: 'none',
    otherIncomeMonthly: 0,
  })

  const totalIncomeRow = rows.find((row) => row.item === '총 유입')
  assert.equal(totalIncomeRow?.input, '입력된 소득 없음')
})

test('ISA row uses projected dividend total after liquidation', () => {
  const formData: typeof defaultFormData = {
    ...defaultFormData,
    simulationYears: 30,
    inflationEnabled: false,
    startingCashReserve: 0,
    housingType: 'monthlyRent',
    monthlyRentDeposit: 0,
    monthlyRentAmount: 0,
    healthInsuranceType: 'dependent',
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    taxableAccountDividendAnnual: 0,
    isaAssets: 100_000_000,
    isaDividendAnnual: 5_000_000,
  }
  const result = calculateAlphaScenario(formData)
  const rows = buildResultRows({
    dividendBasisLabel: '세전 입력',
    fixedExpenseAnnualBase: result.fixedExpenseMonthly * 12,
    fixedExpenseMonthlyBase: result.fixedExpenseMonthly,
    formData,
    householdSummary: '본인',
    housingRowLabel: '주거',
    housingRowNote: '테스트',
    onPatchFormData: () => {},
    result,
  })

  const isaRow = rows.find((row) => row.item === 'ISA 배당')

  assert.equal(result.projectionIsaDividendTotal, 100_000_000)
  assert.equal(isaRow?.tenYear, formatCompactCurrency(result.projectionIsaDividendTotal))
})

test('vehicle rows stay hidden when there is no car input', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasCar: false,
    currentCarMarketValue: 0,
    carYearlyCost: 0,
  })

  assert.ok(!rows.some((row) => row.item === '차량 시가'))
  assert.ok(!rows.some((row) => row.item === '차량유지비'))
})

test('vehicle rows appear when car inputs exist', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasCar: true,
    currentCarMarketValue: 12_000_000,
    carYearlyCost: 1_200_000,
  })

  assert.ok(rows.some((row) => row.item === '차량 시가'))
  assert.ok(rows.some((row) => row.item === '차량유지비'))
})

test('loan interest row appears even when only the loan flag is enabled', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasLoan: true,
    loanInterestMonthly: 0,
    loanInterestYears: 0,
  })

  assert.ok(rows.some((row) => row.item === '대출이자'))
})

test('loan interest note is capped by the simulation years', () => {
  const formData: typeof defaultFormData = {
    ...defaultFormData,
    hasLoan: true,
    simulationYears: 10,
    loanInterestMonthly: 200_000,
    loanInterestYears: 20,
  }
  const rows = buildRows(formData)
  const loanRow = rows.find((row) => row.item === '대출이자')

  assert.equal(loanRow?.note, '10년치 반영')
})

test('other income row appears only when an income type is selected and has value', () => {
  const hiddenRows = buildRows({
    ...defaultFormData,
    otherIncomeType: 'none',
    otherIncomeMonthly: 5_000_000,
  })
  const visibleRows = buildRows({
    ...defaultFormData,
    otherIncomeType: 'business',
    otherIncomeMonthly: 5_000_000,
  })

  assert.ok(!hiddenRows.some((row) => row.note === '10년간 반영' && row.monthly === '500만원'))
  assert.ok(visibleRows.some((row) => row.note === '10년간 반영' && row.monthly === '500만원'))
})

test('income rows follow the active single selected category', () => {
  const rows = buildRows({
    ...defaultFormData,
    selectedIncomeCategories: ['rental'],
    earnedIncomeMonthly: 1_000_000,
    rentalIncomeMonthly: 700_000,
  })

  assert.equal(rows.filter((row) => row.category === '소득').length, 1)
  assert.ok(rows.some((row) => row.item === '임대소득'))
  assert.ok(!rows.some((row) => row.item === '근로소득'))
})

test('income rows show duration notes when a structured income ends before the projection horizon', () => {
  const rows = buildRows({
    ...defaultFormData,
    selectedIncomeCategories: ['earned'],
    earnedIncomeMonthly: 1_000_000,
    earnedIncomeDurationYears: 5,
    healthInsuranceType: 'dependent',
  })

  const earnedRow = rows.find((row) => row.note === '5년간 반영' && row.monthly === '100만원')
  assert.equal(earnedRow?.note, '5년간 반영')
})

test('estimated comprehensive and local tax rows appear for taxable structured income', () => {
  const rows = buildRows({
    ...defaultFormData,
    selectedIncomeCategories: ['earned', 'business'],
    earnedIncomeMonthly: 2_000_000,
    businessIncomeMonthly: 1_000_000,
    healthInsuranceType: 'dependent',
  })

  assert.ok(rows.some((row) => row.item === '소득세'))
  assert.ok(rows.some((row) => row.item === '지방세'))
})
test('business rows explain tax and health insurance bases', () => {
  const rows = buildRows({
    ...defaultFormData,
    healthInsuranceType: 'regional',
    selectedIncomeCategories: ['business'],
    businessIncomeMonthly: 1_000_000,
    previousYearDeclaredBusinessIncomeAnnual: 24_000_000,
  })

  const healthInsuranceRow = rows.find((row) => row.item === '건강보험료')
  const comprehensiveTaxRow = rows.find((row) => row.item === '소득세')

  assert.ok(healthInsuranceRow?.noteDetail?.includes('직전년도 신고 사업소득금액'))
  assert.ok(comprehensiveTaxRow?.noteDetail?.includes('업종군과 필요경비에 따라 실제 세액은 달라질 수 있습니다'))
})

test('deferred national pension stays visible without being added to current total income', () => {
  const rows = buildRows({
    ...defaultFormData,
    currentAge: 50,
    pensionStartAge: 65,
    pensionMonthlyAmount: 1_000_000,
  })

  const pensionRow = rows.find((row) => row.item === '국민연금')
  const totalIncomeRow = rows.find((row) => row.item === '총 유입')

  assert.equal(pensionRow?.monthly, '100만원')
  assert.equal(pensionRow?.annual, '1,200만원')
  assert.equal(totalIncomeRow?.input, '국민연금 65세 이후 반영')
})
test('임대소득만 있어도 종합소득세 행은 추정 기준 안내 문구를 유지한다', () => {
  const rows = buildRows({
    ...defaultFormData,
    healthInsuranceType: 'regional',
    selectedIncomeCategories: ['rental'],
    rentalIncomeMonthly: 1_000_000,
    dependentRentalIncomeType: 'housing',
  })

  const comprehensiveTaxRow = rows.find((row) => row.item === '소득세')
  const localTaxRow = rows.find((row) => row.item === '지방세')

  assert.equal(comprehensiveTaxRow?.input, '추정 기준 안내')
  assert.equal(comprehensiveTaxRow?.note, '추정 · 기준 확인')
  assert.ok(localTaxRow)
})

test('result table uses simplified tax row labels for readability', () => {
  const rows = buildRows({
    ...defaultFormData,
    currentAge: 65,
    healthInsuranceType: 'dependent',
    pensionMonthlyAmount: 1_000_000,
    pensionStartAge: 65,
    selectedIncomeCategories: ['otherPension'],
    otherPensionMonthly: 1_000_000,
    otherPensionStartAge: 65,
    taxableAccountDividendAnnual: 30_000_000,
  })

  assert.ok(rows.some((row) => row.item === '소득세'))
  assert.ok(rows.some((row) => row.item === '지방세'))
  assert.ok(rows.some((row) => row.item === '개인연금세'))
  assert.ok(rows.some((row) => row.item === '배당추가세'))
})


