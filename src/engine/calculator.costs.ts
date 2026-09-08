import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  HoldingTaxBreakdownItem,
  AlphaFormData,
  AdditionalHome,
  ReviewLevel,
} from '../types/alpha'
import {
  calculateAgeQualifiedPrivatePensionTaxAnnual,
  calculateComprehensiveTax,
  calculateEstimatedComprehensiveIncomeTax,
  calculateRentalIncomeTax,
  getEstimatedComprehensiveTaxBaseAnnual,
} from './calculator.income'
import {
  getAgeQualifiedIncomeCategoryMonthly,
  getAgeQualifiedNonSalaryIncomeMonthly,
  getAgeQualifiedOtherIncomeMonthly as getStructuredAgeQualifiedOtherIncomeMonthly,
  getAgeQualifiedRentalIncomeMonthly,
  getIncomeCategoryDurationYears,
  getSelectedIncomeCategories,
} from '../utils/incomeStreams'
import { formatCompactCurrency } from '../utils/format'
import {
  getInsuranceMonthlyAtYear,
  getLoanInterestMonthlyAtYear,
} from '../utils/expensePeriods'
import {
  type CashProjection,
  type HoldingTaxEstimate,
  getOwnershipAllocations,
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
  const loanInterestMonthly = getLoanInterestMonthlyAtYear(formData)
  const fixedMaintenanceMonthly = formData.maintenanceMonthly
  const insuranceMonthly = getInsuranceMonthlyAtYear(formData)

  const fixedExpenseMonthly =
    insuranceMonthly +
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

const usesEmployeeHealthInsurance = (healthInsuranceType: AlphaFormData['healthInsuranceType']) =>
  healthInsuranceType === 'employee' || healthInsuranceType === 'employeeWithDependentSpouse'

export const getHealthInsuranceRetirementTransitionYear = (formData: AlphaFormData) => {
  if (!usesEmployeeHealthInsurance(formData.healthInsuranceType)) {
    return null
  }

  const employeeIncomeCategory = getSelectedIncomeCategories(formData).find(
    (category) => category === 'earned' || category === 'corporateExecutive',
  )

  return employeeIncomeCategory
    ? getIncomeCategoryDurationYears(formData, employeeIncomeCategory)
    : null
}

const getHealthInsuranceTypeAtAge = (formData: AlphaFormData, age: number) => {
  const retirementTransitionYear = getHealthInsuranceRetirementTransitionYear(formData)

  if (
    retirementTransitionYear !== null &&
    age >= formData.currentAge + retirementTransitionYear
  ) {
    return formData.householdType === 'couple' ? 'bothRegional' : 'regional'
  }

  return formData.healthInsuranceType
}

export const calculateGrossCashInterestAnnual = (balance: number, annualRatePercent: number) => {
  if (balance <= 0 || annualRatePercent <= 0) {
    return 0
  }

  return roundCurrency(balance * (annualRatePercent / 100))
}

export const calculateNetCashInterestAnnual = (balance: number, annualRatePercent: number) => {
  const grossAnnualInterest = calculateGrossCashInterestAnnual(balance, annualRatePercent)

  if (grossAnnualInterest === 0) {
    return 0
  }

  return roundCurrency(grossAnnualInterest * (1 - policyConfig.cashInterest.withholdingRate))
}

const getAdditionalPropertyBase = (
  formData: AlphaFormData,
  healthInsuranceType: AlphaFormData['healthInsuranceType'],
) => {
  const landTotal = formData.hasLandOrOtherProperty ? formData.landValue : 0
  const otherPropertyTotal = formData.hasLandOrOtherProperty
    ? formData.otherPropertyOfficialValue
    : 0

  if (formData.householdType !== 'couple') {
    return landTotal + otherPropertyTotal
  }

  if (
    healthInsuranceType === 'regional' ||
    healthInsuranceType === 'bothRegional' ||
    healthInsuranceType === 'other'
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

const getRegionalPropertyBase = (
  formData: AlphaFormData,
  healthInsuranceType: AlphaFormData['healthInsuranceType'],
) => {
  const housingBase =
    formData.housingType === 'own'
      ? formData.homeOfficialValue
      : formData.housingType === 'jeonse'
        ? formData.jeonseDeposit * policyConfig.healthInsurance.leaseValueRatio
        : formData.monthlyRentDeposit * policyConfig.healthInsurance.leaseValueRatio

  return (
    housingBase +
    getAdditionalHomeOfficialValueTotal(formData) +
    getAdditionalPropertyBase(formData, healthInsuranceType)
  )
}

const getDependentCurrentHomeOfficialValue = (formData: AlphaFormData) => {
  if (formData.housingType !== 'own' || formData.homeOfficialValue <= 0) {
    return 0
  }

  if (formData.householdType !== 'couple' || !formData.isJointOwnership) {
    return roundCurrency(formData.homeOfficialValue)
  }

  return roundCurrency(formData.homeOfficialValue / policyConfig.holdingTax.jointOwnershipShareCount)
}

const getDependentCurrentHomeFairMarketRatio = (formData: AlphaFormData) => {
  if (formData.housingType !== 'own' || formData.homeOfficialValue <= 0) {
    return 0
  }

  const ownedHomeCount = getOwnedHomeCount(formData)

  if (
    ownedHomeCount === 1 &&
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

const getDependentPropertyTaxBaseApprox = (formData: AlphaFormData) => {
  const currentHomeTaxBase =
    getDependentCurrentHomeOfficialValue(formData) *
    getDependentCurrentHomeFairMarketRatio(formData)
  const additionalHomeTaxBase = getActiveAdditionalHomes(formData).reduce(
    (sum, home) =>
      sum + Math.max(home.officialValue, 0) * policyConfig.holdingTax.defaultFairMarketRatio,
    0,
  )
  const landAssessedValue = formData.hasLandOrOtherProperty
    ? roundCurrency(formData.landValue * policyConfig.holdingTax.landAssessedValueRatioApprox)
    : 0
  const attributedLandAssessedValue = getMineAttributedPropertyValue({
    householdType: formData.householdType,
    ownershipType: formData.landOwnershipType,
    totalValue: landAssessedValue,
    myShare: formData.myLandShare,
  })
  const attributedOtherPropertyValue = getMineAttributedPropertyValue({
    householdType: formData.householdType,
    ownershipType: formData.otherPropertyOwnershipType,
    totalValue: formData.hasLandOrOtherProperty ? formData.otherPropertyOfficialValue : 0,
    myShare: formData.myOtherPropertyShare,
  })

  return roundCurrency(
    currentHomeTaxBase +
      additionalHomeTaxBase +
      attributedLandAssessedValue * policyConfig.holdingTax.defaultFairMarketRatio +
      attributedOtherPropertyValue * policyConfig.holdingTax.defaultFairMarketRatio,
  )
}

type DependentHealthInsuranceAssessment = {
  level: ReviewLevel
  reasons: string[]
  shouldChargeRegional: boolean
}

const getEstimatedBusinessIncomeAnnualForHealthInsurance = (
  formData: AlphaFormData,
  age: number,
  includeDeclaredBusinessIncome = true,
) => {
  const currentBusinessIncomeAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age) * 12

  if (!includeDeclaredBusinessIncome) {
    return roundCurrency(currentBusinessIncomeAnnual)
  }

  return roundCurrency(
    Math.max(currentBusinessIncomeAnnual, formData.previousYearDeclaredBusinessIncomeAnnual),
  )
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

  const earnedMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'earned', age)
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
  const assessableIncomeAnnual = roundCurrency(
    earnedMonthly * 12 +
      totalDividendAnnualGross +
      pensionMonthly * 12 +
      (otherPensionMonthly + miscMonthly) * 12,
  )
  const assessableIncomeThresholdAnnual =
    policyConfig.healthInsurance.dependentIncomeThresholdAnnual
  const dependentPropertyTaxBaseApprox = getDependentPropertyTaxBaseApprox(formData)
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

  if (assessableIncomeAnnual > assessableIncomeThresholdAnnual) {
    highReasons.push(
      '근로·배당·연금·기타소득 합산이 연 ' +
        formatCompactCurrency(assessableIncomeAnnual) +
        '로 2,000만원 기준을 넘습니다.',
    )
  } else if (assessableIncomeAnnual === assessableIncomeThresholdAnnual) {
    reviewReasons.push(
      '근로·배당·연금·기타소득 합산이 연 ' +
        formatCompactCurrency(assessableIncomeAnnual) +
        '로 2,000만원 기준과 같은 수준입니다.',
    )
  } else if (assessableIncomeAnnual > 0) {
    reviewReasons.push(
      '근로·배당·연금·기타소득 합산은 연 ' +
        formatCompactCurrency(assessableIncomeAnnual) +
        ' 수준입니다.',
    )
  }

  if (
    dependentPropertyTaxBaseApprox >
    policyConfig.healthInsurance.dependentPropertyDisqualifyThreshold
  ) {
    highReasons.push(
      '재산세 과표 추정을 약 ' +
        formatCompactCurrency(dependentPropertyTaxBaseApprox) +
        '으로 보면 9억원 기준을 넘어 피부양자 유지 가능성이 낮다고 봤습니다.',
    )
  } else if (
    dependentPropertyTaxBaseApprox >
    policyConfig.healthInsurance.dependentPropertyReviewThreshold
  ) {
    if (
      assessableIncomeAnnual >
      policyConfig.healthInsurance.dependentPropertyIncomeThresholdAnnual
    ) {
      highReasons.push(
        '재산세 과표 추정이 약 ' +
          formatCompactCurrency(dependentPropertyTaxBaseApprox) +
          '이고 소득도 연 ' +
          formatCompactCurrency(assessableIncomeAnnual) +
          '라 피부양자 기준 재확인이 필요합니다.',
      )
    } else {
      reviewReasons.push(
        '재산세 과표 추정이 약 ' +
          formatCompactCurrency(dependentPropertyTaxBaseApprox) +
          '로 5.4억원 구간이라 소득 1,000만원 기준을 함께 확인하는 편이 좋습니다.',
      )
    }
  }

  const reasons = Array.from(new Set([...highReasons, ...reviewReasons]))

  return {
    level: highReasons.length > 0 ? 'high' : reasons.length > 0 ? 'review' : 'none',
    reasons,
    shouldChargeRegional: highReasons.length > 0,
  }
}

type HealthInsuranceEstimationOptions = {
  includeDeclaredBusinessIncome?: boolean
}

export const estimateHealthInsurance = (
  formData: AlphaFormData,
  totalDividendAnnualGross: number,
  age: number,
  pensionMonthly: number,
  options: HealthInsuranceEstimationOptions = {},
) => {
  const includeDeclaredBusinessIncome = options.includeDeclaredBusinessIncome ?? true
  const effectiveHealthInsuranceType = getHealthInsuranceTypeAtAge(formData, age)
  const hasEmployeeHealthInsurance = usesEmployeeHealthInsurance(effectiveHealthInsuranceType)
  const selectedIncomeCategories = getSelectedIncomeCategories(formData)
  const employeeIncomeCategory = selectedIncomeCategories.find(
    (category) => category === 'earned' || category === 'corporateExecutive',
  )
  const earnedIncomeMonthly = hasEmployeeHealthInsurance && employeeIncomeCategory
    ? getAgeQualifiedIncomeCategoryMonthly(formData, employeeIncomeCategory, age)
    : 0
  const employeeIncomeDurationYears = employeeIncomeCategory
    ? getIncomeCategoryDurationYears(formData, employeeIncomeCategory)
    : null
  const isEmployeeIncomeActive =
    employeeIncomeDurationYears === null ||
    age < formData.currentAge + employeeIncomeDurationYears
  const businessIncomeMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age)
  const nonSalaryOtherIncomeMonthly = hasEmployeeHealthInsurance
    ? getAgeQualifiedNonSalaryIncomeMonthly(formData, age)
    : getStructuredAgeQualifiedOtherIncomeMonthly(formData, age)
  const businessIncomeAnnualForHealthInsurance = getEstimatedBusinessIncomeAnnualForHealthInsurance(
    formData,
    age,
    includeDeclaredBusinessIncome,
  )
  const effectiveSalaryMonthly = employeeIncomeCategory
    ? isEmployeeIncomeActive
      ? Math.max(formData.salaryMonthly, earnedIncomeMonthly)
      : 0
    : formData.salaryMonthly
  const annualNonSalaryIncome =
    totalDividendAnnualGross +
    pensionMonthly * 12 +
    Math.max(nonSalaryOtherIncomeMonthly - businessIncomeMonthly, 0) * 12 +
    businessIncomeAnnualForHealthInsurance

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
    policyConfig.healthInsurance.employeeAdditionalIncomeShareRate

  const regionalIncomePremium =
    (annualNonSalaryIncome / 12) * policyConfig.healthInsurance.employeeContributionRate

  const regionalPropertyBase = Math.max(
    getRegionalPropertyBase(formData, effectiveHealthInsuranceType) -
      policyConfig.healthInsurance.regionalPropertyDeduction,
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

  switch (effectiveHealthInsuranceType) {
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

type CashProjectionDividendInputs = {
  taxableDividendAnnualGross: number
  taxableDividendAnnualNet: number
  taxableDividendOwnershipBreakdown: AccountOwnershipBreakdown[]
  isaDividendAnnualNet: number
  isaSettlementTax: number
  isaSettlementYear: number | null
  pensionDividendAnnualNet: number
}

export const calculateCashProjection = (
  formData: AlphaFormData,
  dividendInputs: CashProjectionDividendInputs,
  totalExpenseMonthly: number,
  holdingTaxMonthly: number,
  projectionYears = 30,
): CashProjection => {
  let cumulativeNetChange = 0
  let cumulativeHealthInsurance = 0
  let cumulativePensionIncome = 0
  let cumulativeOtherIncome = 0
  let cumulativeTotalIncome = 0
  let cumulativeCashInterest = 0
  let cumulativeUsableCash = 0
  let cumulativePrivatePensionTax = 0
  let cumulativeRentalIncomeTax = 0
  let cumulativeEstimatedComprehensiveIncomeTax = 0
  let cumulativeEstimatedLocalIncomeTax = 0
  let cumulativeFinancialComprehensiveTax = 0
  let cumulativeIsaDividend = 0
  let cumulativeIsaPrincipalWithdrawal = 0
  let cumulativeHousingExpense = 0
  let cumulativeFixedExpense = 0
  let cumulativeLivingExpense = 0
  let cumulativeAcademyExpense = 0
  let cumulativeCarExpense = 0
  let cumulativeLoanInterest = 0
  let balance = formData.startingCashReserve
  let isaRemainingPrincipalWithdrawalAllowance = roundCurrency(formData.isaAssets)
  const isaSettlementYear = dividendInputs.isaSettlementYear
  const isaSettlementTransferAmount =
    isaSettlementYear === null ? 0 : roundCurrency(formData.isaAssets)
  const timeline = [
    {
      year: 0,
      balance: roundCurrency(balance),
    },
  ]

  const fixedLoanInterestMonthly = getLoanInterestMonthlyAtYear(formData)
  const fixedInsuranceMonthly = getInsuranceMonthlyAtYear(formData)
  const carExpenseMonthly = roundCurrency(formData.carYearlyCost / 12)
  const housingExpenseMonthly = formData.housingType === 'monthlyRent' ? formData.monthlyRentAmount : 0
  const fixedExpenseMonthlyWithoutInsuranceAndCar =
    formData.maintenanceMonthly + formData.telecomMonthly + formData.otherFixedMonthly
  const academyExpenseMonthly =
    formData.livingCostInputMode === 'detailed' && formData.hasChildren
      ? formData.academyMonthly ?? 0
      : 0
  const livingExpenseMonthly = Math.max(
    totalExpenseMonthly -
      fixedLoanInterestMonthly -
      fixedInsuranceMonthly -
      carExpenseMonthly -
      housingExpenseMonthly -
      fixedExpenseMonthlyWithoutInsuranceAndCar,
    0,
  )

  for (let yearIndex = 0; yearIndex < projectionYears; yearIndex += 1) {
    const projectedAge = formData.currentAge + yearIndex
    const projectedOtherIncomeMonthly = getAgeQualifiedOtherIncomeMonthly(formData, projectedAge)
    const projectedPensionMonthly = getAgeQualifiedPensionMonthly(formData, projectedAge)
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
    const projectedPrivatePensionTaxAnnual = calculateAgeQualifiedPrivatePensionTaxAnnual(
      formData,
      projectedAge,
    ).totalTaxAnnual
    const projectedCashInterestAnnualGross = calculateGrossCashInterestAnnual(
      balance,
      formData.cashInterestRatePercent,
    )
    const projectedCashInterestAnnual = calculateNetCashInterestAnnual(
      balance,
      formData.cashInterestRatePercent,
    )
    const projectedCashInterestOwnershipBreakdown = getOwnershipAllocations({
      householdType: formData.householdType,
      ownershipType: formData.householdType === 'couple' ? 'split' : 'mineOnly',
      totalAnnualInput: projectedCashInterestAnnualGross,
      totalAnnualAllocated: projectedCashInterestAnnualGross,
      myAttributedAnnualInput:
        formData.householdType === 'couple'
          ? roundCurrency(projectedCashInterestAnnualGross / 2)
          : projectedCashInterestAnnualGross,
    })
    const projectedFinancialComprehensiveTax = calculateComprehensiveTax(
      dividendInputs.taxableDividendOwnershipBreakdown,
      projectedCashInterestOwnershipBreakdown,
      projectedEstimatedComprehensiveTax.taxableBaseAnnual,
    )
    const projectedHealthInsuranceMonthly =
      formData.healthInsuranceOverrideMonthly ??
      estimateHealthInsurance(
        formData,
        dividendInputs.taxableDividendAnnualGross + projectedCashInterestAnnualGross,
        projectedAge,
        projectedPensionMonthly,
      )
    const hasIsaSettled = isaSettlementYear !== null && yearIndex + 1 > isaSettlementYear
    const projectedIsaDividendAnnual = hasIsaSettled ? 0 : dividendInputs.isaDividendAnnualNet
    const projectedIsaPrincipalWithdrawal = Math.min(
      projectedIsaDividendAnnual,
      isaRemainingPrincipalWithdrawalAllowance,
    )
    isaRemainingPrincipalWithdrawalAllowance = roundCurrency(
      Math.max(
        isaRemainingPrincipalWithdrawalAllowance - projectedIsaPrincipalWithdrawal,
        0,
      ),
    )
    const isIsaSettlementYear = isaSettlementYear === yearIndex + 1
    const projectedIsaTransferAmount = isIsaSettlementYear ? isaSettlementTransferAmount : 0
    const projectedIsaSettlementTax = isIsaSettlementYear ? dividendInputs.isaSettlementTax : 0

    const projectedTotalIncomeAnnual = roundCurrency(
      dividendInputs.taxableDividendAnnualNet +
        projectedIsaDividendAnnual +
        dividendInputs.pensionDividendAnnualNet +
        projectedOtherIncomeMonthly * 12 +
        projectedPensionMonthly * 12 +
        projectedCashInterestAnnual,
    )
    const projectedUsableCashAnnual = roundCurrency(
      projectedTotalIncomeAnnual -
        roundCurrency(projectedHealthInsuranceMonthly * 12) -
        roundCurrency(holdingTaxMonthly * 12) -
        projectedEstimatedComprehensiveTax.incomeTaxAnnual -
        projectedEstimatedComprehensiveTax.localIncomeTaxAnnual -
        projectedPrivatePensionTaxAnnual -
        projectedFinancialComprehensiveTax.impactAnnual -
        projectedRentalIncomeTaxAnnual -
        projectedIsaSettlementTax,
    )
    const inflationMultiplier = formData.inflationEnabled
      ? (1 + formData.inflationRateAnnual) ** yearIndex
      : 1

    const projectedHousingExpense = housingExpenseMonthly * inflationMultiplier
    const projectedFixedExpense =
      fixedExpenseMonthlyWithoutInsuranceAndCar * inflationMultiplier
    const projectedLivingExpense = livingExpenseMonthly * inflationMultiplier
    const projectedAcademyExpense = academyExpenseMonthly * inflationMultiplier
    const projectedCarExpense = carExpenseMonthly * inflationMultiplier
    const projectedInsuranceExpense =
      getInsuranceMonthlyAtYear(formData, yearIndex) * inflationMultiplier
    const projectedLoanInterest = getLoanInterestMonthlyAtYear(formData, yearIndex)

    const projectedExpenses =
      projectedHousingExpense +
      projectedFixedExpense +
      projectedLivingExpense +
      projectedCarExpense +
      projectedInsuranceExpense +
      projectedLoanInterest
    const projectedExpensesAnnual = roundCurrency(projectedExpenses * 12)
    const operatingAnnualNetChange = roundCurrency(projectedUsableCashAnnual - projectedExpensesAnnual)
    const annualNetChange = roundCurrency(operatingAnnualNetChange + projectedIsaTransferAmount)

    cumulativeHealthInsurance += roundCurrency(projectedHealthInsuranceMonthly * 12)
    cumulativePensionIncome += roundCurrency(projectedPensionMonthly * 12)
    cumulativeOtherIncome += roundCurrency(projectedOtherIncomeMonthly * 12)
    cumulativeTotalIncome += projectedTotalIncomeAnnual
    cumulativeCashInterest += projectedCashInterestAnnual
    cumulativeUsableCash += projectedUsableCashAnnual
    cumulativePrivatePensionTax += projectedPrivatePensionTaxAnnual
    cumulativeRentalIncomeTax += projectedRentalIncomeTaxAnnual
    cumulativeEstimatedComprehensiveIncomeTax += projectedEstimatedComprehensiveTax.incomeTaxAnnual
    cumulativeEstimatedLocalIncomeTax += projectedEstimatedComprehensiveTax.localIncomeTaxAnnual
    cumulativeFinancialComprehensiveTax += projectedFinancialComprehensiveTax.impactAnnual
    cumulativeIsaDividend += projectedIsaDividendAnnual - projectedIsaSettlementTax
    cumulativeIsaPrincipalWithdrawal += projectedIsaPrincipalWithdrawal
    cumulativeHousingExpense += roundCurrency(projectedHousingExpense * 12)
    cumulativeFixedExpense += roundCurrency(
      (projectedFixedExpense + projectedInsuranceExpense) * 12,
    )
    cumulativeLivingExpense += roundCurrency(projectedLivingExpense * 12)
    cumulativeAcademyExpense += roundCurrency(projectedAcademyExpense * 12)
    cumulativeCarExpense += roundCurrency(projectedCarExpense * 12)
    cumulativeLoanInterest += roundCurrency(projectedLoanInterest * 12)
    cumulativeNetChange += annualNetChange
    balance += annualNetChange
    timeline.push({
      year: yearIndex + 1,
      balance: roundCurrency(balance),
    })
  }

  const minimumBalance = Math.min(...timeline.map((point) => point.balance))
  const firstDepletionYear = timeline.find((point) => point.balance < 0)?.year ?? null

  return {
    cumulativeNetChange: roundCurrency(cumulativeNetChange),
    endingBalance: roundCurrency(balance),
    timeline,
    cumulativeHealthInsurance: roundCurrency(cumulativeHealthInsurance),
    cumulativePensionIncome: roundCurrency(cumulativePensionIncome),
    cumulativeOtherIncome: roundCurrency(cumulativeOtherIncome),
    cumulativeTotalIncome: roundCurrency(cumulativeTotalIncome),
    cumulativeCashInterest: roundCurrency(cumulativeCashInterest),
    cumulativeUsableCash: roundCurrency(cumulativeUsableCash),
    cumulativePrivatePensionTax: roundCurrency(cumulativePrivatePensionTax),
    cumulativeRentalIncomeTax: roundCurrency(cumulativeRentalIncomeTax),
    cumulativeEstimatedComprehensiveIncomeTax: roundCurrency(cumulativeEstimatedComprehensiveIncomeTax),
    cumulativeEstimatedLocalIncomeTax: roundCurrency(cumulativeEstimatedLocalIncomeTax),
    cumulativeFinancialComprehensiveTax: roundCurrency(cumulativeFinancialComprehensiveTax),
    cumulativeIsaDividend: roundCurrency(cumulativeIsaDividend),
    cumulativeIsaPrincipalWithdrawal: roundCurrency(cumulativeIsaPrincipalWithdrawal),
    cumulativeHousingExpense: roundCurrency(cumulativeHousingExpense),
    cumulativeFixedExpense: roundCurrency(cumulativeFixedExpense),
    cumulativeLivingExpense: roundCurrency(cumulativeLivingExpense),
    cumulativeAcademyExpense: roundCurrency(cumulativeAcademyExpense),
    cumulativeCarExpense: roundCurrency(cumulativeCarExpense),
    cumulativeLoanInterest: roundCurrency(cumulativeLoanInterest),
    isaRemainingPrincipalWithdrawalAllowance: roundCurrency(
      isaRemainingPrincipalWithdrawalAllowance,
    ),
    minimumBalance: roundCurrency(minimumBalance),
    firstDepletionYear,
    cashShortfallToAvoidDepletion: roundCurrency(Math.max(-minimumBalance, 0)),
    isaSettlementYear,
    isaSettlementTransferAmount,
  }
}

