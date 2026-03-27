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
    case 'other':
      return '기타소득'
    default:
      return '추가소득'
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

  return (
    housingAsset +
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


type AdviceCandidate = {
  message: string
  monthlyImprovement: number
  endingImprovement: number
  resolvesDeficit: boolean
}

const statsKoreaLivingCostBenchmarks = {
  single: {
    averageMonthlyConsumption: 1_800_000,
    label: '1인 가구',
  },
  couple: {
    averageMonthlyConsumption: 2_900_000,
    label: '2인 가구',
  },
} as const

const isDeficitLike = (result: AlphaResult) =>
  result.monthlySurplusOrDeficit < 0 || result.cashBalanceAfterTenYears < 0

const improvesEnough = (before: AlphaResult, after: AlphaResult) => {
  const monthlyImprovement = after.monthlySurplusOrDeficit - before.monthlySurplusOrDeficit
  const endingImprovement = after.cashBalanceAfterTenYears - before.cashBalanceAfterTenYears

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

  return {
    ...formData,
    housingType: 'jeonse',
    jeonseDeposit: inferredJeonseDeposit,
    homeMarketValue: 0,
    homeOfficialValue: 0,
    monthlyRentDeposit: 0,
    monthlyRentAmount: 0,
    maintenanceIncludedInRent: true,
    monthlyMaintenanceFee: 0,
  }
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
  const candidates: AdviceCandidate[] = []

  for (let reductionMonthly = 100_000; reductionMonthly <= maxReduction; reductionMonthly += 100_000) {
    const nextFormData = buildReducedLivingCostFormData(formData, reductionMonthly)
    const nextResult = calculateAlphaScenario(nextFormData)

    if (!improvesEnough(result, nextResult)) {
      continue
    }

    const nextLivingCost = getLivingCostSnapshot(nextFormData)
    const statsNote =
      currentLivingCost > benchmark.averageMonthlyConsumption * 1.05
        ? ` 통계청 가계동향조사 참고선 기준 ${benchmark.label} 월평균 소비지출은 ${formatCompactCurrency(benchmark.averageMonthlyConsumption)} 안팎입니다.`
        : ''

    candidates.push({
      message: resolvesDeficit(nextResult)
        ? `월 생활비를 ${formatCompactCurrency(currentLivingCost)}에서 ${formatCompactCurrency(nextLivingCost)}로 낮추면 ${formData.simulationYears}년 후 현금잔액이 마이너스로 내려가지 않습니다.${statsNote}`
        : `월 생활비를 ${formatCompactCurrency(currentLivingCost)}에서 ${formatCompactCurrency(nextLivingCost)}로 낮추면 월 적자 폭이 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} 개선됩니다.${statsNote}`,
      monthlyImprovement: nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit,
      endingImprovement: nextResult.cashBalanceAfterTenYears - result.cashBalanceAfterTenYears,
      resolvesDeficit: resolvesDeficit(nextResult),
    })

    if (resolvesDeficit(nextResult)) {
      break
    }
  }

  return pickBestAdviceCandidate(candidates)
}

const findDividendAdvice = (
  formData: AlphaFormData,
  result: AlphaResult,
): AdviceCandidate | null => {
  const candidates: AdviceCandidate[] = []

  for (let additionalDividendMonthly = 100_000; additionalDividendMonthly <= 3_000_000; additionalDividendMonthly += 100_000) {
    const nextResult = calculateAlphaScenario(
      buildDividendBoostFormData(formData, additionalDividendMonthly),
    )

    if (!improvesEnough(result, nextResult)) {
      continue
    }

    candidates.push({
      message: resolvesDeficit(nextResult)
        ? `월 배당금 기준으로 ${formatCompactCurrency(additionalDividendMonthly)}를 더 확보하면 ${formData.simulationYears}년 후 현금잔액이 마이너스로 내려가지 않습니다.`
        : `월 배당금 기준으로 ${formatCompactCurrency(additionalDividendMonthly)}를 더 확보하면 월 적자 폭이 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} 개선됩니다.`,
      monthlyImprovement: nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit,
      endingImprovement: nextResult.cashBalanceAfterTenYears - result.cashBalanceAfterTenYears,
      resolvesDeficit: resolvesDeficit(nextResult),
    })

    if (resolvesDeficit(nextResult)) {
      break
    }
  }

  return pickBestAdviceCandidate(candidates)
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

  const nextResult = calculateAlphaScenario(buildJeonseShiftFormData(formData))

  if (!improvesEnough(result, nextResult)) {
    return null
  }

  return {
    message: resolvesDeficit(nextResult)
      ? `자가 대신 전세 시나리오로 바꾸면 보유세와 재산 반영 부담이 줄어 ${formData.simulationYears}년 후 현금잔액이 마이너스로 내려가지 않습니다.`
      : `자가 대신 전세 시나리오로 바꾸면 월 적자 폭이 ${formatCompactCurrency(nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit)} 개선됩니다.`,
    monthlyImprovement: nextResult.monthlySurplusOrDeficit - result.monthlySurplusOrDeficit,
    endingImprovement: nextResult.cashBalanceAfterTenYears - result.cashBalanceAfterTenYears,
    resolvesDeficit: resolvesDeficit(nextResult),
  }
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

  return `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)}로 현재 월 유입의 ${formatPercent(healthInsuranceShare)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 계산됐으니 건강보험 유형, 추가소득, 부동산 입력을 다시 확인해보는 편이 좋습니다.`
}

const buildActionAdviceItems = (formData: AlphaFormData, result: AlphaResult) => {
  if (!isDeficitLike(result)) {
    return []
  }

  const scenarioCandidates = [
    findLivingCostAdvice(formData, result),
    findDividendAdvice(formData, result),
    findJeonseAdvice(formData, result),
  ].filter((candidate): candidate is AdviceCandidate => candidate !== null)

  const actionAdvice = scenarioCandidates
    .sort((left, right) => rankAdviceCandidate(right) - rankAdviceCandidate(left))
    .slice(0, 2)
    .map((candidate) => candidate.message)

  const healthInsuranceAdvice = buildHealthInsuranceAdvice(formData, result)

  if (healthInsuranceAdvice && actionAdvice.length < 3) {
    actionAdvice.push(healthInsuranceAdvice)
  }

  if (actionAdvice.length > 0) {
    return actionAdvice
  }

  return [
    '현재 입력값에서는 한 가지 조정만으로 적자를 해소하기 어렵습니다. 생활비, 주거비, 배당 현금흐름 중 두세 항목을 함께 조정해보세요.',
  ]
}

export const buildDeficitAdviceItems = (formData: AlphaFormData, result: AlphaResult) =>
  buildActionAdviceItems(formData, result)

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
      ? `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 보수 외 소득과 재산 영향을 함께 반영한 결과입니다.`
      : `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 추정했습니다.`,
    result.otherIncomeMonthlyApplied > 0
      ? `${getOtherIncomeTypeLabel(formData.otherIncomeType)} ${formatCompactCurrency(result.otherIncomeMonthlyApplied)}은 자산이 아닌 월 유입으로 반영했습니다.`
      : '추가 월소득은 별도 입력이 없어 반영하지 않았습니다.',
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
