import assert from 'node:assert/strict'
import test from 'node:test'
import { rebalanceSplitAmounts, splitAmountEvenly } from '../src/utils/splitAllocations'

test('splitAmountEvenly divides the total into an even 50:50 allocation', () => {
  assert.deepEqual(splitAmountEvenly(5_000), {
    mineAmount: 2_500,
    spouseAmount: 2_500,
  })
})

test('rebalanceSplitAmounts keeps a 50:50 split when the total amount changes', () => {
  assert.deepEqual(
    rebalanceSplitAmounts({
      nextTotalAmount: 200_000_000,
      previousTotalAmount: 5_000,
      currentMineAmount: 2_500,
    }),
    {
      mineAmount: 100_000_000,
      spouseAmount: 100_000_000,
    },
  )
})

test('rebalanceSplitAmounts preserves a manually adjusted ratio when the total amount changes', () => {
  assert.deepEqual(
    rebalanceSplitAmounts({
      nextTotalAmount: 200_000_000,
      previousTotalAmount: 5_000,
      currentMineAmount: 1_000,
    }),
    {
      mineAmount: 40_000_000,
      spouseAmount: 160_000_000,
    },
  )
})

test('rebalanceSplitAmounts falls back to 50:50 when there is no previous total', () => {
  assert.deepEqual(
    rebalanceSplitAmounts({
      nextTotalAmount: 200_000_000,
      previousTotalAmount: 0,
      currentMineAmount: 0,
    }),
    {
      mineAmount: 100_000_000,
      spouseAmount: 100_000_000,
    },
  )
})
