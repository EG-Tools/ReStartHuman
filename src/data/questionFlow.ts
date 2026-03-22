import type { QuestionStep } from '../types/retireCalc'

export const questionFlow: QuestionStep[] = [
  {
    id: 'household',
    title: '계산 기준',
    description: '',
    visibility: () => true,
  },
  {
    id: 'housingDetails',
    title: '주거 상세 정보',
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
    title: '월 고정지출, 자동차 1년 유지비',
    description: '',
    visibility: () => true,
  },
  {
    id: 'livingCosts',
    title: '월 생활비용',
    description: '',
    visibility: () => true,
  },
  {
    id: 'cashReserve',
    title: '현재 보유 현금, 나이',
    description: '현재 보유한 현금과, 나이를 참고해서 최종 결과에 반영합니다.',
    visibility: () => true,
  },
]
