import type { ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  AlphaFormData,
  AlphaResult,
} from '../../types/alpha'
import { calculateAlphaScenario } from '../../engine/calculator'
import { formatCompactCurrency, formatPercent } from '../../utils/format'

export interface ResultRow {
  category: string
  item: string
  input: ReactNode
  monthly: string
  annual: string
  tenYear: string
  note: string
  noteDetail?: string
}

const ageAssetBenchmarks = [
  { min: 0, max: 39, label: '39세 이하', averageAsset: 314_980_000 },
  { min: 40, max: 49, label: '40대', averageAsset: 627_140_000 },
  { min: 50, max: 59, label: '50대', averageAsset: 662_050_000 },
  { min: 60, max: Number.POSITIVE_INFINITY, label: '60세 이상', averageAsset: 600_950_000 },
] as const

export const getLivingCostSnapshot = (formData: AlphaFormData) => {
  const academyMonthly = formData.hasChildren ? formData.academyMonthly ?? 0 : 0

  return formData.livingCostInputMode === 'total'
    ? formData.livingCostMonthlyTotal
    : formData.foodMonthly +
        formData.necessitiesMonthly +
        formData.diningOutMonthly +
        formData.hobbyMonthly +
        academyMonthly +
        formData.otherLivingMonthly
}

export const getRiskLabel = (riskLevel: AlphaResult['riskLevel']) => {
  switch (riskLevel) {
    case 'surplus':
      return '흑자'
    case 'deficit':
      return '적자'
    default:
      return '보합'
  }
}

export const getOtherIncomeTypeLabel = (incomeType: AlphaFormData['otherIncomeType']) => {
  switch (incomeType) {
    case 'earned':
      return '근로소득'
    case 'business':
      return '사업소득'
    case 'pension':
      return '기타연금'
    case 'monthlyRent':
      return '월세소득'
    case 'other':
      return '기타소득'
    default:
      return '추가소득'
  }
}

export const getHousingTypeLabel = (housingType: AlphaFormData['housingType']) => {
  switch (housingType) {
    case 'jeonse':
      return '전세'
    case 'monthlyRent':
      return '월세'
    case 'own':
    default:
      return '자가'
  }
}

export const getIsaTypeLabel = (
  isaType: AlphaResult['isaTaxBreakdown'][number]['isaType'],
) => (isaType === 'workingClass' ? '서민형' : '일반형')

export const getAgeAssetBenchmark = (age: number) =>
  ageAssetBenchmarks.find((benchmark) => age >= benchmark.min && age <= benchmark.max) ??
  ageAssetBenchmarks[ageAssetBenchmarks.length - 1]

export const getHouseholdAssetEstimate = (formData: AlphaFormData) => {
  const housingAsset =
    formData.housingType === 'own'
      ? formData.homeMarketValue
      : formData.housingType === 'jeonse'
        ? formData.jeonseDeposit
        : formData.monthlyRentDeposit
  const additionalHomeAssets = formData.additionalHomes.reduce(
    (sum, home) => sum + Math.max(home.marketValue, home.officialValue),
    0,
  )

  return (
    housingAsset +
    additionalHomeAssets +
    formData.landValue +
    formData.otherPropertyOfficialValue +
    formData.taxableAccountAssets +
    formData.isaAssets +
    formData.pensionAccountAssets +
    formData.otherAssets +
    formData.currentCarMarketValue +
    formData.startingCashReserve
  )
}

const getAssetTierMessage = (totalAssets: number) => {
  if (totalAssets >= 10_000_000_000) {
    return '대한민국 자산 상위 0.1% 안팎의 초상위권으로 볼 수 있는 규모입니다.'
  }

  if (totalAssets >= 3_000_000_000) {
    return '대한민국 자산 상위 1% 안팎으로 볼 수 있는 규모입니다.'
  }

  if (totalAssets >= 1_000_000_000) {
    return '대한민국 자산 상위 10% 안팎으로 볼 수 있는 규모입니다.'
  }

  if (totalAssets >= 300_000_000) {
    return '대한민국 자산 중위권 이상으로 볼 수 있는 규모입니다.'
  }

  return '대한민국 자산 하위권 또는 자산 형성 초기 구간으로 볼 수 있는 규모입니다.'
}

export const getAssetInterpretationMessage = ({
  benchmarkLabel,
  benchmarkAverageAsset,
  totalAssets,
  dividendAnnual,
}: {
  benchmarkLabel: string
  benchmarkAverageAsset: number
  totalAssets: number
  dividendAnnual: number
}) => {
  const assetMultiple = benchmarkAverageAsset > 0 ? totalAssets / benchmarkAverageAsset : 0
  const roundedAssetMultiple = Math.round(assetMultiple * 10) / 10
  const dividendToAssetRatio =
    totalAssets > 0 ? dividendAnnual / totalAssets : dividendAnnual > 0 ? Number.POSITIVE_INFINITY : 0
  const hasAssetIncomeMismatch = dividendAnnual > 0 && dividendToAssetRatio >= 0.15

  if (hasAssetIncomeMismatch) {
    return `${benchmarkLabel} 나이 기준 추정자산 ${formatCompactCurrency(totalAssets)}입니다. 다만 연 배당금 ${formatCompactCurrency(dividendAnnual)}이 입력 자산 대비 매우 큰 사례라 자산 서열 문구는 보수적으로 해석하는 편이 좋습니다.`
  }

  return `${benchmarkLabel} 나이 기준 추정자산 ${formatCompactCurrency(totalAssets)}입니다. ${benchmarkLabel} 평균 자산 ${formatCompactCurrency(benchmarkAverageAsset)} 대비 약 ${roundedAssetMultiple}배이며, ${getAssetTierMessage(totalAssets)}`
}

export const getHealthInsuranceTypeSummary = (
  healthInsuranceType: AlphaFormData['healthInsuranceType'],
) => {
  switch (healthInsuranceType) {
    case 'employee':
    case 'employeeWithDependentSpouse':
      return '직장가입자 기준'
    case 'dependent':
      return '피부양자 기준'
    case 'regional':
    case 'bothRegional':
      return '지역가입자 기준'
    default:
      return '입력한 건강보험 상태 기준'
  }
}



const getIncomeInterpretationMessage = (result: AlphaResult) => {
  const visibleIncomeItems = result.incomeBreakdown.filter(
    (item) => item.inputMonthly > 0 || item.appliedMonthly > 0,
  )

  if (visibleIncomeItems.length === 0) {
    return '?? ???? ?? ??? ?? ???? ?????.'
  }

  const currentIncomeItems = visibleIncomeItems.filter((item) => item.appliedMonthly > 0)
  const deferredIncomeItems = visibleIncomeItems.filter(
    (item) => item.appliedMonthly <= 0 && typeof item.startAge === 'number',
  )
  const currentIncomeSummary = currentIncomeItems
    .map((item) => `${item.label} ${formatCompactCurrency(item.appliedMonthly)}`)
    .join(', ')
  const deferredIncomeSummary = deferredIncomeItems
    .map((item) => `${item.label} ${formatCompactCurrency(item.inputMonthly)}? ${item.startAge}??? ?????.`)
    .join(' ')
  const rentalIncomeItem = visibleIncomeItems.find((item) => item.key === 'rental')
  const rentalTaxMessage =
    rentalIncomeItem && result.rentalIncomeTaxAnnual > 0
      ? ` ????? ? ${formatCompactCurrency(result.rentalIncomeTaxAnnual)}? ??? ??????.`
      : ''

  if (currentIncomeSummary && deferredIncomeSummary) {
    return `${currentIncomeSummary}? ??? ?? ? ???? ??????.${rentalTaxMessage} ${deferredIncomeSummary}`.trim()
  }

  if (currentIncomeSummary) {
    return `${currentIncomeSummary}? ??? ?? ? ???? ??????.${rentalTaxMessage}`.trim()
  }

  return deferredIncomeSummary
}

export type DeficitAdviceItem = {
  id: string
  message: string
  actionLabel?: string
  patch?: Partial<AlphaFormData>
}

type AdviceCandidate = DeficitAdviceItem & {
  monthlyImprovement: number
  endingImprovement: number
  resolvesDeficit: boolean
}

const statsKoreaLivingCostBenchmarks = {
  single: {
    averageMonthlyConsumption: 1_800_000,
    label: '\u0031\uC778 \uAC00\uAD6C',
  },
  couple: {
    averageMonthlyConsumption: 2_900_000,
    label: '\u0032\uC778 \uAC00\uAD6C',
  },
} as const

const MAX_ADVICE_CACHE_SIZE = 24
const deficitAdviceCache = new Map<string, DeficitAdviceItem[]>()

const isDeficitLike = (result: AlphaResult) =>
  result.monthlySurplusOrDeficit < 0 || result.cashBalanceAfterTenYears < 0

const getScenarioImprovement = (before: AlphaResult, after: AlphaResult) => ({
  monthlyImprovement: after.monthlySurplusOrDeficit - before.monthlySurplusOrDeficit,
  endingImprovement: after.cashBalanceAfterTenYears - before.cashBalanceAfterTenYears,
})

const improvesEnough = (before: AlphaResult, after: AlphaResult) => {
  const { monthlyImprovement, endingImprovement } = getScenarioImprovement(before, after)

  return monthlyImprovement > 0 || endingImprovement > 0
}

const resolvesDeficit = (result: AlphaResult) =>
  result.monthlySurplusOrDeficit >= 0 && result.cashBalanceAfterTenYears >= 0

const rankAdviceCandidate = (candidate: AdviceCandidate) =>
  (candidate.resolvesDeficit ? 10_000_000_000 : 0) +
  candidate.endingImprovement +
  candidate.monthlyImprovement * 10_000

const pickBestAdviceCandidate = (candidates: AdviceCandidate[]) =>
  [...candidates].sort((left, right) => rankAdviceCandidate(right) - rankAdviceCandidate(left))[0] ?? null

const getCachedDeficitAdviceItems = (cacheKey: string) => {
  const cachedValue = deficitAdviceCache.get(cacheKey)

  if (!cachedValue) {
    return null
  }

  deficitAdviceCache.delete(cacheKey)
  deficitAdviceCache.set(cacheKey, cachedValue)
  return cachedValue
}

const setCachedDeficitAdviceItems = (cacheKey: string, items: DeficitAdviceItem[]) => {
  deficitAdviceCache.set(cacheKey, items)

  if (deficitAdviceCache.size <= MAX_ADVICE_CACHE_SIZE) {
    return
  }

  const oldestKey = deficitAdviceCache.keys().next().value

  if (oldestKey) {
    deficitAdviceCache.delete(oldestKey)
  }
}

const buildFormDataPatch = (current: AlphaFormData, next: AlphaFormData): Partial<AlphaFormData> => {
  const patch: Partial<AlphaFormData> = {}

  for (const key of Object.keys(next) as Array<keyof AlphaFormData>) {
    if (Object.is(current[key], next[key])) {
      continue
    }

    ;(patch as Record<string, unknown>)[key] = next[key]
  }

  return patch
}

const createAdviceCandidate = ({
  id,
  message,
  actionLabel,
  beforeResult,
  currentFormData,
  afterFormData,
  afterResult,
}: {
  id: string
  message: string
  actionLabel?: string
  beforeResult: AlphaResult
  currentFormData: AlphaFormData
  afterFormData: AlphaFormData
  afterResult: AlphaResult
}): AdviceCandidate | null => {
  if (!improvesEnough(beforeResult, afterResult)) {
    return null
  }

  const patch = buildFormDataPatch(currentFormData, afterFormData)

  if (Object.keys(patch).length === 0) {
    return null
  }

  const { monthlyImprovement, endingImprovement } = getScenarioImprovement(beforeResult, afterResult)

  return {
    id,
    message,
    actionLabel,
    patch,
    monthlyImprovement,
    endingImprovement,
    resolvesDeficit: resolvesDeficit(afterResult),
  }
}

const buildReducedLivingCostFormData = (
  formData: AlphaFormData,
  reductionMonthly: number,
): AlphaFormData => {
  if (reductionMonthly <= 0) {
    return formData
  }

  if (formData.livingCostInputMode === 'total') {
    return {
      ...formData,
      livingCostMonthlyTotal: Math.max(0, formData.livingCostMonthlyTotal - reductionMonthly),
    }
  }

  let remaining = reductionMonthly
  const nextFormData: AlphaFormData = { ...formData }
  const reduceKeys: Array<
    'otherLivingMonthly' | 'hobbyMonthly' | 'diningOutMonthly' | 'necessitiesMonthly' | 'foodMonthly' | 'academyMonthly'
  > = [
    'otherLivingMonthly',
    'hobbyMonthly',
    'diningOutMonthly',
    'necessitiesMonthly',
    'foodMonthly',
    'academyMonthly',
  ]

  for (const key of reduceKeys) {
    if (remaining <= 0) {
      break
    }

    const currentValue = nextFormData[key] ?? 0

    if (currentValue <= 0) {
      continue
    }

    const amountToReduce = Math.min(currentValue, remaining)
    nextFormData[key] = currentValue - amountToReduce
    remaining -= amountToReduce
  }

  return nextFormData
}

const buildDividendBoostFormData = (
  formData: AlphaFormData,
  additionalDividendMonthly: number,
): AlphaFormData => {
  const additionalDividendAnnual = additionalDividendMonthly * 12
  const nextFormData: AlphaFormData = {
    ...formData,
    taxableAccountDividendAnnual: formData.taxableAccountDividendAnnual + additionalDividendAnnual,
  }

  if (formData.dividendOwnershipType === 'split' && formData.householdType === 'couple') {
    const totalAttributedAnnual =
      formData.myAnnualDividendAttributed + formData.spouseAnnualDividendAttributed
    const myShare =
      totalAttributedAnnual > 0 ? formData.myAnnualDividendAttributed / totalAttributedAnnual : 0.5

    nextFormData.myAnnualDividendAttributed = Math.round(
      formData.myAnnualDividendAttributed + additionalDividendAnnual * myShare,
    )
    nextFormData.spouseAnnualDividendAttributed = Math.round(
      formData.spouseAnnualDividendAttributed + additionalDividendAnnual * (1 - myShare),
    )
  }

  return nextFormData
}

const buildJeonseShiftFormData = (formData: AlphaFormData): AlphaFormData => {
  const inferredJeonseDeposit =
    formData.jeonseDeposit > 0
      ? formData.jeonseDeposit
      : Math.round(
          Math.max(
            formData.homeOfficialValue,
            formData.homeMarketValue > 0 ? formData.homeMarketValue * 0.55 : 0,
          ),
        )
  const currentHomeValue =
    formData.homeMarketValue > 0 ? formData.homeMarketValue : formData.homeOfficialValue
  const releasedHousingCash = Math.max(0, currentHomeValue - inferredJeonseDeposit)

  return {
    ...formData,
    housingType: 'jeonse',
    jeonseDeposit: inferredJeonseDeposit,
    startingCashReserve: formData.startingCashReserve + releasedHousingCash,
    homeMarketValue: 0,
    homeOfficialValue: 0,
    monthlyRentDeposit: 0,
    monthlyRentAmount: 0,
  }
}

const buildLoanFreeFormData = (formData: AlphaFormData): AlphaFormData => ({
  ...formData,
  hasLoan: false,
  loanInterestMonthly: 0,
  loanInterestYears: 0,
})

const buildCarCostCutFormData = (formData: AlphaFormData): AlphaFormData => ({
  ...formData,
  carYearlyCost: 0,
})

const ADVICE_FINE_STEP = 100_000
const ADVICE_COARSE_STEP = 500_000

const pickBetterAdviceCandidate = (
  current: AdviceCandidate | null,
  next: AdviceCandidate | null,
) =>
  pickBestAdviceCandidate(
    [current, next].filter((candidate): candidate is AdviceCandidate => candidate !== null),
  )

const normalizeAdviceCeiling = (maxAmount: number) =>
  Math.floor(maxAmount / ADVICE_FINE_STEP) * ADVICE_FINE_STEP

// Probe the heavy advice scenarios in coarse chunks first, then refine only the best window.
const buildSteppedAdviceCandidate = ({
  maxAmount,
  evaluateCandidate,
}: {
  maxAmount: number
  evaluateCandidate: (amount: number) => AdviceCandidate | null
}) => {
  const normalizedMaxAmount = normalizeAdviceCeiling(maxAmount)

  if (normalizedMaxAmount < ADVICE_FINE_STEP) {
    return null
  }

  const coarseAmounts = new Set<number>([ADVICE_FINE_STEP, normalizedMaxAmount])

  for (
    let amount = ADVICE_COARSE_STEP;
    amount <= normalizedMaxAmount;
    amount += ADVICE_COARSE_STEP
  ) {
    coarseAmounts.add(amount)
  }

  const sortedAmounts = [...coarseAmounts].sort((left, right) => left - right)
  const probeCache = new Map<number, AdviceCandidate | null>()
  const getCandidate = (amount: number) => {
    if (probeCache.has(amount)) {
      return probeCache.get(amount) ?? null
    }

    const candidate = evaluateCandidate(amount)
    probeCache.set(amount, candidate)
    return candidate
  }
  let bestCoarseCandidate: AdviceCandidate | null = null
  let bestCoarseFloor = 0
  let bestCoarseAmount = 0
  let previousCoarseAmount = 0

  for (const amount of sortedAmounts) {
    const candidate = getCandidate(amount)

    if (
      candidate &&
      (!bestCoarseCandidate ||
        rankAdviceCandidate(candidate) > rankAdviceCandidate(bestCoarseCandidate))
    ) {
      bestCoarseCandidate = candidate
      bestCoarseFloor = previousCoarseAmount
      bestCoarseAmount = amount
    }

    if (candidate?.resolvesDeficit) {
      const fineStart = Math.max(ADVICE_FINE_STEP, previousCoarseAmount + ADVICE_FINE_STEP)

      for (let fineAmount = fineStart; fineAmount <= amount; fineAmount += ADVICE_FINE_STEP) {
        const fineCandidate = getCandidate(fineAmount)

        if (fineCandidate?.resolvesDeficit) {
          return fineCandidate
        }
      }

      return candidate
    }

    previousCoarseAmount = amount
  }

  if (!bestCoarseCandidate) {
    return null
  }

  let bestFineCandidate = bestCoarseCandidate
  const fineStart = Math.max(ADVICE_FINE_STEP, bestCoarseFloor + ADVICE_FINE_STEP)

  for (let amount = fineStart; amount <= bestCoarseAmount; amount += ADVICE_FINE_STEP) {
    bestFineCandidate = pickBetterAdviceCandidate(bestFineCandidate, getCandidate(amount))
  }

  return bestFineCandidate
}

const findLivingCostAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  const currentLivingCost = getLivingCostSnapshot(formData)

  if (currentLivingCost <= 0) {
    return null
  }

  const benchmark = statsKoreaLivingCostBenchmarks[formData.householdType]
  const maxReduction = Math.min(currentLivingCost, 2_000_000)

  return buildSteppedAdviceCandidate({
    maxAmount: maxReduction,
    evaluateCandidate: (reductionMonthly) => {
      const nextFormData = buildReducedLivingCostFormData(formData, reductionMonthly)
      const nextResult = calculateAlphaScenario(nextFormData)

      if (!improvesEnough(result, nextResult)) {
        return null
      }

      const nextLivingCost = getLivingCostSnapshot(nextFormData)
      const statsNote =
        currentLivingCost > benchmark.averageMonthlyConsumption * 1.05
          ? ` \uD1B5\uACC4\uCCAD \uAC00\uAD6C\uB3D9\uD5A5\uC870\uC0AC \uCC38\uACE0\uCE58\uB85C\uB294 ${benchmark.label} \uC6D4\uD3C9\uADE0 \uC18C\uBE44\uC9C0\uCD9C ${formatCompactCurrency(benchmark.averageMonthlyConsumption)} \uC548\uD30E\uC785\uB2C8\uB2E4.`
          : ''
      const message = resolvesDeficit(nextResult)
        ? `\uC6D4 \uC0DD\uD65C\uBE44\uB97C ${formatCompactCurrency(currentLivingCost)}\uC5D0\uC11C ${formatCompactCurrency(nextLivingCost)}\uB85C \uB0AE\uCD94\uBA74 ${formData.simulationYears}\uB144 \uD6C4 \uD604\uAE08\uC794\uC561\uC774 \uB9C8\uC774\uB108\uC2A4\uB85C \uB0B4\uB824\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.${statsNote}`
        : `\uC6D4 \uC0DD\uD65C\uBE44\uB97C ${formatCompactCurrency(currentLivingCost)}\uC5D0\uC11C ${formatCompactCurrency(nextLivingCost)}\uB85C \uB0AE\uCD94\uBA74 \uC6D4 \uC801\uC790 \uD3ED\uC774 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} \uAC1C\uC120\uB429\uB2C8\uB2E4.${statsNote}`

      return createAdviceCandidate({
        id: `living-cost-${reductionMonthly}`,
        message,
        actionLabel: '\uC0DD\uD65C\uBE44 \uC801\uC6A9',
        beforeResult: result,
        currentFormData: formData,
        afterFormData: nextFormData,
        afterResult: nextResult,
      })
    },
  })
}

const findDividendAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  return buildSteppedAdviceCandidate({
    maxAmount: 3_000_000,
    evaluateCandidate: (additionalDividendMonthly) => {
      const nextFormData = buildDividendBoostFormData(formData, additionalDividendMonthly)
      const nextResult = calculateAlphaScenario(nextFormData)

      if (!improvesEnough(result, nextResult)) {
        return null
      }

      const message = resolvesDeficit(nextResult)
        ? `\uC6D4 \uBC30\uB2F9\uAE08 \uAE30\uC900\uC73C\uB85C ${formatCompactCurrency(additionalDividendMonthly)}\uB97C \uB354 \uD655\uBCF4\uD558\uBA74 ${formData.simulationYears}\uB144 \uD6C4 \uD604\uAE08\uC794\uC561\uC774 \uB9C8\uC774\uB108\uC2A4\uB85C \uB0B4\uB824\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
        : `\uC6D4 \uBC30\uB2F9\uAE08 \uAE30\uC900\uC73C\uB85C ${formatCompactCurrency(additionalDividendMonthly)}\uB97C \uB354 \uD655\uBCF4\uD558\uBA74 \uC6D4 \uC801\uC790 \uD3ED\uC774 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} \uAC1C\uC120\uB429\uB2C8\uB2E4.`

      return createAdviceCandidate({
        id: `dividend-${additionalDividendMonthly}`,
        message,
        actionLabel: '\uBC30\uB2F9 \uC801\uC6A9',
        beforeResult: result,
        currentFormData: formData,
        afterFormData: nextFormData,
        afterResult: nextResult,
      })
    },
  })
}

const findJeonseAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  if (
    formData.housingType !== 'own' ||
    (formData.homeMarketValue <= 0 && formData.homeOfficialValue <= 0)
  ) {
    return null
  }

  const nextFormData = buildJeonseShiftFormData(formData)
  const nextResult = calculateAlphaScenario(nextFormData)
  const releasedHousingCash = Math.max(
    0,
    nextFormData.startingCashReserve - formData.startingCashReserve,
  )
  const releasedHousingCashMessage =
    releasedHousingCash > 0
      ? ` \uD604\uC7AC \uBCF4\uC720 \uD604\uAE08\uC744 +${formatCompactCurrency(releasedHousingCash)} \uD655\uBCF4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`
      : ''

  if (!improvesEnough(result, nextResult)) {
    return null
  }

  return createAdviceCandidate({
    id: 'jeonse-shift',
    message: resolvesDeficit(nextResult)
      ? `\uC790\uAC00 \uB300\uC2E0 \uC804\uC138 \uC2DC\uB098\uB9AC\uC624\uB85C \uBC14\uAFB8\uBA74${releasedHousingCashMessage} \uBCF4\uC720\uC138\uC640 \uAC74\uAC15\uBCF4\uD5D8\uB8CC \uBD80\uB2F4\uC774 \uC904\uC5B4 ${formData.simulationYears}\uB144 \uD6C4 \uD604\uAE08\uC794\uC561\uC774 \uB9C8\uC774\uB108\uC2A4\uB85C \uB0B4\uB824\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
      : `\uC790\uAC00 \uB300\uC2E0 \uC804\uC138 \uC2DC\uB098\uB9AC\uC624\uB85C \uBC14\uAFC0\uBA74${releasedHousingCashMessage} \uC6D4 \uC801\uC790 \uD3ED\uC774 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} \uAC1C\uC120\uB429\uB2C8\uB2E4.`,
    actionLabel: '\uC804\uC138 \uC801\uC6A9',
    beforeResult: result,
    currentFormData: formData,
    afterFormData: nextFormData,
    afterResult: nextResult,
  })
}

const findLoanAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  if (formData.loanInterestMonthly <= 0) {
    return null
  }

  const nextFormData = buildLoanFreeFormData(formData)
  const nextResult = calculateAlphaScenario(nextFormData)

  if (!improvesEnough(result, nextResult)) {
    return null
  }

  return createAdviceCandidate({
    id: 'loan-interest',
    message: resolvesDeficit(nextResult)
      ? `\uC6D4 \uB300\uCD9C\uC774\uC790 ${formatCompactCurrency(formData.loanInterestMonthly)} \uBD80\uB2F4\uC744 \uC5C6\uC560\uBA74 ${formData.simulationYears}\uB144 \uD6C4 \uD604\uAE08\uC794\uC561\uC774 \uB9C8\uC774\uB108\uC2A4\uB85C \uB0B4\uB824\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
      : `\uC6D4 \uB300\uCD9C\uC774\uC790 ${formatCompactCurrency(formData.loanInterestMonthly)} \uBD80\uB2F4\uC744 \uC5C6\uC560\uBA74 \uC6D4 \uC801\uC790 \uD3ED\uC774 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} \uAC1C\uC120\uB429\uB2C8\uB2E4.`,
    actionLabel: '\uC774\uC790 \uC801\uC6A9',
    beforeResult: result,
    currentFormData: formData,
    afterFormData: nextFormData,
    afterResult: nextResult,
  })
}

const findCarCostAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  if (formData.carYearlyCost <= 0) {
    return null
  }

  const nextFormData = buildCarCostCutFormData(formData)
  const nextResult = calculateAlphaScenario(nextFormData)

  if (!improvesEnough(result, nextResult)) {
    return null
  }

  return createAdviceCandidate({
    id: 'car-cost',
    message: resolvesDeficit(nextResult)
      ? `\uC5F0 \uCC28\uB7C9 \uC720\uC9C0\uBE44 ${formatCompactCurrency(formData.carYearlyCost)}\uB97C 0\uC6D0\uC73C\uB85C \uC904\uC774\uBA74 ${formData.simulationYears}\uB144 \uD6C4 \uD604\uAE08\uC794\uC561\uC774 \uB9C8\uC774\uB108\uC2A4\uB85C \uB0B4\uB824\uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`
      : `\uC5F0 \uCC28\uB7C9 \uC720\uC9C0\uBE44 ${formatCompactCurrency(formData.carYearlyCost)}\uB97C 0\uC6D0\uC73C\uB85C \uC904\uC774\uBA74 \uC6D4 \uC801\uC790 \uD3ED\uC774 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} \uAC1C\uC120\uB429\uB2C8\uB2E4.`,
    actionLabel: '\uCC28\uB7C9\uBE44 \uC801\uC6A9',
    beforeResult: result,
    currentFormData: formData,
    afterFormData: nextFormData,
    afterResult: nextResult,
  })
}

const buildHealthInsuranceAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): string | null => {
  if (result.healthInsuranceMonthly <= 0 || result.totalIncomeMonthly <= 0) {
    return null
  }

  const healthInsuranceShare = result.healthInsuranceMonthly / result.totalIncomeMonthly

  if (result.healthInsuranceMonthly < 250_000 && healthInsuranceShare < 0.12) {
    return null
  }

  return `\uAC74\uAC15\uBCF4\uD5D8\uB8CC\uB294 \uC6D4 ${formatCompactCurrency(result.healthInsuranceMonthly)}\uB85C \uD604\uC7AC \uC6D4 \uC720\uC785\uC758 ${formatPercent(healthInsuranceShare)} \uC218\uC900\uC785\uB2C8\uB2E4. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}\uC73C\uB85C \uACC4\uC0B0\uB410\uC73C\uB2C8 \uAC74\uAC15\uBCF4\uD5D8 \uC720\uD615, \uCD94\uAC00\uC18C\uB4DD, \uBD80\uB3D9\uC0B0 \uC785\uB825\uC744 \uB2E4\uC2DC \uD655\uC778\uD574\uBCF4\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4.`
}

const buildActionAdviceItems = (formData: AlphaFormData, result: AlphaResult): DeficitAdviceItem[] => {
  if (!isDeficitLike(result)) {
    return []
  }

  const scenarioCandidates = [
    findLivingCostAdvice(formData, result),
    findDividendAdvice(formData, result),
    findJeonseAdvice(formData, result),
    findLoanAdvice(formData, result),
    findCarCostAdvice(formData, result),
  ].filter((candidate): candidate is AdviceCandidate => candidate !== null)

  const actionAdvice: DeficitAdviceItem[] = scenarioCandidates
    .sort((left, right) => rankAdviceCandidate(right) - rankAdviceCandidate(left))
    .slice(0, 2)
    .map(({ id, message, actionLabel, patch }) => ({ id, message, actionLabel, patch }))

  const healthInsuranceAdvice = buildHealthInsuranceAdvice(formData, result)

  if (healthInsuranceAdvice && actionAdvice.length < 3) {
    actionAdvice.push({
      id: 'health-insurance-review',
      message: healthInsuranceAdvice,
    })
  }

  if (actionAdvice.length > 0) {
    return actionAdvice
  }

  return [
    {
      id: 'broad-review',
      message:
        '\uD604\uC7AC \uC785\uB825\uAC12\uC5D0\uC11C\uB294 \uD55C \uAC00\uC9C0 \uC870\uC815\uB9CC\uC73C\uB85C \uC801\uC790\uB97C \uD574\uC18C\uD558\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uC0DD\uD65C\uBE44, \uC8FC\uAC70\uD615\uD0DC, \uBC30\uB2F9\uAE08, \uCD94\uAC00\uC18C\uB4DD\uC744 \uD568\uAED8 \uC870\uC815\uD574\uBCF4\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4.',
    },
  ]
}

export const buildDeficitAdviceItems = (formData: AlphaFormData, result: AlphaResult) => {
  const cacheKey = JSON.stringify([
    formData,
    result.monthlySurplusOrDeficit,
    result.cashBalanceAfterTenYears,
    result.healthInsuranceMonthly,
    result.totalIncomeMonthly,
  ])
  const cachedItems = getCachedDeficitAdviceItems(cacheKey)

  if (cachedItems) {
    return cachedItems
  }

  const nextItems = buildActionAdviceItems(formData, result)
  setCachedDeficitAdviceItems(cacheKey, nextItems)
  return nextItems
}

export const buildInterpretationItems = ({
  assetInterpretation,
  effectiveComprehensiveRate,
  formData,
  result,
}: {
  assetInterpretation: string
  effectiveComprehensiveRate: number
  formData: AlphaFormData
  result: AlphaResult
}) => {
  return [
    result.holdingTaxAnnual >= 10_000_000
      ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. ${getHoldingTaxBreakdownSummary(result)}이 반영됐고, ${getHoldingTaxBaseSummary(result)} 기준으로 부담이 큰 구간에 들어갈 수 있습니다.`
      : result.holdingTaxAnnual > 0
        ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. ${getHoldingTaxBreakdownSummary(result)}이 반영됐고, ${getHoldingTaxBaseSummary(result)} 기준으로 추정했습니다.`
        : '보유세는 현재 납부 대상이 아닌 것으로 계산했습니다.',
    result.comprehensiveTaxIncluded
      ? result.comprehensiveTaxImpactAnnual > 0
        ? `종합소득세는 금융소득 2,000만원 초과 구간입니다. 추가 세 부담은 약 ${effectiveComprehensiveRate}% 수준으로 반영했습니다.`
        : `종합소득세는 금융소득 2,000만원 초과 구간이지만 ${getComprehensiveTaxZeroReason(result)} 추가 세 부담은 0원입니다.`
      : '금융소득 2,000만원 이하로 보고 종합소득세 추가 부담은 제외했습니다.',
    result.healthInsuranceMonthly >= 1_000_000
      ? `?????? ? ${formatCompactCurrency(result.healthInsuranceMonthly)} ?????. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}?? ?? ? ??? ?? ???? ?? ??? ?????.`
      : `?????? ? ${formatCompactCurrency(result.healthInsuranceMonthly)} ?????. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}?? ??????.`,
    getIncomeInterpretationMessage(result),
    assetInterpretation,
  ]
}

export const getPropertyOwnershipLabel = (ownershipType: string) => {
  switch (ownershipType) {
    case 'mineOnly':
      return '본인'
    case 'spouseOnly':
      return '배우자'
    case 'split':
      return '공동명의'
    default:
      return '본인'
  }
}

const formatOwnershipSummary = (breakdown: AccountOwnershipBreakdown[]) =>
  breakdown.map((item) => `${item.label} ${formatCompactCurrency(item.attributedAnnual)}`).join(', ')

const formatIsaOwnershipSummary = (breakdown: AlphaResult['isaTaxBreakdown']) => {
  const activeBreakdown = breakdown.filter((item) => item.attributedAnnual > 0)

  if (activeBreakdown.length === 0) {
    return '없음'
  }

  return activeBreakdown
    .map(
      (item) =>
        `${item.label} ${getIsaTypeLabel(item.isaType)} ${formatCompactCurrency(item.attributedAnnual)}`,
    )
    .join(', ')
}

const formatIsaLimitSummary = (breakdown: AlphaResult['isaTaxBreakdown']) => {
  const activeBreakdown = breakdown.filter((item) => item.attributedAnnual > 0)

  if (activeBreakdown.length === 0) {
    return '해당 없음'
  }

  return activeBreakdown
    .map(
      (item) =>
        `${item.label} ${getIsaTypeLabel(item.isaType)} 한도 ${formatCompactCurrency(item.taxFreeLimitAnnual)}`,
    )
    .join(', ')
}

export const getHoldingTaxBreakdownSummary = (result: AlphaResult) => {
  const activeBreakdown = result.holdingTaxBreakdown.filter((item) => item.annual > 0)

  if (activeBreakdown.length === 0) {
    return '해당 없음'
  }

  return activeBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.annual)}`)
    .join(', ')
}

export const getHoldingTaxInputSummary = (result: AlphaResult) => {
  const activeLabels = result.holdingTaxBreakdown
    .filter((item) => item.annual > 0)
    .map((item) => item.label)

  if (activeLabels.length === 0) {
    return '해당 없음'
  }

  const otherPropertyIndex = activeLabels.findIndex((label) =>
    label.includes('기타부동산') || label.includes('기타 부동산'),
  )

  if (otherPropertyIndex <= 0) {
    return activeLabels.join(' · ')
  }

  return `${activeLabels.slice(0, otherPropertyIndex).join(' · ')}\n${activeLabels.slice(otherPropertyIndex).join(' · ')}`
}

export const getHoldingTaxBaseSummary = (result: AlphaResult) => {
  const activeBreakdown = result.holdingTaxBreakdown.filter((item) => item.baseValue > 0)

  if (activeBreakdown.length === 0) {
    return '해당 자산 없음'
  }

  return activeBreakdown
    .map((item) => `${item.label} 기준가 ${formatCompactCurrency(item.baseValue)}`)
    .join(', ')
}

export const getTaxableDividendNote = (result: AlphaResult) => {
  const baseNote = `${policyConfig.dividendWithholding.note} 반영`
  const ownershipSummary = formatOwnershipSummary(result.taxableDividendOwnershipBreakdown)

  if (result.dividendInputMode === 'gross') {
    return `${baseNote}, 귀속: ${ownershipSummary}, 연 ${formatCompactCurrency(result.taxableDividendWithholdingAnnual)} 차감`
  }

  return `${baseNote}, 귀속: ${ownershipSummary}, 세후 입력값에서 세전 배당을 역산해 종합과세 여부를 판단`
}

export const getIsaDividendNote = (result: AlphaResult) => {
  const ownershipSummary = formatIsaOwnershipSummary(result.isaTaxBreakdown)
  const limitSummary = formatIsaLimitSummary(result.isaTaxBreakdown)
  const baseNote = `${policyConfig.isa.note} 반영`

  if (result.isaTaxAnnual === 0) {
    return `${baseNote}, 귀속: ${ownershipSummary}, ${limitSummary} 안에서 세금 없음`
  }

  return `${baseNote}, 귀속: ${ownershipSummary}, ${limitSummary} 초과분에 연 ${formatCompactCurrency(result.isaTaxAnnual)} 부과`
}

export const getComprehensiveTaxInput = (result: AlphaResult) => {
  if (!result.comprehensiveTaxIncluded) {
    return '금융소득 2,000만원 이하'
  }

  return result.comprehensiveTaxBreakdown
    .filter((item) => item.exceedsThreshold)
    .map((item) => `${item.label} 2,000만원 초과`)
    .join(', ')
}

const formatComprehensiveTaxAllocationSummary = (result: AlphaResult) =>
  result.comprehensiveTaxBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

export const getComprehensiveTaxZeroReason = (result: AlphaResult) => {
  const exceededSummary = result.comprehensiveTaxBreakdown
    .filter((item) => item.exceedsThreshold)
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

  return `${exceededSummary} 기준으로 인별 판정했고, 원천징수세액이 비교세액보다 크거나 같아`
}

export const getComprehensiveTaxNote = (result: AlphaResult) => {
  const allocationSummary = formatComprehensiveTaxAllocationSummary(result)
  const additionalSummary = result.comprehensiveTaxBreakdown
    .filter((item) => item.additionalTaxAnnual > 0)
    .map((item) => `${item.label} 추가 ${formatCompactCurrency(item.additionalTaxAnnual)}`)
    .join(', ')

  if (!result.comprehensiveTaxIncluded) {
    return `종합과세는 일반계좌 배당만 반영합니다. ISA는 합산 제외, 일반계좌 귀속은 ${allocationSummary}`
  }

  if (additionalSummary.length === 0) {
    return `종합과세는 일반계좌 배당만 반영합니다. ISA는 합산 제외, 일반계좌 귀속은 ${allocationSummary}. ${getComprehensiveTaxZeroReason(result)} 추가 납부는 0원`
  }

  return `종합과세는 일반계좌 배당만 반영합니다. ISA는 합산 제외, 일반계좌 귀속은 ${allocationSummary}. 소득세법 제62조 기준 추가 납부: ${additionalSummary}`
}
