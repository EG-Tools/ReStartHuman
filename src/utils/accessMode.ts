import { defaultFormData } from '../data/defaultFormData'
import type { AlphaFormData, AppAccessMode } from '../types/alpha'

const toSafeMoney = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(value ?? 0, 0)
}

const deriveGeneralLivingCostTotal = (formData: AlphaFormData) => {
  const explicitTotal = toSafeMoney(formData.livingCostMonthlyTotal)

  if (explicitTotal > 0) {
    return explicitTotal
  }

  return (
    toSafeMoney(formData.foodMonthly) +
    toSafeMoney(formData.necessitiesMonthly) +
    toSafeMoney(formData.diningOutMonthly) +
    toSafeMoney(formData.hobbyMonthly) +
    toSafeMoney(formData.otherLivingMonthly) +
    toSafeMoney(formData.hasChildren ? formData.academyMonthly : 0) +
    Math.round(toSafeMoney(formData.carYearlyCost) / 12)
  )
}

const deriveGeneralFixedExpenseMonthly = (formData: AlphaFormData) => {
  const explicitTotal = toSafeMoney(formData.otherFixedMonthly)

  if (explicitTotal > 0) {
    return explicitTotal
  }

  return (
    toSafeMoney(formData.insuranceMonthly) +
    toSafeMoney(formData.maintenanceMonthly) +
    toSafeMoney(formData.telecomMonthly) +
    (formData.hasLoan ? toSafeMoney(formData.loanInterestMonthly) : 0)
  )
}

export const getAccessModeFormData = (
  formData: AlphaFormData,
  accessMode: AppAccessMode,
): AlphaFormData => {
  if (accessMode === 'pro') {
    return formData
  }

  const taxableAccountDividendAnnual = toSafeMoney(formData.taxableAccountDividendAnnual)
  const miscIncomeMonthly = toSafeMoney(formData.miscIncomeMonthly)
  const generalLivingCostTotal = deriveGeneralLivingCostTotal(formData)
  const generalFixedExpenseMonthly = deriveGeneralFixedExpenseMonthly(formData)
  const hasMiscIncome = miscIncomeMonthly > 0 || formData.selectedIncomeCategories.includes('misc')

  return {
    ...formData,
    householdType: 'single',
    hasChildren: false,
    childCount: 0,
    academyMonthly: 0,
    isJointOwnership: false,
    isSingleHomeOwner: formData.housingType === 'own',
    additionalHomes: [],
    hasLandOrOtherProperty: false,
    landValue: 0,
    landOwnershipType: defaultFormData.landOwnershipType,
    myLandShare: defaultFormData.myLandShare,
    spouseLandShare: defaultFormData.spouseLandShare,
    otherPropertyOfficialValue: 0,
    otherPropertyOwnershipType: defaultFormData.otherPropertyOwnershipType,
    myOtherPropertyShare: defaultFormData.myOtherPropertyShare,
    spouseOtherPropertyShare: defaultFormData.spouseOtherPropertyShare,
    isaAssets: 0,
    pensionAccountAssets: 0,
    otherAssets: 0,
    isaDividendAnnual: 0,
    pensionDividendAnnual: 0,
    isaType: defaultFormData.isaType,
    myIsaType: defaultFormData.myIsaType,
    spouseIsaType: defaultFormData.spouseIsaType,
    dividendOwnershipType: defaultFormData.dividendOwnershipType,
    myAnnualDividendAttributed: taxableAccountDividendAnnual,
    spouseAnnualDividendAttributed: 0,
    isaOwnershipType: defaultFormData.isaOwnershipType,
    myAnnualIsaDividendAttributed: 0,
    spouseAnnualIsaDividendAttributed: 0,
    selectedIncomeCategories: hasMiscIncome ? ['misc'] : [],
    earnedIncomeMonthly: 0,
    earnedIncomeDurationYears: defaultFormData.earnedIncomeDurationYears,
    otherPensionMonthly: 0,
    otherPensionStartAge: defaultFormData.otherPensionStartAge,
    freelanceIncomeMonthly: 0,
    freelanceIncomeDurationYears: defaultFormData.freelanceIncomeDurationYears,
    businessIncomeMonthly: 0,
    businessIncomeDurationYears: defaultFormData.businessIncomeDurationYears,
    previousYearDeclaredBusinessIncomeAnnual: 0,
    corporateExecutiveSalaryMonthly: 0,
    corporateExecutiveDurationYears: defaultFormData.corporateExecutiveDurationYears,
    rentalIncomeMonthly: 0,
    rentalIncomeDurationYears: defaultFormData.rentalIncomeDurationYears,
    miscIncomeMonthly,
    miscIncomeDurationYears: Math.max(
      formData.miscIncomeDurationYears || defaultFormData.miscIncomeDurationYears,
      1,
    ),
    otherIncomeType: hasMiscIncome ? 'other' : 'none',
    otherIncomeMonthly: hasMiscIncome ? miscIncomeMonthly : 0,
    otherIncomeStartAge: defaultFormData.otherIncomeStartAge,
    healthInsuranceType: 'regional',
    salaryMonthly: 0,
    healthInsuranceOverrideMonthly: null,
    dependentBusinessRegistrationStatus: defaultFormData.dependentBusinessRegistrationStatus,
    dependentRentalIncomeType: defaultFormData.dependentRentalIncomeType,
    dependentFreelanceAnnualProfit: 0,
    insuranceMonthly: 0,
    insurancePaymentYears: defaultFormData.insurancePaymentYears,
    maintenanceMonthly: 0,
    telecomMonthly: 0,
    hasCar: false,
    currentCarMarketValue: 0,
    carYearlyCost: 0,
    hasLoan: false,
    loanInterestMonthly: 0,
    loanInterestYears: 0,
    otherFixedMonthly: generalFixedExpenseMonthly,
    livingCostInputMode: 'total',
    livingCostMonthlyTotal: generalLivingCostTotal,
    foodMonthly: 0,
    necessitiesMonthly: 0,
    diningOutMonthly: 0,
    hobbyMonthly: 0,
    otherLivingMonthly: 0,
  }
}
