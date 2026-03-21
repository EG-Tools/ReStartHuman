export type HouseholdType = 'single' | 'couple'
export type HousingType = 'own' | 'jeonse' | 'monthlyRent'
export type DividendInputMode = 'gross' | 'net'
export type IsaType = 'general' | 'workingClass' | 'unknown'
export type YesNoUnknown = 'yes' | 'no' | 'unknown'

export type HealthInsuranceType =
  | 'regional'
  | 'employee'
  | 'dependent'
  | 'bothRegional'
  | 'employeeWithDependentSpouse'
  | 'other'

export type OwnershipType = 'mineOnly' | 'spouseOnly' | 'split'

export type QuestionStepId =
  | 'household'
  | 'housingType'
  | 'housingDetails'
  | 'assets'
  | 'dividends'
  | 'isa'
  | 'income'
  | 'pension'
  | 'healthInsurance'
  | 'fixedExpenses'
  | 'livingCosts'
  | 'cashReserve'

export interface RetireCalcFormData {
  householdType: HouseholdType
  simulationYears: number

  hasChildren?: boolean
  childCount?: number

  housingType: HousingType
  homeMarketValue: number
  homeOfficialValue: number
  isJointOwnership: boolean
  isSingleHomeOwner: boolean
  hasLoan: boolean

  jeonseDeposit: number

  monthlyRentDeposit: number
  monthlyRentAmount: number
  maintenanceIncludedInRent: boolean
  monthlyMaintenanceFee: number

  taxableAccountAssets: number
  isaAssets: number
  pensionAccountAssets: number
  otherAssets: number

  taxableAccountDividendAnnual: number
  isaDividendAnnual: number
  pensionDividendAnnual: number
  dividendInputMode: DividendInputMode

  isaType: IsaType
  isaYearsSinceOpen: number
  isaMaturityExtended: YesNoUnknown
  myIsaType: IsaType
  spouseIsaType: IsaType

  dividendOwnershipType: OwnershipType
  myAnnualDividendAttributed: number
  spouseAnnualDividendAttributed: number
  isaOwnershipType: OwnershipType
  myAnnualIsaDividendAttributed: number
  spouseAnnualIsaDividendAttributed: number

  otherIncomeType: 'earned' | 'business' | 'pension' | 'other' | 'none'
  otherIncomeMonthly: number

  hasPensionIncome: boolean
  pensionStartAge: number
  pensionMonthlyAmount: number

  healthInsuranceType: HealthInsuranceType
  salaryMonthly: number
  isBusinessOwner: boolean
  isUnpaidOwner: boolean
  healthInsuranceOverrideMonthly: number | null

  insuranceMonthly: number
  maintenanceMonthly: number
  telecomMonthly: number
  nationalPensionMonthly: number
  carYearlyCost: number
  otherFixedMonthly: number

  livingCostInputMode: 'total' | 'detailed'
  livingCostMonthlyTotal: number
  foodMonthly: number
  necessitiesMonthly: number
  diningOutMonthly: number
  hobbyMonthly: number
  otherLivingMonthly: number

  inflationEnabled: boolean
  inflationRateAnnual: number
  startingCashReserve: number
  currentAge: number
}

export interface AccountOwnershipBreakdown {
  personKey: 'mine' | 'spouse'
  label: string
  attributedAnnual: number
}

export interface IsaTaxBreakdown {
  personKey: 'mine' | 'spouse'
  label: string
  isaType: 'general' | 'workingClass'
  attributedAnnual: number
  taxFreeLimitAnnual: number
  taxFreeLimitAppliedAnnual: number
  taxableExcessAnnual: number
  taxAnnual: number
  netAnnual: number
}

export interface ComprehensiveTaxPersonBreakdown {
  personKey: 'mine' | 'spouse'
  label: string
  attributedDividendAnnual: number
  thresholdAnnual: number
  exceedsThreshold: boolean
  finalTaxAnnual: number
  withheldTaxAnnual: number
  additionalTaxAnnual: number
}

export interface CashBalancePoint {
  year: number
  balance: number
}

export interface RetireCalcResult {
  policyBaseDate: string
  policyStatus: string

  dividendInputMode: DividendInputMode

  taxableDividendAnnualGross: number
  taxableDividendAnnualNet: number
  taxableDividendMonthlyGross: number
  taxableDividendMonthlyNet: number
  taxableDividendWithholdingAnnual: number
  taxableDividendWithholdingRate: number
  taxableDividendOwnershipBreakdown: AccountOwnershipBreakdown[]

  isaDividendAnnualGross: number
  isaDividendAnnualNet: number
  isaDividendMonthlyGross: number
  isaDividendMonthlyNet: number
  isaTaxAnnual: number
  isaTaxFreeLimitApplied: number
  isaExcessTaxRate: number
  isaDividendOwnershipBreakdown: AccountOwnershipBreakdown[]
  isaTaxBreakdown: IsaTaxBreakdown[]

  pensionDividendAnnualGross: number
  pensionDividendAnnualNet: number
  pensionDividendMonthlyGross: number
  pensionDividendMonthlyNet: number

  totalDividendAnnualGross: number
  totalDividendAnnualNet: number
  totalDividendMonthlyGross: number
  totalDividendMonthlyNet: number

  comprehensiveTaxIncluded: boolean
  comprehensiveTaxImpactAnnual: number
  comprehensiveTaxThresholdAnnual: number
  comprehensiveTaxBaseAnnual: number
  comprehensiveTaxBreakdown: ComprehensiveTaxPersonBreakdown[]

  healthInsuranceMonthly: number
  healthInsuranceSource: 'estimated' | 'manual'
  holdingTaxAnnual: number
  holdingTaxMonthly: number

  pensionMonthlyApplied: number
  otherIncomeMonthlyApplied: number

  carMonthlyConverted: number
  housingMonthlyCost: number
  fixedExpenseMonthly: number
  livingExpenseMonthly: number
  totalExpenseMonthly: number
  totalIncomeMonthly: number

  monthlyUsableCash: number
  monthlySurplusOrDeficit: number

  yearlySurplusOrDeficit: number
  tenYearSurplusOrDeficit: number
  startingCashReserve: number
  cashBalanceAfterTenYears: number
  cashBalanceTimeline: CashBalancePoint[]

  riskLevel: 'surplus' | 'deficit' | 'neutral'

  loanNotice: boolean
}

export interface SaveSlotRecord {
  slotId: number
  name: string
  savedAt: string
  formData: RetireCalcFormData
  result: RetireCalcResult
}

export interface QuestionStep {
  id: QuestionStepId
  title: string
  description: string
  visibility: (formData: RetireCalcFormData) => boolean
}
