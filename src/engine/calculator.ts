import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  CashBalancePoint,
  ComprehensiveTaxPersonBreakdown,
  HoldingTaxBreakdownItem,
  IsaTaxBreakdown,
  IsaType,
  OwnershipType,
  RetireCalcFormData,
  RetireCalcResult,
} from '../types/retireCalc'

interface DividendStream {
  annualGross: number
  annualNet: number
  monthlyGross: number
  monthlyNet: number
}

interface IsaTaxCalculation {
  stream: DividendStream
  taxAnnual: number
  taxFreeLimitApplied: number
  breakdown: IsaTaxBreakdown[]
}

interface ComprehensiveTaxCalculation {
  included: boolean
  impactAnnual: number
  baseAnnual: number
  thresholdAnnual: number
  breakdown: ComprehensiveTaxPersonBreakdown[]
}

interface CashProjection {
  cumulativeNetChange: number
  endingBalance: number
  timeline: CashBalancePoint[]
}

interface HoldingTaxEstimate {
  annual: number
  monthly: number
  breakdown: HoldingTaxBreakdownItem[]
}

const roundCurrency = (value: number) => Math.round(value)

const sanitizeMoney = (value: number) => {
  if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
    return 0
  }

  return roundCurrency(value)
}

const sanitizeOptionalMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return null
  }

  return sanitizeMoney(value)
}

const clampRate = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || Number.isNaN(value) || value < 0) {
    return fallback
  }

  return Math.min(value, 1)
}

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
  healthInsuranceOverrideMonthly: sanitizeOptionalMoney(
    formData.healthInsuranceOverrideMonthly,
  ),
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
  inflationRateAnnual: clampRate(
    formData.inflationRateAnnual,
    policyConfig.inflation.defaultAnnualRate,
  ),
  startingCashReserve: sanitizeMoney(formData.startingCashReserve),
  currentAge: Math.max(1, sanitizeMoney(formData.currentAge) || 50),
})

const toMonthly = (annualValue: number) => roundCurrency(annualValue / 12)

const createDividendStream = (annualGross: number, annualNet: number): DividendStream => ({
  annualGross: roundCurrency(annualGross),
  annualNet: roundCurrency(annualNet),
  monthlyGross: toMonthly(annualGross),
  monthlyNet: toMonthly(annualNet),
})

const calculateTaxableStream = (
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

const calculateIsaTax = ({
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
    const taxAnnual = roundCurrency(
      taxableExcessAnnual * policyConfig.isa.excessTaxRate,
    )

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

  const annualGross = roundCurrency(
    breakdown.reduce((sum, item) => sum + item.attributedAnnual, 0),
  )
  const annualNet = roundCurrency(
    breakdown.reduce((sum, item) => sum + item.netAnnual, 0),
  )

  return {
    stream: createDividendStream(annualGross, annualNet),
    taxAnnual: roundCurrency(
      breakdown.reduce((sum, item) => sum + item.taxAnnual, 0),
    ),
    taxFreeLimitApplied: roundCurrency(
      breakdown.reduce((sum, item) => sum + item.taxFreeLimitAppliedAnnual, 0),
    ),
    breakdown,
  }
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

  return roundCurrency(
    normalizedTaxBase * matchedBracket.rate - matchedBracket.deduction,
  )
}

const getOwnershipAllocations = ({
  householdType,
  ownershipType,
  totalAnnualInput,
  totalAnnualAllocated,
  myAttributedAnnualInput,
}: {
  householdType: RetireCalcFormData['householdType']
  ownershipType: OwnershipType
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
  const mineInputAnnual = Math.min(
    Math.max(myAttributedAnnualInput, 0),
    safeInputTotal,
  )
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
      attributedAnnual: roundCurrency(
        Math.max(totalAnnualAllocated - mineAllocatedAnnual, 0),
      ),
    },
  ]
}

const getMineAttributedPropertyValue = ({
  householdType,
  ownershipType,
  totalValue,
  myShare,
}: {
  householdType: RetireCalcFormData['householdType']
  ownershipType: OwnershipType
  totalValue: number
  myShare: number
}) => {
  if (householdType !== 'couple') {
    return roundCurrency(totalValue)
  }

  if (ownershipType === 'mineOnly') {
    return roundCurrency(totalValue)
  }

  if (ownershipType === 'spouseOnly') {
    return 0
  }

  const safeShare = Math.min(Math.max(myShare, 0), 100)
  return roundCurrency(totalValue * (safeShare / 100))
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

const calculateComprehensiveTax = (
  ownershipBreakdown: AccountOwnershipBreakdown[],
): ComprehensiveTaxCalculation => {
  const thresholdAnnual =
    policyConfig.comprehensiveIncomeTax.financialIncomeThresholdAnnual
  const breakdown = ownershipBreakdown.map<ComprehensiveTaxPersonBreakdown>((allocation) => {
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
    impactAnnual: roundCurrency(
      breakdown.reduce((sum, item) => sum + item.additionalTaxAnnual, 0),
    ),
    baseAnnual: roundCurrency(
      ownershipBreakdown.reduce((sum, item) => sum + item.attributedAnnual, 0),
    ),
    thresholdAnnual,
    breakdown,
  }
}

const calculateExpenses = (formData: RetireCalcFormData) => {
  const carMonthlyConverted = roundCurrency(formData.carYearlyCost / 12)
  const loanInterestMonthly = formData.loanInterestMonthly

  const fixedMaintenanceMonthly =
    formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly

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
    formData.housingType === 'monthlyRent'
      ? formData.monthlyRentAmount +
        (formData.maintenanceIncludedInRent ? 0 : formData.monthlyMaintenanceFee)
      : 0

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

const getHoldingTaxFairMarketRatio = (formData: RetireCalcFormData) => {
  if (
    formData.isSingleHomeOwner &&
    formData.homeOfficialValue <=
      policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
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

const calculatePropertyTaxMain = (
  taxBase: number,
  useSingleHomeSpecialRate: boolean,
) => {
  const taxBrackets = useSingleHomeSpecialRate
    ? policyConfig.holdingTax.singleHomeSpecialRates
    : policyConfig.holdingTax.standardRates
  const matchedBracket =
    taxBrackets.find((bracket) => taxBase <= bracket.upperBound) ??
    taxBrackets[taxBrackets.length - 1]

  return roundCurrency(
    matchedBracket.baseTax +
      Math.max(taxBase - matchedBracket.baseStart, 0) * matchedBracket.rate,
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

    return (
      sum +
      propertyTaxMainPerOwner +
      urbanAreaTaxPerOwner +
      localEducationTaxPerOwner
    )
  }, 0)

  return {
    annual: roundCurrency(Math.max(annual, 0)),
    monthly: toMonthly(Math.max(annual, 0)),
  }
}

const getOwnerAllocatedValues = ({
  householdType,
  ownershipType,
  totalValue,
  myShare,
}: {
  householdType: RetireCalcFormData['householdType']
  ownershipType: OwnershipType
  totalValue: number
  myShare: number
}) => {
  if (totalValue <= 0) {
    return []
  }

  if (householdType !== 'couple') {
    return [roundCurrency(totalValue)]
  }

  if (ownershipType === 'mineOnly') {
    return [roundCurrency(totalValue)]
  }

  if (ownershipType === 'spouseOnly') {
    return [roundCurrency(totalValue)]
  }

  const safeShare = Math.min(Math.max(myShare, 0), 100)
  const mineValue = roundCurrency(totalValue * (safeShare / 100))
  const spouseValue = roundCurrency(Math.max(totalValue - mineValue, 0))

  return [mineValue, spouseValue]
}

const estimateHoldingTax = (formData: RetireCalcFormData): HoldingTaxEstimate => {
  const breakdown: HoldingTaxBreakdownItem[] = []

  if (formData.housingType === 'own' && formData.homeOfficialValue > 0) {
    const ownerCount = formData.isJointOwnership
      ? policyConfig.holdingTax.jointOwnershipShareCount
      : 1
    const fairMarketRatio = getHoldingTaxFairMarketRatio(formData)
    const useSingleHomeSpecialRate =
      formData.isSingleHomeOwner &&
      formData.homeOfficialValue <=
        policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
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

  const annual = roundCurrency(
    breakdown.reduce((sum, item) => sum + item.annual, 0),
  )

  return {
    annual,
    monthly: toMonthly(annual),
    breakdown,
  }
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

const estimateHealthInsurance = (
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
    Math.max(
      annualNonSalaryIncome -
        policyConfig.healthInsurance.employeeAdditionalIncomeThresholdAnnual,
      0,
    ) /
    12 *
    policyConfig.healthInsurance.employeeContributionRate *
    policyConfig.healthInsurance.employeeIncomeShareRate

  const regionalIncomePremium =
    (annualNonSalaryIncome / 12) *
    policyConfig.healthInsurance.employeeContributionRate

  const regionalPropertyBase = Math.max(
    getRegionalPropertyBase(formData) -
      policyConfig.healthInsurance.regionalPropertyDeduction,
    0,
  )

  const regionalPropertyScoreApprox =
    regionalPropertyBase /
    policyConfig.healthInsurance.regionalPropertyValuePerPointApprox

  const regionalPropertyPremium =
    regionalPropertyScoreApprox *
    policyConfig.healthInsurance.regionalContributionPerPoint

  const regionalMonthlyPremium = roundCurrency(
    regionalIncomePremium + regionalPropertyPremium,
  )

  switch (formData.healthInsuranceType) {
    case 'employee':
    case 'employeeWithDependentSpouse':
      return roundCurrency(
        employeeMonthlyBasePremium + employeeMonthlyAdditionalPremium,
      )
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

const calculateCashProjection = (
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
  const timeline: CashBalancePoint[] = [
    {
      year: 0,
      balance: roundCurrency(balance),
    },
  ]

  const fixedLoanInterestMonthly = formData.loanInterestMonthly
  const baseExpenseMonthlyWithoutLoan = Math.max(
    totalExpenseMonthly - fixedLoanInterestMonthly,
    0,
  )

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

export const calculateRetireScenario = (
  rawFormData: RetireCalcFormData,
): RetireCalcResult => {
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
  const isaResult = calculateIsaTax({
    formData,
    ownershipBreakdown: isaDividendOwnershipBreakdown,
  })
  const totalDividendAnnualGross =
    taxableDividend.annualGross +
    isaResult.stream.annualGross +
    pensionDividend.annualGross
  const totalDividendAnnualNet =
    taxableDividend.annualNet +
    isaResult.stream.annualNet +
    pensionDividend.annualNet
  const totalDividend = createDividendStream(
    totalDividendAnnualGross,
    totalDividendAnnualNet,
  )

  const comprehensiveTax = calculateComprehensiveTax(
    taxableDividendOwnershipBreakdown,
  )
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
    totalIncomeMonthly -
      healthInsuranceMonthly -
      holdingTax.monthly -
      comprehensiveTax.impactAnnual / 12,
  )
  const monthlySurplusOrDeficit = roundCurrency(
    monthlyUsableCash - expenses.totalExpenseMonthly,
  )
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
    healthInsuranceSource:
      formData.healthInsuranceOverrideMonthly === null ? 'estimated' : 'manual',
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
