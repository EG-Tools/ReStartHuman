import { policyConfig } from '../config/policyConfig'
import type { RetireCalcFormData, RetireCalcResult } from '../types/retireCalc'
import { calculateCashProjection, calculateExpenses, estimateHealthInsurance, estimateHoldingTax } from './calculator.costs'
import { calculateComprehensiveTax, calculateIsaTax, calculateTaxableStream } from './calculator.income'
import {
  clampRate,
  createDividendStream,
  getOwnershipAllocations,
  roundCurrency,
  sanitizeMoney,
  sanitizeOptionalMoney,
} from './calculator.shared'

const sanitizeInput = (formData: RetireCalcFormData): RetireCalcFormData => ({
  ...formData,
  isaType: formData.isaType === 'workingClass' ? 'workingClass' : 'general',
  myIsaType:
    formData.myIsaType === 'workingClass'
      ? 'workingClass'
      : formData.isaType === 'workingClass'
        ? 'workingClass'
        : 'general',
  spouseIsaType:
    formData.spouseIsaType === 'workingClass'
      ? 'workingClass'
      : formData.isaType === 'workingClass'
        ? 'workingClass'
        : 'general',
  simulationYears: Math.min(50, Math.max(10, sanitizeMoney(formData.simulationYears) || 30)),
  homeMarketValue: sanitizeMoney(formData.homeMarketValue),
  homeOfficialValue: sanitizeMoney(formData.homeOfficialValue),
  jeonseDeposit: sanitizeMoney(formData.jeonseDeposit),
  monthlyRentDeposit: sanitizeMoney(formData.monthlyRentDeposit),
  monthlyRentAmount: sanitizeMoney(formData.monthlyRentAmount),
  monthlyMaintenanceFee: sanitizeMoney(formData.monthlyMaintenanceFee),
  landValue: sanitizeMoney(formData.landValue),
  myLandShare: sanitizeMoney(formData.myLandShare),
  spouseLandShare: sanitizeMoney(formData.spouseLandShare),
  otherPropertyOfficialValue: sanitizeMoney(formData.otherPropertyOfficialValue),
  myOtherPropertyShare: sanitizeMoney(formData.myOtherPropertyShare),
  spouseOtherPropertyShare: sanitizeMoney(formData.spouseOtherPropertyShare),
  taxableAccountAssets: sanitizeMoney(formData.taxableAccountAssets),
  isaAssets: sanitizeMoney(formData.isaAssets),
  pensionAccountAssets: sanitizeMoney(formData.pensionAccountAssets),
  otherAssets: sanitizeMoney(formData.otherAssets),
  taxableAccountDividendAnnual: sanitizeMoney(formData.taxableAccountDividendAnnual),
  isaDividendAnnual: sanitizeMoney(formData.isaDividendAnnual),
  pensionDividendAnnual: sanitizeMoney(formData.pensionDividendAnnual),
  isaYearsSinceOpen: sanitizeMoney(formData.isaYearsSinceOpen),
  myAnnualDividendAttributed: sanitizeMoney(formData.myAnnualDividendAttributed),
  spouseAnnualDividendAttributed: sanitizeMoney(formData.spouseAnnualDividendAttributed),
  myAnnualIsaDividendAttributed: sanitizeMoney(formData.myAnnualIsaDividendAttributed),
  spouseAnnualIsaDividendAttributed: sanitizeMoney(formData.spouseAnnualIsaDividendAttributed),
  otherIncomeMonthly: sanitizeMoney(formData.otherIncomeMonthly),
  pensionStartAge: sanitizeMoney(formData.pensionStartAge),
  pensionMonthlyAmount: sanitizeMoney(formData.pensionMonthlyAmount),
  salaryMonthly: sanitizeMoney(formData.salaryMonthly),
  healthInsuranceOverrideMonthly: sanitizeOptionalMoney(formData.healthInsuranceOverrideMonthly),
  insuranceMonthly: sanitizeMoney(formData.insuranceMonthly),
  maintenanceMonthly: sanitizeMoney(formData.maintenanceMonthly),
  telecomMonthly: sanitizeMoney(formData.telecomMonthly),
  nationalPensionMonthly: sanitizeMoney(formData.nationalPensionMonthly),
  currentCarMarketValue: sanitizeMoney(formData.currentCarMarketValue),
  carYearlyCost: sanitizeMoney(formData.carYearlyCost),
  loanInterestMonthly: sanitizeMoney(formData.loanInterestMonthly),
  loanInterestYears: sanitizeMoney(formData.loanInterestYears),
  otherFixedMonthly: sanitizeMoney(formData.otherFixedMonthly),
  livingCostMonthlyTotal: sanitizeMoney(formData.livingCostMonthlyTotal),
  foodMonthly: sanitizeMoney(formData.foodMonthly),
  necessitiesMonthly: sanitizeMoney(formData.necessitiesMonthly),
  diningOutMonthly: sanitizeMoney(formData.diningOutMonthly),
  hobbyMonthly: sanitizeMoney(formData.hobbyMonthly),
  academyMonthly: sanitizeMoney(formData.academyMonthly ?? 0),
  otherLivingMonthly: sanitizeMoney(formData.otherLivingMonthly),
  inflationRateAnnual: clampRate(formData.inflationRateAnnual, policyConfig.inflation.defaultAnnualRate),
  startingCashReserve: sanitizeMoney(formData.startingCashReserve),
  currentAge: Math.max(1, sanitizeMoney(formData.currentAge) || 50),
})

export const calculateRetireScenario = (rawFormData: RetireCalcFormData): RetireCalcResult => {
  const formData = sanitizeInput(rawFormData)
  const taxableDividend = calculateTaxableStream(
    formData.taxableAccountDividendAnnual,
    formData.dividendInputMode,
    true,
  )
  const pensionDividend = calculateTaxableStream(
    formData.pensionDividendAnnual,
    formData.dividendInputMode,
    false,
  )
  const taxableDividendOwnershipBreakdown = getOwnershipAllocations({
    householdType: formData.householdType,
    ownershipType: formData.dividendOwnershipType,
    totalAnnualInput: formData.taxableAccountDividendAnnual,
    totalAnnualAllocated: taxableDividend.annualGross,
    myAttributedAnnualInput: formData.myAnnualDividendAttributed,
  })
  const isaDividendOwnershipBreakdown = getOwnershipAllocations({
    householdType: formData.householdType,
    ownershipType: formData.isaOwnershipType,
    totalAnnualInput: formData.isaDividendAnnual,
    totalAnnualAllocated: formData.isaDividendAnnual,
    myAttributedAnnualInput: formData.myAnnualIsaDividendAttributed,
  })
  const isaResult = calculateIsaTax({ formData, ownershipBreakdown: isaDividendOwnershipBreakdown })

  const totalDividendAnnualGross =
    taxableDividend.annualGross + isaResult.stream.annualGross + pensionDividend.annualGross
  const totalDividendAnnualNet =
    taxableDividend.annualNet + isaResult.stream.annualNet + pensionDividend.annualNet
  const totalDividend = createDividendStream(totalDividendAnnualGross, totalDividendAnnualNet)

  const comprehensiveTax = calculateComprehensiveTax(taxableDividendOwnershipBreakdown)
  const expenses = calculateExpenses(formData)
  const pensionMonthlyApplied = formData.pensionMonthlyAmount
  const otherIncomeMonthlyApplied =
    formData.otherIncomeType === 'none'
      ? 0
      : formData.otherIncomeType === 'earned'
        ? Math.max(formData.otherIncomeMonthly, formData.salaryMonthly)
        : formData.otherIncomeMonthly
  const estimatedHealthInsurance = estimateHealthInsurance(
    formData,
    totalDividend.annualGross,
    otherIncomeMonthlyApplied,
    pensionMonthlyApplied,
  )
  const healthInsuranceMonthly =
    formData.healthInsuranceOverrideMonthly ?? estimatedHealthInsurance
  const holdingTax = estimateHoldingTax(formData)
  const totalIncomeMonthly =
    totalDividend.monthlyNet + otherIncomeMonthlyApplied + pensionMonthlyApplied
  const monthlyUsableCash = roundCurrency(
    totalIncomeMonthly - healthInsuranceMonthly - holdingTax.monthly - comprehensiveTax.impactAnnual / 12,
  )
  const monthlySurplusOrDeficit = roundCurrency(monthlyUsableCash - expenses.totalExpenseMonthly)
  const yearlySurplusOrDeficit = roundCurrency(monthlySurplusOrDeficit * 12)
  const cashProjection = calculateCashProjection(
    formData,
    totalIncomeMonthly,
    expenses.totalExpenseMonthly,
    healthInsuranceMonthly,
    holdingTax.monthly,
    comprehensiveTax.impactAnnual,
    formData.simulationYears,
  )
  const tenYearSurplusOrDeficit = cashProjection.cumulativeNetChange

  return {
    policyBaseDate: policyConfig.policyBaseDate,
    policyStatus: policyConfig.policyStatus,
    dividendInputMode: formData.dividendInputMode,
    taxableDividendAnnualGross: taxableDividend.annualGross,
    taxableDividendAnnualNet: taxableDividend.annualNet,
    taxableDividendMonthlyGross: taxableDividend.monthlyGross,
    taxableDividendMonthlyNet: taxableDividend.monthlyNet,
    taxableDividendWithholdingAnnual: roundCurrency(
      taxableDividend.annualGross - taxableDividend.annualNet,
    ),
    taxableDividendWithholdingRate: policyConfig.dividendWithholding.totalRate,
    taxableDividendOwnershipBreakdown,
    isaDividendAnnualGross: isaResult.stream.annualGross,
    isaDividendAnnualNet: isaResult.stream.annualNet,
    isaDividendMonthlyGross: isaResult.stream.monthlyGross,
    isaDividendMonthlyNet: isaResult.stream.monthlyNet,
    isaTaxAnnual: isaResult.taxAnnual,
    isaTaxFreeLimitApplied: isaResult.taxFreeLimitApplied,
    isaExcessTaxRate: policyConfig.isa.excessTaxRate,
    isaDividendOwnershipBreakdown,
    isaTaxBreakdown: isaResult.breakdown,
    pensionDividendAnnualGross: pensionDividend.annualGross,
    pensionDividendAnnualNet: pensionDividend.annualNet,
    pensionDividendMonthlyGross: pensionDividend.monthlyGross,
    pensionDividendMonthlyNet: pensionDividend.monthlyNet,
    totalDividendAnnualGross: totalDividend.annualGross,
    totalDividendAnnualNet: totalDividend.annualNet,
    totalDividendMonthlyGross: totalDividend.monthlyGross,
    totalDividendMonthlyNet: totalDividend.monthlyNet,
    comprehensiveTaxIncluded: comprehensiveTax.included,
    comprehensiveTaxImpactAnnual: comprehensiveTax.impactAnnual,
    comprehensiveTaxThresholdAnnual: comprehensiveTax.thresholdAnnual,
    comprehensiveTaxBaseAnnual: comprehensiveTax.baseAnnual,
    comprehensiveTaxBreakdown: comprehensiveTax.breakdown,
    healthInsuranceMonthly,
    healthInsuranceSource: formData.healthInsuranceOverrideMonthly === null ? 'estimated' : 'manual',
    holdingTaxAnnual: holdingTax.annual,
    holdingTaxMonthly: holdingTax.monthly,
    holdingTaxBreakdown: holdingTax.breakdown,
    pensionMonthlyApplied,
    otherIncomeMonthlyApplied,
    carMonthlyConverted: expenses.carMonthlyConverted,
    housingMonthlyCost: expenses.housingMonthlyCost,
    fixedExpenseMonthly: expenses.fixedExpenseMonthly,
    livingExpenseMonthly: expenses.livingExpenseMonthly,
    totalExpenseMonthly: expenses.totalExpenseMonthly,
    totalIncomeMonthly,
    monthlyUsableCash,
    monthlySurplusOrDeficit,
    yearlySurplusOrDeficit,
    tenYearSurplusOrDeficit,
    startingCashReserve: formData.startingCashReserve,
    cashBalanceAfterTenYears: cashProjection.endingBalance,
    cashBalanceTimeline: cashProjection.timeline,
    riskLevel:
      monthlySurplusOrDeficit > 0
        ? 'surplus'
        : monthlySurplusOrDeficit < 0
          ? 'deficit'
          : 'neutral',
    loanNotice: formData.loanInterestMonthly > 0,
  }
}
