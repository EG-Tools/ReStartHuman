import { policyConfig } from '../../config/policyConfig'
import type { AlphaFormData, AlphaResult } from '../../types/alpha'
import { InlineNumericField } from '../common/Ui'

import { memo } from 'react'

interface ProjectionInlineControlsProps {
  formData: AlphaFormData
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
}

export const ProjectionInlineControls = memo(function ProjectionInlineControls({
  formData,
  onPatchFormData,
}: ProjectionInlineControlsProps) {
  return (
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
              onChange={(value) =>
                onPatchFormData({ simulationYears: Math.min(Math.max(value, 1), 80) })
              }
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
  )
})

interface ResultHelpDrawerProps {
  policyStatus: AlphaResult['policyStatus']
}

export const ResultHelpDrawer = memo(function ResultHelpDrawer({ policyStatus }: ResultHelpDrawerProps) {
  return (
    <details className="help-drawer result-panel">
      <summary className="help-drawer-toggle">
        <span>도움말</span>
        <span className="help-drawer-toggle-copy">열기 / 닫기</span>
      </summary>
      <div className="help-drawer-body">
        <div className="notice-stack help-drawer-stack">
          <div className="notice-card">
            <h2>결과 화면 사용법</h2>
            <p>상단의 나이·기간·물가를 바로 바꾸면 질문 화면으로 돌아가지 않아도 결과와 그래프를 즉시 다시 계산합니다.</p>
          </div>
          <div className="notice-card">
            <h2>결과표 표시 기준</h2>
            <p>입력하지 않은 선택 항목은 결과표에서 숨기고, 필요한 구분 설명은 비고란과 ? 버튼에 모아 가독성을 우선합니다.</p>
          </div>
          <div className="notice-card">
            <h2>정책 기준 안내</h2>
            <p>{policyStatus}</p>
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
            <h2>개인정보 및 재산정보 저장 안내</h2>
            <p>{policyConfig.privacyStorageNotice}</p>
          </div>
        </div>
      </div>
    </details>
  )
})
