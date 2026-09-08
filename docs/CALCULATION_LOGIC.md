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
4. Calculate the ISA principal-withdrawal exhaustion year and one-time settlement estimate.
5. Derive pension and other-income monthly inflow and its simplified taxable base.
6. Calculate financial comprehensive-tax comparison amounts using that other-income base.
7. Calculate expenses.
8. Estimate health insurance.
9. Estimate holding tax.
10. Compute monthly usable cash and surplus/deficit.
11. Build cash timeline and category-level cumulative expenses for the chosen projection period.
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
- The configured tax-free limits are 2 million KRW for general accounts and 4 million KRW for working-class accounts.
- The entered ISA asset balance is used as a proxy for cumulative contributed principal.
- Annual ISA dividend withdrawals reduce that principal-withdrawal allowance.
- Settlement year is `ceil(ISA assets / annual ISA dividend)`.
- Gross-mode annual ISA dividend input is accumulated through the settlement year.
- The tax-free limit is applied once per owner at settlement, and 9.9% is applied to the excess.
- The entered ISA asset balance is transferred into cash in the settlement year, and ISA dividend cash flow stops afterward.
- If no ISA asset balance is entered, the selected simulation end is used as a fallback settlement point.
- Actual ISA tax is settled after gains and losses are offset. The current form has no separate loss input, so this remains an explicitly labeled closure estimate rather than an authoritative tax amount.

### Comprehensive tax
Owner:
- `calculateComprehensiveTax()` in `src/engine/calculator.income.ts`

Behavior:
- Threshold check is performed per person, not only on the household sum.
- Taxable-account dividends and projected deposit interest are combined per person.
- When a person's financial income exceeds 20 million KRW, the excess is combined with the modeled other comprehensive-income taxable base before the comparison-tax calculation.
- Other modeled taxable income is attributed to the primary user because the current form has no spouse-specific non-financial income fields.
- Result guidance and review levels reuse this per-person threshold result instead of comparing the household financial-income total again.
- The result keeps the base tax on other income in the income-tax row and reports only the incremental comparison-tax amount in the financial comprehensive-tax row, preventing double subtraction.
- Rental-income tax and private-pension tax remain separate simplified models.

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

An insurance payment duration of `0` means the payment has already ended, so it is excluded from the current monthly/annual expense, risk level, and projection.

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
- Salary-based premiums use the employee 50% share, while premiums on non-salary income above the threshold use the employee's full share.
- When a selected earned-income or corporate-executive stream reaches its configured end, its salary base also stops in the projection.
- After that employee-income period ends, estimated coverage automatically changes to `regional` for a single household or `bothRegional` for a couple.
- Dependent can stay at `0` if annual non-salary income is below threshold.
- Regional-style cases combine income-side and property-side pressure.
- Property-side pressure uses housing plus additional property base.
- After an automatic retirement transition, the effective regional coverage type is also used for property ownership, so spouse-only property is included when a couple changes to `bothRegional`.
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
- Returns category-level cumulative housing, fixed, living, academy, car, and loan expenses; the result table uses these same values instead of separate multiplication formulas.
- Applies loan interest only for the configured number of years.
- Generates `cashBalanceTimeline` from year 0 to final year.
- Recalculates cash interest, financial comprehensive tax, and health-insurance income every projection year using that year's balance.
- Tracks the first negative-balance year, minimum balance, and the cash shortfall needed to avoid interim depletion.
- Keeps ISA dividend cash flow active until the principal-withdrawal allowance is exhausted, then applies the one-time ISA settlement tax and asset transfer.

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
