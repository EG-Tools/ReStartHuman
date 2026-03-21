import type { ReactNode } from 'react'
import { PrimaryButton } from '../common/Ui'
import startHeroImage from '../../assets/start-hero-main.jpg'

interface StartScreenProps {
  onStart: () => void
  onOpenLoadSlots: () => void
  headerAction?: ReactNode
}

export function StartScreen({ onStart, onOpenLoadSlots, headerAction }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <div className="start-topbar">
        <span className="version-badge">Version 0.10</span>
        {headerAction ? <div className="start-topbar-action">{headerAction}</div> : null}
      </div>

      <div className="start-main">
        <div className="hero-panel start-hero-panel">
          <img
            className="start-hero-image"
            src={startHeroImage}
            alt="Re Start Human main screen illustration"
          />
          <div className="start-hero-overlay">
            <h1 className="hero-title">Re Start Human</h1>
          </div>
        </div>

        <div className="start-actions start-actions-compact">
          <PrimaryButton onClick={onStart}>시작</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onOpenLoadSlots}>
            불러오기
          </PrimaryButton>
        </div>

        <details className="help-drawer note-panel start-help-drawer">
          <summary className="help-drawer-toggle">
            <span>도움말</span>
            <span className="help-drawer-toggle-copy">열기 / 닫기</span>
          </summary>
          <div className="help-drawer-body">
            <div className="notice-stack help-drawer-stack">
              <div className="notice-card">
                <h2>무엇을 계산하나요?</h2>
                <p>배당, ISA, 건강보험료, 보유세, 생활비를 바탕으로 10년 현금흐름을 추정합니다.</p>
              </div>
              <div className="notice-card">
                <h2>입력 기준</h2>
                <p>금액 입력은 모두 만원 단위이며, 연금은 세후 실수령 기준으로 입력합니다.</p>
              </div>
              <div className="notice-card">
                <h2>추정치 안내</h2>
                <p>건강보험료와 보유세는 공개 기준을 반영한 단순화 추정치이므로 실제와 다를 수 있습니다.</p>
              </div>
              <div className="notice-card">
                <h2>반영되지 않을 수 있는 항목</h2>
                <p>대출 상환액, 종합부동산세, 개별 절세상품의 세부 조건은 기본 계산에 모두 반영되지 않을 수 있습니다.</p>
              </div>
              <div className="notice-card">
                <h2>저장 기능</h2>
                <p>계산 결과는 저장 슬롯에 저장하고 다시 불러올 수 있습니다.</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}
