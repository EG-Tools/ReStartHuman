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
    title: '금융자산 규모를 입력해 주세요.',
    description: '배당 현금흐름을 보기 전에 자산 구성을 정리합니다.',
    visibility: () => true,
  },
  {
    id: 'dividends',
    title: '연간 배당금을 입력해 주세요.',
    description: '세전 또는 세후 입력을 고르고, 일반계좌와 ISA 배당 귀속도 함께 정합니다.',
    visibility: () => true,
  },
  {
    id: 'isa',
    title: 'ISA 조건을 선택해 주세요.',
    description: '잘 모르겠음은 명세서 기본 규칙으로 처리합니다.',
    visibility: () => true,
  },
  {
    id: 'income',
    title: '기타 소득을 입력해 주세요.',
    description: '배당 외에 추가 월소득이 있으면 종류와 금액을 반영합니다.',
    visibility: () => true,
  },
  {
    id: 'pension',
    title: '연금 수령 여부를 입력해 주세요.',
    description: '이미 수령 중인 월 연금만 우선 반영합니다.',
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
    description: '총액 한 번 입력 또는 세부 항목 입력 중에서 고를 수 있습니다.',
    visibility: () => true,
  },
  {
    id: 'cashReserve',
    title: '지금 남아있는 현금을 입력해 주세요.',
    description: '기본값 1억원을 시작점으로 10년 현금흐름 그래프에 반영합니다.',
    visibility: () => true,
  },
]



