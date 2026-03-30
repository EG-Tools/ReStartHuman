import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'

test('detailed living costs include academy cost when children exist', () => {
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

test('detailed living costs ignore academy cost when children do not exist', () => {
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

test('projection years supports a one-year timeline', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    simulationYears: 1,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 1)
})

test('projection years clamps to long timelines', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    simulationYears: 80,
  })

  assert.equal(result.cashBalanceTimeline.at(-1)?.year, 80)
})

test('national pension starts only from the configured age', () => {
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
  assert.equal(
    result.cashBalanceTimeline[30]?.balance,
    result.projectionPensionIncomeTotal -
      result.projectionEstimatedComprehensiveIncomeTaxTotal -
      result.projectionEstimatedLocalIncomeTaxTotal,
  )
})

test('other pension income starts only from the configured age', () => {
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
  assert.equal(result.estimatedComprehensiveIncomeTaxAnnual, 0)
  assert.ok(result.projectionEstimatedComprehensiveIncomeTaxTotal > 0)
  assert.equal(result.cashBalanceTimeline[2]?.balance, 0)
  assert.equal(
    result.cashBalanceTimeline[5]?.balance,
    result.projectionOtherIncomeTotal -
      result.projectionEstimatedComprehensiveIncomeTaxTotal -
      result.projectionEstimatedLocalIncomeTaxTotal,
  )
})

test('additional homes increase holding tax and health insurance property base', () => {
  const baseScenario = calculateAlphaScenario({
    ...defaultFormData,
    housingType: 'own',
    homeMarketValue: 800_000_000,
    homeOfficialValue: 500_000_000,
    healthInsuranceType: 'regional',
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
  })
  const multiHomeScenario = calculateAlphaScenario({
    ...defaultFormData,
    housingType: 'own',
    homeMarketValue: 800_000_000,
    homeOfficialValue: 500_000_000,
    additionalHomes: [
      {
        housingType: 'monthlyRent',
        marketValue: 400_000_000,
        officialValue: 300_000_000,
      },
    ],
    healthInsuranceType: 'regional',
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
  })

  assert.ok(multiHomeScenario.holdingTaxAnnual > baseScenario.holdingTaxAnnual)
  assert.ok(multiHomeScenario.healthInsuranceMonthly > baseScenario.healthInsuranceMonthly)
})

test('monthly rent income applies rental income tax to the final result', () => {
  const businessIncomeScenario = calculateAlphaScenario({
    ...defaultFormData,
    housingType: 'own',
    homeMarketValue: 800_000_000,
    homeOfficialValue: 500_000_000,
    additionalHomes: [
      {
        housingType: 'monthlyRent',
        marketValue: 500_000_000,
        officialValue: 350_000_000,
      },
    ],
    healthInsuranceType: 'regional',
    otherIncomeType: 'business',
    otherIncomeMonthly: 1_500_000,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
  })
  const rentalIncomeScenario = calculateAlphaScenario({
    ...defaultFormData,
    housingType: 'own',
    homeMarketValue: 800_000_000,
    homeOfficialValue: 500_000_000,
    additionalHomes: [
      {
        housingType: 'monthlyRent',
        marketValue: 500_000_000,
        officialValue: 350_000_000,
      },
    ],
    healthInsuranceType: 'regional',
    otherIncomeType: 'monthlyRent',
    otherIncomeMonthly: 1_500_000,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
  })

  assert.equal(businessIncomeScenario.rentalIncomeTaxAnnual, 0)
  assert.ok(rentalIncomeScenario.rentalIncomeTaxAnnual > 0)
  assert.ok(rentalIncomeScenario.monthlyUsableCash > businessIncomeScenario.monthlyUsableCash)
})

test('single selected income category drives the applied income and rental tax', () => {
  const earnedResult = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 60,
    simulationYears: 10,
    inflationEnabled: false,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    selectedIncomeCategories: ['earned'],
    earnedIncomeMonthly: 1_200_000,
    businessIncomeMonthly: 800_000,
    otherPensionMonthly: 500_000,
    otherPensionStartAge: 65,
    rentalIncomeMonthly: 600_000,
    healthInsuranceType: 'employee',
  })
  const rentalResult = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 60,
    simulationYears: 10,
    inflationEnabled: false,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    selectedIncomeCategories: ['rental'],
    earnedIncomeMonthly: 1_200_000,
    businessIncomeMonthly: 800_000,
    otherPensionMonthly: 500_000,
    otherPensionStartAge: 65,
    rentalIncomeMonthly: 1_500_000,
    healthInsuranceType: 'regional',
  })

  assert.equal(earnedResult.otherIncomeMonthlyApplied, 1_200_000)
  assert.equal(earnedResult.incomeBreakdown.length, 1)
  assert.equal(earnedResult.incomeBreakdown[0]?.key, 'earned')
  assert.equal(earnedResult.rentalIncomeTaxAnnual, 0)

  assert.equal(rentalResult.otherIncomeMonthlyApplied, 1_500_000)
  assert.equal(rentalResult.incomeBreakdown.length, 1)
  assert.equal(rentalResult.incomeBreakdown[0]?.key, 'rental')
  assert.ok(rentalResult.rentalIncomeTaxAnnual > 0)
})

test('income duration years cap projected structured income totals', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 10,
    inflationEnabled: false,
    startingCashReserve: 0,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    selectedIncomeCategories: ['earned'],
    earnedIncomeMonthly: 1_000_000,
    earnedIncomeDurationYears: 5,
  })

  assert.equal(result.incomeBreakdown.find((item) => item.key === 'earned')?.projectionTotal, 60_000_000)
  assert.equal(result.projectionOtherIncomeTotal, 60_000_000)
})

test('estimated comprehensive and local income tax reflect structured income base', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 10,
    inflationEnabled: false,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    pensionMonthlyAmount: 0,
    selectedIncomeCategories: ['earned', 'business'],
    earnedIncomeMonthly: 2_000_000,
    earnedIncomeDurationYears: 10,
    businessIncomeMonthly: 1_000_000,
    businessIncomeDurationYears: 10,
  })

  assert.equal(result.estimatedComprehensiveTaxBaseAnnual, 25_650_000)
  assert.ok(result.estimatedComprehensiveIncomeTaxAnnual > 0)
  assert.equal(
    result.estimatedLocalIncomeTaxAnnual,
    Math.round(result.estimatedComprehensiveIncomeTaxAnnual * 0.1),
  )
})
test('ISA 배당만으로는 금융소득 종합과세 검토를 띄우지 않는다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    householdType: 'couple',
    dividendInputMode: 'gross',
    taxableAccountDividendAnnual: 0,
    isaDividendAnnual: 100_000_000,
    isaOwnershipType: 'split',
    myAnnualIsaDividendAttributed: 50_000_000,
    spouseAnnualIsaDividendAttributed: 50_000_000,
    healthInsuranceType: 'dependent',
    pensionMonthlyAmount: 0,
  })

  assert.equal(result.comprehensiveTaxImpactAnnual, 0)
  assert.equal(result.estimatedComprehensiveTaxReviewLevel, 'none')
  assert.deepEqual(result.estimatedComprehensiveTaxReviewReasons, [])
})

test('국민연금은 연금소득공제를 거친 뒤 종합소득세 과세표준에 반영한다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 65,
    simulationYears: 10,
    inflationEnabled: false,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    pensionMonthlyAmount: 1_000_000,
    pensionStartAge: 65,
  })

  assert.equal(result.estimatedComprehensiveTaxBaseAnnual, 4_600_000)
  assert.equal(result.estimatedComprehensiveIncomeTaxAnnual, 276_000)
  assert.equal(result.estimatedLocalIncomeTaxAnnual, 27_600)
})

test('기타소득금액이 연 300만원 이하로 보면 종합소득세 추정에서 제외한다', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 10,
    inflationEnabled: false,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    healthInsuranceType: 'dependent',
    selectedIncomeCategories: ['misc'],
    miscIncomeMonthly: 600_000,
    miscIncomeDurationYears: 10,
  })

  assert.equal(result.estimatedComprehensiveTaxBaseAnnual, 0)
  assert.equal(result.estimatedComprehensiveIncomeTaxAnnual, 0)
  assert.ok(
    result.estimatedComprehensiveTaxReviewReasons.some((reason) =>
      reason.includes('기타소득금액이 연 300만원 이하'),
    ),
  )
})

test('corporate executive salary uses employee insurance assumptions', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    healthInsuranceType: 'regional',
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    pensionMonthlyAmount: 0,
    selectedIncomeCategories: ['corporateExecutive'],
    corporateExecutiveSalaryMonthly: 4_000_000,
    corporateExecutiveDurationYears: 10,
  })

  assert.equal(result.totalIncomeMonthly, 4_000_000)
  assert.equal(
    result.healthInsuranceMonthly,
    Math.round(
      4_000_000 *
        0.0719 *
        0.5,
    ),
  )
  assert.ok(result.estimatedComprehensiveTaxBaseAnnual > 0)
})
test('current health insurance uses the current business amount while projection uses the reflected basis', () => {
  const result = calculateAlphaScenario({
    ...defaultFormData,
    healthInsuranceType: 'regional',
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: 0,
    insuranceMonthly: 0,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    otherFixedMonthly: 0,
    selectedIncomeCategories: ['business'],
    businessIncomeMonthly: 1_000_000,
    previousYearDeclaredBusinessIncomeAnnual: 48_000_000,
  })

  assert.ok(result.nextReflectedHealthInsuranceMonthly > result.healthInsuranceMonthly)
  assert.ok(result.projectionHealthInsuranceTotal >= result.nextReflectedHealthInsuranceMonthly * 12)
})
