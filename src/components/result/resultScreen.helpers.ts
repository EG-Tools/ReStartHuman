import type { ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import type {
  AccountOwnershipBreakdown,
  RetireCalcFormData,
  RetireCalcResult,
} from '../../types/retireCalc'
import { formatCompactCurrency } from '../../utils/format'

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

export const getLivingCostSnapshot = (formData: RetireCalcFormData) =>
  formData.livingCostInputMode === 'total'
    ? formData.livingCostMonthlyTotal
    : formData.foodMonthly +
      formData.necessitiesMonthly +
      formData.diningOutMonthly +
      formData.hobbyMonthly +
      formData.otherLivingMonthly

export const getRiskLabel = (riskLevel: RetireCalcResult['riskLevel']) => {
  switch (riskLevel) {
    case 'surplus':
      return '흑자'
    case 'deficit':
      return '적자'
    default:
      return '보합'
  }
}

export const getIsaTypeLabel = (
  isaType: RetireCalcResult['isaTaxBreakdown'][number]['isaType'],
) => (isaType === 'workingClass' ? '서민형' : '일반형')

export const getAgeAssetBenchmark = (age: number) =>
  ageAssetBenchmarks.find((benchmark) => age >= benchmark.min && age <= benchmark.max) ??
  ageAssetBenchmarks[ageAssetBenchmarks.length - 1]

export const getHouseholdAssetEstimate = (formData: RetireCalcFormData) => {
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
  healthInsuranceType: RetireCalcFormData['healthInsuranceType'],
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

const formatIsaOwnershipSummary = (breakdown: RetireCalcResult['isaTaxBreakdown']) => {
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

const formatIsaLimitSummary = (breakdown: RetireCalcResult['isaTaxBreakdown']) => {
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

export const getHoldingTaxBreakdownSummary = (result: RetireCalcResult) => {
  const activeBreakdown = result.holdingTaxBreakdown.filter((item) => item.annual > 0)

  if (activeBreakdown.length === 0) {
    return '해당 없음'
  }

  return activeBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.annual)}`)
    .join(', ')
}

export const getHoldingTaxInputSummary = (result: RetireCalcResult) => {
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

export const getHoldingTaxBaseSummary = (result: RetireCalcResult) => {
  const activeBreakdown = result.holdingTaxBreakdown.filter((item) => item.baseValue > 0)

  if (activeBreakdown.length === 0) {
    return '해당 자산 없음'
  }

  return activeBreakdown
    .map((item) => `${item.label} 기준가 ${formatCompactCurrency(item.baseValue)}`)
    .join(', ')
}

export const getTaxableDividendNote = (result: RetireCalcResult) => {
  const baseNote = `${policyConfig.dividendWithholding.note} 반영`
  const ownershipSummary = formatOwnershipSummary(result.taxableDividendOwnershipBreakdown)

  if (result.dividendInputMode === 'gross') {
    return `${baseNote}, 귀속: ${ownershipSummary}, 연 ${formatCompactCurrency(result.taxableDividendWithholdingAnnual)} 차감`
  }

  return `${baseNote}, 귀속: ${ownershipSummary}, 세후 입력값에서 세전 배당을 역산해 종합과세 여부를 판단`
}

export const getIsaDividendNote = (result: RetireCalcResult) => {
  const ownershipSummary = formatIsaOwnershipSummary(result.isaTaxBreakdown)
  const limitSummary = formatIsaLimitSummary(result.isaTaxBreakdown)
  const baseNote = `${policyConfig.isa.note} 반영`

  if (result.isaTaxAnnual === 0) {
    return `${baseNote}, 귀속: ${ownershipSummary}, ${limitSummary} 안에서 세금 없음`
  }

  return `${baseNote}, 귀속: ${ownershipSummary}, ${limitSummary} 초과분에 연 ${formatCompactCurrency(result.isaTaxAnnual)} 부과`
}

export const getComprehensiveTaxInput = (result: RetireCalcResult) => {
  if (!result.comprehensiveTaxIncluded) {
    return '금융소득 2,000만원 이하'
  }

  return result.comprehensiveTaxBreakdown
    .filter((item) => item.exceedsThreshold)
    .map((item) => `${item.label} 2,000만원 초과`)
    .join(', ')
}

const formatComprehensiveTaxAllocationSummary = (result: RetireCalcResult) =>
  result.comprehensiveTaxBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

export const getComprehensiveTaxZeroReason = (result: RetireCalcResult) => {
  const exceededSummary = result.comprehensiveTaxBreakdown
    .filter((item) => item.exceedsThreshold)
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

  return `${exceededSummary} 기준으로 인별 판정했고, 원천징수세액이 비교세액보다 크거나 같아`
}

export const getComprehensiveTaxNote = (result: RetireCalcResult) => {
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
