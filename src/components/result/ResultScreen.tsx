import { memo, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { PrimaryButton } from '../common/Ui'
import type { RetireCalcFormData, RetireCalcResult } from '../../types/retireCalc'
import { CashFlowChart, ResultInterpretation, ResultTable, SummaryCards } from './resultScreen.sections'
import { useResultShare } from './useResultShare'
import { buildResultRows } from './resultScreen.editors'
import { ProjectionInlineControls, ResultHelpDrawer } from './resultScreen.notices'
import {
  buildInterpretationItems,
  getAgeAssetBenchmark,
  getAssetInterpretationMessage,
  getHouseholdAssetEstimate,
  type ResultRow,
} from './resultScreen.helpers'


interface ResultCaptureContentProps {
  captureRef: RefObject<HTMLDivElement | null>
  formData: RetireCalcFormData
  result: RetireCalcResult
  interpretationItems: string[]
  rows: ResultRow[]
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
}

const ResultCaptureContent = memo(function ResultCaptureContent({
  captureRef,
  formData,
  result,
  interpretationItems,
  rows,
  onPatchFormData,
}: ResultCaptureContentProps) {
  return (
    <div ref={captureRef} className="result-capture">
      <ProjectionInlineControls formData={formData} onPatchFormData={onPatchFormData} />

      <CashFlowChart
        result={result}
        inflationEnabled={formData.inflationEnabled}
        inflationRateAnnual={formData.inflationRateAnnual}
        projectionYears={formData.simulationYears}
        currentAge={formData.currentAge}
      />

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
  )
})

interface ResultScreenProps {
  formData: RetireCalcFormData
  result: RetireCalcResult
  onEditAnswers: () => void
  onStartOver: () => void
  onOpenSaveSlots: () => void
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
  headerAction?: ReactNode
}

export const ResultScreen = memo(function ResultScreen({
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
  const { exportMessage, exportState, handleShareImage } = useResultShare({ captureRef })
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
    () =>
      buildInterpretationItems({
        assetInterpretation,
        effectiveComprehensiveRate,
        formData,
        result,
      }),
    [assetInterpretation, effectiveComprehensiveRate, formData, result],
  )

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

  const rows = useMemo<ResultRow[]>(
    () =>
      buildResultRows({
        dividendBasisLabel,
        fixedExpenseAnnualBase,
        fixedExpenseMonthlyBase,
        formData,
        householdSummary,
        housingRowLabel,
        housingRowNote,
        onPatchFormData,
        result,
      }),
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

      <ResultCaptureContent
        captureRef={captureRef}
        formData={formData}
        result={result}
        interpretationItems={interpretationItems}
        rows={rows}
        onPatchFormData={onPatchFormData}
      />

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

      <ResultHelpDrawer loanNotice={result.loanNotice} policyStatus={result.policyStatus} />
    </section>
  )
})
