import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultFormData } from '../src/data/defaultFormData'
import { getAccessModeFormData } from '../src/utils/accessMode'
import { questionFlow } from '../src/data/questionFlow'

test('general access mode strips pro-only household, property, and split fields', () => {
  const generalData = getAccessModeFormData(
    {
      ...defaultFormData,
      householdType: 'couple',
      hasChildren: true,
      childCount: 2,
      additionalHomes: [
        {
          housingType: 'own',
          marketValue: 800_000_000,
          officialValue: 500_000_000,
        },
      ],
      hasLandOrOtherProperty: true,
      landValue: 400_000_000,
      otherPropertyOfficialValue: 200_000_000,
      isaAssets: 300_000_000,
      taxableAccountDividendAnnual: 50_000_000,
      isaDividendAnnual: 10_000_000,
      dividendOwnershipType: 'split',
      myAnnualDividendAttributed: 20_000_000,
      spouseAnnualDividendAttributed: 30_000_000,
      healthInsuranceType: 'employee',
    },
    'general',
  )

  assert.equal(generalData.householdType, 'single')
  assert.equal(generalData.hasChildren, false)
  assert.equal(generalData.childCount, 0)
  assert.deepEqual(generalData.additionalHomes, [])
  assert.equal(generalData.hasLandOrOtherProperty, false)
  assert.equal(generalData.landValue, 0)
  assert.equal(generalData.otherPropertyOfficialValue, 0)
  assert.equal(generalData.isaAssets, 0)
  assert.equal(generalData.isaDividendAnnual, 0)
  assert.equal(generalData.dividendOwnershipType, 'mineOnly')
  assert.equal(generalData.myAnnualDividendAttributed, 50_000_000)
  assert.equal(generalData.spouseAnnualDividendAttributed, 0)
  assert.equal(generalData.healthInsuranceType, 'regional')
})

test('general access mode keeps only misc income and total-style expenses', () => {
  const generalData = getAccessModeFormData(
    {
      ...defaultFormData,
      selectedIncomeCategories: ['business'],
      businessIncomeMonthly: 2_000_000,
      miscIncomeMonthly: 700_000,
      miscIncomeDurationYears: 4,
      insuranceMonthly: 200_000,
      telecomMonthly: 100_000,
      maintenanceMonthly: 150_000,
      hasLoan: true,
      loanInterestMonthly: 300_000,
      livingCostInputMode: 'detailed',
      foodMonthly: 500_000,
      necessitiesMonthly: 200_000,
      diningOutMonthly: 100_000,
      hobbyMonthly: 100_000,
      otherLivingMonthly: 50_000,
      hasCar: true,
      carYearlyCost: 1_200_000,
    },
    'general',
  )

  assert.deepEqual(generalData.selectedIncomeCategories, ['misc'])
  assert.equal(generalData.businessIncomeMonthly, 0)
  assert.equal(generalData.miscIncomeMonthly, 700_000)
  assert.equal(generalData.otherIncomeType, 'other')
  assert.equal(generalData.otherIncomeMonthly, 700_000)
  assert.equal(generalData.otherFixedMonthly, 750_000)
  assert.equal(generalData.livingCostInputMode, 'total')
  assert.equal(generalData.livingCostMonthlyTotal, 1_050_000)
  assert.equal(generalData.hasCar, false)
  assert.equal(generalData.loanInterestMonthly, 0)
})

test('general access mode hides pro-only question steps', () => {
  const generalQuestionIds = questionFlow
    .filter((question) => question.visibility(defaultFormData, 'general'))
    .map((question) => question.id)

  const proQuestionIds = questionFlow
    .filter((question) => question.visibility(defaultFormData, 'pro'))
    .map((question) => question.id)

  assert.deepEqual(generalQuestionIds, [
    'household',
    'housingDetails',
    'assets',
    'dividends',
    'income',
    'healthInsurance',
    'fixedExpenses',
    'livingCosts',
    'cashReserve',
  ])
  assert.ok(proQuestionIds.includes('propertyAssets'))
})
