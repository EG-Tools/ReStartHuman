import { useMemo, useRef, type ReactNode } from 'react'
import { policyConfig } from '../../config/policyConfig'
import { InlineNumericField, PrimaryButton } from '../common/Ui'
import type { RetireCalcFormData, RetireCalcResult } from '../../types/retireCalc'
import { formatCompactCurrency } from '../../utils/format'
import { CashFlowChart, ResultInterpretation, ResultTable, SummaryCards } from './resultScreen.sections'
import { useResultShare } from './useResultShare'
import { buildResultRows } from './resultScreen.editors'
import {
  getAgeAssetBenchmark,
  getAssetInterpretationMessage,
  getComprehensiveTaxZeroReason,
  getHealthInsuranceTypeSummary,
  getHoldingTaxBaseSummary,
  getHoldingTaxBreakdownSummary,
  getHouseholdAssetEstimate,
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
