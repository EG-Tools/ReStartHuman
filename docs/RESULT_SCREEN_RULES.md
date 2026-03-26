# RESULT_SCREEN_RULES.md

This file explains how the result screen is assembled and what rules control row visibility.

## 1) Main owners
- Screen shell: `src/components/result/ResultScreen.tsx`
- Row construction: `src/components/result/resultScreen.editors.tsx`
- Table/sections rendering: `src/components/result/resultScreen.sections.tsx`
- Row helper logic and interpretation helpers: `src/components/result/resultScreen.helpers.ts`
- Quick inline controls and help drawer: `src/components/result/resultScreen.notices.tsx`
- Main table layout CSS: `src/styles/result-table-layout.css`
- Projection inline CSS: `src/styles/projection-inline.css`

## 2) Result screen philosophy
The result screen is designed to be editable, readable, and conservative about noise.

That means:
- important numbers can be edited in place
- optional rows are hidden when the user did not provide meaningful input
- long policy explanations are pushed into notes/help instead of always occupying a row
- some fields exist in `formData` but are intentionally not shown as first-class result rows

## 3) How rows are built
`buildResultRows()` in `src/components/result/resultScreen.editors.tsx` builds the table rows.

Inputs to that function include:
- `formData`
- `result`
- base fixed-expense helpers
- household/housing summary strings
- `onPatchFormData()` for in-table editing

A row contains:
- category
- item
- input display or editor
- monthly value
- annual value
- projection-period value
- note
- optional note detail

## 4) Row visibility rules to keep
### Hide optional rows when the input is absent
Current examples:
- car asset row only shows if car ownership and/or current car value make it meaningful
- car yearly cost row only shows when relevant
- other-income row shows only when the income type is not `none` and the applied value is meaningful
- academy row shows only when the household has children and academy cost is positive in detailed mode
- property rows show only when the corresponding value exists

This is intentional. Do not expand the table into a full raw-data dump unless the user explicitly asks for that design.

### Keep explanation in notes where possible
The table can stay compact if the extra explanation moves to:
- note text
- note detail
- help drawer

## 5) Housing row is a deliberate exception
The housing row is structurally special.
It can represent:
- owned home market/official values
- jeonse deposit behavior
- monthly-rent deposit and monthly cost behavior

Treat housing-row styling and structure as a local exception, not as the baseline for every row.

## 6) Living-cost rules
### `식비생활비` row
- Always represents the effective living-expense total.
- In total mode, it uses the single monthly total.
- In detailed mode, it uses the sum of the component fields.

### `학원비` row
- Shows only when children exist and academy cost is relevant.
- It is a visibility/helper row for explanation.
- The academy amount is already included in the detailed living-expense total.
- Do not double-count it in the engine just because it also appears as a separate row.

## 7) Vehicle rules
- `차량 시세` belongs to asset interpretation.
- `차량유지비` belongs to expense flow.
- Current design intentionally separates “car as property” from “car as ongoing cost”.

## 8) Loan rules
- `대출 이자` is shown when loan state is on, even if the monthly value is zero.
- Projection-period text is clipped to the shorter of:
  - `loanInterestYears`
  - `simulationYears`
- This is deliberate because the result table explains the effective projection, not only the raw input.

## 9) Quick inline recalc rules
Owner:
- `src/components/result/resultScreen.notices.tsx`

Current editable fields at the top:
- `currentAge`
- `simulationYears`
- `inflationRateAnnual` / `inflationEnabled`

Rules:
- Age is clamped to at least 1.
- Projection years are clamped to 1..80.
- Inflation input of 0 turns `inflationEnabled` off.
- Positive inflation input turns `inflationEnabled` on.

## 10) Result help drawer purpose
The help drawer currently consolidates:
- result-screen usage help
- result-table display rules
- policy/disclaimer text
- dividend tax explanation
- holding-tax / health-insurance explanation
- privacy/local-storage notice

Use it for explanations that should not permanently bloat the table.

## 11) Files to check when result behavior looks wrong
### If numbers look wrong
Check:
- `src/engine/calculator.ts`
- `src/engine/calculator.costs.ts`
- `src/engine/calculator.income.ts`

### If visibility looks wrong
Check:
- `src/components/result/resultScreen.editors.tsx`
- `src/components/result/resultScreen.helpers.ts`
- tests in `tests/result-helpers.test.ts` and `tests/result-rows-visibility.test.ts`

### If spacing/layout looks wrong
Check:
- `UI_LAYOUT_NOTES.md`
- `src/styles/result-table-layout.css`
- `src/styles/projection-inline.css`
