export interface SplitAllocationAmounts {
  mineAmount: number
  spouseAmount: number
}

const sanitizeWholeAmount = (value: number) => Math.max(Math.round(value), 0)

export const splitAmountEvenly = (totalAmount: number): SplitAllocationAmounts => {
  const safeTotalAmount = sanitizeWholeAmount(totalAmount)
  const mineAmount = Math.round(safeTotalAmount / 2)

  return {
    mineAmount,
    spouseAmount: Math.max(safeTotalAmount - mineAmount, 0),
  }
}

export const rebalanceSplitAmounts = ({
  nextTotalAmount,
  previousTotalAmount,
  currentMineAmount,
}: {
  nextTotalAmount: number
  previousTotalAmount: number
  currentMineAmount: number
}): SplitAllocationAmounts => {
  const safeNextTotalAmount = sanitizeWholeAmount(nextTotalAmount)
  const safePreviousTotalAmount = sanitizeWholeAmount(previousTotalAmount)

  if (safeNextTotalAmount <= 0) {
    return {
      mineAmount: 0,
      spouseAmount: 0,
    }
  }

  if (safePreviousTotalAmount <= 0) {
    return splitAmountEvenly(safeNextTotalAmount)
  }

  const safeCurrentMineAmount = Math.min(
    Math.max(Math.round(currentMineAmount), 0),
    safePreviousTotalAmount,
  )
  const mineRatio = safeCurrentMineAmount / safePreviousTotalAmount
  const mineAmount = Math.min(
    Math.max(Math.round(safeNextTotalAmount * mineRatio), 0),
    safeNextTotalAmount,
  )

  return {
    mineAmount,
    spouseAmount: Math.max(safeNextTotalAmount - mineAmount, 0),
  }
}
