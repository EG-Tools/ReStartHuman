import { useEffect, useRef, type ReactNode } from 'react'
import { InlineNumericField, PrimaryButton, ProgressBar } from '../common/Ui'
import { formatCompactCurrency } from '../../utils/format'
import { type QuestionNumberFieldConfig } from './questionScreen.config'
import type { QuestionStep } from '../../types/alpha'

interface RenderQuestionNumberFieldOptions {
  showHelperText?: boolean
  wrapperClassName?: string
}

export interface QuestionNumberFieldPairConfig {
  key: string
  fields: QuestionNumberFieldConfig[]
  helperText?: string
}

function renderQuestionNumberField(
  field: QuestionNumberFieldConfig,
  { showHelperText = true, wrapperClassName }: RenderQuestionNumberFieldOptions = {},
) {
  const isCurrency = field.display !== 'number'
  const suffix = field.suffix ?? (isCurrency ? '만원' : '')
  const conversionText = isCurrency
    ? `환산 ${field.value > 0 ? formatCompactCurrency(field.value) : '0원'}`
    : field.helperText

  return (
    <div className={wrapperClassName}>
      <div className="question-block-header question-number-header">
        <h2>{field.label}</h2>
        {isCurrency ? (
          <span className="question-number-conversion">
            {conversionText}
          </span>
        ) : null}
      </div>

      <InlineNumericField
        value={field.value}
        onChange={field.onChange}
        suffix={suffix || undefined}
        min={field.min ?? 0}
        step={field.step ?? 1}
        max={field.max}
        disabled={field.disabled}
        display={isCurrency ? 'currency' : 'number'}
        commitMode="change"
        inlineClassName="input-inline question-number-inline"
        shellClassName="input-shell question-number-shell"
        inputClassName="input-control question-number-input"
        suffixClassName="input-suffix question-number-suffix"
        inputAriaLabel={field.label}
      />

      {field.helperText && showHelperText && isCurrency ? (
        <p className="screen-copy question-number-helper">
          {field.helperText}
        </p>
      ) : null}
    </div>
  )
}

export function QuestionLayout({
  question,
  questionIndex,
  totalQuestions,
  onBack,
  onNext,
  onSeekQuestion,
  headerAction,
  children,
}: {
  question: QuestionStep
  questionIndex: number
  totalQuestions: number
  onBack: () => void
  onNext: () => void
  onSeekQuestion: (index: number) => void
  headerAction?: ReactNode
  children: ReactNode
}) {
  const screenRef = useRef<HTMLElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, left: 0 })
    screenRef.current?.scrollTo({ top: 0, left: 0 })

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0 })
    }
  }, [question.id, questionIndex])

  return (
    <section ref={screenRef} className={`screen question-screen question-${question.id}`}>
      <div className="screen-header question-screen-header">
        <div className="question-screen-header-copy">
          <p className="eyebrow">질문 {questionIndex + 1}</p>
          <h1 className="screen-title">{question.title}</h1>
          {question.description ? <p className="screen-copy">{question.description}</p> : null}
        </div>
        {headerAction ? <div className="question-screen-header-action">{headerAction}</div> : null}
        <div className="progress-shell question-progress-shell">
          <span className="progress-label">
            {questionIndex + 1} / {totalQuestions}
          </span>
          <ProgressBar
            value={questionIndex + 1}
            max={totalQuestions}
            ariaLabel="질문 진행 상태"
            onChange={(nextValue) => onSeekQuestion(nextValue - 1)}
          />
        </div>
      </div>

      <div ref={bodyRef} className="question-body">{children}</div>

      <div className="footer-actions sticky-footer">
        <PrimaryButton variant="ghost" onClick={onBack} disabled={questionIndex === 0}>
          이전
        </PrimaryButton>
        <PrimaryButton onClick={onNext}>
          {questionIndex === totalQuestions - 1 ? '결과 보기' : '다음'}
        </PrimaryButton>
      </div>
    </section>
  )
}

export function QuestionNumberFields({
  columns = 1,
  fields,
}: {
  columns?: number
  fields: QuestionNumberFieldConfig[]
}) {
  const gridClassName = `question-number-grid question-number-grid-${columns > 1 ? 2 : 1}`

  return (
    <div className={gridClassName}>
      {fields.map((field) => (
        <section key={field.key} className="question-block">
          {renderQuestionNumberField(field)}
        </section>
      ))}
    </div>
  )
}

export function QuestionNumberFieldPairs({
  pairs,
}: {
  pairs: QuestionNumberFieldPairConfig[]
}) {
  return (
    <div className="question-number-pair-list">
      {pairs.map((pair) => (
        <section key={pair.key} className="question-block question-number-pair-block">
          <div className="question-number-pair-grid">
            {renderQuestionNumberField(pair.fields[0], {
              showHelperText: false,
              wrapperClassName: 'question-number-pair-field',
            })}
            {renderQuestionNumberField(pair.fields[1], {
              showHelperText: false,
              wrapperClassName: 'question-number-pair-field',
            })}
          </div>

          {pair.helperText ? (
            <p className="screen-copy question-number-helper question-number-pair-helper">
              {pair.helperText}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  )
}
