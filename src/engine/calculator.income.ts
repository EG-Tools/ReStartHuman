import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  ComprehensiveTaxPersonBreakdown,
  IsaTaxBreakdown,
  IsaType,
  AlphaFormData,
  ReviewLevel,
} from '../types/alpha'
import { getAgeQualifiedIncomeCategoryMonthly } from '../utils/incomeStreams'
import { formatCompactCurrency } from '../utils/format'
import {
  createDividendStream,
  type ComprehensiveTaxCalculation,
  type IsaTaxCalculation,
  roundCurrency,
  toMonthly,
} from './calculator.shared'

const normalizeIsaType = (isaType: IsaType | undefined): 'general' | 'workingClass' =>
  isaType === 'workingClass' ? 'workingClass' : 'general'

const getIsaTaxFreeLimit = (isaType: 'general' | 'workingClass') =>
  isaType === 'workingClass'
    ? policyConfig.isa.workingClassTaxFreeLimit
    : policyConfig.isa.generalTaxFreeLimit

const getIsaTypeForPerson = (
  formData: AlphaFormData,
  personKey: IsaTaxBreakdown['personKey'],
): 'general' | 'workingClass' => {
  if (formData.householdType !== 'couple') {
    return normalizeIsaType(formData.myIsaType ?? formData.isaType)
  }

  return normalizeIsaType(
    personKey === 'mine'
      ? formData.myIsaType ?? formData.isaType
      : formData.spouseIsaType ?? formData.isaType,
  )
}

type EstimatedComprehensiveTaxBaseBreakdown = {
  earnedGrossAnnual: number
  earnedIncomeAmountAnnual: number
  otherPensionAnnual: number
  freelanceAnnual: number
  businessAnnual: number
  miscGrossAnnual: number
  miscIncomeAmountAnnual: number
  nationalPensionGrossAnnual: number
  nationalPensionIncomeAmountAnnual: number
  basicDeductionAnnual: number
  taxableBaseAnnual: number
}

type EstimatedComprehensiveTaxReview = {
  level: ReviewLevel
  reasons: string[]
  rentalSeparateTaxationOption: boolean
}

const calculateBracketBasedDeduction = (
  annualAmount: number,
  brackets: readonly {
    upperBound: number
    baseStart: number
    baseDeduction: number
    rate: number
  }[],
  maxDeductionAnnual?: number,
) => {
  const normalizedAnnualAmount = Math.max(annualAmount, 0)

  if (normalizedAnnualAmount <= 0) {
    return 0
  }

  const matchedBracket =
    brackets.find((bracket) => normalizedAnnualAmount <= bracket.upperBound) ??
    brackets[brackets.length - 1]
  const deductionAnnual = roundCurrency(
    matchedBracket.baseDeduction +
      Math.max(normalizedAnnualAmount - matchedBracket.baseStart, 0) * matchedBracket.rate,
  )

  return roundCurrency(
    Math.min(
      Math.max(deductionAnnual, 0),
      maxDeductionAnnual ?? Number.POSITIVE_INFINITY,
    ),
  )
}

export const calculateProgressiveIncomeTax = (annualTaxBase: number) => {
  const normalizedTaxBase = Math.max(annualTaxBase, 0)

  if (normalizedTaxBase <= 0) {
    return 0
  }

  const matchedBracket =
    policyConfig.comprehensiveIncomeTax.brackets.find(
      (bracket) => normalizedTaxBase <= bracket.upperBound,
    ) ??
    policyConfig.comprehensiveIncomeTax.brackets[
      policyConfig.comprehensiveIncomeTax.brackets.length - 1
    ]

  return roundCurrency(normalizedTaxBase * matchedBracket.rate - matchedBracket.deduction)
}

export const calculateEarnedIncomeDeductionAnnual = (grossAnnual: number) =>
  calculateBracketBasedDeduction(
    grossAnnual,
    policyConfig.comprehensiveIncomeTax.earnedIncomeDeductionBrackets,
    policyConfig.comprehensiveIncomeTax.earnedIncomeDeductionMaxAnnual,
  )

export const calculatePublicPensionDeductionAnnual = (grossAnnual: number) =>
  calculateBracketBasedDeduction(
    grossAnnual,
    policyConfig.comprehensiveIncomeTax.publicPensionDeductionBrackets,
    policyConfig.comprehensiveIncomeTax.publicPensionDeductionMaxAnnual,
  )

const getEstimatedMiscIncomeAmountAnnual = (grossAnnual: number) => {
  const normalizedGrossAnnual = Math.max(grossAnnual, 0)

  if (normalizedGrossAnnual <= 0) {
    return 0
  }

  const incomeAmountAnnual = roundCurrency(
    normalizedGrossAnnual * (1 - policyConfig.comprehensiveIncomeTax.miscIncomeExpenseRate),
  )

  return incomeAmountAnnual > policyConfig.comprehensiveIncomeTax.miscIncomeReportThresholdAnnual
    ? incomeAmountAnnual
    : 0
}

const getEstimatedComprehensiveTaxBaseBreakdown = ({
  formData,
  age,
  nationalPensionMonthly,
}: {
  formData: AlphaFormData
  age: number
  nationalPensionMonthly: number
}): EstimatedComprehensiveTaxBaseBreakdown => {
  const corporateExecutiveGrossAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'corporateExecutive', age) * 12
  const earnedGrossAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'earned', age) * 12 +
    corporateExecutiveGrossAnnual
  const earnedIncomeAmountAnnual = Math.max(
    earnedGrossAnnual - calculateEarnedIncomeDeductionAnnual(earnedGrossAnnual),
    0,
  )
  const otherPensionAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'otherPension', age) * 12
  const freelanceAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'freelance', age) * 12
  const businessAnnual =
    getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age) * 12
  const miscGrossAnnual = getAgeQualifiedIncomeCategoryMonthly(formData, 'misc', age) * 12
  const miscIncomeAmountAnnual = getEstimatedMiscIncomeAmountAnnual(miscGrossAnnual)
  const nationalPensionGrossAnnual = Math.max(nationalPensionMonthly, 0) * 12
  const nationalPensionIncomeAmountAnnual = Math.max(
    nationalPensionGrossAnnual - calculatePublicPensionDeductionAnnual(nationalPensionGrossAnnual),
    0,
  )
  const grossTaxBaseAnnual = roundCurrency(
    earnedIncomeAmountAnnual +
      freelanceAnnual +
      businessAnnual +
      miscIncomeAmountAnnual +
      nationalPensionIncomeAmountAnnual,
  )
  const basicDeductionAnnual =
    grossTaxBaseAnnual > 0 ? policyConfig.comprehensiveIncomeTax.basicPersonalDeductionAnnual : 0

  return {
    earnedGrossAnnual: roundCurrency(earnedGrossAnnual),
    earnedIncomeAmountAnnual: roundCurrency(earnedIncomeAmountAnnual),
    otherPensionAnnual: roundCurrency(otherPensionAnnual),
    freelanceAnnual: roundCurrency(freelanceAnnual),
    businessAnnual: roundCurrency(businessAnnual),
    miscGrossAnnual: roundCurrency(miscGrossAnnual),
    miscIncomeAmountAnnual: roundCurrency(miscIncomeAmountAnnual),
    nationalPensionGrossAnnual: roundCurrency(nationalPensionGrossAnnual),
    nationalPensionIncomeAmountAnnual: roundCurrency(nationalPensionIncomeAmountAnnual),
    basicDeductionAnnual,
    taxableBaseAnnual: roundCurrency(Math.max(grossTaxBaseAnnual - basicDeductionAnnual, 0)),
  }
}

export const getEstimatedComprehensiveTaxBaseAnnual = ({
  formData,
  age,
  nationalPensionMonthly,
}: {
  formData: AlphaFormData
  age: number
  nationalPensionMonthly: number
}) =>
  getEstimatedComprehensiveTaxBaseBreakdown({
    formData,
    age,
    nationalPensionMonthly,
  }).taxableBaseAnnual

export const calculateEstimatedComprehensiveIncomeTax = (annualTaxBase: number) => {
  const taxableBaseAnnual = roundCurrency(Math.max(annualTaxBase, 0))
  const incomeTaxAnnual = calculateProgressiveIncomeTax(taxableBaseAnnual)
  const localIncomeTaxAnnual = roundCurrency(
    incomeTaxAnnual * policyConfig.comprehensiveIncomeTax.localIncomeTaxMultiplier,
  )

  return {
    taxableBaseAnnual,
    incomeTaxAnnual,
    localIncomeTaxAnnual,
    totalTaxAnnual: roundCurrency(incomeTaxAnnual + localIncomeTaxAnnual),
  }
}

export const getPrivatePensionTaxBand = (age: number) =>
  policyConfig.privatePensionTax.ageBands.find(
    (band) => age >= band.minAge && age < band.maxAge,
  ) ?? policyConfig.privatePensionTax.ageBands[policyConfig.privatePensionTax.ageBands.length - 1]

export const calculatePrivatePensionTax = (annualAmount: number, age: number) => {
  const normalizedAnnualAmount = roundCurrency(Math.max(annualAmount, 0))
  const taxBand = getPrivatePensionTaxBand(age)
  const incomeTaxAnnual = roundCurrency(normalizedAnnualAmount * taxBand.incomeTaxRate)
  const localIncomeTaxAnnual = roundCurrency(normalizedAnnualAmount * taxBand.localIncomeTaxRate)

  return {
    annualIncome: normalizedAnnualAmount,
    incomeTaxAnnual,
    localIncomeTaxAnnual,
    totalTaxAnnual: roundCurrency(incomeTaxAnnual + localIncomeTaxAnnual),
    totalTaxRate: taxBand.totalRate,
    bandLabel: taxBand.label,
  }
}

export const calculateAgeQualifiedPrivatePensionTaxAnnual = (
  formData: AlphaFormData,
  age: number,
) =>
  calculatePrivatePensionTax(
    getAgeQualifiedIncomeCategoryMonthly(formData, 'otherPension', age) * 12,
    age,
  )

export const calculateRentalIncomeTax = (annualRentalIncome: number) => {
  const normalizedAnnualIncome = Math.max(annualRentalIncome, 0)

  if (normalizedAnnualIncome <= 0) {
    return {
      annualIncome: 0,
      taxableBaseAnnual: 0,
      annualTax: 0,
      monthlyTax: 0,
    }
  }

  const taxableBaseAnnual = Math.max(
    normalizedAnnualIncome * (1 - policyConfig.rentalIncomeTax.estimatedExpenseRate) -
      policyConfig.rentalIncomeTax.basicDeductionAnnual,
    0,
  )
  const incomeTaxAnnual = calculateProgressiveIncomeTax(taxableBaseAnnual)
  const localIncomeTaxAnnual = roundCurrency(
    incomeTaxAnnual * policyConfig.rentalIncomeTax.localIncomeTaxMultiplier,
  )
  const annualTax = roundCurrency(incomeTaxAnnual + localIncomeTaxAnnual)

  return {
    annualIncome: normalizedAnnualIncome,
    taxableBaseAnnual: roundCurrency(taxableBaseAnnual),
    annualTax,
    monthlyTax: toMonthly(annualTax),
  }
}

export const calculateTaxableStream = (
  annualInput: number,
  inputMode: AlphaFormData['dividendInputMode'],
  grossUpFromNet: boolean,
) => {
  if (inputMode === 'net') {
    const annualGross = grossUpFromNet
      ? annualInput / (1 - policyConfig.dividendWithholding.totalRate)
      : annualInput

    return createDividendStream(annualGross, annualInput)
  }

  return createDividendStream(
    annualInput,
    annualInput * (1 - policyConfig.dividendWithholding.totalRate),
  )
}

export const calculateIsaTax = ({
  formData,
  ownershipBreakdown,
}: {
  formData: AlphaFormData
  ownershipBreakdown: AccountOwnershipBreakdown[]
}): IsaTaxCalculation => {
  const annualGross = roundCurrency(
    ownershipBreakdown.reduce((sum, item) => sum + item.attributedAnnual, 0),
  )
  const settlementYear =
    annualGross > 0
      ? formData.isaAssets > 0
        ? Math.max(Math.ceil(formData.isaAssets / annualGross), 1)
        : formData.simulationYears
      : null
  const settlementDurationYears = settlementYear ?? 0
  const breakdown = ownershipBreakdown.map<IsaTaxBreakdown>((allocation) => {
    const attributedAnnual = roundCurrency(allocation.attributedAnnual)
    const projectedGross = roundCurrency(attributedAnnual * settlementDurationYears)
    const isaType = getIsaTypeForPerson(formData, allocation.personKey)
    const taxFreeLimit = getIsaTaxFreeLimit(isaType)

    if (formData.dividendInputMode === 'net') {
      return {
        personKey: allocation.personKey,
        label: allocation.label,
        isaType,
        attributedAnnual,
        projectedGross,
        taxFreeLimit,
        taxFreeLimitApplied: 0,
        taxableExcess: 0,
        settlementTax: 0,
        projectedNetAfterSettlement: projectedGross,
      }
    }

    const taxFreeLimitApplied = Math.min(projectedGross, taxFreeLimit)
    const taxableExcess = Math.max(projectedGross - taxFreeLimit, 0)
    const settlementTax = roundCurrency(taxableExcess * policyConfig.isa.excessTaxRate)

    return {
      personKey: allocation.personKey,
      label: allocation.label,
      isaType,
      attributedAnnual,
      projectedGross,
      taxFreeLimit,
      taxFreeLimitApplied,
      taxableExcess,
      settlementTax,
      projectedNetAfterSettlement: roundCurrency(projectedGross - settlementTax),
    }
  })

  return {
    // Withdrawals consume the principal allowance; tax is deferred until that allowance is exhausted.
    stream: createDividendStream(annualGross, annualGross),
    settlementTax: roundCurrency(breakdown.reduce((sum, item) => sum + item.settlementTax, 0)),
    settlementYear,
    taxFreeLimitApplied: roundCurrency(
      breakdown.reduce((sum, item) => sum + item.taxFreeLimitApplied, 0),
    ),
    breakdown,
  }
}

export const calculateComprehensiveTax = (
  ownershipBreakdown: AccountOwnershipBreakdown[],
  cashInterestOwnershipBreakdown: AccountOwnershipBreakdown[] = [],
  otherComprehensiveTaxBaseAnnual = 0,
): ComprehensiveTaxCalculation => {
  const thresholdAnnual = policyConfig.comprehensiveIncomeTax.financialIncomeThresholdAnnual
  const financialIncomeByPerson = new Map<
    AccountOwnershipBreakdown['personKey'],
    {
      personKey: AccountOwnershipBreakdown['personKey']
      label: string
      attributedAnnual: number
      withheldTaxAnnual: number
    }
  >()

  const appendFinancialIncome = (allocation: AccountOwnershipBreakdown) => {
    const attributedAnnual = roundCurrency(allocation.attributedAnnual)
    const withheldTaxAnnual = roundCurrency(
      attributedAnnual * policyConfig.dividendWithholding.totalRate,
    )
    const existing = financialIncomeByPerson.get(allocation.personKey)

    if (existing) {
      existing.attributedAnnual = roundCurrency(existing.attributedAnnual + attributedAnnual)
      existing.withheldTaxAnnual = roundCurrency(existing.withheldTaxAnnual + withheldTaxAnnual)
      return
    }

    financialIncomeByPerson.set(allocation.personKey, {
      personKey: allocation.personKey,
      label: allocation.label,
      attributedAnnual,
      withheldTaxAnnual,
    })
  }

  ownershipBreakdown.forEach(appendFinancialIncome)
  cashInterestOwnershipBreakdown.forEach(appendFinancialIncome)

  const breakdown = Array.from(financialIncomeByPerson.values()).map((item) => {
    const attributedFinancialIncomeAnnual = roundCurrency(item.attributedAnnual)
    const withheldTaxAnnual = roundCurrency(item.withheldTaxAnnual)
    const exceedsThreshold = attributedFinancialIncomeAnnual > thresholdAnnual
    const attributedOtherTaxBaseAnnual =
      item.personKey === 'mine' ? roundCurrency(Math.max(otherComprehensiveTaxBaseAnnual, 0)) : 0

    if (!exceedsThreshold) {
      return {
        personKey: item.personKey,
        label: item.label,
        attributedDividendAnnual: attributedFinancialIncomeAnnual,
        thresholdAnnual,
        exceedsThreshold,
        finalTaxAnnual: withheldTaxAnnual,
        withheldTaxAnnual,
        additionalTaxAnnual: 0,
      }
    }

    const excessAnnual = Math.max(attributedFinancialIncomeAnnual - thresholdAnnual, 0)
    const comprehensiveComparisonIncomeTaxAnnual =
      thresholdAnnual * policyConfig.dividendWithholding.incomeTaxRate +
      calculateProgressiveIncomeTax(attributedOtherTaxBaseAnnual + excessAnnual)
    const withholdingComparisonIncomeTaxAnnual =
      attributedFinancialIncomeAnnual * policyConfig.dividendWithholding.incomeTaxRate +
      calculateProgressiveIncomeTax(attributedOtherTaxBaseAnnual)
    const combinedTaxAnnual = roundCurrency(
      Math.max(
        comprehensiveComparisonIncomeTaxAnnual,
        withholdingComparisonIncomeTaxAnnual,
      ) *
        (1 + policyConfig.comprehensiveIncomeTax.localIncomeTaxMultiplier),
    )
    const standaloneOtherIncomeTaxAnnual = roundCurrency(
      calculateProgressiveIncomeTax(attributedOtherTaxBaseAnnual) *
        (1 + policyConfig.comprehensiveIncomeTax.localIncomeTaxMultiplier),
    )
    const finalTaxAnnual = roundCurrency(
      Math.max(combinedTaxAnnual - standaloneOtherIncomeTaxAnnual, withheldTaxAnnual),
    )

    return {
      personKey: item.personKey,
      label: item.label,
      attributedDividendAnnual: attributedFinancialIncomeAnnual,
      thresholdAnnual,
      exceedsThreshold,
      finalTaxAnnual,
      withheldTaxAnnual,
      additionalTaxAnnual: Math.max(finalTaxAnnual - withheldTaxAnnual, 0),
    }
  })

  return {
    included: breakdown.some((item) => item.exceedsThreshold),
    impactAnnual: roundCurrency(breakdown.reduce((sum, item) => sum + item.additionalTaxAnnual, 0)),
    baseAnnual: roundCurrency(breakdown.reduce((sum, item) => sum + item.attributedDividendAnnual, 0)),
    thresholdAnnual,
    breakdown,
  }
}
export const evaluateEstimatedComprehensiveTaxReview = ({
  formData,
  age,
  nationalPensionMonthly,
  comprehensiveTaxBreakdown,
}: {
  formData: AlphaFormData
  age: number
  nationalPensionMonthly: number
  comprehensiveTaxBreakdown: ComprehensiveTaxPersonBreakdown[]
}): EstimatedComprehensiveTaxReview => {
  const breakdown = getEstimatedComprehensiveTaxBaseBreakdown({
    formData,
    age,
    nationalPensionMonthly,
  })
  const businessMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age)
  const freelanceMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'freelance', age)
  const miscMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'misc', age)
  const rentalAnnual = getAgeQualifiedIncomeCategoryMonthly(formData, 'rental', age) * 12
  const financialIncomeAboveThreshold = comprehensiveTaxBreakdown.filter(
    (item) => item.exceedsThreshold,
  )
  const rentalSeparateTaxationOption =
    rentalAnnual > 0 &&
    formData.dependentRentalIncomeType === 'housing' &&
    rentalAnnual <= policyConfig.rentalIncomeTax.separateTaxationThresholdAnnual
  const reasons: string[] = []

  if (businessMonthly > 0) {
    reasons.push(
      '개인사업자 소득은 입력한 사업소득금액 기준으로 종합소득세를 단순 추정했습니다. 업종군과 필요경비에 따라 실제 세액은 달라질 수 있습니다.',
    )
  }

  if (freelanceMonthly > 0) {
    reasons.push('프리랜서 소득은 사업자등록 여부와 필요경비에 따라 실제 세액이 달라질 수 있습니다.')
  }


  if (breakdown.nationalPensionGrossAnnual > 0) {
    reasons.push(
      breakdown.nationalPensionIncomeAmountAnnual < breakdown.nationalPensionGrossAnnual
        ? '국민연금은 연금소득공제를 반영해 추정했습니다.'
        : '국민연금은 과세 대상 연금소득으로 추정 반영했습니다.',
    )
  }

  if (miscMonthly > 0) {
    reasons.push(
      breakdown.miscIncomeAmountAnnual > 0
        ? '기타소득은 필요경비 60%를 적용한 소득금액 기준으로 반영했습니다.'
        : '기타소득금액이 연 300만원 이하로 보여 이번 추정 종합소득세에서는 제외했습니다.',
    )
  }

  if (rentalAnnual > 0) {
    reasons.push(
      rentalSeparateTaxationOption
        ? `주택임대소득은 연 ${formatCompactCurrency(rentalAnnual)} 수준이라 분리과세 선택 가능성을 함께 봤습니다.`
        : '임대소득은 과세 방식 확인이 필요한 항목입니다.',
    )
  }

  if (financialIncomeAboveThreshold.length > 0) {
    const financialIncomeSummary = financialIncomeAboveThreshold
      .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
      .join(', ')
    reasons.push(
      `금융소득은 인별로 판정하며, ${financialIncomeSummary}이 2,000만원 기준을 넘어 다른 종합소득과 합산한 비교세액을 반영했습니다.`,
    )
  }

  const level: ReviewLevel =
    financialIncomeAboveThreshold.length > 0 || businessMonthly > 0
      ? 'high'
      : reasons.length > 0
        ? 'review'
        : 'none'

  return {
    level,
    reasons: Array.from(new Set(reasons)),
    rentalSeparateTaxationOption,
  }
}
