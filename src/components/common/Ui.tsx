import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formatCurrency } from '../../utils/format'

const MANWON = 10_000

type NumericDisplayMode = 'currency' | 'number'
type NumericCommitMode = 'blur' | 'change'
type ZeroDisplayMode = 'blank' | 'zero'

const formatDraftValue = (
  value: number,
  zeroDisplayMode: ZeroDisplayMode = 'blank',
) =>
  Number.isFinite(value) && (value !== 0 || zeroDisplayMode === 'zero') ? String(value) : ''

const parseDraftValue = (draftValue: string, minValue: number) => {
  const normalizedValue = Number(draftValue) || 0
  return Math.max(normalizedValue, minValue)
}

const toDisplayValue = (value: number, display: NumericDisplayMode) =>
  display === 'currency' ? value / MANWON : value

const toCommitValue = (value: number, display: NumericDisplayMode) =>
  display === 'currency' ? value * MANWON : value

interface UseNumericDraftControllerProps {
  value: number
  onChange: (value: number) => void
  min?: number
  display?: NumericDisplayMode
  commitMode?: NumericCommitMode
  idleZeroDisplay?: ZeroDisplayMode
}

function useNumericDraftController({
  value,
  onChange,
  min = 0,
  display = 'currency',
  commitMode = 'blur',
  idleZeroDisplay = 'blank',
}: UseNumericDraftControllerProps) {
  const displayValue = Number.isFinite(value) ? toDisplayValue(value, display) : 0
  const [editBuffer, setEditBuffer] = useState<string | null>(null)
  const replaceOnNextEntryRef = useRef(false)

  const draftValue = editBuffer ?? formatDraftValue(displayValue, idleZeroDisplay)

  const commitRawValue = (rawValue: string) => {
    const nextValue = parseDraftValue(rawValue, min)
    onChange(toCommitValue(nextValue, display))
    return nextValue
  }

  return {
    draftValue,
    displayValue,
    commitDraftValue: () => {
      const nextValue = commitRawValue(draftValue)
      setEditBuffer(null)
      return nextValue
    },
    inputHandlers: {
      onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
        setEditBuffer((currentValue) =>
          currentValue ?? formatDraftValue(displayValue, idleZeroDisplay),
        )
        replaceOnNextEntryRef.current = true

        requestAnimationFrame(() => {
          const input = event.currentTarget
          const caretPosition = input.value.length
          input.setSelectionRange(caretPosition, caretPosition)
        })
      },
      onBlur: () => {
        if (commitMode === 'blur') {
          commitRawValue(draftValue)
        }

        replaceOnNextEntryRef.current = false
        setEditBuffer(null)
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          replaceOnNextEntryRef.current = false
          event.currentTarget.blur()
          return
        }

        if (event.key === 'Escape') {
          replaceOnNextEntryRef.current = false
          setEditBuffer(null)
          event.currentTarget.blur()
          return
        }

        if (replaceOnNextEntryRef.current) {
          const isDigitKey = /^[0-9]$/.test(event.key)
          const isDecimalKey = event.key === '.' || event.key === ','
          const isDeleteKey = event.key === 'Backspace' || event.key === 'Delete'
          const isNavigationKey =
            event.key === 'ArrowLeft' ||
            event.key === 'ArrowRight' ||
            event.key === 'Home' ||
            event.key === 'End'

          if (isDigitKey || isDecimalKey || isDeleteKey) {
            event.preventDefault()
            const replacementValue = isDeleteKey ? '' : isDecimalKey ? '0.' : event.key
            setEditBuffer(replacementValue)
            replaceOnNextEntryRef.current = false

            if (commitMode === 'change') {
              commitRawValue(replacementValue)
            }

            return
          }

          if (isNavigationKey) {
            replaceOnNextEntryRef.current = false
          }
        }
      },
      onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => {
        if (!replaceOnNextEntryRef.current) {
          return
        }

        event.preventDefault()
        const pastedText = event.clipboardData.getData('text')
        setEditBuffer(pastedText)
        replaceOnNextEntryRef.current = false

        if (commitMode === 'change') {
          commitRawValue(pastedText)
        }
      },
      onWheel: (event: React.WheelEvent<HTMLInputElement>) => {
        if (document.activeElement === event.currentTarget) {
          event.currentTarget.blur()
        }
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextDraftValue = event.target.value
        setEditBuffer(nextDraftValue)
        replaceOnNextEntryRef.current = false

        if (commitMode === 'change') {
          commitRawValue(nextDraftValue)
        }
      },
    },
  }
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

interface InlineNumericFieldProps {
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  step?: number
  max?: number
  display?: NumericDisplayMode
  disabled?: boolean
  commitMode?: NumericCommitMode
  idleZeroDisplay?: ZeroDisplayMode
  inlineClassName?: string
  shellClassName?: string
  inputClassName?: string
  suffixClassName?: string
  action?: ReactNode
  placeholder?: string
  inputAriaLabel?: string
  inlineStyle?: CSSProperties
  shellStyle?: CSSProperties
  inputStyle?: CSSProperties
  suffixStyle?: CSSProperties
}

export function InlineNumericField({
  value,
  onChange,
  suffix,
  min = 0,
  step,
  max,
  display = 'currency',
  disabled = false,
  commitMode = 'blur',
  idleZeroDisplay = 'blank',
  inlineClassName = 'input-inline',
  shellClassName = 'input-shell',
  inputClassName = 'input-control',
  suffixClassName = 'input-suffix',
  action,
  placeholder = '0',
  inputAriaLabel,
  inlineStyle,
  shellStyle,
  inputStyle,
  suffixStyle,
}: InlineNumericFieldProps) {
  const resolvedStep = step ?? 1
  const resolvedSuffix = suffix ?? (display === 'currency' ? '만원' : undefined)
  const { draftValue, inputHandlers } = useNumericDraftController({
    value,
    onChange,
    min,
    display,
    commitMode,
    idleZeroDisplay,
  })

  return (
    <div className={inlineClassName} style={inlineStyle}>
      <div className={shellClassName} style={shellStyle}>
        <input
          className={inputClassName}
          type="number"
          inputMode="decimal"
          min={min}
          step={resolvedStep}
          max={max}
          value={draftValue}
          aria-label={inputAriaLabel}
          placeholder={placeholder}
          disabled={disabled}
          style={inputStyle}
          {...inputHandlers}
        />
      </div>
      {resolvedSuffix ? (
        <span className={suffixClassName} style={suffixStyle}>
          {resolvedSuffix}
        </span>
      ) : null}
      {action}
    </div>
  )
}

interface NumericInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
  suffix?: string
  min?: number
  step?: number
  display?: NumericDisplayMode
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
  const previewSourceValue = Number.isFinite(value) ? value : 0
  const preview = helperText ?? (isCurrency ? `환산: ${formatCurrency(previewSourceValue)}` : undefined)

  return (
    <label className={`input-card${disabled ? ' is-disabled' : ''}`}>
      <span className="input-card-label">{label}</span>
      <InlineNumericField
        value={value}
        onChange={onChange}
        suffix={suffix}
        min={min}
        step={step}
        display={display}
        disabled={disabled}
      />
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
  display?: NumericDisplayMode
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
