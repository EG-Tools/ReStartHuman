import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import { PrimaryButton } from '../common/Ui'
import type {
  AccountOwnershipBreakdown,
  RetireCalcFormData,
  RetireCalcResult,
} from '../../types/retireCalc'
import {
  formatCompactCurrency,
  formatCurrency,
  formatSignedCompactCurrency,
} from '../../utils/format'

interface ResultScreenProps {
  formData: RetireCalcFormData
  result: RetireCalcResult
  onEditAnswers: () => void
  onStartOver: () => void
  onOpenSaveSlots: () => void
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
  headerAction?: ReactNode
}

interface ResultRow {
  category: string
  item: string
  input: ReactNode
  monthly: string
  annual: string
  tenYear: string
  note: string
  noteDetail?: string
}

const MANWON = 10_000

const formatDraftValue = (value: number) =>
  Number.isFinite(value) && value !== 0 ? String(value) : ''

const parseDraftValue = (draftValue: string, minValue: number) => {
  const normalizedValue = Number(draftValue) || 0
  return Math.max(normalizedValue, minValue)
}

const getLivingCostSnapshot = (formData: RetireCalcFormData) =>
  formData.livingCostInputMode === 'total'
    ? formData.livingCostMonthlyTotal
    : formData.foodMonthly +
      formData.necessitiesMonthly +
      formData.diningOutMonthly +
      formData.hobbyMonthly +
      formData.otherLivingMonthly

const getRiskLabel = (riskLevel: RetireCalcResult['riskLevel']) => {
  switch (riskLevel) {
    case 'surplus':
      return '흑자'
    case 'deficit':
      return '적자'
    default:
      return '보합'
  }
}

const getIsaTypeLabel = (
  isaType: RetireCalcResult['isaTaxBreakdown'][number]['isaType'],
) => (isaType === 'workingClass' ? '서민형' : '일반형')

const ageAssetBenchmarks = [
  { min: 0, max: 39, label: '39세 이하', averageAsset: 314_980_000 },
  { min: 40, max: 49, label: '40대', averageAsset: 627_140_000 },
  { min: 50, max: 59, label: '50대', averageAsset: 662_050_000 },
  { min: 60, max: Number.POSITIVE_INFINITY, label: '60세 이상', averageAsset: 600_950_000 },
] as const

const getAgeAssetBenchmark = (age: number) =>
  ageAssetBenchmarks.find((benchmark) => age >= benchmark.min && age <= benchmark.max) ??
  ageAssetBenchmarks[ageAssetBenchmarks.length - 1]

const getHouseholdAssetEstimate = (formData: RetireCalcFormData) => {
  const housingAsset =
    formData.housingType === 'own'
      ? formData.homeMarketValue
      : formData.housingType === 'jeonse'
        ? formData.jeonseDeposit
        : formData.monthlyRentDeposit

  return (
    housingAsset +
    formData.taxableAccountAssets +
    formData.isaAssets +
    formData.pensionAccountAssets +
    formData.otherAssets +
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

const getAssetInterpretationMessage = ({
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

const getHealthInsuranceTypeSummary = (healthInsuranceType: RetireCalcFormData['healthInsuranceType']) => {
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

const getTaxableDividendNote = (result: RetireCalcResult) => {
  const baseNote = `${policyConfig.dividendWithholding.note} 반영`
  const ownershipSummary = formatOwnershipSummary(
    result.taxableDividendOwnershipBreakdown,
  )

  if (result.dividendInputMode === 'gross') {
    return `${baseNote}, 귀속: ${ownershipSummary}, 연 ${formatCompactCurrency(result.taxableDividendWithholdingAnnual)} 차감`
  }

  return `${baseNote}, 귀속: ${ownershipSummary}, 세후 입력값에서 세전 배당을 역산해 종합과세 여부를 판단`
}

const getIsaDividendNote = (result: RetireCalcResult) => {
  const ownershipSummary = formatIsaOwnershipSummary(result.isaTaxBreakdown)
  const limitSummary = formatIsaLimitSummary(result.isaTaxBreakdown)

  if (result.dividendInputMode === 'gross') {
    return result.isaTaxAnnual > 0
      ? `귀속: ${ownershipSummary}, ${limitSummary}, 총 비과세 반영 ${formatCompactCurrency(result.isaTaxFreeLimitApplied)}, 연 ${formatCompactCurrency(result.isaTaxAnnual)} 차감, 종합소득세 합산 제외`
      : `귀속: ${ownershipSummary}, ${limitSummary}, 총 비과세 반영 ${formatCompactCurrency(result.isaTaxFreeLimitApplied)}, 초과분이 없어 추가 세금 없음, 종합소득세 합산 제외. 한도를 조금 초과한 경우에도 반올림 기준에 따라 표시 세액이 0원으로 보일 수 있습니다.`
  }

  return `세후 입력 그대로 사용합니다. 귀속: ${ownershipSummary}, 참고 한도: ${limitSummary}. 세후 입력에서는 ISA 유형별 절세 차이를 다시 계산하지 않고, 종합소득세에도 합산하지 않습니다.`
}

const getComprehensiveTaxInput = (result: RetireCalcResult) => {
  const exceededLabels = result.comprehensiveTaxBreakdown
    .filter((item) => item.exceedsThreshold)
    .map((item) => item.label)

  if (exceededLabels.length === 0) {
    return `일반계좌 배당 인별 ${formatCompactCurrency(result.comprehensiveTaxThresholdAnnual)} 이하`
  }

  return `${exceededLabels.join(' / ')} 기준 초과`
}

const formatComprehensiveTaxAllocationSummary = (result: RetireCalcResult) =>
  result.comprehensiveTaxBreakdown
    .filter((item) => item.attributedDividendAnnual > 0)
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

const getComprehensiveTaxZeroReason = (result: RetireCalcResult) => {
  const exceededBreakdown = result.comprehensiveTaxBreakdown.filter((item) => item.exceedsThreshold)

  if (exceededBreakdown.length === 0) {
    return `인별 귀속 배당이 모두 ${formatCompactCurrency(result.comprehensiveTaxThresholdAnnual)} 이하라`
  }

  const exceededSummary = exceededBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')

  return `${exceededSummary} 기준으로 인별 판정했고, 원천징수세액이 비교세액보다 크거나 같아`
}

const getComprehensiveTaxNote = (result: RetireCalcResult) => {
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

const splitSummaryValue = (value: string) => {
  const matched = value.match(/^([+-]?[\d.,]+)(.*)$/)

  if (!matched) {
    return {
      amount: value,
      unit: '',
    }
  }

  return {
    amount: matched[1],
    unit: matched[2],
  }
}

function InflationSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: (nextValue: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? '물가반영 On' : '물가미반영 Off'}
      className={`inflation-toggle ${enabled ? 'is-on' : 'is-off'}`}
      onClick={() => onToggle(!enabled)}
    >
      <span className="inflation-toggle-copy">{enabled ? 'On' : 'Off'}</span>
      <span className="inflation-toggle-track" aria-hidden="true">
        <span className="inflation-toggle-thumb" />
      </span>
    </button>
  )
}
const SummaryCards = memo(function SummaryCards({
  result,
  projectionYears,
}: {
  result: RetireCalcResult
  projectionYears: number
}) {
  const cards = [
    {
      label: '월 실사용 가능액',
      value: formatCompactCurrency(result.monthlyUsableCash),
      tone: 'neutral',
    },
    {
      label: '월 흑자 / 적자',
      value: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
      tone: result.riskLevel,
    },
    {
      label: '1 년 결과',
      value: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
      tone: result.riskLevel,
    },
    {
      label: '30 년 결과',
      value: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
      tone: result.riskLevel,
    },
  ]

  return (
    <div className="summary-grid">
      {cards.map((card) => {
        const { amount, unit } = splitSummaryValue(card.value)

        return (
          <article key={card.label} className={`summary-card tone-${card.tone}`}>
            <p>{card.label}</p>
            <h2 className="summary-value">
              <span>{amount}</span>
              {unit ? <span className="summary-value-unit">{unit}</span> : null}
            </h2>
          </article>
        )
      })}
    </div>
  )
})

const CashFlowChart = memo(function CashFlowChart({
  result,
  inflationEnabled,
  inflationRateAnnual,
  projectionYears,
}: {
  result: RetireCalcResult
  inflationEnabled: boolean
  inflationRateAnnual: number
  projectionYears: number
}) {
  const points =
    result.cashBalanceTimeline.length > 0
      ? result.cashBalanceTimeline
      : [{ year: 0, balance: result.startingCashReserve }]
  const width = 370
  const height = 210
  const paddingLeft = 50
  const paddingRight = 18
  const paddingTop = 18
  const paddingBottom = 38
  const borderGapLeft = 10
  const borderGapRight = 10
  const borderGapTop = 10
  const borderGapBottom = 10
  const yLabelGap = 8
  const xLabelGap = 8
  const balances = points.map((point) => point.balance)
  const minBalance = Math.min(...balances)
  const maxBalance = Math.max(...balances)
  const range = maxBalance - minBalance || 1
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const chartFloorY = height - paddingBottom
  const borderX = paddingLeft - borderGapLeft
  const borderY = paddingTop - borderGapTop
  const borderWidth = chartWidth + borderGapLeft + borderGapRight
  const borderHeight = chartHeight + borderGapTop + borderGapBottom
  const displayedInflationRate = Math.round((inflationEnabled ? inflationRateAnnual : 0) * 100)
  const palette =
    result.riskLevel === 'deficit'
      ? {
          areaStart: 'rgba(255, 146, 156, 0.12)',
          areaEnd: 'rgba(150, 67, 72, 0.42)',
          line: '#ff9aa3',
        }
      : result.riskLevel === 'neutral'
        ? {
            areaStart: 'rgba(243, 221, 128, 0.12)',
            areaEnd: 'rgba(132, 110, 54, 0.4)',
            line: '#e6ca77',
          }
        : {
            areaStart: 'rgba(133, 236, 186, 0.1)',
            areaEnd: 'rgba(56, 112, 91, 0.46)',
            line: '#78d5b0',
          }
  const gradientId = `cashflow-area-${result.riskLevel}`
  const gridColor = 'rgba(227, 236, 240, 0.12)'
  const labelColor = 'rgba(214, 225, 229, 0.82)'
  const tickColor = 'rgba(227, 236, 240, 0.16)'
  const getX = (index: number) =>
    paddingLeft + (index * chartWidth) / Math.max(points.length - 1, 1)
  const getY = (balance: number) =>
    paddingTop + (1 - (balance - minBalance) / range) * chartHeight
  const coordinates = points.map((point, index) => ({
    ...point,
    x: getX(index),
    y: getY(point.balance),
  }))
  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${chartFloorY} L ${coordinates[0].x} ${chartFloorY} Z`
  const endingBalance =
    coordinates[coordinates.length - 1]?.balance ?? result.startingCashReserve
  const yTicks = [maxBalance, Math.round((maxBalance + minBalance) / 2), minBalance].map(
    (value, index) => ({
      key: index,
      value,
      y: getY(value),
    }),
  )
  const totalYears = Math.max(points[points.length - 1]?.year ?? projectionYears, projectionYears)
  const midYear1 = Math.max(1, Math.round(totalYears / 3))
  const midYear2 = Math.max(midYear1 + 1, Math.round((totalYears * 2) / 3))
  const xTicks = [
    { label: '현재', yearOffset: 0 },
    { label: `${midYear1}년`, yearOffset: midYear1 },
    { label: `${midYear2}년`, yearOffset: midYear2 },
    { label: `${totalYears}년`, yearOffset: totalYears },
  ].map((tick) => ({
    ...tick,
    x: paddingLeft + (Math.min(tick.yearOffset, totalYears) / totalYears) * chartWidth,
  }))

  return (
    <section className={`result-panel cashflow-hero tone-${result.riskLevel}`}>
      <div className="cashflow-hero-header">
        <div>
          <div className="cashflow-hero-titleline">
            <p className="cashflow-hero-eyebrow">{projectionYears}년 현금흐름 예상</p>
            <span className={`cashflow-hero-status risk-${result.riskLevel}`}>
              ({getRiskLabel(result.riskLevel)})
            </span>
          </div>
          <h2>{formatCompactCurrency(endingBalance)}</h2>
          <p className="cashflow-hero-copy">
            현재 보유한 현금에서 {projectionYears}년 후 그래프 변화입니다.
          </p>
        </div>
        <div className="cashflow-hero-meta">
          <span>시작 {formatCompactCurrency(result.startingCashReserve)}</span>
          <span>{projectionYears}년후 {formatCompactCurrency(result.cashBalanceAfterTenYears)}</span>
          <span>물가반영 {displayedInflationRate}%</span>
        </div>
      </div>

      <svg
        className="cashflow-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${projectionYears}년 현금흐름 그래프`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.areaStart} />
            <stop offset="100%" stopColor={palette.areaEnd} />
          </linearGradient>
        </defs>

        <rect
          x={borderX}
          y={borderY}
          width={borderWidth}
          height={borderHeight}
          rx={0}
          ry={0}
          fill="none"
          style={{ stroke: 'rgba(227, 236, 240, 0.18)', strokeWidth: 1 }}
        />

        {yTicks.map((tick) => (
          <g key={`y-tick-${tick.key}`}>
            <line
              className="cashflow-grid-line"
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              style={{ stroke: gridColor }}
            />
            <text
              className="cashflow-grid-label"
              x={borderX - yLabelGap}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              style={{ fill: labelColor }}
            >
              {formatYAxisEok(tick.value)}
            </text>
          </g>
        ))}

        <path className="cashflow-chart-area" d={areaPath} style={{ fill: `url(#${gradientId})` }} />
        <path
          className="cashflow-chart-line"
          d={linePath}
          style={{
            stroke: palette.line,
            fill: 'none',
            strokeWidth: 2.2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }}
        />

        {xTicks.map((tick) => (
          <g key={`x-tick-${tick.label}`}>
            <line
              className="cashflow-year-tick"
              x1={tick.x}
              y1={chartFloorY}
              x2={tick.x}
              y2={chartFloorY + 4}
              style={{ stroke: tickColor }}
            />
            <text
              x={tick.x}
              y={borderY + borderHeight + xLabelGap}
              textAnchor={tick.label === '현재' ? 'start' : tick.yearOffset === totalYears ? 'end' : 'middle'}
              dominantBaseline="hanging"
              style={{
                fill: labelColor,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tick.label}
            </text>
          </g>
        ))}

      </svg>
    </section>
  )
})

const formatYAxisEok = (value: number) => {
  const eokValue = value / 100_000_000
  return `${eokValue.toFixed(2)} 억`
}

const splitResultItemWord = (word: string) => {
  if (!word) {
    return []
  }

  if (/^[A-Za-z0-9]+$/.test(word)) {
    return [word]
  }

  const chars = Array.from(word)

  if (chars.length <= 3) {
    return [word]
  }

  return [chars.slice(0, 2).join(''), chars.slice(2).join('')]
}

const splitResultItemLabel = (value: string) =>
  value
    .split(/[\s/]+/)
    .flatMap((word) => splitResultItemWord(word.trim()))
    .filter((chunk) => chunk.length > 0)

const getResultCategoryClassName = (category: string) => {
  switch (category) {
    case '세금':
      return 'result-category-tax'
    case '지출':
      return 'result-category-expense'
    case '결과':
      return 'result-category-outcome'
    default:
      return ''
  }
}

const ResultTable = memo(function ResultTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="table-shell">
      <table className="result-table">
        <thead>
          <tr>
            <th><span className="result-head-text">구분</span></th>
            <th><span className="result-head-text">입력값</span></th>
            <th><span className="result-head-text">월 기준</span></th>
            <th><span className="result-head-text">1년 결과</span></th>
            <th><span className="result-head-text">{formData.simulationYears}년 결과</span></th>
            <th><span className="result-head-text">비고</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.category}-${row.item}`} className={getResultCategoryClassName(row.category)}>
              <td className="result-item-cell">
                <span className="result-item-label" aria-label={row.item}>
                  {splitResultItemLabel(row.item).map((chunk, index) => (
                    <span key={`${row.item}-${index}`}>{chunk}</span>
                  ))}
                </span>
              </td>
              <td className="result-input-cell">{row.input}</td>
              <td>{row.monthly}</td>
              <td>{row.annual}</td>
              <td>{row.tenYear}</td>
              <td>
                <div className="note-cell">
                  <span>{row.note}</span>
                  {row.noteDetail ? (
                    <details className="note-popover">
                      <summary className="note-popover-trigger" aria-label="설명 보기">
                        ?
                      </summary>
                      <div className="note-popover-bubble">{row.noteDetail}</div>
                    </details>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

const ResultInterpretation = memo(function ResultInterpretation({
  items,
}: {
  items: string[]
}) {
  return (
    <section className="result-panel interpretation-panel">
      <div className="panel-header">
        <div>
          <h2>결과표 해석</h2>
        </div>
      </div>
      <ul className="interpretation-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
})

function HelpPopover({
  detail,
  label = '설명 보기',
  align = 'right',
}: {
  detail: string
  label?: string
  align?: 'left' | 'right'
}) {
  const className = `note-popover ${align === 'left' ? 'note-popover-left' : ''}`.trim()

  return (
    <details className={className}>
      <summary className="note-popover-trigger" aria-label={label}>
        ?
      </summary>
      <div className="note-popover-bubble">{detail}</div>
    </details>
  )
}

function InlineAmountInput({
  label,
  value,
  onChange,
  action,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  action?: ReactNode
}) {
  const displayValue = Number.isFinite(value) ? Math.round(value / MANWON) : 0
  const [draftValue, setDraftValue] = useState(() => formatDraftValue(displayValue))
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (!isEditingRef.current) {
      setDraftValue(formatDraftValue(displayValue))
    }
  }, [displayValue])

  const commitDraftValue = () => {
    const nextValue = parseDraftValue(draftValue, 0)
    onChange(nextValue * MANWON)
    setDraftValue(formatDraftValue(nextValue))
  }

  return (
    <div className="table-edit-stack">
      <div className="table-edit-inline">
        <div className="table-edit-field">
          <input
            className="table-edit-input"
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            value={draftValue}
            aria-label={label}
            onFocus={(event) => {
              isEditingRef.current = true
              event.currentTarget.select()
            }}
            onBlur={() => {
              isEditingRef.current = false
              commitDraftValue()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }

              if (event.key === 'Escape') {
                isEditingRef.current = false
                setDraftValue(formatDraftValue(displayValue))
                event.currentTarget.blur()
              }
            }}
            onWheel={(event) => {
              if (document.activeElement === event.currentTarget) {
                event.currentTarget.blur()
              }
            }}
            onChange={(event) => {
              setDraftValue(event.target.value)
            }}
          />
        </div>
        <span className="table-edit-suffix">만원</span>
        {action ? <div className="table-edit-action">{action}</div> : null}
      </div>
    </div>
  )
}
function InlineLabeledAmountInput({
  caption,
  label,
  value,
  onChange,
  className,
}: {
  caption: string
  label: string
  value: number
  onChange: (value: number) => void
  className?: string
}) {
  return (
    <div className={className ? `table-edit-group ${className}` : "table-edit-group"}>
      <span className="table-edit-label">{caption}</span>
      <InlineAmountInput
        label={label}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function HousingAmountEditor({
  formData,
  onPatchFormData,
}: {
  formData: RetireCalcFormData
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
}) {
  if (formData.housingType === 'own') {
    return (
      <div className="table-edit-cluster table-edit-cluster-housing">
        <InlineLabeledAmountInput
          className="table-edit-group-market"
          caption="시가"
          label="주택 시가"
          value={formData.homeMarketValue}
          onChange={(value) => onPatchFormData({ homeMarketValue: value })}
        />
        <InlineLabeledAmountInput
          caption="공시가격"
          label="주택 공시가격"
          value={formData.homeOfficialValue}
          onChange={(value) => onPatchFormData({ homeOfficialValue: value })}
        />
      </div>
    )
  }

  if (formData.housingType === 'jeonse') {
    return (
      <InlineLabeledAmountInput
        caption="전세보증금"
        label="전세보증금"
        value={formData.jeonseDeposit}
        onChange={(value) => onPatchFormData({ jeonseDeposit: value })}
      />
    )
  }

  return (
    <div className="table-edit-cluster">
      <InlineLabeledAmountInput
        caption="보증금"
        label="월세 보증금"
        value={formData.monthlyRentDeposit}
        onChange={(value) => onPatchFormData({ monthlyRentDeposit: value })}
      />
      <InlineLabeledAmountInput
        caption="월세"
        label="월세 금액"
        value={formData.monthlyRentAmount}
        onChange={(value) => onPatchFormData({ monthlyRentAmount: value })}
      />
    </div>
  )
}

function HealthInsuranceEditor({
  result,
  onPatchFormData,
}: {
  result: RetireCalcResult
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
}) {
  return (
    <InlineAmountInput
      label="월 건강보험료"
      value={result.healthInsuranceMonthly}
      onChange={(value) =>
        onPatchFormData({
          healthInsuranceOverrideMonthly: value,
        })
      }
      action={
        result.healthInsuranceSource === 'manual' ? (
          <button
            type="button"
            className="table-edit-reset"
            onClick={() => onPatchFormData({ healthInsuranceOverrideMonthly: null })}
          >
            자동
          </button>
        ) : undefined
      }
    />
  )
}

function FixedExpenseEditor({
  formData,
  onPatchFormData,
}: {
  formData: RetireCalcFormData
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
}) {
  const fixedMaintenanceMonthly =
    formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly
  const lockedBase =
    formData.insuranceMonthly +
    fixedMaintenanceMonthly +
    formData.telecomMonthly
  const totalValue = lockedBase + formData.otherFixedMonthly

  return (
    <InlineAmountInput
      label="월 고정지출"
      value={totalValue}
      onChange={(value) =>
        onPatchFormData({
          otherFixedMonthly: Math.max(value - lockedBase, 0),
        })
      }
    />
  )
}

function LivingExpenseEditor({
  formData,
  onPatchFormData,
}: {
  formData: RetireCalcFormData
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
}) {
  const totalValue = getLivingCostSnapshot(formData)

  if (formData.livingCostInputMode === 'total') {
    return (
      <InlineAmountInput
        label="월 생활비"
        value={totalValue}
        onChange={(value) => onPatchFormData({ livingCostMonthlyTotal: value })}
      />
    )
  }

  const lockedBase =
    formData.foodMonthly +
    formData.necessitiesMonthly +
    formData.diningOutMonthly +
    formData.hobbyMonthly

  return (
    <InlineAmountInput
      label="월 생활비"
      value={totalValue}
      onChange={(value) =>
        onPatchFormData({
          otherLivingMonthly: Math.max(value - lockedBase, 0),
        })
      }
    />
  )
}

const getExportFileName = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `retire-cashflow-${year}${month}${day}.png`
}

export function ResultScreen({
  formData,
  result,
  onEditAnswers,
  onStartOver,
  onOpenSaveSlots,
  onPatchFormData,
  headerAction,
}: ResultScreenProps) {
  const dividendBasisLabel =
    result.dividendInputMode === 'gross'
      ? '배당 입력 기준: 세전'
      : '배당 입력 기준: 세후'

  const fixedMaintenanceMonthlyBase =
    formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly
  const fixedExpenseMonthlyBase =
    formData.insuranceMonthly +
    fixedMaintenanceMonthlyBase +
    formData.telecomMonthly +
    formData.otherFixedMonthly
  const fixedExpenseAnnualBase = fixedExpenseMonthlyBase * 12
  const captureRef = useRef<HTMLDivElement | null>(null)
  const [exportState, setExportState] = useState<'idle' | 'sharing'>('idle')
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const ageBenchmark = useMemo(
    () => getAgeAssetBenchmark(formData.currentAge),
    [formData.currentAge],
  )
  const totalAssetEstimate = useMemo(
    () => getHouseholdAssetEstimate(formData),
    [formData],
  )
  const assetInterpretation = useMemo(
    () =>
      getAssetInterpretationMessage({
        benchmarkLabel: ageBenchmark.label,
        benchmarkAverageAsset: ageBenchmark.averageAsset,
        totalAssets: totalAssetEstimate,
        dividendAnnual: result.totalDividendAnnualGross,
      }),
    [
      ageBenchmark.averageAsset,
      ageBenchmark.label,
      result.totalDividendAnnualGross,
      totalAssetEstimate,
    ],
  )
  const highestComprehensiveTaxBreakdown = useMemo(
    () =>
      result.comprehensiveTaxBreakdown.reduce<
        RetireCalcResult['comprehensiveTaxBreakdown'][number] | null
      >((highest, item) => {
        if (!highest || item.finalTaxAnnual > highest.finalTaxAnnual) {
          return item
        }

        return highest
      }, null),
    [result.comprehensiveTaxBreakdown],
  )
  const effectiveComprehensiveRate = useMemo(
    () =>
      highestComprehensiveTaxBreakdown &&
      highestComprehensiveTaxBreakdown.attributedDividendAnnual > 0
        ? Math.round(
            (highestComprehensiveTaxBreakdown.finalTaxAnnual /
              highestComprehensiveTaxBreakdown.attributedDividendAnnual) *
              100,
          )
        : 0,
    [highestComprehensiveTaxBreakdown],
  )
  const interpretationItems = useMemo(
    () => [
      result.holdingTaxAnnual >= 10_000_000
        ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. 공시가격 ${formatCompactCurrency(formData.homeOfficialValue)} 주택이라면 보유세 부담이 큰 구간에 들어갈 것으로 보입니다.`
        : result.holdingTaxAnnual > 0
          ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. 공시가격 ${formatCompactCurrency(formData.homeOfficialValue)} 기준으로 추정된 값입니다.`
          : '보유세는 현재 납부 대상이 아닌 것으로 계산했습니다.',
      result.comprehensiveTaxIncluded
        ? result.comprehensiveTaxImpactAnnual > 0
          ? `종합소득세는 금융소득 2,000만원 초과 구간입니다. 추가 세 부담은 약 ${effectiveComprehensiveRate}% 수준으로 반영했습니다.`
          : `종합소득세는 금융소득 2,000만원 초과 구간이지만 ${getComprehensiveTaxZeroReason(result)} 추가 세 부담은 0원입니다.`
        : '금융소득 2,000만원 이하로 보고 종합소득세 추가 부담은 제외했습니다.',
      result.healthInsuranceMonthly >= 1_000_000
        ? `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 보수 외 소득과 재산 영향을 함께 반영한 결과입니다.`
        : `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 추정했습니다.`,
      assetInterpretation,
    ],
    [
      assetInterpretation,
      effectiveComprehensiveRate,
      formData.healthInsuranceType,
      formData.homeOfficialValue,
      result.comprehensiveTaxImpactAnnual,
      result.comprehensiveTaxIncluded,
      result.healthInsuranceMonthly,
      result.holdingTaxAnnual,
    ],
  )

  const createResultImage = async () => {
    const node = captureRef.current

    if (!node) {
      throw new Error('capture-target-missing')
    }

    const openedPopovers = Array.from(
      node.querySelectorAll('details[open]'),
    ) as HTMLDetailsElement[]

    openedPopovers.forEach((element) => {
      element.open = false
    })

    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(node, {
        backgroundColor: '#081113',
        pixelRatio: 2,
        cacheBust: true,
        filter: (currentNode) => {
          return !(
            currentNode instanceof HTMLElement &&
            currentNode.dataset.captureExclude === 'true'
          )
        },
      })

      if (!blob) {
        throw new Error('capture-failed')
      }

      return blob
    } finally {
      openedPopovers.forEach((element) => {
        element.open = true
      })
    }
  }

  const downloadResultImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = getExportFileName()
    link.click()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  const handleShareImage = async () => {
    try {
      setExportState('sharing')
      setExportMessage(null)
      const blob = await createResultImage()
      const file = new File([blob], getExportFileName(), { type: 'image/png' })

      if (
        navigator.share &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'Re Start Human 결과',
          files: [file],
        })
        setExportMessage('결과 이미지를 공유했습니다.')
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Re Start Human 결과',
          text: '결과 화면 이미지를 저장하거나 전송할 수 있습니다.',
          url: window.location.href,
        })
        setExportMessage('공유를 마쳤습니다.')
        return
      }

      downloadResultImage(blob)
      setExportMessage('공유 기능이 없어 이미지를 다운로드했습니다.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportMessage('공유가 취소되었습니다.')
      } else {
        setExportMessage('결과 이미지 공유에 실패했습니다.')
      }
    } finally {
      setExportState('idle')
    }
  }

  const householdSummary = `${formData.householdType === 'couple' ? '부부 합산' : '1인 가구'}, ${
    formData.housingType === 'own'
      ? '자가'
      : formData.housingType === 'jeonse'
        ? '전세'
        : '월세'
  }`
  const housingRowLabel = formData.housingType === 'own' ? '집값' : '주거비'
  const housingRowNote =
    formData.housingType === 'own'
      ? '시가 / 공시가'
      : formData.housingType === 'jeonse'
        ? '전세 보증금'
        : '보증금 / 월세'

  const rows = useMemo<ResultRow[]>(() => [
    {
      category: '기본',
      item: '가구',
      input: householdSummary,
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note: dividendBasisLabel,
    },
    {
      category: '주거',
      item: housingRowLabel,
      input: (
        <HousingAmountEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost)
          : '—',
      annual: '—',
      tenYear: '—',
      note: housingRowNote,
    },
    {
      category: '배당',
      item: '배당금',
      input: (
        <InlineAmountInput
          label="일반계좌 연간 배당금"
          value={formData.taxableAccountDividendAnnual}
          onChange={(value) => onPatchFormData({ taxableAccountDividendAnnual: value })}
        />
      ),
      monthly: formatCompactCurrency(result.taxableDividendMonthlyNet),
      annual: formatCompactCurrency(result.taxableDividendAnnualNet),
      tenYear: formatCompactCurrency(result.taxableDividendAnnualNet * formData.simulationYears),
      note: '원천징수 15.4%',
      noteDetail: getTaxableDividendNote(result),
    },
    {
      category: '배당',
      item: 'ISA 배당금',
      input: (
        <InlineAmountInput
          label="ISA 연간 배당금"
          value={formData.isaDividendAnnual}
          onChange={(value) => onPatchFormData({ isaDividendAnnual: value })}
        />
      ),
      monthly: formatCompactCurrency(result.isaDividendMonthlyNet),
      annual: formatCompactCurrency(result.isaDividendAnnualNet),
      tenYear: formatCompactCurrency(result.isaDividendAnnualNet * formData.simulationYears),
      note: 'ISA 특례',
      noteDetail: getIsaDividendNote(result),
    },
    {
      category: '유입',
      item: '국민연금',
      input: (
        <InlineAmountInput
          label="국민연금 예상 금액"
          value={formData.pensionMonthlyAmount}
          onChange={(value) => onPatchFormData({ pensionMonthlyAmount: value })}
        />
      ),
      monthly: formatCompactCurrency(result.pensionMonthlyApplied),
      annual: formatCompactCurrency(result.pensionMonthlyApplied * 12),
      tenYear: formatCompactCurrency(result.pensionMonthlyApplied * 12 * formData.simulationYears),
      note: '월 기준 유입',
    },
    {
      category: '결과',
      item: '총 유입',
      input: `${formatCompactCurrency(result.totalDividendAnnualNet)} 배당 + ${formatCompactCurrency(result.otherIncomeMonthlyApplied)} 기타소득 + ${formatCompactCurrency(result.pensionMonthlyApplied)} 국민연금`,
      monthly: formatCompactCurrency(result.totalIncomeMonthly),
      annual: formatCompactCurrency(result.totalIncomeMonthly * 12),
      tenYear: formatCompactCurrency(result.totalIncomeMonthly * 12 * formData.simulationYears),
      note: '세금 차감 전',
    },
    {
      category: '세금',
      item: '건강 보험료',
      input: (
        <HealthInsuranceEditor result={result} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(result.healthInsuranceMonthly),
      annual: formatCompactCurrency(result.healthInsuranceMonthly * 12),
      tenYear: formatCompactCurrency(result.healthInsuranceMonthly * 12 * formData.simulationYears),
      note: 'NHIS 단순화',
      noteDetail: policyConfig.healthInsurance.approximationNotice,
    },
    {
      category: '세금',
      item: '종합소득세',
      input: getComprehensiveTaxInput(result),
      monthly: formatCompactCurrency(result.comprehensiveTaxImpactAnnual / 12),
      annual: formatCompactCurrency(result.comprehensiveTaxImpactAnnual),
      tenYear: formatCompactCurrency(result.comprehensiveTaxImpactAnnual * formData.simulationYears),
      note: '일반계좌만 반영',
      noteDetail: getComprehensiveTaxNote(result),
    },
    {
      category: '세금',
      item: '보유세',
      input: formData.housingType === 'own' ? '자가 주택 기준' : '해당 없음',
      monthly:
        formData.housingType === 'own'
          ? formatCompactCurrency(result.holdingTaxMonthly)
          : '—',
      annual:
        formData.housingType === 'own'
          ? formatCompactCurrency(result.holdingTaxAnnual)
          : '—',
      tenYear:
        formData.housingType === 'own'
          ? formatCompactCurrency(result.holdingTaxAnnual * formData.simulationYears)
          : '—',
      note:
        formData.housingType === 'own'
          ? '주택세 추정'
          : '자가가 아니면 0원 처리',
      noteDetail:
        formData.housingType === 'own' ? policyConfig.holdingTax.note : undefined,
    },
    {
      category: '결과',
      item: '월 실사용 가능액',
      input: '총 유입에서 건강보험료·보유세·종합소득세 반영',
      monthly: formatCompactCurrency(result.monthlyUsableCash),
      annual: formatCompactCurrency(result.monthlyUsableCash * 12),
      tenYear: formatCompactCurrency(result.monthlyUsableCash * 12 * formData.simulationYears),
      note: '생활비와 고정지출 차감 전',
    },
    {
      category: '지출',
      item: '고정지출',
      input: (
        <FixedExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(fixedExpenseMonthlyBase),
      annual: formatCompactCurrency(fixedExpenseAnnualBase),
      tenYear: formatCompactCurrency(fixedExpenseAnnualBase * formData.simulationYears),
      note: '차량, 대출 제외',
    },
    {
      category: '지출',
      item: '식비생활비',
      input: (
        <LivingExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(result.livingExpenseMonthly),
      annual: formatCompactCurrency(result.livingExpenseMonthly * 12),
      tenYear: formatCompactCurrency(result.livingExpenseMonthly * 12 * formData.simulationYears),
      note:
        formData.livingCostInputMode === 'detailed'
          ? '세부 항목 합산'
          : '총액 입력 사용',
    },
    {
      category: '지출',
      item: '차량유지비',
      input: (
        <InlineAmountInput
          label="자동차 연간 유지비"
          value={formData.carYearlyCost}
          onChange={(value) => onPatchFormData({ carYearlyCost: value })}
        />
      ),
      monthly: formatCompactCurrency(result.carMonthlyConverted),
      annual: formatCompactCurrency(formData.carYearlyCost),
      tenYear: formatCompactCurrency(formData.carYearlyCost * formData.simulationYears),
      note: '연간 ÷ 12',
      noteDetail: `월 환산 ${formatCompactCurrency(result.carMonthlyConverted)} (${formatCurrency(result.carMonthlyConverted)})`,
    },
    {
      category: '지출',
      item: '대출 이자',
      input: (
        <InlineAmountInput
          label="월 대출 이자"
          value={formData.loanInterestMonthly}
          onChange={(value) => onPatchFormData({ loanInterestMonthly: value })}
        />
      ),
      monthly: formatCompactCurrency(formData.loanInterestMonthly),
      annual: formatCompactCurrency(formData.loanInterestMonthly * 12),
      tenYear: formatCompactCurrency(
        formData.loanInterestMonthly * 12 * Math.min(formData.loanInterestYears, formData.simulationYears),
      ),
      note:
        formData.loanInterestMonthly > 0 && formData.loanInterestYears > 0
          ? `${Math.min(formData.loanInterestYears, formData.simulationYears)}년치 반영`
          : '미반영',
    },
    {
      category: '결과',
      item: '흑자/적자',
      input: `월 총지출 ${formatCompactCurrency(result.totalExpenseMonthly)}`,
      monthly: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
      annual: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
      tenYear: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
      note: `위험도: ${getRiskLabel(result.riskLevel)}`,
    },
  ],
    [
      dividendBasisLabel,
      fixedExpenseAnnualBase,
      fixedExpenseMonthlyBase,
      formData,
      householdSummary,
      housingRowLabel,
      housingRowNote,
      onPatchFormData,
      result,
    ],
  )

  return (
    <section className="screen result-screen">
      <div className="screen-header result-screen-header">
        <div>
          <h1 className="screen-title">결과 요약</h1>
        </div>
        {headerAction ? (
          <div className="result-screen-header-action" data-capture-exclude="true">
            {headerAction}
          </div>
        ) : null}
      </div>

      <div ref={captureRef} className="result-capture">
        <CashFlowChart result={result} inflationEnabled={formData.inflationEnabled} inflationRateAnnual={formData.inflationRateAnnual} projectionYears={formData.simulationYears} />

        <SummaryCards result={result} projectionYears={formData.simulationYears} />

        <section className="result-panel projection-panel">
          <div className="projection-inline-row">
            <div className="title-with-help projection-inline-title">
              <span className="projection-inline-label">물가상승율</span>
              <HelpPopover
                detail="현재 물가반영은 생활비·고정지출·월세만 매년 상승시키고, 건강보험료와 재산세는 고정으로 둡니다."
                label="물가반영 설명 보기"
                align="left"
              />
            </div>
            <div className="projection-inline-controls">
              <label className="projection-inline-input">
                <div className="input-shell">
                  <input
                    className="input-control"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={Math.round(formData.inflationRateAnnual * 100)}
                    aria-label="물가상승율"
                    onWheel={(event) => {
                      if (document.activeElement === event.currentTarget) {
                        event.currentTarget.blur()
                      }
                    }}
                    onChange={(event) => {
                      const rawValue = Number(event.target.value) || 0
                      onPatchFormData({ inflationRateAnnual: rawValue / 100 })
                    }}
                  />
                </div>
                <span className="input-suffix">%</span>
              </label>
              <InflationSwitch
                enabled={formData.inflationEnabled}
                onToggle={(nextValue) => onPatchFormData({ inflationEnabled: nextValue })}
              />
            </div>
          </div>
        </section>

        <ResultInterpretation items={interpretationItems} />

        <section className="result-panel">
          <div className="panel-header">
            <div>
              <h2>결과표</h2>
            </div>
          </div>
          <p className="table-scroll-hint">결과표는 좌우로 밀어서 확인할 수 있어요.</p>
          <ResultTable rows={rows} />
        </section>
      </div>

      <div className="footer-actions footer-actions-wrap result-actions">
        <PrimaryButton variant="secondary" onClick={onEditAnswers}>
          수정
        </PrimaryButton>
        <PrimaryButton onClick={onOpenSaveSlots}>저장</PrimaryButton>
        <PrimaryButton onClick={handleShareImage} disabled={exportState !== 'idle'}>
          {exportState === 'sharing' ? '공유 중...' : '공유'}
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onStartOver}>
          처음으로
        </PrimaryButton>
      </div>

      {exportMessage ? <p className="action-feedback">{exportMessage}</p> : null}

      <details className="help-drawer result-panel">
        <summary className="help-drawer-toggle">
          <span>도움말</span>
          <span className="help-drawer-toggle-copy">열기 / 닫기</span>
        </summary>
        <div className="help-drawer-body">
          <div className="notice-stack help-drawer-stack">
            <div className="notice-card">
              <h2>정책 기준 안내</h2>
              <p>{result.policyStatus}</p>
            </div>
            <div className="notice-card">
              <h2>배당세 반영 기준</h2>
              <p>
                일반계좌는 {policyConfig.dividendWithholding.note}를 반영했고, 금융소득은 본인과
                배우자를 나눠 연 2,000만원 초과 여부를 따로 판정합니다. ISA는 {policyConfig.isa.note}
              </p>
            </div>
            <div className="notice-card">
              <h2>주택세·건강보험 기준</h2>
              <p>
                {policyConfig.holdingTax.note} 건강보험은 {policyConfig.healthInsurance.approximationNotice}
              </p>
            </div>
            <div className="notice-card">
              <h2>대출 주의문구</h2>
              <p>
                {result.loanNotice
                  ? '대출이 있다고 표시했습니다. 이 프로토타입은 대출 상환액을 계산에 포함하지 않으므로 실제 월 현금흐름은 달라질 수 있습니다.'
                  : '대출금이 있는 경우 실제 월 현금흐름 결과는 달라질 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}

