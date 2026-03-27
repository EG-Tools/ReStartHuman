import { policyConfig } from '../config/policyConfig'
import type { HoldingTaxBreakdownItem, AlphaFormData, AdditionalHome, ReviewLevel } from '../types/alpha'
import {
  calculateEstimatedComprehensiveIncomeTax,
  calculateRentalIncomeTax,
  getEstimatedComprehensiveTaxBaseAnnual,
} from './calculator.income'
import {
  getAgeQualifiedEarnedIncomeMonthly,
  getAgeQualifiedIncomeCategoryMonthly,
  getAgeQualifiedNonSalaryIncomeMonthly,
  getAgeQualifiedOtherIncomeMonthly as getStructuredAgeQualifiedOtherIncomeMonthly,
  getAgeQualifiedRentalIncomeMonthly,
} from '../utils/incomeStreams'
import { formatCompactCurrency } from '../utils/format'
import {
  type CashProjection,
  type HoldingTaxEstimate,
  getMineAttributedPropertyValue,
  getOwnerAllocatedValues,
  roundCurrency,
  toMonthly,
} from './calculator.shared'

const hasAdditionalHomeValue = (home: AdditionalHome) => home.marketValue > 0 || home.officialValue > 0

export const getActiveAdditionalHomes = (formData: AlphaFormData) =>
  formData.additionalHomes.filter(hasAdditionalHomeValue)

export const getOwnedHomeCount = (formData: AlphaFormData) => {
  const currentOwnedHomeCount =
    formData.housingType === 'own' && formData.homeOfficialValue > 0 ? 1 : 0

  return currentOwnedHomeCount + getActiveAdditionalHomes(formData).length
}

export const getAdditionalHomeOfficialValueTotal = (formData: AlphaFormData) =>
  roundCurrency(
    getActiveAdditionalHomes(formData).reduce((sum, home) => sum + Math.max(home.officialValue, 0), 0),
  )

export const calculateExpenses = (formData: AlphaFormData) => {
  const carMonthlyConverted = roundCurrency(formData.carYearlyCost / 12)
  const loanInterestMonthly = formData.loanInterestMonthly
  const fixedMaintenanceMonthly = formData.maintenanceMonthly

  const fixedExpenseMonthly =
    formData.insuranceMonthly +
    fixedMaintenanceMonthly +
    formData.telecomMonthly +
    formData.otherFixedMonthly +
    carMonthlyConverted

  const academyMonthly = formData.hasChildren ? formData.academyMonthly ?? 0 : 0

  const livingExpenseMonthly =
    formData.livingCostInputMode === 'total'
      ? formData.livingCostMonthlyTotal
      : formData.foodMonthly +
        formData.necessitiesMonthly +
        formData.diningOutMonthly +
        formData.hobbyMonthly +
        academyMonthly +
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

export const getAgeQualifiedPensionMonthly = (formData: AlphaFormData, age: number) =>
  age >= formData.pensionStartAge ? formData.pensionMonthlyAmount : 0

export const getAgeQualifiedOtherIncomeMonthly = (formData: AlphaFormData, age: number) =>
  roundCurrency(getStructuredAgeQualifiedOtherIncomeMonthly(formData, age))

const getAdditionalPropertyBase = (formData: AlphaFormData) => {
  const landTotal = formData.hasLandOrOtherProperty ? formData.landValue : 0
  const otherPropertyTotal = formData.hasLandOrOtherProperty
    ? formData.otherPropertyOfficialValue
    : 0

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

const getRegionalPropertyBase = (formData: AlphaFormData) => {
  const housingBase =
    formData.housingType === 'own'
      ? formData.homeOfficialValue
      : formData.housingType === 'jeonse'
        ? formData.jeonseDeposit * policyConfig.healthInsurance.leaseValueRatio
        : formData.monthlyRentDeposit * policyConfig.healthInsurance.leaseValueRatio

  return housingBase + getAdditionalHomeOfficialValueTotal(formData) + getAdditionalPropertyBase(formData)
}

type DependentHealthInsuranceAssessment = {
  level: ReviewLevel
  reasons: string[]
  shouldChargeRegional: boolean
}

export const getDependentHealthInsuranceAssessment = ({
  formData,
  totalDividendAnnualGross,
  age,
  pensionMonthly,
}: {
  formData: AlphaFormData
  totalDividendAnnualGross: number
  age: number
  pensionMonthly: number
}): DependentHealthInsuranceAssessment => {
  if (formData.healthInsuranceType !== 'dependent') {
    return {
      level: 'none',
      reasons: [],
      shouldChargeRegional: false,
    }
  }

  const businessMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age)
  const freelanceMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'freelance', age)
  const rentalMonthly = getAgeQualifiedRentalIncomeMonthly(formData, age)
  const miscMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'misc', age)
  const otherPensionMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'otherPension', age)
  const registrationStatus = businessMonthly > 0 ? 'yes' : formData.dependentBusinessRegistrationStatus
  const freelanceAnnualProfit = Math.max(
    formData.dependentFreelanceAnnualProfit,
    freelanceMonthly * 12,
  )
  const passiveAnnualIncome =
    totalDividendAnnualGross + pensionMonthly * 12 + (otherPensionMonthly + miscMonthly) * 12
  const passiveIncomeThresholdAnnual =
    policyConfig.healthInsurance.employeeAdditionalIncomeThresholdAnnual
  const highReasons: string[] = []
  const reviewReasons: string[] = []

  if (businessMonthly > 0) {
    highReasons.push('사업소득이 있어 피부양자 유지 가능성이 낮은 편으로 봤습니다.')
  } else if (registrationStatus === 'yes' && (freelanceMonthly > 0 || rentalMonthly > 0)) {
    highReasons.push('사업자등록 상태의 추가 소득이 있어 피부양자 기준 재확인이 필요합니다.')
  }

  if (rentalMonthly > 0) {
    if (formData.dependentRentalIncomeType === 'housing') {
      highReasons.push(
        '주택임대소득을 연 ' +
          formatCompactCurrency(rentalMonthly * 12) +
          ' 수준으로 보고 피부양자 유지 가능성이 낮다고 봤습니다.',
      )
    } else {
      reviewReasons.push('임대소득은 건강보험 판단에서 별도 확인이 필요한 항목입니다.')
    }
  }

  if (freelanceMonthly > 0 && registrationStatus !== 'yes') {
    if (
      freelanceAnnualProfit >=
      policyConfig.healthInsurance.dependentFreelanceProfitThresholdAnnual
    ) {
      highReasons.push(
        '프리랜서 연 순이익을 ' +
          formatCompactCurrency(freelanceAnnualProfit) +
          '로 보면 피부양자 기준 재확인이 필요합니다.',
      )
    } else {
      reviewReasons.push('프리랜서 소득은 연 순이익 규모에 따라 피부양자 판단이 달라질 수 있습니다.')
    }
  }

  if (passiveAnnualIncome > passiveIncomeThresholdAnnual) {
    highReasons.push(
      '배당·연금·기타소득 합산이 연 ' +
        formatCompactCurrency(passiveAnnualIncome) +
        '로 2,000만원 기준을 넘습니다.',
    )
  } else if (passiveAnnualIncome === passiveIncomeThresholdAnnual) {
    reviewReasons.push(
      '배당·연금·기타소득 합산이 연 ' +
        formatCompactCurrency(passiveAnnualIncome) +
        '로 2,000만원 기준과 같은 수준입니다.',
    )
  } else if (passiveAnnualIncome > 0) {
    reviewReasons.push(
      '배당·연금·기타소득 합산은 연 ' +
        formatCompactCurrency(passiveAnnualIncome) +
        ' 수준입니다.',
    )
  }

  const reasons = Array.from(new Set([...highReasons, ...reviewReasons]))

  return {
    level: highReasons.length > 0 ? 'high' : reasons.length > 0 ? 'review' : 'none',
    reasons,
    shouldChargeRegional: highReasons.length > 0,
  }
}

export const estimateHealthInsurance = (
  formData: AlphaFormData,
  totalDividendAnnualGross: number,
  age: number,
  pensionMonthly: number,
) => {
  const usesEmployeeHealthInsurance =
    formData.healthInsuranceType === 'employee' ||
    formData.healthInsuranceType === 'employeeWithDependentSpouse'
  const earnedIncomeMonthly = usesEmployeeHealthInsurance
    ? getAgeQualifiedEarnedIncomeMonthly(formData, age)
    : 0
  const nonSalaryOtherIncomeMonthly = usesEmployeeHealthInsurance
    ? getAgeQualifiedNonSalaryIncomeMonthly(formData, age)
    : getStructuredAgeQualifiedOtherIncomeMonthly(formData, age)
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

  const dependentAssessment = getDependentHealthInsuranceAssessment({
    formData,
    totalDividendAnnualGross,
    age,
    pensionMonthly,
  })

  switch (formData.healthInsuranceType) {
    case 'employee':
    case 'employeeWithDependentSpouse':
      return roundCurrency(employeeMonthlyBasePremium + employeeMonthlyAdditionalPremium)
    case 'dependent':
      return dependentAssessment.shouldChargeRegional ? regionalMonthlyPremium : 0
    case 'bothRegional':
    case 'other':
    case 'regional':
    default:
      return regionalMonthlyPremium
  }
}

const getHoldingTaxFairMarketRatio = ({
  homeOfficialValue,
  ownedHomeCount,
}: {
  homeOfficialValue: number
  ownedHomeCount: number
}) => {
  if (
    ownedHomeCount === 1 &&
    homeOfficialValue <= policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
  ) {
    return (
      policyConfig.holdingTax.singleHomeSpecialFairMarketRatioTiers.find(
        (tier) => homeOfficialValue <= tier.upperBound,
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

export const estimateHoldingTax = (formData: AlphaFormData): HoldingTaxEstimate => {
  const breakdown: HoldingTaxBreakdownItem[] = []
  const ownedHomeCount = getOwnedHomeCount(formData)

  if (formData.housingType === 'own' && formData.homeOfficialValue > 0) {
    const ownerCount = formData.isJointOwnership
      ? policyConfig.holdingTax.jointOwnershipShareCount
      : 1
    const fairMarketRatio = getHoldingTaxFairMarketRatio({
      homeOfficialValue: formData.homeOfficialValue,
      ownedHomeCount,
    })
    const useSingleHomeSpecialRate =
      ownedHomeCount === 1 &&
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

  getActiveAdditionalHomes(formData).forEach((home, index) => {
    if (home.officialValue <= 0) {
      return
    }

    const additionalHomeHoldingTax = calculateHoldingTaxFromOwnerValues({
      ownerValues: [home.officialValue],
      fairMarketRatio: policyConfig.holdingTax.defaultFairMarketRatio,
      useSingleHomeSpecialRate: false,
    })

    breakdown.push(
      createHoldingTaxItem({
        key: 'additionalHome',
        label: `추가주택 ${index + 1}`,
        annual: additionalHomeHoldingTax.annual,
        baseValue: home.officialValue,
      }),
    )
  })

  if (formData.hasLandOrOtherProperty && formData.landValue > 0) {
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

  if (formData.hasLandOrOtherProperty && formData.otherPropertyOfficialValue > 0) {
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
  formData: AlphaFormData,
  totalDividendMonthlyNet: number,
  totalDividendAnnualGross: number,
  totalExpenseMonthly: number,
  holdingTaxMonthly: number,
  financialComprehensiveTaxImpactAnnual: number,
  projectionYears = 30,
): CashProjection => {
  let cumulativeNetChange = 0
  let cumulativePensionIncome = 0
  let cumulativeOtherIncome = 0
  let cumulativeTotalIncome = 0
  let cumulativeUsableCash = 0
  let cumulativeRentalIncomeTax = 0
  let cumulativeEstimatedComprehensiveIncomeTax = 0
  let cumulativeEstimatedLocalIncomeTax = 0
  let balance = formData.startingCashReserve
  const timeline = [
    {
      year: 0,
      balance: roundCurrency(balance),
    },
  ]

  const fixedLoanInterestMonthly = formData.loanInterestMonthly
  const fixedInsuranceMonthly = formData.insuranceMonthly
  const baseExpenseMonthlyWithoutLoanAndInsurance = Math.max(
    totalExpenseMonthly - fixedLoanInterestMonthly - fixedInsuranceMonthly,
    0,
  )

  for (let yearIndex = 0; yearIndex < projectionYears; yearIndex += 1) {
    const projectedAge = formData.currentAge + yearIndex
    const projectedOtherIncomeMonthly = getAgeQualifiedOtherIncomeMonthly(formData, projectedAge)
    const projectedPensionMonthly = getAgeQualifiedPensionMonthly(formData, projectedAge)
    const projectedHealthInsuranceMonthly =
      formData.healthInsuranceOverrideMonthly ??
      estimateHealthInsurance(
        formData,
        totalDividendAnnualGross,
        projectedAge,
        projectedPensionMonthly,
      )
    const projectedRentalIncomeTaxAnnual =
      getAgeQualifiedRentalIncomeMonthly(formData, projectedAge) > 0
        ? calculateRentalIncomeTax(getAgeQualifiedRentalIncomeMonthly(formData, projectedAge) * 12).annualTax
        : 0
    const projectedEstimatedComprehensiveTax = calculateEstimatedComprehensiveIncomeTax(
      getEstimatedComprehensiveTaxBaseAnnual({
        formData,
        age: projectedAge,
        nationalPensionMonthly: projectedPensionMonthly,
      }),
    )
    const projectedTotalIncomeMonthly =
      totalDividendMonthlyNet + projectedOtherIncomeMonthly + projectedPensionMonthly
    const projectedMonthlyUsableCash =
      projectedTotalIncomeMonthly -
      projectedHealthInsuranceMonthly -
      holdingTaxMonthly -
      projectedEstimatedComprehensiveTax.incomeTaxAnnual / 12 -
      projectedEstimatedComprehensiveTax.localIncomeTaxAnnual / 12 -
      financialComprehensiveTaxImpactAnnual / 12 -
      projectedRentalIncomeTaxAnnual / 12
    const inflationMultiplier = formData.inflationEnabled
      ? (1 + formData.inflationRateAnnual) ** yearIndex
      : 1

    const projectedBaseExpenses = baseExpenseMonthlyWithoutLoanAndInsurance * inflationMultiplier
    const projectedInsuranceExpense =
      yearIndex < formData.insurancePaymentYears
        ? fixedInsuranceMonthly * inflationMultiplier
        : 0
    const projectedLoanInterest =
      yearIndex < formData.loanInterestYears ? fixedLoanInterestMonthly : 0

    const projectedExpenses =
      projectedBaseExpenses + projectedInsuranceExpense + projectedLoanInterest
    const projectedMonthlySurplus = projectedMonthlyUsableCash - projectedExpenses
    const annualNetChange = roundCurrency(projectedMonthlySurplus * 12)

    cumulativePensionIncome += roundCurrency(projectedPensionMonthly * 12)
    cumulativeOtherIncome += roundCurrency(projectedOtherIncomeMonthly * 12)
    cumulativeTotalIncome += roundCurrency(projectedTotalIncomeMonthly * 12)
    cumulativeUsableCash += roundCurrency(projectedMonthlyUsableCash * 12)
    cumulativeRentalIncomeTax += projectedRentalIncomeTaxAnnual
    cumulativeEstimatedComprehensiveIncomeTax += projectedEstimatedComprehensiveTax.incomeTaxAnnual
    cumulativeEstimatedLocalIncomeTax += projectedEstimatedComprehensiveTax.localIncomeTaxAnnual
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
    cumulativePensionIncome: roundCurrency(cumulativePensionIncome),
    cumulativeOtherIncome: roundCurrency(cumulativeOtherIncome),
    cumulativeTotalIncome: roundCurrency(cumulativeTotalIncome),
    cumulativeUsableCash: roundCurrency(cumulativeUsableCash),
    cumulativeRentalIncomeTax: roundCurrency(cumulativeRentalIncomeTax),
    cumulativeEstimatedComprehensiveIncomeTax: roundCurrency(cumulativeEstimatedComprehensiveIncomeTax),
    cumulativeEstimatedLocalIncomeTax: roundCurrency(cumulativeEstimatedLocalIncomeTax),
  }
}


