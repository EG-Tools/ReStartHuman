import type { AlphaFormData } from '../types/alpha'

export const getInsuranceMonthlyAtYear = (formData: AlphaFormData, yearIndex = 0) =>
  yearIndex < formData.insurancePaymentYears ? formData.insuranceMonthly : 0

export const getLoanInterestMonthlyAtYear = (formData: AlphaFormData, yearIndex = 0) =>
  yearIndex < formData.loanInterestYears ? formData.loanInterestMonthly : 0

export const getCarHoldingYears = (formData: AlphaFormData) =>
  formData.carHoldingYears ?? Math.max(80 - formData.currentAge, 0)

export const getCarMonthlyAtYear = (formData: AlphaFormData, yearIndex = 0) =>
  yearIndex < getCarHoldingYears(formData) ? Math.round(formData.carYearlyCost / 12) : 0
