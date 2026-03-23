# ReStartHuman 구조 메모

이 파일은 **현재 최종 디자인 상태에서 어디를 고쳐야 하는지** 빠르게 찾기 위한 짧은 메모입니다.

## 1) 파일별 책임

- `src/styles/base.css`
  - 질문 화면 공통 입력
  - `question-number-*` 보정
  - 질문 화면 작은 여백 유틸 클래스
- `src/styles/result-refinements.css`
  - 결과표 열 폭
  - 결과표 2열 입력 정렬
  - 비고열 정렬
  - 집값행 최종 디자인
- `src/components/question/QuestionScreen.tsx`
  - 질문 화면 구조
  - inline style 대신 class 사용
- `src/components/result/ResultScreen.tsx`
  - 결과표 DOM 구조
  - 집값행 전용 클래스 부여

## 2) 집값행 수정 규칙

집값행은 `HousingAmountEditor` + `result-refinements.css` 하단 블록만 봅니다.

- 구조/클래스: `HousingAmountEditor`
- 위치/간격/정렬: `result-refinements.css` 하단 `집값행 최종 디자인 전용 보정`

## 3) 질문 숫자입력 수정 규칙

질문 숫자입력은 `base.css`의 `question-number-*`만 수정합니다.

핵심 변수:
- `--question-number-inline-gap`
- `--question-number-suffix-offset`
- `--question-copy-note-gap`
- `--question-copy-note-tight-gap`

## 4) 앞으로의 원칙

1. 디자인 숫자는 CSS 변수 우선
2. 구조 클래스는 TSX에서만 관리
3. 예외 행은 전용 클래스 추가 후 수정
4. 범위 밖 파일은 건드리지 않기
