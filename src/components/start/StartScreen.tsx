import { useState, type ReactNode } from 'react'
import { PrimaryButton } from '../common/Ui'
import startHeroDarkImage from '../../assets/retirement-journey-hero-dark-v3.jpg'
import startHeroLightImage from '../../assets/retirement-journey-hero-light-v3.jpg'
import { APP_COMPANY, APP_CONTACT_EMAIL, APP_VERSION } from '../../config/appMeta'
import { policyConfig } from '../../config/policyConfig'
import type { ThemeMode } from '../../hooks/useThemeMode'

interface StartScreenProps {
  onStart: () => void
  onOpenLoadSlots: () => void
  headerAction?: ReactNode
  themeMode: ThemeMode
}

type StartIconName = 'wallet' | 'growth' | 'pension' | 'shield' | 'chart' | 'archive' | 'book'

function StartIcon({ name }: { name: StartIconName }) {
  const paths: Record<StartIconName, ReactNode> = {
    wallet: (
      <>
        <path d="M4.5 7.5h15v11h-15z" />
        <path d="M6 7.5V5.8A1.8 1.8 0 0 1 7.8 4h8.7" />
        <path d="M15.5 11h5v4h-5a2 2 0 0 1 0-4Z" />
      </>
    ),
    growth: (
      <>
        <path d="M5 19V9M10 19v-5m5 5V11m4 8V5" />
        <path d="m5 8 5-4 5 4 4-4" />
      </>
    ),
    pension: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M6.5 20v-3.5a5.5 5.5 0 0 1 11 0V20M9 14l3 3 3-3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19h16M6 16v-4m6 4V8m6 8V5" />
        <path d="m5 9 5-4 4 2 5-4" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16v13H4zM3 4h18v3H3z" />
        <path d="M9 11h6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 4H11v15H7.5A3.5 3.5 0 0 0 4 20.5z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 4H13v15h3.5a3.5 3.5 0 0 1 3.5 1.5z" />
      </>
    ),
  }

  return (
    <svg className="start-icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  )
}

const overviewCards: Array<{
  icon: StartIconName
  label: string
  value: string
  copy: string
  tone: string
}> = [
  { icon: 'wallet', label: '생활비', value: '월 지출', copy: '주거·보험·고정비', tone: 'blue' },
  { icon: 'growth', label: '자산 소득', value: '연 배당', copy: '일반계좌·ISA', tone: 'teal' },
  { icon: 'pension', label: '은퇴 소득', value: '연금', copy: '국민·기타연금', tone: 'indigo' },
  { icon: 'shield', label: '예상 부담', value: '세금·건보', copy: '공개 기준 추정', tone: 'orange' },
]

export function StartScreen({
  onStart,
  onOpenLoadSlots,
  headerAction,
  themeMode,
}: StartScreenProps) {
  const isDarkTheme = themeMode === 'dark'
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const policyBaseMonth = policyConfig.policyBaseDate.slice(0, 7).replace('-', '.')

  return (
    <section className="screen start-screen">
      <header className="start-topbar start-dashboard-header">
        <div className="start-brand-lockup">
          <div className="start-brand-line">
            <span className="start-brand-name">ReStart</span>
            <span className="start-brand-human">
              Huma<span className="start-brand-n">
                n
                <span className="start-brand-sprout" aria-hidden="true" />
              </span>
            </span>
          </div>
          <p>은퇴·배당·생활비를 한눈에 시뮬레이션</p>
        </div>
        {headerAction ? <div className="start-topbar-action">{headerAction}</div> : null}
      </header>

      <div className="start-main">
        <div className="hero-panel start-hero-panel">
          <img
            className="start-hero-image"
            src={isDarkTheme ? startHeroDarkImage : startHeroLightImage}
            alt={isDarkTheme
              ? '따뜻한 집의 불빛으로 이어지는 저녁 재무 여정 일러스트'
              : '햇빛이 비추는 집으로 이어지는 밝은 재무 여정 일러스트'}
            width={1536}
            height={1024}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="start-hero-overlay">
            <p className="start-hero-kicker">RETIREMENT CASHFLOW</p>
            <h1 className="hero-title">
              오늘의 계획이<br />
              <span className="start-title-second-line">
                내일의 <span className="start-title-accent">자유</span>를 만듭니다
              </span>
            </h1>
            <p className="hero-copy">자산과 소득의 균형을 확인하고<br />안정된 노후를 설계하세요.</p>
            <a
              className="start-hero-badge"
              href={policyConfig.policyReferenceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${policyBaseMonth} 대한민국 세법 기준 출처 보기`}
            >
              <span aria-hidden="true" />
              {policyBaseMonth} 대한민국 세법 기준 반영
            </a>
          </div>
        </div>

        <div className="start-overview-grid" aria-label="계산 항목 안내">
          {overviewCards.map((card) => (
            <article key={card.label} className={`start-overview-card tone-${card.tone}`}>
              <div className="start-overview-icon"><StartIcon name={card.icon} /></div>
              <div>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.copy}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="start-actions start-actions-primary">
          <PrimaryButton className="start-primary-cta" onClick={onStart}>
            <StartIcon name="chart" />
            <span>시뮬레이션 시작</span>
            <span className="start-cta-arrow" aria-hidden="true">›</span>
          </PrimaryButton>
        </div>

        <div className="start-quick-actions">
          <button type="button" className="start-quick-button" onClick={onOpenLoadSlots}>
            <StartIcon name="archive" />
            <span>저장 불러오기</span>
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            className="start-quick-button"
            aria-expanded={isHelpVisible}
            aria-controls="start-help"
            onClick={() => setIsHelpVisible((isVisible) => !isVisible)}
          >
            <StartIcon name="book" />
            <span>이용 안내</span>
            <span aria-hidden="true">{isHelpVisible ? '⌄' : '›'}</span>
          </button>
        </div>

        {isHelpVisible ? (
          <section id="start-help" className="help-drawer note-panel start-help-drawer" aria-labelledby="start-help-title">
            <div className="help-drawer-toggle">
              <span id="start-help-title" className="start-help-title"><StartIcon name="book" /> 알아두면 좋은 내용</span>
              <button
                type="button"
                className="help-drawer-toggle-copy start-help-close"
                onClick={() => setIsHelpVisible(false)}
              >
                닫기
              </button>
            </div>
            <div className="help-drawer-body">
              <div className="notice-stack help-drawer-stack">
                <div className="notice-card">
                  <h2>무엇을 계산하나요?</h2>
                  <p>배당, ISA, 건강보험료, 보유세, 생활비를 바탕으로 입력한 기간의 현금흐름을 추정합니다. 결과 화면에서 나이·기간·물가를 바로 바꿔 다시 볼 수 있습니다.</p>
                </div>
                <div className="notice-card">
                  <h2>입력 기준</h2>
                  <p>금액 입력은 모두 만원 단위이며, 연금은 세후 실수령 기준으로 입력합니다. 입력하지 않은 선택 항목은 결과표에서 숨겨 가독성을 우선합니다.</p>
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
                  <p>결과 화면의 저장 불러오기에서 슬롯에 저장·불러오기·삭제를 할 수 있습니다.</p>
                </div>
                <div className="notice-card">
                  <h2>개인정보 및 재산정보 저장 안내</h2>
                  <p>{policyConfig.privacyStorageNotice}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <footer className="start-footer-meta">
          <span>Version : {APP_VERSION}</span>
          <span>회사 : {APP_COMPANY}</span>
          <span>이메일 : <a href={`mailto:${APP_CONTACT_EMAIL}`}>{APP_CONTACT_EMAIL}</a></span>
        </footer>
      </div>
    </section>
  )
}
