const wonFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

export const formatCurrency = (value: number) =>
  `${wonFormatter.format(Math.round(value))}원`

export const formatCompactCurrency = (value: number) => {
  const absoluteValue = Math.abs(value)

  if (absoluteValue >= 100_000_000) {
    return `${decimalFormatter.format(value / 100_000_000)}억원`
  }

  if (absoluteValue >= 10_000) {
    return `${decimalFormatter.format(value / 10_000)}만원`
  }

  return formatCurrency(value)
}

export const formatSignedCurrency = (value: number) => {
  if (value === 0) {
    return formatCurrency(0)
  }

  const sign = value > 0 ? '+' : '-'
  return `${sign}${formatCurrency(Math.abs(value))}`
}

export const formatSignedCompactCurrency = (value: number) => {
  if (value === 0) {
    return formatCompactCurrency(0)
  }

  const sign = value > 0 ? '+' : '-'
  return `${sign}${formatCompactCurrency(Math.abs(value))}`
}

export const formatNumber = (value: number) =>
  wonFormatter.format(Math.round(value))

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value)

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

