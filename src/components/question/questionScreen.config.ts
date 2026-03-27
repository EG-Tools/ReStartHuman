import type { ReactNode } from 'react'
import type { QuestionStep, AlphaFormData } from '../../types/alpha'

export interface QuestionScreenProps {
  question: QuestionStep
  questionIndex: number
  totalQuestions: number
  formData: AlphaFormData
  onBack: () => void
  onNext: () => void
  onSeekQuestion: (index: number) => void
  onPatchFormData: (patch: Partial<AlphaFormData>) => void
  headerAction?: ReactNode
}

export interface QuestionNumberFieldConfig {
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


export const householdOptions = [
  { value: 'single', label: '본인' },
  { value: 'couple', label: '공동명의' },
] as const

export const housingOptions = [
  { value: 'own', label: '자가', description: '재산세 추정을 포함합니다.' },
  { value: 'jeonse', label: '전세', description: '전세 보증금 기준으로 입력합니다.' },
  { value: 'monthlyRent', label: '월세', description: '보증금과 월세를 함께 입력합니다.' },
] as const

export const dividendModeOptions = [
  { value: 'gross', label: '세전 입력', description: '입력값을 기준으로 세후 배당을 계산합니다.' },
  { value: 'net', label: '세후 입력', description: '입력값을 이미 세후 금액으로 처리합니다.' },
] as const

export const isaTypeOptions = [
  { value: 'general', label: '일반형' },
  { value: 'workingClass', label: '서민형' },
] as const

export const yesNoOptions = [
  { value: 'yes', label: '예' },
  { value: 'no', label: '아니오' },
] as const

export const simulationYearOptions = [
  { value: '10', label: '10년' },
  { value: '30', label: '30년' },
  { value: '50', label: '50년' },
] as const

export const dividendOwnershipOptions = [
  { value: 'mineOnly', label: '본인' },
  { value: 'spouseOnly', label: '배우자' },
  { value: 'split', label: '분할' },
] as const

export const propertyOwnershipOptions = [
  { value: 'mineOnly', label: '본인' },
  { value: 'spouseOnly', label: '배우자' },
  { value: 'split', label: '공동명의' },
] as const

export const otherIncomeTypeOptions = [
  { value: 'none', label: '없음', description: '추가 월소득이 없습니다.' },
  { value: 'earned', label: '근로소득', description: '월 급여성 소득입니다.' },
  { value: 'business', label: '사업소득', description: '월 사업소득입니다.' },
  { value: 'pension', label: '기타연금', description: '기타 연금성 소득입니다.' },
  { value: 'other', label: '기타', description: '그 외 월 현금유입입니다.' },
] as const

export const otherIncomeTypeOptionRows = [
  [otherIncomeTypeOptions[0]],
  [otherIncomeTypeOptions[1], otherIncomeTypeOptions[2]],
  [otherIncomeTypeOptions[3], otherIncomeTypeOptions[4]],
] as const

export const healthInsuranceOptions = [
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

export const healthInsuranceOptionRows = [
  [healthInsuranceOptions[0], healthInsuranceOptions[3]],
  [healthInsuranceOptions[1], healthInsuranceOptions[4]],
  [healthInsuranceOptions[2], healthInsuranceOptions[5]],
] as const

export const livingCostModeOptions = [
  { value: 'total', label: '총 금액' },
  { value: 'detailed', label: '세부입력' },
] as const

