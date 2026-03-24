import { useMemo, useRef, useState, type ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import { InlineNumericField, PrimaryButton } from '../common/Ui'
import type { RetireCalcFormData, RetireCalcResult } from '../../types/retireCalc'
import { formatCompactCurrency, formatCurrency, formatSignedCompactCurrency } from '../../utils/format'
import { CashFlowChart, ResultInterpretation, ResultTable, SummaryCards } from './resultScreen.sections'
import {
  getAgeAssetBenchmark,
  getAssetInterpretationMessage,
  getComprehensiveTaxInput,
  getComprehensiveTaxNote,
  getComprehensiveTaxZeroReason,
  getHealthInsuranceTypeSummary,
  getHoldingTaxBaseSummary,
  getHoldingTaxBreakdownSummary,
  getHoldingTaxInputSummary,
  getHouseholdAssetEstimate,
  getIsaDividendNote,
  getLivingCostSnapshot,
  getPropertyOwnershipLabel,
  getRiskLabel,
  getTaxableDividendNote,
  type ResultRow,
} from './resultScreen.helpers'

interface ResultScreenProps {
  formData: RetireCalcFormData
  result: RetireCalcResult
  onEditAnswers: () => void
  onStartOver: () => void
  onOpenSaveSlots: () => void
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
  headerAction?: ReactNode
}

const RESULT_EDIT_CLASS = {
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
      <InlineAmountInput
        label={label}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

/**
 * 집값행은 결과표에서 유일한 2단 입력행입니다.
 * 구조/클래스는 이 함수에서 고정하고, 위치/간격은 result-refinements.css 하단
 * '집값행 최종 디자인 전용 보정' 구간에서만 조정합니다.
 */
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

const getExportFileName = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `retire-cashflow-${year}${month}${day}.png`
}

export function ResultScreen({
  formData,
  result,
  onEditAnswers,
  onStartOver,
  onOpenSaveSlots,
  onPatchFormData,
  headerAction,
}: ResultScreenProps) {
  const dividendBasisLabel =
    result.dividendInputMode === 'gross'
      ? '배당 입력 기준: 세전'
      : '배당 입력 기준: 세후'

  const fixedMaintenanceMonthlyBase =
    formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly
  const fixedExpenseMonthlyBase =
    formData.insuranceMonthly +
    fixedMaintenanceMonthlyBase +
    formData.telecomMonthly +
    formData.otherFixedMonthly
  const fixedExpenseAnnualBase = fixedExpenseMonthlyBase * 12
  const captureRef = useRef<HTMLDivElement | null>(null)
  const [exportState, setExportState] = useState<'idle' | 'sharing'>('idle')
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const ageBenchmark = useMemo(
    () => getAgeAssetBenchmark(formData.currentAge),
    [formData.currentAge],
  )
  const totalAssetEstimate = useMemo(
    () => getHouseholdAssetEstimate(formData),
    [formData],
  )
  const assetInterpretation = useMemo(
    () =>
      getAssetInterpretationMessage({
        benchmarkLabel: ageBenchmark.label,
        benchmarkAverageAsset: ageBenchmark.averageAsset,
        totalAssets: totalAssetEstimate,
        dividendAnnual: result.totalDividendAnnualGross,
      }),
    [
      ageBenchmark.averageAsset,
      ageBenchmark.label,
      result.totalDividendAnnualGross,
      totalAssetEstimate,
    ],
  )
  const highestComprehensiveTaxBreakdown = useMemo(
    () =>
      result.comprehensiveTaxBreakdown.reduce<
        RetireCalcResult['comprehensiveTaxBreakdown'][number] | null
      >((highest, item) => {
        if (!highest || item.finalTaxAnnual > highest.finalTaxAnnual) {
          return item
        }

        return highest
      }, null),
    [result.comprehensiveTaxBreakdown],
  )
  const effectiveComprehensiveRate = useMemo(
    () =>
      highestComprehensiveTaxBreakdown &&
      highestComprehensiveTaxBreakdown.attributedDividendAnnual > 0
        ? Math.round(
            (highestComprehensiveTaxBreakdown.finalTaxAnnual /
              highestComprehensiveTaxBreakdown.attributedDividendAnnual) *
              100,
          )
        : 0,
    [highestComprehensiveTaxBreakdown],
  )
  const interpretationItems = useMemo(
    () => [
      result.holdingTaxAnnual >= 10_000_000
        ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. ${getHoldingTaxBreakdownSummary(result)}이 반영됐고, ${getHoldingTaxBaseSummary(result)} 기준으로 부담이 큰 구간에 들어갈 수 있습니다.`
        : result.holdingTaxAnnual > 0
          ? `보유세는 연 ${formatCompactCurrency(result.holdingTaxAnnual)} 수준입니다. ${getHoldingTaxBreakdownSummary(result)}이 반영됐고, ${getHoldingTaxBaseSummary(result)} 기준으로 추정했습니다.`
          : '보유세는 현재 납부 대상이 아닌 것으로 계산했습니다.',
      result.comprehensiveTaxIncluded
        ? result.comprehensiveTaxImpactAnnual > 0
          ? `종합소득세는 금융소득 2,000만원 초과 구간입니다. 추가 세 부담은 약 ${effectiveComprehensiveRate}% 수준으로 반영했습니다.`
          : `종합소득세는 금융소득 2,000만원 초과 구간이지만 ${getComprehensiveTaxZeroReason(result)} 추가 세 부담은 0원입니다.`
        : '금융소득 2,000만원 이하로 보고 종합소득세 추가 부담은 제외했습니다.',
      result.healthInsuranceMonthly >= 1_000_000
        ? `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 보수 외 소득과 재산 영향을 함께 반영한 결과입니다.`
        : `건강보험료는 월 ${formatCompactCurrency(result.healthInsuranceMonthly)} 수준입니다. ${getHealthInsuranceTypeSummary(formData.healthInsuranceType)}으로 추정했습니다.`,
      result.otherIncomeMonthlyApplied > 0
        ? `기타 월소득 ${formatCompactCurrency(result.otherIncomeMonthlyApplied)}은 자산이 아닌 월 유입으로 반영했습니다.`
        : '기타 월소득은 별도 입력이 없어 반영하지 않았습니다.',
      assetInterpretation,
    ],
    [assetInterpretation, effectiveComprehensiveRate, formData.healthInsuranceType, result],
  )

  const createResultImage = async () => {
    const node = captureRef.current

    if (!node) {
      throw new Error('capture-target-missing')
    }

    const openedPopovers = Array.from(
      node.querySelectorAll('details[open]'),
    ) as HTMLDetailsElement[]

    openedPopovers.forEach((element) => {
      element.open = false
    })

    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(node, {
        backgroundColor: '#081113',
        pixelRatio: 2,
        cacheBust: true,
        filter: (currentNode) => {
          return !(
            currentNode instanceof HTMLElement &&
            currentNode.dataset.captureExclude === 'true'
          )
        },
      })

      if (!blob) {
        throw new Error('capture-failed')
      }

      return blob
    } finally {
      openedPopovers.forEach((element) => {
        element.open = true
      })
    }
  }

  const downloadResultImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = getExportFileName()
    link.click()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  const handleShareImage = async () => {
    try {
      setExportState('sharing')
      setExportMessage(null)
      const blob = await createResultImage()
      const file = new File([blob], getExportFileName(), { type: 'image/png' })

      if (
        navigator.share &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'Re Start Human 결과',
          files: [file],
        })
        setExportMessage('결과 이미지를 공유했습니다.')
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Re Start Human 결과',
          text: '결과 화면 이미지를 저장하거나 전송할 수 있습니다.',
          url: window.location.href,
        })
        setExportMessage('공유를 마쳤습니다.')
        return
      }

      downloadResultImage(blob)
      setExportMessage('공유 기능이 없어 이미지를 다운로드했습니다.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportMessage('공유가 취소되었습니다.')
      } else {
        setExportMessage('결과 이미지 공유에 실패했습니다.')
      }
    } finally {
      setExportState('idle')
    }
  }

  const householdSummary = `${formData.householdType === 'couple' ? '부부 합산' : '1인 가구'}, ${
    formData.housingType === 'own'
      ? '자가'
      : formData.housingType === 'jeonse'
        ? '전세'
        : '월세'
  }`
  const housingRowLabel = formData.housingType === 'own' ? '집값' : '주거비'
  const housingRowNote =
    formData.housingType === 'own'
      ? '시가 / 공시가'
      : formData.housingType === 'jeonse'
        ? '전세보증금은 재산 반영'
        : '보증금은 재산, 월세는 지출 반영'

  const rows = useMemo<ResultRow[]>(() => [
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
      input: (
        <HousingAmountEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
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
      input: (
        <HealthInsuranceEditor result={result} onPatchFormData={onPatchFormData} />
      ),
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
      input: (
        <FixedExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
      monthly: formatCompactCurrency(fixedExpenseMonthlyBase),
      annual: formatCompactCurrency(fixedExpenseAnnualBase),
      tenYear: formatCompactCurrency(fixedExpenseAnnualBase * formData.simulationYears),
      note: '차량, 대출 제외',
    },
    {
      category: '지출',
      item: '식비생활비',
      input: (
        <LivingExpenseEditor formData={formData} onPatchFormData={onPatchFormData} />
      ),
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
  ],
    [
      dividendBasisLabel,
      fixedExpenseAnnualBase,
      fixedExpenseMonthlyBase,
      formData,
      householdSummary,
      housingRowLabel,
      housingRowNote,
      onPatchFormData,
      result,
    ],
  )

  return (
    <section className="screen result-screen">
      <div className="screen-header result-screen-header">
        <div>
          <h1 className="screen-title">결과 요약</h1>
        </div>
        {headerAction ? (
          <div className="result-screen-header-action" data-capture-exclude="true">
            {headerAction}
          </div>
        ) : null}
      </div>

      <div ref={captureRef} className="result-capture">
        <section className="result-panel projection-panel">
          <div className="projection-inline-row">
            <div className="projection-inline-controls">
              <div className="projection-inline-field">
                <span className="projection-inline-field-label">나이</span>
                <InlineNumericField
                  value={formData.currentAge}
                  onChange={(value) => onPatchFormData({ currentAge: Math.max(1, value) })}
                  min={1}
                  step={1}
                  max={120}
                  display="number"
                  commitMode="change"
                  inlineClassName="projection-inline-input"
                  shellClassName="input-shell"
                  inputClassName="input-control"
                  suffixClassName="input-suffix"
                  suffix="세"
                  inputAriaLabel="현재 나이"
                />
              </div>
              <div className="projection-inline-field">
                <span className="projection-inline-field-label">기간</span>
                <InlineNumericField
                  value={formData.simulationYears}
                  onChange={(value) => onPatchFormData({ simulationYears: Math.min(Math.max(value, 1), 80) })}
                  min={1}
                  step={1}
                  max={80}
                  display="number"
                  commitMode="change"
                  inlineClassName="projection-inline-input"
                  shellClassName="input-shell"
                  inputClassName="input-control"
                  suffixClassName="input-suffix"
                  suffix="년"
                  inputAriaLabel="기간"
                />
              </div>
              <div className="projection-inline-field">
                <span className="projection-inline-field-label">물가</span>
                <InlineNumericField
                  value={Math.round(formData.inflationRateAnnual * 100)}
                  onChange={(value) =>
                    onPatchFormData({
                      inflationRateAnnual: Math.max(0, value) / 100,
                      inflationEnabled: value > 0,
                    })
                  }
                  min={0}
                  step={0.5}
                  max={20}
                  display="number"
                  commitMode="change"
                  inlineClassName="projection-inline-input"
                  shellClassName="input-shell"
                  inputClassName="input-control"
                  suffixClassName="input-suffix"
                  suffix="%"
                  inputAriaLabel="물가"
                />
              </div>
            </div>
          </div>
        </section>

        <CashFlowChart result={result} inflationEnabled={formData.inflationEnabled} inflationRateAnnual={formData.inflationRateAnnual} projectionYears={formData.simulationYears} currentAge={formData.currentAge} />

        <SummaryCards result={result} projectionYears={formData.simulationYears} />

        <ResultInterpretation items={interpretationItems} />

        <section className="result-panel">
          <div className="panel-header">
            <div>
              <h2>결과표</h2>
            </div>
          </div>
          <p className="table-scroll-hint">결과표는 좌우로 밀어서 확인할 수 있어요.</p>
          <ResultTable rows={rows} projectionYears={formData.simulationYears} />
        </section>
      </div>

      <div className="footer-actions footer-actions-wrap result-actions">
        <PrimaryButton variant="secondary" onClick={onEditAnswers}>
          수정
        </PrimaryButton>
        <PrimaryButton onClick={onOpenSaveSlots}>저장</PrimaryButton>
        <PrimaryButton onClick={handleShareImage} disabled={exportState !== 'idle'}>
          {exportState === 'sharing' ? '공유 중...' : '공유'}
        </PrimaryButton>
        <PrimaryButton variant="ghost" onClick={onStartOver}>
          처음으로
        </PrimaryButton>
      </div>

      {exportMessage ? <p className="action-feedback">{exportMessage}</p> : null}

      <details className="help-drawer result-panel">
        <summary className="help-drawer-toggle">
          <span>도움말</span>
          <span className="help-drawer-toggle-copy">열기 / 닫기</span>
        </summary>
        <div className="help-drawer-body">
          <div className="notice-stack help-drawer-stack">
            <div className="notice-card">
              <h2>정책 기준 안내</h2>
              <p>{result.policyStatus}</p>
            </div>
            <div className="notice-card">
              <h2>배당세 반영 기준</h2>
              <p>
                일반계좌는 {policyConfig.dividendWithholding.note}를 반영했고, 금융소득은 본인과
                배우자를 나눠 연 2,000만원 초과 여부를 따로 판정합니다. ISA는 {policyConfig.isa.note}
              </p>
            </div>
            <div className="notice-card">
              <h2>보유세·건강보험 기준</h2>
              <p>
                {policyConfig.holdingTax.note} 건강보험은 {policyConfig.healthInsurance.approximationNotice}
              </p>
            </div>
            <div className="notice-card">
              <h2>대출 주의문구</h2>
              <p>
                {result.loanNotice
                  ? '대출이 있다고 표시했습니다. 이 프로토타입은 대출 상환액을 계산에 포함하지 않으므로 실제 월 현금흐름은 달라질 수 있습니다.'
                  : '대출금이 있는 경우 실제 월 현금흐름 결과는 달라질 수 있습니다.'}
              </p>
            </div>
          </div>
        </div>
      </details>
    </section>
  )
}
