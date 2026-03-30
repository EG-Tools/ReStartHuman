/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import type { AlphaFormData, AlphaResult } from '../../types/alpha'
import { formatCompactCurrency, formatCurrency, formatSignedCompactCurrency } from '../../utils/format'
import { InlineNumericField } from '../common/Ui'
import { buildStructuredIncomePatch, getSelectedIncomeCategories } from '../../utils/incomeStreams'
import { rebalanceSplitAmounts } from '../../utils/splitAllocations'
import {
  getComprehensiveTaxInput,
  getComprehensiveTaxNote,
  getHoldingTaxBreakdownSummary,
  getHoldingTaxInputSummary,
  getHousingTypeLabel,
  getIsaDividendNote,
  getLivingCostSnapshot,
  getPropertyOwnershipLabel,
  getRiskLabel,
  getTaxableDividendNote,
  type ResultRow,
} from './resultScreen.helpers'

export const RESULT_EDIT_CLASS = {
  stack: 'table-edit-stack',
  inline: 'table-edit-inline',
  inlineNoAction: 'table-edit-inline-no-action',
  inlineWithAction: 'table-edit-inline-with-action',
  field: 'table-edit-field',
  input: 'table-edit-input',
  suffix: 'table-edit-suffix',
  action: 'table-edit-action',
  group: 'table-edit-group',
  cluster: 'table-edit-cluster',
  housingCluster: 'table-edit-cluster-housing',
  housingGroup: 'table-edit-group-housing',
  housingMarket: 'table-edit-group-housing-market',
  housingOfficial: 'table-edit-group-housing-official',
  marketGroup: 'table-edit-group-market',
  officialGroup: 'table-edit-group-official',
  captionCenterGroup: 'table-edit-group-caption-center',
} as const

function joinClassNames(...tokens: Array<string | undefined | false | null>) {
  return tokens.filter(Boolean).join(' ')
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
  return (
    <div className={RESULT_EDIT_CLASS.stack}>
      <InlineNumericField
        value={value}
        onChange={onChange}
        min={0}
        step={1}
        display="currency"
        inlineClassName={joinClassNames(
          RESULT_EDIT_CLASS.inline,
          action ? RESULT_EDIT_CLASS.inlineWithAction : RESULT_EDIT_CLASS.inlineNoAction,
        )}
        shellClassName={RESULT_EDIT_CLASS.field}
        inputClassName={RESULT_EDIT_CLASS.input}
        suffixClassName={RESULT_EDIT_CLASS.suffix}
        inputAriaLabel={label}
        action={action ? <div className={RESULT_EDIT_CLASS.action}>{action}</div> : null}
      />
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
  const groupClassName = className
    ? joinClassNames(RESULT_EDIT_CLASS.group, className)
    : RESULT_EDIT_CLASS.group

  return (
    <div className={groupClassName}>
      <span className="table-edit-label">{caption}</span>
      <InlineAmountInput label={label} value={value} onChange={onChange} />
    </div>
  )
}

function HousingAmountEditor({
  formData,
  onPatchFormData,
}: {
  formData: AlphaFormData
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
}) {
  if (formData.housingType === 'own') {
    return (
      <div className={joinClassNames(RESULT_EDIT_CLASS.cluster, RESULT_EDIT_CLASS.housingCluster)}>
        <InlineLabeledAmountInput
          className={joinClassNames(
            RESULT_EDIT_CLASS.housingGroup,
            RESULT_EDIT_CLASS.housingMarket,
            RESULT_EDIT_CLASS.marketGroup,
          )}
          caption="시가"
          label="주택 시가"
          value={formData.homeMarketValue}
          onChange={(value) => onPatchFormData({ homeMarketValue: value })}
        />
        <InlineLabeledAmountInput
          className={joinClassNames(
            RESULT_EDIT_CLASS.housingGroup,
            RESULT_EDIT_CLASS.housingOfficial,
            RESULT_EDIT_CLASS.officialGroup,
          )}
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
        className={joinClassNames(RESULT_EDIT_CLASS.housingGroup, RESULT_EDIT_CLASS.captionCenterGroup)}
        caption="전세보증금"
        label="전세보증금"
        value={formData.jeonseDeposit}
        onChange={(value) => onPatchFormData({ jeonseDeposit: value })}
      />
    )
  }

  return (
    <div className={RESULT_EDIT_CLASS.cluster}>
      <InlineLabeledAmountInput
        className={joinClassNames(RESULT_EDIT_CLASS.housingGroup, RESULT_EDIT_CLASS.captionCenterGroup)}
        caption="월세보증금"
        label="월세 보증금"
        value={formData.monthlyRentDeposit}
        onChange={(value) => onPatchFormData({ monthlyRentDeposit: value })}
      />
      <InlineLabeledAmountInput
        className={joinClassNames(RESULT_EDIT_CLASS.housingGroup, RESULT_EDIT_CLASS.captionCenterGroup)}
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
  result: AlphaResult
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
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
  formData: AlphaFormData
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
}) {
  const lockedBase =
    formData.insuranceMonthly + formData.maintenanceMonthly + formData.telecomMonthly
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
  formData: AlphaFormData
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
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

  const academyMonthly = formData.hasChildren ? formData.academyMonthly ?? 0 : 0
  const lockedBase =
    formData.foodMonthly +
    formData.necessitiesMonthly +
    formData.diningOutMonthly +
    formData.hobbyMonthly +
    academyMonthly

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

interface BuildResultRowsOptions {
  dividendBasisLabel: string
  fixedExpenseAnnualBase: number
  fixedExpenseMonthlyBase: number
  formData: AlphaFormData
  householdSummary: string
  housingRowLabel: string
  housingRowNote: string
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
  result: AlphaResult
}

const EMPTY_CELL = '-'

export function buildResultRows({
  dividendBasisLabel,
  fixedExpenseAnnualBase,
  fixedExpenseMonthlyBase,
  formData,
  householdSummary,
  housingRowLabel,
  housingRowNote,
  onPatchFormData,
  result,
}: BuildResultRowsOptions): ResultRow[] {
  const shouldShowLandRow = formData.hasLandOrOtherProperty && formData.landValue > 0
  const shouldShowOtherPropertyRow =
    formData.hasLandOrOtherProperty && formData.otherPropertyOfficialValue > 0
  const activeAdditionalHomes = formData.additionalHomes.filter(
    (home) => home.marketValue > 0 || home.officialValue > 0,
  )
  const shouldShowCarAssetRow = formData.hasCar || formData.currentCarMarketValue > 0
  const shouldShowTaxableDividendRow =
    formData.taxableAccountDividendAnnual > 0 || result.taxableDividendAnnualNet > 0
  const shouldShowIsaDividendRow =
    formData.isaDividendAnnual > 0 || result.isaDividendAnnualNet > 0
  const shouldShowPensionRow =
    formData.pensionMonthlyAmount > 0 || result.pensionMonthlyApplied > 0
  const visibleIncomeBreakdown = result.incomeBreakdown.filter(
    (item) => item.inputMonthly > 0 || item.appliedMonthly > 0,
  )
  const rentalIncomeBreakdown = visibleIncomeBreakdown.find((item) => item.key === 'rental')
  const shouldShowRentalIncomeTaxRow = result.rentalIncomeTaxAnnual > 0
  const shouldShowEstimatedComprehensiveTaxRows =
    result.estimatedComprehensiveTaxBaseAnnual > 0 ||
    result.projectionEstimatedComprehensiveIncomeTaxTotal > 0 ||
    result.projectionEstimatedLocalIncomeTaxTotal > 0 ||
    result.estimatedComprehensiveTaxReviewLevel !== 'none'
  const estimatedComprehensiveTaxSourceSummary = Array.from(
    new Set([
      ...(formData.pensionMonthlyAmount > 0 || result.projectionPensionIncomeTotal > 0 ? ['국민연금'] : []),
      ...result.incomeBreakdown
        .filter(
          (item) =>
            ['earned', 'otherPension', 'freelance', 'business', 'corporateExecutive', 'misc'].includes(item.key) &&
            (item.inputMonthly > 0 || item.projectionTotal > 0),
        )
        .map((item) => item.label),
    ]),
  ).join(', ')
  const estimatedComprehensiveTaxStartsLater =
    result.estimatedComprehensiveTaxBaseAnnual <= 0 &&
    (result.projectionEstimatedComprehensiveIncomeTaxTotal > 0 ||
      result.projectionEstimatedLocalIncomeTaxTotal > 0)
  const estimatedComprehensiveTaxReviewSummary =
    result.estimatedComprehensiveTaxReviewReasons.join(' ')
  const healthInsuranceReviewSummary = result.healthInsuranceReviewReasons.join(' ')
  const shouldShowCarCostRow = formData.hasCar || formData.carYearlyCost > 0
  const shouldShowLoanInterestRow = formData.hasLoan || formData.loanInterestMonthly > 0
  const academyMonthly = formData.hasChildren ? formData.academyMonthly ?? 0 : 0
  const shouldShowAcademyRow =
    formData.livingCostInputMode === 'detailed' && academyMonthly > 0
  const pensionStartsLater = formData.currentAge < formData.pensionStartAge
  const displayedPensionMonthly = pensionStartsLater ? formData.pensionMonthlyAmount : result.pensionMonthlyApplied
  const displayedPensionAnnual = displayedPensionMonthly * 12
  const usesEmployeeHealthInsurance =
    formData.healthInsuranceType === 'employee' ||
    formData.healthInsuranceType === 'employeeWithDependentSpouse'
  const selectedIncomeCategories = getSelectedIncomeCategories(formData)
  const businessIncomeAnnual = formData.businessIncomeMonthly * 12
  const businessHealthInsuranceSummary = selectedIncomeCategories.includes('business')
    ? formData.previousYearDeclaredBusinessIncomeAnnual > 0
      ? `개인사업자 건강보험은 현재 월 사업소득금액 연 ${formatCompactCurrency(businessIncomeAnnual)}와 직전년도 신고 사업소득금액 연 ${formatCompactCurrency(formData.previousYearDeclaredBusinessIncomeAnnual)} 중 큰 값을 참고했습니다.`
      : `개인사업자 건강보험은 현재 월 사업소득금액 연 ${formatCompactCurrency(businessIncomeAnnual)} 기준으로 추정했습니다.`
    : ''
  const buildIncomeRowPatch = (
    key: AlphaResult['incomeBreakdown'][number]['key'],
    value: number,
  ): Partial<AlphaFormData> => {
    const basePatch =
      selectedIncomeCategories.length === 1 && selectedIncomeCategories[0] === key
        ? { otherIncomeMonthly: value }
        : {}

    switch (key) {
      case 'earned':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          earnedIncomeMonthly: value,
          ...(usesEmployeeHealthInsurance ? { salaryMonthly: value } : {}),
          ...basePatch,
        })
      case 'otherPension':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          otherPensionMonthly: value,
          ...(selectedIncomeCategories.length === 1 && selectedIncomeCategories[0] === key
            ? { otherIncomeMonthly: value, otherIncomeStartAge: formData.otherPensionStartAge }
            : {}),
        })
      case 'freelance':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          freelanceIncomeMonthly: value,
          ...basePatch,
        })
      case 'business':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          businessIncomeMonthly: value,
          ...basePatch,
        })
      case 'rental':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          rentalIncomeMonthly: value,
          ...basePatch,
        })
      case 'misc':
      default:
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          miscIncomeMonthly: value,
          ...basePatch,
        })
    }
  }

  const buildTaxableDividendPatch = (value: number): Partial<AlphaFormData> => {
    if (formData.householdType === 'couple' && formData.dividendOwnershipType === 'split') {
      const splitAmounts = rebalanceSplitAmounts({
        nextTotalAmount: value,
        previousTotalAmount: formData.taxableAccountDividendAnnual,
        currentMineAmount: formData.myAnnualDividendAttributed,
      })

      return {
        taxableAccountDividendAnnual: Math.max(Math.round(value), 0),
        myAnnualDividendAttributed: splitAmounts.mineAmount,
        spouseAnnualDividendAttributed: splitAmounts.spouseAmount,
      }
    }

    return { taxableAccountDividendAnnual: value }
  }

  const buildIsaDividendPatch = (value: number): Partial<AlphaFormData> => {
    if (formData.householdType === 'couple' && formData.isaOwnershipType === 'split') {
      const splitAmounts = rebalanceSplitAmounts({
        nextTotalAmount: value,
        previousTotalAmount: formData.isaDividendAnnual,
        currentMineAmount: formData.myAnnualIsaDividendAttributed,
      })

      return {
        isaDividendAnnual: Math.max(Math.round(value), 0),
        myAnnualIsaDividendAttributed: splitAmounts.mineAmount,
        spouseAnnualIsaDividendAttributed: splitAmounts.spouseAmount,
      }
    }

    return { isaDividendAnnual: value }
  }

  const totalIncomePieces = [
    result.totalDividendMonthlyNet > 0
      ? `${formatCompactCurrency(result.totalDividendMonthlyNet)} 세후 배당`
      : null,
    ...visibleIncomeBreakdown.map(
      (item) => `${formatCompactCurrency(item.appliedMonthly)} ${item.label}`,
    ),
    shouldShowPensionRow
      ? pensionStartsLater
        ? `국민연금 ${formData.pensionStartAge}세 이후 반영`
        : `${formatCompactCurrency(result.pensionMonthlyApplied)} 국민연금`
      : null,
  ].filter((value): value is string => Boolean(value))

  const rows: ResultRow[] = [
    {
      category: '기본',
      item: '가구',
      input: householdSummary,
      monthly: EMPTY_CELL,
      annual: EMPTY_CELL,
      tenYear: EMPTY_CELL,
      note: dividendBasisLabel,
    },
    {
      category: '주거',
      item: housingRowLabel,
      input: <HousingAmountEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost)
          : EMPTY_CELL,
      annual:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost * 12)
          : EMPTY_CELL,
      tenYear:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost * 12 * formData.simulationYears)
          : EMPTY_CELL,
      note: housingRowNote,
      noteDetail:
        formData.housingType === 'jeonse'
          ? '전세보증금은 자산 해석에 포함합니다.'
          : formData.housingType === 'monthlyRent'
            ? `월세 ${formatCompactCurrency(formData.monthlyRentAmount)}는 주거비로 반영했고, 보증금 ${formatCompactCurrency(formData.monthlyRentDeposit)}은 자산 해석에 포함합니다.`
            : undefined,
    },
  ]

  activeAdditionalHomes.forEach((home, index) => {
    rows.push({
      category: '주거',
      item: `추가주택 ${index + 1}`,
      input: `${getHousingTypeLabel(home.housingType)} · 시가 ${formatCompactCurrency(home.marketValue)} / 공시가격 ${formatCompactCurrency(home.officialValue)}`,
      monthly: EMPTY_CELL,
      annual: EMPTY_CELL,
      tenYear: EMPTY_CELL,
      note: '다주택 보유세와 건강보험 재산 기준 반영',
    })
  })

  if (shouldShowLandRow) {
    rows.push({
      category: '주거',
      item: '토지',
      input: formatCompactCurrency(formData.landValue),
      monthly: EMPTY_CELL,
      annual: EMPTY_CELL,
      tenYear: EMPTY_CELL,
      note: `${getPropertyOwnershipLabel(formData.landOwnershipType)} 기준`,
    })
  }

  if (shouldShowOtherPropertyRow) {
    rows.push({
      category: '주거',
      item: '기타 부동산',
      input: formatCompactCurrency(formData.otherPropertyOfficialValue),
      monthly: EMPTY_CELL,
      annual: EMPTY_CELL,
      tenYear: EMPTY_CELL,
      note: `${getPropertyOwnershipLabel(formData.otherPropertyOwnershipType)} 기준`,
    })
  }

  if (shouldShowCarAssetRow) {
    rows.push({
      category: '자산',
      item: '차량 시가',
      input: (
        <InlineAmountInput
          label="현재 차량 시가"
          value={formData.currentCarMarketValue}
          onChange={(value) => onPatchFormData({ currentCarMarketValue: value })}
        />
      ),
      monthly: EMPTY_CELL,
      annual: EMPTY_CELL,
      tenYear: EMPTY_CELL,
      note: '자산 반영',
      noteDetail: '현재 차량 시가는 자산 해석에 포함하고, 차량 유지비는 별도 지출로 계산합니다.',
    })
  }

  if (shouldShowTaxableDividendRow) {
    rows.push({
      category: '소득',
      item: '일반계좌 배당',
      input: (
        <InlineAmountInput
          label="일반계좌 연 배당금"
          value={formData.taxableAccountDividendAnnual}
          onChange={(value) => onPatchFormData(buildTaxableDividendPatch(value))}
        />
      ),
      monthly: formatCompactCurrency(result.taxableDividendMonthlyNet),
      annual: formatCompactCurrency(result.taxableDividendAnnualNet),
      tenYear: formatCompactCurrency(result.taxableDividendAnnualNet * formData.simulationYears),
      note: '원천징수 15.4%',
      noteDetail: getTaxableDividendNote(result),
    })
  }

  if (shouldShowIsaDividendRow) {
    rows.push({
      category: '소득',
      item: 'ISA 배당',
      input: (
        <InlineAmountInput
          label="ISA 연 배당금"
          value={formData.isaDividendAnnual}
          onChange={(value) => onPatchFormData(buildIsaDividendPatch(value))}
        />
      ),
      monthly: formatCompactCurrency(result.isaDividendMonthlyNet),
      annual: formatCompactCurrency(result.isaDividendAnnualNet),
      tenYear: formatCompactCurrency(result.isaDividendAnnualNet * formData.simulationYears),
      note: 'ISA 절세 반영',
      noteDetail: getIsaDividendNote(result),
    })
  }

  if (shouldShowPensionRow) {
    rows.push({
      category: '소득',
      item: '국민연금',
      input: (
        <InlineAmountInput
          label="국민연금 예상 수령액"
          value={formData.pensionMonthlyAmount}
          onChange={(value) => onPatchFormData({ pensionMonthlyAmount: value })}
        />
      ),
      monthly: formatCompactCurrency(displayedPensionMonthly),
      annual: formatCompactCurrency(displayedPensionAnnual),
      tenYear: formatCompactCurrency(result.projectionPensionIncomeTotal),
      note: pensionStartsLater ? `${formData.pensionStartAge}세부터 반영` : '현재 기준 월 유입',
      noteDetail:
        pensionStartsLater
          ? `현재 ${formData.currentAge}세 기준이며 국민연금은 ${formData.pensionStartAge}세부터 현금흐름에 반영합니다.`
          : undefined,
    })
  }

  visibleIncomeBreakdown.forEach((incomeItem) => {
    const startsLater = typeof incomeItem.startAge === 'number' && formData.currentAge < incomeItem.startAge
    const hasDurationLimit =
      typeof incomeItem.durationYears === 'number' && incomeItem.durationYears < formData.simulationYears

    rows.push({
      category: '소득',
      item: incomeItem.label,
      input: (
        <InlineAmountInput
          label={`${incomeItem.label} 월 입력`}
          value={incomeItem.inputMonthly}
          onChange={(value) => onPatchFormData(buildIncomeRowPatch(incomeItem.key, value))}
        />
      ),
      monthly: formatCompactCurrency(incomeItem.appliedMonthly),
      annual: formatCompactCurrency(incomeItem.appliedMonthly * 12),
      tenYear: formatCompactCurrency(incomeItem.projectionTotal),
      note: startsLater
        ? `${incomeItem.startAge}세부터${hasDurationLimit ? ` ${incomeItem.durationYears}년간 반영` : ' 반영'}`
        : hasDurationLimit
          ? `${incomeItem.durationYears}년간 반영`
          : `${incomeItem.label} 현재 반영`,
      noteDetail: startsLater
        ? `현재 ${formData.currentAge}세 기준이라 ${incomeItem.label}은 ${incomeItem.startAge}세부터${hasDurationLimit ? ` ${incomeItem.durationYears}년 동안` : ''} 반영됩니다.`
        : hasDurationLimit
          ? `현재 ${formData.currentAge}세 기준으로 ${incomeItem.label}은 앞으로 ${incomeItem.durationYears}년 동안 반영됩니다.`
          : undefined,
    })
  })

  rows.push(
    {
      category: '결과',
      item: '총 유입',
      input: totalIncomePieces.length > 0 ? totalIncomePieces.join(' + ') : '입력된 소득 없음',
      monthly: formatCompactCurrency(result.totalIncomeMonthly),
      annual: formatCompactCurrency(result.totalIncomeMonthly * 12),
      tenYear: formatCompactCurrency(result.projectionTotalIncomeTotal),
      note: '세금 차감 전',
    },
    {
      category: '세금',
      item: '건강보험료',
      input: <HealthInsuranceEditor result={result} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(result.healthInsuranceMonthly),
      annual: formatCompactCurrency(result.healthInsuranceMonthly * 12),
      tenYear: formatCompactCurrency(result.healthInsuranceMonthly * 12 * formData.simulationYears),
      note:
        result.healthInsuranceReviewLevel === 'high'
          ? '추정 · 피부양자 재확인'
          : result.healthInsuranceReviewLevel === 'review'
            ? '추정 · 기준 확인 권장'
            : '단순 추정',
      noteDetail:
        result.healthInsuranceReviewLevel === 'none'
          ? `${policyConfig.healthInsurance.approximationNotice}${businessHealthInsuranceSummary ? ` ${businessHealthInsuranceSummary}` : ''}`
          : `${policyConfig.healthInsurance.approximationNotice} ${healthInsuranceReviewSummary}${businessHealthInsuranceSummary ? ` ${businessHealthInsuranceSummary}` : ''}`,
    },
    ...(shouldShowEstimatedComprehensiveTaxRows
      ? [
          {
            category: '세금',
            item: '종합소득세',
            input:
              result.estimatedComprehensiveTaxBaseAnnual > 0
                ? `과세표준 연 ${formatCompactCurrency(result.estimatedComprehensiveTaxBaseAnnual)}`
                : result.estimatedComprehensiveTaxReviewLevel !== 'none'
                  ? '추정 기준 안내'
                  : '현재 기준 과세표준 0원',
            monthly: formatCompactCurrency(result.estimatedComprehensiveIncomeTaxAnnual / 12),
            annual: formatCompactCurrency(result.estimatedComprehensiveIncomeTaxAnnual),
            tenYear: formatCompactCurrency(result.projectionEstimatedComprehensiveIncomeTaxTotal),
            note:
              result.estimatedComprehensiveTaxReviewLevel === 'high'
                ? '추정 · 신고 가능성 높음'
                : result.estimatedComprehensiveTaxReviewLevel === 'review'
                  ? '추정 · 기준 확인'
                  : estimatedComprehensiveTaxStartsLater
                    ? '추정 · 향후 시작 소득 반영'
                    : '추정 · 국민연금·근로 등 반영',
            noteDetail: `${estimatedComprehensiveTaxSourceSummary || '국민연금·근로소득·법인대표 급여·사업소득·프리랜서·기타연금·기타소득'} 기준으로 추정했습니다. 근로소득공제, 국민연금 연금소득공제, 기타소득 필요경비 60%와 소득금액 300만원 기준, 본인 기본공제 150만원을 반영했습니다.${estimatedComprehensiveTaxReviewSummary ? ` ${estimatedComprehensiveTaxReviewSummary}` : ''}${result.rentalSeparateTaxationOption ? ' 주택임대소득 2천만원 이하 구간은 분리과세 선택 가능성을 함께 봤습니다.' : ''} 임대소득세와 금융소득 종합과세 추가세액은 아래 별도 행으로 분리했습니다.${estimatedComprehensiveTaxStartsLater ? ' 현재는 시작 나이 전이거나 반영 기간 밖이라 0원이지만, 향후 기간에는 자동 반영합니다.' : ''}`,
          },
          {
            category: '세금',
            item: '지방소득세',
            input: '종합소득세의 10%',
            monthly: formatCompactCurrency(result.estimatedLocalIncomeTaxAnnual / 12),
            annual: formatCompactCurrency(result.estimatedLocalIncomeTaxAnnual),
            tenYear: formatCompactCurrency(result.projectionEstimatedLocalIncomeTaxTotal),
            note: estimatedComprehensiveTaxStartsLater ? '추정 · 향후 시작 소득 반영' : '추정 · 종합소득세 연동',
            noteDetail: '종합소득세 추정액의 10%를 지방소득세로 반영했습니다.',
          },
        ]
      : []),
    {
      category: '세금',
      item: '금융종합과세',
      input: getComprehensiveTaxInput(result),
      monthly: formatCompactCurrency(result.comprehensiveTaxImpactAnnual / 12),
      annual: formatCompactCurrency(result.comprehensiveTaxImpactAnnual),
      tenYear: formatCompactCurrency(result.comprehensiveTaxImpactAnnual * formData.simulationYears),
      note: '금융소득 종합과세 추가세액',
      noteDetail: getComprehensiveTaxNote(result),
    },
  )

  if (shouldShowRentalIncomeTaxRow) {
    rows.push({
      category: '세금',
      item: '임대소득세',
      input: rentalIncomeBreakdown
        ? `${rentalIncomeBreakdown.label} ${formatCompactCurrency(rentalIncomeBreakdown.appliedMonthly)}`
        : EMPTY_CELL,
      monthly: formatCompactCurrency(result.rentalIncomeTaxMonthly),
      annual: formatCompactCurrency(result.rentalIncomeTaxAnnual),
      tenYear: formatCompactCurrency(result.projectionRentalIncomeTaxTotal),
      note: '월세소득 단순 추정',
      noteDetail: policyConfig.rentalIncomeTax.note,
    })
  }

  rows.push(
    {
      category: '세금',
      item: '보유세',
      input: <span style={{ whiteSpace: 'pre-line' }}>{getHoldingTaxInputSummary(result)}</span>,
      monthly:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxMonthly)
          : EMPTY_CELL,
      annual:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxAnnual)
          : EMPTY_CELL,
      tenYear:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxAnnual * formData.simulationYears)
          : EMPTY_CELL,
      note:
        result.holdingTaxAnnual > 0
          ? '주택·토지·기타 부동산 반영'
          : '해당 없음',
      noteDetail:
        result.holdingTaxAnnual > 0
          ? `${getHoldingTaxBreakdownSummary(result)} 기준. ${policyConfig.holdingTax.note}`
          : undefined,
    },
    {
      category: '결과',
      item: '실수령 가용액',
      input: (
        <span>
          총 유입에서 건강보험료, 보유세
          {shouldShowEstimatedComprehensiveTaxRows ? ', 종합소득세, 지방소득세' : ''},
          금융종합과세
          {shouldShowRentalIncomeTaxRow ? ', 임대소득세' : ''} 반영
        </span>
      ),
      monthly: formatCompactCurrency(result.monthlyUsableCash),
      annual: formatCompactCurrency(result.monthlyUsableCash * 12),
      tenYear: formatCompactCurrency(result.projectionUsableCashTotal),
      note: '생활비 차감 전',
    },
    {
      category: '지출',
      item: '고정지출',
      input: <FixedExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(fixedExpenseMonthlyBase),
      annual: formatCompactCurrency(fixedExpenseAnnualBase),
      tenYear: formatCompactCurrency(
        (formData.maintenanceMonthly + formData.telecomMonthly + formData.otherFixedMonthly) *
          12 *
          formData.simulationYears +
          formData.insuranceMonthly *
            12 *
            Math.min(formData.insurancePaymentYears, formData.simulationYears),
      ),
      note:
        formData.insuranceMonthly > 0 && formData.insurancePaymentYears > 0
          ? `차량비 제외 · 보험료 ${Math.min(formData.insurancePaymentYears, formData.simulationYears)}년 반영`
          : '차량비 제외',
      noteDetail:
        formData.insuranceMonthly > 0 && formData.insurancePaymentYears > 0
          ? `보험료 ${formatCompactCurrency(formData.insuranceMonthly)}는 앞으로 ${Math.min(formData.insurancePaymentYears, formData.simulationYears)}년 동안만 반영합니다.`
          : undefined,
    },
    {
      category: '지출',
      item: '생활비',
      input: <LivingExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(result.livingExpenseMonthly),
      annual: formatCompactCurrency(result.livingExpenseMonthly * 12),
      tenYear: formatCompactCurrency(result.livingExpenseMonthly * 12 * formData.simulationYears),
      note:
        formData.livingCostInputMode === 'detailed'
          ? '상세 항목 합산'
          : '총액 입력',
    },
  )

  if (shouldShowAcademyRow) {
    rows.push({
      category: '지출',
      item: '학원비',
      input: (
        <InlineAmountInput
          label="월 학원비"
          value={academyMonthly}
          onChange={(value) => onPatchFormData({ academyMonthly: value })}
        />
      ),
      monthly: formatCompactCurrency(academyMonthly),
      annual: formatCompactCurrency(academyMonthly * 12),
      tenYear: formatCompactCurrency(academyMonthly * 12 * formData.simulationYears),
      note: '상세 생활비 포함',
      noteDetail: '자녀가 있을 때만 생활비 상세 항목으로 별도 표기합니다.',
    })
  }

  if (shouldShowCarCostRow) {
    rows.push({
      category: '지출',
      item: '차량유지비',
      input: (
        <InlineAmountInput
          label="연 차량 유지비"
          value={formData.carYearlyCost}
          onChange={(value) => onPatchFormData({ carYearlyCost: value })}
        />
      ),
      monthly: formatCompactCurrency(result.carMonthlyConverted),
      annual: formatCompactCurrency(formData.carYearlyCost),
      tenYear: formatCompactCurrency(formData.carYearlyCost * formData.simulationYears),
      note: '연간 비용 ÷ 12',
      noteDetail: `월 환산 ${formatCompactCurrency(result.carMonthlyConverted)} (${formatCurrency(result.carMonthlyConverted)})`,
    })
  }

  if (shouldShowLoanInterestRow) {
    rows.push({
      category: '지출',
      item: '대출이자',
      input: (
        <InlineAmountInput
          label="월 대출이자"
          value={formData.loanInterestMonthly}
          onChange={(value) => onPatchFormData({ loanInterestMonthly: value })}
        />
      ),
      monthly: formatCompactCurrency(formData.loanInterestMonthly),
      annual: formatCompactCurrency(formData.loanInterestMonthly * 12),
      tenYear: formatCompactCurrency(
        formData.loanInterestMonthly *
          12 *
          Math.min(formData.loanInterestYears, formData.simulationYears),
      ),
      note:
        formData.loanInterestMonthly > 0 && formData.loanInterestYears > 0
          ? `${Math.min(formData.loanInterestYears, formData.simulationYears)}년치 반영`
          : '미반영',
    })
  }

  rows.push({
    category: '결과',
    item: '흑자/적자',
    input: `월 총지출 ${formatCompactCurrency(result.totalExpenseMonthly)}`,
    monthly: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
    annual: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
    tenYear: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
    note: `위험도 ${getRiskLabel(result.riskLevel)}`,
  })

  return rows
}
