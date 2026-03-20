import type { QuestionStep } from '../types/retireCalc'

export const questionFlow: QuestionStep[] = [
  {
    id: 'household',
    title: '계산 기준',
    description: '',
    visibility: () => true,
  },
  {
    id: 'housingType',
    title: '현재 집 형태를 선택해 주세요.',
    description: '주거 형태에 따라 뒤 입력과 세금 추정 구조가 달라집니다.',
    visibility: () => true,
  },
  {
    id: 'housingDetails',
    title: '주거 상세 정보를 입력해 주세요.',
    description: '선택한 주거 형태에 필요한 항목만 보여줍니다.',
    visibility: () => true,
  },
  {
    id: 'assets',
    title: '주식계좌 규모를 입력해 주세요.',
    description: '',
    visibility: () => true,
  },
  {
    id: 'dividends',
    title: '배당금과 연금 예상액을 입력해 주세요.',
    description: '',
    visibility: () => true,
  },
  {
    id: 'isa',
    title: 'ISA 유형을 선택해 주세요.',
    description: '',
    visibility: () => true,
  },
  {
    id: 'income',
    title: '기타 소득을 입력해 주세요.',
    description: '배당 외에 추가 월소득이 있으면 종류와 금액을 반영합니다.',
    visibility: () => true,
  },
  {
    id: 'healthInsurance',
    title: '건강보험 상태를 선택해 주세요.',
    description: 'NHIS 구조를 참고한 단순화 추정에 사용됩니다.',
    visibility: () => true,
  },
  {
    id: 'fixedExpenses',
    title: '월 고정지출을 입력해 주세요.',
    description: '자동차 비용은 연간 금액을 월 기준으로 환산합니다.',
    visibility: () => true,
  },
  {
    id: 'livingCosts',
    title: '생활비 입력 방식을 선택해 주세요.',
    description: '',
    visibility: () => true,
  },
  {
    id: 'cashReserve',
    title: '남아있는 현금과 나이를 입력해 주세요.',
    description: '기본값 1억원과 현재 나이를 결과 상단 그래프와 자산 수준 해석에 반영합니다.',
    visibility: () => true,
  },
]