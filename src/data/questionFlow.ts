import type { QuestionStep, RetireCalcFormData } from '../types/retireCalc'

const hasIsaStep = (formData: RetireCalcFormData) =>
  formData.isaAssets > 0 || formData.isaDividendAnnual > 0


export const questionFlow: QuestionStep[] = [
  {
    id: 'household',
    title: '가구 기준 정보',
    description: '',
    visibility: () => true,
  },
  {
    id: 'housingDetails',
    title: '주거 형태 및 상세 정보',
    description: '선택한 주거 형태에 필요한 항목만 보여줍니다.',
    visibility: () => true,
  },
  {
    id: 'propertyAssets',
    title: '토지 및 기타 부동산',
    description: '',
    visibility: () => true,
  },
  {
    id: 'assets',
    title: '주식 계좌 자산 규모',
    description: '',
    visibility: () => true,
  },
  {
    id: 'dividends',
    title: '배당금과 연금 예상액',
    description: '',
    visibility: () => true,
  },
  {
    id: 'isa',
    title: 'ISA 상세 정보',
    description: 'ISA 자산이나 배당금이 있을 때만 보여줍니다.',
    visibility: hasIsaStep,
  },
  {
    id: 'income',
    title: '기타 소득 추가',
    description: '',
    visibility: () => true,
  },
  {
    id: 'healthInsurance',
    title: '건강보험 유형',
    description: 'NHIS 구조를 참고한 단순화 추정에 사용됩니다.',
    visibility: () => true,
  },
  {
    id: 'fixedExpenses',
    title: '월 고정지출 및 대출',
    description: '',
    visibility: () => true,
  },
  {
    id: 'livingCosts',
    title: '생활비 및 차량유지비',
    description: '',
    visibility: () => true,
  },
  {
    id: 'cashReserve',
    title: '현재 보유 현금',
    description: '현재 보유한 현금과 예상 현금흐름 반영 기간을 최종 결과에 반영합니다.',
    visibility: () => true,
  },
]
