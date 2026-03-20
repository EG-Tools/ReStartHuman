import { useState } from 'react'
import { PrimaryButton } from '../common/Ui'

interface StartScreenProps {
  onStart: () => void
  onOpenLoadSlots: () => void
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="settings-icon">
      <path
        d="M10.4 2.8a1 1 0 0 1 1.2 0l1.1.9a2 2 0 0 0 2 .3l1.3-.5a1 1 0 0 1 1.2.5l1.1 1.9a2 2 0 0 0 1.6 1l1.4.2a1 1 0 0 1 .8.9v2.2a1 1 0 0 1-.8.9l-1.4.2a2 2 0 0 0-1.6 1l-1.1 1.9a1 1 0 0 1-1.2.5l-1.3-.5a2 2 0 0 0-2 .3l-1.1.9a1 1 0 0 1-1.2 0l-1.1-.9a2 2 0 0 0-2-.3l-1.3.5a1 1 0 0 1-1.2-.5l-1.1-1.9a2 2 0 0 0-1.6-1L2 13.7a1 1 0 0 1-.8-.9V10.6a1 1 0 0 1 .8-.9l1.4-.2a2 2 0 0 0 1.6-1l1.1-1.9a1 1 0 0 1 1.2-.5l1.3.5a2 2 0 0 0 2-.3l1.1-.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11.7" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel settings-modal" role="dialog" aria-modal="true" aria-label="설정">
        <div className="modal-header settings-modal-header">
          <div>
            <p className="eyebrow">옵션</p>
            <h2>설정</h2>
          </div>
        </div>

        <section className="note-panel support-panel">
          <div className="support-panel-header">
            <div>
              <h2>개발자 후원금</h2>
            </div>
            <span className="support-status-pill">준비중</span>
          </div>

          <p className="support-copy">
            후원 기능이 연결되면 한 번이라도 후원한 사용자에게 결과 전 광고를 생략하는 흐름을 붙일 계획입니다. 지금은 UI만 먼저 보여줍니다.
          </p>

          <div className="support-actions">
            <PrimaryButton variant="secondary" disabled>
              후원 3,000원
            </PrimaryButton>
          </div>

          <div className="support-option-list">
            <div className="support-option-row">
              <span>회사명</span>
              <strong>EGSY</strong>
            </div>
            <div className="support-option-row">
              <span>이메일</span>
              <strong>Lyrikey@Naver.com</strong>
            </div>
            <div className="support-option-row">
              <span>연락처</span>
              <strong>이메일 문의</strong>
            </div>
          </div>

          <p className="support-note">
            실제 결제, 후원 내역 저장, 광고 제거 상태 저장은 광고 기능이 붙는 시점에 함께 연결할 예정입니다.
          </p>

          <PrimaryButton className="settings-close-button" onClick={onClose}>
            닫기
          </PrimaryButton>
        </section>
      </div>
    </div>
  )
}

export function StartScreen({ onStart, onOpenLoadSlots }: StartScreenProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <section className="screen start-screen">
      <div className="start-topbar">
        <span className="version-badge">Version 0.10</span>
        <button
          type="button"
          className="icon-button start-settings-button"
          aria-label="옵션 열기"
          onClick={() => setIsSettingsOpen(true)}
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="start-main">
        <div className="hero-panel start-hero-panel">
          <h1 className="hero-title">Re Start Human</h1>
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

      {isSettingsOpen ? <SettingsModal onClose={() => setIsSettingsOpen(false)} /> : null}
    </section>
  )
}