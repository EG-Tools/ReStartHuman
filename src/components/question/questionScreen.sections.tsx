import type { ReactNode } from 'react'
import { ChoiceQuestion, NumberFields, PrimaryButton } from '../common/Ui'
import type { QuestionStep, AlphaFormData, IncomeCategory } from '../../types/alpha'
import { formatCompactCurrency } from '../../utils/format'
import { QuestionNumberFieldPairs, QuestionNumberFields, type QuestionNumberFieldPairConfig } from './questionScreen.shared'
import {
  additionalHomeHousingOptions,
  dividendModeOptions,
  dividendOwnershipOptions,
  healthInsuranceOptionRows,
  householdOptions,
  housingOptions,
  isaTypeOptions,
  livingCostModeOptions,
  propertyOwnershipOptions,
  simulationYearOptions,
  yesNoOptions,
} from './questionScreen.config'

import {
  buildStructuredIncomePatch,
  getSelectedIncomeCategories,
  incomeCategoryOptionRows,
} from '../../utils/incomeStreams'
export interface RenderQuestionContentArgs {
  question: QuestionStep
  formData: AlphaFormData
  update: <K extends keyof AlphaFormData>(key: K, value: AlphaFormData[K]) => void
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
}

export function renderQuestionContent({
  question,
  formData,
  update,
  onPatchFormData,
}: RenderQuestionContentArgs): ReactNode {
  const singleIsaType = formData.isaType === 'workingClass' ? 'workingClass' : 'general'
  const myIsaType = formData.myIsaType === 'workingClass' ? 'workingClass' : 'general'
  const spouseIsaType =
    formData.spouseIsaType === 'workingClass' ? 'workingClass' : 'general'
  const usesEmployeeHealthInsurance =
    formData.healthInsuranceType === 'employee' ||
    formData.healthInsuranceType === 'employeeWithDependentSpouse'
  const selectedIncomeCategories = getSelectedIncomeCategories(formData)
  const usesEarnedIncomeAsSalary =
    usesEmployeeHealthInsurance && selectedIncomeCategories.includes('earned')
  const defaultIncomeDurationYears = 10

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

  const patchStructuredIncomeSelection = (
    categories: IncomeCategory[],
    patch: Partial<AlphaFormData> = {},
  ) => {
    onPatchFormData(buildStructuredIncomePatch(categories, patch))
  }

  const handleToggleIncomeCategory = (category: IncomeCategory) => {
    const isSelected = selectedIncomeCategories.includes(category)
    const nextCategories = isSelected
      ? selectedIncomeCategories.filter((item) => item !== category)
      : [...selectedIncomeCategories, category]

    const patch: Partial<AlphaFormData> = {}

    if (isSelected) {
      switch (category) {
        case 'earned':
          patch.earnedIncomeMonthly = 0
          patch.earnedIncomeDurationYears = defaultIncomeDurationYears
          if (usesEmployeeHealthInsurance) {
            patch.salaryMonthly = 0
          }
          break
        case 'otherPension':
          patch.otherPensionMonthly = 0
          patch.otherPensionStartAge = 65
          break
        case 'freelance':
          patch.freelanceIncomeMonthly = 0
          patch.freelanceIncomeDurationYears = defaultIncomeDurationYears
          break
        case 'business':
          patch.businessIncomeMonthly = 0
          patch.businessIncomeDurationYears = defaultIncomeDurationYears
          break
        case 'rental':
          patch.rentalIncomeMonthly = 0
          patch.rentalIncomeDurationYears = defaultIncomeDurationYears
          break
        case 'misc':
          patch.miscIncomeMonthly = 0
          patch.miscIncomeDurationYears = defaultIncomeDurationYears
          break
      }
    } else if (
      category === 'earned' &&
      usesEmployeeHealthInsurance &&
      formData.salaryMonthly <= 0 &&
      formData.earnedIncomeMonthly > 0
    ) {
      patch.salaryMonthly = formData.earnedIncomeMonthly
    }

    patchStructuredIncomeSelection(nextCategories, patch)
  }


  const buildIncomeFieldPatch = (
    category: IncomeCategory,
    patch: Partial<AlphaFormData>,
  ) => {
    if (selectedIncomeCategories.length !== 1 || selectedIncomeCategories[0] !== category) {
      return buildStructuredIncomePatch(selectedIncomeCategories, patch)
    }

    switch (category) {
      case 'earned':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.earnedIncomeMonthly ?? formData.earnedIncomeMonthly,
        })
      case 'otherPension':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.otherPensionMonthly ?? formData.otherPensionMonthly,
          otherIncomeStartAge: patch.otherPensionStartAge ?? formData.otherPensionStartAge,
        })
      case 'business':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.businessIncomeMonthly ?? formData.businessIncomeMonthly,
        })
      case 'rental':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.rentalIncomeMonthly ?? formData.rentalIncomeMonthly,
        })
      case 'misc':
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.miscIncomeMonthly ?? formData.miscIncomeMonthly,
        })
      case 'freelance':
      default:
        return buildStructuredIncomePatch(selectedIncomeCategories, {
          ...patch,
          otherIncomeMonthly: patch.freelanceIncomeMonthly ?? formData.freelanceIncomeMonthly,
        })
    }
  }

  const incomeFieldPairs: QuestionNumberFieldPairConfig[] = [
    ...(selectedIncomeCategories.includes('earned')
      ? [
          {
            key: 'earned-income-pair',
            helperText: usesEmployeeHealthInsurance
              ? '직장가입자 선택 시 급여에도 같은 금액을 반영합니다.'
              : undefined,
            fields: [
              {
                key: 'earnedIncomeMonthly',
                label: '월 근로소득',
                value: formData.earnedIncomeMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('earned', {
                      earnedIncomeMonthly: value,
                      ...(usesEmployeeHealthInsurance ? { salaryMonthly: value } : {}),
                    }),
                  ),
              },
              {
                key: 'earnedIncomeDurationYears',
                label: '반영기간',
                value: formData.earnedIncomeDurationYears,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('earned', {
                      earnedIncomeDurationYears: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '년',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
    ...(selectedIncomeCategories.includes('otherPension')
      ? [
          {
            key: 'other-pension-pair',
            helperText: '국민연금과 별도로 받는 연금만 입력합니다.',
            fields: [
              {
                key: 'otherPensionMonthly',
                label: '월 기타연금',
                value: formData.otherPensionMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('otherPension', {
                      otherPensionMonthly: value,
                    }),
                  ),
              },
              {
                key: 'otherPensionStartAge',
                label: '시작나이',
                value: formData.otherPensionStartAge,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('otherPension', {
                      otherPensionStartAge: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '세',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
    ...(selectedIncomeCategories.includes('freelance')
      ? [
          {
            key: 'freelance-income-pair',
            helperText: '등록 없이 받는 자문·외주·인적용역 수입 기준입니다.',
            fields: [
              {
                key: 'freelanceIncomeMonthly',
                label: '월 프리랜서 소득',
                value: formData.freelanceIncomeMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('freelance', {
                      freelanceIncomeMonthly: value,
                    }),
                  ),
              },
              {
                key: 'freelanceIncomeDurationYears',
                label: '반영기간',
                value: formData.freelanceIncomeDurationYears,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('freelance', {
                      freelanceIncomeDurationYears: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '년',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
    ...(selectedIncomeCategories.includes('business')
      ? [
          {
            key: 'business-income-pair',
            helperText: '사업자등록이 있는 사업 소득 기준입니다.',
            fields: [
              {
                key: 'businessIncomeMonthly',
                label: '월 사업소득',
                value: formData.businessIncomeMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('business', {
                      businessIncomeMonthly: value,
                    }),
                  ),
              },
              {
                key: 'businessIncomeDurationYears',
                label: '반영기간',
                value: formData.businessIncomeDurationYears,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('business', {
                      businessIncomeDurationYears: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '년',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
    ...(selectedIncomeCategories.includes('rental')
      ? [
          {
            key: 'rental-income-pair',
            helperText: '결과표에서 임대소득세를 따로 추정해 반영합니다.',
            fields: [
              {
                key: 'rentalIncomeMonthly',
                label: '월 임대소득',
                value: formData.rentalIncomeMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('rental', {
                      rentalIncomeMonthly: value,
                    }),
                  ),
              },
              {
                key: 'rentalIncomeDurationYears',
                label: '반영기간',
                value: formData.rentalIncomeDurationYears,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('rental', {
                      rentalIncomeDurationYears: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '년',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
    ...(selectedIncomeCategories.includes('misc')
      ? [
          {
            key: 'misc-income-pair',
            helperText: '위 분류 외에 별도로 들어오는 월 유입을 적습니다.',
            fields: [
              {
                key: 'miscIncomeMonthly',
                label: '월 기타소득',
                value: formData.miscIncomeMonthly,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('misc', {
                      miscIncomeMonthly: value,
                    }),
                  ),
              },
              {
                key: 'miscIncomeDurationYears',
                label: '반영기간',
                value: formData.miscIncomeDurationYears,
                onChange: (value: number) =>
                  onPatchFormData(
                    buildIncomeFieldPatch('misc', {
                      miscIncomeDurationYears: Math.max(value, 1),
                    }),
                  ),
                display: 'number' as const,
                suffix: '년',
                min: 1,
                step: 1,
              },
            ],
          },
        ]
      : []),
  ]

  const renderIncomeCategoryRows = () => (
    <div className="question-stack question-stack-compact">
      {incomeCategoryOptionRows.map((row, rowIndex) => (
        <div
          key={`income-row-${rowIndex}`}
          className={`toggle-group toggle-group-grid toggle-group-count-${row.length}`}
        >
          {row.map((option) => {
            const active = selectedIncomeCategories.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                className={`toggle-card ${active ? 'is-active' : ''}`.trim()}
                onClick={() => handleToggleIncomeCategory(option.value)}
              >
                <span className="toggle-card-label">{option.label}</span>
                {option.description ? (
                  <span className="toggle-card-description">{option.description}</span>
                ) : null}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )

  const createAdditionalHome = (): AlphaFormData['additionalHomes'][number] => ({
    housingType: 'own',
    marketValue: 0,
    officialValue: 0,
  })

  const handleToggleAdditionalHomes = (enabled: boolean) => {
    onPatchFormData({
      additionalHomes: enabled ? formData.additionalHomes.length > 0 ? formData.additionalHomes : [createAdditionalHome()] : [],
      isSingleHomeOwner: enabled ? false : formData.housingType === 'own',
    })
  }

  const handleAddAdditionalHome = () => {
    if (formData.additionalHomes.length >= 4) {
      return
    }

    onPatchFormData({
      additionalHomes: [...formData.additionalHomes, createAdditionalHome()],
      isSingleHomeOwner: false,
    })
  }

  const handleRemoveAdditionalHome = (index: number) => {
    const nextAdditionalHomes = formData.additionalHomes.filter((_, homeIndex) => homeIndex !== index)

    onPatchFormData({
      additionalHomes: nextAdditionalHomes,
      isSingleHomeOwner: nextAdditionalHomes.length === 0 && formData.housingType === 'own',
    })
  }

  const handlePatchAdditionalHome = (
    index: number,
    patch: Partial<AlphaFormData['additionalHomes'][number]>,
  ) => {
    const nextAdditionalHomes = formData.additionalHomes.map((home, homeIndex) =>
      homeIndex === index ? { ...home, ...patch } : home,
    )

    onPatchFormData({ additionalHomes: nextAdditionalHomes })
  }

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
                  display: 'number' as const,
                  suffix: '세',
                  min: 1,
                  step: 1,
                  helperText: '결과 해석의 자산 비교와 현금흐름 그래프 연령 표시에 함께 사용합니다.',
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
                    academyMonthly: value === 'yes' ? formData.academyMonthly ?? 0 : 0,
                  })
                }
              />
              <p className="screen-copy question-copy-note">
                자녀가 있으면 생활비 상세 입력에서 학원비 항목이 열리고, 결과 해석에도 함께 반영합니다.
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
                    display: 'number' as const,
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
                    isSingleHomeOwner: value === 'own' && formData.additionalHomes.length === 0,
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
            ) : null}

            {renderBooleanChoice(
              '집이 한채 더 있습니까?',
              formData.additionalHomes.length > 0,
              handleToggleAdditionalHomes,
              '현재 거주 주택을 포함해 최대 5채까지 입력할 수 있습니다.',
            )}

            {formData.additionalHomes.length > 0 ? (
              <div className="question-stack">
                {formData.additionalHomes.map((home, index) => (
                  <section key={`additional-home-${index}`} className="question-block">
                    <div className="question-block-header">
                      <h2>{`추가 주택 ${index + 1}`}</h2>
                    </div>
                    <ChoiceQuestion
                      value={home.housingType}
                      options={additionalHomeHousingOptions}
                      onChange={(value) => handlePatchAdditionalHome(index, { housingType: value })}
                    />
                    <QuestionNumberFields
                      columns={2}
                      fields={[
                        {
                          key: `additional-home-market-${index}`,
                          label: '시가',
                          value: home.marketValue,
                          onChange: (value) => handlePatchAdditionalHome(index, { marketValue: value }),
                        },
                        {
                          key: `additional-home-official-${index}`,
                          label: '공시가격',
                          value: home.officialValue,
                          onChange: (value) => handlePatchAdditionalHome(index, { officialValue: value }),
                        },
                      ]}
                    />
                    <PrimaryButton variant="ghost" onClick={() => handleRemoveAdditionalHome(index)}>
                      이 주택 삭제
                    </PrimaryButton>
                  </section>
                ))}
                {formData.additionalHomes.length < 4 ? (
                  <PrimaryButton variant="secondary" onClick={handleAddAdditionalHome}>
                    주택 한 채 더 추가
                  </PrimaryButton>
                ) : (
                  <p className="screen-copy question-copy-note">
                    현재 거주 주택 포함 최대 5채까지 입력할 수 있습니다.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )
            case 'propertyAssets':
        return (
          <div className="question-stack">
            {renderBooleanChoice(
              '토지나 상가, 기타부동산이 있습니까?',
              formData.hasLandOrOtherProperty,
              (value) =>
                onPatchFormData({
                  hasLandOrOtherProperty: value,
                  landValue: value ? formData.landValue : 0,
                  otherPropertyOfficialValue: value ? formData.otherPropertyOfficialValue : 0,
                }),
            )}

            {formData.hasLandOrOtherProperty ? (
              <>
                <QuestionNumberFields
                  fields={[
                    {
                      key: 'landValue',
                      label: '현재 토지 금액',
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
                      <p className="screen-copy question-copy-note">본인 50%, 배우자 50%로 자동 반영합니다.</p>
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
                      <p className="screen-copy question-copy-note">본인 50%, 배우자 50%로 자동 반영합니다.</p>
                    ) : null}
                  </section>
                ) : null}
              </>
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
                {
                  key: 'pensionStartAge',
                  label: '국민연금 수령 시작 나이',
                  value: formData.pensionStartAge,
                  onChange: (value) => update('pensionStartAge', Math.max(value, 1)),
                  display: 'number' as const,
                  suffix: '세',
                  min: 1,
                  step: 1,
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
      case 'income':
        return (
          <div className="question-stack">
            <section className="question-block">
              <div className="question-block-header">
                <h2>추가 소득 선택</h2>
              </div>
              {renderIncomeCategoryRows()}
              <p className="screen-copy question-copy-note">
                배당·이자소득은 앞 질문에서 따로 입력합니다. 해당하는 소득을 모두 선택하세요.
              </p>
            </section>
            {selectedIncomeCategories.length > 0 ? (
              <QuestionNumberFieldPairs pairs={incomeFieldPairs} />
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
                    ({formatCompactCurrency(formData.earnedIncomeMonthly)})을 그대로 사용합니다.
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
                  value: formData.maintenanceMonthly,
                  onChange: (value) => update('maintenanceMonthly', value),
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
                    display: 'number' as const,
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
                    helperText: '입력한 경우에만 결과표에 표시되며 자산 해석에 재산으로 반영됩니다.',
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
                  helperText: '현금흐름 그래프의 시작 금액이며 결과 해석의 유동자산에도 함께 반영합니다.',
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
                    Number(value) as AlphaFormData['simulationYears'],
                  )
                }
              />
            </section>
          </div>
        )
      default:
        return null
    }
  }

  return renderContent()
}
