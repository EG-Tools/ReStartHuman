import type { AlphaFormData } from '../types/alpha'

export const defaultFormData: AlphaFormData = {
  householdType: 'single',
  simulationYears: 30,

  hasChildren: false,
  childCount: 0,

  housingType: 'own',
  homeMarketValue: 0,
  homeOfficialValue: 0,
  isJointOwnership: false,
  isSingleHomeOwner: true,
  hasLoan: false,
  additionalHomes: [],

  jeonseDeposit: 0,

  monthlyRentDeposit: 0,
  monthlyRentAmount: 0,

  hasLandOrOtherProperty: false,
  landValue: 0,
  landOwnershipType: 'mineOnly',
  myLandShare: 100,
  spouseLandShare: 0,

  otherPropertyOfficialValue: 0,
  otherPropertyOwnershipType: 'mineOnly',
  myOtherPropertyShare: 100,
  spouseOtherPropertyShare: 0,

  taxableAccountAssets: 0,
  isaAssets: 0,
  pensionAccountAssets: 0,
  otherAssets: 0,

  taxableAccountDividendAnnual: 0,
  isaDividendAnnual: 0,
  pensionDividendAnnual: 0,
  dividendInputMode: 'gross',

  isaType: 'general',
  myIsaType: 'general',
  spouseIsaType: 'general',

  dividendOwnershipType: 'mineOnly',
  myAnnualDividendAttributed: 0,
  spouseAnnualDividendAttributed: 0,
  isaOwnershipType: 'mineOnly',
  myAnnualIsaDividendAttributed: 0,
  spouseAnnualIsaDividendAttributed: 0,

  selectedIncomeCategories: [],
  earnedIncomeMonthly: 0,
  earnedIncomeDurationYears: 10,
  otherPensionMonthly: 0,
  otherPensionStartAge: 65,
  freelanceIncomeMonthly: 0,
  freelanceIncomeDurationYears: 10,
  businessIncomeMonthly: 0,
  businessIncomeDurationYears: 10,
  rentalIncomeMonthly: 0,
  rentalIncomeDurationYears: 10,
  miscIncomeMonthly: 0,
  miscIncomeDurationYears: 10,

  otherIncomeType: 'none',
  otherIncomeMonthly: 0,
  otherIncomeStartAge: 65,

  pensionStartAge: 65,
  pensionMonthlyAmount: 0,

  healthInsuranceType: 'regional',
  salaryMonthly: 0,
  healthInsuranceOverrideMonthly: null,
  dependentBusinessRegistrationStatus: 'unknown',
  dependentRentalIncomeType: 'unknown',
  dependentFreelanceAnnualProfit: 0,

  insuranceMonthly: 0,
  insurancePaymentYears: 10,
  maintenanceMonthly: 0,
  telecomMonthly: 0,
  hasCar: false,
  currentCarMarketValue: 0,
  carYearlyCost: 0,
  loanInterestMonthly: 0,
  loanInterestYears: 0,
  otherFixedMonthly: 0,

  livingCostInputMode: 'total',
  livingCostMonthlyTotal: 0,
  foodMonthly: 0,
  necessitiesMonthly: 0,
  diningOutMonthly: 0,
  hobbyMonthly: 0,
  academyMonthly: 0,
  otherLivingMonthly: 0,

  inflationEnabled: true,
  inflationRateAnnual: 0.02,
  startingCashReserve: 100_000_000,
  currentAge: 50,
}

