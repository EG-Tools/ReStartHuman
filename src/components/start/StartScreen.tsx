import { useState, type ReactNode } from 'react'
import { BookIcon, ClockIcon } from '../common/AppIcons'
import { PrimaryButton } from '../common/Ui'
import pensionSupportWonImage from '../../assets/pension-support-won.png'
import startHeroDarkImage from '../../assets/retirement-journey-hero-dark-v3.webp'
import startHeroLightImage from '../../assets/retirement-journey-hero-light-v3.webp'
import { APP_COMPANY, APP_CONTACT_EMAIL, APP_VERSION } from '../../config/appMeta'
import { policyConfig } from '../../config/policyConfig'
import type { ThemeMode } from '../../hooks/useThemeMode'

interface StartScreenProps {
  onStart: () => void
  onOpenLoadSlots: () => void
  headerAction?: ReactNode
  themeMode: ThemeMode
}

type StartIconName = 'wallet' | 'growth' | 'pension' | 'health' | 'chart'
type SvgStartIconName = Exclude<StartIconName, 'pension'>

function StartIcon({ name }: { name: StartIconName }) {
  if (name === 'pension') {
    return (
      <img
        className="start-icon start-icon-pension-image"
        src={pensionSupportWonImage}
        alt=""
        aria-hidden="true"
      />
    )
  }

  const icons: Record<SvgStartIconName, ReactNode> = {
    wallet: (
      <>
        <path fill="currentColor" d="M4.2 7.2h13.9A2.9 2.9 0 0 1 21 10.1v7.1a2.9 2.9 0 0 1-2.9 2.9H4.2A2.2 2.2 0 0 1 2 17.9V9.4a2.2 2.2 0 0 1 2.2-2.2Z" />
        <path d="m4.5 7.2 10.8-3.1a1.5 1.5 0 0 1 1.9 1.4v1.7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path fill="var(--start-icon-cutout, white)" d="M16.2 11.2H22v4.9h-5.8a2.45 2.45 0 1 1 0-4.9Z" />
        <circle cx="17.2" cy="13.65" r=".85" fill="currentColor" />
      </>
    ),
    growth: (
      <>
        <rect x="2.5" y="15.3" width="4" height="6.2" rx="1.1" fill="currentColor" />
        <rect x="7.8" y="12.7" width="4" height="8.8" rx="1.1" fill="currentColor" />
        <rect x="13.1" y="9.7" width="4" height="11.8" rx="1.1" fill="currentColor" />
        <path d="m3.4 11 5.1-4.6 3.7 2.8 7.8-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16.8 3.1H20v3.2" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18.5" cy="17.4" r="4.3" fill="currentColor" />
        <path d="m15.8 15.5 1.05 3.7 1.65-3.7 1.65 3.7 1.05-3.7M15.5 16.75h6M15.8 18h5.4" fill="none" stroke="var(--start-icon-cutout, white)" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    health: (
      <>
        <path fill="currentColor" d="M12 21.2 4.1 13.8C-.1 9.9 2.1 3 7.5 3A5.6 5.6 0 0 1 12 5.5 5.6 5.6 0 0 1 16.5 3c5.4 0 7.6 6.9 3.4 10.8Z" />
        <path d="M3.6 12.2h4.1l1.6-3.1 3.1 6.5 2.2-4.2h5.8" fill="none" stroke="var(--start-icon-cutout, white)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    chart: (
      <>
        <rect x="3" y="15" width="4" height="6" rx="1" fill="currentColor" />
        <rect x="9.8" y="11.5" width="4" height="9.5" rx="1" fill="currentColor" />
        <rect x="16.6" y="8" width="4" height="13" rx="1" fill="currentColor" />
        <path d="m3.8 11.3 5.3-4.6 4.1 2.6 7.2-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.2 3.2h3.3v3.3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  }

  return (
    <svg className={`start-icon start-icon-${name}`} viewBox="0 0 24 24" aria-hidden="true">
      <g>{icons[name]}</g>
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
  { icon: 'health', label: '예상 부담', value: '세금·건보', copy: '공개 기준 추정', tone: 'orange' },
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
            <ClockIcon className="start-icon" />
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
            <BookIcon className="start-icon" />
            <span>이용 안내</span>
            <span aria-hidden="true">{isHelpVisible ? '⌄' : '›'}</span>
          </button>
        </div>

        {isHelpVisible ? (
          <section id="start-help" className="help-drawer note-panel start-help-drawer" aria-labelledby="start-help-title">
            <div className="help-drawer-toggle">
              <span id="start-help-title" className="start-help-title"><BookIcon className="start-icon" /> 알아두면 좋은 내용</span>
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
