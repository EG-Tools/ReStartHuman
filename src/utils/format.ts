const wonFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
})

const formatRoundedManwon = (absoluteValue: number) => {
  const roundedManwon = Math.round(absoluteValue / 10_000)

  if (roundedManwon >= 10_000) {
    const eok = Math.floor(roundedManwon / 10_000)
    const manwon = roundedManwon % 10_000

    if (manwon === 0) {
      return `${decimalFormatter.format(eok)}억`
    }

    return `${decimalFormatter.format(eok)}억 ${decimalFormatter.format(manwon)}만원`
  }

  return `${decimalFormatter.format(roundedManwon)}만원`
}

export const formatCurrency = (value: number) => {
  const roundedValue = Math.round(value)
  const sign = roundedValue < 0 ? '-' : ''
  const absoluteValue = Math.abs(roundedValue)

  if (absoluteValue >= 100_000_000) {
    return `${sign}${formatRoundedManwon(absoluteValue)}`
  }

  return `${sign}${wonFormatter.format(absoluteValue)}원`
}

export const formatCompactCurrency = (value: number) => {
  const roundedValue = Math.round(value)
  const sign = roundedValue < 0 ? '-' : ''
  const absoluteValue = Math.abs(roundedValue)

  if (absoluteValue >= 10_000) {
    return `${sign}${formatRoundedManwon(absoluteValue)}`
  }

  return formatCurrency(roundedValue)
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