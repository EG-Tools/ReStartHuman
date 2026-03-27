import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { buildResultRows } from '../src/components/result/resultScreen.editors'

const buildRows = (formData = defaultFormData) => {
  const result = calculateAlphaScenario(formData)

  return buildResultRows({
    dividendBasisLabel: '세전 입력',
    fixedExpenseAnnualBase: result.fixedExpenseMonthly * 12,
    fixedExpenseMonthlyBase: result.fixedExpenseMonthly,
    formData,
    householdSummary: '본인',
    housingRowLabel: '자가',
    housingRowNote: '테스트',
    onPatchFormData: () => {},
    result,
  })
}

test('결과표는 입력된 유입이 없으면 총 유입 설명을 비워진 상태로 보여준다', () => {
  const rows = buildRows({
    ...defaultFormData,
    taxableAccountDividendAnnual: 0,
    isaDividendAnnual: 0,
    pensionMonthlyAmount: 0,
    otherIncomeType: 'none',
    otherIncomeMonthly: 0,
  })

  const totalIncomeRow = rows.find((row) => row.item === '총 유입')
  assert.equal(totalIncomeRow?.input, '입력된 유입 없음')
})

test('결과표는 차량 관련 입력이 없으면 차량 행들을 숨긴다', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasCar: false,
    currentCarMarketValue: 0,
    carYearlyCost: 0,
  })

  assert.ok(!rows.some((row) => row.item === '차량 시세'))
  assert.ok(!rows.some((row) => row.item === '차량유지비'))
})

test('결과표는 차량 관련 입력이 있으면 차량 행들을 보여준다', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasCar: true,
    currentCarMarketValue: 12_000_000,
    carYearlyCost: 1_200_000,
  })

  assert.ok(rows.some((row) => row.item === '차량 시세'))
  assert.ok(rows.some((row) => row.item === '차량유지비'))
})

test('결과표는 대출 플래그만 켜져 있어도 대출 이자 행을 보여준다', () => {
  const rows = buildRows({
    ...defaultFormData,
    hasLoan: true,
    loanInterestMonthly: 0,
    loanInterestYears: 0,
  })

  assert.ok(rows.some((row) => row.item === '대출 이자'))
})

test('대출 이자 행은 시뮬레이션 기간보다 긴 대출 기간을 자동으로 잘라서 표시한다', () => {
  const formData = {
    ...defaultFormData,
    hasLoan: true,
    simulationYears: 10,
    loanInterestMonthly: 200_000,
    loanInterestYears: 20,
  }
  const rows = buildRows(formData)
  const loanRow = rows.find((row) => row.item === '대출 이자')

  assert.equal(loanRow?.note, '10년치 반영')
})

test('결과표는 기타 소득 유형과 금액이 있을 때만 기타 소득 행을 보여준다', () => {
  const hiddenRows = buildRows({
    ...defaultFormData,
    otherIncomeType: 'none',
    otherIncomeMonthly: 5_000_000,
  })
  const visibleRows = buildRows({
    ...defaultFormData,
    otherIncomeType: 'business',
    otherIncomeMonthly: 5_000_000,
  })

  assert.ok(!hiddenRows.some((row) => row.item === '기타 소득'))
  assert.ok(visibleRows.some((row) => row.item === '기타 소득'))
})
