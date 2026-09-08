import { defaultFormData } from '../data/defaultFormData'
import type { AlphaFormData } from '../types/alpha'

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const formDataEnumValues: Record<string, readonly string[]> = {
  householdType: ['single', 'couple'],
  housingType: ['own', 'jeonse', 'monthlyRent'],
  landOwnershipType: ['mineOnly', 'spouseOnly', 'split'],
  otherPropertyOwnershipType: ['mineOnly', 'spouseOnly', 'split'],
  dividendInputMode: ['gross', 'net'],
  isaType: ['general', 'workingClass', 'unknown'],
  myIsaType: ['general', 'workingClass', 'unknown'],
  spouseIsaType: ['general', 'workingClass', 'unknown'],
  dividendOwnershipType: ['mineOnly', 'spouseOnly', 'split'],
  isaOwnershipType: ['mineOnly', 'spouseOnly', 'split'],
  otherIncomeType: ['earned', 'business', 'pension', 'monthlyRent', 'other', 'none'],
  healthInsuranceType: [
    'regional',
    'employee',
    'dependent',
    'bothRegional',
    'employeeWithDependentSpouse',
    'other',
  ],
  dependentBusinessRegistrationStatus: ['yes', 'no', 'unknown'],
  dependentRentalIncomeType: ['housing', 'commercial', 'unknown'],
  livingCostInputMode: ['total', 'detailed'],
}

const validIncomeCategories = new Set([
  'earned',
  'otherPension',
  'rental',
  'freelance',
  'business',
  'corporateExecutive',
  'misc',
])

const isAdditionalHomeShape = (value: unknown) =>
  isRecordObject(value) &&
  typeof value.housingType === 'string' &&
  ['own', 'jeonse', 'monthlyRent'].includes(value.housingType) &&
  isFiniteNumber(value.marketValue) &&
  isFiniteNumber(value.officialValue)

const isCompatibleFormDataValue = (
  key: string,
  value: unknown,
  templateValue: unknown,
) => {
  if (value === undefined) {
    return true
  }

  if (key === 'additionalHomes') {
    return Array.isArray(value) && value.every(isAdditionalHomeShape)
  }

  if (key === 'selectedIncomeCategories') {
    return (
      Array.isArray(value) &&
      value.every((category) => typeof category === 'string' && validIncomeCategories.has(category))
    )
  }

  if (templateValue === null) {
    return value === null || isFiniteNumber(value)
  }

  if (typeof templateValue === 'number') {
    return isFiniteNumber(value)
  }

  if (typeof templateValue === 'boolean') {
    return typeof value === 'boolean'
  }

  if (typeof templateValue === 'string') {
    const allowedValues = formDataEnumValues[key]
    return typeof value === 'string' && (!allowedValues || allowedValues.includes(value))
  }

  return false
}

export const normalizeStoredFormData = (value: unknown): AlphaFormData | null => {
  if (
    !isRecordObject(value) ||
    typeof value.householdType !== 'string' ||
    !isFiniteNumber(value.simulationYears) ||
    typeof value.housingType !== 'string' ||
    !isFiniteNumber(value.currentAge)
  ) {
    return null
  }

  const isCompatible = Object.entries(defaultFormData).every(([key, templateValue]) =>
    isCompatibleFormDataValue(key, value[key], templateValue),
  )

  return isCompatible ? { ...defaultFormData, ...value } : null
}
