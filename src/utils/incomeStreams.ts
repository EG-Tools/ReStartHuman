import type { AlphaFormData, IncomeBreakdownItem, IncomeCategory } from '../types/alpha'

const INCOME_CATEGORY_ORDER: IncomeCategory[] = [
  'earned',
  'otherPension',
  'freelance',
  'business',
  'rental',
  'misc',
]

const LEGACY_TO_CATEGORY_MAP: Record<
  AlphaFormData['otherIncomeType'],
  IncomeCategory | null
> = {
  none: null,
  earned: 'earned',
  business: 'business',
  pension: 'otherPension',
  monthlyRent: 'rental',
  other: 'misc',
}

const CATEGORY_TO_LEGACY_MAP: Record<
  IncomeCategory,
  Exclude<AlphaFormData['otherIncomeType'], 'none'>
> = {
  earned: 'earned',
  otherPension: 'pension',
  freelance: 'other',
  business: 'business',
  rental: 'monthlyRent',
  misc: 'other',
}

const toSafeMoney = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(value ?? 0, 0)
}

const toSafeDurationYears = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value)) {
    return Math.max(fallback, 1)
  }

  return Math.max(value ?? fallback, 1)
}

export const incomeCategoryOptions: Array<{
  value: IncomeCategory
  label: string
  description: string
}> = [
  {
    value: 'earned',
    label: '근로소득',
    description: '급여나 보수처럼 월급 형태로 받는 소득',
  },
  {
    value: 'otherPension',
    label: '기타연금',
    description: '국민연금 외에 따로 받는 연금 소득',
  },
  {
    value: 'freelance',
    label: '프리랜서',
    description: '인적용역·자문·외주처럼 등록 없이 버는 소득',
  },
  {
    value: 'business',
    label: '사업소득',
    description: '사업자등록이 있는 사업에서 들어오는 소득',
  },
  {
    value: 'rental',
    label: '임대소득',
    description: '월세처럼 부동산 임대에서 들어오는 소득',
  },
  {
    value: 'misc',
    label: '기타소득',
    description: '일회성·보조성 월 유입 등 나머지 소득',
  },
]

export const incomeCategoryOptionRows = [
  [incomeCategoryOptions[0], incomeCategoryOptions[1]],
  [incomeCategoryOptions[2], incomeCategoryOptions[3]],
  [incomeCategoryOptions[4], incomeCategoryOptions[5]],
] as const

const isIncomeCategory = (value: string): value is IncomeCategory =>
  INCOME_CATEGORY_ORDER.includes(value as IncomeCategory)

const normalizeIncomeCategoryList = (categories: readonly string[] | undefined) => {
  if (!categories) {
    return []
  }

  const seen = new Set<IncomeCategory>()

  return categories.filter(isIncomeCategory).filter((category) => {
    if (seen.has(category)) {
      return false
    }

    seen.add(category)
    return true
  })
}

const hasStructuredIncomeValue = (formData: AlphaFormData) =>
  toSafeMoney(formData.earnedIncomeMonthly) > 0 ||
  toSafeMoney(formData.otherPensionMonthly) > 0 ||
  toSafeMoney(formData.freelanceIncomeMonthly) > 0 ||
  toSafeMoney(formData.businessIncomeMonthly) > 0 ||
  toSafeMoney(formData.rentalIncomeMonthly) > 0 ||
  toSafeMoney(formData.miscIncomeMonthly) > 0

export const getIncomeCategoryLabel = (category: IncomeCategory) => {
  switch (category) {
    case 'earned':
      return '근로소득'
    case 'otherPension':
      return '기타연금'
    case 'freelance':
      return '프리랜서'
    case 'business':
      return '사업소득'
    case 'rental':
      return '임대소득'
    case 'misc':
    default:
      return '기타소득'
  }
}

export const getSelectedIncomeCategories = (formData: AlphaFormData) => {
  const normalizedCategories = normalizeIncomeCategoryList(formData.selectedIncomeCategories)

  if (normalizedCategories.length > 0) {
    return normalizedCategories
  }

  if (hasStructuredIncomeValue(formData)) {
    return INCOME_CATEGORY_ORDER.filter(
      (category) => getIncomeCategoryMonthlyValue(formData, category) > 0,
    )
  }

  const legacyCategory = LEGACY_TO_CATEGORY_MAP[formData.otherIncomeType]
  return legacyCategory ? [legacyCategory] : []
}

export const getPrimaryIncomeCategory = (formData: AlphaFormData) => {
  const selectedCategories = getSelectedIncomeCategories(formData)
  return selectedCategories.length === 1 ? selectedCategories[0] : null
}

export const getIncomeCategoryMonthlyValue = (
  formData: AlphaFormData,
  category: IncomeCategory,
) => {
  switch (category) {
    case 'earned':
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.earnedIncomeMonthly)
      }

      return formData.otherIncomeType === 'earned'
        ? Math.max(
            toSafeMoney(formData.otherIncomeMonthly),
            toSafeMoney(formData.salaryMonthly),
          )
        : 0
    case 'otherPension':
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.otherPensionMonthly)
      }

      return formData.otherIncomeType === 'pension'
        ? toSafeMoney(formData.otherIncomeMonthly)
        : 0
    case 'freelance':
      return toSafeMoney(formData.freelanceIncomeMonthly)
    case 'business':
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.businessIncomeMonthly)
      }

      return formData.otherIncomeType === 'business'
        ? toSafeMoney(formData.otherIncomeMonthly)
        : 0
    case 'rental':
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.rentalIncomeMonthly)
      }

      return formData.otherIncomeType === 'monthlyRent'
        ? toSafeMoney(formData.otherIncomeMonthly)
        : 0
    case 'misc':
    default:
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.miscIncomeMonthly)
      }

      return formData.otherIncomeType === 'other'
        ? toSafeMoney(formData.otherIncomeMonthly)
        : 0
  }
}

export const getIncomeCategoryStartAge = (
  formData: AlphaFormData,
  category: IncomeCategory,
) => {
  if (category !== 'otherPension') {
    return null
  }

  if (hasStructuredIncomeValue(formData)) {
    return Math.max(toSafeMoney(formData.otherPensionStartAge) || 65, 1)
  }

  return formData.otherIncomeType === 'pension'
    ? Math.max(toSafeMoney(formData.otherIncomeStartAge) || 65, 1)
    : 65
}

export const getIncomeCategoryDurationYears = (
  formData: AlphaFormData,
  category: IncomeCategory,
) => {
  switch (category) {
    case 'earned':
      return toSafeDurationYears(formData.earnedIncomeDurationYears, 10)
    case 'freelance':
      return toSafeDurationYears(formData.freelanceIncomeDurationYears, 10)
    case 'business':
      return toSafeDurationYears(formData.businessIncomeDurationYears, 10)
    case 'rental':
      return toSafeDurationYears(formData.rentalIncomeDurationYears, 10)
    case 'misc':
      return toSafeDurationYears(formData.miscIncomeDurationYears, 10)
    case 'otherPension':
    default:
      return null
  }
}

export const getAgeQualifiedIncomeCategoryMonthly = (
  formData: AlphaFormData,
  category: IncomeCategory,
  age: number,
) => {
  const monthlyValue = getIncomeCategoryMonthlyValue(formData, category)
  const startAge = getIncomeCategoryStartAge(formData, category)
  const durationYears = getIncomeCategoryDurationYears(formData, category)

  if (startAge !== null && age < startAge) {
    return 0
  }

  if (durationYears !== null && age >= formData.currentAge + durationYears) {
    return 0
  }

  return monthlyValue
}

export const getAgeQualifiedOtherIncomeMonthly = (formData: AlphaFormData, age: number) =>
  getSelectedIncomeCategories(formData).reduce(
    (sum, category) => sum + getAgeQualifiedIncomeCategoryMonthly(formData, category, age),
    0,
  )

export const getAgeQualifiedEarnedIncomeMonthly = (formData: AlphaFormData, age: number) =>
  getAgeQualifiedIncomeCategoryMonthly(formData, 'earned', age)

export const getAgeQualifiedRentalIncomeMonthly = (formData: AlphaFormData, age: number) =>
  getAgeQualifiedIncomeCategoryMonthly(formData, 'rental', age)

export const getAgeQualifiedNonSalaryIncomeMonthly = (formData: AlphaFormData, age: number) =>
  getSelectedIncomeCategories(formData)
    .filter((category) => category !== 'earned')
    .reduce(
      (sum, category) => sum + getAgeQualifiedIncomeCategoryMonthly(formData, category, age),
      0,
    )

export const getIncomeBreakdown = (
  formData: AlphaFormData,
  currentAge: number,
  projectionYears: number,
): IncomeBreakdownItem[] =>
  getSelectedIncomeCategories(formData).map((category) => {
    const inputMonthly = getIncomeCategoryMonthlyValue(formData, category)
    const appliedMonthly = getAgeQualifiedIncomeCategoryMonthly(formData, category, currentAge)
    const startAge = getIncomeCategoryStartAge(formData, category)
    const durationYears = getIncomeCategoryDurationYears(formData, category)
    let projectionTotal = 0

    for (let yearIndex = 0; yearIndex < projectionYears; yearIndex += 1) {
      projectionTotal +=
        getAgeQualifiedIncomeCategoryMonthly(formData, category, currentAge + yearIndex) * 12
    }

    return {
      key: category,
      label: getIncomeCategoryLabel(category),
      inputMonthly,
      appliedMonthly,
      projectionTotal,
      ...(startAge !== null ? { startAge } : {}),
      ...(durationYears !== null ? { durationYears } : {}),
    }
  })

export const buildStructuredIncomePatch = (
  categories: IncomeCategory[],
  patch: Partial<AlphaFormData> = {},
): Partial<AlphaFormData> => {
  const primaryCategory = categories.length === 1 ? categories[0] : null

  return {
    selectedIncomeCategories: categories,
    otherIncomeType: primaryCategory ? CATEGORY_TO_LEGACY_MAP[primaryCategory] : 'none',
    ...patch,
  }
}