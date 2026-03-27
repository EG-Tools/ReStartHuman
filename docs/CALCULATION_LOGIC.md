# CALCULATION_LOGIC.md

This file summarizes how the current calculation pipeline works.
The main entry is `calculateAlphaScenario()` in `src/engine/calculator.ts`.

## 1) Source files by responsibility
- Main orchestration: `src/engine/calculator.ts`
- Expense, health-insurance, holding-tax, cash projection: `src/engine/calculator.costs.ts`
- Taxable dividend, ISA, comprehensive tax: `src/engine/calculator.income.ts`
- Shared math helpers and allocation helpers: `src/engine/calculator.shared.ts`
- Policy constants and disclaimer text: `src/config/policyConfig.ts`

## 2) High-level pipeline
1. Sanitize raw form data.
2. Convert dividend inputs into gross/net streams.
3. Split taxable and ISA dividends by owner.
4. Calculate ISA tax.
5. Calculate comprehensive tax for taxable-account dividends.
6. Calculate expenses.
7. Derive pension and other-income monthly inflow.
8. Estimate health insurance.
9. Estimate holding tax.
10. Compute monthly usable cash and surplus/deficit.
11. Build cash timeline for the chosen projection period.
12. Return a `AlphaResult` object.

## 3) Sanitization rules to remember
Defined in `sanitizeInput()` inside `src/engine/calculator.ts`.

Important current rules:
- `simulationYears` is clamped to `1..80`.
- `currentAge` is clamped to `>= 1`.
- monetary fields are normalized through `sanitizeMoney()`.
- `academyMonthly` is sanitized even when optional.
- ISA person-level types are forced to `general` or `workingClass`.

If a UI field looks editable but the engine ignores part of its range, check sanitization first.

## 4) Income-side logic
### Taxable-account dividends
Owner:
- `calculateTaxableStream()` in `src/engine/calculator.income.ts`

Behavior:
- If input mode is gross, net is gross minus 15.4% withholding.
- If input mode is net, gross may be grossed up when appropriate.

### ISA dividends
Owner:
- `calculateIsaTax()` in `src/engine/calculator.income.ts`

Behavior:
- The app applies person-level ISA types.
- General type uses the lower tax-free limit.
- Working-class type uses the higher tax-free limit.
- If dividend input mode is net, ISA tax is effectively skipped because input is already treated as final net annual value.

### Comprehensive tax
Owner:
- `calculateComprehensiveTax()` in `src/engine/calculator.income.ts`

Behavior:
- Threshold check is performed per person, not only on the household sum.
- Only taxable-account dividend ownership is used for this logic.
- The model uses a simplified comparison-tax method built from `policyConfig` brackets.

### Pension and other income
Owner:
- `calculateAlphaScenario()` in `src/engine/calculator.ts`

Behavior:
- `pensionMonthlyAmount` is applied directly as monthly inflow.
- `otherIncomeType === 'none'` yields `0`.
- `otherIncomeType === 'earned'` uses the larger of `otherIncomeMonthly` and `salaryMonthly`.
- Other income types use `otherIncomeMonthly` directly.

## 5) Expense-side logic
Owner:
- `calculateExpenses()` in `src/engine/calculator.costs.ts`

### Fixed expense bucket
Includes:
- `insuranceMonthly`
- `maintenanceMonthly`
- `telecomMonthly`
- `otherFixedMonthly`
- monthly-converted car cost (`carYearlyCost / 12`)

### Living expense bucket
- Total mode uses `livingCostMonthlyTotal`.
- Detailed mode adds food, necessities, dining out, hobby, academy, and other living cost.
- `academyMonthly` is included only when `hasChildren` is true.

### Housing monthly cost
- Only monthly rent adds direct monthly housing cost right now.
- Jeonse deposit and owned-home values affect assets and insurance/tax estimates, not direct monthly rent expense.

### Loan burden
- Loan input is monthly interest.
- It is added as a monthly expense.
- Projection logic limits its duration using `loanInterestYears`.

## 6) Health insurance logic
Owner:
- `estimateHealthInsurance()` in `src/engine/calculator.costs.ts`

Current model summary:
- Employee-like types use salary plus possible extra burden from non-salary income above threshold.
- Dependent can stay at `0` if annual non-salary income is below threshold.
- Regional-style cases combine income-side and property-side pressure.
- Property-side pressure uses housing plus additional property base.
- Manual override from `healthInsuranceOverrideMonthly` replaces the estimated value entirely.

## 7) Holding tax logic
Owner:
- `estimateHoldingTax()` in `src/engine/calculator.costs.ts`

Current model summary:
- Owned housing, land, and other property can each produce separate holding-tax items.
- Housing uses official value.
- Land uses an approximate assessed-value ratio.
- Single-home special tiers can lower fair-market ratio and rate schedule under the configured threshold.
- Joint ownership is simplified through owner-count splitting.
- The app currently does not include every real-world edge rule such as full comprehensive real-estate tax handling.

## 8) Cash projection logic
Owner:
- `calculateCashProjection()` in `src/engine/calculator.costs.ts`

Current model summary:
- Starts from `startingCashReserve`.
- Uses monthly inflow minus expenses, insurance, holding tax, and comprehensive-tax impact.
- Applies inflation only to the cost side when `inflationEnabled` is true.
- Applies loan interest only for the configured number of years.
- Generates `cashBalanceTimeline` from year 0 to final year.

## 9) Result values that the UI depends on heavily
When changing engine logic, check these result fields because the result screen uses them directly:
- `totalIncomeMonthly`
- `healthInsuranceMonthly`
- `holdingTaxAnnual`
- `holdingTaxBreakdown`
- `livingExpenseMonthly`
- `fixedExpenseMonthly`
- `carMonthlyConverted`
- `monthlyUsableCash`
- `monthlySurplusOrDeficit`
- `cashBalanceAfterTenYears`
- `cashBalanceTimeline`
- `riskLevel`

## 10) Important simplifications
- Loan modeling is interest-only from the user input perspective.
- Monthly-rent maintenance split is not actively modeled in the result logic.
- Several pension/ISA/history-related fields exist in types but are not central to active current calculations.
- The app intentionally favors a fast and understandable scenario estimate over full legal detail.

Read `KNOWN_LIMITATIONS_AND_LEGACY.md` before reusing a type field just because it exists.
