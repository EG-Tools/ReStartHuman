import type { AlphaFormData, IncomeBreakdownItem, IncomeCategory } from '../types/alpha'

const INCOME_CATEGORY_ORDER: IncomeCategory[] = [
  'earned',
  'otherPension',
  'rental',
  'freelance',
  'business',
  'corporateExecutive',
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
  rental: 'monthlyRent',
  freelance: 'other',
  business: 'business',
  corporateExecutive: 'earned',
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
    label: '????',
    description: '??? ???? ?? ??? ?? ??',
  },
  {
    value: 'otherPension',
    label: '????',
    description: '???? ?? ??? ?? ?? ??',
  },
  {
    value: 'rental',
    label: '????',
    description: '???? ??? ???? ???? ??',
  },
  {
    value: 'freelance',
    label: '????',
    description: '???????????? ?? ??',
  },
  {
    value: 'business',
    label: '?????',
    description: '?????? ?? ???? ??',
  },
  {
    value: 'corporateExecutive',
    label: '????',
    description: '?? ??? ?? ??? ??? ?????.',
  },
  {
    value: 'misc',
    label: '????',
    description: '? ?? ? ?????? ???? ??',
  },
]

export const incomeCategoryOptionRows = [
  [incomeCategoryOptions[0], incomeCategoryOptions[1], incomeCategoryOptions[2]],
  [incomeCategoryOptions[3], incomeCategoryOptions[4], incomeCategoryOptions[5]],
  [incomeCategoryOptions[6]],
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
  toSafeMoney(formData.rentalIncomeMonthly) > 0 ||
  toSafeMoney(formData.freelanceIncomeMonthly) > 0 ||
  toSafeMoney(formData.businessIncomeMonthly) > 0 ||
  toSafeMoney(formData.corporateExecutiveSalaryMonthly) > 0 ||
  toSafeMoney(formData.miscIncomeMonthly) > 0

export const getIncomeCategoryLabel = (category: IncomeCategory) => {
  switch (category) {
    case 'earned':
      return '????'
    case 'otherPension':
      return '????'
    case 'rental':
      return '????'
    case 'freelance':
      return '????'
    case 'business':
      return '?????'
    case 'corporateExecutive':
      return '???? ??'
    case 'misc':
    default:
      return '????'
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
    case 'rental':
      if (hasStructuredIncomeValue(formData)) {
        return toSafeMoney(formData.rentalIncomeMonthly)
      }

      return formData.otherIncomeType === 'monthlyRent'
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
    case 'corporateExecutive':
      return toSafeMoney(formData.corporateExecutiveSalaryMonthly)
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
    case 'rental':
      return toSafeDurationYears(formData.rentalIncomeDurationYears, 10)
    case 'freelance':
      return toSafeDurationYears(formData.freelanceIncomeDurationYears, 10)
    case 'business':
      return toSafeDurationYears(formData.businessIncomeDurationYears, 10)
    case 'corporateExecutive':
      return toSafeDurationYears(formData.corporateExecutiveDurationYears, 10)
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
    .filter((category) => category !== 'earned' && category !== 'corporateExecutive')
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
