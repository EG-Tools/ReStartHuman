import { memo } from 'react'
import type { RetireCalcResult } from '../../types/retireCalc'
import {
  formatCompactCurrency,
  formatSignedCompactCurrency,
} from '../../utils/format'
import {
  getRiskLabel,
  type ResultRow,
} from './resultScreen.helpers'

type SummaryValueChunk = {
  key: string
  numberText: string
  unitText?: string
}

const splitSummaryValueChunks = (value: string): SummaryValueChunk[] => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const eokMatched = normalized.match(/^([+-]?[\d.,]+)억(?:\s*([\d.,]+))?(만원)?$/)

  if (eokMatched) {
    const chunks: SummaryValueChunk[] = [
      {
        key: 'primary',
        numberText: eokMatched[1],
        unitText: '억',
      },
    ]

    if (eokMatched[2] || eokMatched[3]) {
      chunks.push({
        key: 'secondary',
        numberText: eokMatched[2] ?? '',
        unitText: eokMatched[3] ?? undefined,
      })
    }

    return chunks
  }

  const simpleMatched = normalized.match(/^([+-]?[\d.,]+)(만원)$/)

  if (simpleMatched) {
    return [
      {
        key: 'single',
        numberText: simpleMatched[1],
        unitText: simpleMatched[2] ?? undefined,
      },
    ]
  }

  const fallbackMatched = normalized.match(/^([+-]?[\d.,]+)(.*)$/)

  if (!fallbackMatched) {
    return [
      {
        key: 'single',
        numberText: normalized,
      },
    ]
  }

  return [
    {
      key: 'single',
      numberText: fallbackMatched[1],
      unitText: fallbackMatched[2].trim() || undefined,
    },
  ]
}

export const SummaryCards = memo(function SummaryCards({
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
      label: `${projectionYears} 년 결과`,
      value: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
      tone: result.riskLevel,
    },
  ]

  return (
    <div className="summary-grid">
      {cards.map((card) => {
        const chunks = splitSummaryValueChunks(card.value)

        return (
          <article key={card.label} className={`summary-card tone-${card.tone}`}>
            <p>{card.label}</p>
            <h2 className="summary-value-heading">
              <span className="summary-value">
                {chunks.map((chunk) => (
                  <span key={chunk.key} className="summary-value-chunk">
                    <span className="summary-value-number">{chunk.numberText}</span>
                    {chunk.unitText ? (
                      <span className="summary-value-unit">{chunk.unitText}</span>
                    ) : null}
                  </span>
                ))}
              </span>
            </h2>
          </article>
        )
      })}
    </div>
  )
})

const formatYAxisEok = (value: number) => {
  const eokValue = value / 100_000_000
  return `${eokValue.toFixed(2)} 억`
}

export const CashFlowChart = memo(function CashFlowChart({
  result,
  inflationEnabled,
  inflationRateAnnual,
  projectionYears,
  currentAge,
}: {
  result: RetireCalcResult
  inflationEnabled: boolean
  inflationRateAnnual: number
  projectionYears: number
  currentAge: number
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
  const paddingBottom = 34
  const borderGapLeft = 10
  const borderGapRight = 10
  const borderGapTop = 10
  const borderGapBottom = 10
  const yLabelGap = 8
  const xLabelGap = 4
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
  const xTicks = [0, midYear1, midYear2, totalYears].map((yearOffset) => ({
    yearOffset,
    ageLabel: `${currentAge + yearOffset}세`,
    x: paddingLeft + (Math.min(yearOffset, totalYears) / totalYears) * chartWidth,
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

        {xTicks.map((tick) => {
          const textAnchor =
            tick.yearOffset === 0 ? 'start' : tick.yearOffset === totalYears ? 'end' : 'middle'
          const labelY = borderY + borderHeight + xLabelGap + 2
          return (
            <g key={`x-tick-${tick.yearOffset}`}>
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
                y={labelY}
                textAnchor={textAnchor}
                dominantBaseline="hanging"
                style={{
                  fill: '#d6e1e5',
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {tick.ageLabel}
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
})

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

export const ResultTable = memo(function ResultTable({
  rows,
  projectionYears,
}: {
  rows: ResultRow[]
  projectionYears: number
}) {
  return (
    <div className="table-shell">
      <table className="result-table">
        <colgroup>
          <col className="result-col-item" />
          <col className="result-col-input" />
          <col className="result-col-monthly" />
          <col className="result-col-annual" />
          <col className="result-col-horizon" />
          <col className="result-col-note" />
        </colgroup>
        <thead>
          <tr>
            <th><span className="result-head-text">구분</span></th>
            <th><span className="result-head-text">입력값</span></th>
            <th className="result-col-monthly"><span className="result-head-text">월 기준</span></th>
            <th className="result-col-annual-cell"><span className="result-head-text">1년 결과</span></th>
            <th className="result-col-horizon-cell"><span className="result-head-text">{projectionYears}년 결과</span></th>
            <th className="result-note-cell"><span className="result-head-text">비고</span></th>
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
              <td className="result-col-monthly">{row.monthly}</td>
              <td className="result-col-annual-cell">{row.annual}</td>
              <td className="result-col-horizon-cell">{row.tenYear}</td>
              <td className="result-note-cell">
                <div className="note-cell">
                  <span className="note-cell-text">{row.note}</span>
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

export const ResultInterpretation = memo(function ResultInterpretation({
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
