import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { buildResultRows } from '../src/components/result/resultScreen.editors'
import { getAccessModeFormData } from '../src/utils/accessMode'
import { readFormDraft, writeFormDraft, FORM_DRAFT_STORAGE_KEY } from '../src/utils/draftStorage'
import { formatCompactCurrency } from '../src/utils/format'
import { getCarHoldingYears } from '../src/utils/expensePeriods'
import {
  createSaveSlotRecord,
  getSaveSlotStorageKey,
  readSaveSlotRecords,
  writeSaveSlotRecord,
} from '../src/utils/saveSlots'

const carScenario = {
  ...defaultFormData,
  simulationYears: 3,
  inflationEnabled: false,
  cashInterestRatePercent: 0,
  healthInsuranceOverrideMonthly: 0,
  startingCashReserve: 10_000_000,
  livingCostInputMode: 'total' as const,
  livingCostMonthlyTotal: 100_000,
  hasCar: true,
  carYearlyCost: 1_200_000,
  carHoldingYears: 2,
}

test('car expenses stop after the holding period while living expenses continue', () => {
  const result = calculateAlphaScenario(carScenario)

  assert.equal(result.carMonthlyConverted, 100_000)
  assert.equal(result.totalExpenseMonthly, 200_000)
  assert.equal(result.projectionCarExpenseTotal, 2_400_000)
  assert.equal(result.projectionLivingExpenseTotal, 3_600_000)
  assert.equal(result.projectionFixedExpenseTotal, 0)
  assert.deepEqual(result.cashBalanceTimeline.map(({ balance }) => balance), [
    10_000_000, 7_600_000, 5_200_000, 4_000_000,
  ])
  assert.equal(result.cashBalanceAfterTenYears, 4_000_000)
})

test('zero or invalid car holding years exclude car costs from current and projected results', () => {
  for (const carHoldingYears of [0, -2, Number.NaN]) {
    const result = calculateAlphaScenario({ ...carScenario, carHoldingYears })
    const withoutCar = calculateAlphaScenario({ ...carScenario, carYearlyCost: 0 })

    assert.equal(result.carMonthlyConverted, 0)
    assert.equal(result.projectionCarExpenseTotal, 0)
    assert.equal(result.fixedExpenseMonthly, withoutCar.fixedExpenseMonthly)
    assert.equal(result.totalExpenseMonthly, withoutCar.totalExpenseMonthly)
    assert.equal(result.monthlySurplusOrDeficit, withoutCar.monthlySurplusOrDeficit)
    assert.equal(result.yearlySurplusOrDeficit, withoutCar.yearlySurplusOrDeficit)
    assert.equal(result.riskLevel, withoutCar.riskLevel)
    assert.deepEqual(result.cashBalanceTimeline, withoutCar.cashBalanceTimeline)
    assert.equal(result.cashBalanceAfterTenYears, 6_400_000)
  }
})

test('car holding periods at or beyond the projection end only charge the projected years', () => {
  for (const carHoldingYears of [3, 10]) {
    const result = calculateAlphaScenario({ ...carScenario, carHoldingYears })

    assert.equal(result.projectionCarExpenseTotal, 3_600_000)
    assert.equal(result.cashBalanceAfterTenYears, 2_800_000)
  }
})

test('inflation applies to car expenses only during the holding period', () => {
  const result = calculateAlphaScenario({
    ...carScenario,
    inflationEnabled: true,
    inflationRateAnnual: 0.05,
  })

  assert.equal(result.projectionCarExpenseTotal, 2_460_000)
  assert.equal(result.projectionLivingExpenseTotal, 3_783_000)
  assert.deepEqual(result.cashBalanceTimeline.map(({ balance }) => balance), [
    10_000_000, 7_600_000, 5_080_000, 3_757_000,
  ])
  assert.equal(result.cashBalanceAfterTenYears, 3_757_000)
})

test('car, insurance, and loan expenses each stop at their own configured duration', () => {
  const result = calculateAlphaScenario({
    ...carScenario,
    insuranceMonthly: 50_000,
    insurancePaymentYears: 3,
    hasLoan: true,
    loanInterestMonthly: 100_000,
    loanInterestYears: 1,
  })

  assert.equal(result.projectionCarExpenseTotal, 2_400_000)
  assert.equal(result.projectionFixedExpenseTotal, 1_800_000)
  assert.equal(result.projectionLoanInterestTotal, 1_200_000)
  assert.equal(result.projectionLivingExpenseTotal, 3_600_000)
  assert.deepEqual(result.cashBalanceTimeline.map(({ balance }) => balance), [
    10_000_000, 5_800_000, 2_800_000, 1_000_000,
  ])
})

test('car result rows show the effective period and matching monthly, annual, and cumulative expenses', () => {
  for (const carHoldingYears of [0, 2, 10]) {
    const formData = { ...carScenario, carHoldingYears }
    const result = calculateAlphaScenario(formData)
    const rows = buildResultRows({
      dividendBasisLabel: '세전 입력',
      fixedExpenseAnnualBase: result.fixedExpenseMonthly * 12,
      fixedExpenseMonthlyBase: result.fixedExpenseMonthly,
      formData,
      householdSummary: '본인',
      housingRowLabel: '자가',
      housingRowNote: '',
      onPatchFormData: () => {},
      result,
    })
    const carRow = rows.find(({ item }) => item === '차량유지비')

    assert.ok(carRow)
    assert.equal(carRow.monthly, formatCompactCurrency(carHoldingYears > 0 ? 100_000 : 0))
    assert.equal(carRow.annual, formatCompactCurrency(carHoldingYears > 0 ? 1_200_000 : 0))
    assert.equal(carRow.tenYear, formatCompactCurrency(result.projectionCarExpenseTotal))
    assert.equal(carRow.note, carHoldingYears > 0 ? `${Math.min(carHoldingYears, 3)}년치 반영` : '미반영')
  }
})

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(key: string) { return this.store.get(key) ?? null }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null }
  removeItem(key: string) { this.store.delete(key) }
  setItem(key: string, value: string) { this.store.set(key, value) }
}

test('save slots and drafts retain automatic, positive, and explicitly zero car holding periods', () => {
  const storage = new MemoryStorage()
  for (const carHoldingYears of [null, 0, 2]) {
    const formData = { ...carScenario, carHoldingYears }
    const result = calculateAlphaScenario(formData)
    writeFormDraft(storage, formData)
    writeSaveSlotRecord(storage, createSaveSlotRecord(1, formData, result))

    for (const loaded of [readFormDraft(storage), readSaveSlotRecords(storage)[0]?.formData]) {
      assert.ok(loaded)
      assert.equal(loaded.carHoldingYears, carHoldingYears)
      assert.deepEqual(calculateAlphaScenario(loaded).cashBalanceTimeline, result.cashBalanceTimeline)
    }
  }
})

test('legacy drafts and slots use age-based car holding years when the field is absent', () => {
  const storage = new MemoryStorage()
  const legacyFormData: Record<string, unknown> = { ...carScenario, simulationYears: 50 }
  delete legacyFormData.carHoldingYears
  storage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    formData: legacyFormData,
  }))
  storage.setItem(getSaveSlotStorageKey(1), JSON.stringify({
    version: 1,
    ...createSaveSlotRecord(1, carScenario, calculateAlphaScenario(carScenario)),
    formData: legacyFormData,
  }))

  for (const loaded of [readFormDraft(storage), readSaveSlotRecords(storage)[0]?.formData]) {
    assert.ok(loaded)
    assert.equal(loaded.carHoldingYears, null)
    assert.equal(getCarHoldingYears(loaded), 30)
    assert.equal(calculateAlphaScenario(loaded).projectionCarExpenseTotal, 36_000_000)
    assert.equal(calculateAlphaScenario({ ...loaded, carHoldingYears: 2 }).projectionCarExpenseTotal, 2_400_000)
  }
})

test('automatic car holding years follow age up to 80 and are applied to final cash', () => {
  for (const [currentAge, expectedYears] of [[50, 30], [60, 20], [79, 1], [80, 0], [85, 0]]) {
    const formData = {
      ...carScenario,
      simulationYears: 50,
      currentAge,
      carHoldingYears: defaultFormData.carHoldingYears,
      livingCostMonthlyTotal: 0,
    }
    const result = calculateAlphaScenario(formData)

    assert.equal(getCarHoldingYears(formData), expectedYears)
    assert.equal(result.projectionCarExpenseTotal, expectedYears * 1_200_000)
    assert.equal(result.cashBalanceAfterTenYears, 10_000_000 - expectedYears * 1_200_000)
  }
})

test('explicit car holding periods remain unchanged when age changes', () => {
  for (const currentAge of [50, 60, 85]) {
    assert.equal(getCarHoldingYears({ ...carScenario, currentAge }), 2)
    assert.equal(getCarHoldingYears({ ...carScenario, currentAge, carHoldingYears: 0 }), 0)
  }
})

test('a 50-year period entered at age 50 charges car costs until age 100', () => {
  const result = calculateAlphaScenario({
    ...carScenario,
    currentAge: 50,
    carHoldingYears: 50,
    simulationYears: 60,
    livingCostMonthlyTotal: 0,
  })

  assert.equal(result.projectionCarExpenseTotal, 60_000_000)
  assert.equal(result.cashBalanceTimeline[50].balance, -50_000_000)
  assert.equal(result.cashBalanceTimeline[51].balance, -50_000_000)
  assert.equal(result.cashBalanceAfterTenYears, -50_000_000)
})

test('general-mode living expenses do not absorb expired car costs', () => {
  const generalData = getAccessModeFormData({
    ...carScenario,
    livingCostInputMode: 'detailed',
    foodMonthly: 100_000,
    carHoldingYears: 0,
  }, 'general')

  assert.equal(generalData.livingCostMonthlyTotal, 100_000)
  assert.equal(generalData.carHoldingYears, 0)
})
