import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  IsaTaxBreakdown,
  IsaType,
  AlphaFormData,
  IncomeCategory,
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

const getIsaTaxFreeLimitAnnual = (isaType: 'general' | 'workingClass') =>
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

const ESTIMATED_COMPREHENSIVE_TAX_CATEGORIES: IncomeCategory[] = [
  'earned',
  'otherPension',
  'freelance',
  'business',
  'misc',
]

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

export const getEstimatedComprehensiveTaxBaseAnnual = ({
  formData,
  age,
  nationalPensionMonthly,
}: {
  formData: AlphaFormData
  age: number
  nationalPensionMonthly: number
}) => {
  const monthlyTaxBase =
    ESTIMATED_COMPREHENSIVE_TAX_CATEGORIES.reduce(
      (sum, category) => sum + getAgeQualifiedIncomeCategoryMonthly(formData, category, age),
      0,
    ) + Math.max(nationalPensionMonthly, 0)

  return roundCurrency(Math.max(monthlyTaxBase, 0) * 12)
}

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
  const breakdown = ownershipBreakdown.map<IsaTaxBreakdown>((allocation) => {
    const attributedAnnual = roundCurrency(allocation.attributedAnnual)
    const isaType = getIsaTypeForPerson(formData, allocation.personKey)
    const taxFreeLimitAnnual = getIsaTaxFreeLimitAnnual(isaType)

    if (formData.dividendInputMode === 'net') {
      return {
        personKey: allocation.personKey,
        label: allocation.label,
        isaType,
        attributedAnnual,
        taxFreeLimitAnnual,
        taxFreeLimitAppliedAnnual: 0,
        taxableExcessAnnual: 0,
        taxAnnual: 0,
        netAnnual: attributedAnnual,
      }
    }

    const taxFreeLimitAppliedAnnual = Math.min(attributedAnnual, taxFreeLimitAnnual)
    const taxableExcessAnnual = Math.max(attributedAnnual - taxFreeLimitAnnual, 0)
    const taxAnnual = roundCurrency(taxableExcessAnnual * policyConfig.isa.excessTaxRate)

    return {
      personKey: allocation.personKey,
      label: allocation.label,
      isaType,
      attributedAnnual,
      taxFreeLimitAnnual,
      taxFreeLimitAppliedAnnual,
      taxableExcessAnnual,
      taxAnnual,
      netAnnual: roundCurrency(attributedAnnual - taxAnnual),
    }
  })

  const annualGross = roundCurrency(breakdown.reduce((sum, item) => sum + item.attributedAnnual, 0))
  const annualNet = roundCurrency(breakdown.reduce((sum, item) => sum + item.netAnnual, 0))

  return {
    stream: createDividendStream(annualGross, annualNet),
    taxAnnual: roundCurrency(breakdown.reduce((sum, item) => sum + item.taxAnnual, 0)),
    taxFreeLimitApplied: roundCurrency(
      breakdown.reduce((sum, item) => sum + item.taxFreeLimitAppliedAnnual, 0),
    ),
    breakdown,
  }
}

export const calculateComprehensiveTax = (
  ownershipBreakdown: AccountOwnershipBreakdown[],
): ComprehensiveTaxCalculation => {
  const thresholdAnnual = policyConfig.comprehensiveIncomeTax.financialIncomeThresholdAnnual
  const breakdown = ownershipBreakdown.map((allocation) => {
    const attributedDividendAnnual = roundCurrency(allocation.attributedAnnual)
    const withheldTaxAnnual = roundCurrency(
      attributedDividendAnnual * policyConfig.dividendWithholding.totalRate,
    )
    const exceedsThreshold = attributedDividendAnnual > thresholdAnnual

    if (!exceedsThreshold) {
      return {
        personKey: allocation.personKey,
        label: allocation.label,
        attributedDividendAnnual,
        thresholdAnnual,
        exceedsThreshold,
        finalTaxAnnual: withheldTaxAnnual,
        withheldTaxAnnual,
        additionalTaxAnnual: 0,
      }
    }

    const excessAnnual = Math.max(attributedDividendAnnual - thresholdAnnual, 0)
    const comparisonIncomeTaxAnnual =
      thresholdAnnual * policyConfig.dividendWithholding.incomeTaxRate +
      calculateProgressiveIncomeTax(excessAnnual)
    const withholdingEquivalentIncomeTaxAnnual =
      attributedDividendAnnual * policyConfig.dividendWithholding.incomeTaxRate
    const finalTaxAnnual = roundCurrency(
      Math.max(comparisonIncomeTaxAnnual, withholdingEquivalentIncomeTaxAnnual) *
        (1 + policyConfig.comprehensiveIncomeTax.localIncomeTaxMultiplier),
    )

    return {
      personKey: allocation.personKey,
      label: allocation.label,
      attributedDividendAnnual,
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
    baseAnnual: roundCurrency(
      ownershipBreakdown.reduce((sum, item) => sum + item.attributedAnnual, 0),
    ),
    thresholdAnnual,
    breakdown,
  }
}
type EstimatedComprehensiveTaxReview = {
  level: ReviewLevel
  reasons: string[]
  rentalSeparateTaxationOption: boolean
}

export const evaluateEstimatedComprehensiveTaxReview = ({
  formData,
  age,
  nationalPensionMonthly,
  totalFinancialIncomeAnnual,
}: {
  formData: AlphaFormData
  age: number
  nationalPensionMonthly: number
  totalFinancialIncomeAnnual: number
}): EstimatedComprehensiveTaxReview => {
  const businessMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'business', age)
  const freelanceMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'freelance', age)
  const miscMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'misc', age)
  const otherPensionMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, 'otherPension', age)
  const rentalAnnual = getAgeQualifiedIncomeCategoryMonthly(formData, 'rental', age) * 12
  const financialThresholdAnnual = policyConfig.comprehensiveIncomeTax.financialIncomeThresholdAnnual
  const rentalSeparateTaxationOption =
    rentalAnnual > 0 &&
    formData.dependentRentalIncomeType === 'housing' &&
    rentalAnnual <= policyConfig.rentalIncomeTax.separateTaxationThresholdAnnual
  const reasons: string[] = []

  if (
    businessMonthly > 0 ||
    freelanceMonthly > 0 ||
    miscMonthly > 0 ||
    otherPensionMonthly > 0 ||
    nationalPensionMonthly > 0
  ) {
    reasons.push('사업·프리랜서·기타·연금 소득이 있어 종합소득세 신고 검토가 필요합니다.')
  }

  if (rentalAnnual > 0) {
    reasons.push(
      rentalSeparateTaxationOption
        ? '주택임대소득은 연 ' +
            formatCompactCurrency(rentalAnnual) +
            ' 수준이라 분리과세 선택 가능성을 함께 볼 수 있습니다.'
        : '임대소득이 있어 과세 방식 확인이 필요합니다.',
    )
  }

  if (totalFinancialIncomeAnnual > financialThresholdAnnual) {
    reasons.push(
      '금융소득이 연 ' +
        formatCompactCurrency(totalFinancialIncomeAnnual) +
        '로 2,000만원 기준을 넘어 종합과세 검토가 필요합니다.',
    )
  }

  const level: ReviewLevel =
    totalFinancialIncomeAnnual > financialThresholdAnnual ||
    (businessMonthly > 0 && rentalAnnual > 0) ||
    (businessMonthly > 0 && totalFinancialIncomeAnnual > financialThresholdAnnual)
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
