import { memo, useCallback, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { PrimaryButton } from '../common/Ui'
import type { AlphaFormData, AlphaResult } from '../../types/alpha'
import {
  CashFlowChart,
  ResultInterpretation,
  ResultTable,
  SummaryCards,
  type ResultInterpretationItem,
} from './resultScreen.sections'
import { useResultShare } from './useResultShare'
import { buildResultRows } from './resultScreen.editors'
import { ProjectionInlineControls, ResultHelpDrawer } from './resultScreen.notices'
import {
  buildDeficitAdviceItems,
  buildInterpretationItems,
  type DeficitAdviceItem,
  getAgeAssetBenchmark,
  getAssetInterpretationMessage,
  getHouseholdAssetEstimate,
  type ResultRow,
} from './resultScreen.helpers'


interface RecentAdviceState {
  id: string
  text: string
  previousFormData: AlphaFormData
}

interface ResultCaptureContentProps {
  captureRef: RefObject<HTMLDivElement | null>
  formData: AlphaFormData
  result: AlphaResult
  interpretationItems: string[]
  adviceItems: ResultInterpretationItem[]
  rows: ResultRow[]
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
  recentAdviceText?: string
  onUndoAdvice?: () => void
}

const ResultCaptureContent = memo(function ResultCaptureContent({
  captureRef,
  formData,
  result,
  interpretationItems,
  adviceItems,
  rows,
  onPatchFormData,
  recentAdviceText,
  onUndoAdvice,
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
      {adviceItems.length > 0 ? (
        <ResultInterpretation title={'\uC801\uC790 \uD574\uACB0 \uCC38\uACE0'} items={adviceItems} />
      ) : null}

      <section className="result-panel">
        <div className="panel-header">
          <div>
            <h2>{'\uACB0\uACFC\uD45C'}</h2>
          </div>
        </div>
        <p className="table-scroll-hint">{'\uACB0\uACFC\uD45C\uB294 \uC88C\uC6B0\uB85C \uBC00\uC5B4\uC11C \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694.'}</p>
        <ResultTable rows={rows} projectionYears={formData.simulationYears} />
      </section>

      {recentAdviceText && onUndoAdvice ? (
        <section className="result-panel recent-advice-panel" data-capture-exclude="true">
          <div className="panel-header">
            <div>
              <h2>{'\uCD5C\uADFC \uC801\uC6A9\uD55C \uC870\uC5B8'}</h2>
            </div>
          </div>
          <p className="recent-advice-copy">{recentAdviceText}</p>
          <div className="recent-advice-actions">
            <PrimaryButton variant="secondary" onClick={onUndoAdvice}>
              {'\uB418\uB3CC\uB9AC\uAE30'}
            </PrimaryButton>
          </div>
        </section>
      ) : null}
    </div>
  )
})

interface ResultScreenProps {
  formData: AlphaFormData
  result: AlphaResult
  onEditAnswers: () => void
  onStartOver: () => void
  onOpenSaveSlots: () => void
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
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
  const [recentAdvice, setRecentAdvice] = useState<RecentAdviceState | null>(null)
  const dividendBasisLabel =
    result.dividendInputMode === 'gross'
      ? '배당 입력 기준: 세전'
      : '배당 입력 기준: 세후'

  const fixedMaintenanceMonthlyBase = formData.maintenanceMonthly
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
        AlphaResult['comprehensiveTaxBreakdown'][number] | null
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
  const handleResultPatch = useCallback(
    (patch: Partial<AlphaFormData>) => {
      setRecentAdvice(null)
      onPatchFormData(patch)
    },
    [onPatchFormData],
  )
  const handleApplyAdvice = useCallback(
    (item: DeficitAdviceItem) => {
      if (!item.patch) {
        return
      }

      setRecentAdvice({
        id: item.id,
        text: item.message,
        previousFormData: formData,
      })
      onPatchFormData(item.patch)
    },
    [formData, onPatchFormData],
  )
  const handleUndoAdvice = useCallback(() => {
    if (!recentAdvice) {
      return
    }

    onPatchFormData(recentAdvice.previousFormData)
    setRecentAdvice(null)
  }, [onPatchFormData, recentAdvice])
  const adviceItems = useMemo<ResultInterpretationItem[]>(
    () =>
      buildDeficitAdviceItems(formData, result).map((item) => ({
        id: item.id,
        text: item.message,
        actionLabel: item.actionLabel,
        onAction: item.patch ? () => handleApplyAdvice(item) : undefined,
      })),
    [formData, handleApplyAdvice, result],
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
        onPatchFormData: handleResultPatch,
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
      handleResultPatch,
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
        adviceItems={adviceItems}
        rows={rows}
        onPatchFormData={handleResultPatch}
        recentAdviceText={recentAdvice?.text}
        onUndoAdvice={recentAdvice ? handleUndoAdvice : undefined}
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

      <ResultHelpDrawer policyStatus={result.policyStatus} />
    </section>
  )
})
