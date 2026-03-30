import type {
  AccountOwnershipBreakdown,
  CashBalancePoint,
  ComprehensiveTaxPersonBreakdown,
  HoldingTaxBreakdownItem,
  IsaTaxBreakdown,
} from '../types/alpha'

export interface DividendStream {
  annualGross: number
  annualNet: number
  monthlyGross: number
  monthlyNet: number
}

export interface IsaTaxCalculation {
  stream: DividendStream
  taxAnnual: number
  taxFreeLimitApplied: number
  breakdown: IsaTaxBreakdown[]
}

export interface ComprehensiveTaxCalculation {
  included: boolean
  impactAnnual: number
  baseAnnual: number
  thresholdAnnual: number
  breakdown: ComprehensiveTaxPersonBreakdown[]
}

export interface CashProjection {
  cumulativeNetChange: number
  endingBalance: number
  timeline: CashBalancePoint[]
  cumulativeHealthInsurance: number
  cumulativePensionIncome: number
  cumulativeOtherIncome: number
  cumulativeTotalIncome: number
  cumulativeUsableCash: number
  cumulativeRentalIncomeTax: number
  cumulativeEstimatedComprehensiveIncomeTax: number
  cumulativeEstimatedLocalIncomeTax: number
}

export interface HoldingTaxEstimate {
  annual: number
  monthly: number
  breakdown: HoldingTaxBreakdownItem[]
}

export const roundCurrency = (value: number) => Math.round(value)

export const sanitizeMoney = (value: number) => {
  if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
    return 0
  }

  return roundCurrency(value)
}

export const sanitizeOptionalMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }

  return sanitizeMoney(value)
}

export const clampRate = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
    return fallback
  }

  return Math.min(value, 1)
}

export const toMonthly = (annualValue: number) => roundCurrency(annualValue / 12)

export const createDividendStream = (
  annualGross: number,
  annualNet: number,
): DividendStream => ({
  annualGross: roundCurrency(annualGross),
  annualNet: roundCurrency(annualNet),
  monthlyGross: toMonthly(annualGross),
  monthlyNet: toMonthly(annualNet),
})

export const getOwnershipAllocations = ({
  householdType,
  ownershipType,
  totalAnnualInput,
  totalAnnualAllocated,
  myAttributedAnnualInput,
}: {
  householdType: 'single' | 'couple'
  ownershipType: 'mineOnly' | 'spouseOnly' | 'split'
  totalAnnualInput: number
  totalAnnualAllocated: number
  myAttributedAnnualInput: number
}): AccountOwnershipBreakdown[] => {
  if (householdType !== 'couple') {
    return [
      {
        personKey: 'mine',
        label: '본인',
        attributedAnnual: roundCurrency(totalAnnualAllocated),
      },
    ]
  }

  if (ownershipType === 'mineOnly') {
    return [
      {
        personKey: 'mine',
        label: '본인',
        attributedAnnual: roundCurrency(totalAnnualAllocated),
      },
      {
        personKey: 'spouse',
        label: '배우자',
        attributedAnnual: 0,
      },
    ]
  }

  if (ownershipType === 'spouseOnly') {
    return [
      {
        personKey: 'mine',
        label: '본인',
        attributedAnnual: 0,
      },
      {
        personKey: 'spouse',
        label: '배우자',
        attributedAnnual: roundCurrency(totalAnnualAllocated),
      },
    ]
  }

  const safeInputTotal = Math.max(totalAnnualInput, 0)
  const mineInputAnnual = Math.min(Math.max(myAttributedAnnualInput, 0), safeInputTotal)
  const mineRatio = safeInputTotal > 0 ? mineInputAnnual / safeInputTotal : 0
  const mineAllocatedAnnual = roundCurrency(totalAnnualAllocated * mineRatio)

  return [
    {
      personKey: 'mine',
      label: '본인',
      attributedAnnual: mineAllocatedAnnual,
    },
    {
      personKey: 'spouse',
      label: '배우자',
      attributedAnnual: roundCurrency(Math.max(totalAnnualAllocated - mineAllocatedAnnual, 0)),
    },
  ]
}

export const getMineAttributedPropertyValue = ({
  householdType,
  ownershipType,
  totalValue,
  myShare,
}: {
  householdType: 'single' | 'couple'
  ownershipType: 'mineOnly' | 'spouseOnly' | 'split'
  totalValue: number
  myShare: number
}) => {
  if (householdType !== 'couple' || ownershipType === 'mineOnly') {
    return roundCurrency(totalValue)
  }

  if (ownershipType === 'spouseOnly') {
    return 0
  }

  const safeShare = Math.min(Math.max(myShare, 0), 100)
  return roundCurrency(totalValue * (safeShare / 100))
}

export const getOwnerAllocatedValues = ({
  householdType,
  ownershipType,
  totalValue,
  myShare,
}: {
  householdType: 'single' | 'couple'
  ownershipType: 'mineOnly' | 'spouseOnly' | 'split'
  totalValue: number
  myShare: number
}) => {
  if (totalValue <= 0) {
    return []
  }

  if (householdType !== 'couple') {
    return [roundCurrency(totalValue)]
  }

  if (ownershipType === 'mineOnly' || ownershipType === 'spouseOnly') {
    return [roundCurrency(totalValue)]
  }

  const safeShare = Math.min(Math.max(myShare, 0), 100)
  const mineValue = roundCurrency(totalValue * (safeShare / 100))
  const spouseValue = roundCurrency(Math.max(totalValue - mineValue, 0))

  return [mineValue, spouseValue]
}