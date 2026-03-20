import { PrimaryButton } from '../common/Ui'

interface StartScreenProps {
  onStart: () => void
  onOpenLoadSlots: () => void
  savedCount: number
}

const highlights = [
  {
    title: '한 화면 한 질문',
    body: '모바일 세로 화면에 맞춰 한 번에 하나씩만 답하게 구성했습니다.',
  },
  {
    title: '계산 엔진 분리',
    body: '배당, 건보료, 보유세, 10년 추정을 UI 밖 모듈에서 계산합니다.',
  },
  {
    title: '모바일 확장 대비',
    body: '지금은 웹 프로토타입이지만 나중에 Capacitor로 앱 패키징하기 쉬운 구조입니다.',
  },
]

export function StartScreen({ onStart, onOpenLoadSlots, savedCount }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <div className="hero-panel">
        <p className="eyebrow">한국 은퇴 현금흐름 계산기</p>
        <h1 className="hero-title">은퇴 후 월 현금흐름 판단 계산기</h1>
        <p className="hero-copy">
          질문형 입력으로 월 실사용 가능액, 월 흑자·적자, 10년 누적 흐름을
          빠르게 추정하는 프로토타입입니다.
        </p>
      </div>

      <div className="feature-list">
        {highlights.map((item) => (
          <article key={item.title} className="feature-card">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      <div className="start-actions">
        <PrimaryButton className="wide-button" onClick={onStart}>
          새 계산 시작
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          className="wide-button"
          onClick={onOpenLoadSlots}
        >
          저장된 계산 불러오기{savedCount > 0 ? ` (${savedCount})` : ''}
        </PrimaryButton>
      </div>

      <div className="note-panel">
        <h2>입력 단위</h2>
        <p>
          금액 입력은 모두 만원 단위입니다. 결과 표시는 원 단위로 환산해서 보여줍니다.
        </p>
      </div>
    </section>
  )
}
