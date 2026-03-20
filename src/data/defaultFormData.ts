import type { RetireCalcFormData } from '../types/retireCalc'

export const defaultFormData: RetireCalcFormData = {
  householdType: 'single',
  simulationYears: 10,

  housingType: 'own',
  homeMarketValue: 0,
  homeOfficialValue: 0,
  isJointOwnership: false,
  isSingleHomeOwner: true,
  hasLoan: false,

  jeonseDeposit: 0,

  monthlyRentDeposit: 0,
  monthlyRentAmount: 0,
  maintenanceIncludedInRent: true,
  monthlyMaintenanceFee: 0,

  taxableAccountAssets: 0,
  isaAssets: 0,
  pensionAccountAssets: 0,
  otherAssets: 0,

  taxableAccountDividendAnnual: 0,
  isaDividendAnnual: 0,
  pensionDividendAnnual: 0,
  dividendInputMode: 'gross',

  isaType: 'unknown',
  isaYearsSinceOpen: 0,
  isaMaturityExtended: 'unknown',
  myIsaType: 'unknown',
  spouseIsaType: 'unknown',

  dividendOwnershipType: 'mineOnly',
  myAnnualDividendAttributed: 0,
  spouseAnnualDividendAttributed: 0,
  isaOwnershipType: 'mineOnly',
  myAnnualIsaDividendAttributed: 0,
  spouseAnnualIsaDividendAttributed: 0,

  otherIncomeType: 'none',
  otherIncomeMonthly: 0,

  hasPensionIncome: false,
  pensionStartAge: 60,
  pensionMonthlyAmount: 0,

  healthInsuranceType: 'regional',
  salaryMonthly: 0,
  spouseDependent: false,
  isBusinessOwner: false,
  isUnpaidOwner: false,
  healthInsuranceOverrideMonthly: null,

  insuranceMonthly: 0,
  maintenanceMonthly: 0,
  telecomMonthly: 0,
  nationalPensionMonthly: 0,
  carYearlyCost: 0,
  otherFixedMonthly: 0,

  livingCostInputMode: 'total',
  livingCostMonthlyTotal: 0,
  foodMonthly: 0,
  necessitiesMonthly: 0,
  diningOutMonthly: 0,
  hobbyMonthly: 0,
  otherLivingMonthly: 0,

  inflationEnabled: true,
  inflationRateAnnual: 0.02,
  startingCashReserve: 100_000_000,
}

