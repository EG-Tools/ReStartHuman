import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatCurrency } from '../../utils/format'

const MANWON = 10_000

const formatDraftValue = (value: number) =>
  Number.isFinite(value) && value !== 0 ? String(value) : ''

const parseDraftValue = (draftValue: string, minValue: number) => {
  const normalizedValue = Number(draftValue) || 0
  return Math.max(normalizedValue, minValue)
}

export interface ToggleOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface PrimaryButtonProps {
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function PrimaryButton({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled,
  className = '',
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  onChange?: (value: number) => void
  ariaLabel?: string
}

export function ProgressBar({
  value,
  max = 100,
  onChange,
  ariaLabel = '질문 이동',
}: ProgressBarProps) {
  const isInteractive = Boolean(onChange)
  const boundedMax = Math.max(max, 1)
  const boundedValue = isInteractive
    ? Math.min(Math.max(value, 1), boundedMax)
    : Math.min(Math.max(value, 0), 100)
  const ratio = isInteractive
    ? boundedMax <= 1
      ? 100
      : ((boundedValue - 1) / (boundedMax - 1)) * 100
    : boundedValue

  return (
    <div className={`progress-bar ${isInteractive ? 'is-interactive' : ''}`.trim()}>
      <span className="progress-bar-fill" style={{ width: `${ratio}%` }} />
      {isInteractive ? (
        <input
          className="progress-bar-input"
          type="range"
          min={1}
          max={boundedMax}
          step={1}
          value={boundedValue}
          aria-label={ariaLabel}
          onChange={(event) => onChange?.(Number(event.target.value))}
        />
      ) : null}
    </div>
  )
}

interface ToggleButtonGroupProps<T extends string> {
  value: T
  options: readonly ToggleOption<T>[]
  onChange: (value: T) => void
  columns?: 'stack' | 'grid'
}

export function ToggleButtonGroup<T extends string>({
  value,
  options,
  onChange,
  columns = 'grid',
}: ToggleButtonGroupProps<T>) {
  return (
    <div className={`toggle-group toggle-group-${columns} toggle-group-count-${options.length}`}>
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            className={`toggle-card ${active ? 'is-active' : ''}`.trim()}
            onClick={() => onChange(option.value)}
          >
            <span className="toggle-card-label">{option.label}</span>
            {option.description ? (
              <span className="toggle-card-description">{option.description}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

interface ChoiceQuestionProps<T extends string> {
  value: T
  options: readonly ToggleOption<T>[]
  onChange: (value: T) => void
  columns?: 'stack' | 'grid'
}

export function ChoiceQuestion<T extends string>(props: ChoiceQuestionProps<T>) {
  return <ToggleButtonGroup {...props} />
}

interface NumericInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
  suffix?: string
  min?: number
  step?: number
  display?: 'currency' | 'number'
  disabled?: boolean
}

export function NumericInput({
  label,
  value,
  onChange,
  helperText,
  suffix,
  min = 0,
  step,
  display = 'currency',
  disabled = false,
}: NumericInputProps) {
  const isCurrency = display === 'currency'
  const displayValue = isCurrency ? value / MANWON : value
  const resolvedStep = step ?? 1
  const resolvedSuffix = suffix ?? (isCurrency ? '\uB9CC\uC6D0' : undefined)
  const [draftValue, setDraftValue] = useState(() => formatDraftValue(displayValue))
  const isEditingRef = useRef(false)

  useEffect(() => {
    if (!isEditingRef.current) {
      setDraftValue(formatDraftValue(displayValue))
    }
  }, [displayValue])

  const committedDraftValue = parseDraftValue(draftValue, min)
  const previewValue = isCurrency ? committedDraftValue * MANWON : committedDraftValue
  const preview = helperText ?? (isCurrency ? `\uD658\uC0B0: ${formatCurrency(previewValue)}` : undefined)

  const commitDraftValue = () => {
    const nextValue = parseDraftValue(draftValue, min)
    onChange(isCurrency ? nextValue * MANWON : nextValue)
    setDraftValue(formatDraftValue(nextValue))
  }

  return (
    <label className={`input-card${disabled ? ' is-disabled' : ''}`}>
      <span className="input-card-label">{label}</span>
      <div className="input-inline">
        <div className="input-shell">
          <input
            className="input-control"
            type="number"
            inputMode="decimal"
            min={min}
            step={resolvedStep}
            value={draftValue}
            placeholder="0"
            onFocus={(event) => {
              isEditingRef.current = true
              event.currentTarget.select()
            }}
            onBlur={() => {
              isEditingRef.current = false
              commitDraftValue()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur()
              }

              if (event.key === 'Escape') {
                isEditingRef.current = false
                setDraftValue(formatDraftValue(displayValue))
                event.currentTarget.blur()
              }
            }}
            disabled={disabled}
            onWheel={(event) => {
              if (document.activeElement === event.currentTarget) {
                event.currentTarget.blur()
              }
            }}
            onChange={(event) => {
              setDraftValue(event.target.value)
            }}
          />
        </div>
        {resolvedSuffix ? <span className="input-suffix">{resolvedSuffix}</span> : null}
      </div>
      {preview ? <span className="input-preview">{preview}</span> : null}
    </label>
  )
}
export interface NumberField {
  key: string
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
  suffix?: string
  min?: number
  step?: number
  display?: 'currency' | 'number'
  disabled?: boolean
}

export function NumberFields({
  fields,
  columns = 1,
}: {
  fields: NumberField[]
  columns?: 1 | 2
}) {
  return (
    <div className={`field-grid field-grid-${columns}`}>
      {fields.map((field) => {
        const { key, ...rest } = field
        return <NumericInput key={key} {...rest} />
      })}
    </div>
  )
}

