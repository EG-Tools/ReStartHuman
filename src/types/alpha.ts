export type HouseholdType = 'single' | 'couple'
export type HousingType = 'own' | 'jeonse' | 'monthlyRent'
export type DividendInputMode = 'gross' | 'net'
export type IsaType = 'general' | 'workingClass' | 'unknown'
export type IncomeCategory =
  | 'earned'
  | 'otherPension'
  | 'rental'
  | 'freelance'
  | 'business'
  | 'corporateExecutive'
  | 'misc'
export type RegistrationStatus = 'yes' | 'no' | 'unknown'
export type RentalIncomeType = 'housing' | 'commercial' | 'unknown'
export type ReviewLevel = 'none' | 'review' | 'high'

export type HealthInsuranceType =
  | 'regional'
  | 'employee'
  | 'dependent'
  | 'bothRegional'
  | 'employeeWithDependentSpouse'
  | 'other'

export type OwnershipType = 'mineOnly' | 'spouseOnly' | 'split'

export interface AdditionalHome {
  housingType: HousingType
  marketValue: number
  officialValue: number
}

export type QuestionStepId =
  | 'household'
  | 'housingDetails'
  | 'propertyAssets'
  | 'assets'
  | 'dividends'
  | 'income'
  | 'healthInsurance'
  | 'fixedExpenses'
  | 'livingCosts'
  | 'cashReserve'

export interface AlphaFormData {
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
  additionalHomes: AdditionalHome[]

  jeonseDeposit: number

  monthlyRentDeposit: number
  monthlyRentAmount: number

  hasLandOrOtherProperty: boolean
  landValue: number
  landOwnershipType: OwnershipType
  myLandShare: number
  spouseLandShare: number

  otherPropertyOfficialValue: number
  otherPropertyOwnershipType: OwnershipType
  myOtherPropertyShare: number
  spouseOtherPropertyShare: number

  taxableAccountAssets: number
  isaAssets: number
  pensionAccountAssets: number
  otherAssets: number

  taxableAccountDividendAnnual: number
  isaDividendAnnual: number
  pensionDividendAnnual: number
  dividendInputMode: DividendInputMode

  isaType: IsaType
  myIsaType: IsaType
  spouseIsaType: IsaType

  dividendOwnershipType: OwnershipType
  myAnnualDividendAttributed: number
  spouseAnnualDividendAttributed: number
  isaOwnershipType: OwnershipType
  myAnnualIsaDividendAttributed: number
  spouseAnnualIsaDividendAttributed: number

  selectedIncomeCategories: IncomeCategory[]
  earnedIncomeMonthly: number
  earnedIncomeDurationYears: number
  otherPensionMonthly: number
  otherPensionStartAge: number
  freelanceIncomeMonthly: number
  freelanceIncomeDurationYears: number
  businessIncomeMonthly: number
  businessIncomeDurationYears: number
  previousYearDeclaredBusinessIncomeAnnual: number
  corporateExecutiveSalaryMonthly: number
  corporateExecutiveDurationYears: number
  rentalIncomeMonthly: number
  rentalIncomeDurationYears: number
  miscIncomeMonthly: number
  miscIncomeDurationYears: number

  otherIncomeType: 'earned' | 'business' | 'pension' | 'monthlyRent' | 'other' | 'none'
  otherIncomeMonthly: number
  otherIncomeStartAge: number

  pensionStartAge: number
  pensionMonthlyAmount: number

  healthInsuranceType: HealthInsuranceType
  salaryMonthly: number
  healthInsuranceOverrideMonthly: number | null
  dependentBusinessRegistrationStatus: RegistrationStatus
  dependentRentalIncomeType: RentalIncomeType
  dependentFreelanceAnnualProfit: number

  insuranceMonthly: number
  insurancePaymentYears: number
  maintenanceMonthly: number
  telecomMonthly: number
  hasCar: boolean
  currentCarMarketValue: number
  carYearlyCost: number
  loanInterestMonthly: number
  loanInterestYears: number
  otherFixedMonthly: number

  livingCostInputMode: 'total' | 'detailed'
  livingCostMonthlyTotal: number
  foodMonthly: number
  necessitiesMonthly: number
  diningOutMonthly: number
  hobbyMonthly: number
  academyMonthly?: number
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

export interface HoldingTaxBreakdownItem {
  key: 'home' | 'additionalHome' | 'land' | 'otherProperty'
  label: string
  annual: number
  monthly: number
  baseValue: number
}

export interface IncomeBreakdownItem {
  key: IncomeCategory
  label: string
  inputMonthly: number
  appliedMonthly: number
  projectionTotal: number
  startAge?: number
  durationYears?: number
}

export interface AlphaResult {
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
  estimatedComprehensiveIncomeTaxAnnual: number
  estimatedLocalIncomeTaxAnnual: number
  estimatedComprehensiveTaxBaseAnnual: number
  rentalIncomeTaxAnnual: number
  rentalIncomeTaxMonthly: number

  healthInsuranceMonthly: number
  nextReflectedHealthInsuranceMonthly: number
  healthInsuranceSource: 'estimated' | 'manual'

  healthInsuranceReviewLevel: ReviewLevel
  healthInsuranceReviewReasons: string[]
  holdingTaxAnnual: number
  holdingTaxMonthly: number
  holdingTaxBreakdown: HoldingTaxBreakdownItem[]

  pensionMonthlyApplied: number
  otherIncomeMonthlyApplied: number
  incomeBreakdown: IncomeBreakdownItem[]
  projectionHealthInsuranceTotal: number
  projectionPensionIncomeTotal: number
  projectionOtherIncomeTotal: number
  projectionRentalIncomeTaxTotal: number
  projectionEstimatedComprehensiveIncomeTaxTotal: number
  projectionEstimatedLocalIncomeTaxTotal: number
  estimatedComprehensiveTaxReviewLevel: ReviewLevel
  estimatedComprehensiveTaxReviewReasons: string[]
  rentalSeparateTaxationOption: boolean

  carMonthlyConverted: number
  housingMonthlyCost: number
  fixedExpenseMonthly: number
  livingExpenseMonthly: number
  totalExpenseMonthly: number
  totalIncomeMonthly: number
  projectionTotalIncomeTotal: number

  monthlyUsableCash: number
  projectionUsableCashTotal: number
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
  formData: AlphaFormData
  result: AlphaResult
}

export interface QuestionStep {
  id: QuestionStepId
  title: string
  description: string
  visibility: (formData: AlphaFormData) => boolean
}

