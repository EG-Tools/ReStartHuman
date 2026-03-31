import type { QuestionStep } from '../types/alpha'

export const questionFlow: QuestionStep[] = [
  {
    id: 'household',
    title: '가구 구성',
    description: '',
    visibility: () => true,
  },
  {
    id: 'housingDetails',
    title: '주거 정보',
    description: '거주 형태와 현재 거주 주택 정보를 입력합니다.',
    visibility: () => true,
  },
  {
    id: 'propertyAssets',
    title: '토지 및 기타 부동산',
    description: '',
    visibility: (_formData, accessMode) => accessMode === 'pro',
  },
  {
    id: 'assets',
    title: '금융 및 보유 자산',
    description: '',
    visibility: () => true,
  },
  {
    id: 'dividends',
    title: '배당금 및 국민연금',
    description: '',
    visibility: () => true,
  },
  {
    id: 'income',
    title: '추가 소득 입력',
    description: '',
    visibility: () => true,
  },
  {
    id: 'healthInsurance',
    title: '건강보험 유형',
    description: '국민건강보험 추정 기준에 필요한 정보를 입력합니다.',
    visibility: () => true,
  },
  {
    id: 'fixedExpenses',
    title: '월 고정지출 및 보험',
    description: '',
    visibility: () => true,
  },
  {
    id: 'livingCosts',
    title: '생활비 및 차량비',
    description: '',
    visibility: () => true,
  },
  {
    id: 'cashReserve',
    title: '현금 보유 금액',
    description: '현재 보유 현금과 예상 기간을 입력합니다.',
    visibility: () => true,
  },
]
