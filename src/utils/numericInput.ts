const getDecimalPlaces = (step: number) => {
  if (!Number.isFinite(step) || step <= 0 || Number.isInteger(step)) {
    return 0
  }

  const [, decimalPart = ''] = String(step).split('.')
  return Math.min(decimalPart.length, 4)
}

export const getNumericInputPrecision = (step = 1) => getDecimalPlaces(step)

export const roundNumericInputValue = (value: number, precision: number) => {
  if (precision <= 0) {
    return Math.round(value)
  }

  const multiplier = 10 ** precision
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier
}

export const formatNumericDraftValue = (
  value: number,
  precision: number,
  showZero = false,
) => {
  if (!Number.isFinite(value)) {
    return ''
  }

  const roundedValue = roundNumericInputValue(value, precision)
  return roundedValue !== 0 || showZero ? String(roundedValue) : ''
}

export const hasNumericDraftChanged = (initialDraft: string | null, nextDraft: string | null) =>
  initialDraft !== null && nextDraft !== null && initialDraft !== nextDraft

export const sanitizeNumericDraftValue = (rawValue: string, precision: number) => {
  const compactValue = rawValue.replace(/,/g, '')

  if (precision <= 0) {
    return compactValue.replace(/[^\d]/g, '')
  }

  const numericValue = compactValue.replace(/[^\d.]/g, '')
  const decimalPointIndex = numericValue.indexOf('.')

  if (decimalPointIndex < 0) {
    return numericValue
  }

  const integerPart = numericValue.slice(0, decimalPointIndex)
  const decimalPart = numericValue
    .slice(decimalPointIndex + 1)
    .replace(/\./g, '')
    .slice(0, precision)

  return `${integerPart}.${decimalPart}`
}

export const parseNumericDraftValue = ({
  rawValue,
  min,
  max,
  precision,
}: {
  rawValue: string
  min: number
  max?: number
  precision: number
}) => {
  const parsedValue = Number(rawValue)
  const finiteValue = Number.isFinite(parsedValue) ? parsedValue : 0
  const boundedValue = Math.max(finiteValue, min)
  const maxBoundedValue = max === undefined ? boundedValue : Math.min(boundedValue, max)

  return roundNumericInputValue(maxBoundedValue, precision)
}
