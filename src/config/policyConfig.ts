export const policyConfig = {
  policyBaseDate: '2026-03-27',
  policyStatus:
    '정책 기준일은 2026년 3월 27일입니다. 일반계좌 배당 원천징수, ISA 절세, 금융소득 종합과세 공개 기준을 반영했고, 건강보험과 종합소득세는 공개 기준을 참고한 단순 추정치입니다.',
  dividendTaxRate: 0.154,
  dividendWithholding: {
    referenceDate: '2026-03-20',
    incomeTaxRate: 0.14,
    localIncomeTaxRate: 0.014,
    totalRate: 0.154,
    note: '배당 원천징수 15.4%(소득세 14% + 지방소득세 1.4%)',
  },
  isa: {
    referenceDate: '2026-03-20',
    generalTaxFreeLimit: 5_000_000,
    workingClassTaxFreeLimit: 10_000_000,
    excessIncomeTaxRate: 0.09,
    excessLocalIncomeTaxRate: 0.009,
    excessTaxRate: 0.099,
    note:
      '일반형 500만원, 서민형 1,000만원 비과세로 보고 초과분은 9.9% 분리과세 구조를 반영했습니다.',
  },
  healthInsurance: {
    referenceDate: '2026-03-27',
    employeeContributionRate: 0.0719,
    regionalContributionPerPoint: 211.5,
    employeeIncomeShareRate: 0.5,
    employeeAdditionalIncomeThresholdAnnual: 20_000_000,
    dependentIncomeThresholdAnnual: 20_000_000,
    dependentFreelanceProfitThresholdAnnual: 5_000_000,
    dependentPropertyReviewThreshold: 540_000_000,
    dependentPropertyDisqualifyThreshold: 900_000_000,
    dependentPropertyIncomeThresholdAnnual: 10_000_000,
    regionalPropertyDeduction: 100_000_000,
    leaseValueRatio: 0.3,
    regionalPropertyValuePerPointApprox: 250_000,
    approximationNotice:
      '직장가입자 7.19% 보험료율, 보수 외 소득 2,000만원 기준, 지역가입자 재산 기본공제 1억원, 피부양자 재산세 과표 5.4억원·9억원 구간을 참고한 단순 추정 모델입니다.',
  },
  holdingTax: {
    referenceDate: '2026-03-20',
    defaultFairMarketRatio: 0.6,
    singleHomeSpecialFairMarketRatioTiers: [
      {
        upperBound: 300_000_000,
        ratio: 0.43,
      },
      {
        upperBound: 600_000_000,
        ratio: 0.44,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        ratio: 0.45,
      },
    ],
    urbanAreaRate: 0.0014,
    localEducationTaxRate: 0.2,
    jointOwnershipShareCount: 2,
    landAssessedValueRatioApprox: 0.7,
    singleHomeSpecialOfficialValueThreshold: 900_000_000,
    note:
      '주택, 토지, 기타 부동산은 지방세법상 구조를 참고한 단순 추정입니다. 주택은 공시가격, 토지는 입력 금액의 70%를 기준가로 보고 계산합니다.',
    standardRates: [
      {
        upperBound: 60_000_000,
        baseStart: 0,
        baseTax: 0,
        rate: 0.001,
      },
      {
        upperBound: 150_000_000,
        baseStart: 60_000_000,
        baseTax: 60_000,
        rate: 0.0015,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        baseStart: 150_000_000,
        baseTax: 195_000,
        rate: 0.0025,
      },
    ],
    singleHomeSpecialRates: [
      {
        upperBound: 60_000_000,
        baseStart: 0,
        baseTax: 0,
        rate: 0.0005,
      },
      {
        upperBound: 150_000_000,
        baseStart: 60_000_000,
        baseTax: 30_000,
        rate: 0.001,
      },
      {
        upperBound: 300_000_000,
        baseStart: 150_000_000,
        baseTax: 120_000,
        rate: 0.002,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        baseStart: 300_000_000,
        baseTax: 420_000,
        rate: 0.0035,
      },
    ],
  },
  comprehensiveIncomeTax: {
    referenceDate: '2026-03-27',
    financialIncomeThresholdAnnual: 20_000_000,
    localIncomeTaxMultiplier: 0.1,
    basicPersonalDeductionAnnual: 1_500_000,
    miscIncomeExpenseRate: 0.6,
    miscIncomeReportThresholdAnnual: 3_000_000,
    earnedIncomeDeductionMaxAnnual: 20_000_000,
    earnedIncomeDeductionBrackets: [
      {
        upperBound: 5_000_000,
        baseStart: 0,
        baseDeduction: 0,
        rate: 0.7,
      },
      {
        upperBound: 15_000_000,
        baseStart: 5_000_000,
        baseDeduction: 3_500_000,
        rate: 0.4,
      },
      {
        upperBound: 45_000_000,
        baseStart: 15_000_000,
        baseDeduction: 7_500_000,
        rate: 0.15,
      },
      {
        upperBound: 100_000_000,
        baseStart: 45_000_000,
        baseDeduction: 12_000_000,
        rate: 0.05,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        baseStart: 100_000_000,
        baseDeduction: 14_750_000,
        rate: 0.02,
      },
    ],
    publicPensionDeductionMaxAnnual: 9_000_000,
    publicPensionDeductionBrackets: [
      {
        upperBound: 3_500_000,
        baseStart: 0,
        baseDeduction: 0,
        rate: 1,
      },
      {
        upperBound: 7_000_000,
        baseStart: 3_500_000,
        baseDeduction: 3_500_000,
        rate: 0.4,
      },
      {
        upperBound: 14_000_000,
        baseStart: 7_000_000,
        baseDeduction: 4_900_000,
        rate: 0.2,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        baseStart: 14_000_000,
        baseDeduction: 6_300_000,
        rate: 0.1,
      },
    ],
    note:
      '금융소득은 인별로 연 2,000만원 초과 여부를 판정합니다. 추정 종합소득세는 근로소득공제, 국민연금 연금소득공제, 기타소득 필요경비 60%와 소득금액 300만원 기준, 본인 기본공제 150만원을 단순 반영합니다.',
    brackets: [
      {
        upperBound: 14_000_000,
        rate: 0.06,
        deduction: 0,
      },
      {
        upperBound: 50_000_000,
        rate: 0.15,
        deduction: 1_260_000,
      },
      {
        upperBound: 88_000_000,
        rate: 0.24,
        deduction: 5_760_000,
      },
      {
        upperBound: 150_000_000,
        rate: 0.35,
        deduction: 15_440_000,
      },
      {
        upperBound: 300_000_000,
        rate: 0.38,
        deduction: 19_940_000,
      },
      {
        upperBound: 500_000_000,
        rate: 0.4,
        deduction: 25_940_000,
      },
      {
        upperBound: 1_000_000_000,
        rate: 0.42,
        deduction: 35_940_000,
      },
      {
        upperBound: Number.POSITIVE_INFINITY,
        rate: 0.45,
        deduction: 65_940_000,
      },
    ],
  },
  rentalIncomeTax: {
    referenceDate: '2026-03-20',
    estimatedExpenseRate: 0.5,
    basicDeductionAnnual: 4_000_000,
    separateTaxationThresholdAnnual: 20_000_000,
    localIncomeTaxMultiplier: 0.1,
    note:
      '월세소득은 필요경비 50%와 기본공제 400만원을 적용한 단순 추정이며, 다주택 보유 여부에 따른 실제 신고 방식과는 차이가 있을 수 있습니다.',
  },
  privacyStorageNotice:
    '입력한 모든 정보와 계산 결과는 사용자의 현재 기기에만 저장되며 서버로 전송되지 않습니다.',
  inflation: {
    defaultAnnualRate: 0.02,
  },
} as const
