import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  IsaTaxBreakdown,
  IsaType,
  RetireCalcFormData,
} from '../types/retireCalc'
import {
  createDividendStream,
  type ComprehensiveTaxCalculation,
  type IsaTaxCalculation,
  roundCurrency,
} from './calculator.shared'

const normalizeIsaType = (isaType: IsaType | undefined): 'general' | 'workingClass' =>
  isaType === 'workingClass' ? 'workingClass' : 'general'

const getIsaTaxFreeLimitAnnual = (isaType: 'general' | 'workingClass') =>
  isaType === 'workingClass'
    ? policyConfig.isa.workingClassTaxFreeLimit
    : policyConfig.isa.generalTaxFreeLimit

const getIsaTypeForPerson = (
  formData: RetireCalcFormData,
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

const calculateProgressiveIncomeTax = (annualTaxBase: number) => {
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

export const calculateTaxableStream = (
  annualInput: number,
  inputMode: RetireCalcFormData['dividendInputMode'],
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
  formData: RetireCalcFormData
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
