import { policyConfig } from '../config/policyConfig'
import type { HoldingTaxBreakdownItem, RetireCalcFormData } from '../types/retireCalc'
import {
  type CashProjection,
  type HoldingTaxEstimate,
  getMineAttributedPropertyValue,
  getOwnerAllocatedValues,
  roundCurrency,
  toMonthly,
} from './calculator.shared'

export const calculateExpenses = (formData: RetireCalcFormData) => {
  const carMonthlyConverted = roundCurrency(formData.carYearlyCost / 12)
  const loanInterestMonthly = formData.loanInterestMonthly

  const fixedMaintenanceMonthly = formData.maintenanceMonthly

  const fixedExpenseMonthly =
    formData.insuranceMonthly +
    fixedMaintenanceMonthly +
    formData.telecomMonthly +
    formData.otherFixedMonthly +
    carMonthlyConverted

  const livingExpenseMonthly =
    formData.livingCostInputMode === 'total'
      ? formData.livingCostMonthlyTotal
      : formData.foodMonthly +
        formData.necessitiesMonthly +
        formData.diningOutMonthly +
        formData.hobbyMonthly +
        (formData.academyMonthly ?? 0) +
        formData.otherLivingMonthly

  const housingMonthlyCost =
    formData.housingType === 'monthlyRent' ? formData.monthlyRentAmount : 0

  return {
    carMonthlyConverted,
    loanInterestMonthly: roundCurrency(loanInterestMonthly),
    fixedExpenseMonthly: roundCurrency(fixedExpenseMonthly),
    livingExpenseMonthly: roundCurrency(livingExpenseMonthly),
    housingMonthlyCost: roundCurrency(housingMonthlyCost),
    totalExpenseMonthly: roundCurrency(
      fixedExpenseMonthly + loanInterestMonthly + livingExpenseMonthly + housingMonthlyCost,
    ),
  }
}

const getAdditionalPropertyBase = (formData: RetireCalcFormData) => {
  const landTotal = formData.landValue
  const otherPropertyTotal = formData.otherPropertyOfficialValue

  if (formData.householdType !== 'couple') {
    return landTotal + otherPropertyTotal
  }

  if (
    formData.healthInsuranceType === 'regional' ||
    formData.healthInsuranceType === 'bothRegional' ||
    formData.healthInsuranceType === 'other'
  ) {
    return landTotal + otherPropertyTotal
  }

  return (
    getMineAttributedPropertyValue({
      householdType: formData.householdType,
      ownershipType: formData.landOwnershipType,
      totalValue: landTotal,
      myShare: formData.myLandShare,
    }) +
    getMineAttributedPropertyValue({
      householdType: formData.householdType,
      ownershipType: formData.otherPropertyOwnershipType,
      totalValue: otherPropertyTotal,
      myShare: formData.myOtherPropertyShare,
    })
  )
}

const getRegionalPropertyBase = (formData: RetireCalcFormData) => {
  const housingBase =
    formData.housingType === 'own'
      ? formData.homeOfficialValue
      : formData.housingType === 'jeonse'
        ? formData.jeonseDeposit * policyConfig.healthInsurance.leaseValueRatio
        : formData.monthlyRentDeposit * policyConfig.healthInsurance.leaseValueRatio

  return housingBase + getAdditionalPropertyBase(formData)
}

export const estimateHealthInsurance = (
  formData: RetireCalcFormData,
  totalDividendAnnualGross: number,
  otherIncomeMonthly: number,
  pensionMonthly: number,
) => {
  const usesEmployeeHealthInsurance =
    formData.healthInsuranceType === 'employee' ||
    formData.healthInsuranceType === 'employeeWithDependentSpouse'
  const earnedIncomeMonthly =
    formData.otherIncomeType === 'earned' && usesEmployeeHealthInsurance ? otherIncomeMonthly : 0
  const nonSalaryOtherIncomeMonthly =
    formData.otherIncomeType === 'earned' && usesEmployeeHealthInsurance ? 0 : otherIncomeMonthly
  const effectiveSalaryMonthly = Math.max(formData.salaryMonthly, earnedIncomeMonthly)
  const annualNonSalaryIncome =
    totalDividendAnnualGross + nonSalaryOtherIncomeMonthly * 12 + pensionMonthly * 12

  const employeeMonthlyBasePremium =
    effectiveSalaryMonthly *
    policyConfig.healthInsurance.employeeContributionRate *
    policyConfig.healthInsurance.employeeIncomeShareRate

  const employeeMonthlyAdditionalPremium =
    (Math.max(
      annualNonSalaryIncome - policyConfig.healthInsurance.employeeAdditionalIncomeThresholdAnnual,
      0,
    ) /
      12) *
    policyConfig.healthInsurance.employeeContributionRate *
    policyConfig.healthInsurance.employeeIncomeShareRate

  const regionalIncomePremium =
    (annualNonSalaryIncome / 12) * policyConfig.healthInsurance.employeeContributionRate

  const regionalPropertyBase = Math.max(
    getRegionalPropertyBase(formData) - policyConfig.healthInsurance.regionalPropertyDeduction,
    0,
  )

  const regionalPropertyScoreApprox =
    regionalPropertyBase / policyConfig.healthInsurance.regionalPropertyValuePerPointApprox

  const regionalPropertyPremium =
    regionalPropertyScoreApprox * policyConfig.healthInsurance.regionalContributionPerPoint

  const regionalMonthlyPremium = roundCurrency(regionalIncomePremium + regionalPropertyPremium)

  switch (formData.healthInsuranceType) {
    case 'employee':
    case 'employeeWithDependentSpouse':
      return roundCurrency(employeeMonthlyBasePremium + employeeMonthlyAdditionalPremium)
    case 'dependent':
      return annualNonSalaryIncome >=
        policyConfig.healthInsurance.employeeAdditionalIncomeThresholdAnnual
        ? regionalMonthlyPremium
        : 0
    case 'bothRegional':
    case 'other':
    case 'regional':
    default:
      return regionalMonthlyPremium
  }
}

const getHoldingTaxFairMarketRatio = (formData: RetireCalcFormData) => {
  if (
    formData.isSingleHomeOwner &&
    formData.homeOfficialValue <= policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
  ) {
    return (
      policyConfig.holdingTax.singleHomeSpecialFairMarketRatioTiers.find(
        (tier) => formData.homeOfficialValue <= tier.upperBound,
      ) ??
      policyConfig.holdingTax.singleHomeSpecialFairMarketRatioTiers[
        policyConfig.holdingTax.singleHomeSpecialFairMarketRatioTiers.length - 1
      ]
    ).ratio
  }

  return policyConfig.holdingTax.defaultFairMarketRatio
}

const calculatePropertyTaxMain = (taxBase: number, useSingleHomeSpecialRate: boolean) => {
  const taxBrackets = useSingleHomeSpecialRate
    ? policyConfig.holdingTax.singleHomeSpecialRates
    : policyConfig.holdingTax.standardRates
  const matchedBracket =
    taxBrackets.find((bracket) => taxBase <= bracket.upperBound) ??
    taxBrackets[taxBrackets.length - 1]

  return roundCurrency(
    matchedBracket.baseTax + Math.max(taxBase - matchedBracket.baseStart, 0) * matchedBracket.rate,
  )
}

const createHoldingTaxItem = ({
  key,
  label,
  annual,
  baseValue,
}: {
  key: HoldingTaxBreakdownItem['key']
  label: string
  annual: number
  baseValue: number
}): HoldingTaxBreakdownItem => ({
  key,
  label,
  annual: roundCurrency(Math.max(annual, 0)),
  monthly: toMonthly(Math.max(annual, 0)),
  baseValue: roundCurrency(Math.max(baseValue, 0)),
})

const calculateHoldingTaxFromOwnerValues = ({
  ownerValues,
  fairMarketRatio,
  useSingleHomeSpecialRate,
}: {
  ownerValues: number[]
  fairMarketRatio: number
  useSingleHomeSpecialRate: boolean
}) => {
  const annual = ownerValues.reduce((sum, ownerValue) => {
    const normalizedOwnerValue = Math.max(ownerValue, 0)

    if (normalizedOwnerValue <= 0) {
      return sum
    }

    const taxBasePerOwner = normalizedOwnerValue * fairMarketRatio
    const propertyTaxMainPerOwner = calculatePropertyTaxMain(
      taxBasePerOwner,
      useSingleHomeSpecialRate,
    )
    const urbanAreaTaxPerOwner = roundCurrency(
      taxBasePerOwner * policyConfig.holdingTax.urbanAreaRate,
    )
    const localEducationTaxPerOwner = roundCurrency(
      propertyTaxMainPerOwner * policyConfig.holdingTax.localEducationTaxRate,
    )

    return sum + propertyTaxMainPerOwner + urbanAreaTaxPerOwner + localEducationTaxPerOwner
  }, 0)

  return {
    annual: roundCurrency(Math.max(annual, 0)),
    monthly: toMonthly(Math.max(annual, 0)),
  }
}

export const estimateHoldingTax = (formData: RetireCalcFormData): HoldingTaxEstimate => {
  const breakdown: HoldingTaxBreakdownItem[] = []

  if (formData.housingType === 'own' && formData.homeOfficialValue > 0) {
    const ownerCount = formData.isJointOwnership
      ? policyConfig.holdingTax.jointOwnershipShareCount
      : 1
    const fairMarketRatio = getHoldingTaxFairMarketRatio(formData)
    const useSingleHomeSpecialRate =
      formData.isSingleHomeOwner &&
      formData.homeOfficialValue <= policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
    const ownerValues = Array.from({ length: ownerCount }, () => formData.homeOfficialValue / ownerCount)
    const homeHoldingTax = calculateHoldingTaxFromOwnerValues({
      ownerValues,
      fairMarketRatio,
      useSingleHomeSpecialRate,
    })

    breakdown.push(
      createHoldingTaxItem({
        key: 'home',
        label: '주택',
        annual: homeHoldingTax.annual,
        baseValue: formData.homeOfficialValue,
      }),
    )
  }

  if (formData.landValue > 0) {
    const landAssessedValue = roundCurrency(
      formData.landValue * policyConfig.holdingTax.landAssessedValueRatioApprox,
    )
    const landHoldingTax = calculateHoldingTaxFromOwnerValues({
      ownerValues: getOwnerAllocatedValues({
        householdType: formData.householdType,
        ownershipType: formData.landOwnershipType,
        totalValue: landAssessedValue,
        myShare: formData.myLandShare,
      }),
      fairMarketRatio: policyConfig.holdingTax.defaultFairMarketRatio,
      useSingleHomeSpecialRate: false,
    })

    breakdown.push(
      createHoldingTaxItem({
        key: 'land',
        label: '토지',
        annual: landHoldingTax.annual,
        baseValue: landAssessedValue,
      }),
    )
  }

  if (formData.otherPropertyOfficialValue > 0) {
    const otherPropertyHoldingTax = calculateHoldingTaxFromOwnerValues({
      ownerValues: getOwnerAllocatedValues({
        householdType: formData.householdType,
        ownershipType: formData.otherPropertyOwnershipType,
        totalValue: formData.otherPropertyOfficialValue,
        myShare: formData.myOtherPropertyShare,
      }),
      fairMarketRatio: policyConfig.holdingTax.defaultFairMarketRatio,
      useSingleHomeSpecialRate: false,
    })

    breakdown.push(
      createHoldingTaxItem({
        key: 'otherProperty',
        label: '기타 부동산',
        annual: otherPropertyHoldingTax.annual,
        baseValue: formData.otherPropertyOfficialValue,
      }),
    )
  }

  const annual = roundCurrency(breakdown.reduce((sum, item) => sum + item.annual, 0))

  return {
    annual,
    monthly: toMonthly(annual),
    breakdown,
  }
}

export const calculateCashProjection = (
  formData: RetireCalcFormData,
  totalIncomeMonthly: number,
  totalExpenseMonthly: number,
  healthInsuranceMonthly: number,
  holdingTaxMonthly: number,
  comprehensiveTaxImpactAnnual: number,
  projectionYears = 30,
): CashProjection => {
  let cumulativeNetChange = 0
  let balance = formData.startingCashReserve
  const timeline = [
    {
      year: 0,
      balance: roundCurrency(balance),
    },
  ]

  const fixedLoanInterestMonthly = formData.loanInterestMonthly
  const baseExpenseMonthlyWithoutLoan = Math.max(totalExpenseMonthly - fixedLoanInterestMonthly, 0)

  for (let yearIndex = 0; yearIndex < projectionYears; yearIndex += 1) {
    const inflationMultiplier = formData.inflationEnabled
      ? (1 + formData.inflationRateAnnual) ** yearIndex
      : 1

    const projectedBaseExpenses = baseExpenseMonthlyWithoutLoan * inflationMultiplier
    const projectedLoanInterest =
      yearIndex < formData.loanInterestYears ? fixedLoanInterestMonthly : 0

    const projectedExpenses = projectedBaseExpenses + projectedLoanInterest
    const projectedMonthlySurplus =
      totalIncomeMonthly -
      projectedExpenses -
      healthInsuranceMonthly -
      holdingTaxMonthly -
      comprehensiveTaxImpactAnnual / 12
    const annualNetChange = roundCurrency(projectedMonthlySurplus * 12)

    cumulativeNetChange += annualNetChange
    balance += annualNetChange
    timeline.push({
      year: yearIndex + 1,
      balance: roundCurrency(balance),
    })
  }

  return {
    cumulativeNetChange: roundCurrency(cumulativeNetChange),
    endingBalance: roundCurrency(balance),
    timeline,
  }
}
