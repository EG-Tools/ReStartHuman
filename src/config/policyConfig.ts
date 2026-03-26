export const policyConfig = {
  policyBaseDate: '2026-03-20',
  policyStatus:
    '정책 기준일은 2026년 3월 20일입니다. 일반계좌 배당 원천징수, ISA 특례, 금융소득 종합과세는 정부 공개 기준 구조를 반영했습니다. 보유세는 지방세법상 재산세 구조를 참고해 주택·토지·상가 및 기타부동산까지 단순화 추정했고, 건강보험료는 NHIS 공개 구조를 참고한 단순화 추정치이므로 실제 고지액과 다를 수 있습니다.',
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
      '일반형 500만원, 서민형 1,000만원 비과세 후 초과분은 9%(지방소득세 포함 9.9%) 분리과세 구조를 반영했습니다.',
  },
  healthInsurance: {
    referenceDate: '2026-03-20',
    employeeContributionRate: 0.0719,
    regionalContributionPerPoint: 211.5,
    employeeIncomeShareRate: 0.5,
    employeeAdditionalIncomeThresholdAnnual: 20_000_000,
    regionalPropertyDeduction: 50_000_000,
    leaseValueRatio: 0.3,
    regionalPropertyValuePerPointApprox: 250_000,
    approximationNotice:
      '직장가입자 7.19% 보험료율, 직장 보수 외 소득 2,000만원 초과 기준, 지역가입자 재산 5,000만원 공제 구조를 참고한 단순화 모델입니다.',
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
      '재산세는 지방세법상 본세, 도시지역분, 지방교육세 구조를 참고한 단순화 추정입니다. 자가 주택은 공시가격을 그대로 사용하고, 토지는 입력 금액의 70%를 과세표준 산정을 위한 공시가격 유사값으로 근사했습니다. 상가 및 기타부동산은 입력한 공시가격을 사용합니다. 종합부동산세와 세부담상한은 아직 제외했습니다.',
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
    referenceDate: '2026-03-20',
    financialIncomeThresholdAnnual: 20_000_000,
    localIncomeTaxMultiplier: 0.1,
    note:
      '금융소득은 인별로 연 2,000만원 초과 여부를 판정하고, 소득세법 제62조 비교세액 구조를 단순화해 계산합니다.',
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
  privacyStorageNotice:
    '입력한 모든 정보와 계산 결과는 사용자의 휴대폰(기기) 내에만 저장되며, 당사를 포함한 외부 서버로 전송되거나 별도로 저장되지 않습니다.',
  inflation: {
    defaultAnnualRate: 0.02,
  },
} as const
