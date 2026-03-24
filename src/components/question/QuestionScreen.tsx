import { useEffect, useRef, type ReactNode } from 'react'
import { ChoiceQuestion, InlineNumericField, NumberFields, PrimaryButton, ProgressBar } from '../common/Ui'
import type { QuestionStep, RetireCalcFormData } from '../../types/retireCalc'
import { formatCompactCurrency } from '../../utils/format'

interface QuestionScreenProps {
  question: QuestionStep
  questionIndex: number
  totalQuestions: number
  formData: RetireCalcFormData
  onBack: () => void
  onNext: () => void
  onSeekQuestion: (index: number) => void
  onPatchFormData: (patch: Partial<RetireCalcFormData>) => void
  headerAction?: ReactNode
}

interface QuestionNumberFieldConfig {
  key: string
  label: string
  value: number
  onChange: (value: number) => void
  helperText?: string
  disabled?: boolean
  display?: 'currency' | 'number'
  suffix?: string
  min?: number
  step?: number
  max?: number
}


const householdOptions = [
  { value: 'single', label: '본인' },
  { value: 'couple', label: '공동명의' },
] as const

const housingOptions = [
  { value: 'own', label: '자가', description: '재산세 추정을 포함합니다.' },
  { value: 'jeonse', label: '전세', description: '전세 보증금 기준으로 입력합니다.' },
  { value: 'monthlyRent', label: '월세', description: '보증금과 월세를 함께 입력합니다.' },
] as const

const dividendModeOptions = [
  { value: 'gross', label: '세전 입력', description: '입력값을 기준으로 세후 배당을 계산합니다.' },
  { value: 'net', label: '세후 입력', description: '입력값을 이미 세후 금액으로 처리합니다.' },
] as const

const isaTypeOptions = [
  { value: 'general', label: '일반형' },
  { value: 'workingClass', label: '서민형' },
] as const

const yesNoOptions = [
  { value: 'yes', label: '예' },
  { value: 'no', label: '아니오' },
] as const

const simulationYearOptions = [
  { value: '10', label: '10년' },
  { value: '30', label: '30년' },
  { value: '50', label: '50년' },
] as const

const dividendOwnershipOptions = [
  { value: 'mineOnly', label: '본인' },
  { value: 'spouseOnly', label: '배우자' },
  { value: 'split', label: '분할' },
] as const

const propertyOwnershipOptions = [
  { value: 'mineOnly', label: '본인' },
  { value: 'spouseOnly', label: '배우자' },
  { value: 'split', label: '공동명의' },
] as const

const otherIncomeTypeOptions = [
  { value: 'none', label: '없음', description: '추가 월소득이 없습니다.' },
  { value: 'earned', label: '근로소득', description: '월 급여성 소득입니다.' },
  { value: 'business', label: '사업소득', description: '월 사업소득입니다.' },
  { value: 'pension', label: '기타연금', description: '기타 연금성 소득입니다.' },
  { value: 'other', label: '기타', description: '그 외 월 현금유입입니다.' },
] as const

const otherIncomeTypeOptionRows = [
  [otherIncomeTypeOptions[0]],
  [otherIncomeTypeOptions[1], otherIncomeTypeOptions[2]],
  [otherIncomeTypeOptions[3], otherIncomeTypeOptions[4]],
] as const

const healthInsuranceOptions = [
  { value: 'regional', label: '지역가입자', description: '소득·재산 구조를 반영한 지역 추정입니다.' },
  {
    value: 'employee',
    label: '직장가입자',
    description: '보수월액과 보수 외 소득 구조를 반영합니다.',
  },
  {
    value: 'dependent',
    label: '피부양자',
    description: '조건 유지 시 0원, 초과 시 지역 기준으로 전환합니다.',
  },
  {
    value: 'bothRegional',
    label: '부부모두지역',
    description: '지역가입자 구조와 같은 방식으로 추정합니다.',
  },
  {
    value: 'employeeWithDependentSpouse',
    label: '직장+피부양 배우자',
    description: '직장가입자 구조 중심으로 계산합니다.',
  },
  { value: 'other', label: '기타', description: '지역가입자 구조에 가깝게 추정합니다.' },
] as const

const healthInsuranceOptionRows = [
  [healthInsuranceOptions[0], healthInsuranceOptions[3]],
  [healthInsuranceOptions[1], healthInsuranceOptions[4]],
  [healthInsuranceOptions[2], healthInsuranceOptions[5]],
] as const

const livingCostModeOptions = [
  { value: 'total', label: '총 금액' },
  { value: 'detailed', label: '세부입력' },
] as const

function QuestionLayout({
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

function QuestionNumberFields({
  columns = 1,
  fields,
}: {
  columns?: number
  fields: QuestionNumberFieldConfig[]
}) {
  const gridClassName = `question-number-grid question-number-grid-${columns > 1 ? 2 : 1}`

  return (
    <div className={gridClassName}>
      {fields.map((field) => {
        const isCurrency = field.display !== 'number'
        const suffix = field.suffix ?? (isCurrency ? '만원' : '')
        const conversionText = isCurrency
          ? `환산 ${field.value > 0 ? formatCompactCurrency(field.value) : '0원'}`
          : field.helperText

        return (
          <section key={field.key} className="question-block">
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

            {field.helperText && isCurrency ? (
              <p className="screen-copy question-number-helper">
                {field.helperText}
              </p>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

export function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  formData,
  onBack,
  onNext,
  onSeekQuestion,
  onPatchFormData,
  headerAction,
}: QuestionScreenProps) {
  const update = <K extends keyof RetireCalcFormData>(
    key: K,
    value: RetireCalcFormData[K],
  ) => {
    onPatchFormData({ [key]: value } as Pick<RetireCalcFormData, K>)
  }

  const singleIsaType = formData.isaType === 'workingClass' ? 'workingClass' : 'general'
  const myIsaType = formData.myIsaType === 'workingClass' ? 'workingClass' : 'general'
  const spouseIsaType =
    formData.spouseIsaType === 'workingClass' ? 'workingClass' : 'general'
  const usesEmployeeHealthInsurance =
    formData.healthInsuranceType === 'employee' ||
    formData.healthInsuranceType === 'employeeWithDependentSpouse'
  const usesEarnedIncomeAsSalary =
    usesEmployeeHealthInsurance && formData.otherIncomeType === 'earned'

  const renderBooleanChoice = (
    label: string,
    value: boolean,
    onChange: (nextValue: boolean) => void,
    helpText?: string,
  ) => (
    <section className="question-block boolean-question">
      <div className="question-block-header">
        <div className="title-with-help">
          <h2>{label}</h2>
          {helpText ? (
            <details className="note-popover note-popover-left">
              <summary className="note-popover-trigger" aria-label={`${label} 설명 보기`}>
                ?
              </summary>
              <div className="note-popover-bubble">{helpText}</div>
            </details>
          ) : null}
        </div>
      </div>
      <ChoiceQuestion
        value={value ? 'yes' : 'no'}
        options={yesNoOptions}
        onChange={(nextValue) => onChange(nextValue === 'yes')}
      />
    </section>
  )

  const renderChoiceRows = <T extends string>(
    value: T,
    optionRows: readonly (readonly { value: T; label: string; description?: string }[])[],
    onChange: (nextValue: T) => void,
  ) => (
    <div className="question-stack question-stack-compact">
      {optionRows.map((row, rowIndex) => (
        <ChoiceQuestion
          key={`row-${rowIndex}`}
          value={value}
          options={[...row]}
          onChange={onChange}
        />
      ))}
    </div>
  )

  const renderContent = () => {
    switch (question.id) {
      case 'household':
        return (
          <div className="question-stack">
            <QuestionNumberFields
              fields={[
                {
                  key: 'currentAge',
                  label: '현재 나이',
                  value: formData.currentAge,
                  onChange: (value) => update('currentAge', value),
                  display: 'number',
                  suffix: '세',
                  min: 1,
                  step: 1,
                  helperText: '결과 해석의 자산 수준 비교 기준에 사용합니다.',
                },
              ]}
            />
            <section className="question-block household-choice-block">
              <div className="question-block-header">
                <h2>부동산 명의</h2>
              </div>
              <ChoiceQuestion
                value={formData.householdType}
                options={householdOptions}
                onChange={(value) =>
                  onPatchFormData({
                    householdType: value,
                    isJointOwnership: value === 'couple',
                  })
                }
              />
            </section>
            <section className="question-block">
              <div className="question-block-header">
                <h2>자녀가 있나요?</h2>
              </div>
              <ChoiceQuestion
                value={(formData.hasChildren ?? false) ? 'yes' : 'no'}
                options={yesNoOptions}
                onChange={(value) =>
                  onPatchFormData({
                    hasChildren: value === 'yes',
                    childCount:
                      value === 'yes'
                        ? Math.max(formData.childCount ?? 1, 1)
                        : 0,
                  })
                }
              />
              <p className="screen-copy question-copy-note">
                현재는 참고용이며, 추후 계산 구조에 반영할 예정입니다.
              </p>
            </section>
            {(formData.hasChildren ?? false) ? (
              <NumberFields
                fields={[
                  {
                    key: 'childCount',
                    label: '자녀 수',
                    value: Math.max(formData.childCount ?? 1, 1),
                    onChange: (value) => update('childCount', Math.max(value, 1)),
                    display: 'number',
                    suffix: '명',
                    min: 1,
                    step: 1,
                  },
                ]}
              />
            ) : null}
          </div>
        )

      case 'housingDetails':
        return (
          <div className="question-stack">
            <section className="question-block housing-choice-block">
              <div className="question-block-header">
                <h2>주거 형태</h2>
              </div>
              <ChoiceQuestion
                value={formData.housingType}
                options={housingOptions}
                onChange={(value) =>
                  onPatchFormData({
                    housingType: value,
                    isSingleHomeOwner: value === 'own',
                  })
                }
              />
            </section>

            {formData.housingType === 'own' ? (
              <QuestionNumberFields
                columns={2}
                fields={[
                  {
                    key: 'homeMarketValue',
                    label: '시가',
                    value: formData.homeMarketValue,
                    onChange: (value) => update('homeMarketValue', value),
                  },
                  {
                    key: 'homeOfficialValue',
                    label: '공시가격',
                    value: formData.homeOfficialValue,
                    onChange: (value) => update('homeOfficialValue', value),
                  },
                ]}
              />
            ) : null}

            {formData.housingType === 'jeonse' ? (
              <QuestionNumberFields
                fields={[
                  {
                    key: 'jeonseDeposit',
                    label: '전세 보증금',
                    value: formData.jeonseDeposit,
                    onChange: (value) => update('jeonseDeposit', value),
                  },
                ]}
              />
            ) : null}

            {formData.housingType === 'monthlyRent' ? (
              <>
                <QuestionNumberFields
                  columns={2}
                  fields={[
                    {
                      key: 'monthlyRentDeposit',
                      label: '월세 보증금',
                      value: formData.monthlyRentDeposit,
                      onChange: (value) => update('monthlyRentDeposit', value),
                    },
                    {
                      key: 'monthlyRentAmount',
                      label: '월세',
                      value: formData.monthlyRentAmount,
                      onChange: (value) => update('monthlyRentAmount', value),
                    },
                  ]}
                />
                {renderBooleanChoice(
                  '관리비가 월세에 포함되어 있나요?',
                  formData.maintenanceIncludedInRent,
                  (value) => update('maintenanceIncludedInRent', value),
                )}
                {!formData.maintenanceIncludedInRent ? (
                  <QuestionNumberFields
                    fields={[
                      {
                        key: 'monthlyMaintenanceFee',
                        label: '월 관리비',
                        value: formData.monthlyMaintenanceFee,
                        onChange: (value) => update('monthlyMaintenanceFee', value),
                      },
                    ]}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        )
      case 'propertyAssets':
        return (
          <div className="question-stack">
            <QuestionNumberFields
              fields={[
                {
                  key: 'landValue',
                  label: '토지 금액',
                  value: formData.landValue,
                  onChange: (value) => update('landValue', value),
                },
              ]}
            />
            {formData.householdType === 'couple' ? (
              <section className="question-block">
                <div className="question-block-header">
                  <h2>토지 소유형태</h2>
                </div>
                <ChoiceQuestion
                  value={formData.landOwnershipType}
                  options={propertyOwnershipOptions}
                  onChange={(value) =>
                    onPatchFormData(
                      value === 'split'
                        ? {
                            landOwnershipType: value,
                            myLandShare: 50,
                            spouseLandShare: 50,
                          }
                        : value === 'spouseOnly'
                          ? {
                              landOwnershipType: value,
                              myLandShare: 0,
                              spouseLandShare: 100,
                            }
                          : {
                              landOwnershipType: value,
                              myLandShare: 100,
                              spouseLandShare: 0,
                            },
                    )
                  }
                />
                {formData.landOwnershipType === 'split' ? (
                  <p className="screen-copy question-copy-note">
                    본인 50%, 배우자 50% 자동 적용됩니다.
                  </p>
                ) : null}
              </section>
            ) : null}

            <QuestionNumberFields
              fields={[
                {
                  key: 'otherPropertyOfficialValue',
                  label: '기타 부동산 공시가격',
                  value: formData.otherPropertyOfficialValue,
                  onChange: (value) => update('otherPropertyOfficialValue', value),
                },
              ]}
            />
            {formData.householdType === 'couple' ? (
              <section className="question-block">
                <div className="question-block-header">
                  <h2>기타 부동산 소유형태</h2>
                </div>
                <ChoiceQuestion
                  value={formData.otherPropertyOwnershipType}
                  options={propertyOwnershipOptions}
                  onChange={(value) =>
                    onPatchFormData(
                      value === 'split'
                        ? {
                            otherPropertyOwnershipType: value,
                            myOtherPropertyShare: 50,
                            spouseOtherPropertyShare: 50,
                          }
                        : value === 'spouseOnly'
                          ? {
                              otherPropertyOwnershipType: value,
                              myOtherPropertyShare: 0,
                              spouseOtherPropertyShare: 100,
                            }
                          : {
                              otherPropertyOwnershipType: value,
                              myOtherPropertyShare: 100,
                              spouseOtherPropertyShare: 0,
                            },
                    )
                  }
                />
                {formData.otherPropertyOwnershipType === 'split' ? (
                  <p className="screen-copy question-copy-note">
                    본인 50%, 배우자 50% 자동 적용됩니다.
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        )
      case 'assets':
        return (
          <div className="question-stack">
            <QuestionNumberFields
              columns={2}
              fields={[
                {
                  key: 'taxableAccountAssets',
                  label: '일반 주식 자산',
                  value: formData.taxableAccountAssets,
                  onChange: (value) => update('taxableAccountAssets', value),
                },
                {
                  key: 'isaAssets',
                  label: 'ISA 주식 자산',
                  value: formData.isaAssets,
                  onChange: (value) => update('isaAssets', value),
                },
              ]}
            />
            {formData.householdType === 'couple' ? (
              <>
                <section className="question-block">
                  <div className="question-block-header">
                    <h2>본인 ISA 계좌유형</h2>
                  </div>
                  <ChoiceQuestion
                    value={myIsaType}
                    options={isaTypeOptions}
                    onChange={(value) =>
                      onPatchFormData({
                        isaType: value,
                        myIsaType: value,
                      })
                    }
                  />
                </section>
                <section className="question-block">
                  <div className="question-block-header">
                    <h2>배우자 ISA 계좌유형</h2>
                  </div>
                  <ChoiceQuestion
                    value={spouseIsaType}
                    options={isaTypeOptions}
                    onChange={(value) => onPatchFormData({ spouseIsaType: value })}
                  />
                </section>
              </>
            ) : (
              <section className="question-block">
                <div className="question-block-header">
                  <h2>ISA 계좌유형</h2>
                </div>
                <ChoiceQuestion
                  value={singleIsaType}
                  options={isaTypeOptions}
                  onChange={(value) =>
                    onPatchFormData({
                      isaType: value,
                      myIsaType: value,
                    })
                  }
                />
              </section>
            )}
            <QuestionNumberFields
              fields={[
                {
                  key: 'otherAssets',
                  label: '기타 계좌 자산',
                  value: formData.otherAssets,
                  onChange: (value) => update('otherAssets', value),
                },
              ]}
            />
          </div>
        )
      case 'dividends':
        return (
          <div className="question-stack">
            <ChoiceQuestion
              value={formData.dividendInputMode}
              options={dividendModeOptions}
              onChange={(value) => update('dividendInputMode', value)}
            />
            <QuestionNumberFields
              columns={2}
              fields={[
                {
                  key: 'taxableAccountDividendAnnual',
                  label: '일반 주식계좌 연간 배당금',
                  value: formData.taxableAccountDividendAnnual,
                  onChange: (value) => update('taxableAccountDividendAnnual', value),
                },
                {
                  key: 'isaDividendAnnual',
                  label: 'ISA 연간배당금',
                  value: formData.isaDividendAnnual,
                  onChange: (value) => update('isaDividendAnnual', value),
                },
                {
                  key: 'pensionMonthlyAmount',
                  label: '국민연금 월 실수령액 예상',
                  value: formData.pensionMonthlyAmount,
                  onChange: (value) => update('pensionMonthlyAmount', value),
                  helperText: '세후 기준, 실제 통장에 들어오는 금액을 입력합니다.',
                },
              ]}
            />
            {formData.householdType === 'couple' ? (
              <section className="question-block">
                <div className="question-block-header">
                  <h2>일반계좌 배당 귀속</h2>
                </div>
                <ChoiceQuestion
                  value={formData.dividendOwnershipType}
                  options={dividendOwnershipOptions}
                  onChange={(value) =>
                    onPatchFormData(
                      value === 'split'
                        ? {
                            dividendOwnershipType: value,
                            myAnnualDividendAttributed: Math.round(formData.taxableAccountDividendAnnual / 2),
                            spouseAnnualDividendAttributed: formData.taxableAccountDividendAnnual - Math.round(formData.taxableAccountDividendAnnual / 2),
                          }
                        : { dividendOwnershipType: value },
                    )
                  }
                />
              </section>
            ) : (
              <section className="question-block">
                <div className="question-block-header">
                  <h2>일반계좌 배당 귀속</h2>
                </div>
                <p className="screen-copy">
                  본인만 계산하므로 일반계좌 배당은 전부 본인 귀속으로 처리합니다.
                </p>
              </section>
            )}
            {formData.householdType === 'couple' && formData.dividendOwnershipType === 'split' ? (
              <QuestionNumberFields
                fields={[
                  {
                    key: 'myAnnualDividendAttributed',
                    label: '본인 귀속 일반계좌 연간 배당금',
                    value: formData.myAnnualDividendAttributed,
                    onChange: (value) => {
                      const mineDividend = Math.min(
                        Math.max(value, 0),
                        formData.taxableAccountDividendAnnual,
                      )
                      onPatchFormData({
                        myAnnualDividendAttributed: mineDividend,
                        spouseAnnualDividendAttributed: Math.max(
                          formData.taxableAccountDividendAnnual - mineDividend,
                          0,
                        ),
                      })
                    },
                    helperText: `배우자 귀속은 자동 계산: ${formatCompactCurrency(
                      Math.max(
                        formData.taxableAccountDividendAnnual -
                          Math.min(
                            Math.max(formData.myAnnualDividendAttributed, 0),
                            formData.taxableAccountDividendAnnual,
                          ),
                        0,
                      ),
                    )}`,
                  },
                ]}
              />
            ) : null}
            {formData.isaDividendAnnual > 0 ? (
              <>
                {formData.householdType === 'couple' ? (
                  <section className="question-block">
                    <div className="question-block-header">
                      <h2>ISA 배당 귀속</h2>
                    </div>
                    <ChoiceQuestion
                      value={formData.isaOwnershipType}
                      options={dividendOwnershipOptions}
                      onChange={(value) =>
                        onPatchFormData(
                          value === 'split'
                            ? {
                                isaOwnershipType: value,
                                myAnnualIsaDividendAttributed: Math.round(formData.isaDividendAnnual / 2),
                                spouseAnnualIsaDividendAttributed: formData.isaDividendAnnual - Math.round(formData.isaDividendAnnual / 2),
                              }
                            : { isaOwnershipType: value },
                        )
                      }
                    />
                  </section>
                ) : (
                  <section className="question-block">
                    <div className="question-block-header">
                      <h2>ISA 배당 귀속</h2>
                    </div>
                    <p className="screen-copy">
                      본인만 계산하므로 ISA 배당도 전부 본인 귀속으로 처리합니다.
                    </p>
                  </section>
                )}
                {formData.householdType === 'couple' && formData.isaOwnershipType === 'split' ? (
                  <QuestionNumberFields
                    fields={[
                      {
                        key: 'myAnnualIsaDividendAttributed',
                        label: '본인 귀속 ISA 연간 배당금',
                        value: formData.myAnnualIsaDividendAttributed,
                        onChange: (value) => {
                          const mineIsaDividend = Math.min(
                            Math.max(value, 0),
                            formData.isaDividendAnnual,
                          )
                          onPatchFormData({
                            myAnnualIsaDividendAttributed: mineIsaDividend,
                            spouseAnnualIsaDividendAttributed: Math.max(
                              formData.isaDividendAnnual - mineIsaDividend,
                              0,
                            ),
                          })
                        },
                        helperText: `배우자 귀속은 자동 계산: ${formatCompactCurrency(
                          Math.max(
                            formData.isaDividendAnnual -
                              Math.min(
                                Math.max(formData.myAnnualIsaDividendAttributed, 0),
                                formData.isaDividendAnnual,
                              ),
                            0,
                          ),
                        )}`,
                      },
                    ]}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        )
      case 'isa':
        return null
      case 'income':
        return (
          <div className="question-stack">
            {renderChoiceRows(formData.otherIncomeType, otherIncomeTypeOptionRows, (value) =>
              onPatchFormData({
                otherIncomeType: value,
                ...(value === 'earned' && usesEmployeeHealthInsurance
                  ? { salaryMonthly: formData.otherIncomeMonthly }
                  : {}),
              }),
            )}
            {formData.otherIncomeType !== 'none' ? (
              <QuestionNumberFields
                fields={[
                  {
                    key: 'otherIncomeMonthly',
                    label:
                      formData.otherIncomeType === 'earned'
                        ? '월 근로소득'
                        : formData.otherIncomeType === 'business'
                          ? '월 사업소득'
                          : formData.otherIncomeType === 'pension'
                            ? '월 기타연금'
                            : formData.otherIncomeType === 'other'
                              ? '월 기타소득'
                              : '기타 월소득',
                    value: formData.otherIncomeMonthly,
                    onChange: (value) =>
                      onPatchFormData({
                        otherIncomeMonthly: value,
                        ...(usesEarnedIncomeAsSalary ? { salaryMonthly: value } : {}),
                      }),
                    helperText:
                      usesEarnedIncomeAsSalary
                        ? '근로소득을 선택한 상태라 건강보험 직장가입 월 급여에 같은 금액을 자동 반영합니다.'
                        : undefined,
                  },
                ]}
              />
            ) : null}
          </div>
        )
      case 'healthInsurance':
        return (
          <div className="question-stack">
            {renderChoiceRows(formData.healthInsuranceType, healthInsuranceOptionRows, (value) =>
              onPatchFormData({
                healthInsuranceType: value,
                ...((value === 'employee' || value === 'employeeWithDependentSpouse') &&
                formData.otherIncomeType === 'earned'
                  ? { salaryMonthly: formData.otherIncomeMonthly }
                  : {}),
              }),
            )}
            {usesEmployeeHealthInsurance ? (
              usesEarnedIncomeAsSalary ? (
                <section className="question-block">
                  <div className="question-block-header">
                    <h2>월 급여</h2>
                  </div>
                  <p className="screen-copy question-copy-note">
                    근로소득을 선택했으므로 월 급여는 기타 소득 단계의 근로소득 금액
                    ({formatCompactCurrency(formData.otherIncomeMonthly)})을 그대로 사용합니다.
                  </p>
                </section>
              ) : (
                <QuestionNumberFields
                  fields={[
                    {
                      key: 'salaryMonthly',
                      label: '월 급여',
                      value: formData.salaryMonthly,
                      onChange: (value) => update('salaryMonthly', value),
                      helperText: '직장가입자 계산에 사용됩니다.',
                    },
                  ]}
                />
              )
            ) : null}
          </div>
        )
      case 'fixedExpenses':
        return (
          <div className="question-stack">
            <QuestionNumberFields
              columns={2}
              fields={[
                {
                  key: 'insuranceMonthly',
                  label: '보험료',
                  value: formData.insuranceMonthly,
                  onChange: (value) => update('insuranceMonthly', value),
                },
                {
                  key: 'maintenanceMonthly',
                  label: '관리비',
                  value: formData.housingType === 'monthlyRent' ? 0 : formData.maintenanceMonthly,
                  onChange: (value) => update('maintenanceMonthly', value),
                  disabled: formData.housingType === 'monthlyRent',
                  helperText:
                    formData.housingType === 'monthlyRent'
                      ? '월세 주거비에서 계산되어 여기서는 제외됩니다.'
                      : undefined,
                },
                {
                  key: 'telecomMonthly',
                  label: '통신비',
                  value: formData.telecomMonthly,
                  onChange: (value) => update('telecomMonthly', value),
                },
                {
                  key: 'otherFixedMonthly',
                  label: '기타 고정지출',
                  value: formData.otherFixedMonthly,
                  onChange: (value) => update('otherFixedMonthly', value),
                },
              ]}
            />
            {renderBooleanChoice('대출금이 있나요?', formData.hasLoan, (value) =>
              onPatchFormData({
                hasLoan: value,
                loanInterestMonthly: value ? formData.loanInterestMonthly : 0,
                loanInterestYears: value ? formData.loanInterestYears : 0,
              }),
            )}
            {formData.hasLoan ? (
              <QuestionNumberFields
                columns={2}
                fields={[
                  {
                    key: 'loanInterestMonthly',
                    label: '대출 이자',
                    value: formData.loanInterestMonthly,
                    onChange: (value) => update('loanInterestMonthly', value),
                  },
                  {
                    key: 'loanInterestYears',
                    label: '반영 년수',
                    value: formData.loanInterestYears,
                    onChange: (value) => update('loanInterestYears', Math.max(value, 0)),
                    display: 'number',
                    suffix: '년',
                    min: 0,
                    step: 1,
                    helperText: '예: 10 입력 시 10년 동안만 반영됩니다.',
                  },
                ]}
              />
            ) : null}
          </div>
        )
      case 'livingCosts':
        return (
          <div className="question-stack">
            <ChoiceQuestion
              value={formData.livingCostInputMode}
              options={livingCostModeOptions}
              onChange={(value) => update('livingCostInputMode', value)}
            />
            {formData.livingCostInputMode === 'total' ? (
              <QuestionNumberFields
                fields={[
                  {
                    key: 'livingCostMonthlyTotal',
                    label: '월 생활비 총액',
                    value: formData.livingCostMonthlyTotal,
                    onChange: (value) => update('livingCostMonthlyTotal', value),
                  },
                ]}
              />
            ) : (
              <QuestionNumberFields
                columns={2}
                fields={[
                  {
                    key: 'foodMonthly',
                    label: '식비',
                    value: formData.foodMonthly,
                    onChange: (value) => update('foodMonthly', value),
                  },
                  {
                    key: 'necessitiesMonthly',
                    label: '생필품',
                    value: formData.necessitiesMonthly,
                    onChange: (value) => update('necessitiesMonthly', value),
                  },
                  {
                    key: 'diningOutMonthly',
                    label: '외식비',
                    value: formData.diningOutMonthly,
                    onChange: (value) => update('diningOutMonthly', value),
                  },
                  {
                    key: 'hobbyMonthly',
                    label: '취미비',
                    value: formData.hobbyMonthly,
                    onChange: (value) => update('hobbyMonthly', value),
                  },
                  ...((formData.hasChildren ?? false) && (formData.childCount ?? 0) > 0
                    ? [
                        {
                          key: 'academyMonthly',
                          label: '학원비',
                          value: formData.academyMonthly ?? 0,
                          onChange: (value: number) => update('academyMonthly', value),
                        },
                      ]
                    : []),
                  {
                    key: 'otherLivingMonthly',
                    label: '기타 생활비',
                    value: formData.otherLivingMonthly,
                    onChange: (value) => update('otherLivingMonthly', value),
                  },
                ]}
              />
            )}
            {renderBooleanChoice('자동차 보유', formData.hasCar, (value) =>
              onPatchFormData({
                hasCar: value,
                currentCarMarketValue: value ? formData.currentCarMarketValue : 0,
                carYearlyCost: value ? formData.carYearlyCost : 0,
              }), '예 선택 시 차량 시세와 1년 유지비를 입력합니다.') }
            {formData.hasCar ? (
              <QuestionNumberFields
                columns={2}
                fields={[
                  {
                    key: 'currentCarMarketValue',
                    label: '현재 차량 시세',
                    value: formData.currentCarMarketValue,
                    onChange: (value) => update('currentCarMarketValue', value),
                    helperText: '현재 차량 시세는 결과표와 자산 해석에 재산으로 반영됩니다.',
                  },
                  {
                    key: 'carYearlyCost',
                    label: '1년 차량 유지비',
                    value: formData.carYearlyCost,
                    onChange: (value) => update('carYearlyCost', value),
                    helperText: '자동차세·보험료·유류비를 합친 예상 비용이며 12개월로 나눠서 계산됩니다.',
                  },
                ]}
              />
            ) : null}
          </div>
        )
      case 'cashReserve':
        return (
          <div className="question-stack">
            <QuestionNumberFields
              fields={[
                {
                  key: 'startingCashReserve',
                  label: '현재 보유한 현금',
                  value: formData.startingCashReserve,
                  onChange: (value) => update('startingCashReserve', value),
                  helperText: '현금 흐름 그래프의 시작 금액 입니다.',
                },
              ]}
            />
            <section className="question-block">
              <div className="question-block-header">
                <h2>예상 현금흐름 반영 기간</h2>
              </div>
              <ChoiceQuestion
                value={String(formData.simulationYears || 10)}
                options={simulationYearOptions}
                onChange={(value) =>
                  update(
                    'simulationYears',
                    Number(value) as RetireCalcFormData['simulationYears'],
                  )
                }
              />
              <p className="screen-copy question-copy-note">
                최소 10년, 최대 50년 결과를 시뮬레이션 합니다.
              </p>
            </section>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <QuestionLayout
      question={question}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      onBack={onBack}
      onNext={onNext}
      onSeekQuestion={onSeekQuestion}
      headerAction={headerAction}
    >
      {renderContent()}
    </QuestionLayout>
  )
}
