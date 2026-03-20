import { useEffect, useRef, type ReactNode } from 'react'
import { ChoiceQuestion, NumberFields, PrimaryButton, ProgressBar } from '../common/Ui'
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
}

const householdOptions = [
  { value: 'single', label: '1인가구' },
  { value: 'couple', label: '부부합산' },
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

const dividendOwnershipOptions = [
  { value: 'mineOnly', label: '본인' },
  { value: 'spouseOnly', label: '배우자' },
  { value: 'split', label: '분할' },
] as const

const otherIncomeTypeOptions = [
  { value: 'none', label: '없음', description: '추가 월소득이 없습니다.' },
  { value: 'earned', label: '근로소득', description: '월 급여성 소득입니다.' },
  { value: 'business', label: '사업소득', description: '월 사업소득입니다.' },
  { value: 'pension', label: '기타 연금', description: '기타 연금성 소득입니다.' },
  { value: 'other', label: '기타', description: '그 외 월 현금유입입니다.' },
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
    label: '부부 모두 지역',
    description: '지역가입자 구조와 같은 방식으로 추정합니다.',
  },
  {
    value: 'employeeWithDependentSpouse',
    label: '직장 + 피부양 배우자',
    description: '직장가입자 구조 중심으로 계산합니다.',
  },
  { value: 'other', label: '기타', description: '지역가입자 구조에 가깝게 추정합니다.' },
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
  children,
}: {
  question: QuestionStep
  questionIndex: number
  totalQuestions: number
  onBack: () => void
  onNext: () => void
  onSeekQuestion: (index: number) => void
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
      <div className="screen-header">
        <div>
          <p className="eyebrow">질문 {questionIndex + 1}</p>
          <h1 className="screen-title">{question.title}</h1>
          {question.description ? <p className="screen-copy">{question.description}</p> : null}
        </div>
        <div className="progress-shell">
          <span className="progress-label">
            {questionIndex + 1} / {totalQuestions}
          </span>
          <ProgressBar
            value={questionIndex + 1}
            max={totalQuestions}
            ariaLabel="질문 진행도 이동"
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

export function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  formData,
  onBack,
  onNext,
  onSeekQuestion,
  onPatchFormData,
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

  const renderContent = () => {
    switch (question.id) {
      case 'household':
        return (
          <div className="question-stack">
            <section className="question-block household-choice-block">
              <div className="question-block-header">
                <h2>가구</h2>
              </div>
              <ChoiceQuestion
                value={formData.householdType}
                options={householdOptions}
                onChange={(value) => update('householdType', value)}
              />
            </section>
            <section className="question-block housing-choice-block">
              <div className="question-block-header">
                <h2>주거 형태</h2>
              </div>
              <ChoiceQuestion
                value={formData.housingType}
                options={housingOptions}
                onChange={(value) => update('housingType', value)}
              />
            </section>
          </div>
        )

      case 'housingDetails':
        return (
          <div className="question-stack">
            {formData.housingType === 'own' ? (
              <>
                <NumberFields
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
                {renderBooleanChoice('공동명의 인가요?', formData.isJointOwnership, (value) =>
                  update('isJointOwnership', value),
                )}
                {renderBooleanChoice('1주택자로 볼 수 있나요?', formData.isSingleHomeOwner, (value) =>
                  update('isSingleHomeOwner', value),
                )}
                {renderBooleanChoice('주택담보대출이 있나요?', formData.hasLoan, (value) =>
                  update('hasLoan', value),
                )}
              </>
            ) : null}

            {formData.housingType === 'jeonse' ? (
              <>
                <NumberFields
                  fields={[
                    {
                      key: 'jeonseDeposit',
                      label: '전세 보증금',
                      value: formData.jeonseDeposit,
                      onChange: (value) => update('jeonseDeposit', value),
                    },
                  ]}
                />
                {renderBooleanChoice('공동명의 인가요?', formData.isJointOwnership, (value) =>
                  update('isJointOwnership', value),
                )}
              </>
            ) : null}

            {formData.housingType === 'monthlyRent' ? (
              <>
                <NumberFields
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
                  <NumberFields
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
      case 'assets':
        return (
          <NumberFields
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
              {
                key: 'otherAssets',
                label: '기타 계좌 자산',
                value: formData.otherAssets,
                onChange: (value) => update('otherAssets', value),
              },
            ]}
          />
        )
      case 'dividends':
        return (
          <div className="question-stack">
            <ChoiceQuestion
              value={formData.dividendInputMode}
              options={dividendModeOptions}
              onChange={(value) => update('dividendInputMode', value)}
            />
            <NumberFields
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
                  label: '국민연금 예상 금액',
                  value: formData.pensionMonthlyAmount,
                  onChange: (value) => update('pensionMonthlyAmount', value),
                  helperText: '월 예상 수령액',
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
              <NumberFields
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
                  <NumberFields
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
        return (
          <div className="question-stack">
            {formData.householdType === 'couple' ? (
              <>
                {formData.isaOwnershipType !== 'spouseOnly' ? (
                  <section className="question-block">
                    <div className="question-block-header">
                      <h2>본인 ISA 유형</h2>
                    </div>
                    <ChoiceQuestion
                      value={myIsaType}
                      options={isaTypeOptions}
                      onChange={(value) => onPatchFormData({ myIsaType: value })}
                    />
                  </section>
                ) : null}
                {formData.isaOwnershipType !== 'mineOnly' ? (
                  <section className="question-block">
                    <div className="question-block-header">
                      <h2>배우자 ISA 유형</h2>
                    </div>
                    <ChoiceQuestion
                      value={spouseIsaType}
                      options={isaTypeOptions}
                      onChange={(value) => onPatchFormData({ spouseIsaType: value })}
                    />
                  </section>
                ) : null}
              </>
            ) : (
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
            )}
          </div>
        )
      case 'income':
        return (
          <div className="question-stack">
            <NumberFields
              fields={[
                {
                  key: 'otherIncomeMonthly',
                  label: '기타 월소득',
                  value: formData.otherIncomeMonthly,
                  onChange: (value) => update('otherIncomeMonthly', value),
                },
              ]}
            />
            <ChoiceQuestion
              value={formData.otherIncomeType}
              options={otherIncomeTypeOptions}
              onChange={(value) => update('otherIncomeType', value)}
            />
          </div>
        )
      case 'healthInsurance':
        return (
          <div className="question-stack">
            <ChoiceQuestion
              value={formData.healthInsuranceType}
              options={healthInsuranceOptions}
              onChange={(value) => update('healthInsuranceType', value)}
            />
            <NumberFields
              fields={[
                {
                  key: 'salaryMonthly',
                  label: '월 급여',
                  value: formData.salaryMonthly,
                  onChange: (value) => update('salaryMonthly', value),
                  helperText: '직장가입자 계산에 사용합니다. 입력 단위는 만원입니다.',
                },
              ]}
            />
            {renderBooleanChoice(
              '배우자가 피부양자인가요?',
              formData.spouseDependent,
              (value) => update('spouseDependent', value),
              '피부양자는 직장가입자의 가족으로 등록돼 별도 건강보험료를 내지 않는 상태를 뜻합니다.',
            )}
            {renderBooleanChoice(
              '사업소득이 있나요?',
              formData.isBusinessOwner,
              (value) => update('isBusinessOwner', value),
              '사업소득은 개인사업, 프리랜서, 임대 등으로 신고되는 소득을 말합니다.',
            )}
            {renderBooleanChoice(
              '무급가족종사자인가요?',
              formData.isUnpaidOwner,
              (value) => update('isUnpaidOwner', value),
              '무급가족종사자는 가족 사업을 돕지만 급여를 따로 받지 않는 가족 구성원을 뜻합니다.',
            )}
          </div>
        )
      case 'fixedExpenses':
        return (
          <NumberFields
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
                key: 'carYearlyCost',
                label: '자동차 연간 유지비',
                value: formData.carYearlyCost,
                onChange: (value) => update('carYearlyCost', value),
                helperText: '연간 금액을 입력하면 월 기준으로 12개월 나누어 계산합니다.',
              },
              {
                key: 'otherFixedMonthly',
                label: '기타 고정지출',
                value: formData.otherFixedMonthly,
                onChange: (value) => update('otherFixedMonthly', value),
              },
            ]}
          />
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
              <NumberFields
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
              <NumberFields
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
                  {
                    key: 'otherLivingMonthly',
                    label: '기타 생활비',
                    value: formData.otherLivingMonthly,
                    onChange: (value) => update('otherLivingMonthly', value),
                  },
                ]}
              />
            )}
          </div>
        )
      case 'cashReserve':
        return (
          <NumberFields
            columns={2}
            fields={[
              {
                key: 'startingCashReserve',
                label: '지금 남아있는 현금',
                value: formData.startingCashReserve,
                onChange: (value) => update('startingCashReserve', value),
                helperText: '기본값 1억원이며, 결과 상단 10년 현금흐름 그래프의 시작점이 됩니다.',
              },
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
    >
      {renderContent()}
    </QuestionLayout>
  )
}

