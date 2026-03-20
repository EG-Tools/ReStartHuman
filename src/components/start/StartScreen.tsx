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
            <span className="help-drawer-toggle-copy">눌러서 열기 / 닫기</span>
          </summary>
          <div className="help-drawer-body">
            <div className="notice-stack help-drawer-stack">
              <div className="notice-card">
                <h2>입력 단위</h2>
                <p>금액 입력은 모두 만원 단위이며, 결과 표시는 원 단위로 환산해서 보여줍니다.</p>
              </div>
              <div className="notice-card">
                <h2>계산 엔진 분리</h2>
                <p>배당, 건강보험료, 보유세, 10년 현금흐름 추정은 화면과 분리된 계산 모듈에서 처리합니다.</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </section>
  )
}