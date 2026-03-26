# PRODUCT_OVERVIEW.md

## 1) What this tool is
ReStartHuman is a Korea-focused retirement cash-flow simulator.
It is meant to help a user roughly inspect retirement sustainability before deeper human consultation such as tax or financial planning.

It is not a fully authoritative tax engine.
It uses simplified public-policy-based rules for:
- dividend withholding
- ISA tax treatment
- financial income comprehensive tax threshold logic
- health insurance estimation
- holding tax estimation
- inflation-based cash projection

Policy text and current assumptions are centralized in `src/config/policyConfig.ts`.

## 2) Product philosophy
- The product favors readability over exhaustive disclosure.
- Inputs that are not relevant should stay hidden from the result table.
- The result table is not meant to dump every possible field.
- The app is designed for quick scenario iteration on a phone-sized layout.
- The result screen supports immediate recalculation without going back through all questions.

## 3) Current screen flow
### Start screen
File owner:
- `src/components/start/StartScreen.tsx`

Role:
- entry point
- start fresh
- open save slots

### Question flow
File owners:
- `src/data/questionFlow.ts`
- `src/hooks/useRetireCalcFlow.ts`
- `src/components/question/QuestionScreen.tsx`
- `src/components/question/questionScreen.sections.tsx`

Role:
- collect current age, household setup, housing, assets, dividend inputs, other income, health insurance type, fixed expenses, living costs, and cash reserve

### Result screen
File owners:
- `src/components/result/ResultScreen.tsx`
- `src/components/result/resultScreen.editors.tsx`
- `src/components/result/resultScreen.sections.tsx`
- `src/components/result/resultScreen.notices.tsx`

Role:
- chart and summary cards
- editable result table
- quick inline recalc for age / years / inflation
- save / share / restart

## 4) Core user journey
1. Start from default form state in `src/data/defaultFormData.ts`.
2. Move through visible question steps from `src/data/questionFlow.ts`.
3. Patch `formData` incrementally in `src/app/App.tsx`.
4. Compute `result` with `calculateRetireScenario()` in `src/engine/calculator.ts`.
5. Build result rows with `buildResultRows()` in `src/components/result/resultScreen.editors.tsx`.
6. Let the user tweak projection years, age, and inflation directly in the result screen.

## 5) Important product behavior
### Readability-first result table
The result table hides optional rows when their inputs are absent or zero.
Examples:
- vehicle rows
- loan-interest row
- other-income row
- academy-cost row
- property rows with no value

### Quick recalculation on the result screen
The top result row lets the user change:
- current age
- projection years
- inflation rate

Those values patch `formData` directly and trigger recalculation without returning to the question flow.

### Device-local storage notice
The app tells the user that data stays on the device and is not sent to a server.
The current notice text lives in `src/config/policyConfig.ts`.

## 6) Current non-goals
As of the current project state, the app is not trying to be:
- a full legal/tax compliance engine
- a complete pension-system simulator
- a loan amortization engine
- a full portfolio projection model
- a backend-synced account system

## 7) Key source files to read next
- Input shape: `src/types/retireCalc.ts`
- Default values: `src/data/defaultFormData.ts`
- Calculation logic: `CALCULATION_LOGIC.md`
- Result presentation rules: `RESULT_SCREEN_RULES.md`
