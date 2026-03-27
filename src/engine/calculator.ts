import { policyConfig } from '../config/policyConfig'
import type { AlphaFormData, AlphaResult, AdditionalHome } from '../types/alpha'
import {
  calculateCashProjection,
  calculateExpenses,
  estimateHealthInsurance,
  estimateHoldingTax,
  getDependentHealthInsuranceAssessment,
  getAgeQualifiedOtherIncomeMonthly,
  getAgeQualifiedPensionMonthly,
} from './calculator.costs'
import {
  getAgeQualifiedRentalIncomeMonthly,
  getIncomeBreakdown,
  getSelectedIncomeCategories,
} from '../utils/incomeStreams'
import {
  calculateComprehensiveTax,
  calculateEstimatedComprehensiveIncomeTax,
  calculateIsaTax,
  evaluateEstimatedComprehensiveTaxReview,
  calculateRentalIncomeTax,
  calculateTaxableStream,
  getEstimatedComprehensiveTaxBaseAnnual,
} from './calculator.income'
import {
  clampRate,
  createDividendStream,
  getOwnershipAllocations,
  roundCurrency,
  sanitizeMoney,
  sanitizeOptionalMoney,
} from './calculator.shared'

const sanitizeAdditionalHome = (home: AdditionalHome): AdditionalHome => ({
  housingType:
    home.housingType === 'jeonse' || home.housingType === 'monthlyRent' ? home.housingType : 'own',
  marketValue: sanitizeMoney(home.marketValue),
  officialValue: sanitizeMoney(home.officialValue),
})

const sanitizeInput = (formData: AlphaFormData): AlphaFormData => ({
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
  simulationYears: Math.min(80, Math.max(1, sanitizeMoney(formData.simulationYears) || 30)),
  homeMarketValue: sanitizeMoney(formData.homeMarketValue),
  homeOfficialValue: sanitizeMoney(formData.homeOfficialValue),
  additionalHomes: formData.additionalHomes.slice(0, 4).map(sanitizeAdditionalHome),
  jeonseDeposit: sanitizeMoney(formData.jeonseDeposit),
  monthlyRentDeposit: sanitizeMoney(formData.monthlyRentDeposit),
  monthlyRentAmount: sanitizeMoney(formData.monthlyRentAmount),
  hasLandOrOtherProperty: formData.hasLandOrOtherProperty,
  landValue: formData.hasLandOrOtherProperty ? sanitizeMoney(formData.landValue) : 0,
  myLandShare: sanitizeMoney(formData.myLandShare),
  spouseLandShare: sanitizeMoney(formData.spouseLandShare),
  otherPropertyOfficialValue: formData.hasLandOrOtherProperty
    ? sanitizeMoney(formData.otherPropertyOfficialValue)
    : 0,
  myOtherPropertyShare: sanitizeMoney(formData.myOtherPropertyShare),
  spouseOtherPropertyShare: sanitizeMoney(formData.spouseOtherPropertyShare),
  taxableAccountAssets: sanitizeMoney(formData.taxableAccountAssets),
  isaAssets: sanitizeMoney(formData.isaAssets),
  pensionAccountAssets: sanitizeMoney(formData.pensionAccountAssets),
  otherAssets: sanitizeMoney(formData.otherAssets),
  taxableAccountDividendAnnual: sanitizeMoney(formData.taxableAccountDividendAnnual),
  isaDividendAnnual: sanitizeMoney(formData.isaDividendAnnual),
  pensionDividendAnnual: sanitizeMoney(formData.pensionDividendAnnual),
  myAnnualDividendAttributed: sanitizeMoney(formData.myAnnualDividendAttributed),
  spouseAnnualDividendAttributed: sanitizeMoney(formData.spouseAnnualDividendAttributed),
  myAnnualIsaDividendAttributed: sanitizeMoney(formData.myAnnualIsaDividendAttributed),
  spouseAnnualIsaDividendAttributed: sanitizeMoney(formData.spouseAnnualIsaDividendAttributed),
  selectedIncomeCategories: getSelectedIncomeCategories(formData),
  earnedIncomeMonthly: sanitizeMoney(formData.earnedIncomeMonthly),
  earnedIncomeDurationYears: Math.max(1, sanitizeMoney(formData.earnedIncomeDurationYears) || 10),
  otherPensionMonthly: sanitizeMoney(formData.otherPensionMonthly),
  otherPensionStartAge: Math.max(1, sanitizeMoney(formData.otherPensionStartAge) || 65),
  freelanceIncomeMonthly: sanitizeMoney(formData.freelanceIncomeMonthly),
  freelanceIncomeDurationYears: Math.max(1, sanitizeMoney(formData.freelanceIncomeDurationYears) || 10),
  businessIncomeMonthly: sanitizeMoney(formData.businessIncomeMonthly),
  businessIncomeDurationYears: Math.max(1, sanitizeMoney(formData.businessIncomeDurationYears) || 10),
  rentalIncomeMonthly: sanitizeMoney(formData.rentalIncomeMonthly),
  rentalIncomeDurationYears: Math.max(1, sanitizeMoney(formData.rentalIncomeDurationYears) || 10),
  miscIncomeMonthly: sanitizeMoney(formData.miscIncomeMonthly),
  miscIncomeDurationYears: Math.max(1, sanitizeMoney(formData.miscIncomeDurationYears) || 10),
  otherIncomeMonthly: sanitizeMoney(formData.otherIncomeMonthly),
  otherIncomeStartAge: Math.max(1, sanitizeMoney(formData.otherIncomeStartAge) || 65),
  pensionStartAge: Math.max(1, sanitizeMoney(formData.pensionStartAge) || 65),
  pensionMonthlyAmount: sanitizeMoney(formData.pensionMonthlyAmount),
  salaryMonthly: sanitizeMoney(formData.salaryMonthly),
  healthInsuranceOverrideMonthly: sanitizeOptionalMoney(formData.healthInsuranceOverrideMonthly),
  dependentBusinessRegistrationStatus:
    formData.dependentBusinessRegistrationStatus === 'yes' ||
    formData.dependentBusinessRegistrationStatus === 'no'
      ? formData.dependentBusinessRegistrationStatus
      : 'unknown',
  dependentRentalIncomeType:
    formData.dependentRentalIncomeType === 'housing' ||
    formData.dependentRentalIncomeType === 'commercial'
      ? formData.dependentRentalIncomeType
      : 'unknown',
  dependentFreelanceAnnualProfit: sanitizeMoney(formData.dependentFreelanceAnnualProfit),
  insuranceMonthly: sanitizeMoney(formData.insuranceMonthly),
  insurancePaymentYears: Math.max(0, sanitizeMoney(formData.insurancePaymentYears) || 10),
  maintenanceMonthly: sanitizeMoney(formData.maintenanceMonthly),
  telecomMonthly: sanitizeMoney(formData.telecomMonthly),
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

export const calculateAlphaScenario = (rawFormData: AlphaFormData): AlphaResult => {
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
  const pensionMonthlyApplied = getAgeQualifiedPensionMonthly(formData, formData.currentAge)
  const otherIncomeMonthlyApplied = getAgeQualifiedOtherIncomeMonthly(formData, formData.currentAge)
  const incomeBreakdown = getIncomeBreakdown(formData, formData.currentAge, formData.simulationYears)
  const estimatedComprehensiveTax = calculateEstimatedComprehensiveIncomeTax(
    getEstimatedComprehensiveTaxBaseAnnual({
      formData,
      age: formData.currentAge,
      nationalPensionMonthly: pensionMonthlyApplied,
    }),
  )
  const estimatedHealthInsurance = estimateHealthInsurance(
    formData,
    totalDividend.annualGross,
    formData.currentAge,
    pensionMonthlyApplied,
  )
  const dependentHealthInsuranceAssessment = getDependentHealthInsuranceAssessment({
    formData,
    totalDividendAnnualGross: totalDividend.annualGross,
    age: formData.currentAge,
    pensionMonthly: pensionMonthlyApplied,
  })
  const healthInsuranceMonthly =
    formData.healthInsuranceOverrideMonthly ?? estimatedHealthInsurance
  const holdingTax = estimateHoldingTax(formData)
  const rentalIncomeMonthlyApplied = getAgeQualifiedRentalIncomeMonthly(formData, formData.currentAge)
  const rentalIncomeTax =
    rentalIncomeMonthlyApplied > 0
      ? calculateRentalIncomeTax(rentalIncomeMonthlyApplied * 12)
      : calculateRentalIncomeTax(0)
  const estimatedComprehensiveTaxReview = evaluateEstimatedComprehensiveTaxReview({
    formData,
    age: formData.currentAge,
    nationalPensionMonthly: pensionMonthlyApplied,
    totalFinancialIncomeAnnual: totalDividend.annualGross,
  })
  const totalIncomeMonthly =
    totalDividend.monthlyNet + otherIncomeMonthlyApplied + pensionMonthlyApplied
  const monthlyUsableCash = roundCurrency(
    totalIncomeMonthly -
      healthInsuranceMonthly -
      holdingTax.monthly -
      estimatedComprehensiveTax.incomeTaxAnnual / 12 -
      estimatedComprehensiveTax.localIncomeTaxAnnual / 12 -
      comprehensiveTax.impactAnnual / 12 -
      rentalIncomeTax.monthlyTax,
  )
  const monthlySurplusOrDeficit = roundCurrency(monthlyUsableCash - expenses.totalExpenseMonthly)
  const yearlySurplusOrDeficit = roundCurrency(monthlySurplusOrDeficit * 12)
  const cashProjection = calculateCashProjection(
    formData,
    totalDividend.monthlyNet,
    totalDividend.annualGross,
    expenses.totalExpenseMonthly,
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
    estimatedComprehensiveIncomeTaxAnnual: estimatedComprehensiveTax.incomeTaxAnnual,
    estimatedLocalIncomeTaxAnnual: estimatedComprehensiveTax.localIncomeTaxAnnual,
    estimatedComprehensiveTaxBaseAnnual: estimatedComprehensiveTax.taxableBaseAnnual,
    rentalIncomeTaxAnnual: rentalIncomeTax.annualTax,
    rentalIncomeTaxMonthly: rentalIncomeTax.monthlyTax,
    healthInsuranceMonthly,
    healthInsuranceSource: formData.healthInsuranceOverrideMonthly === null ? 'estimated' : 'manual',
    healthInsuranceReviewLevel: dependentHealthInsuranceAssessment.level,
    healthInsuranceReviewReasons: dependentHealthInsuranceAssessment.reasons,
    holdingTaxAnnual: holdingTax.annual,
    holdingTaxMonthly: holdingTax.monthly,
    holdingTaxBreakdown: holdingTax.breakdown,
    pensionMonthlyApplied,
    otherIncomeMonthlyApplied,
    incomeBreakdown,
    projectionPensionIncomeTotal: cashProjection.cumulativePensionIncome,
    projectionOtherIncomeTotal: cashProjection.cumulativeOtherIncome,
    projectionRentalIncomeTaxTotal: cashProjection.cumulativeRentalIncomeTax,
    projectionEstimatedComprehensiveIncomeTaxTotal:
      cashProjection.cumulativeEstimatedComprehensiveIncomeTax,
    projectionEstimatedLocalIncomeTaxTotal: cashProjection.cumulativeEstimatedLocalIncomeTax,
    estimatedComprehensiveTaxReviewLevel: estimatedComprehensiveTaxReview.level,
    estimatedComprehensiveTaxReviewReasons: estimatedComprehensiveTaxReview.reasons,
    rentalSeparateTaxationOption: estimatedComprehensiveTaxReview.rentalSeparateTaxationOption,
    carMonthlyConverted: expenses.carMonthlyConverted,
    housingMonthlyCost: expenses.housingMonthlyCost,
    fixedExpenseMonthly: expenses.fixedExpenseMonthly,
    livingExpenseMonthly: expenses.livingExpenseMonthly,
    totalExpenseMonthly: expenses.totalExpenseMonthly,
    totalIncomeMonthly,
    projectionTotalIncomeTotal: cashProjection.cumulativeTotalIncome,
    monthlyUsableCash,
    projectionUsableCashTotal: cashProjection.cumulativeUsableCash,
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
