/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import type { RetireCalcFormData, RetireCalcResult } from '../../types/retireCalc'
import { formatCompactCurrency, formatCurrency, formatSignedCompactCurrency } from '../../utils/format'
import { InlineNumericField } from '../common/Ui'
import {
  getComprehensiveTaxInput,
  getComprehensiveTaxNote,
  getHoldingTaxBreakdownSummary,
  getHoldingTaxInputSummary,
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
  const groupClassName = className ? joinClassNames(RESULT_EDIT_CLASS.group, className) : RESULT_EDIT_CLASS.group

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
  formData: RetireCalcFormData
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
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
  const fixedMaintenanceMonthly =
    formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly
  const lockedBase =
    formData.insuranceMonthly +
    fixedMaintenanceMonthly +
    formData.telecomMonthly
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
    />
  )
}

interface BuildResultRowsOptions {
  dividendBasisLabel: string
  fixedExpenseAnnualBase: number
  fixedExpenseMonthlyBase: number
  formData: RetireCalcFormData
  householdSummary: string
  housingRowLabel: string
  housingRowNote: string
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
  result: RetireCalcResult
}

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
  return [
    {
      category: '기본',
      item: '가구',
      input: householdSummary,
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note: dividendBasisLabel,
    },
    {
      category: '주거',
      item: housingRowLabel,
      input: <HousingAmountEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost)
          : '—',
      annual:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost * 12)
          : '—',
      tenYear:
        formData.housingType === 'monthlyRent'
          ? formatCompactCurrency(result.housingMonthlyCost * 12 * formData.simulationYears)
          : '—',
      note: housingRowNote,
      noteDetail:
        formData.housingType === 'jeonse'
          ? '전세보증금은 자산 해석에 재산으로 포함합니다.'
          : formData.housingType === 'monthlyRent'
            ? `월세 ${formatCompactCurrency(formData.monthlyRentAmount)}${formData.maintenanceIncludedInRent ? '' : ` + 관리비 ${formatCompactCurrency(formData.monthlyMaintenanceFee)}`}를 월 지출에 반영하고, 월세보증금 ${formatCompactCurrency(formData.monthlyRentDeposit)}은 자산 해석에 포함합니다.`
            : undefined,
    },
    {
      category: '주거',
      item: '토지',
      input: formatCompactCurrency(formData.landValue),
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note:
        formData.landValue > 0
          ? `${getPropertyOwnershipLabel(formData.landOwnershipType)} 기준`
          : '0원이면 미보유 처리',
    },
    {
      category: '주거',
      item: '기타 부동산',
      input: formatCompactCurrency(formData.otherPropertyOfficialValue),
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note:
        formData.otherPropertyOfficialValue > 0
          ? `${getPropertyOwnershipLabel(formData.otherPropertyOwnershipType)} 기준`
          : '0원이면 미보유 처리',
    },
    {
      category: '자산',
      item: '차량 시세',
      input: (
        <InlineAmountInput
          label="현재 차량 시세"
          value={formData.currentCarMarketValue}
          onChange={(value) => onPatchFormData({ currentCarMarketValue: value })}
        />
      ),
      monthly: '—',
      annual: '—',
      tenYear: '—',
      note: formData.hasCar || formData.currentCarMarketValue > 0 ? '재산 반영' : '미보유',
      noteDetail:
        formData.hasCar || formData.currentCarMarketValue > 0
          ? '현재 차량 시세는 자산 해석에 포함하고, 차량 유지비는 별도 지출 항목으로 계산합니다.'
          : undefined,
    },
    {
      category: '배당',
      item: '배당금',
      input: (
        <InlineAmountInput
          label="일반계좌 연간 배당금"
          value={formData.taxableAccountDividendAnnual}
          onChange={(value) => onPatchFormData({ taxableAccountDividendAnnual: value })}
        />
      ),
      monthly: formatCompactCurrency(result.taxableDividendMonthlyNet),
      annual: formatCompactCurrency(result.taxableDividendAnnualNet),
      tenYear: formatCompactCurrency(result.taxableDividendAnnualNet * formData.simulationYears),
      note: '원천징수 15.4%',
      noteDetail: getTaxableDividendNote(result),
    },
    {
      category: '배당',
      item: 'ISA 배당금',
      input: (
        <InlineAmountInput
          label="ISA 연간 배당금"
          value={formData.isaDividendAnnual}
          onChange={(value) => onPatchFormData({ isaDividendAnnual: value })}
        />
      ),
      monthly: formatCompactCurrency(result.isaDividendMonthlyNet),
      annual: formatCompactCurrency(result.isaDividendAnnualNet),
      tenYear: formatCompactCurrency(result.isaDividendAnnualNet * formData.simulationYears),
      note: 'ISA 특례',
      noteDetail: getIsaDividendNote(result),
    },
    {
      category: '유입',
      item: '국민연금',
      input: (
        <InlineAmountInput
          label="국민연금 예상 금액"
          value={formData.pensionMonthlyAmount}
          onChange={(value) => onPatchFormData({ pensionMonthlyAmount: value })}
        />
      ),
      monthly: formatCompactCurrency(result.pensionMonthlyApplied),
      annual: formatCompactCurrency(result.pensionMonthlyApplied * 12),
      tenYear: formatCompactCurrency(result.pensionMonthlyApplied * 12 * formData.simulationYears),
      note: '월 기준 유입',
    },
    {
      category: '유입',
      item: '기타 소득',
      input: formData.otherIncomeType === 'none' ? '없음' : `월 ${formatCompactCurrency(result.otherIncomeMonthlyApplied)}`,
      monthly: formatCompactCurrency(result.otherIncomeMonthlyApplied),
      annual: formatCompactCurrency(result.otherIncomeMonthlyApplied * 12),
      tenYear: formatCompactCurrency(result.otherIncomeMonthlyApplied * 12 * formData.simulationYears),
      note:
        formData.otherIncomeType === 'none'
          ? '미입력'
          : `${formData.otherIncomeType === 'earned'
              ? '근로소득'
              : formData.otherIncomeType === 'business'
                ? '사업소득'
                : formData.otherIncomeType === 'pension'
                  ? '기타연금'
                  : '기타'} 월 유입`,
    },
    {
      category: '결과',
      item: '총 유입',
      input: `${formatCompactCurrency(result.totalDividendAnnualNet)} 배당 + ${formatCompactCurrency(result.otherIncomeMonthlyApplied)} 기타소득 + ${formatCompactCurrency(result.pensionMonthlyApplied)} 국민연금`,
      monthly: formatCompactCurrency(result.totalIncomeMonthly),
      annual: formatCompactCurrency(result.totalIncomeMonthly * 12),
      tenYear: formatCompactCurrency(result.totalIncomeMonthly * 12 * formData.simulationYears),
      note: '세금 차감 전',
    },
    {
      category: '세금',
      item: '건강 보험료',
      input: <HealthInsuranceEditor result={result} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(result.healthInsuranceMonthly),
      annual: formatCompactCurrency(result.healthInsuranceMonthly * 12),
      tenYear: formatCompactCurrency(result.healthInsuranceMonthly * 12 * formData.simulationYears),
      note: 'NHIS 단순화',
      noteDetail: policyConfig.healthInsurance.approximationNotice,
    },
    {
      category: '세금',
      item: '종합소득세',
      input: getComprehensiveTaxInput(result),
      monthly: formatCompactCurrency(result.comprehensiveTaxImpactAnnual / 12),
      annual: formatCompactCurrency(result.comprehensiveTaxImpactAnnual),
      tenYear: formatCompactCurrency(result.comprehensiveTaxImpactAnnual * formData.simulationYears),
      note: '일반계좌만 반영',
      noteDetail: getComprehensiveTaxNote(result),
    },
    {
      category: '세금',
      item: '보유세',
      input: <span style={{ whiteSpace: 'pre-line' }}>{getHoldingTaxInputSummary(result)}</span>,
      monthly:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxMonthly)
          : '—',
      annual:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxAnnual)
          : '—',
      tenYear:
        result.holdingTaxAnnual > 0
          ? formatCompactCurrency(result.holdingTaxAnnual * formData.simulationYears)
          : '—',
      note:
        result.holdingTaxAnnual > 0
          ? '주택·토지·기타 부동산'
          : '해당 없음',
      noteDetail:
        result.holdingTaxAnnual > 0
          ? `${getHoldingTaxBreakdownSummary(result)} 기준. ${policyConfig.holdingTax.note}`
          : undefined,
    },
    {
      category: '결과',
      item: '월 실사용 가능액',
      input: (
        <span>
          총 유입에서 건강보험료·
          <br />
          보유세·종합소득세 반영
        </span>
      ),
      monthly: formatCompactCurrency(result.monthlyUsableCash),
      annual: formatCompactCurrency(result.monthlyUsableCash * 12),
      tenYear: formatCompactCurrency(result.monthlyUsableCash * 12 * formData.simulationYears),
      note: '생활비·고정지출 차감 전',
    },
    {
      category: '지출',
      item: '고정지출',
      input: <FixedExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(fixedExpenseMonthlyBase),
      annual: formatCompactCurrency(fixedExpenseAnnualBase),
      tenYear: formatCompactCurrency(fixedExpenseAnnualBase * formData.simulationYears),
      note: '차량, 대출 제외',
    },
    {
      category: '지출',
      item: '식비생활비',
      input: <LivingExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />,
      monthly: formatCompactCurrency(result.livingExpenseMonthly),
      annual: formatCompactCurrency(result.livingExpenseMonthly * 12),
      tenYear: formatCompactCurrency(result.livingExpenseMonthly * 12 * formData.simulationYears),
      note:
        formData.livingCostInputMode === 'detailed'
          ? '세부 항목 합산'
          : '총액 입력 사용',
    },
    {
      category: '지출',
      item: '차량유지비',
      input: (
        <InlineAmountInput
          label="자동차 연간 유지비"
          value={formData.carYearlyCost}
          onChange={(value) => onPatchFormData({ carYearlyCost: value })}
        />
      ),
      monthly: formatCompactCurrency(result.carMonthlyConverted),
      annual: formatCompactCurrency(formData.carYearlyCost),
      tenYear: formatCompactCurrency(formData.carYearlyCost * formData.simulationYears),
      note: '연간 ÷ 12',
      noteDetail: `월 환산 ${formatCompactCurrency(result.carMonthlyConverted)} (${formatCurrency(result.carMonthlyConverted)})`,
    },
    {
      category: '지출',
      item: '대출 이자',
      input: (
        <InlineAmountInput
          label="월 대출 이자"
          value={formData.loanInterestMonthly}
          onChange={(value) => onPatchFormData({ loanInterestMonthly: value })}
        />
      ),
      monthly: formatCompactCurrency(formData.loanInterestMonthly),
      annual: formatCompactCurrency(formData.loanInterestMonthly * 12),
      tenYear: formatCompactCurrency(
        formData.loanInterestMonthly * 12 * Math.min(formData.loanInterestYears, formData.simulationYears),
      ),
      note:
        formData.loanInterestMonthly > 0 && formData.loanInterestYears > 0
          ? `${Math.min(formData.loanInterestYears, formData.simulationYears)}년치 반영`
          : '미반영',
    },
    {
      category: '결과',
      item: '흑자/적자',
      input: `월 총지출 ${formatCompactCurrency(result.totalExpenseMonthly)}`,
      monthly: formatSignedCompactCurrency(result.monthlySurplusOrDeficit),
      annual: formatSignedCompactCurrency(result.yearlySurplusOrDeficit),
      tenYear: formatSignedCompactCurrency(result.tenYearSurplusOrDeficit),
      note: `위험도: ${getRiskLabel(result.riskLevel)}`,
    },
  ]
}
