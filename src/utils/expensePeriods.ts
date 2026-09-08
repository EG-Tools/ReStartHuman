import type { AlphaFormData } from '../types/alpha'

export const getInsuranceMonthlyAtYear = (formData: AlphaFormData, yearIndex = 0) =>
  yearIndex < formData.insurancePaymentYears ? formData.insuranceMonthly : 0

export const getLoanInterestMonthlyAtYear = (formData: AlphaFormData, yearIndex = 0) =>
  yearIndex < formData.loanInterestYears ? formData.loanInterestMonthly : 0
