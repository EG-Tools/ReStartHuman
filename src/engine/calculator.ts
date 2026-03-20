import { policyConfig } from '../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  ComprehensiveTaxPersonBreakdown,
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
  isaType: formData.isaType ?? 'unknown',
  myIsaType: formData.myIsaType ?? formData.isaType ?? 'unknown',
  spouseIsaType: formData.spouseIsaType ?? formData.isaType ?? 'unknown',
  simulationYears: Math.max(1, sanitizeMoney(formData.simulationYears) || 10),
  homeMarketValue: sanitizeMoney(formData.homeMarketValue),
  homeOfficialValue: sanitizeMoney(formData.homeOfficialValue),
  jeonseDeposit: sanitizeMoney(formData.jeonseDeposit),
  monthlyRentDeposit: sanitizeMoney(formData.monthlyRentDeposit),
  monthlyRentAmount: sanitizeMoney(formData.monthlyRentAmount),
  monthlyMaintenanceFee: sanitizeMoney(formData.monthlyMaintenanceFee),
  taxableAccountAssets: sanitizeMoney(formData.taxableAccountAssets),
  isaAssets: sanitizeMoney(formData.isaAssets),
  pensionAccountAssets: sanitizeMoney(formData.pensionAccountAssets),
  otherAssets: sanitizeMoney(formData.otherAssets),
  taxableAccountDividendAnnual: sanitizeMoney(formData.taxableAccountDividendAnnual),
  isaDividendAnnual: sanitizeMoney(formData.isaDividendAnnual),
  pensionDividendAnnual: sanitizeMoney(formData.pensionDividendAnnual),
  isaYearsSinceOpen: sanitizeMoney(formData.isaYearsSinceOpen),
  myAnnualDividendAttributed: sanitizeMoney(formData.myAnnualDividendAttributed),
  spouseAnnualDividendAttributed: sanitizeMoney(
    formData.spouseAnnualDividendAttributed,
  ),
  myAnnualIsaDividendAttributed: sanitizeMoney(
    formData.myAnnualIsaDividendAttributed,
  ),
  spouseAnnualIsaDividendAttributed: sanitizeMoney(
    formData.spouseAnnualIsaDividendAttributed,
  ),
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
  carYearlyCost: sanitizeMoney(formData.carYearlyCost),
  otherFixedMonthly: sanitizeMoney(formData.otherFixedMonthly),
  livingCostMonthlyTotal: sanitizeMoney(formData.livingCostMonthlyTotal),
  foodMonthly: sanitizeMoney(formData.foodMonthly),
  necessitiesMonthly: sanitizeMoney(formData.necessitiesMonthly),
  diningOutMonthly: sanitizeMoney(formData.diningOutMonthly),
  hobbyMonthly: sanitizeMoney(formData.hobbyMonthly),
  otherLivingMonthly: sanitizeMoney(formData.otherLivingMonthly),
  inflationRateAnnual: clampRate(
    formData.inflationRateAnnual,
    policyConfig.inflation.defaultAnnualRate,
  ),
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

    const incomeTaxByComparison = Math.max(
      attributedDividendAnnual * policyConfig.dividendWithholding.incomeTaxRate,
      thresholdAnnual * policyConfig.dividendWithholding.incomeTaxRate +
        calculateProgressiveIncomeTax(
          attributedDividendAnnual - thresholdAnnual,
        ),
    )
    const finalTaxAnnual = roundCurrency(
      incomeTaxByComparison *
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

  const fixedExpenseMonthly =
    formData.insuranceMonthly +
    formData.maintenanceMonthly +
    formData.telecomMonthly +
    formData.nationalPensionMonthly +
    formData.otherFixedMonthly +
    carMonthlyConverted

  const livingExpenseMonthly =
    formData.livingCostInputMode === 'total'
      ? formData.livingCostMonthlyTotal
      : formData.foodMonthly +
        formData.necessitiesMonthly +
        formData.diningOutMonthly +
        formData.hobbyMonthly +
        formData.otherLivingMonthly

  const housingMonthlyCost =
    formData.housingType === 'monthlyRent'
      ? formData.monthlyRentAmount +
        (formData.maintenanceIncludedInRent ? 0 : formData.monthlyMaintenanceFee)
      : 0

  return {
    carMonthlyConverted,
    fixedExpenseMonthly: roundCurrency(fixedExpenseMonthly),
    livingExpenseMonthly: roundCurrency(livingExpenseMonthly),
    housingMonthlyCost: roundCurrency(housingMonthlyCost),
    totalExpenseMonthly: roundCurrency(
      fixedExpenseMonthly + livingExpenseMonthly + housingMonthlyCost,
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

const estimateHoldingTax = (formData: RetireCalcFormData) => {
  if (formData.housingType !== 'own') {
    return {
      annual: 0,
      monthly: 0,
    }
  }

  const ownerCount = formData.isJointOwnership
    ? policyConfig.holdingTax.jointOwnershipShareCount
    : 1
  const fairMarketRatio = getHoldingTaxFairMarketRatio(formData)
  const officialValuePerOwner = formData.homeOfficialValue / ownerCount
  const taxBasePerOwner = officialValuePerOwner * fairMarketRatio
  const useSingleHomeSpecialRate =
    formData.isSingleHomeOwner &&
    formData.homeOfficialValue <=
      policyConfig.holdingTax.singleHomeSpecialOfficialValueThreshold
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
  const annual =
    (propertyTaxMainPerOwner +
      urbanAreaTaxPerOwner +
      localEducationTaxPerOwner) *
    ownerCount

  return {
    annual: roundCurrency(Math.max(annual, 0)),
    monthly: toMonthly(Math.max(annual, 0)),
  }
}

const getRegionalPropertyBase = (formData: RetireCalcFormData) => {
  if (formData.housingType === 'own') {
    return formData.homeOfficialValue
  }

  if (formData.housingType === 'jeonse') {
    return formData.jeonseDeposit * policyConfig.healthInsurance.leaseValueRatio
  }

  return (
    formData.monthlyRentDeposit * policyConfig.healthInsurance.leaseValueRatio
  )
}

const estimateHealthInsurance = (
  formData: RetireCalcFormData,
  totalDividendMonthlyNet: number,
  otherIncomeMonthly: number,
  pensionMonthly: number,
) => {
  const annualNonSalaryIncome =
    totalDividendMonthlyNet * 12 + otherIncomeMonthly * 12 + pensionMonthly * 12

  const employeeMonthlyBasePremium =
    formData.salaryMonthly *
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

const calculateTenYearProjection = (
  formData: RetireCalcFormData,
  totalIncomeMonthly: number,
  totalExpenseMonthly: number,
  healthInsuranceMonthly: number,
  holdingTaxMonthly: number,
  comprehensiveTaxImpactAnnual: number,
) => {
  if (!formData.inflationEnabled) {
    const monthlySurplus =
      totalIncomeMonthly -
      totalExpenseMonthly -
      healthInsuranceMonthly -
      holdingTaxMonthly -
      comprehensiveTaxImpactAnnual / 12

    return roundCurrency(monthlySurplus * 12 * formData.simulationYears)
  }

  let cumulative = 0

  for (let yearIndex = 0; yearIndex < formData.simulationYears; yearIndex += 1) {
    const inflationMultiplier = (1 + formData.inflationRateAnnual) ** yearIndex
    const projectedExpenses = totalExpenseMonthly * inflationMultiplier
    const projectedRequired = healthInsuranceMonthly + holdingTaxMonthly
    const projectedMonthlySurplus =
      totalIncomeMonthly -
      projectedExpenses -
      projectedRequired -
      comprehensiveTaxImpactAnnual / 12

    cumulative += projectedMonthlySurplus * 12
  }

  return roundCurrency(cumulative)
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
  const pensionMonthlyApplied = formData.hasPensionIncome
    ? formData.pensionMonthlyAmount
    : 0
  const otherIncomeMonthlyApplied =
    formData.otherIncomeType === 'none' ? 0 : formData.otherIncomeMonthly
  const estimatedHealthInsurance = estimateHealthInsurance(
    formData,
    totalDividend.monthlyNet,
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
  const tenYearSurplusOrDeficit = calculateTenYearProjection(
    formData,
    totalIncomeMonthly,
    expenses.totalExpenseMonthly,
    healthInsuranceMonthly,
    holdingTax.monthly,
    comprehensiveTax.impactAnnual,
  )

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
    riskLevel:
      monthlySurplusOrDeficit > 0
        ? 'surplus'
        : monthlySurplusOrDeficit < 0
          ? 'deficit'
          : 'neutral',
    loanNotice: formData.hasLoan,
  }
}



