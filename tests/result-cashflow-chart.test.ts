import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { CashFlowChart } from '../src/components/result/resultScreen.sections'

test('cashflow chart shows the start and end age labels only once after long projections', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 50,
  }
  const result = calculateAlphaScenario(formData)

  const markup = renderToStaticMarkup(
    createElement(CashFlowChart, {
      currentAge: formData.currentAge,
      formData,
      inflationEnabled: formData.inflationEnabled,
      inflationRateAnnual: formData.inflationRateAnnual,
      projectionYears: formData.simulationYears,
      result,
    }),
  )

  const startMatches = markup.match(/50세/g) ?? []
  const endMatches = markup.match(/100세/g) ?? []

  assert.equal(startMatches.length, 1)
  assert.equal(endMatches.length, 1)
})
test('cashflow chart shows an ISA marker when the principal allowance is exhausted', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 30,
    isaAssets: 100_000_000,
    isaDividendAnnual: 5_000_000,
    housingType: 'monthlyRent' as const,
    monthlyRentDeposit: 0,
    monthlyRentAmount: 0,
    healthInsuranceType: 'employee' as const,
    startingCashReserve: 0,
  }
  const result = calculateAlphaScenario(formData)

  const markup = renderToStaticMarkup(
    createElement(CashFlowChart, {
      currentAge: formData.currentAge,
      formData,
      inflationEnabled: formData.inflationEnabled,
      inflationRateAnnual: formData.inflationRateAnnual,
      projectionYears: formData.simulationYears,
      result,
    }),
  )

  const isaMatches = markup.match(/ISA/g) ?? []

  assert.ok(isaMatches.length >= 2)
})

test('cashflow chart shows the regional health insurance transition after retirement', () => {
  const formData = {
    ...defaultFormData,
    householdType: 'couple' as const,
    currentAge: 50,
    simulationYears: 20,
    selectedIncomeCategories: ['earned'] as Array<'earned'>,
    earnedIncomeMonthly: 3_000_000,
    earnedIncomeDurationYears: 10,
    salaryMonthly: 3_000_000,
    healthInsuranceType: 'employeeWithDependentSpouse' as const,
  }
  const result = calculateAlphaScenario(formData)

  const markup = renderToStaticMarkup(
    createElement(CashFlowChart, {
      currentAge: formData.currentAge,
      formData,
      inflationEnabled: formData.inflationEnabled,
      inflationRateAnnual: formData.inflationRateAnnual,
      projectionYears: formData.simulationYears,
      result,
    }),
  )

  assert.match(markup, /퇴직 후 지역 전환/)
  assert.match(markup, /60세/)
})

test('cashflow chart places late markers below the curve when the trend is strongly upward', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 50,
    startingCashReserve: 100_000_000,
    taxableAccountDividendAnnual: 200_000_000,
    insuranceMonthly: 100_000,
    insurancePaymentYears: 35,
    pensionMonthlyAmount: 1_000_000,
    pensionStartAge: 70,
    healthInsuranceType: 'employee' as const,
    housingType: 'monthlyRent' as const,
    monthlyRentDeposit: 0,
    monthlyRentAmount: 0,
    livingCostInputMode: 'total' as const,
    livingCostMonthlyTotal: 1_000_000,
  }
  const result = calculateAlphaScenario(formData)

  const markup = renderToStaticMarkup(
    createElement(CashFlowChart, {
      currentAge: formData.currentAge,
      formData,
      inflationEnabled: formData.inflationEnabled,
      inflationRateAnnual: formData.inflationRateAnnual,
      projectionYears: formData.simulationYears,
      result,
    }),
  )

  assert.match(markup, /placement-bottom/)
})
