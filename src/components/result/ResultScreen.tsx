import { useRef, useState, type ReactNode } from 'react'
import { toBlob } from 'html-to-image'
import { policyConfig } from '../../config/policyConfig'
import { NumericInput, PrimaryButton } from '../common/Ui'
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
      : `귀속: ${ownershipSummary}, ${limitSummary}, 총 비과세 반영 ${formatCompactCurrency(result.isaTaxFreeLimitApplied)}, 초과분이 없어 추가 세금 없음, 종합소득세 합산 제외`
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

const getComprehensiveTaxNote = (result: RetireCalcResult) => {
  const allocationSummary = result.comprehensiveTaxBreakdown
    .map((item) => `${item.label} ${formatCompactCurrency(item.attributedDividendAnnual)}`)
    .join(', ')
  const additionalSummary = result.comprehensiveTaxBreakdown
    .filter((item) => item.additionalTaxAnnual > 0)
    .map((item) => `${item.label} 추가 ${formatCompactCurrency(item.additionalTaxAnnual)}`)
    .join(', ')

  if (!result.comprehensiveTaxIncluded) {
    return `종합과세는 일반계좌 배당만 반영합니다. ISA는 합산 제외, 일반계좌 귀속은 ${allocationSummary}`
  }

  if (additionalSummary.length === 0) {
    return `종합과세는 일반계좌 배당만 반영합니다. ISA는 합산 제외, 일반계좌 귀속은 ${allocationSummary}. 소득세법 제62조 비교세액 구조 적용 결과 추가 납부는 0원`
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
function SummaryCards({ result }: { result: RetireCalcResult }) {
  const cards = [
    {
      label: '월 실사용 가능액',
      value: formatCompactCurrency(result.monthlyUsableCash),
      tone: 'neutral',
    },
    {
      label: '월 흑자적자',
      value: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
      tone: result.riskLevel,
    },
    {
      label: '1년 결과',
      value: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
      tone: result.riskLevel,
    },
    {
      label: '10년 결과',
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
}

function CashFlowChart({
  result,
  inflationEnabled,
}: {
  result: RetireCalcResult
  inflationEnabled: boolean
}) {
  const points =
    result.cashBalanceTimeline.length > 0
      ? result.cashBalanceTimeline
      : [{ year: 0, balance: result.startingCashReserve }]
  const width = 360
  const height = 196
  const paddingLeft = 58
  const paddingRight = 18
  const paddingTop = 18
  const paddingBottom = 36
  const currentYear = new Date().getFullYear()
  const balances = points.map((point) => point.balance)
  const minBalance = Math.min(...balances)
  const maxBalance = Math.max(...balances)
  const range = maxBalance - minBalance || 1
  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom
  const chartFloorY = height - paddingBottom
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
  const xTicks = [
    { label: '지금', year: currentYear, index: 0 },
    { label: '5년', year: currentYear + 5, index: Math.min(5, points.length - 1) },
    { label: '10년', year: currentYear + 10, index: points.length - 1 },
  ].map((tick) => ({
    ...tick,
    x: getX(tick.index),
  }))

  return (
    <section className={`result-panel cashflow-hero tone-${result.riskLevel}`}>
      <div className="cashflow-hero-header">
        <div>
          <p className="cashflow-hero-eyebrow">10년 현금흐름</p>
          <h2>{formatCompactCurrency(endingBalance)}</h2>
          <p className="cashflow-hero-copy">
            남아있는 현금을 시작점으로 10년 뒤 잔액이 어떻게 변하는지 보여줍니다.
          </p>
        </div>
        <div className="cashflow-hero-meta">
          <span>시작 {formatCompactCurrency(result.startingCashReserve)}</span>
          <span>{inflationEnabled ? '물가반영 On' : '물가반영 Off'}</span>
          <span>10년 후 {formatCompactCurrency(result.cashBalanceAfterTenYears)}</span>
        </div>
      </div>

      <svg
        className="cashflow-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="10년 현금흐름 그래프"
      >
        {yTicks.map((tick) => (
          <g key={`y-tick-${tick.key}`}>
            <line
              className="cashflow-grid-line"
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
            />
            <text className="cashflow-grid-label" x={0} y={tick.y + 4}>
              {formatCompactCurrency(tick.value)}
            </text>
          </g>
        ))}

        <path className="cashflow-chart-area" d={areaPath} />
        <path className="cashflow-chart-line" d={linePath} />

        {xTicks.map((tick) => (
          <line
            key={`x-tick-${tick.year}`}
            className="cashflow-year-tick"
            x1={tick.x}
            y1={chartFloorY}
            x2={tick.x}
            y2={chartFloorY + 6}
          />
        ))}

        {coordinates.map((point, index) => (
          <circle
            key={point.year}
            className={index === coordinates.length - 1 ? 'cashflow-chart-dot is-end' : 'cashflow-chart-dot'}
            cx={point.x}
            cy={point.y}
            r={index === coordinates.length - 1 ? 4.5 : 3}
          />
        ))}
      </svg>

      <div className="cashflow-axis">
        {xTicks.map((tick) => (
          <span key={tick.year}>
            <strong>{tick.label}</strong>
            <em>{tick.year}</em>
          </span>
        ))}
      </div>
    </section>
  )
}
const splitResultItemLabel = (value: string) =>
  value
    .split(/\s+/)
    .flatMap((word) => word.match(/.{1,2}/g) ?? [word])
    .filter((chunk) => chunk.length > 0)

function ResultTable({ rows }: { rows: ResultRow[] }) {
  return (
    <div className="table-shell">
      <table className="result-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>항목</th>
            <th>입력값</th>
            <th>월 기준</th>
            <th>1년 결과</th>
            <th>10년 결과</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.category}-${row.item}`}>
              <td>{row.category}</td>
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
}

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
  helperText,
  action,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
  action?: ReactNode
}) {
  const displayValue = Number.isFinite(value) ? value / MANWON : 0

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
            value={displayValue}
            aria-label={label}
            onWheel={(event) => {
              if (document.activeElement === event.currentTarget) {
                event.currentTarget.blur()
              }
            }}
            onChange={(event) => {
              const rawValue = Number(event.target.value) || 0
              onChange(rawValue * MANWON)
            }}
          />
        </div>
        <span className="table-edit-suffix">만원</span>
        {action ? <div className="table-edit-action">{action}</div> : null}
      </div>
      {helperText ? <span className="table-edit-helper">{helperText}</span> : null}
    </div>
  )
}

function InlineLabeledAmountInput({
  caption,
  label,
  value,
  onChange,
  helperText,
}: {
  caption: string
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
}) {
  return (
    <div className="table-edit-group">
      <span className="table-edit-label">{caption}</span>
      <InlineAmountInput
        label={label}
        value={value}
        onChange={onChange}
        helperText={helperText}
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
      <div className="table-edit-cluster">
        <InlineLabeledAmountInput
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
      helperText={
        result.healthInsuranceSource === 'manual'
          ? '현재 수동 입력'
          : '직접 수정하면 수동값으로 전환'
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
  const lockedBase =
    formData.insuranceMonthly +
    formData.maintenanceMonthly +
    formData.telecomMonthly +
    formData.nationalPensionMonthly
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
      helperText={`기본 ${formatCompactCurrency(lockedBase)} + 기타 ${formatCompactCurrency(formData.otherFixedMonthly)}`}
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
        helperText="총액 입력 모드"
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
      helperText={`세부합계 ${formatCompactCurrency(lockedBase)} + 기타 ${formatCompactCurrency(formData.otherLivingMonthly)}`}
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
}: ResultScreenProps) {
  const dividendBasisLabel =
    result.dividendInputMode === 'gross'
      ? '배당 입력 기준: 세전'
      : '배당 입력 기준: 세후'

  const fixedExpenseMonthlyBase =
    formData.insuranceMonthly +
    formData.maintenanceMonthly +
    formData.telecomMonthly +
    formData.nationalPensionMonthly +
    formData.otherFixedMonthly
  const fixedExpenseAnnualBase = fixedExpenseMonthlyBase * 12
  const captureRef = useRef<HTMLDivElement | null>(null)
  const [exportState, setExportState] = useState<'idle' | 'sharing'>('idle')
  const [exportMessage, setExportMessage] = useState<string | null>(null)

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
      const blob = await toBlob(node, {
        backgroundColor: '#f6f1e7',
        pixelRatio: 2,
        cacheBust: true,
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
          title: '은퇴 현금흐름 결과',
          files: [file],
        })
        setExportMessage('결과 이미지를 공유했습니다.')
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: '은퇴 현금흐름 결과',
          text: '이미지 공유가 지원되지 않아 링크 공유로 전환했습니다.',
          url: window.location.href,
        })
        setExportMessage('이 기기에서는 링크 공유로 전환했습니다.')
        return
      }

      downloadResultImage(blob)
      setExportMessage('이 기기에서는 공유가 지원되지 않아 이미지 저장으로 전환했습니다.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportMessage('공유를 취소했습니다.')
      } else {
        setExportMessage('결과 이미지를 공유하지 못했습니다.')
      }
    } finally {
      setExportState('idle')
    }
  }

  const rows: ResultRow[] = [
    {
      category: '기본',
      item: '가구 형태',
      input: formData.householdType === 'couple' ? '부부 합산' : '본인만',
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note: dividendBasisLabel,
    },
    {
      category: '주거',
      item: '주거 형태',
      input:
        formData.housingType === 'own'
          ? '자가'
          : formData.housingType === 'jeonse'
            ? '전세'
            : '월세',
      monthly:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost)
          : '—',
      annual: '—',
      tenYear: '—',
      note:
        formData.housingType === 'own'
          ? '재산세 추정 포함'
          : '비자가 주거는 주택세 0원 처리',
    },
    {
      category: '주거',
      item: '주거 금액',
      input: (
        <HousingAmountEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note:
        formData.housingType === 'own'
          ? '시가 / 공시가격'
          : '주거 입력값 표시',
    },
    {
      category: '세금',
      item: '주택 재산세 추정',
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
          ? formatCompactCurrency(result.holdingTaxAnnual * 10)
          : '—',
      note:
        formData.housingType === 'own'
          ? '2025 완화비율'
          : '자가가 아니면 0원 처리',
      noteDetail:
        formData.housingType === 'own' ? policyConfig.holdingTax.note : undefined,
    },
    {
      category: '배당',
      item: '일반계좌 배당',
      input: (
        <InlineAmountInput
          label="일반계좌 연간 배당금"
          value={formData.taxableAccountDividendAnnual}
          onChange={(value) => onPatchFormData({ taxableAccountDividendAnnual: value })}
          helperText={result.dividendInputMode === 'gross' ? '세전 입력' : '세후 입력'}
        />
      ),
      monthly: formatCompactCurrency(result.taxableDividendMonthlyNet),
      annual: formatCompactCurrency(result.taxableDividendAnnualNet),
      tenYear: formatCompactCurrency(result.taxableDividendAnnualNet * 10),
      note: '원천징수 15.4%',
      noteDetail: getTaxableDividendNote(result),
    },
    {
      category: '배당',
      item: 'ISA 배당',
      input: (
        <InlineAmountInput
          label="ISA 연간 배당금"
          value={formData.isaDividendAnnual}
          onChange={(value) => onPatchFormData({ isaDividendAnnual: value })}
          helperText={result.dividendInputMode === 'gross' ? '세전 입력' : '세후 입력'}
        />
      ),
      monthly: formatCompactCurrency(result.isaDividendMonthlyNet),
      annual: formatCompactCurrency(result.isaDividendAnnualNet),
      tenYear: formatCompactCurrency(result.isaDividendAnnualNet * 10),
      note: 'ISA 특례',
      noteDetail: getIsaDividendNote(result),
    },
    {
      category: '배당',
      item: '연금계좌 배당',
      input: (
        <InlineAmountInput
          label="연금계좌 연간 배당금"
          value={formData.pensionDividendAnnual}
          onChange={(value) => onPatchFormData({ pensionDividendAnnual: value })}
          helperText={result.dividendInputMode === 'gross' ? '세전 입력' : '세후 입력'}
        />
      ),
      monthly: formatCompactCurrency(result.pensionDividendMonthlyNet),
      annual: formatCompactCurrency(result.pensionDividendAnnualNet),
      tenYear: formatCompactCurrency(result.pensionDividendAnnualNet * 10),
      note: '월 총유입에 포함',
    },
    {
      category: '유입',
      item: '월 총유입',
      input: `${formatCompactCurrency(result.totalDividendAnnualNet)} 배당 + ${formatCompactCurrency(result.otherIncomeMonthlyApplied)} 기타소득`,
      monthly: formatCompactCurrency(result.totalIncomeMonthly),
      annual: formatCompactCurrency(result.totalIncomeMonthly * 12),
      tenYear: formatCompactCurrency(
        result.totalIncomeMonthly * 12 * 10,
      ),
      note: '연금 수령액 포함 가능',
    },
    {
      category: '세금',
      item: '종합소득세 영향',
      input: getComprehensiveTaxInput(result),
      monthly: formatCompactCurrency(result.comprehensiveTaxImpactAnnual / 12),
      annual: formatCompactCurrency(result.comprehensiveTaxImpactAnnual),
      tenYear: formatCompactCurrency(result.comprehensiveTaxImpactAnnual * 10),
      note: '일반계좌만 반영',
      noteDetail: getComprehensiveTaxNote(result),
    },
    {
      category: '필수비용',
      item: '건강보험료',
      input: (
        <HealthInsuranceEditor result={result} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(result.healthInsuranceMonthly),
      annual: formatCompactCurrency(result.healthInsuranceMonthly * 12),
      tenYear: formatCompactCurrency(result.healthInsuranceMonthly * 12 * 10),
      note: 'NHIS 단순화',
      noteDetail: policyConfig.healthInsurance.approximationNotice,
    },
    {
      category: '지출',
      item: '고정지출',
      input: (
        <FixedExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(fixedExpenseMonthlyBase),
      annual: formatCompactCurrency(fixedExpenseAnnualBase),
      tenYear: formatCompactCurrency(fixedExpenseAnnualBase * 10),
      note: '차량 제외',
    },
    {
      category: '지출',
      item: '차량유지비',
      input: (
        <InlineAmountInput
          label="자동차 연간 유지비"
          value={formData.carYearlyCost}
          onChange={(value) => onPatchFormData({ carYearlyCost: value })}
          helperText={`월 환산 ${formatCompactCurrency(result.carMonthlyConverted)}`}
        />
      ),
      monthly: formatCompactCurrency(result.carMonthlyConverted),
      annual: formatCompactCurrency(formData.carYearlyCost),
      tenYear: formatCompactCurrency(formData.carYearlyCost * 10),
      note: '연간 ÷ 12',
      noteDetail: `월 환산 ${formatCompactCurrency(result.carMonthlyConverted)} (${formatCurrency(result.carMonthlyConverted)})`,
    },
    {
      category: '지출',
      item: '생활비',
      input: (
        <LivingExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(result.livingExpenseMonthly),
      annual: formatCompactCurrency(result.livingExpenseMonthly * 12),
      tenYear: formatCompactCurrency(result.livingExpenseMonthly * 12 * 10),
      note:
        formData.livingCostInputMode === 'detailed'
          ? '세부 항목 합산'
          : '총액 입력 사용',
    },
    {
      category: '결과',
      item: '월 실사용 가능액',
      input: '월 유입에서 건보료·주택세·종합소득세 반영',
      monthly: formatCompactCurrency(result.monthlyUsableCash),
      annual: formatCompactCurrency(result.monthlyUsableCash * 12),
      tenYear: formatCompactCurrency(result.monthlyUsableCash * 12 * 10),
      note: '생활비와 고정지출 차감 전 금액',
    },
    {
      category: '결과',
      item: '월 흑자적자',
      input: `월 총지출 ${formatCompactCurrency(result.totalExpenseMonthly)}`,
      monthly: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
      annual: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
      tenYear: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
      note: `위험도: ${getRiskLabel(result.riskLevel)}`,
    },
  ]

  return (
    <section className="screen result-screen">
      <div ref={captureRef} className="result-capture">
        <div className="screen-header">
          <div>
            <h1 className="screen-title">현금흐름 결과</h1>
          </div>
          <span className={`risk-pill risk-${result.riskLevel}`}>
            {getRiskLabel(result.riskLevel)}
          </span>
        </div>

        <CashFlowChart result={result} inflationEnabled={formData.inflationEnabled} />

        <SummaryCards result={result} />

        <section className="result-panel projection-panel">
          <div className="panel-header projection-header">
            <div className="title-with-help">
              <h2>물가상승율</h2>
              <HelpPopover
                detail="현재 물가반영은 생활비·고정지출·월세만 매년 상승시키고, 건강보험료와 재산세는 고정으로 둡니다."
                label="물가반영 설명 보기"
                align="left"
              />
            </div>
            <InflationSwitch
              enabled={formData.inflationEnabled}
              onToggle={(nextValue) => onPatchFormData({ inflationEnabled: nextValue })}
            />
          </div>

          <div className="field-grid field-grid-2">
            <NumericInput
              label="시뮬레이션 기간"
              value={formData.simulationYears}
              onChange={(value) => onPatchFormData({ simulationYears: Math.max(1, value) })}
              step={1}
              display="number"
              suffix="년"
            />
            <NumericInput
              label="상승률"
              value={Math.round(formData.inflationRateAnnual * 100)}
              onChange={(value) => onPatchFormData({ inflationRateAnnual: value / 100 })}
              step={0.5}
              display="number"
              suffix="%"
            />
          </div>
        </section>

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
          <span className="help-drawer-toggle-copy">눌러서 열기 / 닫기</span>
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


















