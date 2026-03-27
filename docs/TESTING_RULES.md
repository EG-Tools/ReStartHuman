# TESTING_RULES.md

This file explains the required verification commands and current automated test coverage.

## 1) Required commands after code changes
Run all of the following before calling work complete:
- `npm run build`
- `npm run lint`
- `npm test`

Even if the change looks UI-only, still run all three commands.
The project already uses tests to protect visibility rules and calculation regressions.

## 2) Test runner shape
Current tests use Node's built-in test runner through project scripts.
Relevant files:
- `scripts/prepare-node-tests.mjs`
- `scripts/run-node-tests.mjs`
- `tsconfig.test.json`

## 3) Current test files
### `tests/calculator.test.ts`
Covers:
- academy cost in detailed living-cost mode
- ignoring academy cost when there are no children
- simulation-years lower and upper behavior (1 and 80)

### `tests/calculator-costs.test.ts`
Covers:
- expense aggregation with rent, car cost, and loan interest
- loan-interest projection-year cutoff
- inflation effect on ending balance
- dependent health-insurance zero-premium case
- dependent health-insurance premium case above threshold
- earned-income handling vs salary
- manual health-insurance override

### `tests/result-helpers.test.ts`
Covers:
- living-cost snapshot academy inclusion
- academy-row visibility on the result table

### `tests/result-rows-visibility.test.ts`
Covers:
- total-income empty-state label
- vehicle row hidden/shown rules
- loan-interest row visibility
- loan-interest note clipping to simulation years
- other-income row visibility

### `tests/save-slots.test.ts`
Covers:
- slot-name normalization
- slot sorting
- invalid storage record rejection
- slot deletion

## 4) When tests must be updated
Update or add tests in the same task if you change:
- calculation logic
- result-row visibility
- quick recalc rules
- save-slot persistence or migration
- health-insurance interpretation
- loan or inflation projection behavior
- child/academy behavior

## 5) Good next candidates for more coverage
These are useful but not fully covered yet:
- owned home vs jeonse vs monthly-rent result differences
- comprehensive-tax ownership splits for couple cases
- ISA general vs working-class differences by person
- result-screen quick inline controls as interaction-level tests
- more save-slot migration scenarios if storage schema changes

## 6) Rule of thumb
If a user-facing number, hidden/shown row, or stored value changes because of your edit, add a test unless an equivalent test already covers that exact rule.
